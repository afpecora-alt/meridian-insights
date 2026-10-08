import Papa from "papaparse";
import { REQUIRED_COLUMNS, type Deal } from "./types";

export type ParseResult =
  | { ok: true; deals: Deal[]; skipped: string[] }
  | { ok: false; error: string };

/** Accepts m/d/yyyy or yyyy-mm-dd and returns yyyy-mm-dd, or null if invalid. */
export function toIsoDate(value: unknown): string | null {
  const s = String(value ?? "").trim();
  let y: number, m: number, d: number;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (us) [m, d, y] = [Number(us[1]), Number(us[2]), Number(us[3])];
  else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

function toNumber(value: unknown): number | null {
  const s = String(value ?? "").replace(/[$,%\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Validates one raw row (CSV record or untrusted JSON) into a Deal. */
export function toDeal(row: Record<string, unknown>): Deal | string {
  const text = (key: string) => String(row[key] ?? "").trim();
  const id = text("deal_id");
  if (!id) return "missing deal_id";

  const created = toIsoDate(row.created_date);
  const closed = toIsoDate(row.close_date);
  if (!created) return `${id}: invalid created_date`;
  if (!closed) return `${id}: invalid close_date`;

  const value = toNumber(row.deal_value);
  if (value === null) return `${id}: invalid deal_value`;

  return {
    deal_id: id,
    company_name: text("company_name"),
    industry: text("industry"),
    rep_name: text("rep_name"),
    lead_source: text("lead_source"),
    product_line: text("product_line"),
    deal_stage: text("deal_stage"),
    deal_value: value,
    created_date: created,
    close_date: closed,
    days_in_stage: toNumber(row.days_in_stage) ?? 0,
    last_activity_days_ago: toNumber(row.last_activity_days_ago) ?? 0,
    probability_pct: toNumber(row.probability_pct) ?? 0,
    competitor_mentioned: text("competitor_mentioned") || "None",
    num_stakeholders: toNumber(row.num_stakeholders) ?? 0,
    next_action: text("next_action"),
  };
}

export function parseDealsCsv(csv: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const columns = parsed.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `This file is missing ${missing.length === 1 ? "a required column" : "required columns"}: ${missing.join(", ")}.`,
    };
  }

  const deals: Deal[] = [];
  const skipped: string[] = [];
  parsed.data.forEach((row, i) => {
    const deal = toDeal(row);
    if (typeof deal === "string") skipped.push(`Row ${i + 2}: ${deal}`);
    else deals.push(deal);
  });

  if (deals.length === 0) {
    return { ok: false, error: "No valid deal rows were found in this file." };
  }
  return { ok: true, deals, skipped };
}
