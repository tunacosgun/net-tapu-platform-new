'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { formatPrice, resolveImageUrl } from '@/lib/format';
import { Badge, LoadingState } from '@/components/ui';
import { parcelStatusConfig } from '@/components/ui/badge';
import { ShareButtons } from '@/components/share-buttons';
import { CallMeForm } from '@/components/call-me-form';
import { AppointmentForm } from '@/components/appointment-form';
import { useViewerTracking } from '@/hooks/use-viewer-tracking';
import { useAuthStore } from '@/stores/auth-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { getWatermarkedUrl } from '@/lib/watermark';
import type { Parcel, ParcelImage } from '@/types';
import {
  Heart, Search as SearchIcon, ExternalLink, MapPin, Maximize2,
  Calendar, Clock, FileText, ChevronLeft, ChevronRight, X,
  Download, Printer, Share2, Phone, Bell, ImageIcon, Loader2,
  Landmark, TreePine, Ruler, Tag, Eye, Building2, MessageCircle, User,
} from 'lucide-react';

/* ─────────────────────── PDF Export ─────────────────────── */
async function loadFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 800, h: 600 });
    img.src = dataUrl;
  });
}

async function generatePDF(parcel: Parcel, images: ParcelImage[], siteSettings: Record<string, string>) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210;
  const ph = 297;
  const margin = 18;
  const cw = pw - margin * 2;

  const siteName = siteSettings.site_title || 'NetTapu';
  const siteDesc = siteSettings.site_description || 'Gayrimenkul ve Arsa Platformu';

  let fontFamily = 'helvetica';
  try {
    const [regularB64, boldB64] = await Promise.all([
      loadFontAsBase64('/fonts/NotoSans-Regular.ttf'),
      loadFontAsBase64('/fonts/NotoSans-Bold.ttf'),
    ]);
    doc.addFileToVFS('NotoSans-Regular.ttf', regularB64);
    doc.addFileToVFS('NotoSans-Bold.ttf', boldB64);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    fontFamily = 'NotoSans';
    doc.setFont('NotoSans', 'normal');
  } catch (e) {
    console.warn('Font loading failed, using helvetica:', e);
  }

  const dark: [number, number, number] = [30, 41, 59];
  const medium: [number, number, number] = [71, 85, 105];
  const light: [number, number, number] = [148, 163, 184];
  const veryLight: [number, number, number] = [241, 245, 249];
  const brand: [number, number, number] = [22, 163, 74];

  function addWatermark() {
    const gState = new (doc as any).GState({ opacity: 0.04 });
    doc.saveGraphicsState();
    (doc as any).setGState(gState);
    doc.setTextColor(150, 160, 170);
    doc.setFontSize(56);
    doc.setFont(fontFamily, 'bold');
    for (let wy = 40; wy < ph + 20; wy += 60) {
      for (let wx = -30; wx < pw + 30; wx += 120) {
        doc.text(siteName, wx, wy, { angle: 30 } as any);
      }
    }
    doc.restoreGraphicsState();
  }

  function addFooter(pageNum: number, totalPages: number) {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 280, pw - margin, 280);
    doc.setFontSize(6.5);
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(...light);
    doc.text(`Bu belge ${siteName} platformu tarafından otomatik olarak oluşturulmuştur. Bilgilendirme amaçlıdır, hukuki bağlayıcılığı yoktur.`, margin, 284);
    const phone = siteSettings.contact_phone || '0850 XXX XX XX';
    const email = siteSettings.contact_email || '';
    doc.text([phone, email].filter(Boolean).join('  ·  '), margin, 288);
    doc.text(`Sayfa ${pageNum} / ${totalPages}`, pw - margin, 288, { align: 'right' });
  }

  let y = margin;

  doc.setTextColor(...dark);
  doc.setFontSize(16);
  doc.setFont(fontFamily, 'bold');
  doc.text(siteName, margin, y + 5);
  doc.setFontSize(7);
  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(...medium);
  doc.text(siteDesc, margin, y + 10);
  doc.setFontSize(9);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(...dark);
  doc.text(parcel.listingId || '', pw - margin, y + 5, { align: 'right' });
  doc.setFontSize(7);
  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(...light);
  const dateStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(dateStr, pw - margin, y + 10, { align: 'right' });

  y += 14;
  doc.setDrawColor(...brand);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pw - margin, y);
  y += 10;

  doc.setTextColor(...dark);
  doc.setFontSize(18);
  doc.setFont(fontFamily, 'bold');
  const titleLines = doc.splitTextToSize(parcel.title || '', cw);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7.5 + 2;

  doc.setFontSize(9.5);
  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(...medium);
  doc.text([parcel.city, parcel.district, parcel.neighborhood].filter(Boolean).join(', '), margin, y);
  y += 10;

  doc.setFontSize(7.5);
  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(...medium);
  doc.text('SATIŞ FİYATI', margin, y);
  y += 8;
  doc.setFontSize(20);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(...brand);
  doc.text(formatPrice(parcel.price) || 'Fiyat Belirtilmemiş', margin, y);
  y += 6;
  if (parcel.price && parcel.areaM2) {
    const ppm2 = Math.round(parseFloat(parcel.price) / parseFloat(parcel.areaM2));
    doc.setFontSize(9);
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(...medium);
    doc.text(`m² Fiyatı: ${formatPrice(String(ppm2))} / m²`, margin, y);
    y += 5;
  }
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  doc.setTextColor(...dark);
  doc.setFontSize(11);
  doc.setFont(fontFamily, 'bold');
  doc.text('Arsa Bilgileri', margin, y);
  y += 7;

  const details: [string, string][] = [];
  if (parcel.areaM2) details.push(['Alan', `${Number(parcel.areaM2).toLocaleString('tr-TR')} m²`]);
  if (parcel.ada) details.push(['Ada No', parcel.ada]);
  if (parcel.parsel) details.push(['Parsel No', parcel.parsel]);
  if (parcel.zoningStatus) details.push(['İmar Durumu', parcel.zoningStatus]);
  if (parcel.landType) details.push(['Arazi Türü', parcel.landType]);
  details.push(['İl', parcel.city || '']);
  details.push(['İlçe', parcel.district || '']);
  if (parcel.neighborhood) details.push(['Mahalle', parcel.neighborhood]);
  if (parcel.address) details.push(['Adres', parcel.address]);
  details.push(['Durum', parcel.status === 'active' ? 'Satışta' : parcel.status === 'sold' ? 'Satıldı' : parcel.status === 'draft' ? 'Taslak' : parcel.status]);
  if (parcel.isAuctionEligible) details.push(['Açık Artırma', 'Uygun']);
  if (parcel.isFeatured) details.push(['Öne Çıkan', 'Evet']);

  const colW = cw / 2;
  for (let i = 0; i < details.length; i += 2) {
    if (Math.floor(i / 2) % 2 === 0) {
      doc.setFillColor(...veryLight);
      doc.rect(margin, y - 4, cw, 7.5, 'F');
    }
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(...medium);
    doc.text(details[i][0], margin + 3, y);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(...dark);
    doc.text(details[i][1], margin + 36, y);
    if (i + 1 < details.length) {
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(...medium);
      doc.text(details[i + 1][0], margin + colW + 3, y);
      doc.setFont(fontFamily, 'bold');
      doc.setTextColor(...dark);
      doc.text(details[i + 1][1], margin + colW + 36, y);
    }
    y += 7.5;
  }
  y += 6;

  if (parcel.description) {
    doc.setTextColor(...dark);
    doc.setFontSize(11);
    doc.setFont(fontFamily, 'bold');
    doc.text('Açıklama', margin, y);
    y += 6;
    doc.setFontSize(8.5);
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(...medium);
    const descLines = doc.splitTextToSize(parcel.description, cw);
    doc.text(descLines.slice(0, 10), margin, y);
    y += Math.min(descLines.length, 10) * 4 + 6;
  }

  const maxImgW = cw;
  const maxImgH = 55;
  const imagesToShow = images.slice(0, 3);

  for (let imgIdx = 0; imgIdx < imagesToShow.length; imgIdx++) {
    try {
      const imgUrl = resolveImageUrl(imagesToShow[imgIdx]);
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const dim = await getImageDimensions(dataUrl);
      let dispW = maxImgW;
      let dispH = (dim.h / dim.w) * dispW;
      if (dispH > maxImgH) {
        dispH = maxImgH;
        dispW = (dim.w / dim.h) * dispH;
      }

      if (y + dispH + 8 > 275) { doc.addPage(); y = margin; }
      if (imgIdx === 0) {
        doc.setTextColor(...dark);
        doc.setFontSize(11);
        doc.setFont(fontFamily, 'bold');
        doc.text('Görseller', margin, y);
        y += 5;
      }

      const imgX = margin + (cw - dispW) / 2;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(imgX - 0.5, y - 0.5, dispW + 1, dispH + 1, 'S');
      doc.addImage(dataUrl, 'JPEG', imgX, y, dispW, dispH, undefined, 'MEDIUM');
      y += dispH + 5;
    } catch {
      // skip
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addWatermark();
    addFooter(i, pageCount);
  }

  doc.save(`${siteName}_${parcel.listingId || parcel.id}_Arsa_Raporu.pdf`);
}

