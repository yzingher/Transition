"use client";

import { useState, useEffect } from "react";

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSubtitle(true), 800);
    const t2 = setTimeout(() => setShowButton(true), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <h1 className="font-mono text-amber-500 text-4xl font-bold tracking-tight mb-1">
          THE TRANSITION
        </h1>
        <div className="h-px w-32 mx-auto bg-amber-500/30 mb-4" />
        <p
          className={`text-slate-300 text-lg leading-relaxed transition-opacity duration-1000 ${
            showSubtitle ? "opacity-100" : "opacity-0"
          }`}
        >
          AI is transforming the world.
          <br />
          You lead the taskforce.
          <br />
          <span className="text-slate-400 text-base">12 turns. 2024–2035.</span>
        </p>
      </div>

      <button
        onClick={onStart}
        className={`btn-glow px-8 py-3.5 border border-amber-500/50 bg-amber-500/10 text-amber-500
          font-mono text-sm uppercase tracking-widest rounded transition-all duration-500
          hover:bg-amber-500/20 hover:border-amber-500 active:scale-95
          ${showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        Begin
      </button>

      <p
        className={`mt-12 text-slate-400/60 text-xs font-mono max-w-xs transition-opacity duration-1000 ${
          showButton ? "opacity-100" : "opacity-0"
        }`}
      >
        Every decision has consequences. Some you&apos;ll see immediately. Others
        won&apos;t surface for years.
      </p>
    </div>
  );
}
