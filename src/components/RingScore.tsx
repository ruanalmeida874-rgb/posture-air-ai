// Animated activity-ring style score visual.
export function RingScore({
  value,
  size = 220,
  stroke = 16,
  label,
  sub,
  glow = true,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  glow?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  const color =
    pct >= 90 ? "var(--color-mint)" : pct >= 70 ? "var(--color-mint)" : pct >= 50 ? "var(--color-warn)" : "var(--color-danger)";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${glow ? "ring-glow rounded-full" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="grad-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-mint)" />
            <stop offset="100%" stopColor="var(--color-violet)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={pct >= 70 ? "url(#grad-ring)" : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold tracking-tight">{Math.round(pct)}</div>
        {label && <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{label}</div>}
        {sub && <div className="text-sm text-foreground/70 mt-2">{sub}</div>}
      </div>
    </div>
  );
}