/* ─────────────────────── Consultant type ─────────────────────── */
interface ConsultantInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

/* ─────────────────────── Component ─────────────────────── */
export default function ParcelDetailClient() {
  const params = useParams<{ id: string }>();
  const parcelId = params.id;
  const { isAuthenticated } = useAuthStore();
  const siteSettings = useSiteSettings();

  const siteName = siteSettings.site_title || 'NetTapu';

  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [images, setImages] = useState<ParcelImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCallMe, setShowCallMe] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favToggling, setFavToggling] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [lightboxFullscreen, setLightboxFullscreen] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [wmImages, setWmImages] = useState<Record<number, string>>({});
  const [consultant, setConsultant] = useState<ConsultantInfo | null>(null);

  const liveViewerCount = useViewerTracking(parcelId);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [parcelRes, imagesRes] = await Promise.all([
          apiClient.get<Parcel>(`/parcels/${parcelId}`),
          apiClient.get<ParcelImage[]>(`/parcels/${parcelId}/images`).catch(() => ({ data: [] as ParcelImage[] })),
        ]);
        if (!cancelled) {
          setParcel(parcelRes.data);
          setImages(imagesRes.data);
          setLoading(false);
          // Fetch consultant if assigned
          if (parcelRes.data.assignedConsultant) {
            apiClient.get<ConsultantInfo>(`/users/${parcelRes.data.assignedConsultant}/profile`)
              .then(({ data }) => { if (!cancelled) setConsultant(data); })
              .catch(() => {});
          }
        }
      } catch {
        if (!cancelled) { setError('Arsa bilgisi yüklenemedi.'); setLoading(false); }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [parcelId]);

  useEffect(() => {
    if (!images.length || !siteName) return;
    let cancelled = false;
    images.forEach((img, idx) => {
      const url = resolveImageUrl(img);
      getWatermarkedUrl(url, siteName).then((wmUrl) => {
        if (!cancelled) setWmImages((prev) => ({ ...prev, [idx]: wmUrl }));
      });
    });
    return () => { cancelled = true; };
  }, [images, siteName]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.get<{ id: string; parcelId: string }[]>('/favorites')
      .then(({ data }) => { if (data.find((f) => f.parcelId === parcelId)) setIsFavorited(true); })
      .catch(() => {});
  }, [isAuthenticated, parcelId]);

  useEffect(() => {
    if (parcel) {
      document.title = `${parcel.title} - ${parcel.city}, ${parcel.district} | ${siteName}`;
      const jsonLd = {
        '@context': 'https://schema.org', '@type': 'RealEstateListing',
        name: parcel.title,
        description: parcel.description || `${parcel.city}, ${parcel.district} konumunda arsa`,
        url: window.location.href,
        ...(parcel.price && { offers: { '@type': 'Offer', price: parseFloat(parcel.price), priceCurrency: parcel.currency || 'TRY' } }),
        ...(parcel.latitude && parcel.longitude && { geo: { '@type': 'GeoCoordinates', latitude: parseFloat(parcel.latitude), longitude: parseFloat(parcel.longitude) } }),
        address: { '@type': 'PostalAddress', addressLocality: parcel.district, addressRegion: parcel.city, addressCountry: 'TR' },
      };
      let script = document.getElementById('json-ld-parcel') as HTMLScriptElement;
      if (!script) { script = document.createElement('script'); script.id = 'json-ld-parcel'; script.type = 'application/ld+json'; document.head.appendChild(script); }
      script.textContent = JSON.stringify(jsonLd);
      return () => { script.remove(); };
    }
  }, [parcel, siteName]);

  const toggleFavorite = useCallback(async () => {
    if (!isAuthenticated || favToggling) return;
    setFavToggling(true);
    try {
      if (isFavorited) {
        const { data } = await apiClient.get<{ id: string; parcelId: string }[]>('/favorites');
        const fav = data.find((f) => f.parcelId === parcelId);
        if (fav) await apiClient.delete(`/favorites/${fav.id}`);
        setIsFavorited(false);
      } else {
        await apiClient.post('/favorites', { parcelId });
        setIsFavorited(true);
      }
    } catch {} finally { setFavToggling(false); }
  }, [isAuthenticated, isFavorited, favToggling, parcelId]);

  const handlePDF = async () => {
    if (!parcel || pdfLoading) return;
    setPdfLoading(true);
    try {
      await generatePDF(parcel, images, siteSettings as unknown as Record<string, string>);
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleOfferSubmit = async () => {
    if (!offerAmount || offerSubmitting || !parcel) return;
    setOfferSubmitting(true);
    try {
      await apiClient.post('/crm/offers', {
        parcelId: parcel.id,
        amount: offerAmount.replace(/\./g, '').replace(',', '.'),
        message: offerMessage || undefined,
      });
      alert('Teklifiniz başarıyla gönderildi!');
      setShowOffer(false);
      setOfferAmount('');
      setOfferMessage('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Teklif gönderilemedi. Lütfen giriş yapın.';
      alert(msg);
    } finally {
      setOfferSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><LoadingState centered={false} /></div>;
  if (error || !parcel) return <div className="flex min-h-[400px] flex-col items-center justify-center gap-4"><p className="text-red-600">{error || 'Arsa bulunamadı.'}</p><Link href="/parcels" className="text-sm text-brand-500 hover:underline">Arsalara dön</Link></div>;

  const status = parcelStatusConfig(parcel.status);
  const whatsappNumber = siteSettings.whatsapp_number || '905000000000';
  const parcelUrl = `https://nettapu-demo.tunasoft.tech/parcels/${parcel.id}`;
  const wpLines: string[] = [];
  wpLines.push('Merhaba,');
  wpLines.push('A\u015Fa\u011F\u0131daki ilan hakk\u0131nda detayl\u0131 bilgi almak istiyorum.');
  wpLines.push('');
  wpLines.push('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  if (parcel.listingId) wpLines.push('\u0130lan No: ' + parcel.listingId);
  wpLines.push(parcel.title);
  if (parcel.city && parcel.district) wpLines.push('Konum: ' + parcel.city + ', ' + parcel.district);
  if (parcel.ada && parcel.parsel) wpLines.push('Ada / Parsel: ' + parcel.ada + ' / ' + parcel.parsel);
  if (parcel.areaM2) wpLines.push('Alan: ' + Number(parcel.areaM2).toLocaleString('tr-TR') + ' m\u00B2');
  if (parcel.price) wpLines.push('Fiyat: ' + parseFloat(parcel.price).toLocaleString('tr-TR') + ' \u20BA');
  wpLines.push('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  wpLines.push('');
  wpLines.push(parcelUrl);
  const whatsappMessage = encodeURIComponent(wpLines.join('\n'));
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const tkgmBaseUrl = 'https://parselsorgu.tkgm.gov.tr';
  const pricePerM2 = parcel.pricePerM2
    ? Math.round(parseFloat(parcel.pricePerM2))
    : (parcel.price && parcel.areaM2 ? Math.round(parseFloat(parcel.price) / parseFloat(parcel.areaM2)) : null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 print:px-0 print:py-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 print:hidden mb-4">
        <Link href="/" className="hover:text-brand-500">Ana Sayfa</Link>
        <span className="text-slate-400">&gt;</span>
        <Link href="/parcels" className="hover:text-brand-500">Arsalar</Link>
        <span className="text-slate-400">&gt;</span>
        <Link href={`/parcels?city=${parcel.city}`} className="hover:text-brand-500">{parcel.city}</Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-900 font-medium truncate max-w-[200px]">{parcel.title}</span>
      </nav>

      {/* Lightbox */}
      {selectedImage && (
        <LightboxOverlay
          images={images}
          wmImages={wmImages}
          selectedIdx={selectedIdx}
          selectedImage={selectedImage}
          title={parcel.title}
          siteName={siteName}
          onClose={() => { setSelectedImage(null); setLightboxFullscreen(false); if (document.fullscreenElement) document.exitFullscreen(); }}
          onNavigate={(idx) => { setSelectedIdx(idx); setSelectedImage(wmImages[idx] || resolveImageUrl(images[idx])); }}
        />
      )}

      {/* Title + action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold sm:text-2xl leading-tight text-slate-900 uppercase">{parcel.title}</h1>
        <div className="flex items-center gap-2 print:hidden shrink-0">
          {isAuthenticated && (
            <button onClick={toggleFavorite} disabled={favToggling} title="Favorilerime Ekle"
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${isFavorited ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200'}`}
            >
              <Heart className="h-3.5 w-3.5" fill={isFavorited ? 'currentColor' : 'none'} />
              {isFavorited ? 'Favorilerde' : 'Favorilere Ekle'}
            </button>
          )}
          <button onClick={handlePDF} disabled={pdfLoading} title="Yazdır"
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
            Yazdır
          </button>
        </div>
      </div>

      {/* ─── MAIN LAYOUT: 3-column on desktop ─── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* LEFT COLUMN: Photo gallery (spans 5 cols) */}
        <div className="lg:col-span-5">
          {images.length > 0 ? (
            <div>
              <div
                className="relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                style={{ height: '380px' }}
                onClick={() => { setSelectedImage(wmImages[selectedIdx] || resolveImageUrl(images[selectedIdx])); }}
              >
                <img
                  src={wmImages[selectedIdx] || resolveImageUrl(images[selectedIdx])}
                  alt={parcel.title}
                  className="h-full w-full object-cover"
                />
                <Badge variant={status.variant} className="absolute top-3 left-3 text-xs px-2.5 py-1 shadow">{status.label}</Badge>
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-white text-xs backdrop-blur-sm cursor-pointer">
                  <SearchIcon className="h-3.5 w-3.5" />
                  Buyuk Fotograf
                </div>
              </div>

              {images.length > 1 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedIdx(idx)}
                      className={`shrink-0 h-16 w-20 rounded overflow-hidden border-2 transition-all ${selectedIdx === idx ? 'border-brand-500' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
                    >
                      <img src={wmImages[idx] || resolveImageUrl(img)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1 text-center text-xs text-slate-500">{selectedIdx + 1}/{images.length} Fotograf</p>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50" style={{ height: '380px' }}>
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">Henuz fotograf eklenmemis</p>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE COLUMN: Price + details table (spans 4 cols) */}
        <div className="lg:col-span-4">
          {/* Price section */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 mb-4">
            <p className="text-2xl font-bold text-brand-600">{formatPrice(parcel.price)}</p>
            {pricePerM2 && (
              <p className="text-sm text-slate-500 mt-1">m² fiyati: {formatPrice(String(pricePerM2))} / m²</p>
            )}
            <p className="text-sm font-medium text-brand-600 mt-2">
              <MapPin className="inline h-3.5 w-3.5 mr-1" />
              {parcel.city} / {parcel.district}{parcel.neighborhood ? ` / ${parcel.neighborhood}` : ''}
            </p>
          </div>

          {/* Details table - sahibinden style */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
              <h2 className="text-sm font-bold text-slate-900">Ilan Bilgileri</h2>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <DetailRow label="Ilan No" value={parcel.listingId || '-'} highlight />
                {parcel.listedAt && parcel.showListingDate !== false && <DetailRow label="Ilan Tarihi" value={new Date(parcel.listedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })} />}
                <DetailRow label="Emlak Tipi" value="Satilik Arsa" highlight={!parcel.listedAt} />
                {parcel.zoningStatus && <DetailRow label="Imar Durumu" value={parcel.zoningStatus} />}
                {parcel.areaM2 && <DetailRow label="m²" value={`${Number(parcel.areaM2).toLocaleString('tr-TR')}`} />}
                {pricePerM2 && <DetailRow label="m² Fiyati" value={formatPrice(String(pricePerM2))} />}
                {parcel.ada && <DetailRow label="Ada No" value={parcel.ada} />}
                {parcel.parsel && <DetailRow label="Parsel No" value={parcel.parsel} />}
                {parcel.landType && <DetailRow label="Arazi Turu" value={parcel.landType} />}
                {parcel.isAuctionEligible && <DetailRow label="Acik Artirma" value="Uygun" />}
                {parcel.isFeatured && <DetailRow label="One Cikan" value="Evet" />}
              </tbody>
            </table>
          </div>

          {/* Favorite / viewer counts */}
          {((parcel.favoriteCount ?? 0) > 0 || liveViewerCount > 0) && (
            <div className="mt-3 flex gap-2 text-xs print:hidden">
              {(parcel.favoriteCount ?? 0) > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-600 font-medium">
                  <Heart className="h-3 w-3" fill="currentColor" />
                  {parcel.favoriteCount} favori
                </span>
              )}
              {liveViewerCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-600 font-medium">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" /></span>
                  {liveViewerCount} kisi bakiyor
                </span>
              )}
            </div>
          )}

          {/* TKGM & E-Kent box */}
          {(parcel.ada || parcel.city) && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 print:hidden">
              {parcel.ada && parcel.parsel && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-slate-700">Ada: {parcel.ada} / Parsel: {parcel.parsel}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Ada: ${parcel.ada}, Parsel: ${parcel.parsel}`);
                    }}
                    className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Kopyala"
                  >
                    Kopyala
                  </button>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-3">
                <a href={tkgmBaseUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-all duration-150 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  TKGM Parsel Sorgu
                </a>
                {parcel.city && (
                  <a href={`https://kentrehberi.${parcel.city.toLocaleLowerCase('tr').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g')}.bel.tr`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-all duration-150 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    E-Kent / Kent Rehberi
                  </a>
                )}
              </div>
              {parcel.ada && parcel.parsel && (
                <p className="mt-1.5 text-[10px] text-slate-400">TKGM sitesinde Idari sekmesinden il/ilce/mahalle secip yukaridaki ada ve parsel numaralarini girin.</p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Consultant card + Contact sidebar (spans 3 cols) */}
        <div className="lg:col-span-3 print:hidden">
          <div className="sticky top-20 space-y-4">

            {/* Consultant Card */}
            {consultant && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  {consultant.avatarUrl ? (
                    <img src={consultant.avatarUrl} alt={`${consultant.firstName} ${consultant.lastName}`} className="h-14 w-14 rounded-full object-cover border-2 border-slate-200" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-lg font-bold border-2 border-brand-200">
                      {consultant.firstName?.[0]}{consultant.lastName?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{consultant.firstName} {consultant.lastName}</p>
                    <p className="text-xs text-slate-500">Gayrimenkul Danismani</p>
                  </div>
                </div>
                {consultant.phone && (
                  <a href={`tel:${consultant.phone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors mb-2"
                  >
                    <Phone className="h-4 w-4" />
                    {consultant.phone}
                  </a>
                )}
                <button
                  onClick={() => setShowCallMe(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors mb-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Mesaj Gonder
                </button>
                <Link
                  href={`/parcels?consultant=${consultant.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Tum Ilanlari
                </Link>
              </div>
            )}

            {/* Contact sidebar */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-center mb-4">
                {siteSettings.site_logo ? (
                  <img src={siteSettings.site_logo} alt={siteName} className="h-8 w-auto opacity-80" />
                ) : (
                  <img src="/images/nettapu-logo.svg" alt={siteName} className="h-8 w-auto opacity-80" />
                )}
              </div>

              <button
                onClick={() => setShowCallMe(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm mb-2"
              >
                <Phone className="h-4 w-4" />
                Sizi Arayalim
              </button>

              <button
                onClick={() => setShowAppointment(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors mb-2"
              >
                <Calendar className="h-4 w-4" />
                Online Randevu Al
              </button>

              {parcel.status === 'active' && (
                <button
                  onClick={() => isAuthenticated ? setShowOffer(true) : alert('Teklif vermek icin giris yapmaniz gerekiyor.')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm mb-2"
                >
                  <Tag className="h-4 w-4" />
                  Teklif Ver
                </button>
              )}

              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1fb855] transition-colors shadow-sm mb-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                WhatsApp ile Iletisim
              </a>

              {siteSettings.contact_phone && (
                <a href={`tel:${siteSettings.contact_phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors mb-2"
                >
                  <Phone className="h-4 w-4" />
                  {siteSettings.contact_phone}
                </a>
              )}

              {parcel.status === 'active' && (
                <>
                  <div className="h-px bg-slate-200 my-2" />
                  <button onClick={async () => { try { await apiClient.post(`/parcels/${parcel.id}/price-alert`, {}); alert('Fiyat dusus bildirimi aktif edildi!'); } catch { alert('Giris yapmaniz gerekiyor.'); } }}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Bell className="h-3.5 w-3.5 text-amber-500" />
                    Fiyat Dusunce Haber Ver
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Below: Description + Tags + Share ─── */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-9 space-y-6">
          {/* Description */}
          {parcel.description && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Aciklama</h2>
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{parcel.description}</p>
            </div>
          )}

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {parcel.isAuctionEligible && (
              <span className="flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700">
                Acik Artirmaya Uygun
              </span>
            )}
            {parcel.isFeatured && (
              <span className="flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-4 py-2 text-sm font-medium text-yellow-700">
                One Cikan Ilan
              </span>
            )}
          </div>

          {/* Share */}
          <div className="print:hidden">
            <ShareButtons
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={`${parcel.title} - ${siteName}`}
              description={`${parcel.city}, ${parcel.district} - ${formatPrice(parcel.price)}`}
              extraInfo={[
                parcel.city && parcel.district ? `${parcel.city}, ${parcel.district}` : '',
                parcel.ada && parcel.parsel ? `Ada: ${parcel.ada} / Parsel: ${parcel.parsel}` : '',
                parcel.areaM2 ? `Alan: ${Number(parcel.areaM2).toLocaleString('tr-TR')} m²` : '',
                parcel.price ? `Fiyat: ${formatPrice(parcel.price)}` : '',
              ].filter(Boolean).join('\n')}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCallMe && (
        <CallMeForm parcelId={parcel.id} parcelTitle={parcel.title} parcelListingId={parcel.listingId} onClose={() => setShowCallMe(false)} />
      )}

      {showAppointment && (
        <AppointmentForm parcelId={parcel.id} parcelTitle={parcel.title} onClose={() => setShowAppointment(false)} />
      )}

      {/* Offer Modal */}
      {showOffer && parcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowOffer(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Teklif Ver</h3>
              <button onClick={() => setShowOffer(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer transition-colors duration-150">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-1">
              <span className="font-medium text-slate-900">{parcel.title}</span>
            </p>
            {parcel.price && (
              <p className="text-sm text-slate-500 mb-4">
                Ilan fiyati: <span className="font-bold text-brand-500">{formatPrice(parcel.price)}</span>
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900">Teklif Tutari (TL) *</label>
                <input
                  type="text"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="Orn: 5000000"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900">Mesajiniz (opsiyonel)</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Teklifinizle ilgili bir not ekleyebilirsiniz..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm resize-none focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                onClick={handleOfferSubmit}
                disabled={!offerAmount || offerSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {offerSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gonderiliyor...
                  </span>
                ) : (
                  'Teklif Gonder'
                )}
              </button>
            </div>

            <p className="mt-3 text-[10px] text-center text-slate-400">
              Teklifiniz degerlendirilecek ve size en kisa surede donus yapilacaktir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Lightbox overlay ─── */
function LightboxOverlay({
  images, wmImages, selectedIdx, selectedImage, title, siteName,
  onClose, onNavigate,
}: {
  images: ParcelImage[];
  wmImages: Record<number, string>;
  selectedIdx: number;
  selectedImage: string;
  title: string;
  siteName: string;
  onClose: () => void;
  onNavigate: (idx: number) => void;
}) {
  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    const next = (selectedIdx + 1) % images.length;
    onNavigate(next);
  }, [images, selectedIdx, onNavigate]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    const prev = (selectedIdx - 1 + images.length) % images.length;
    onNavigate(prev);
  }, [images, selectedIdx, onNavigate]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  return (
    <div
      id="nettapu-lightbox"
      className="fixed inset-0 z-[100] flex flex-col print:hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex items-center justify-between px-5 py-2.5 shrink-0 z-10">
        <span className="text-sm font-medium truncate text-white/90 max-w-[50%]">{title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const el = document.getElementById('nettapu-lightbox');
              if (!el) return;
              if (document.fullscreenElement) document.exitFullscreen();
              else el.requestFullscreen().catch(() => {});
            }}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <Maximize2 className="h-4 w-4" />
            Tam ekran
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            Kapat
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center min-h-0 z-10 px-4">
        {images.length > 1 && (
          <button className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white/70 hover:bg-black/70 hover:text-white z-10 transition-all cursor-pointer" onClick={goPrev}>
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url(${selectedImage})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            margin: '8px 72px',
          }}
          draggable={false}
        />

        {images.length > 1 && (
          <button className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white/70 hover:bg-black/70 hover:text-white z-10 transition-all cursor-pointer" onClick={goNext}>
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>

      <div className="relative flex items-center justify-center py-2.5 z-10">
        <span className="text-sm text-white">
          <span className="font-bold">{selectedIdx + 1}/{images.length}</span>
          <span className="ml-4 text-white/50 uppercase text-xs tracking-wider">{title}</span>
        </span>
      </div>
    </div>
  );
}

/* ─── Detail Row component ─── */
function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? 'bg-slate-50' : 'bg-white'}>
      <td className="border-b border-slate-200 px-3 py-2 font-medium text-slate-500 w-[40%]">{label}</td>
      <td className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-900">{value}</td>
    </tr>
  );
}
