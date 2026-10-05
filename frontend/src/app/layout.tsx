import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SiteNav } from '@/components/layout/SiteNav';
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
    default: 'UkRide',
    template: '%s | UkRide',
  },
  description: 'Taxi and chauffeur booking platform.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <QueryProvider>
          <SiteNav />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
