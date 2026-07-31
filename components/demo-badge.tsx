export function DemoBadge({ label = "Demo" }: { label?: string }) {
  return <span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium text-amber-100">{label}</span>;
}
