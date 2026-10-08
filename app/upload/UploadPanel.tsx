"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheck, FileSpreadsheet, UploadCloud } from "lucide-react";
import { parseDealsCsv } from "@/lib/csv";
import { kpis } from "@/lib/analytics";
import { moneyCompact, shortDate } from "@/lib/format";
import { saveDataset, useDataset } from "@/lib/store";
import { REQUIRED_COLUMNS } from "@/lib/types";

export function UploadPanel() {
  const dataset = useDataset();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  async function load(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSkipped([]);

    const result = parseDealsCsv(await file.text());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      saveDataset({ name: file.name, uploadedAt: new Date().toISOString(), deals: result.deals });
      setSkipped(result.skipped);
    } catch {
      setError("This file is too large to keep in the browser.");
    }
  }

  const summary = dataset ? summarize(dataset.deals) : null;

  return (
    <div className="mt-8 space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          load(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center rounded-3xl border border-dashed px-6 py-14 text-center outline-none transition-colors focus-visible:border-accent ${
          dragging ? "border-accent bg-accent/10" : "border-line bg-card hover:border-muted"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-raised text-soft">
          <UploadCloud size={22} />
        </div>
        <p className="mt-5 text-base font-medium">
          {dataset ? "Drop a new CSV to replace the current data" : "Drop your CSV here"}
        </p>
        <p className="mt-1 text-sm text-muted">or click to browse</p>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            load(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-bad/40 bg-bad/10 p-4 text-sm">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-bad" />
          <p className="text-ink">{error}</p>
        </div>
      )}

      {dataset && summary && (
        <div className="rounded-3xl border border-line bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-raised text-soft">
              <FileSpreadsheet size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{dataset.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <CircleCheck size={13} className="text-good" />
                Loaded {dataset.deals.length} deals
              </p>
            </div>
            <Link
              href="/insights"
              className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              View insights
              <ArrowRight size={15} />
            </Link>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {summary.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-raised px-4 py-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="tabular mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {skipped.length > 0 && (
            <div className="mt-4 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm">
              <p className="font-medium">
                {skipped.length} row{skipped.length === 1 ? " was" : "s were"} skipped
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-soft">
                {skipped.slice(0, 5).map((s) => (
                  <li key={s}>{s}</li>
                ))}
                {skipped.length > 5 && <li>…and {skipped.length - 5} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      <details className="rounded-2xl border border-line bg-card px-5 py-4 text-sm">
        <summary className="cursor-pointer text-soft">Expected columns</summary>
        <p className="mt-3 font-mono text-xs leading-6 text-muted">{REQUIRED_COLUMNS.join(", ")}</p>
        <p className="mt-2 text-xs text-muted">
          Dates can be m/d/yyyy or yyyy-mm-dd. Column order doesn&apos;t matter.
        </p>
      </details>
    </div>
  );
}

function summarize(deals: Parameters<typeof kpis>[0]): [string, string][] {
  const dates = deals.map((d) => d.created_date).sort();
  const k = kpis(deals);
  return [
    ["Deals", String(deals.length)],
    ["Sales reps", String(new Set(deals.map((d) => d.rep_name)).size)],
    ["Won revenue", moneyCompact(k.wonRevenue)],
    ["Created", `${shortDate(dates[0])} – ${shortDate(dates[dates.length - 1])}`],
  ];
}
