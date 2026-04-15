"use client";

import { useState } from "react";
import { GameState, TriageCard as TriageCardType, CardAction } from "@/engine/types";
import TriageCard from "./TriageCard";
import HumanMoment from "./HumanMoment";

interface CardStackProps {
  state: GameState;
  onCardAction: (card: TriageCardType, action: CardAction) => void;
}

export default function CardStack({ state, onCardAction }: CardStackProps) {
  const [exitDirection, setExitDirection] = useState<
    "left" | "right" | "down" | null
  >(null);
  const [animating, setAnimating] = useState(false);

  const card = state.currentCards[state.cardIndex];
  if (!card) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-mono text-sm">
        Preparing chapter close…
      </div>
    );
  }

  const total = state.currentCards.length;
  const progress = state.cardIndex + 1;

  const handleAction = (action: CardAction) => {
    if (animating) return;
    setAnimating(true);
    const dir = action === "approve" ? "right" : action === "reject" ? "left" : "down";
    setExitDirection(dir);
    setTimeout(() => {
      onCardAction(card, action);
      setExitDirection(null);
      setAnimating(false);
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col px-3 py-3">
      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">
          Triage
        </span>
        <span className="font-mono text-[10px] tabular-nums text-stone-400">
          {progress} / {total}
        </span>
      </div>
      <div className="h-0.5 w-full bg-stone-800 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-amber transition-all duration-300"
          style={{ width: `${(progress / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      {card.type === "human_moment" ? (
        <HumanMoment card={card} onContinue={() => handleAction("approve")} />
      ) : (
        <TriageCard
          card={card}
          resources={state.resources}
          onApprove={() => handleAction("approve")}
          onReject={() => handleAction("reject")}
          onDefer={() => handleAction("defer")}
          disabled={animating}
          exitDirection={exitDirection}
        />
      )}
    </div>
  );
}
