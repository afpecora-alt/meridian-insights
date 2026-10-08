import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Meridian Insights" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-card p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-bg">
          <Logo />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Meridian Insights</h1>
        <p className="mt-1.5 text-sm text-muted">
          Enter the team password to view sales insights.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
