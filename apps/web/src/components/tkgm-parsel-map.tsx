'use client';

import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api-client';

interface Props {
  city: string;
  district: string;
  ada: string;
  parsel: string;
}

interface TkgmResult {
  responseData?: {
    areaM2?: number;
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
    parselNo?: string;
    adaNo?: string;
    nitelik?: string;
  };
  boundary?: { type: string; coordinates: unknown };
}

export function TkgmParselMap({ city, district, ada, parsel }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [result, setResult] = useState<TkgmResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-query on mount
  useEffect(() => {
    let cancelled = false;

    async function query() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.post<TkgmResult>('/integrations/tkgm/public-lookup', {
          city,
          district,
          ada,
          parsel,
        });
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setError('TKGM sorgusu başarısız oldu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (city && district && ada && parsel) {
      query();
    } else {
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [city, district, ada, parsel]);

  // Init Leaflet map after result
  useEffect(() => {
    if (!result || !mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    const timer = setTimeout(async () => {
      const L = (await import('leaflet')).default;

      // Inject leaflet CSS via CDN if not already present
      if (!document.getElementById('leaflet-css-tkgm')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-tkgm';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // Destroy previous instance
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }

      if (!mapRef.current) return;

      const lat = result.responseData?.latitude ?? 39.0;
      const lng = result.responseData?.longitude ?? 35.0;
      const zoom = result.boundary ? 17 : 10;

      map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], zoom);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 20,
      }).addTo(map);

      if (result.boundary) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const layer = L.geoJSON(result.boundary as any, {
          style: {
            color: '#059669',
            weight: 3,
            fillColor: '#059669',
            fillOpacity: 0.2,
          },
        }).addTo(map);

        map.fitBounds(layer.getBounds(), { padding: [30, 30] });
      } else if (result.responseData?.latitude) {
        L.marker([lat, lng]).addTo(map);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [result]);

  if (!ada || !parsel) return null;

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-200">
        <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
        <span className="text-sm font-semibold text-emerald-800">TKGM Kadastro Haritası</span>
        <span className="ml-auto text-xs text-emerald-600">Ada {ada} / Parsel {parsel}</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 bg-white">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
          <span className="text-sm text-slate-500">TKGM sorgulanıyor...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center justify-center gap-2 py-8 bg-white text-sm text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          Kadastro verisi bulunamadı
        </div>
      )}

      {/* Map */}
      {!loading && !error && (
        <>
          <div ref={mapRef} className="h-56 w-full bg-slate-100" />

          {/* Parcel info strip */}
          {result?.responseData && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 bg-white border-t border-slate-100 text-xs text-slate-600">
              {result.responseData.nitelik && (
                <span><span className="text-slate-400">Nitelik:</span> <strong>{result.responseData.nitelik}</strong></span>
              )}
              {result.responseData.areaM2 && (
                <span><span className="text-slate-400">Alan:</span> <strong>{Number(result.responseData.areaM2).toLocaleString('tr-TR')} m²</strong></span>
              )}
              {result.responseData.neighborhood && (
                <span><span className="text-slate-400">Mahalle:</span> <strong>{result.responseData.neighborhood}</strong></span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
