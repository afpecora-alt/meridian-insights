export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M3 7l9 7-9 7z" fill="currentColor" />
      <path d="M25 7l-9 7 9 7z" fill="currentColor" />
    </svg>
  );
}
