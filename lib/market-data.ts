import type { Asset, AssetSymbol } from "@/lib/assets";

export type Quote = {
  symbol: AssetSymbol;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  trend: "up" | "down" | "flat" | null;
  live: boolean;
};

export type CalEvent = {
  id: string;
  time: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  currency: string;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
      };
    }>;
  };
};

type FfCalendarItem = {
  title: string;
  date: string;
  impact: string;
  country: string;
};

const YAHOO_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
const QUOTE_TIMEOUT_MS = 8000;

async function fetchQuote(symbol: AssetSymbol, name: string, yahoo: string): Promise<Quote> {
  const fallback: Quote = { symbol, name, price: null, change: null, changePct: null, trend: null, live: false };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUOTE_TIMEOUT_MS);

  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=1d&range=5d`, {
      headers: { "User-Agent": YAHOO_USER_AGENT },
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!res.ok) return fallback;

    const j = (await res.json()) as YahooChartResponse;
    const meta = j.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const prevClose = meta?.chartPreviousClose ?? meta?.previousClose;
    if (typeof price !== "number" || typeof prevClose !== "number") return fallback;

    const change = price - prevClose;
    const changePct = (change / prevClose) * 100;
    const trend: Quote["trend"] = changePct > 0.05 ? "up" : changePct < -0.05 ? "down" : "flat";
    return { symbol, name, price, change, changePct, trend, live: true };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetches a live quote for each given asset. Never throws: a per-asset failure degrades to a null/live:false quote. */
export async function fetchQuotes(assets: Asset[]): Promise<Quote[]> {
  return Promise.all(assets.map((asset) => fetchQuote(asset.symbol, asset.name, asset.yahoo)));
}

/** Fetches this week's high/medium-impact USD/EUR calendar events. Never throws: any failure returns []. */
export async function fetchCalendar(): Promise<CalEvent[]> {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];

    const items = (await res.json()) as FfCalendarItem[];
    if (!Array.isArray(items)) return [];

    return items
      .filter((item) => (item.impact === "High" || item.impact === "Medium") && (item.country === "USD" || item.country === "EUR"))
      .map((item): CalEvent => ({ id: `${item.title}|${item.date}`, time: item.date, title: item.title, impact: item.impact as CalEvent["impact"], currency: item.country }))
      .sort((a, b) => a.time.localeCompare(b.time));
  } catch {
    return [];
  }
}
