"use client";

import { useState } from "react";
import {
  GameState,
  OutcomeArchetype,
  ReckoningResponse,
} from "@/engine/types";
import TypedText from "./TypedText";
import CausalChain from "./CausalChain";

interface ReckoningProps {
  state: GameState;
  outcome: OutcomeArchetype;
  reckoning: ReckoningResponse;
  onPlayAgain: () => void;
}

export default function Reckoning({
  state,
  outcome,
  reckoning,
  onPlayAgain,
}: ReckoningProps) {
  const [stage, setStage] = useState<
    "epithet" | "portrait" | "vignettes" | "chain" | "comparison"
  >("epithet");

  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
      {/* Epithet — shown first, fades in */}
      <div className="min-h-[40vh] flex flex-col items-center justify-center text-center mb-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-500 mb-3">
          The Reckoning
        </p>
        <p className="text-[20px] italic text-amber leading-snug mb-4">
          &ldquo;{reckoning.epithet}&rdquo;
        </p>
        <div className="flex items-baseline gap-3">
          <span className="font-condensed text-2xl uppercase tracking-wide text-stone-100">
            {outcome.name}
          </span>
        </div>
        <p className="text-xs text-stone-400 italic mt-1">{outcome.tagline}</p>

        {stage === "epithet" && (
          <button
            onClick={() => setStage("portrait")}
            className="mt-6 py-2.5 px-5 rounded border border-amber/50 bg-amber/10 text-amber font-mono text-[11px] uppercase tracking-wider hover:bg-amber/20 transition-all btn-glow"
          >
            Read the Portrait →
          </button>
        )}
      </div>

      {/* Portrait */}
      {stage !== "epithet" && (
        <section className="mb-6 animate-[fadeIn_0.5s_ease-in]">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-3">
            A Day in 2035
          </p>
          <TypedText
            text={reckoning.portrait}
            speed={5}
            className="text-stone-100 text-[15px]"
            onComplete={() => {
              if (stage === "portrait") setStage("vignettes");
            }}
          />
        </section>
      )}

      {/* Vignettes */}
      {(stage === "vignettes" || stage === "chain" || stage === "comparison") && (
        <section className="mb-6 animate-[fadeIn_0.5s_ease-in]">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-3">
            Three Lives
          </p>
          <div className="flex flex-col gap-3">
            {reckoning.vignettes.map((v, i) => (
              <div
                key={i}
                className="p-3 rounded border border-stone-700/60 bg-stone-900/40"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-amber/80 mb-1">
                  {v.role}
                </p>
                <p className="text-sm text-stone-300 italic leading-relaxed">
                  &ldquo;{v.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
          {stage === "vignettes" && (
            <button
              onClick={() => setStage("chain")}
              className="mt-4 w-full py-2.5 rounded border border-stone-700 text-stone-300 font-mono text-[11px] uppercase tracking-wider hover:bg-stone-800/40 transition-all"
            >
              The Chain →
            </button>
          )}
        </section>
      )}

      {/* Causal chain summary + timeline */}
      {(stage === "chain" || stage === "comparison") && (
        <section className="mb-6 animate-[fadeIn_0.5s_ease-in]">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-3">
            The Chain
          </p>
          <p className="text-sm text-stone-200 leading-relaxed italic mb-4 pl-3 border-l-2 border-amber/40">
            {reckoning.causalChainSummary}
          </p>
          <CausalChain decisions={state.decisionHistory} />
          {stage === "chain" && (
            <button
              onClick={() => setStage("comparison")}
              className="mt-4 w-full py-2.5 rounded border border-stone-700 text-stone-300 font-mono text-[11px] uppercase tracking-wider hover:bg-stone-800/40 transition-all"
            >
              Compare →
            </button>
          )}
        </section>
      )}

      {/* Comparison */}
      {stage === "comparison" && (
        <section className="mb-6 animate-[fadeIn_0.5s_ease-in]">
          <div className="p-4 rounded border border-stone-700/60 bg-stone-900/40">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-2">
              Rarity
            </p>
            <p className="text-sm text-stone-100 leading-relaxed mb-2">
              You built <span className="text-amber font-semibold">{outcome.name}</span>. Roughly{" "}
              <span className="text-amber tabular-nums">{outcome.rarityPercent}%</span> of players arrive
              here.
            </p>
            <p className="text-xs text-stone-400 italic">
              {outcome.definition}
            </p>
          </div>

          <button
            onClick={onPlayAgain}
            className="mt-6 w-full py-3.5 rounded border border-amber/50 bg-amber/15 text-amber font-mono text-xs uppercase tracking-wider hover:bg-amber/25 transition-all btn-glow"
          >
            Play Again
          </button>
          <p className="text-xs text-stone-500 italic text-center mt-3">
            What would you do differently?
          </p>
        </section>
      )}
    </div>
  );
}
