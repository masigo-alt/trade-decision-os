import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/market-data";
import { ASSETS, getAssets } from "@/lib/assets";

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("symbols");
  const symbols = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const list = symbols.length ? getAssets(symbols) : ASSETS;
  const assets = list.length ? list : ASSETS;

  const quotes = await fetchQuotes(assets);
  return NextResponse.json({ asOf: new Date().toISOString(), live: quotes.some((q) => q.live), quotes });
}
