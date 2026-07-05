export function UnverifiedBadge({ label = "unverified seed" }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
      style={{ color: "var(--unverified)", background: "var(--unverified-bg)" }}
      title="Illustrative value pending Phase 0 verification. The CI chain check blocks publication of anything resting on this."
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M5 1 L9 8 H1 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      {label}
    </span>
  );
}
