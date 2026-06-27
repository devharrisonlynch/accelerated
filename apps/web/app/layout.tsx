import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Accelerated — Leverage the trenches',
  description:
    'Permissionless perpetuals for the long tail of Solana memecoins. Leverage every graduated Pump.fun coin up to 5x against a single shared liquidity vault.',
  metadataBase: new URL('https://accelerated.example'),
  openGraph: {
    title: 'Accelerated — Leverage the trenches',
    description: 'Leverage every graduated Pump.fun coin up to 5x.',
    type: 'website',
    images: ['/banner.png'],
  },
  twitter: { card: 'summary_large_image', creator: '@acceleratedfi', images: ['/banner.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-trench min-h-screen font-sans text-[#e8e8ee] antialiased">{children}</body>
    </html>
  );
}
