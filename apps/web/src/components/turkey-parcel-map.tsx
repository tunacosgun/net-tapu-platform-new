'use client';

import { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/api-client';
import { TURKEY_PROVINCES } from '@/data/turkey-paths';
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

function stripDiacritics(s: string): string {
  return s
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/i̇/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c');
}

function norm(s: string): string {
  return stripDiacritics(s.toLowerCase()).replace(/[\s\-_.]+/g, '').trim();
}

// GADM uses partial/alternate names for some provinces; map our DB names → GADM NAME_1
const GADM_ALIAS: Record<string, string> = {
  afyonkarahisar: 'Afyon',
  kahramanmaras: 'K.Maras',
  sanliurfa: 'Sanliurfa',
  kirikkale: 'Kinkkale', // GADM typo
  zonguldak: 'Zinguldak', // GADM typo
};

function gadmNameFor(city: string): string {
  return GADM_ALIAS[norm(city)] ?? city;
}

interface DistrictFeature {
  type: 'Feature';
  properties: { NAME_1: string; NAME_2: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: any };
}

interface DistrictPath {
  district: string;
  d: string;
  centroidX: number;
  centroidY: number;
}

function projectFeatures(features: DistrictFeature[], maxDim = 1000, pad = 16) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  function visit(coords: any) {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else for (const c of coords) visit(c);
  }
  features.forEach((f) => visit(f.geometry.coordinates));

  const lngSpan = maxLng - minLng || 1;
  const latSpan = maxLat - minLat || 1;
  const midLat = (minLat + maxLat) / 2;
  const lngScale = Math.cos((midLat * Math.PI) / 180);
  const aspect = (lngSpan * lngScale) / latSpan;
  let drawW: number, drawH: number;
  if (aspect >= 1) { drawW = maxDim; drawH = maxDim / aspect; }
  else { drawH = maxDim; drawW = maxDim * aspect; }
  const width = drawW + pad * 2;
  const height = drawH + pad * 2;
  const offsetX = pad;
  const offsetY = pad;

  function project(lng: number, lat: number): [number, number] {
    const x = offsetX + ((lng - minLng) / lngSpan) * drawW;
    const y = offsetY + ((maxLat - lat) / latSpan) * drawH;
    return [x, y];
  }

  function ringToPath(ring: any[]): string {
    return ring
      .map(([lng, lat]: number[], i: number) => {
        const [x, y] = project(lng, lat);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join('') + 'Z';
  }

  const paths: DistrictPath[] = features.map((f) => {
    const polys: any[][] =
      f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    const d = polys.map((poly) => poly.map(ringToPath).join('')).join('');
    // Centroid: average all ring vertices
    let sx = 0, sy = 0, n = 0;
    function collect(coords: any) {
      if (typeof coords[0] === 'number') {
        const [x, y] = project(coords[0], coords[1]);
        sx += x; sy += y; n++;
      } else for (const c of coords) collect(c);
    }
    collect(f.geometry.coordinates);
    return { district: f.properties.NAME_2, d, centroidX: sx / n, centroidY: sy / n };
  });
  return { paths, width, height };
}

export function TurkeyParcelMap() {
  const [cityStats, setCityStats] = useState<CityStat[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [districtStats, setDistrictStats] = useState<DistrictStat[]>([]);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [districtsGeo, setDistrictsGeo] = useState<{ features: DistrictFeature[] } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<CityStat[]>('/parcels/stats/by-city')
      .then((r) => {
        if (!cancelled) setCityStats(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => {
        if (!cancelled) setCityStats([]);
      });
    return () => { cancelled = true; };
  }, []);

  const countByCity = useMemo(() => {
    const m = new Map<string, number>();
    cityStats.forEach((s) => m.set(norm(s.city), s.count));
    return m;
  }, [cityStats]);

  const totalCount = useMemo(() => cityStats.reduce((sum, s) => sum + s.count, 0), [cityStats]);
  const topCities = useMemo(() => [...cityStats].sort((a, b) => b.count - a.count).slice(0, 12), [cityStats]);

  const countByDistrict = useMemo(() => {
    const m = new Map<string, number>();
    districtStats.forEach((s) => m.set(norm(s.district), s.count));
    return m;
  }, [districtStats]);

  function loadDistricts(city: string) {
    setSelectedCity(city);
    setDistrictLoading(true);
    setHoveredCity(null);
    setHoveredDistrict(null);
    setTooltipPos(null);
    apiClient
      .get<DistrictStat[]>(`/parcels/stats/by-district?city=${encodeURIComponent(city)}`)
      .then((r) => setDistrictStats(Array.isArray(r.data) ? r.data : []))
      .catch(() => setDistrictStats([]))
      .finally(() => setDistrictLoading(false));

    if (!districtsGeo && !geoLoading) {
      setGeoLoading(true);
      fetch('/geo/tr-districts.json')
        .then((r) => r.json())
        .then((g) => setDistrictsGeo(g))
        .catch(() => {})
        .finally(() => setGeoLoading(false));
    }
  }

  const districtProjection = useMemo(() => {
    if (!selectedCity || !districtsGeo) return null;
    const target = norm(gadmNameFor(selectedCity));
    const features = districtsGeo.features.filter(
      (f) => norm(f.properties.NAME_1) === target,
    );
    if (features.length === 0) return null;
    return projectFeatures(features, 1000, 16);
  }, [selectedCity, districtsGeo]);
  const districtPaths: DistrictPath[] = districtProjection?.paths ?? [];

  const hoveredCount = hoveredCity ? countByCity.get(norm(hoveredCity)) ?? 0 : 0;
  const hoveredDistrictCount = hoveredDistrict ? countByDistrict.get(norm(hoveredDistrict)) ?? 0 : 0;

  const showingDistricts = selectedCity && districtPaths.length > 0;

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
            Haritadan ile tıklayın, o ile ait ilçe bazlı dağılımı görün.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="relative">
              {showingDistricts && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCity(null);
                      setDistrictStats([]);
                      setHoveredDistrict(null);
                      setTooltipPos(null);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Türkiye
                  </button>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm">
                    {selectedCity}
                  </span>
                </div>
              )}

              <svg
                viewBox={
                  showingDistricts && districtProjection
                    ? `0 0 ${districtProjection.width} ${districtProjection.height}`
                    : '0 0 1005 490'
                }
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto select-none"
                onMouseLeave={() => {
                  setHoveredCity(null);
                  setHoveredDistrict(null);
                  setTooltipPos(null);
                }}
              >
                {!showingDistricts &&
                  TURKEY_PROVINCES.map((p) => {
                    const count = countByCity.get(norm(p.name)) ?? 0;
                    const isHovered = hoveredCity && norm(hoveredCity) === norm(p.name);
                    const isSelected = selectedCity && norm(selectedCity) === norm(p.name);
                    return (
                      <path
                        key={p.id}
                        d={p.d}
                        fill={colorFor(count)}
                        stroke={isSelected ? '#0f766e' : isHovered ? '#0d9488' : '#cbd5e1'}
                        strokeWidth={isSelected ? 1.8 : isHovered ? 1.4 : 0.6}
                        style={{ cursor: 'pointer', transition: 'fill 150ms ease, stroke 150ms ease' }}
                        onMouseEnter={(e) => {
                          setHoveredCity(p.name);
                          const bbox = (e.currentTarget as SVGPathElement).getBBox();
                          setTooltipPos({ x: bbox.x + bbox.width / 2, y: bbox.y });
                        }}
                        onClick={() => loadDistricts(p.name)}
                      />
                    );
                  })}

                {showingDistricts &&
                  districtPaths.map((p) => {
                    const count = countByDistrict.get(norm(p.district)) ?? 0;
                    const isHovered = hoveredDistrict && norm(hoveredDistrict) === norm(p.district);
                    return (
                      <path
                        key={p.district}
                        d={p.d}
                        fill={colorFor(count)}
                        stroke={isHovered ? '#0d9488' : '#94a3b8'}
                        strokeWidth={isHovered ? 1.4 : 0.7}
                        style={{ cursor: 'pointer', transition: 'fill 150ms ease, stroke 150ms ease' }}
                        onMouseEnter={(e) => {
                          setHoveredDistrict(p.district);
                          const bbox = (e.currentTarget as SVGPathElement).getBBox();
                          setTooltipPos({ x: bbox.x + bbox.width / 2, y: bbox.y });
                        }}
                        onClick={() => {
                          if (selectedCity) {
                            window.location.href = `/parcels?city=${encodeURIComponent(selectedCity)}&district=${encodeURIComponent(p.district)}`;
                          }
                        }}
                      />
                    );
                  })}

                {showingDistricts &&
                  districtPaths.map((p) => (
                    <text
                      key={`label-${p.district}`}
                      x={p.centroidX}
                      y={p.centroidY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        fill: '#0f172a',
                        pointerEvents: 'none',
                        paintOrder: 'stroke',
                        stroke: 'rgba(255,255,255,0.9)',
                        strokeWidth: 3,
                        strokeLinejoin: 'round',
                      }}
                    >
                      {p.district}
                    </text>
                  ))}
              </svg>

              {geoLoading && showingDistricts === false && selectedCity && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-slate-500 text-sm">
                  İlçe haritası yükleniyor…
                </div>
              )}

              {(hoveredCity || hoveredDistrict) && tooltipPos && (
                <div
                  className="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-md bg-slate-900 text-white text-xs shadow-lg whitespace-nowrap"
                  style={{
                    left: `${(tooltipPos.x / 1005) * 100}%`,
                    top: `${(tooltipPos.y / 490) * 100}%`,
                    transform: 'translate(-50%, calc(-100% - 6px))',
                  }}
                >
                  <div className="font-semibold">{hoveredDistrict || hoveredCity}</div>
                  <div className="text-emerald-300">
                    {(hoveredDistrict ? hoveredDistrictCount : hoveredCount)} arsa
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 backdrop-blur border border-slate-200 shadow-sm px-3 py-2 text-xs">
                <div className="text-slate-500 font-medium mb-1.5">Arsa sayısı</div>
                <div className="flex items-center gap-1.5">
                  {COLOR_STOPS.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span
                        className="inline-block h-3 w-4 rounded-sm border border-slate-200"
                        style={{ background: s.color }}
                      />
                      <span className="text-slate-600">{s.min === 0 ? '0' : `${s.min}+`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {!selectedCity ? (
              <>
                <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">En Yoğun İller</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {topCities.length === 0 && (
                    <div className="p-6 text-center text-sm text-slate-400">Henüz arsa kaydı yok.</div>
                  )}
                  {topCities.map((s, idx) => (
                    <button
                      key={s.city}
                      onClick={() => loadDistricts(s.city)}
                      onMouseEnter={() => setHoveredCity(s.city)}
                      onMouseLeave={() => setHoveredCity(null)}
                      className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-800 truncate">{s.city}</span>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-emerald-700">{s.count}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCity(null);
                      setDistrictStats([]);
                      setHoveredDistrict(null);
                      setTooltipPos(null);
                    }}
                    className="p-1 rounded hover:bg-white text-slate-600"
                    aria-label="Geri"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">İlçe Dağılımı</div>
                    <div className="text-sm font-bold text-slate-900 truncate">{selectedCity}</div>
                  </div>
                  <span className="ml-auto text-xs font-bold text-emerald-700">
                    {districtStats.reduce((s, d) => s + d.count, 0)} arsa
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {districtLoading && (
                    <div className="p-6 text-center text-sm text-slate-400">Yükleniyor…</div>
                  )}
                  {!districtLoading && districtStats.length === 0 && (
                    <div className="p-6 text-center text-sm text-slate-400">
                      Bu ilde aktif arsa kaydı yok.
                    </div>
                  )}
                  {!districtLoading &&
                    districtStats.map((d) => (
                      <a
                        key={d.district}
                        href={`/parcels?city=${encodeURIComponent(selectedCity!)}&district=${encodeURIComponent(d.district)}`}
                        onMouseEnter={() => setHoveredDistrict(d.district)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-800 truncate">{d.district}</span>
                        <span className="text-sm font-bold text-emerald-700">{d.count}</span>
                      </a>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
