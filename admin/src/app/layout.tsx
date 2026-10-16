import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'UkRide admin',
    template: '%s | UkRide admin',
  },
  description: "The operator's panel for UkRide.",
  // Staff screens are not for search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
