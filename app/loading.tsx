export default function Loading() {
  return <main className="grid min-h-screen place-items-center bg-[#090b10] text-slate-100">
    <div role="status" className="text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-950/30">TD</div>
      <div className="mx-auto mt-5 h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
      <p className="mt-4 text-sm text-slate-500">Loading…</p>
    </div>
  </main>;
}
