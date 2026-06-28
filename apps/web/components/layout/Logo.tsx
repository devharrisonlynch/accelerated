export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden>
      {/* orange broken ring */}
      <path
        d="M68.9 20 A41 41 0 1 1 51.1 20"
        fill="none"
        stroke="#F97316"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* white accelerator arrow */}
      <path d="M60 32 L90 97 L60 76 L30 97 Z" fill="#FFFFFF" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo />
      <span className="text-lg font-semibold tracking-tight">Accelerated</span>
    </div>
  );
}
