"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { customerRows, type CustomerRow, type CustomerStatus } from "@/lib/analytics";
import { money } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { Card } from "./ui";

type SortKey = "company" | "industry" | "deals" | "wonRevenue" | "openPipeline" | "avgDays" | "lastActivity" | "status";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "company", label: "Customer" },
  { key: "industry", label: "Industry" },
  { key: "status", label: "Status" },
  { key: "deals", label: "Deals", numeric: true },
  { key: "wonRevenue", label: "Won revenue", numeric: true },
  { key: "openPipeline", label: "Open pipeline", numeric: true },
  { key: "avgDays", label: "Time to close", numeric: true },
  { key: "lastActivity", label: "Last activity", numeric: true },
];

const STATUS_COLOR: Record<CustomerStatus, string> = {
  Customer: "var(--color-good)",
  "In pipeline": "var(--color-accent)",
  Lost: "var(--color-bad)",
};

export function CustomersTable({ deals }: { deals: Deal[] }) {
  const rows = useMemo(() => customerRows(deals), [deals]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "wonRevenue", desc: true });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => `${r.company} ${r.industry} ${r.reps} ${r.status}`.toLowerCase().includes(q))
      : rows;
    const direction = sort.desc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      // Customers with no won deals have no close time; keep them last.
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
      const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return order * direction || a.company.localeCompare(b.company);
    });
  }, [rows, query, sort]);

  function toggle(key: SortKey, numeric?: boolean) {
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: Boolean(numeric) }));
  }

  return (
    <Card
      title="Customers"
      subtitle={`${visible.length} of ${rows.length} accounts`}
      action={
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, reps…"
            aria-label="Search customers"
            className="h-9 w-56 rounded-full border border-line bg-raised pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </div>
      }
    >
      <div className="mt-4 max-h-[32rem] overflow-auto">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={sort.key === c.key ? (sort.desc ? "descending" : "ascending") : undefined}
                  className={`sticky top-0 border-b border-line bg-card px-3 py-2.5 text-xs font-normal text-muted ${
                    c.numeric ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(c.key, c.numeric)}
                    className={`inline-flex items-center gap-1 hover:text-ink ${sort.key === c.key ? "text-ink" : ""}`}
                  >
                    {c.label}
                    {sort.key === c.key && (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <Row key={r.company} row={r} />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-muted">
                  No customers match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Row({ row }: { row: CustomerRow }) {
  const cell = "border-b border-line/60 px-3 py-3";
  const dash = <span className="text-muted">–</span>;
  return (
    <tr className="hover:bg-raised/60">
      <td className={cell}>
        <p className="font-medium">{row.company}</p>
        <p className="text-xs text-muted">{row.reps}</p>
      </td>
      <td className={`${cell} text-soft`}>{row.industry}</td>
      <td className={cell}>
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-raised px-2.5 py-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[row.status] }} />
          {row.status}
        </span>
      </td>
      <td className={`${cell} tabular text-right`}>{row.deals}</td>
      <td className={`${cell} tabular text-right font-medium`}>{row.wonRevenue ? money(row.wonRevenue) : dash}</td>
      <td className={`${cell} tabular text-right`}>{row.openPipeline ? money(row.openPipeline) : dash}</td>
      <td className={`${cell} tabular text-right`}>{row.avgDays === null ? dash : `${Math.round(row.avgDays)} days`}</td>
      <td className={`${cell} tabular whitespace-nowrap text-right text-soft`}>{row.lastActivity}d ago</td>
    </tr>
  );
}
