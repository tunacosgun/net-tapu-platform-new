'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, ZoomControl } from 'react-leaflet';
import type { Layer, PathOptions } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '@/lib/api-client';
import { ChevronLeft, MapPin, TrendingUp } from 'lucide-react';

type CityStat = { city: string; count: number };
type DistrictStat = { district: string; count: number };

const COLOR_STOPS = [
  { min: 0, color: '#f1f5f9' },
  { min: 1, color: '#dcfce7' },
  { min: 3, color: '#86efac' },
  { min: 8, color: '#22c55e' },
  { min: 20, color: '#15803d' },
  { min: 50, color: '#14532d' },
];

function colorFor(count: number): string {
  let c = COLOR_STOPS[0].color;
  for (const stop of COLOR_STOPS) if (count >= stop.min) c = stop.color;
  return c;
}

function norm(s: string): string {
  return s
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/i̇/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .toLowerCase()
    .trim();
}

// Special-case mapping for province names that differ between our DB and GADM data
const NAME_FIX: Record<string, string> = {
  'kinaliada': 'kinaliada',
  'afyon': 'afyonkarahisar',
};
function gadmNameFor(name: string): string {
  const n = norm(name);
  return NAME_FIX[n] || name;
}

function FitBounds({ geo }: { geo: any | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geo) return;
    try {
      const layer = L.geoJSON(geo);
      const b = layer.getBounds();
      if (b.isValid()) map.fitBounds(b, { padding: [20, 20] });
    } catch {}
  }, [geo, map]);
  return null;
}

