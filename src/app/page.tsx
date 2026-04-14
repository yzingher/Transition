"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  GameState,
  Screen,
  BriefingResponse,
  DecisionResponse,
  EndGameResponse,
} from "@/engine/types";
import { createInitialState } from "@/engine/initialState";
import { SCRIPTED_EVENTS } from "@/engine/scriptedEvents";
import {
  buildBriefingPrompt,
  buildDecisionPrompt,
  buildEndGamePrompt,
} from "@/engine/prompts";
import {
  applyEffects,
  resolveConsequences,
  addPendingConsequences,
  checkGameOver,
  applyPoliticalCapitalRegen,
} from "@/engine/lagEngine";
import { generateBriefing, generateDecision, generateEndGame } from "@/engine/api";

import TitleScreen from "@/components/TitleScreen";
import GameHeader from "@/components/GameHeader";
import BriefingScreen from "@/components/BriefingScreen";
import ConsequenceScreen from "@/components/ConsequenceScreen";
import EndScreen from "@/components/EndScreen";

const LOADING_MESSAGES = [
  "Analyzing geopolitical context…",
  "Consulting advisers…",
  "Drafting options…",
  "Polling the cabinet…",
  "Reviewing intelligence briefings…",
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("title");
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [endGame, setEndGame] = useState<EndGameResponse | null>(null);
  const [gameOverReason, setGameOverReason] = useState<"stability" | "relevance" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefetch state — filled while the user reads the consequence screen
  const prefetchedBriefingRef = useRef<{
    briefing: BriefingResponse;
    stateWithResolution: GameState;
  } | null>(null);
  const prefetchedEndGameRef = useRef<EndGameResponse | null>(null);

  // Rotating loading messages
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Start game → advance to turn 1 and fetch briefing
  const handleStart = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const newState: GameState = {
        ...createInitialState(),
        turn: 1,
        year: SCRIPTED_EVENTS[0].year,
        phase: SCRIPTED_EVENTS[0].phase,
      };
      setGameState(newState);

      const event = SCRIPTED_EVENTS[0];
      const prompt = buildBriefingPrompt(newState, event);
      const briefingData = await generateBriefing(prompt);

      // Apply resolved consequences if any
      let stateAfterResolution = newState;
      if (briefingData.resolved_consequences?.length > 0) {
        stateAfterResolution = resolveConsequences(
          newState,
          briefingData.resolved_consequences
        );
        setGameState(stateAfterResolution);
      }

      setBriefing(briefingData);
      setScreen("briefing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fire-and-forget prefetch of the next briefing. Runs while user reads consequence.
  const prefetchNextBriefing = useCallback((stateAfterDecision: GameState) => {
    const nextTurn = stateAfterDecision.turn + 1;
    if (nextTurn > 12) return;

    const nextEvent = SCRIPTED_EVENTS[nextTurn - 1];
    const nextState: GameState = {
      ...stateAfterDecision,
      turn: nextTurn,
      year: nextEvent.year,
      phase: nextEvent.phase,
    };
    const prompt = buildBriefingPrompt(nextState, nextEvent);

    generateBriefing(prompt)
      .then((briefingData) => {
        let stateWithResolution = nextState;
        if (briefingData.resolved_consequences?.length > 0) {
          stateWithResolution = resolveConsequences(
            nextState,
            briefingData.resolved_consequences
          );
        }
        prefetchedBriefingRef.current = {
          briefing: briefingData,
          stateWithResolution,
        };
      })
      .catch(() => {
        // Silently discard — handleNextTurn will fall back to live fetch
        prefetchedBriefingRef.current = null;
      });
  }, []);

  // Fire-and-forget prefetch of the end game (for the final turn).
  const prefetchEndGame = useCallback((finalState: GameState) => {
    const prompt = buildEndGamePrompt(finalState);
    generateEndGame(prompt)
      .then((data) => {
        prefetchedEndGameRef.current = data;
      })
      .catch(() => {
        prefetchedEndGameRef.current = null;
      });
  }, []);

  // Player submits a decision
  const handleDecision = useCallback(
    async (action: string) => {
      if (!briefing) return;
      setError(null);
      setIsLoading(true);
      try {
        const event = SCRIPTED_EVENTS[gameState.turn - 1];
        const prompt = buildDecisionPrompt(gameState, event, action);
        const decisionData = await generateDecision(prompt);

        // Apply immediate effects
        let newState = applyEffects(gameState, decisionData.immediate_effects);

        // Apply political capital regeneration
        newState = applyPoliticalCapitalRegen(
          newState,
          decisionData.political_capital_regen
        );

        // Add delayed consequences
        if (decisionData.delayed_consequences?.length > 0) {
          newState = addPendingConsequences(
            newState,
            decisionData.delayed_consequences,
            action,
            gameState.turn
          );
        }

        // Update world state
        newState = {
          ...newState,
          active_policies: [
            ...newState.active_policies,
            ...decisionData.new_policies,
          ],
          world_state: {
            ai_capability_level:
              decisionData.updated_world_state.ai_capability_level ||
              newState.world_state.ai_capability_level,
            key_events_occurred: [
              ...newState.world_state.key_events_occurred,
              ...decisionData.updated_world_state.new_events,
            ],
            geopolitical_notes:
              decisionData.updated_world_state.geopolitical_notes ||
              newState.world_state.geopolitical_notes,
          },
        };

        // Record decision
        const chosenLabel =
          briefing.options.find((o) =>
            action.includes(o.label)
          )?.label ?? "Custom Action";

        newState = {
          ...newState,
          decision_history: [
            ...newState.decision_history,
            {
              turn: gameState.turn,
              year: gameState.year,
              event_title: event.title,
              chosen_option: action,
              chosen_label: chosenLabel,
              narrative: decisionData.narrative,
              immediate_effects: decisionData.immediate_effects,
              delayed_count: decisionData.delayed_consequences?.length ?? 0,
            },
          ],
        };

        setGameState(newState);
        setDecision(decisionData);

        // Check game over
        const gameOver = checkGameOver(newState);
        if (gameOver) {
          setGameOverReason(gameOver);
          await fetchEndGame(newState, gameOver);
        } else {
          setScreen("consequence");
          // Fire the prefetch for the next turn's content while the user reads
          if (newState.turn >= 12) {
            prefetchEndGame(newState);
          } else {
            prefetchNextBriefing(newState);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process decision");
      } finally {
        setIsLoading(false);
      }
    },
    [gameState, briefing, prefetchNextBriefing, prefetchEndGame]
  );

  // Fetch end game (live — when prefetch missing or game-over fired mid-game)
  const fetchEndGame = async (
    state: GameState,
    reason: "stability" | "relevance" | null
  ) => {
    try {
      // Use prefetched end-game if we have one
      if (prefetchedEndGameRef.current) {
        setEndGame(prefetchedEndGameRef.current);
        prefetchedEndGameRef.current = null;
        setGameOverReason(reason);
        setScreen("end");
        return;
      }
      const prompt = buildEndGamePrompt(state);
      const endGameData = await generateEndGame(prompt);
      setEndGame(endGameData);
      setGameOverReason(reason);
      setScreen("end");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ending");
    }
  };

  // Advance to next turn — uses prefetched briefing if available
  const handleNextTurn = useCallback(async () => {
    setError(null);

    // Past turn 12 → end game
    const nextTurnNumber = gameState.turn + 1;
    if (nextTurnNumber > 12) {
      setIsLoading(true);
      await fetchEndGame(gameState, null);
      setIsLoading(false);
      return;
    }

    // Prefetch hit — instant transition
    if (prefetchedBriefingRef.current) {
      const { briefing: prefetched, stateWithResolution } =
        prefetchedBriefingRef.current;
      prefetchedBriefingRef.current = null;
      setGameState(stateWithResolution);
      setBriefing(prefetched);
      setDecision(null);
      setScreen("briefing");
      return;
    }

    // Prefetch miss — live fetch
    setIsLoading(true);
    try {
      const event = SCRIPTED_EVENTS[nextTurnNumber - 1];
      const newState: GameState = {
        ...gameState,
        turn: nextTurnNumber,
        year: event.year,
        phase: event.phase,
      };
      const prompt = buildBriefingPrompt(newState, event);
      const briefingData = await generateBriefing(prompt);

      let stateAfterResolution = newState;
      if (briefingData.resolved_consequences?.length > 0) {
        stateAfterResolution = resolveConsequences(
          newState,
          briefingData.resolved_consequences
        );
      }

      setGameState(stateAfterResolution);
      setBriefing(briefingData);
      setDecision(null);
      setScreen("briefing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to advance turn");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    prefetchedBriefingRef.current = null;
    prefetchedEndGameRef.current = null;
    setGameState(createInitialState());
    setBriefing(null);
    setDecision(null);
    setEndGame(null);
    setGameOverReason(null);
    setError(null);
    setScreen("title");
  }, []);

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="sticky top-0 z-[60] bg-danger/90 text-white text-xs px-4 py-2 text-center font-mono">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Loading overlay — full screen during first briefing and next-turn fallback */}
      {isLoading && (screen === "title" || screen === "briefing" || screen === "consequence") && (
        <div className="fixed inset-0 z-[70] bg-navy-900/90 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="font-mono text-xs text-slate-300 text-center transition-opacity duration-300">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </div>
        </div>
      )}

      {/* Title screen */}
      {screen === "title" && <TitleScreen onStart={handleStart} />}

      {/* Game screens with header */}
      {screen !== "title" && screen !== "end" && (
        <>
          <GameHeader
            turn={gameState.turn}
            year={gameState.year}
            phase={gameState.phase}
            stability={gameState.meters.stability}
            relevance={gameState.meters.relevance}
            political_capital={gameState.resources.political_capital}
            budget={gameState.resources.budget}
            talent={gameState.resources.talent}
          />

          {screen === "briefing" && briefing && (
            <BriefingScreen
              briefing={briefing}
              onDecision={handleDecision}
              isProcessing={isLoading}
            />
          )}

          {screen === "consequence" && decision && (
            <ConsequenceScreen decision={decision} onNextTurn={handleNextTurn} />
          )}
        </>
      )}

      {/* End screen */}
      {screen === "end" && endGame && (
        <EndScreen
          gameState={gameState}
          endGame={endGame}
          gameOverReason={gameOverReason}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
}
