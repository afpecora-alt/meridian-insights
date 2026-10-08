"use client";

import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { ShareButton } from "@/components/ShareButton";
import { shortDate } from "@/lib/format";
import { useDataset } from "@/lib/store";

export function InsightsView() {
  const dataset = useDataset();

  if (dataset === undefined) return null;

  if (dataset === null) {
    return (
      <div className="mx-auto mt-16 flex max-w-md flex-col items-center rounded-3xl border border-line bg-card px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-raised text-soft">
          <UploadCloud size={22} />
        </div>
        <h1 className="mt-5 text-xl font-medium tracking-tight">No data yet</h1>
        <p className="mt-1.5 text-sm text-muted">Upload a deals CSV to see insights here.</p>
        <Link
          href="/upload"
          className="mt-6 flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-bg hover:opacity-90"
        >
          Upload data
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-1.5 truncate text-sm text-muted">
            {dataset.name} · {dataset.deals.length} deals · uploaded {shortDate(dataset.uploadedAt)}
          </p>
        </div>
        <ShareButton dataset={dataset} />
      </div>
      <Dashboard deals={dataset.deals} />
    </>
  );
}
