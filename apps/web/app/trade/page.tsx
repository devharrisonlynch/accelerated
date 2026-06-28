import { Navbar } from '@/components/layout/Navbar';
import { Ticker } from '@/components/ui/Ticker';
import { TradeTerminal } from '@/components/trade/TradeTerminal';

export default function TradePage({
  searchParams,
}: {
  searchParams: { market?: string };
}) {
  const symbol = searchParams.market ?? 'WIFHAT';
  return (
    <>
      <Navbar />
      <Ticker />
      <TradeTerminal initialSymbol={symbol} />
    </>
  );
}
