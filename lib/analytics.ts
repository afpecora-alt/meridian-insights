import type { Deal } from "./types";

export const WON = "Closed Won";
export const LOST = "Closed Lost";
export const OPEN_STAGES = [
  "Prospecting",
  "Qualified",
  "Demo Scheduled",
  "Proposal Sent",
  "Negotiation",
];

export const isWon = (d: Deal) => d.deal_stage === WON;
export const isLost = (d: Deal) => d.deal_stage === LOST;
export const isOpen = (d: Deal) => !isWon(d) && !isLost(d);

const DAY = 86_400_000;
export const daysToClose = (d: Deal) =>
  Math.round((Date.parse(d.close_date) - Date.parse(d.created_date)) / DAY);

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const mean = (ns: number[]) => (ns.length ? sum(ns) / ns.length : 0);
const ratio = (a: number, b: number) => (b ? a / b : 0);

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

export function kpis(deals: Deal[]) {
  const won = deals.filter(isWon);
  const lost = deals.filter(isLost);
  const open = deals.filter(isOpen);
  return {
    wonRevenue: sum(won.map((d) => d.deal_value)),
    wonCount: won.length,
    lostCount: lost.length,
    winRate: ratio(won.length, won.length + lost.length),
    avgDeal: mean(won.map((d) => d.deal_value)),
    avgDaysToClose: mean(won.map(daysToClose)),
    openCount: open.length,
    openPipeline: sum(open.map((d) => d.deal_value)),
    weightedPipeline: sum(open.map((d) => (d.deal_value * d.probability_pct) / 100)),
  };
}

export type Grain = "month" | "quarter";
export type RevenuePoint = { key: string; label: string; revenue: number; deals: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Closed-won revenue by close date, with empty periods filled in. */
export function revenueSeries(deals: Deal[], grain: Grain): RevenuePoint[] {
  const won = deals.filter(isWon);
  if (won.length === 0) return [];

  const step = grain === "month" ? 1 : 3;
  // Period index = months since year 0, floored to the grain.
  const index = (iso: string) => {
    const months = Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
    return months - (months % step);
  };

  const totals = new Map<number, { revenue: number; deals: number }>();
  for (const d of won) {
    const i = index(d.close_date);
    const t = totals.get(i) ?? { revenue: 0, deals: 0 };
    t.revenue += d.deal_value;
    t.deals += 1;
    totals.set(i, t);
  }

  const keys = [...totals.keys()];
  const points: RevenuePoint[] = [];
  for (let i = Math.min(...keys); i <= Math.max(...keys); i += step) {
    const year = Math.floor(i / 12);
    const month = i % 12;
    const yy = String(year).slice(2);
    points.push({
      key: String(i),
      label: grain === "month" ? `${MONTHS[month]} '${yy}` : `Q${month / 3 + 1} '${yy}`,
      ...(totals.get(i) ?? { revenue: 0, deals: 0 }),
    });
  }
  return points;
}

export type RepStat = {
  rep: string;
  wonRevenue: number;
  won: number;
  lost: number;
  open: number;
  winRate: number;
  avgDays: number;
  openPipeline: number;
};

export function repStats(deals: Deal[]): RepStat[] {
  return [...groupBy(deals, (d) => d.rep_name)].map(([rep, ds]) => {
    const won = ds.filter(isWon);
    const lost = ds.filter(isLost);
    const open = ds.filter(isOpen);
    return {
      rep,
      wonRevenue: sum(won.map((d) => d.deal_value)),
      won: won.length,
      lost: lost.length,
      open: open.length,
      winRate: ratio(won.length, won.length + lost.length),
      avgDays: mean(won.map(daysToClose)),
      openPipeline: sum(open.map((d) => d.deal_value)),
    };
  });
}

const CLOSE_BUCKETS: [label: string, max: number][] = [
  ["≤30", 30],
  ["31–45", 45],
  ["46–60", 60],
  ["61–75", 75],
  ["76–90", 90],
  ["90+", Infinity],
];

/** Distribution of days from created to closed for won deals. */
export function closeTimeBuckets(deals: Deal[]) {
  const buckets = CLOSE_BUCKETS.map(([label]) => ({ label, deals: 0 }));
  for (const d of deals.filter(isWon)) {
    const n = daysToClose(d);
    buckets[CLOSE_BUCKETS.findIndex(([, max]) => n <= max)].deals += 1;
  }
  return buckets;
}

export function closeTimeBy(deals: Deal[], key: (d: Deal) => string) {
  return [...groupBy(deals.filter(isWon), key)]
    .map(([name, ds]) => ({ name, avgDays: mean(ds.map(daysToClose)), deals: ds.length }))
    .sort((a, b) => a.avgDays - b.avgDays);
}

export function pipelineStages(deals: Deal[]) {
  const groups = groupBy(deals.filter(isOpen), (d) => d.deal_stage);
  const extra = [...groups.keys()].filter((s) => !OPEN_STAGES.includes(s)).sort();
  return [...OPEN_STAGES, ...extra]
    .filter((stage) => groups.has(stage) || OPEN_STAGES.includes(stage))
    .map((stage) => {
      const ds = groups.get(stage) ?? [];
      return {
        stage,
        deals: ds.length,
        value: sum(ds.map((d) => d.deal_value)),
        weighted: sum(ds.map((d) => (d.deal_value * d.probability_pct) / 100)),
      };
    });
}

/** Closed-won revenue split by a dimension, largest first. */
export function revenueMix(deals: Deal[], key: (d: Deal) => string) {
  return [...groupBy(deals.filter(isWon), key)]
    .map(([name, ds]) => ({ name, value: sum(ds.map((d) => d.deal_value)), deals: ds.length }))
    .sort((a, b) => b.value - a.value);
}

export function competitorStats(deals: Deal[]) {
  const closed = deals.filter((d) => !isOpen(d));
  return [...groupBy(closed, (d) => d.competitor_mentioned || "None")]
    .map(([name, ds]) => {
      const won = ds.filter(isWon).length;
      return { name, won, lost: ds.length - won, winRate: ratio(won, ds.length) };
    })
    .sort((a, b) => b.winRate - a.winRate);
}

export type CustomerStatus = "Customer" | "In pipeline" | "Lost";
export type CustomerRow = {
  company: string;
  industry: string;
  reps: string;
  deals: number;
  wonRevenue: number;
  openPipeline: number;
  avgDays: number | null;
  lastActivity: number;
  status: CustomerStatus;
};

export function customerRows(deals: Deal[]): CustomerRow[] {
  return [...groupBy(deals, (d) => d.company_name)].map(([company, ds]) => {
    const won = ds.filter(isWon);
    const open = ds.filter(isOpen);
    return {
      company,
      industry: [...new Set(ds.map((d) => d.industry))].join(", "),
      reps: [...new Set(ds.map((d) => d.rep_name))].join(", "),
      deals: ds.length,
      wonRevenue: sum(won.map((d) => d.deal_value)),
      openPipeline: sum(open.map((d) => d.deal_value)),
      avgDays: won.length ? mean(won.map(daysToClose)) : null,
      lastActivity: Math.min(...ds.map((d) => d.last_activity_days_ago)),
      status: won.length ? "Customer" : open.length ? "In pipeline" : "Lost",
    };
  });
}
