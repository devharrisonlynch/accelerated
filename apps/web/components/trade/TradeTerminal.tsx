'use client';

import { useState } from 'react';
import { getMarket, type Market } from '@/lib/markets';
import { MarketSidebar } from './MarketSidebar';
import { MarketHeader } from './MarketHeader';
import { Chart } from './Chart';
import { OrderPanel } from './OrderPanel';
import { PositionsPanel } from './PositionsPanel';

export function TradeTerminal({ initialSymbol }: { initialSymbol: string }) {
  const [market, setMarket] = useState<Market>(getMarket(initialSymbol));

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-3 px-3 py-3 lg:grid-cols-[260px_1fr_320px]">
      {/* Markets list */}
      <aside className="hidden lg:block">
        <div className="sticky top-[76px] h-[calc(100vh-92px)]">
          <MarketSidebar active={market.symbol} onSelect={setMarket} />
        </div>
      </aside>

      {/* Center column */}
      <section className="flex min-w-0 flex-col gap-3">
        <MarketHeader market={market} />
        <div className="panel h-[440px] overflow-hidden p-2">
          <Chart symbol={market.symbol} basePrice={market.price} />
        </div>
        <PositionsPanel />
      </section>

      {/* Order panel */}
      <aside>
        <div className="sticky top-[76px]">
          <OrderPanel market={market} />
        </div>
      </aside>
    </div>
  );
}
