"use client";

import { useEffect, useState } from "react";
import { MARKET_CATALOG, type Asset } from "@/lib/assets";
import { useWatchlist } from "@/lib/watchlist";

const GROUP_ORDER: Asset["group"][] = ["Metals", "Indices", "Energy", "FX", "Crypto"];

export function ManageMarketsButton() {
  const [open, setOpen] = useState(false);

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-400/[0.06] hover:text-violet-200">Manage markets</button>
    {open && <ManageMarketsModal onClose={() => setOpen(false)} />}
  </>;
}

function ManageMarketsModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { symbols, add, remove, isActive } = useWatchlist();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const results = q ? MARKET_CATALOG.filter((asset) => asset.name.toLowerCase().includes(q) || asset.symbol.toLowerCase().includes(q)) : MARKET_CATALOG;

  return <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="manage-markets-title" className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="manage-markets-title" className="text-lg font-semibold text-white">Manage markets</h2>
          <p className="mt-1 text-xs text-slate-500">{symbols.length} selected</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white/5 hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Every market here has verified live price + real-time chart data.</p>

      <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or symbol…" className="mt-4 h-11 w-full rounded-xl border border-white/[0.09] bg-[#090c12] px-3.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:bg-[#0b0f17]" />

      <div className="mt-5 space-y-6">
        {GROUP_ORDER.map((group) => {
          const rows = results.filter((asset) => asset.group === group);
          if (rows.length === 0) return null;
          return <div key={group}>
            <p className="eyebrow text-slate-600">{group}</p>
            <div className="mt-2 divide-y divide-white/[0.06]">
              {rows.map((asset) => <MarketRow key={asset.symbol} asset={asset} active={isActive(asset.symbol)} onAdd={() => add(asset.symbol)} onRemove={() => remove(asset.symbol)} />)}
            </div>
          </div>;
        })}
        {results.length === 0 && <p className="py-10 text-center text-sm text-slate-600">No markets match “{query}”.</p>}
      </div>
    </div>
  </div>;
}

function MarketRow({ asset, active, onAdd, onRemove }: { asset: Asset; active: boolean; onAdd: () => void; onRemove: () => void }) {
  return <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-slate-200">{asset.name} <span className="text-slate-600">{asset.symbol}</span></p>
      <p className="mt-0.5 truncate text-xs text-slate-600">{asset.market}</p>
    </div>
    {active
      ? <button type="button" onClick={onRemove} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/15 hover:text-emerald-200">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M20 6 9 17l-5-5" /></svg>
          Added
        </button>
      : <button type="button" onClick={onAdd} className="inline-flex h-8 shrink-0 items-center rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-medium text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-400/[0.06] hover:text-violet-200">Add</button>}
  </div>;
}
