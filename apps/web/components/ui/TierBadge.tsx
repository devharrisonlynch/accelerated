import { TIER_META, type Tier } from '@/lib/markets';

export function TierBadge({ tier, withLabel = false }: { tier: Tier; withLabel?: boolean }) {
  const meta = TIER_META[tier];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ borderColor: `${meta.color}40`, color: meta.color, background: `${meta.color}12` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {tier}
      {withLabel && <span className="text-white/40">· {meta.maxLev}×</span>}
    </span>
  );
}
