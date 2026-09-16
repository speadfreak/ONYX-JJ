import "server-only";

import type { MarketInstrument, MarketSnapshot, MarketSource } from "./market-types";

export type { MarketSnapshot, MarketInstrument, MarketSource } from "./market-types";

/**
 * Live Market Pulse — server-side fetch / cache / simulate engine.
 *
 * Data sources (verified working from this sandbox):
 *  - Binance 24h ticker (near-real-time):
 *      BTC/USD  → BTCUSDT
 *      XAU/USD  → PAXGUSDT — PAXG is a 1:1 gold-backed token, used as the
 *                 gold proxy (spot gold has no free keyless feed).
 *  - Frankfurter (ECB reference rates, delayed DAILY — fine per spec):
 *      EURUSD = rates.USD
 *      GBPUSD = rates.USD / rates.GBP
 *    Forex has no intraday percent, i.e. it is "live (daily)" data: changePct
 *    is computed against the previous cached price (or the seeded baseline on
 *    cold start). The UI only ever shows the coarse live/demo distinction.
 *
 * History: module-scope rolling series (~48 points) per instrument, seeded on
 * cold start with a deterministic synthetic random walk (mulberry32 PRNG,
 * fixed seed — never Math.random, so SSR/dev output is deterministic) that
 * ENDS at the first real price. Every successful refresh appends the latest
 * real price.
 *
 * Demo fallback: if ALL sources fail, the walk continues from the last known
 * prices (±0.05% per tick, mean-reverting toward the demo anchors) and the
 * snapshot is labeled source: "demo" — the "(demo data)" label in the UI is
 * mandatory in that state. Never fake-live.
 */

const CACHE_TTL_MS = 45_000;
const HISTORY_LIMIT = 48;
const SEED_POINTS = 40; // ~40 seeded points, last one = first real price
const FETCH_TIMEOUT_MS = 4_000;

const BINANCE_TICKER = "https://api.binance.com/api/v3/ticker/24hr?symbol=";
// Frankfurter .app 301s to api.frankfurter.dev — fetch follows automatically.
const FRANKFURTER_LATEST = "https://api.frankfurter.app/latest?from=EUR&to=USD,GBP";

/** Fixed demo anchors — realistic levels the demo walk mean-reverts toward. */
const INSTRUMENTS = [
  { symbol: "EURUSD", label: "EUR/USD", demoAnchor: 1.154 },
  { symbol: "GBPUSD", label: "GBP/USD", demoAnchor: 1.348 },
  { symbol: "XAUUSD", label: "XAU/USD", demoAnchor: 4290 },
  { symbol: "BTCUSD", label: "BTC/USD", demoAnchor: 75700 },
] as const;

const DEF_BY_SYMBOL: Record<string, (typeof INSTRUMENTS)[number]> = Object.fromEntries(
  INSTRUMENTS.map((d) => [d.symbol, d])
);

// ── Deterministic PRNG (mulberry32, fixed seed) ──────────────────────────

/** Fixed seed → identical synthetic history across SSR/dev restarts. */
const PRNG_SEED = 0x5eed;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic synthetic random walk generated BACKWARD in time from `end`
 * (so the series ends exactly at the first real price) while gently
 * mean-reverting toward `anchor`. ±0.06% per synthetic step.
 */
function seedWalk(rand: () => number, end: number, anchor: number): number[] {
  const pts: number[] = [end];
  let p = end;
  for (let i = 0; i < SEED_POINTS - 1; i++) {
    const pull = ((anchor - p) / anchor) * 0.04;
    const shock = (rand() - 0.5) * 0.0012;
    p = p / (1 + pull + shock);
    pts.push(p);
  }
  return pts.reverse();
}

// ── Engine state (module-scope, globalThis-pinned like lib/db.ts so dev
//    HMR re-evaluations don't wipe the cache/history) ─────────────────────

interface EngineState {
  source: MarketSource;
  updatedAt: string;
  snapshot: MarketSnapshot | null;
  fetchedAt: number;
  inflight: Promise<MarketSnapshot> | null;
  rand: () => number;
  history: Record<string, number[]>;
  lastPrice: Record<string, number | null>;
  /** Synthetic predecessor of the first real price — forex cold-start baseline. */
  baseline: Record<string, number | null>;
  changePct: Record<string, number>;
}

