"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  closeTimeBuckets,
  closeTimeBy,
  competitorStats,
  kpis,
  pipelineStages,
  repStats,
  revenueMix,
  revenueSeries,
  type Grain,
} from "@/lib/analytics";
import { days, money, moneyCompact, pct } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { CustomersTable } from "./CustomersTable";
import { BarRow, Card, Segmented } from "./ui";

const SERIES = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-3)",
  "var(--color-series-4)",
  "var(--color-series-5)",
];
const OTHER = "#5a5a63";
const AXIS = { fill: "#7c7c85", fontSize: 11 };
const GRID = "rgb(255 255 255 / 0.06)";
const CURSOR = { fill: "rgb(255 255 255 / 0.05)" };

export function Dashboard({ deals }: { deals: Deal[] }) {
  return (
    <div className="space-y-4">
      <KpiRow deals={deals} />
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueCard deals={deals} />
        <RepsCard deals={deals} />
        <CloseTimeCard deals={deals} />
        <PipelineCard deals={deals} />
        <MixCard deals={deals} />
        <CompetitorCard deals={deals} />
      </div>
      <CustomersTable deals={deals} />
    </div>
  );
}

function KpiRow({ deals }: { deals: Deal[] }) {
  const k = useMemo(() => kpis(deals), [deals]);
  const tiles = [
    ["Won revenue", moneyCompact(k.wonRevenue), `${k.wonCount} deals closed`],
    ["Win rate", pct(k.winRate), `${k.wonCount} won · ${k.lostCount} lost`],
    ["Avg deal size", moneyCompact(k.avgDeal), "closed-won deals"],
    ["Avg time to close", `${Math.round(k.avgDaysToClose)} days`, "created to closed-won"],
    ["Open pipeline", moneyCompact(k.openPipeline), `${moneyCompact(k.weightedPipeline)} weighted · ${k.openCount} deals`],
  ];
  return (
    <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {tiles.map(([label, value, note]) => (
        <div key={label} className="rounded-3xl border border-line bg-card px-5 py-4">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="tabular mt-1.5 text-2xl font-medium tracking-tight">{value}</dd>
          <dd className="mt-1 truncate text-xs text-muted">{note}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChartTooltip({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-line bg-raised px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-ink">{title}</p>
      {rows.map(([label, value]) => (
        <p key={label} className="tabular mt-0.5 flex justify-between gap-4 text-soft">
          <span>{label}</span>
          <span className="text-ink">{value}</span>
        </p>
      ))}
    </div>
  );
}

function RevenueCard({ deals }: { deals: Deal[] }) {
  const [grain, setGrain] = useState<Grain>("month");
  const series = useMemo(() => revenueSeries(deals, grain), [deals, grain]);
  const total = series.reduce((a, p) => a + p.revenue, 0);
  const best = series.reduce((a, p) => (p.revenue > a.revenue ? p : a), series[0]);

  return (
    <Card
      title="Revenue over time"
      subtitle="Closed-won revenue by close date"
      action={
        <Segmented
          label="Period"
          value={grain}
          onChange={setGrain}
          options={[["month", "Monthly"], ["quarter", "Quarterly"]] as const}
        />
      }
    >
      <p className="tabular mt-4 text-3xl font-medium tracking-tight">{money(total)}</p>
      {best && (
        <p className="mt-1 text-xs text-muted">
          Best {grain}: {best.label} at {moneyCompact(best.revenue)}
        </p>
      )}
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} minTickGap={12} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={48} tickFormatter={moneyCompact} />
            <Tooltip
              cursor={CURSOR}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload;
                if (!active || !p) return null;
                return <ChartTooltip title={p.label} rows={[["Revenue", money(p.revenue)], ["Deals", String(p.deals)]]} />;
              }}
            />
            <Bar dataKey="revenue" fill={SERIES[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

type RepSort = "revenue" | "winRate" | "speed";

function RepsCard({ deals }: { deals: Deal[] }) {
  const [sort, setSort] = useState<RepSort>("revenue");
  const reps = useMemo(() => repStats(deals), [deals]);

  const rows = useMemo(() => {
    const sorted = [...reps];
    if (sort === "revenue") sorted.sort((a, b) => b.wonRevenue - a.wonRevenue);
    if (sort === "winRate") sorted.sort((a, b) => b.winRate - a.winRate || b.won - a.won);
    // Fastest first; reps with no wins have no close time and go last.
    if (sort === "speed") sorted.sort((a, b) => (a.won ? a.avgDays : Infinity) - (b.won ? b.avgDays : Infinity));
    return sorted;
  }, [reps, sort]);

  const maxRevenue = Math.max(1, ...reps.map((r) => r.wonRevenue));
  const maxDays = Math.max(1, ...reps.map((r) => r.avgDays));

  return (
    <Card
      title="Sales rep performance"
      subtitle={`${reps.length} reps, ranked`}
      action={
        <Segmented
          label="Rank by"
          value={sort}
          onChange={setSort}
          options={[["revenue", "Revenue"], ["winRate", "Win rate"], ["speed", "Time to close"]] as const}
        />
      }
    >
      <ol className="mt-4 max-h-[21.5rem] space-y-3.5 overflow-y-auto pr-2">
        {rows.map((r, i) => (
          <li key={r.rep} className="flex gap-3">
            <span className="tabular w-5 pt-0.5 text-right text-xs text-muted">{i + 1}</span>
            <div className="min-w-0 flex-1">
              {sort === "revenue" && (
                <BarRow
                  label={r.rep}
                  detail={`${r.won} won · ${pct(r.winRate)} win rate`}
                  value={moneyCompact(r.wonRevenue)}
                  fraction={r.wonRevenue / maxRevenue}
                />
              )}
              {sort === "winRate" && (
                <BarRow
                  label={r.rep}
                  detail={`${r.won} won · ${r.lost} lost`}
                  value={r.won + r.lost ? pct(r.winRate) : "–"}
                  fraction={r.winRate}
                />
              )}
              {sort === "speed" && (
                <BarRow
                  label={r.rep}
                  detail={`${r.won} won`}
                  value={r.won ? `${Math.round(r.avgDays)} days` : "–"}
                  fraction={r.won ? r.avgDays / maxDays : 0}
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

type CloseSplit = "product_line" | "lead_source" | "industry";

function CloseTimeCard({ deals }: { deals: Deal[] }) {
  const [split, setSplit] = useState<CloseSplit>("product_line");
  const buckets = useMemo(() => closeTimeBuckets(deals), [deals]);
  const groups = useMemo(() => closeTimeBy(deals, (d) => d[split]), [deals, split]);
  const avg = kpis(deals).avgDaysToClose;

  return (
    <Card
      title="Time to close"
      subtitle="Days from created to closed-won"
      action={
        <Segmented
          label="Split by"
          value={split}
          onChange={setSplit}
          options={[["product_line", "Product"], ["lead_source", "Source"], ["industry", "Industry"]] as const}
        />
      }
    >
      <p className="tabular mt-4 text-3xl font-medium tracking-tight">
        {Math.round(avg)} <span className="text-base text-muted">days on average</span>
      </p>
      <div className="mt-4 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="18%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip
              cursor={CURSOR}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload;
                if (!active || !p) return null;
                return <ChartTooltip title={`${p.label} days`} rows={[["Deals won", String(p.deals)]]} />;
              }}
            />
            <Bar dataKey="deals" fill={SERIES[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {groups.map((g) => (
          <li key={g.name} className="rounded-2xl bg-raised px-3.5 py-2.5">
            <p className="truncate text-xs text-muted" title={g.name}>{g.name}</p>
            <p className="tabular mt-0.5 text-sm font-medium">
              {days(g.avgDays)} <span className="text-xs font-normal text-muted">· {g.deals} won</span>
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PipelineCard({ deals }: { deals: Deal[] }) {
  const stages = useMemo(() => pipelineStages(deals), [deals]);
  const max = Math.max(1, ...stages.map((s) => s.value));
  const total = stages.reduce((a, s) => a + s.value, 0);
  const weighted = stages.reduce((a, s) => a + s.weighted, 0);

  return (
    <Card title="Open pipeline by stage" subtitle="Deals not yet won or lost">
      <p className="tabular mt-4 text-3xl font-medium tracking-tight">{money(total)}</p>
      <p className="mt-1 text-xs text-muted">{money(weighted)} weighted by close probability</p>
      <div className="mt-5 space-y-4">
        {stages.map((s) => (
          <BarRow
            key={s.stage}
            label={s.stage}
            detail={`${s.deals} deal${s.deals === 1 ? "" : "s"} · ${moneyCompact(s.weighted)} weighted`}
            value={moneyCompact(s.value)}
            fraction={s.value / max}
          />
        ))}
      </div>
    </Card>
  );
}

type MixSplit = "product_line" | "lead_source" | "industry";

function MixCard({ deals }: { deals: Deal[] }) {
  const [split, setSplit] = useState<MixSplit>("product_line");

  const slices = useMemo(() => {
    const mix = revenueMix(deals, (d) => d[split]);
    // Color follows the name (alphabetical), not the rank, and anything past
    // the five validated hues folds into "Other".
    const top = mix.slice(0, SERIES.length);
    const names = top.map((m) => m.name).sort();
    const colored = top.map((m) => ({ ...m, fill: SERIES[names.indexOf(m.name)] }));
    const rest = mix.slice(SERIES.length);
    if (rest.length === 0) return colored;
    return [
      ...colored,
      {
        name: "Other",
        value: rest.reduce((a, m) => a + m.value, 0),
        deals: rest.reduce((a, m) => a + m.deals, 0),
        fill: OTHER,
      },
    ];
  }, [deals, split]);

  const total = slices.reduce((a, s) => a + s.value, 0);

  return (
    <Card
      title="Revenue mix"
      subtitle="Share of closed-won revenue"
      action={
        <Segmented
          label="Split by"
          value={split}
          onChange={setSplit}
          options={[["product_line", "Product"], ["lead_source", "Source"], ["industry", "Industry"]] as const}
        />
      }
    >
      <div className="mt-4 flex flex-1 flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={66}
                outerRadius={90}
                paddingAngle={2}
                cornerRadius={4}
                stroke="none"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload;
                  if (!active || !p) return null;
                  return (
                    <ChartTooltip
                      title={p.name}
                      rows={[["Revenue", money(p.value)], ["Share", pct(p.value / total)], ["Deals", String(p.deals)]]}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-2xl font-medium tracking-tight">{moneyCompact(total)}</span>
            <span className="text-xs text-muted">Total</span>
          </div>
        </div>
        <ul className="w-full space-y-2.5 text-sm">
          {slices.map((s) => (
            <li key={s.name} className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.fill }} />
              <span className="min-w-0 flex-1 truncate text-soft">{s.name}</span>
              <span className="tabular font-medium">{moneyCompact(s.value)}</span>
              <span className="tabular w-10 text-right text-xs text-muted">{pct(s.value / total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function CompetitorCard({ deals }: { deals: Deal[] }) {
  const rows = useMemo(() => competitorStats(deals), [deals]);
  return (
    <Card title="Win rate by competitor" subtitle="Closed deals, by competitor mentioned">
      <div className="mt-5 space-y-4">
        {rows.map((r) => (
          <BarRow
            key={r.name}
            label={r.name === "None" ? "No competitor" : r.name}
            detail={`${r.won} won · ${r.lost} lost`}
            value={pct(r.winRate)}
            fraction={r.winRate}
          />
        ))}
      </div>
    </Card>
  );
}
