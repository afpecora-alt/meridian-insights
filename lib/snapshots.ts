import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Dataset, Snapshot } from "./types";

const TABLE = "snapshots";
const LOCAL_DIR = path.join(process.cwd(), ".data", "snapshots");

export class SnapshotStoreError extends Error {}

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Without Supabase credentials, `next dev` keeps snapshots on disk so the
// share flow can be tried locally. Production always requires Supabase.
function localFallbackAllowed() {
  return process.env.NODE_ENV !== "production";
}

const NOT_CONFIGURED =
  "Sharing is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";

export async function saveSnapshot(dataset: Dataset): Promise<string> {
  const id = randomBytes(9).toString("base64url");
  const createdAt = new Date().toISOString();
  const client = supabase();

  if (client) {
    const { error } = await client.from(TABLE).insert({
      id,
      name: dataset.name,
      uploaded_at: dataset.uploadedAt,
      deals: dataset.deals,
      created_at: createdAt,
    });
    if (error) throw new SnapshotStoreError(`Supabase: ${error.message}`);
    return id;
  }

  if (!localFallbackAllowed()) throw new SnapshotStoreError(NOT_CONFIGURED);
  const snapshot: Snapshot = { ...dataset, id, createdAt };
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, `${id}.json`), JSON.stringify(snapshot));
  return id;
}

export async function getSnapshot(id: string): Promise<Snapshot | null> {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return null;
  const client = supabase();

  if (client) {
    const { data, error } = await client
      .from(TABLE)
      .select("id, name, uploaded_at, deals, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new SnapshotStoreError(`Supabase: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      uploadedAt: data.uploaded_at,
      deals: data.deals,
      createdAt: data.created_at,
    };
  }

  if (!localFallbackAllowed()) throw new SnapshotStoreError(NOT_CONFIGURED);
  try {
    const file = await readFile(path.join(LOCAL_DIR, `${id}.json`), "utf8");
    return JSON.parse(file) as Snapshot;
  } catch {
    return null;
  }
}
