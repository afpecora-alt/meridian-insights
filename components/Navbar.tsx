"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, LogOut, Upload } from "lucide-react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

export function Navbar({ active }: { active?: "/upload" | "/insights" }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/upload" className="flex items-center gap-2.5 text-ink">
          <Logo />
          <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">
            Meridian Insights
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 rounded-full border border-line bg-card p-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const current = active === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  current ? "bg-ink font-medium text-bg" : "text-soft hover:text-ink"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-soft transition-colors hover:text-ink"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
