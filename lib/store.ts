"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Dataset } from "./types";

const KEY = "meridian:dataset";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveDataset(dataset: Dataset) {
  window.localStorage.setItem(KEY, JSON.stringify(dataset));
  listeners.forEach((l) => l());
}

export function clearDataset() {
  window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

/** The uploaded dataset kept in this browser; `undefined` until hydrated. */
export function useDataset(): Dataset | null | undefined {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as Dataset;
    } catch {
      return null;
    }
  }, [raw]);
}
