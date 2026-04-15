"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  GameState,
  TriageCard,
  CardAction,
  Decision,
  EvaluateChapterResponse,
  ReckoningResponse,
  OutcomeArchetype,
  StrategicOption,
  Effects,
} from "@/engine/types";
import { createInitialState } from "@/engine/initialState";
import {
  buildChapterStartPrompt,
  buildEvaluateChapterPrompt,
  buildReckoningPrompt,
} from "@/engine/prompts";
import {
  generateChapterStart,
  evaluateChapter,
  generateReckoning,
} from "@/engine/api";
import {
  applyEffects,
  payCost,
  enqueueConsequences,
  resolveConsequencesForChapter,
  checkCrisisFlags,
} from "@/engine/lagEngine";
import { cardPassesGate } from "@/engine/resourceLogic";
import { mapStateToOutcome } from "@/engine/outcomeMapper";

import TitleScreen from "@/components/TitleScreen";
import Meters from "@/components/Meters";
import ResourceBar from "@/components/ResourceBar";
import ResourceDashboard from "@/components/ResourceDashboard";
import CardStack from "@/components/CardStack";
import ChapterBreak from "@/components/ChapterBreak";
import Reckoning from "@/components/Reckoning";
import MeterDeltaToast from "@/components/MeterDeltaToast";
import { getChapter } from "@/data/chapters";

const LOADING_MESSAGES = [
  "Consulting advisers…",
  "Drafting the card deck…",
  "Polling the cabinet…",
  "Reviewing intelligence…",
  "Tallying consequences…",
  "Checking the timeline…",
];

