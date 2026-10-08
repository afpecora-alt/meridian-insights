"use client";

import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";
import type { Dataset } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "done"; url: string; copied: boolean }
  | { status: "error"; message: string };

export function ShareButton({ dataset }: { dataset: Dataset }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  async function share() {
    setState({ status: "saving" });
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dataset.name, deals: dataset.deals }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not create the share link.");
      const url = `${window.location.origin}/share/${body.id}`;
      setState({ status: "done", url, copied: await copy(url) });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not create the share link.",
      });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={share}
        disabled={state.status === "saving"}
        className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Share2 size={15} />
        {state.status === "saving" ? "Creating link…" : "Share"}
      </button>

      {(state.status === "done" || state.status === "error") && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className="absolute right-0 top-12 z-20 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-raised p-4 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">
              {state.status === "done" ? "Snapshot link ready" : "Couldn't share"}
            </p>
            <button
              type="button"
              onClick={() => setState({ status: "idle" })}
              aria-label="Close"
              className="text-muted hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>

          {state.status === "error" && <p className="mt-1.5 text-sm text-soft">{state.message}</p>}

          {state.status === "done" && (
            <>
              <p className="mt-1 text-xs text-muted">
                Anyone with this link and the team password sees this data exactly as it is now.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  readOnly
                  value={state.url}
                  aria-label="Share link"
                  onFocus={(e) => e.target.select()}
                  className="h-9 min-w-0 flex-1 rounded-full border border-line bg-card px-3.5 font-mono text-xs text-soft outline-none"
                />
                <button
                  type="button"
                  onClick={async () => setState({ ...state, copied: await copy(state.url) })}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-xs hover:border-muted"
                >
                  {state.copied ? <Check size={13} className="text-good" /> : <Copy size={13} />}
                  {state.copied ? "Copied" : "Copy"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
