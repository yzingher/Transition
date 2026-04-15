"use client";

import { TriageCard } from "@/engine/types";
import TypedText from "./TypedText";
import { useState } from "react";

interface HumanMomentProps {
  card: TriageCard;
  onContinue: () => void;
}

export default function HumanMoment({ card, onContinue }: HumanMomentProps) {
  const [typingDone, setTypingDone] = useState(false);

  return (
    <div className="flex-1 flex flex-col rounded-lg border border-stone-800 bg-stone-950/80 p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500 text-center mb-4">
        — A moment —
      </p>

      <div className="flex-1 flex items-center justify-center px-2">
        <div className="text-stone-200 text-[16px] leading-relaxed italic text-center max-w-prose">
          <TypedText
            text={card.text}
            speed={12}
            onComplete={() => setTypingDone(true)}
            className="text-center"
          />
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!typingDone}
        className={`mt-5 py-3 rounded font-mono text-xs uppercase tracking-wider transition-all ${
          typingDone
            ? "border border-stone-700 text-stone-300 hover:bg-stone-800/40 active:scale-[0.98]"
            : "border border-stone-900 text-stone-600 cursor-not-allowed"
        }`}
      >
        {typingDone ? "Continue →" : "..."}
      </button>
    </div>
  );
}
