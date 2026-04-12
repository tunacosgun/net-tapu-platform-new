'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useCallback, type MouseEvent } from 'react';
import apiClient from '@/lib/api-client';
import { showApiError } from '@/components/api-error-toast';
import { parcelSchema, type ParcelFormData } from '@/lib/validators';
import { FormField, FormTextarea, FormCheckbox, FormSelect } from '@/components/form-field';
import { AddressGeocoder } from '@/components/address-geocoder';
import { ImageUpload } from '@/components/image-upload';
import { useRateLimit } from '@/hooks/use-rate-limit';
import { Button } from '@/components/ui';

interface ParcelImage {
  id: string;
  originalUrl: string;
  thumbnailUrl: string | null;
  watermarkedUrl: string | null;
  status: string;
  sortOrder: number;
  isCover: boolean;
}

export default function AdminNewParcelPage() {
  const router = useRouter();
  const { cooldown, isLimited, checkRateLimit } = useRateLimit();
  const [createdParcelId, setCreatedParcelId] = useState<string | null>(null);
  const [parcelImages, setParcelImages] = useState<ParcelImage[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ParcelFormData>({
    resolver: zodResolver(parcelSchema),
    defaultValues: { isAuctionEligible: false, isFeatured: false, showListingDate: true, latitude: '', longitude: '' },
  });

  const selectedCity = watch('city');
  const selectedDistrict = watch('district');
  const watchedNeighborhood = watch('neighborhood');
  const watchedAddress = watch('address');
  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');

  // ── Location data state ──────────────────────────────────────────────
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  // ── Fetch cities on mount ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<string[]>('/locations/cities')
      .then(({ data }) => {
        if (!cancelled) setCities(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Fetch districts when city changes ────────────────────────────────
  const fetchDistricts = useCallback(
    async (city: string) => {
      if (!city) {
        setDistricts([]);
        setNeighborhoods([]);
        return;
      }
      try {
        const { data } = await apiClient.get<string[]>('/locations/districts', {
          params: { city },
        });
        setDistricts(data);
      } catch {
        setDistricts([]);
      }
      setNeighborhoods([]);
    },
    [],
  );

  useEffect(() => {
    fetchDistricts(selectedCity);
  }, [selectedCity, fetchDistricts]);

  // ── Fetch neighborhoods when district changes ────────────────────────
  const fetchNeighborhoods = useCallback(
    async (city: string, district: string) => {
      if (!city || !district) {
        setNeighborhoods([]);
        return;
      }
      try {
        const { data } = await apiClient.get<string[]>(
          '/locations/neighborhoods',
          { params: { city, district } },
        );
        setNeighborhoods(data);
      } catch {
        setNeighborhoods([]);
      }
    },
    [],
  );

  useEffect(() => {
    fetchNeighborhoods(selectedCity, selectedDistrict);
  }, [selectedCity, selectedDistrict, fetchNeighborhoods]);

  // ── Reset dependent fields on parent change ──────────────────────────
  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const city = e.target.value;
    setValue('city', city, { shouldValidate: true });
    setValue('district', '', { shouldValidate: false });
    setValue('neighborhood', '', { shouldValidate: false });
  }

  function handleDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const district = e.target.value;
    setValue('district', district, { shouldValidate: true });
    setValue('neighborhood', '', { shouldValidate: false });
  }

  function handleNeighborhoodChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue('neighborhood', e.target.value, { shouldValidate: true });
  }

  // ── TKGM Lookup ─────────────────────────────────────────────────────
  const [tkgmLoading, setTkgmLoading] = useState(false);
  const [tkgmResult, setTkgmResult] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tkgmBoundary, setTkgmBoundary] = useState<any>(null);

  const watchedAda = watch('ada');
  const watchedParsel = watch('parsel');
  const canLookup = !!(selectedCity && selectedDistrict && watchedAda && watchedParsel);

  async function handleTkgmLookup(e: MouseEvent) {
    e.preventDefault();
    if (!canLookup) return;
    setTkgmLoading(true);
    setTkgmResult(null);
    try {
      const { data } = await apiClient.post<{ responseData: Record<string, unknown> }>('/integrations/tkgm/lookup', {
        city: selectedCity,
        district: selectedDistrict,
        ada: watchedAda,
        parsel: watchedParsel,
      });
      const rd = data.responseData;
      if (rd.areaM2) setValue('areaM2', String(rd.areaM2), { shouldValidate: true });
      if (rd.latitude) setValue('latitude', String(rd.latitude), { shouldValidate: true });
      if (rd.longitude) setValue('longitude', String(rd.longitude), { shouldValidate: true });
      if (rd.neighborhood && typeof rd.neighborhood === 'string') {
        setValue('neighborhood', rd.neighborhood, { shouldValidate: true });
      }
      if (rd.boundary) setTkgmBoundary(rd.boundary);
      setTkgmResult('✓ Parsel bilgileri TKGM\'den alındı');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'TKGM sorgusu başarısız';
      setTkgmResult(`✗ ${msg}`);
    } finally {
      setTkgmLoading(false);
    }
  }

  async function onSubmit(data: ParcelFormData) {
    const { showListingDate, ...rest } = data;
    const body: Record<string, unknown> = {
      ...rest,
      neighborhood: data.neighborhood || undefined,
      address: data.address || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      zoningStatus: data.zoningStatus || undefined,
      landType: data.landType || undefined,
      ada: data.ada || undefined,
      parsel: data.parsel || undefined,
      description: data.description || undefined,
      showListingDate: showListingDate,
      vatRate: data.vatRate !== undefined && data.vatRate !== '' ? Number(data.vatRate) : 0,
    };

    try {
      const { data } = await apiClient.post<{ id: string }>('/parcels', body);
      // Stay on page to allow image upload, then redirect
      setCreatedParcelId(data.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (!checkRateLimit(err)) showApiError(err);
    }
  }

  // If parcel was just created, show success + image upload
  if (createdParcelId) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 flex items-center gap-3">
          <svg className="h-5 w-5 text-brand-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <p className="text-sm font-semibold text-brand-800">Arsa başarıyla oluşturuldu! Şimdi görsel ekleyebilirsiniz.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Görseller</h2>
          <ImageUpload
            parcelId={createdParcelId}
            images={parcelImages}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={() => router.push(`/admin/parcels/${createdParcelId}`)}>
            İlana Git
          </Button>
          <Button variant="secondary" onClick={() => router.push('/admin/parcels')}>
            İlan Listesine Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Yeni Arsa</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Başlık *"
          error={errors.title?.message}
          {...register('title')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Şehir *"
            error={errors.city?.message}
            options={cities}
            placeholder="Şehir seçiniz..."
            value={selectedCity || ''}
            onChange={handleCityChange}
          />
          <FormSelect
            label="İlçe *"
            error={errors.district?.message}
            options={districts}
            placeholder="İlçe seçiniz..."
            value={selectedDistrict || ''}
            onChange={handleDistrictChange}
            disabled={!selectedCity}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Mahalle"
            error={errors.neighborhood?.message}
            options={neighborhoods}
            placeholder="Mahalle seçiniz..."
            value={watch('neighborhood') || ''}
            onChange={handleNeighborhoodChange}
            disabled={!selectedDistrict}
          />
          <FormField
            label="Cadde / Sokak / Adres"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>

        {/* ── Address Geocoder / Map ── */}
        <AddressGeocoder
          latitude={watchedLat}
          longitude={watchedLng}
          city={selectedCity}
          district={selectedDistrict}
          neighborhood={watchedNeighborhood}
          address={watchedAddress}
          boundary={tkgmBoundary}
          onCoordsChange={(lat, lng) => {
            setValue('latitude', lat, { shouldValidate: true });
            setValue('longitude', lng, { shouldValidate: true });
          }}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            label="Alan (m²)"
            type="number"
            step="any"
            error={errors.areaM2?.message}
            {...register('areaM2')}
          />
          <FormField
            label="Fiyat (TRY)"
            type="number"
            error={errors.price?.message}
            {...register('price')}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">İmar Durumu</label>
            <select {...register('zoningStatus')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="">Belirtilmemiş</option>
              <option value="İmarlı">İmarlı</option>
              <option value="İmarsız">İmarsız</option>
              <option value="Tarla">Tarla</option>
              <option value="Bağ & Bahçe">Bağ & Bahçe</option>
              <option value="Konut İmarlı">Konut İmarlı</option>
              <option value="Ticari İmarlı">Ticari İmarlı</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tapu Tipi</label>
            <select {...register('deedType')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="">Seçiniz</option>
              <option value="mustakil">Müstakil Tapu</option>
              <option value="hisseli">Hisseli Tapu</option>
              <option value="kat_irtifaki">Kat İrtifakı</option>
              <option value="kat_mulkiyeti">Kat Mülkiyeti</option>
              <option value="devremulk">Devremülk</option>
              <option value="kooperatif_hisseli">Kooperatif Hisseli Tapu</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">KDV Oranı</label>
            <select {...register('vatRate')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="0">%0</option>
              <option value="1">%1</option>
              <option value="10">%10</option>
              <option value="20">%20</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Yol Durumu</label>
            <select {...register('roadAccess')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="">Belirtilmemiş</option>
              <option value="yes">Yolu Var</option>
              <option value="no">Yolu Yok</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label="Arazi Türü"
            error={errors.landType?.message}
            {...register('landType')}
          />
          <FormField
            label="Ada"
            error={errors.ada?.message}
            {...register('ada')}
          />
          <FormField
            label="Parsel"
            error={errors.parsel?.message}
            {...register('parsel')}
          />
        </div>
        {/* TKGM Lookup */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canLookup || tkgmLoading}
            onClick={handleTkgmLookup}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400"
          >
            {tkgmLoading ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            )}
            {tkgmLoading ? 'Sorgulanıyor...' : 'TKGM\'den Sorgula'}
          </button>
          {!canLookup && <span className="text-xs text-[var(--muted-foreground)]">İl, İlçe, Ada ve Parsel doldurulmalı</span>}
          {tkgmResult && (
            <span className={`text-xs font-medium ${tkgmResult.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
              {tkgmResult}
            </span>
          )}
        </div>

        <div className="flex gap-6 flex-wrap">
          <FormCheckbox
            label="Açık Artırmaya Uygun"
            {...register('isAuctionEligible')}
          />
          <FormCheckbox label="Öne Çıkan" {...register('isFeatured')} />
          <FormCheckbox label="İlan Tarihini Göster" {...register('showListingDate')} />
          <FormCheckbox label="Köşe Parsel" {...register('isCornerParcel')} />
        </div>
        <FormTextarea
          label="Açıklama"
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting || isLimited}>
            {isLimited
              ? `${cooldown}s bekleyin`
              : isSubmitting
                ? 'Kaydediliyor...'
                : 'Kaydet'}
          </Button>
          <Button variant="secondary" type="button" onClick={() => router.back()}>
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
}