const globalForMarket = globalThis as unknown as { __jjMarketEngine?: EngineState };

function engine(): EngineState {
  if (!globalForMarket.__jjMarketEngine) {
    globalForMarket.__jjMarketEngine = {
      source: "demo", // only trusted after a successful live refresh flips it
      updatedAt: new Date(0).toISOString(),
      snapshot: null,
      fetchedAt: 0,
      inflight: null,
      rand: mulberry32(PRNG_SEED),
      history: {},
      lastPrice: {},
      baseline: {},
      changePct: {},
    };
  }
  return globalForMarket.__jjMarketEngine;
}

// ── Upstream fetches (all independent — one failing source never kills
//    the others) ───────────────────────────────────────────────────────────

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

interface BinanceTicker {
  lastPrice?: string;
  priceChangePercent?: string;
}

interface FrankfurterResponse {
  rates?: { USD?: number; GBP?: number };
}

function parseBinance(payload: unknown): { price: number; changePct: number | null } | null {
  const t = payload as BinanceTicker;
  const price = Number(t?.lastPrice);
  if (!Number.isFinite(price) || price <= 0) return null;
  const pct = Number(t?.priceChangePercent);
  return { price, changePct: Number.isFinite(pct) ? pct : null };
}

// ── Demo walk ────────────────────────────────────────────────────────────

/** Continue the walk from last known prices (±0.05%/tick, mean-reverting). */
function demoTick(st: EngineState): void {
  st.source = "demo";
  for (const def of INSTRUMENTS) {
    const anchor = def.demoAnchor;
    if (!st.history[def.symbol] || st.history[def.symbol].length === 0) {
      // Cold-start demo: seed the walk ending at the anchor itself.
      st.history[def.symbol] = seedWalk(st.rand, anchor, anchor);
      st.baseline[def.symbol] = st.history[def.symbol][st.history[def.symbol].length - 2] ?? anchor;
    }
    const series = st.history[def.symbol];
    const prev = st.lastPrice[def.symbol] ?? series[series.length - 1] ?? anchor;
    const pull = ((anchor - prev) / anchor) * 0.05; // gentle mean reversion
    const shock = (st.rand() - 0.5) * 0.001; // ±0.05% per tick
    const next = prev * (1 + pull + shock);
    series.push(next);
    if (series.length > HISTORY_LIMIT) series.splice(0, series.length - HISTORY_LIMIT);
    st.lastPrice[def.symbol] = next;
    st.changePct[def.symbol] = prev > 0 ? ((next - prev) / prev) * 100 : 0;
  }
}

// ── Refresh ──────────────────────────────────────────────────────────────

