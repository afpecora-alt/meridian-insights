import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col rounded-3xl border border-line bg-card p-5 sm:p-6 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-line bg-raised p-0.5">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            value === key ? "bg-ink font-medium text-bg" : "text-soft hover:text-ink"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** A labelled horizontal bar on the brand's hatched track. */
export function BarRow({
  label,
  detail,
  value,
  fraction,
  color = "var(--color-series-1)",
}: {
  label: ReactNode;
  detail?: string;
  value: string;
  fraction: number;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">
          {label}
          {detail && <span className="ml-2 text-xs text-muted">{detail}</span>}
        </span>
        <span className="tabular shrink-0 font-medium">{value}</span>
      </div>
      <div className="track mt-1.5 h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}
