export const fmtUsd = (n: number, opts: { compact?: boolean; decimals?: number } = {}) => {
  const { compact = false, decimals } = opts;
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals ?? (Math.abs(n) < 1 ? 4 : 2),
    maximumFractionDigits: decimals ?? (Math.abs(n) < 1 ? 6 : 2),
  }).format(n);
};

export const fmtNum = (n: number, decimals = 2) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);

export const fmtPct = (n: number, withSign = true) => {
  const sign = withSign && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
};

export const fmtPrice = (n: number) => {
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(2)}`;
};

export const shortAddr = (a: string, n = 4) => `${a.slice(0, n)}…${a.slice(-n)}`;
