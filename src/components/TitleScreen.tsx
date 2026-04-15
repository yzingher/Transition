"use client";

import { useState, useEffect } from "react";

interface TitleScreenProps {
  onStart: () => void;
  isLoading: boolean;
}

export default function TitleScreen({ onStart, isLoading }: TitleScreenProps) {
  const [visible, setVisible] = useState({ sub: false, btn: false, foot: false });

  useEffect(() => {
    const t1 = setTimeout(() => setVisible((v) => ({ ...v, sub: true })), 500);
    const t2 = setTimeout(() => setVisible((v) => ({ ...v, btn: true })), 1100);
    const t3 = setTimeout(() => setVisible((v) => ({ ...v, foot: true })), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-condensed text-4xl text-amber font-bold tracking-tight mb-2">
        THE TRANSITION
      </h1>
      <div className="h-px w-24 mx-auto bg-amber/40 mb-5" />

      <p
        className={`text-stone-300 text-[15px] leading-relaxed max-w-xs transition-opacity duration-700 ${
          visible.sub ? "opacity-100" : "opacity-0"
        }`}
      >
        It&apos;s 2024. You lead the UK&apos;s new AI & Economy Taskforce — a small
        team with a big mandate.
        <br />
        <br />
        <span className="text-stone-400">Five chapters. A decade of decisions. No right answers.</span>
      </p>

      <button
        onClick={onStart}
        disabled={isLoading}
        className={`btn-glow mt-8 px-8 py-3.5 border border-amber/60 bg-amber/10 text-amber
          font-mono text-sm uppercase tracking-[0.3em] rounded transition-all duration-500
          hover:bg-amber/20 hover:border-amber active:scale-[0.97]
          disabled:opacity-60 disabled:cursor-wait
          ${visible.btn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="inline-block w-3 h-3 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
            Preparing briefing…
          </span>
        ) : (
          "Begin"
        )}
      </button>

      <p
        className={`mt-10 text-stone-500 text-[11px] font-mono max-w-xs leading-relaxed transition-opacity duration-700 ${
          visible.foot ? "opacity-100" : "opacity-0"
        }`}
      >
        A single playthrough takes about an hour.
        <br />
        Every decision has consequences. Most arrive years later.
      </p>
    </div>
  );
}
