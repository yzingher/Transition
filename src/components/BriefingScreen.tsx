"use client";

import { useState } from "react";
import { BriefingResponse } from "@/engine/types";
import TypedText from "./TypedText";
import DataBadge from "./DataBadge";

interface BriefingScreenProps {
  briefing: BriefingResponse;
  onDecision: (action: string) => void;
  isProcessing: boolean;
}

export default function BriefingScreen({
  briefing,
  onDecision,
  isProcessing,
}: BriefingScreenProps) {
  const [typingDone, setTypingDone] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customAction, setCustomAction] = useState("");

  const handleSubmit = () => {
    if (selectedOption) {
      const option = briefing.options.find((o) => o.id === selectedOption);
      if (option) {
        onDecision(
          `Option: "${option.label}" — ${option.description} (Estimated costs: ${option.estimated_costs.political_capital} political capital, ${option.estimated_costs.budget} budget)`
        );
      }
    } else if (customAction.trim()) {
      onDecision(`Custom action: ${customAction.trim()}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
      {/* Briefing narrative */}
      <div className="mb-5">
        <TypedText
          text={briefing.briefing.narrative}
          speed={8}
          onComplete={() => setTypingDone(true)}
          className="text-slate-100 text-[15px]"
        />
      </div>

      {/* Data points */}
      {typingDone && briefing.briefing.data_points.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5 animate-[fadeIn_0.3s_ease-in]">
          {briefing.briefing.data_points.map((dp, i) => (
            <DataBadge key={i} label={dp.label} value={dp.value} trend={dp.trend} />
          ))}
        </div>
      )}

      {/* Options */}
      {typingDone && (
        <div className="flex flex-col gap-2.5 mb-4 animate-[fadeIn_0.3s_ease-in]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
            Your options
          </p>
          {briefing.options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setSelectedOption(option.id);
                setCustomAction("");
              }}
              disabled={isProcessing}
              className={`text-left p-3.5 rounded border transition-all ${
                selectedOption === option.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-navy-500/50 bg-navy-700/30 hover:border-navy-500"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-mono text-xs text-amber-500 font-semibold uppercase">
                  {option.id}.
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  ⚡{option.estimated_costs.political_capital} £{option.estimated_costs.budget}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-100 mb-1">
                {option.label}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {option.description}
              </p>
            </button>
          ))}

          {/* Custom action */}
          {briefing.allows_custom_action && (
            <div className="mt-1">
              <textarea
                value={customAction}
                onChange={(e) => {
                  setCustomAction(e.target.value);
                  if (e.target.value.trim()) setSelectedOption(null);
                }}
                placeholder="Or type a custom action..."
                disabled={isProcessing}
                className="w-full p-3 rounded border border-navy-500/50 bg-navy-700/30
                  text-sm text-slate-100 placeholder-slate-400/50 resize-none
                  focus:outline-none focus:border-amber-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed"
                rows={2}
              />
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (!selectedOption && !customAction.trim())}
            className={`mt-2 w-full py-3.5 rounded font-mono text-sm uppercase tracking-wider transition-all
              ${
                isProcessing || (!selectedOption && !customAction.trim())
                  ? "border border-navy-500/30 bg-navy-700/20 text-slate-400/50 cursor-not-allowed"
                  : "btn-glow border border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 active:scale-[0.98]"
              }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              "Confirm Decision"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
