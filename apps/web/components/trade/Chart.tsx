'use client';

import { useEffect, useRef } from 'react';
import { seededCandles } from '@/lib/markets';

export function Chart({ symbol, basePrice }: { symbol: string; basePrice: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let chart: { remove: () => void } | null = null;
    let disposed = false;

    // dynamic import keeps lightweight-charts out of the server bundle
    import('lightweight-charts').then(({ createChart, ColorType }) => {
      if (disposed || !ref.current) return;
      const c = createChart(ref.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#7A7A88',
          fontFamily: 'var(--font-mono)',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.03)' },
          horzLines: { color: 'rgba(255,255,255,0.03)' },
        },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
        timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true },
        crosshair: { mode: 0 },
        height: ref.current.clientHeight,
        width: ref.current.clientWidth,
      });
      chart = c;

      const series = c.addCandlestickSeries({
        upColor: '#14F195',
        downColor: '#FF4D5E',
        wickUpColor: '#14F195',
        wickDownColor: '#FF4D5E',
        borderVisible: false,
      });
      series.setData(seededCandles(symbol, basePrice) as never);
      c.timeScale().fitContent();

      const onResize = () => {
        if (ref.current) c.applyOptions({ width: ref.current.clientWidth, height: ref.current.clientHeight });
      };
      window.addEventListener('resize', onResize);
      (c as unknown as { _cleanup: () => void })._cleanup = () =>
        window.removeEventListener('resize', onResize);
    });

    return () => {
      disposed = true;
      const c = chart as unknown as { _cleanup?: () => void } | null;
      c?._cleanup?.();
      chart?.remove();
    };
  }, [symbol, basePrice]);

  return <div ref={ref} className="h-full w-full" />;
}
