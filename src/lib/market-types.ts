/**
 * Shared Market Pulse types + pure display helpers.
 *
 * Importable from BOTH server and client code: this module is intentionally
 * dependency-free (no server-only import). The server engine lives in
 * src/lib/market.ts (`import "server-only"`) and re-exports the types below;
 * client components import them from here.
 */

export type MarketSource = "live" | "demo";

export interface MarketInstrument {
  /** Canonical symbol — fixed order: EURUSD, GBPUSD, XAUUSD, BTCUSD. */
  symbol: string;
  /** Display label, e.g. "EUR/USD". */
  label: string;
  price: number;
  /**
   * % change. Crypto: Binance 24h rolling percent. Forex: vs the previous
   * cached price (ECB fixings are delayed daily — no intraday percent).
   */
  changePct: number;
  /** Rolling series for sparklines (oldest → newest, ≤ 48 points). */
  history: number[];
}

export interface MarketSnapshot {
  source: MarketSource;
  updatedAt: string;
  instruments: MarketInstrument[];
}

/** GET /api/market response body. */
export interface ApiMarketResponse extends MarketSnapshot {
  ok: true;
  bias: string;
}

/** Decimal places used for display, per instrument. */
const DECIMALS: Record<string, number> = {
  EURUSD: 4,
  GBPUSD: 4,
  XAUUSD: 2,
  BTCUSD: 2,
};

const priceFormatters = new Map<number, Intl.NumberFormat>();

function getPriceFormatter(digits: number): Intl.NumberFormat {
  let fmt = priceFormatters.get(digits);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    priceFormatters.set(digits, fmt);
  }
  return fmt;
}

/** "75,830.71" / "1.1540" — deterministic en-US grouping (client display only). */
export function formatPrice(price: number, symbol: string): string {
  return getPriceFormatter(DECIMALS[symbol] ?? 2).format(price);
}

/** "+0.42%" / "-0.18%". */
export function formatPct(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}
