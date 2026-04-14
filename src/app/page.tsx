"use client";

import { useState, useCallback } from "react";
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

export default function Home() {
  const [screen, setScreen] = useState<Screen>("title");
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [endGame, setEndGame] = useState<EndGameResponse | null>(null);
  const [gameOverReason, setGameOverReason] = useState<"stability" | "relevance" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          // Go directly to end screen
          await fetchEndGame(newState, gameOver);
        } else {
          setScreen("consequence");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process decision");
      } finally {
        setIsLoading(false);
      }
    },
    [gameState, briefing]
  );

  // Fetch end game
  const fetchEndGame = async (
    state: GameState,
    reason: "stability" | "relevance" | null
  ) => {
    try {
      const prompt = buildEndGamePrompt(state);
      const endGameData = await generateEndGame(prompt);
      setEndGame(endGameData);
      setGameOverReason(reason);
      setScreen("end");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ending");
    }
  };

  // Advance to next turn
  const handleNextTurn = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const nextTurnNumber = gameState.turn + 1;

      // If we've finished turn 12, go to end
      if (nextTurnNumber > 12) {
        await fetchEndGame(gameState, null);
        setIsLoading(false);
        return;
      }

      const event = SCRIPTED_EVENTS[nextTurnNumber - 1];
      const newState: GameState = {
        ...gameState,
        turn: nextTurnNumber,
        year: event.year,
        phase: event.phase,
      };

      const prompt = buildBriefingPrompt(newState, event);
      const briefingData = await generateBriefing(prompt);

      // Apply resolved consequences
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

      {/* Loading overlay for initial load */}
      {isLoading && screen === "title" && (
        <div className="fixed inset-0 z-[70] bg-navy-900/90 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="font-mono text-xs text-slate-400">Preparing briefing...</p>
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
