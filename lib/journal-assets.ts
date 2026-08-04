"use client";

import { useEffect, useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { MARKET_CATALOG } from "@/lib/assets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWatchlist } from "@/lib/watchlist";

export type JournalAsset = Pick<
  Database["public"]["Tables"]["assets"]["Row"],
  "id" | "symbol" | "name" | "market"
>;

const fallbackAssets: JournalAsset[] = MARKET_CATALOG.map((asset) => ({
  id: asset.symbol,
  symbol: asset.symbol,
  name: asset.name,
  market: asset.market,
}));

const catalogOrder = new Map(MARKET_CATALOG.map((asset, index) => [asset.symbol, index]));

export function assetOptionLabel(asset: Pick<JournalAsset, "name" | "symbol">) {
  return asset.name.includes(asset.symbol) ? asset.name : `${asset.name} · ${asset.symbol}`;
}

export function useJournalAssets() {
  const { symbols: watchlistSymbols } = useWatchlist();
  const [assets, setAssets] = useState<JournalAsset[]>(fallbackAssets);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    let active = true;

    async function loadAssets() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("assets")
          .select("id,symbol,name,market")
          .eq("is_active", true);

        if (error) throw error;
        if (!active) return;
        setAssets((data ?? []).sort((a, b) => (catalogOrder.get(a.symbol) ?? 999) - (catalogOrder.get(b.symbol) ?? 999)));
        setStatus("ready");
      } catch {
        if (active) setStatus("fallback");
      }
    }

    loadAssets();
    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
    const bySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));
    const watchlistAssets = watchlistSymbols.map((symbol) => bySymbol.get(symbol)).filter((asset): asset is JournalAsset => Boolean(asset));
    const watchlistSet = new Set(watchlistSymbols);
    const otherAssets = assets.filter((asset) => !watchlistSet.has(asset.symbol));
    return { watchlistAssets, otherAssets, status };
  }, [assets, status, watchlistSymbols]);
}
