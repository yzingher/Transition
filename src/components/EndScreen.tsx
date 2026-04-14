"use client";

import { useState } from "react";
import { GameState, EndGameResponse } from "@/engine/types";
import TypedText from "./TypedText";
import CausalChain from "./CausalChain";
import MeterBar from "./MeterBar";

interface EndScreenProps {
  gameState: GameState;
  endGame: EndGameResponse;
  gameOverReason?: "stability" | "relevance" | null;
  onPlayAgain: () => void;
}

export default function EndScreen({
  gameState,
  endGame,
  gameOverReason,
  onPlayAgain,
}: EndScreenProps) {
  const [portraitDone, setPortraitDone] = useState(false);

  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
      {/* Game over banner */}
      {gameOverReason && (
        <div className="mb-6 p-4 rounded border border-danger/30 bg-danger/10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-danger mb-1">
            {gameOverReason === "stability" ? "Civil Unrest" : "Strategic Irrelevance"}
          </p>
          <p className="text-sm text-slate-300">
            {gameOverReason === "stability"
              ? "Stability collapsed. Mass unrest forced your removal from office."
              : "Your nation became strategically irrelevant — a client state in all but name."}
          </p>
        </div>
      )}

      {/* THE RECKONING header */}
      <div className="text-center mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-2">
          The Reckoning
        </p>
        <h2 className="text-xl text-amber-500 font-semibold italic leading-snug mb-1">
          &ldquo;{endGame.epithet}&rdquo;
        </h2>
        <p className="font-mono text-[10px] text-slate-400 mt-2">
          Turn {gameState.turn}/12 · {gameState.year}
        </p>
      </div>

      {/* Final meters */}
      <div className="mb-6 p-3 rounded border border-navy-500/30 bg-navy-700/20">
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-2">
          Final State
        </p>
        <div className="flex flex-col gap-1.5">
          <MeterBar label="Stability" value={gameState.meters.stability} dangerThreshold={15} />
          <MeterBar label="Relevance" value={gameState.meters.relevance} dangerThreshold={10} />
        </div>
      </div>

      {/* Derived stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <StatCard label="Inequality" value={endGame.derived_stats.inequality_trend} />
        <StatCard label="Talent" value={endGame.derived_stats.talent_flow} />
        <StatCard label="Fiscal" value={endGame.derived_stats.fiscal_sustainability} />
      </div>

      {/* Portrait */}
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">
          A Day in 2035
        </p>
        <TypedText
          text={endGame.portrait}
          speed={6}
          onComplete={() => setPortraitDone(true)}
          className="text-slate-100 text-[15px]"
        />
      </div>

      {portraitDone && (
        <div className="animate-[fadeIn_0.5s_ease-in]">
          {/* Perspectives */}
          <div className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">
              Voices
            </p>
            <div className="flex flex-col gap-3">
              {endGame.perspectives.map((p, i) => (
                <div
                  key={i}
                  className="p-3 rounded border border-navy-500/30 bg-navy-700/20"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500/70 mb-1">
                    {p.role}
                  </p>
                  <p className="text-sm text-slate-300 italic leading-relaxed">
                    &ldquo;{p.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Causal chain */}
          {gameState.decision_history.length > 0 && (
            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                Your Decisions
              </p>
              <CausalChain decisions={gameState.decision_history} />
            </div>
          )}

          {/* Play again */}
          <button
            onClick={onPlayAgain}
            className="btn-glow w-full py-3.5 rounded border border-amber-500/50 bg-amber-500/10
              text-amber-500 font-mono text-sm uppercase tracking-wider
              hover:bg-amber-500/20 active:scale-[0.98] transition-all mb-8"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded border border-navy-500/30 bg-navy-700/20 text-center">
      <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </p>
      <p className="text-xs text-slate-100 font-medium capitalize leading-tight">
        {value}
      </p>
    </div>
  );
}
