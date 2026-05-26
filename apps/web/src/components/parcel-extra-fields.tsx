'use client';

import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { ParcelFormData } from '@/lib/validators';
import { FormField } from '@/components/form-field';

/**
 * Sahibinden-style detail fields + per-field hide toggles. Used in both admin
 * "new parcel" and "edit parcel" pages.
 *
 * `hiddenFields` is an array of detail-row keys the admin chose to hide on
 * the public parcel page (e.g. ['listingDate','paftaNo','gabari']).
 */
const HIDEABLE_FIELDS: { key: string; label: string }[] = [
  { key: 'listingDate', label: 'İlan Tarihi' },
  { key: 'emlakTipi', label: 'Emlak Tipi' },
  { key: 'zoningStatus', label: 'İmar Durumu' },
  { key: 'areaM2', label: 'm²' },
  { key: 'pricePerM2', label: 'm² Fiyatı' },
  { key: 'ada', label: 'Ada No' },
  { key: 'parsel', label: 'Parsel No' },
  { key: 'paftaNo', label: 'Pafta No' },
  { key: 'kaksEmsal', label: 'Kaks (Emsal)' },
  { key: 'gabari', label: 'Gabari' },
  { key: 'creditEligible', label: 'Krediye Uygunluk' },
  { key: 'deedStatus', label: 'Tapu Durumu' },
  { key: 'sellerType', label: 'Kimden' },
  { key: 'tradeAccepted', label: 'Takas' },
  { key: 'landType', label: 'Arazi Türü' },
  { key: 'vatRate', label: 'KDV Oranı' },
];

interface Props {
  register: UseFormRegister<ParcelFormData>;
  watch: UseFormWatch<ParcelFormData>;
  setValue: UseFormSetValue<ParcelFormData>;
  errors: Partial<Record<keyof ParcelFormData, { message?: string }>>;
}

export function ParcelExtraFields({ register, watch, setValue, errors }: Props) {
  const hidden: string[] = (watch('hiddenFields') as string[] | undefined) ?? [];

  function toggle(key: string) {
    const next = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
    setValue('hiddenFields', next, { shouldDirty: true });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h3 className="text-sm font-bold text-ink-900">Sahibinden Ek Bilgiler</h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Pafta No"
          placeholder="örn. F17-B-04-C-1"
          error={errors.paftaNo?.message}
          {...register('paftaNo')}
        />
        <FormField
          label="Kaks (Emsal)"
          placeholder="örn. 1.50"
          error={errors.kaksEmsal?.message}
          {...register('kaksEmsal')}
        />
        <FormField
          label="Gabari"
          placeholder="örn. 6.50 m"
          error={errors.gabari?.message}
          {...register('gabari')}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Krediye Uygunluk</label>
          <select {...register('creditEligible')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
            <option value="">Belirtme</option>
            <option value="yes">Evet</option>
            <option value="no">Hayır</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Kimden</label>
          <select {...register('sellerType')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
            <option value="sahibinden">Sahibinden</option>
            <option value="emlakcidan">Emlakçıdan</option>
            <option value="danisman">Danışmandan</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Takas</label>
          <select {...register('tradeAccepted')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
            <option value="">Belirtme</option>
            <option value="yes">Evet</option>
            <option value="no">Hayır</option>
          </select>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-ink-900 mb-2">Müşteri Arayüzünde Gizle</p>
        <p className="text-xs text-slate-500 mb-3">İşaretlediğiniz alanlar bu ilanın detay sayfasında gösterilmez.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {HIDEABLE_FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hidden.includes(f.key)}
                onChange={() => toggle(f.key)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export { HIDEABLE_FIELDS };
