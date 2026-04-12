'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, MapPin, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import apiClient from '@/lib/api-client';

const CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin',
  'Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa',
  'Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ',
  'Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari',
  'Hatay','Isparta','Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri',
  'Kırklareli','Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa',
  'Kahramanmaraş','Mardin','Muğla','Muş','Nevşehir','Niğde','Ordu','Rize',
  'Sakarya','Samsun','Siirt','Sinop','Sivas','Tekirdağ','Tokat','Trabzon',
  'Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak','Aksaray','Bayburt',
  'Karaman','Kırıkkale','Batman','Şırnak','Bartın','Ardahan','Iğdır','Yalova',
  'Karabük','Kilis','Osmaniye','Düzce',
];

interface TkgmResult {
  responseData?: {
    areaM2?: number;
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
    boundary?: { type: string; coordinates: unknown };
    parselNo?: string;
    adaNo?: string;
    nitelik?: string;
  };
  boundary?: { type: string; coordinates: unknown };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TkgmParselSorgula({ open, onClose }: Props) {
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ada, setAda] = useState('');
  const [parsel, setParsel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TkgmResult | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const canQuery = !!(city && district && ada && parsel);

  // Init Leaflet map
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current || cancelled) return;

      const linkId = 'leaflet-css-tkgm';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      import('leaflet').then((L) => {
        if (cancelled || !mapContainerRef.current || mapRef.current) return;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        leafletRef.current = L;
        const map = L.map(mapContainerRef.current).setView([39.0, 35.0], 6);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        setMapReady(true);
      });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open]);

  // Cleanup map when modal closes
  useEffect(() => {
    if (!open && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      leafletRef.current = null;
      polygonRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    }
  }, [open]);

  // Draw boundary when result arrives
  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;

    // Clear previous
    if (polygonRef.current) { map.removeLayer(polygonRef.current); polygonRef.current = null; }
    if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }

    const boundary = result?.responseData?.boundary || result?.boundary;
    const rd = result?.responseData;

    if (boundary && (boundary as any).coordinates) {
      try {
        const geoLayer = L.geoJSON(boundary, {
          style: {
            color: '#059669',
            weight: 3,
            fillColor: '#059669',
            fillOpacity: 0.2,
          },
        }).addTo(map);
        polygonRef.current = geoLayer;
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      } catch {}
    } else if (rd?.latitude && rd?.longitude) {
      const lat = Number(rd.latitude);
      const lng = Number(rd.longitude);
      const marker = L.marker([lat, lng]).addTo(map);
      markerRef.current = marker;
      map.setView([lat, lng], 16);
    }
  }, [result, mapReady]);

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!canQuery) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await apiClient.post<TkgmResult>('/integrations/tkgm/public-lookup', {
        city, district, ada, parsel,
      });
      setResult(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'TKGM sorgusu başarısız. Bilgileri kontrol edip tekrar deneyin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const rd = result?.responseData;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              TKGM Parsel Sorgulama
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ada/parsel numarasıyla tapu kadastro bilgilerini ve haritasını görün</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left panel — form + results */}
          <div className="w-full lg:w-80 shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-100">
            <form onSubmit={handleQuery} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">İl *</label>
                <select
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setDistrict(''); }}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="">İl seçin</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">İlçe *</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="örn. Kepez"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Ada No *</label>
                  <input
                    type="text"
                    value={ada}
                    onChange={(e) => setAda(e.target.value)}
                    placeholder="örn. 123"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Parsel No *</label>
                  <input
                    type="text"
                    value={parsel}
                    onChange={(e) => setParsel(e.target.value)}
                    placeholder="örn. 45"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!canQuery || loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sorgulanıyor...</>
                ) : (
                  <><Search className="h-4 w-4" /> TKGM'den Sorgula</>
                )}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Result info */}
            {rd && (
              <div className="px-5 pb-5 space-y-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-xs font-bold text-emerald-700 mb-2.5 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    Parsel Bilgileri Bulundu
                  </p>
                  <div className="space-y-2">
                    {rd.adaNo && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Ada / Parsel</span>
                        <span className="font-mono font-bold text-slate-800">{rd.adaNo} / {rd.parselNo}</span>
                      </div>
                    )}
                    {rd.areaM2 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Yüzölçüm</span>
                        <span className="font-bold text-slate-800">{Number(rd.areaM2).toLocaleString('tr-TR')} m²</span>
                      </div>
                    )}
                    {rd.nitelik && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Nitelik</span>
                        <span className="font-bold text-slate-800">{rd.nitelik}</span>
                      </div>
                    )}
                    {rd.neighborhood && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Mahalle</span>
                        <span className="font-bold text-slate-800">{rd.neighborhood}</span>
                      </div>
                    )}
                    {rd.latitude && rd.longitude && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Koordinat</span>
                        <span className="font-mono text-slate-600">{Number(rd.latitude).toFixed(4)}, {Number(rd.longitude).toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={`/parcels?search=${encodeURIComponent(`${ada}/${parsel}`)}`}
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-emerald-200 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  Bu parseli platformda ara <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Info box */}
            <div className="mx-5 mb-5 rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs text-blue-700 font-semibold mb-1">Nasıl kullanılır?</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                İl, ilçe, ada ve parsel numarasını girerek TKGM'den resmi kadastro bilgilerini çekin.
                Parsel sınırı haritada yeşil olarak gösterilir.
              </p>
            </div>
          </div>

          {/* Right panel — map */}
          <div className="flex-1 relative min-h-[350px] lg:min-h-0 bg-slate-50">
            <div ref={mapContainerRef} className="absolute inset-0" />

            {/* Map overlay — before query */}
            {!result && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-sm pointer-events-none">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Ada/parsel bilgilerini girin</p>
                  <p className="text-xs text-slate-400 mt-1">Sorgulama sonrası parsel sınırı burada görünecek</p>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-600">TKGM sorgulanıyor...</p>
                  <p className="text-xs text-slate-400">Kadastro verileri çekiliyor</p>
                </div>
              </div>
            )}

            {/* Attribution */}
            <div className="absolute bottom-2 left-2 z-10 rounded-lg bg-white/90 backdrop-blur px-2 py-1">
              <p className="text-[10px] text-slate-500">Kaynak: TKGM · © OpenStreetMap</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
