import { NextResponse } from "next/server";
import { toDeal } from "@/lib/csv";
import { saveSnapshot, SnapshotStoreError } from "@/lib/snapshots";
import type { Deal } from "@/lib/types";

const MAX_DEALS = 20000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.deals) || body.deals.length === 0) {
    return NextResponse.json({ error: "No deals to share." }, { status: 400 });
  }
  if (body.deals.length > MAX_DEALS) {
    return NextResponse.json(
      { error: `Snapshots are limited to ${MAX_DEALS} deals.` },
      { status: 413 },
    );
  }

  const deals: Deal[] = [];
  for (const row of body.deals) {
    const deal = row && typeof row === "object" ? toDeal(row) : "invalid row";
    if (typeof deal === "string") {
      return NextResponse.json({ error: `Invalid deal: ${deal}` }, { status: 400 });
    }
    deals.push(deal);
  }

  try {
    const id = await saveSnapshot({
      name: String(body.name ?? "Untitled dataset").slice(0, 200),
      uploadedAt: new Date().toISOString(),
      deals,
    });
    return NextResponse.json({ id });
  } catch (error) {
    const message =
      error instanceof SnapshotStoreError ? error.message : "Could not save snapshot.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
