import { Suspense } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { Navbar } from "@/components/Navbar";
import { shortDate } from "@/lib/format";
import { getSnapshot } from "@/lib/snapshots";

export const metadata = { title: "Shared snapshot · Meridian Insights" };

export default function SharePage({ params }: PageProps<"/share/[id]">) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Suspense fallback={<p className="mt-16 text-center text-sm text-muted">Loading snapshot…</p>}>
          <SharedSnapshot params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function SharedSnapshot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getSnapshot(id).catch(() => null);

  if (!snapshot) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-3xl border border-line bg-card px-6 py-12 text-center">
        <h1 className="text-xl font-medium tracking-tight">Snapshot not found</h1>
        <p className="mt-1.5 text-sm text-muted">
          This link may be mistyped, or the snapshot is no longer available.
        </p>
        <Link
          href="/upload"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-bg hover:opacity-90"
        >
          Upload data
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-soft">
          <Camera size={13} />
          Shared snapshot
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1.5 truncate text-sm text-muted">
          {snapshot.name} · {snapshot.deals.length} deals · shared {shortDate(snapshot.createdAt)}
        </p>
      </div>
      <Dashboard deals={snapshot.deals} />
    </>
  );
}
