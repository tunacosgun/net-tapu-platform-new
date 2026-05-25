import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TurkeyParcelMap = dynamic(
  () => import('@/components/turkey-parcel-map').then((m) => m.TurkeyParcelMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

export const metadata: Metadata = {
  title: 'Türkiye Arsa Haritası — NetTapu',
  description: 'Türkiye geneli arsa ilanlarını il ve ilçe bazında haritada inceleyin.',
};

export default function HaritaPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-ink-900 tracking-tight">
              Türkiye Arsa Haritası
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              İllere tıklayarak ilçe bazında arsa dağılımını görebilirsiniz.
            </p>
          </div>
          <Link
            href="/parcels"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-brand-700 hover:text-brand-800 bg-white border border-slate-200 hover:border-brand-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Tüm İlanlar Listesi
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <TurkeyParcelMap />
        </div>
      </div>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex items-center justify-center h-[600px] rounded-lg bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600" />
        <span className="text-sm text-slate-500 font-medium">Harita yükleniyor...</span>
      </div>
    </div>
  );
}