export default function TurkeyParcelMapLeaflet() {
  const [cityStats, setCityStats] = useState<CityStat[]>([]);
  const [districtStats, setDistrictStats] = useState<DistrictStat[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [provincesGeo, setProvincesGeo] = useState<any | null>(null);
  const [districtsGeo, setDistrictsGeo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const districtsLayerKey = useRef(0);

  // City stats
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<CityStat[]>('/parcels/stats/by-city')
      .then((r) => { if (!cancelled) setCityStats(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (!cancelled) setCityStats([]); });
    return () => { cancelled = true; };
  }, []);

  // Province GeoJSON (lazy)
  useEffect(() => {
    let cancelled = false;
    fetch('/geo/tr-provinces.json')
      .then((r) => r.json())
      .then((g) => { if (!cancelled) setProvincesGeo(g); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const countByCity = useMemo(() => {
    const m = new Map<string, number>();
    cityStats.forEach((s) => m.set(norm(s.city), s.count));
    return m;
  }, [cityStats]);

  const countByDistrict = useMemo(() => {
    const m = new Map<string, number>();
    districtStats.forEach((s) => m.set(norm(s.district), s.count));
    return m;
  }, [districtStats]);

  const totalCount = useMemo(() => cityStats.reduce((sum, s) => sum + s.count, 0), [cityStats]);
  const topCities = useMemo(
    () => [...cityStats].sort((a, b) => b.count - a.count).slice(0, 12),
    [cityStats],
  );

  function loadDistricts(city: string) {
    setSelectedCity(city);
    setLoading(true);
    apiClient
      .get<DistrictStat[]>(`/parcels/stats/by-district?city=${encodeURIComponent(city)}`)
      .then((r) => setDistrictStats(Array.isArray(r.data) ? r.data : []))
      .catch(() => setDistrictStats([]))
      .finally(() => setLoading(false));

    if (!districtsGeo) {
      fetch('/geo/tr-districts.json')
        .then((r) => r.json())
        .then((g) => setDistrictsGeo(g))
        .catch(() => {});
    }
  }

  function clearSelection() {
    setSelectedCity(null);
    setDistrictStats([]);
  }

  // Filter district features for selected city
  const districtsForCity = useMemo(() => {
    if (!selectedCity || !districtsGeo) return null;
    const target = norm(gadmNameFor(selectedCity));
    return {
      type: 'FeatureCollection' as const,
      features: districtsGeo.features.filter((f: any) => norm(f.properties.NAME_1) === target),
    };
  }, [selectedCity, districtsGeo]);

  useEffect(() => { districtsLayerKey.current += 1; }, [districtsForCity]);

  const styleProvince = (feature: any): PathOptions => {
    const name = feature.properties.name || feature.properties.NAME_1 || '';
    const count = countByCity.get(norm(name)) ?? 0;
    return {
      fillColor: colorFor(count),
      fillOpacity: 0.78,
      color: '#0f766e',
      weight: 0.8,
      opacity: 0.9,
    };
  };

  const styleDistrict = (feature: any): PathOptions => {
    const name = feature.properties.NAME_2 || '';
    const count = countByDistrict.get(norm(name)) ?? 0;
    return {
      fillColor: colorFor(count),
      fillOpacity: 0.7,
      color: '#0f766e',
      weight: 1,
      opacity: 0.95,
    };
  };

  const onEachProvince = (feature: any, layer: Layer) => {
    const name = feature.properties.name || feature.properties.NAME_1 || '';
    const count = countByCity.get(norm(name)) ?? 0;
    layer.bindTooltip(
      `<div style="font-weight:600">${name}</div><div style="font-size:11px;color:#475569">${count} arsa</div>`,
      { sticky: true, direction: 'top', offset: [0, -8] },
    );
    layer.on({
      mouseover: (e) => {
        (e.target as any).setStyle({ weight: 2, color: '#0d9488', fillOpacity: 0.92 });
      },
      mouseout: (e) => {
        (e.target as any).setStyle(styleProvince(feature));
      },
      click: () => loadDistricts(name),
    });
  };

  const onEachDistrict = (feature: any, layer: Layer) => {
    const name = feature.properties.NAME_2 || '';
    const count = countByDistrict.get(norm(name)) ?? 0;
    layer.bindTooltip(
      `<div style="font-weight:600">${name}</div><div style="font-size:11px;color:#475569">${count} arsa</div>`,
      { sticky: true, direction: 'top', offset: [0, -8] },
    );
    layer.on({
      mouseover: (e) => {
        (e.target as any).setStyle({ weight: 2.4, color: '#0d9488', fillOpacity: 0.85 });
      },
      mouseout: (e) => {
        (e.target as any).setStyle(styleDistrict(feature));
      },
      click: () => {
        if (selectedCity) {
          window.location.href = `/parcels?city=${encodeURIComponent(selectedCity)}&district=${encodeURIComponent(name)}`;
        }
      },
    });
  };

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
            <MapPin className="h-3.5 w-3.5" />
            Türkiye Geneli Arsa Dağılımı
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {totalCount.toLocaleString('tr-TR')} arsa, 81 ilde
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Haritadan il'e tıklayın, o ile ait ilçe bazlı dağılımı görün.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="relative">
              {selectedCity && (
                <div className="absolute top-3 left-3 z-[500] flex items-center gap-2">
                  <button
                    onClick={clearSelection}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Türkiye geneline dön
                  </button>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white shadow-sm text-xs font-semibold">
                    {selectedCity}
                  </div>
                </div>
              )}

              {loading && (
                <div className="absolute top-3 right-3 z-[500] px-3 py-1.5 rounded-lg bg-white/95 border border-slate-200 shadow-sm text-xs font-semibold text-slate-600">
                  Yükleniyor…
                </div>
              )}

              <MapContainer
                center={[39.0, 35.0]}
                zoom={6}
                minZoom={5}
                maxZoom={12}
                scrollWheelZoom
                zoomControl={false}
                style={{ height: 560, width: '100%', background: '#f8fafc' }}
                attributionControl
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  subdomains={['a', 'b', 'c', 'd']}
                />
                <ZoomControl position="bottomright" />

                {!selectedCity && provincesGeo && (
                  <GeoJSON
                    key={`prov-${cityStats.length}`}
                    data={provincesGeo as any}
                    style={styleProvince as any}
                    onEachFeature={onEachProvince}
                  />
                )}

                {selectedCity && districtsForCity && (
                  <>
                    <GeoJSON
                      key={`dist-${selectedCity}-${districtStats.length}`}
                      data={districtsForCity as any}
                      style={styleDistrict as any}
                      onEachFeature={onEachDistrict}
                    />
                    <FitBounds geo={districtsForCity} />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Arsa sayısı</span>
              <div className="flex items-center gap-1.5">
                {COLOR_STOPS.map((stop, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="h-3 w-5 rounded-sm border border-slate-200" style={{ background: stop.color }} />
                    <span className="text-[11px] font-medium">
                      {stop.min === 0 ? '0' : i === COLOR_STOPS.length - 1 ? `${stop.min}+` : `${stop.min}+`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-900 text-sm">
                  {selectedCity ? `${selectedCity} İlçeleri` : 'En Yoğun İller'}
                </span>
              </div>

              {!selectedCity ? (
                <div className="divide-y divide-slate-100">
                  {topCities.map((s, i) => (
                    <button
                      key={s.city}
                      onClick={() => loadDistricts(s.city)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-slate-800 truncate">{s.city}</span>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{s.count.toLocaleString('tr-TR')}</span>
                    </button>
                  ))}
                  {topCities.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-slate-400">Veri yükleniyor…</div>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                  {districtStats.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-400">
                      {loading ? 'Yükleniyor…' : 'Bu il için ilçe bazlı veri yok.'}
                    </div>
                  ) : (
                    [...districtStats]
                      .sort((a, b) => b.count - a.count)
                      .map((d) => (
                        <a
                          key={d.district}
                          href={`/parcels?city=${encodeURIComponent(selectedCity!)}&district=${encodeURIComponent(d.district)}`}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="flex-1 text-sm font-medium text-slate-800 truncate">{d.district}</span>
                          <span className="text-sm font-bold text-slate-900 tabular-nums">{d.count.toLocaleString('tr-TR')}</span>
                        </a>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
