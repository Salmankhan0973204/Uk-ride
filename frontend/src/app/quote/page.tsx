import type { Metadata } from 'next';
import { QuoteForm } from '@/features/quotes/components/QuoteForm';

export const metadata: Metadata = {
  title: 'Get a price',
  description: 'The exact fare for your journey in each UkRide vehicle, with the breakdown.',
};

export default function QuotePage() {
  return (
    <div className="pt-2 sm:pt-6">
      <QuoteForm />
    </div>
  );
}
