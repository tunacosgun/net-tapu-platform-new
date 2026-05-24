import type { Metadata } from 'next';
import BecomeConsultantClient from './become-consultant-client';

export const metadata: Metadata = {
  title: 'Danışman Olun — NetTapu',
  description: 'NetTapu danışman ağına başvurun. Tecrübenizi ve bölgenizi bizimle paylaşın.',
};

export default function Page() {
  return <BecomeConsultantClient />;
}
