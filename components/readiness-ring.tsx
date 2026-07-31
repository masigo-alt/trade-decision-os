export function ReadinessRing({ score, size = 56, subtitle }: { score: number | null; size?: number; subtitle?: string }) {
  const border = Math.max(3, Math.round((size / 56) * 5));
  const fontSize = Math.max(11, Math.round((size / 56) * 14));

  return <div className="inline-flex flex-col items-center gap-2">
    <div
      className={`grid shrink-0 place-items-center rounded-full font-bold ${score === null ? "border-white/10 bg-white/[0.03] text-slate-500" : "border-emerald-400/80 bg-emerald-400/[0.06] text-emerald-200"}`}
      style={{ width: size, height: size, borderWidth: border, borderStyle: "solid", fontSize }}
    >
      {score === null ? "—" : Math.round(score)}
    </div>
    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
  </div>;
}