export default function Home() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [pendingEvaluation, setPendingEvaluation] =
    useState<EvaluateChapterResponse | null>(null);
  const [reckoning, setReckoning] = useState<ReckoningResponse | null>(null);
  const [outcome, setOutcome] = useState<OutcomeArchetype | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [lastDelta, setLastDelta] = useState<Effects | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const chapterDecisionsRef = useRef<Decision[]>([]);

  // Rotating loading messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Start game → fetch Chapter 1
  const handleStart = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      let s = createInitialState();
      s = { ...s, phase: "triage", chapter: 1 };
      const prompt = buildChapterStartPrompt(s);
      const res = await generateChapterStart(prompt);

      // Apply resolved consequences (shouldn't be any at chapter 1 but handle)
      for (const rc of res.briefing.resolvedConsequences) {
        s = applyEffects(s, rc.effects);
        s = {
          ...s,
          resolvedConsequencesLog: [...s.resolvedConsequencesLog, rc],
        };
      }

      // Filter out cards that don't pass their gate
      const validCards = res.cards.filter((c) => cardPassesGate(s.resources, c.gate));

      s = {
        ...s,
        currentCards: validCards,
        cardIndex: 0,
        lastChapterBriefing: res.briefing.narrative,
        worldState: {
          ...s.worldState,
          ...res.updatedWorldState,
          economicIndicators: {
            ...s.worldState.economicIndicators,
            ...res.economicIndicators,
          },
        },
      };

      chapterDecisionsRef.current = [];
      setState(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle a triage card action
  const handleCardAction = useCallback(
    (card: TriageCard, action: CardAction) => {
      setState((prev) => {
        let s = prev;
        let applied: Effects = {};

        if (action === "approve") {
          // Pay cost
          s = payCost(s, card.cost);
          // Apply immediate effects
          s = applyEffects(s, card.immediateOnApprove);
          // Enqueue approve consequences
          s = enqueueConsequences(
            s,
            card.consequencesOnApprove,
            card.text.slice(0, 80),
            s.chapter
          );
          // Add any new policies
          if (card.addsPolicies && card.addsPolicies.length > 0) {
            s = {
              ...s,
              activePolicies: [...s.activePolicies, ...card.addsPolicies],
            };
          }
          applied = {
            ...Object.fromEntries(
              Object.entries(card.cost).map(([k, v]) => [k, -(v as number)])
            ),
            ...card.immediateOnApprove,
          };
        } else if (action === "reject") {
          s = enqueueConsequences(
            s,
            card.consequencesOnReject,
            "Rejected: " + card.text.slice(0, 80),
            s.chapter
          );
        } else if (action === "defer") {
          s = {
            ...s,
            deferredCards: [...s.deferredCards, card],
          };
        }

        // Check crisis flags after every action
        s = checkCrisisFlags(s);

        // Record decision (skip human_moment cards)
        if (card.type !== "human_moment") {
          const decision: Decision = {
            chapter: prev.chapter,
            cardId: card.id,
            cardText: card.text,
            from: card.from,
            action,
            effectsApplied: applied,
            policiesAdded: card.addsPolicies ?? [],
          };
          chapterDecisionsRef.current.push(decision);
          s = {
            ...s,
            decisionHistory: [...s.decisionHistory, decision],
          };
        }

        s = { ...s, cardIndex: s.cardIndex + 1 };
        return s;
      });
      // Flash delta toast (approx — based on applied above, but we don't capture it here without lifting)
      if (action === "approve") {
        const effs: Effects = {
          ...Object.fromEntries(
            Object.entries(card.cost).map(([k, v]) => [k, -(v as number)])
          ),
          ...card.immediateOnApprove,
        };
        setLastDelta(effs);
      }
    },
    []
  );

  // Detect chapter end (cardIndex reached currentCards length)
  useEffect(() => {
    if (
      state.phase === "triage" &&
      state.currentCards.length > 0 &&
      state.cardIndex >= state.currentCards.length
    ) {
      // Move into chapter break. Resolve consequences for this chapter (if any).
      void closeChapter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.cardIndex, state.currentCards.length]);

  // Close the current chapter: resolve consequences, call evaluate, show break
  const closeChapter = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Resolve consequences targeted at this chapter (narrative on close)
      // Note: most consequences target *future* chapters; this just sweeps anything scheduled here.
      let s = state;
      const { state: afterResolve } = resolveConsequencesForChapter(
        s,
        s.chapter
      );
      s = afterResolve;

      const prompt = buildEvaluateChapterPrompt(s, chapterDecisionsRef.current);
      const evaluation = await evaluateChapter(prompt);

      // Apply evaluation's resolvedConsequences as additional effects (in case evaluate surfaces more)
      for (const rc of evaluation.resolvedConsequences) {
        s = applyEffects(s, rc.effects);
      }

      // Update economic indicators from evaluation
      s = {
        ...s,
        worldState: {
          ...s.worldState,
          economicIndicators: evaluation.economicIndicators,
        },
        phase: "chapter_break",
        resolvedConsequencesLog: [
          ...s.resolvedConsequencesLog,
          ...evaluation.resolvedConsequences,
        ],
      };

      setState(s);
      setPendingEvaluation(evaluation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to close chapter"
      );
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  // After chapter break, select direction and advance to next chapter (or reckoning if this was chapter 5)
  const handleSelectDirection = useCallback(
    async (option: StrategicOption) => {
      setError(null);
      setIsLoading(true);
      try {
        // If this was chapter 5, skip to reckoning — but actually chapter 5 has no break per PRD
        if (state.chapter >= 5) {
          await goToReckoning(state);
          return;
        }

        const nextChapterNum = (state.chapter + 1) as 1 | 2 | 3 | 4 | 5;
        let s: GameState = {
          ...state,
          chapter: nextChapterNum,
          strategicDirection: option.label,
          phase: "triage",
          currentCards: [],
          cardIndex: 0,
        };

        // Resolve any consequences targeting this new chapter BEFORE generating cards,
        // so the LLM sees the post-resolution state
        const { state: afterResolve } = resolveConsequencesForChapter(
          s,
          nextChapterNum
        );
        s = afterResolve;

        const prompt = buildChapterStartPrompt(s);
        const res = await generateChapterStart(prompt);

        for (const rc of res.briefing.resolvedConsequences) {
          // These should usually be empty since we already resolved above, but handle defensively
          s = applyEffects(s, rc.effects);
        }

        const validCards = res.cards.filter((c) => cardPassesGate(s.resources, c.gate));

        s = {
          ...s,
          currentCards: validCards,
          cardIndex: 0,
          lastChapterBriefing: res.briefing.narrative,
          deferredCards: [], // cleared — they've been re-surfaced by the LLM
          worldState: {
            ...s.worldState,
            ...res.updatedWorldState,
            economicIndicators: {
              ...s.worldState.economicIndicators,
              ...res.economicIndicators,
            },
          },
        };
        s = checkCrisisFlags(s);

        chapterDecisionsRef.current = [];
        setPendingEvaluation(null);
        setState(s);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start next chapter"
        );
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  // Go to reckoning
  const goToReckoning = useCallback(
    async (finalState: GameState) => {
      try {
        const archetype = mapStateToOutcome(finalState);
        setOutcome(archetype);
        const prompt = buildReckoningPrompt(finalState, archetype);
        const res = await generateReckoning(prompt);
        setReckoning(res);
        setState({ ...finalState, phase: "reckoning" });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate reckoning"
        );
      }
    },
    []
  );

  // If chapter 5 triage finishes, go straight to reckoning
  useEffect(() => {
    if (
      state.chapter === 5 &&
      state.phase === "triage" &&
      state.currentCards.length > 0 &&
      state.cardIndex >= state.currentCards.length
    ) {
      // Override — skip chapter_break, go to reckoning
      setIsLoading(true);
      goToReckoning(state).finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.chapter, state.cardIndex, state.currentCards.length]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    setState(createInitialState());
    setPendingEvaluation(null);
    setReckoning(null);
    setOutcome(null);
    setError(null);
    chapterDecisionsRef.current = [];
  }, []);

  // ── Render ──

  const showTitle = state.phase === "title";
  const showTriage = state.phase === "triage" && state.currentCards.length > 0;
  const showChapterBreak =
    state.phase === "chapter_break" && pendingEvaluation !== null;
  const showReckoning =
    state.phase === "reckoning" && reckoning !== null && outcome !== null;

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="sticky top-0 z-[90] bg-red-600/90 text-white text-xs px-4 py-2 text-center font-mono">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Title */}
      {showTitle && (
        <TitleScreen onStart={handleStart} isLoading={isLoading} />
      )}

      {/* Game header (visible during triage and break) */}
      {(state.phase === "triage" || state.phase === "chapter_break") && (
        <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800/60 px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-amber font-semibold uppercase tracking-widest">
                Ch {state.chapter}/5
              </span>
              <span className="font-mono text-[10px] text-stone-500">
                {getChapter(state.chapter).years}
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">
              {getChapter(state.chapter).title}
            </span>
          </div>
          <Meters meters={state.meters} />
          <div className="mt-2">
            <ResourceBar
              resources={state.resources}
              onOpen={() => setDashboardOpen(true)}
            />
          </div>
        </header>
      )}

      {/* Triage */}
      {showTriage && (
        <CardStack state={state} onCardAction={handleCardAction} />
      )}

      {/* Chapter break */}
      {showChapterBreak && (
        <ChapterBreak
          chapter={state.chapter}
          nextChapter={state.chapter + 1}
          evaluation={pendingEvaluation}
          onSelectDirection={handleSelectDirection}
        />
      )}

      {/* Reckoning */}
      {showReckoning && (
        <Reckoning
          state={state}
          outcome={outcome}
          reckoning={reckoning}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Dashboard overlay */}
      {dashboardOpen && (
        <ResourceDashboard
          state={state}
          onClose={() => setDashboardOpen(false)}
        />
      )}

      {/* Meter delta toast */}
      <MeterDeltaToast effects={lastDelta} />

      {/* Full-screen loading overlay between phases (never during triage) */}
      {isLoading && state.phase !== "title" && state.phase !== "triage" && (
        <div className="fixed inset-0 z-[85] bg-stone-950/92 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
            <p className="font-mono text-[11px] text-stone-300 text-center">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>
        </div>
      )}

      {/* Full-screen loading overlay at triage boundary (generating chapter) */}
      {isLoading &&
        state.phase === "triage" &&
        state.currentCards.length === 0 && (
          <div className="fixed inset-0 z-[85] bg-stone-950/92 backdrop-blur-sm flex items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
              <p className="font-mono text-[11px] text-stone-300 text-center">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </p>
            </div>
          </div>
        )}
    </>
  );
}