async function refresh(st: EngineState): Promise<void> {
  const [btc, gold, fx] = await Promise.allSettled([
    fetchJson(`${BINANCE_TICKER}BTCUSDT`),
    // PAXG ≈ 1 troy oz of gold (1:1 backed) → XAU/USD proxy.
    fetchJson(`${BINANCE_TICKER}PAXGUSDT`),
    fetchJson(FRANKFURTER_LATEST),
  ]);

  type Fresh = { symbol: string; price: number; changePct: number | null };
  const fresh: Fresh[] = [];

  if (btc.status === "fulfilled") {
    const parsed = parseBinance(btc.value);
    if (parsed) fresh.push({ symbol: "BTCUSD", ...parsed });
  }
  if (gold.status === "fulfilled") {
    const parsed = parseBinance(gold.value);
    if (parsed) fresh.push({ symbol: "XAUUSD", ...parsed });
  }
  if (fx.status === "fulfilled") {
    const rates = (fx.value as FrankfurterResponse)?.rates;
    if (rates && Number.isFinite(rates.USD)) {
      fresh.push({ symbol: "EURUSD", price: rates.USD as number, changePct: null });
      if (Number.isFinite(rates.GBP) && (rates.GBP as number) > 0) {
        fresh.push({
          symbol: "GBPUSD",
          price: (rates.USD as number) / (rates.GBP as number),
          changePct: null,
        });
      }
    }
  }

  st.updatedAt = new Date().toISOString();

  if (fresh.length === 0) {
    // ALL sources failed → demo mode (clearly labeled downstream).
    demoTick(st);
    return;
  }

  st.source = "live";

  for (const f of fresh) {
    const def = DEF_BY_SYMBOL[f.symbol];
    let series = st.history[f.symbol];
    if (!series || series.length === 0) {
      // Cold start: deterministic synthetic walk ENDING at the first real price.
      series = seedWalk(st.rand, f.price, def.demoAnchor);
      st.history[f.symbol] = series;
      st.baseline[f.symbol] = series[series.length - 2] ?? f.price;
    } else {
      series.push(f.price);
      if (series.length > HISTORY_LIMIT) series.splice(0, series.length - HISTORY_LIMIT);
    }

    if (f.changePct !== null) {
      // Crypto — Binance 24h rolling percent, used directly.
      st.changePct[f.symbol] = f.changePct;
    } else {
      // Forex — no intraday % from ECB ("live (daily)"): compare against the
      // previous cached price, or the seeded baseline on cold start.
      const ref = st.lastPrice[f.symbol] ?? st.baseline[f.symbol] ?? f.price;
      st.changePct[f.symbol] = ref > 0 ? ((f.price - ref) / ref) * 100 : 0;
    }
    st.lastPrice[f.symbol] = f.price;
  }

  // Sources that failed this round keep their last known state untouched
  // (no fabricated movement). An instrument that has NEVER had a real price
  // (partial cold-start failure) gets an anchor-seeded walk and swaps to
  // real data as soon as its own source recovers.
  for (const def of INSTRUMENTS) {
    if (!st.history[def.symbol]) {
      const seeded = seedWalk(st.rand, def.demoAnchor, def.demoAnchor);
      st.history[def.symbol] = seeded;
      st.baseline[def.symbol] = seeded[seeded.length - 2] ?? def.demoAnchor;
      st.lastPrice[def.symbol] = def.demoAnchor;
      st.changePct[def.symbol] = 0;
    }
  }
}

function buildSnapshot(st: EngineState): MarketSnapshot {
  return {
    source: st.source,
    updatedAt: st.updatedAt,
    instruments: INSTRUMENTS.map((def): MarketInstrument => {
      const series = st.history[def.symbol] ?? [];
      const price =
        st.lastPrice[def.symbol] ?? series[series.length - 1] ?? def.demoAnchor;
      return {
        symbol: def.symbol,
        label: def.label,
        price,
        changePct: st.changePct[def.symbol] ?? 0,
        history: [...series],
      };
    }),
  };
}

/**
 * Public reader — 45s in-memory cache; concurrent misses share one refresh
 * (in-flight de-dupe). Never rejects: upstream failures degrade to the
 * clearly-labeled demo walk instead of throwing.
 */
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const st = engine();
  const now = Date.now();
  if (st.snapshot && now - st.fetchedAt < CACHE_TTL_MS) return st.snapshot;

  if (!st.inflight) {
    const job = (async () => {
      try {
        await refresh(st);
      } catch (err) {
        // refresh() is already failure-isolated per source; this is a
        // last-resort net so the public endpoint can never 500.
        console.error("[market] refresh crashed — serving demo walk", err);
        demoTick(st);
      }
      st.snapshot = buildSnapshot(st);
      st.fetchedAt = Date.now();
      return st.snapshot;
    })();
    st.inflight = job.finally(() => {
      st.inflight = null;
    });
  }
  return st.inflight;
}

/** Last-resort static demo snapshot (used by the API route's catch-all). */
export function demoFallbackSnapshot(): MarketSnapshot {
  const rand = mulberry32(PRNG_SEED ^ 0x9e3779b9);
  return {
    source: "demo",
    updatedAt: new Date().toISOString(),
    instruments: INSTRUMENTS.map((def): MarketInstrument => {
      const history = seedWalk(rand, def.demoAnchor, def.demoAnchor);
      return {
        symbol: def.symbol,
        label: def.label,
        price: def.demoAnchor,
        changePct: 0,
        history,
      };
    }),
  };
}
