"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SYMBOLS, getAsset } from "@/lib/assets";

const STORAGE_KEY = "tdos.watchlist.v1";
const SYNC_EVENT = "tdos:watchlist";

function readSymbols(): string[] {
  if (typeof window === "undefined") return DEFAULT_SYMBOLS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SYMBOLS;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SYMBOLS;

    const valid = parsed.filter((s): s is string => typeof s === "string" && Boolean(getAsset(s)));
    return valid.length ? valid : DEFAULT_SYMBOLS;
  } catch {
    return DEFAULT_SYMBOLS;
  }
}

function persist(next: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export type Watchlist = {
  symbols: string[];
  add: (symbol: string) => void;
  remove: (symbol: string) => void;
  toggle: (symbol: string) => void;
  isActive: (symbol: string) => boolean;
  reset: () => void;
  ready: boolean;
};

/** Persisted watchlist of market symbols, synced across every hook instance via a 'tdos:watchlist' event and the native 'storage' event. */
export function useWatchlist(): Watchlist {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSymbols(readSymbols());
    setReady(true);

    function sync() {
      setSymbols(readSymbols());
    }

    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function add(symbol: string) {
    if (symbols.includes(symbol)) return;
    const next = [...symbols, symbol];
    persist(next);
    setSymbols(next);
  }

  function remove(symbol: string) {
    const next = symbols.filter((s) => s !== symbol);
    persist(next);
    setSymbols(next);
  }

  function toggle(symbol: string) {
    const next = symbols.includes(symbol) ? symbols.filter((s) => s !== symbol) : [...symbols, symbol];
    persist(next);
    setSymbols(next);
  }

  function isActive(symbol: string) {
    return symbols.includes(symbol);
  }

  function reset() {
    persist(DEFAULT_SYMBOLS);
    setSymbols(DEFAULT_SYMBOLS);
  }

  return { symbols, add, remove, toggle, isActive, reset, ready };
}
