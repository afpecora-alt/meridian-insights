"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);

    if (response?.ok) {
      // Only follow same-site paths, e.g. a shared snapshot link.
      const next = params.get("next");
      const target = next && /^\/(?![/\\])/.test(next) ? next : "/upload";
      router.replace(target);
      router.refresh();
      return;
    }
    setPending(false);
    setError(response?.status === 401 ? "Incorrect password." : "Something went wrong. Try again.");
  }

  return (
    <form onSubmit={submit} className="mt-7">
      <label htmlFor="password" className="text-xs font-medium text-soft">
        Password
      </label>
      <div className="relative mt-2">
        <Lock size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "password-error" : undefined}
          className="h-11 w-full rounded-full border border-line bg-raised pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
          placeholder="Enter password"
        />
      </div>
      {error && (
        <p id="password-error" role="alert" className="mt-2.5 text-sm text-bad">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {pending ? "Signing in…" : "Continue"}
        {!pending && <ArrowRight size={15} />}
      </button>
    </form>
  );
}
