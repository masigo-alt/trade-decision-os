// Market catalog. Every entry is verified to have BOTH a live Yahoo price feed
// and a freely-embeddable, real-time TradingView chart symbol (OANDA CFD feeds
// for FX/metals/indices/energy; Coinbase for crypto). Only markets with
// available data belong here — the "Manage markets" search selects from this list.

export type AssetSymbol = string;

export type AssetGroup = "Metals" | "Indices" | "Energy" | "FX" | "Crypto";

export type Asset = {
  symbol: string;
  name: string;
  market: string;
  group: AssetGroup;
  yahoo: string;
  tvSymbol: string;
};

export const MARKET_CATALOG: Asset[] = [
  // Metals
  { symbol: "XAUUSD", name: "Gold", market: "Metals", group: "Metals", yahoo: "GC=F", tvSymbol: "OANDA:XAUUSD" },
  { symbol: "XAGUSD", name: "Silver", market: "Metals", group: "Metals", yahoo: "SI=F", tvSymbol: "OANDA:XAGUSD" },
  { symbol: "XPTUSD", name: "Platinum", market: "Metals", group: "Metals", yahoo: "PL=F", tvSymbol: "OANDA:XPTUSD" },
  // Equity indices
  { symbol: "NAS100", name: "Nasdaq 100", market: "Equity index", group: "Indices", yahoo: "^NDX", tvSymbol: "OANDA:NAS100USD" },
  { symbol: "SPX500", name: "S&P 500", market: "Equity index", group: "Indices", yahoo: "^GSPC", tvSymbol: "OANDA:SPX500USD" },
  { symbol: "US30", name: "Dow Jones 30", market: "Equity index", group: "Indices", yahoo: "^DJI", tvSymbol: "OANDA:US30USD" },
  { symbol: "GER40", name: "GER40", market: "Equity index", group: "Indices", yahoo: "^GDAXI", tvSymbol: "OANDA:DE30EUR" },
  { symbol: "UK100", name: "FTSE 100", market: "Equity index", group: "Indices", yahoo: "^FTSE", tvSymbol: "OANDA:UK100GBP" },
  { symbol: "JPN225", name: "Nikkei 225", market: "Equity index", group: "Indices", yahoo: "^N225", tvSymbol: "OANDA:JP225USD" },
  { symbol: "FRA40", name: "CAC 40", market: "Equity index", group: "Indices", yahoo: "^FCHI", tvSymbol: "OANDA:FR40EUR" },
  { symbol: "EU50", name: "Euro Stoxx 50", market: "Equity index", group: "Indices", yahoo: "^STOXX50E", tvSymbol: "OANDA:EU50EUR" },
  { symbol: "AUS200", name: "ASX 200", market: "Equity index", group: "Indices", yahoo: "^AXJO", tvSymbol: "OANDA:AU200AUD" },
  // Energy
  { symbol: "USOIL", name: "WTI Crude Oil", market: "Energy", group: "Energy", yahoo: "CL=F", tvSymbol: "OANDA:WTICOUSD" },
  { symbol: "UKOIL", name: "Brent Crude Oil", market: "Energy", group: "Energy", yahoo: "BZ=F", tvSymbol: "OANDA:BCOUSD" },
  { symbol: "NATGAS", name: "Natural Gas", market: "Energy", group: "Energy", yahoo: "NG=F", tvSymbol: "OANDA:NATGASUSD" },
  // FX majors
  { symbol: "EURUSD", name: "EUR / USD", market: "FX major", group: "FX", yahoo: "EURUSD=X", tvSymbol: "OANDA:EURUSD" },
  { symbol: "GBPUSD", name: "GBP / USD", market: "FX major", group: "FX", yahoo: "GBPUSD=X", tvSymbol: "OANDA:GBPUSD" },
  { symbol: "USDJPY", name: "USD / JPY", market: "FX major", group: "FX", yahoo: "USDJPY=X", tvSymbol: "OANDA:USDJPY" },
  { symbol: "AUDUSD", name: "AUD / USD", market: "FX major", group: "FX", yahoo: "AUDUSD=X", tvSymbol: "OANDA:AUDUSD" },
  { symbol: "USDCAD", name: "USD / CAD", market: "FX major", group: "FX", yahoo: "USDCAD=X", tvSymbol: "OANDA:USDCAD" },
  { symbol: "USDCHF", name: "USD / CHF", market: "FX major", group: "FX", yahoo: "USDCHF=X", tvSymbol: "OANDA:USDCHF" },
  { symbol: "NZDUSD", name: "NZD / USD", market: "FX major", group: "FX", yahoo: "NZDUSD=X", tvSymbol: "OANDA:NZDUSD" },
  // FX crosses
  { symbol: "EURGBP", name: "EUR / GBP", market: "FX cross", group: "FX", yahoo: "EURGBP=X", tvSymbol: "OANDA:EURGBP" },
  { symbol: "GBPJPY", name: "GBP / JPY", market: "FX cross", group: "FX", yahoo: "GBPJPY=X", tvSymbol: "OANDA:GBPJPY" },
  { symbol: "EURJPY", name: "EUR / JPY", market: "FX cross", group: "FX", yahoo: "EURJPY=X", tvSymbol: "OANDA:EURJPY" },
  // Crypto
  { symbol: "BTCUSD", name: "Bitcoin", market: "Crypto", group: "Crypto", yahoo: "BTC-USD", tvSymbol: "COINBASE:BTCUSD" },
  { symbol: "ETHUSD", name: "Ethereum", market: "Crypto", group: "Crypto", yahoo: "ETH-USD", tvSymbol: "COINBASE:ETHUSD" },
  { symbol: "SOLUSD", name: "Solana", market: "Crypto", group: "Crypto", yahoo: "SOL-USD", tvSymbol: "COINBASE:SOLUSD" },
];

// Lerato's preferred markets — the default watchlist and the set wired for journaling.
export const DEFAULT_SYMBOLS = ["XAUUSD", "NAS100", "GER40"];

// Kept for existing imports: the default markets.
export const ASSETS: Asset[] = MARKET_CATALOG.filter((asset) => DEFAULT_SYMBOLS.includes(asset.symbol));

export function getAsset(symbol: string): Asset | undefined {
  return MARKET_CATALOG.find((asset) => asset.symbol === symbol);
}

export function getAssets(symbols: string[]): Asset[] {
  return symbols.map((symbol) => getAsset(symbol)).filter((asset): asset is Asset => Boolean(asset));
}
