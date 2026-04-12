'use client';

import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api-client';

interface Props {
  city: string;
  district: string;
  ada: string;
  parsel: string;
  height?: string;
}

interface TkgmResult {
  responseData?: {
    areaM2?: number;
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
    nitelik?: string;
    boundary?: { type: string; coordinates: unknown };
  };
  boundary?: { type: string; coordinates: unknown };
}

export function TkgmParselMap({ city, district, ada, parsel, height = 'h-80' }: Props) {
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
        if (!cancelled) setError('TKGM sorgusu yapılamadı');
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

  // Init Leaflet map after result loads
  useEffect(() => {
    if (loading || !mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    const timer = setTimeout(async () => {
      const L = (await import('leaflet')).default;

      // Inject leaflet CSS via CDN
      if (!document.getElementById('leaflet-css-tkgm')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-tkgm';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // Destroy previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!mapRef.current) return;

      // Get boundary from either top-level or nested in responseData
      const boundary = result?.boundary ?? result?.responseData?.boundary ?? null;
      const rd = result?.responseData;
      const lat = rd?.latitude ?? 39.0;
      const lng = rd?.longitude ?? 35.0;
      const hasCoords = !!rd?.latitude;
      const zoom = boundary ? 17 : hasCoords ? 15 : 7;

      map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], zoom);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 20,
      }).addTo(map);

      if (boundary) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const layer = L.geoJSON(boundary as any, {
          style: {
            color: '#059669',
            weight: 3,
            fillColor: '#059669',
            fillOpacity: 0.25,
          },
        }).addTo(map);
        map.fitBounds(layer.getBounds(), { padding: [40, 40] });
      } else if (hasCoords) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        L.marker([lat, lng]).addTo(map).bindPopup(`Ada ${ada} / Parsel ${parsel}`).openPopup();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, result, ada, parsel]);

  if (!ada || !parsel) return null;

  const rd = result?.responseData;
  const boundary = result?.boundary ?? rd?.boundary ?? null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-200">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">TKGM Kadastro Haritası</p>
          <p className="text-xs text-slate-500">{city} / {district} — Ada {ada} · Parsel {parsel}</p>
        </div>
        {loading && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
            Sorgulanıyor...
          </div>
        )}
        {!loading && !error && boundary && (
          <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
            ✓ Parsel sınırı bulundu
          </span>
        )}
        {!loading && error && (
          <span className="ml-auto text-xs text-slate-400">Veri alınamadı</span>
        )}
      </div>

      {/* Map container — always rendered so Leaflet has a DOM target */}
      <div
        ref={mapRef}
        className={`${height} w-full bg-slate-100`}
        style={{ display: loading ? 'none' : 'block' }}
      />

      {/* Loading skeleton */}
      {loading && (
        <div className={`${height} flex flex-col items-center justify-center gap-3 bg-slate-50`}>
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">TKGM'den parsel sorgulanıyor</p>
            <p className="text-xs text-slate-400 mt-0.5">{city} / {district} · Ada {ada} Parsel {parsel}</p>
          </div>
        </div>
      )}

      {/* Error state — show basic info */}
      {!loading && error && (
        <div className={`${height} flex flex-col items-center justify-center gap-3 bg-slate-50 text-center px-6`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Kadastro haritası yüklenemedi</p>
            <p className="text-xs text-slate-400 mt-1">Ada {ada} / Parsel {parsel} için TKGM verisi bulunamadı</p>
          </div>
          <a
            href={`https://parselsorgu.tkgm.gov.tr`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-600 hover:underline"
          >
            TKGM Parsel Sorgu Sitesini Aç ↗
          </a>
        </div>
      )}

      {/* Parcel info strip — shown when data available */}
      {!loading && !error && rd && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-3 bg-white border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Ada / Parsel:</span>
            <strong>{ada} / {parsel}</strong>
          </div>
          {rd.nitelik && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-400">Nitelik:</span>
              <strong>{rd.nitelik}</strong>
            </div>
          )}
          {rd.areaM2 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-400">Alan:</span>
              <strong>{Number(rd.areaM2).toLocaleString('tr-TR')} m²</strong>
            </div>
          )}
          {rd.neighborhood && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-400">Mahalle:</span>
              <strong>{rd.neighborhood}</strong>
            </div>
          )}
          <span className="ml-auto text-[10px] text-slate-300">Kaynak: TKGM</span>
        </div>
      )}
    </div>
  );
}
