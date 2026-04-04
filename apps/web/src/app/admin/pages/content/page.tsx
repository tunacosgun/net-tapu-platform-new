'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { PageHeader, Button } from '@/components/ui';
import { ChevronDown, ChevronUp, Save, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { showApiError } from '@/components/api-error-toast';

// ─── Page schemas ─────────────────────────────────────────────────────────────

type FieldType = 'text' | 'textarea' | 'json';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  default: string;
}

interface PageSchema {
  label: string;
  href: string;
  fields: FieldDef[];
}

const PAGE_SCHEMAS: Record<string, PageSchema> = {
  page_content_about: {
    label: 'Hakkımızda',
    href: '/about',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: "Türkiye'nin Güvenilir Gayrimenkul Platformu" },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'NetTapu Hakkında' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: 'Dijital çağda gayrimenkul alım satımını kolaylaştıran, şeffaf ve güvenilir bir platform.' },
      { key: 'story_title', label: 'Hikaye Başlığı', type: 'text', default: 'NetTapu Nasıl Doğdu?' },
      { key: 'story_text', label: 'Hikaye Metni', type: 'textarea', default: "2023 yılında kurulan NetTapu, Türkiye'deki gayrimenkul sektörünü dijitalleştirme vizyonuyla yola çıktı." },
      { key: 'stats', label: 'İstatistikler (JSON)', type: 'json', default: '[{"value":"10.000+","label":"Kayıtlı Kullanıcı"},{"value":"5.000+","label":"Aktif İlan"},{"value":"1.200+","label":"Başarılı Satış"},{"value":"81","label":"İl Kapsamı"}]' },
      { key: 'values', label: 'Değerler (JSON)', type: 'json', default: '[{"title":"Güvenilirlik","description":"Tüm işlemler yasal çerçevede, tam şeffaflıkla yürütülür."},{"title":"Teknoloji","description":"Canlı ihale motoru ve gerçek zamanlı teklif sistemi."},{"title":"Erişilebilirlik","description":"Web, iOS ve Android — her cihazdan sorunsuz erişim."},{"title":"Destek","description":"7/24 uzman danışman desteği."}]' },
      { key: 'team', label: 'Ekip (JSON)', type: 'json', default: '[{"name":"Ahmet Yılmaz","role":"Kurucu & CEO","initials":"AY"},{"name":"Elif Kaya","role":"CTO","initials":"EK"},{"name":"Mehmet Demir","role":"Hukuk Direktörü","initials":"MD"},{"name":"Zeynep Arslan","role":"Ürün Yöneticisi","initials":"ZA"}]' },
    ],
  },
  page_content_vision: {
    label: 'Vizyon',
    href: '/vision',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: '2030 Vizyonumuz' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Vizyon' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: 'Türkiye gayrimenkul sektörünün dijital dönüşümüne öncülük ediyoruz.' },
      { key: 'vision_statement', label: 'Vizyon Beyanı', type: 'textarea', default: "Türkiye'nin en büyük dijital gayrimenkul platformu olmak ve sektörü şeffaf, erişilebilir ve teknoloji odaklı bir geleceğe taşımak." },
      { key: 'goals', label: 'Hedefler (JSON)', type: 'json', default: '[{"year":"2025","title":"1 Milyon Kullanıcı","description":"Platformumuzu 1 milyon aktif kullanıcıya ulaştırıyoruz."},{"year":"2026","title":"Tüm Türkiye","description":"81 ilde tam kapsama ve yerel uzman ağı."},{"year":"2028","title":"Bölgesel Lider","description":"MENA bölgesinde lider gayrimenkul teknoloji platformu."},{"year":"2030","title":"Global Oyuncu","description":"Uluslararası arenada Türk gayrimenkul sektörünü temsil ediyoruz."}]' },
    ],
  },
  page_content_mission: {
    label: 'Misyon',
    href: '/mission',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Misyonumuz' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Misyon' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: 'Gayrimenkul sektöründe güven, şeffaflık ve erişilebilirliği artırmak için teknolojinin gücünü kullanıyoruz.' },
      { key: 'mission_statement', label: 'Misyon Beyanı', type: 'textarea', default: 'Her vatandaşın güvenle gayrimenkul alıp satabildiği, şeffaf ve adil bir piyasa oluşturmak.' },
      { key: 'pillars', label: 'Temel Değerler (JSON)', type: 'json', default: '[{"title":"Şeffaflık","description":"Tüm süreçler açık ve izlenebilir."},{"title":"Güven","description":"Her işlemde yasal güvence."},{"title":"Erişim","description":"Herkese eşit fırsat."},{"title":"İnovasyon","description":"Sürekli gelişim ve yenilik."}]' },
    ],
  },
  page_content_how_it_works: {
    label: 'Nasıl Çalışır?',
    href: '/how-it-works',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Nasıl Çalışır?' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Platform Rehberi' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: "NetTapu'yu kullanmak için adım adım rehber." },
      { key: 'steps', label: 'Adımlar (JSON)', type: 'json', default: '[{"step":"01","title":"Üye Olun","description":"Ücretsiz hesap oluşturun ve kimliğinizi doğrulayın."},{"step":"02","title":"İlanları Keşfedin","description":"Harita üzerinde binlerce ilanı inceleyin."},{"step":"03","title":"Depozito Yatırın","description":"İhaleye katılmak için güvenli depozito ödeyin."},{"step":"04","title":"Teklif Verin","description":"Canlı ihalede rakip teklifleri geçin."},{"step":"05","title":"Kazanın","description":"İhaleyi kazanın ve tapu sürecini başlatın."}]' },
    ],
  },
  page_content_faq: {
    label: 'SSS',
    href: '/faq',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Sıkça Sorulan Sorular' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'SSS' },
      { key: 'faqs', label: 'Sorular (JSON)', type: 'json', default: '[{"category":"genel","question":"NetTapu nedir?","answer":"NetTapu, Türkiye genelindeki arsa ve gayrimenkul ilanlarını yayınlayan bir platformdur."},{"category":"ihale","question":"Canlı ihaleye nasıl katılabilirim?","answer":"Üye olup depozito yatırdıktan sonra ihalere katılabilirsiniz."},{"category":"odeme","question":"Ödeme yöntemleri nelerdir?","answer":"Kredi kartı, banka havalesi kabul edilmektedir."}]' },
    ],
  },
  page_content_references: {
    label: 'Referanslar',
    href: '/references',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'İş Ortaklarımız' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Referanslar' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: "Türkiye'nin önde gelen kurumlarıyla çalışıyoruz." },
      { key: 'partners', label: 'Ortaklar (JSON)', type: 'json', default: '[{"name":"TSKB","category":"Finans"},{"name":"Halkbank","category":"Bankacılık"},{"name":"Garanti BBVA","category":"Bankacılık"},{"name":"Emlak Konut","category":"GYO"}]' },
    ],
  },
  page_content_testimonials: {
    label: 'Müşteri Yorumları',
    href: '/testimonials',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Müşterilerimiz Ne Diyor?' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Müşteri Yorumları' },
      { key: 'testimonials', label: 'Yorumlar (JSON)', type: 'json', default: '[{"name":"Mehmet K.","role":"Yatırımcı","text":"NetTapu sayesinde hayalimdeki arsayı uygun fiyata aldım.","rating":5},{"name":"Ayşe T.","role":"Emlak Danışmanı","text":"Müşterilerime güvenle önerebildiğim bir platform.","rating":5}]' },
    ],
  },
  page_content_contact: {
    label: 'İletişim',
    href: '/contact',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Bizimle İletişime Geçin' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'İletişim' },
      { key: 'address', label: 'Adres', type: 'textarea', default: 'Maslak Mahallesi, Büyükdere Caddesi No:237, Sarıyer/İstanbul' },
      { key: 'working_hours', label: 'Çalışma Saatleri', type: 'text', default: 'Pazartesi - Cuma: 09:00 - 18:00' },
      { key: 'map_embed', label: 'Google Maps Embed URL', type: 'text', default: '' },
    ],
  },
  page_content_projects: {
    label: 'Projelerimiz',
    href: '/projects',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Tamamlanan Projeler' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Projelerimiz' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: 'Başarıyla tamamladığımız proje ve ihaleler.' },
      { key: 'projects', label: 'Projeler (JSON)', type: 'json', default: '[{"title":"Antalya Konyaaltı","location":"Antalya","area":"5.200 m²","value":"45M TL","year":"2024"},{"title":"İstanbul Arnavutköy","location":"İstanbul","area":"12.500 m²","value":"120M TL","year":"2024"}]' },
    ],
  },
  page_content_press: {
    label: 'Basın',
    href: '/press',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Medyada NetTapu' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Basın' },
      { key: 'press_items', label: 'Basın Haberleri (JSON)', type: 'json', default: '[{"source":"Hürriyet","title":"Türkiye\'nin İlk Online Arsa İhalesi","date":"2024-03-15","url":"#"},{"source":"Milliyet","title":"NetTapu Gayrimenkulü Dijitalleştiriyor","date":"2024-02-20","url":"#"}]' },
    ],
  },
  page_content_post_sale: {
    label: 'Satış Sonrası',
    href: '/post-sale',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Satış Sonrası Destek' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Satış Sonrası' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: 'İhale sonrası her adımda yanınızdayız.' },
      { key: 'services', label: 'Hizmetler (JSON)', type: 'json', default: '[{"title":"Tapu Devri","description":"Tapu devrini eksiksiz takip ediyoruz."},{"title":"Hukuki Destek","description":"Uzman avukat kadromuz hizmetinizde."},{"title":"Vergi Danışmanlığı","description":"Gayrimenkul vergisi konusunda rehberlik."}]' },
    ],
  },
  page_content_legal: {
    label: 'Yasal Bilgiler',
    href: '/legal',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Yasal Bilgiler' },
      { key: 'content', label: 'İçerik', type: 'textarea', default: 'Kullanım koşulları, gizlilik politikası ve yasal uyarılar.' },
      { key: 'kvkk_text', label: 'KVKK Metni', type: 'textarea', default: 'Kişisel verileriniz KVKK kapsamında korunmaktadır.' },
    ],
  },
  page_content_withdrawal: {
    label: 'Cayma Hakkı',
    href: '/withdrawal-rights',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Cayma Hakkı' },
      { key: 'hero_description', label: 'Açıklama', type: 'textarea', default: 'Online alışverişlerde 14 gün cayma hakkınız bulunmaktadır.' },
      { key: 'content', label: 'İçerik', type: 'textarea', default: 'Cayma hakkı kullanım koşulları ve prosedürü.' },
    ],
  },
  page_content_real_estate_guide: {
    label: 'Gayrimenkul Rehberi',
    href: '/real-estate-guide',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'Gayrimenkul Yatırım Rehberi' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Kapsamlı Rehber' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: 'Arsa ve gayrimenkul yatırımı için bilmeniz gereken her şey.' },
      { key: 'sections', label: 'Bölümler (JSON)', type: 'json', default: '[{"title":"Arsa Yatırımı Nedir?","content":"Arsa yatırımı, uzun vadeli değer artışı için en güvenli yatırım araçlarından biridir."},{"title":"İmar Durumu","content":"Arsa satın almadan önce imar durumunu mutlaka kontrol edin."},{"title":"Tapu İşlemleri","content":"Tapu devri için gerekli belgeler ve prosedürler."}]' },
    ],
  },
  page_content_kurumsal: {
    label: 'Kurumsal Ana Sayfa',
    href: '/kurumsal',
    fields: [
      { key: 'hero_title', label: 'Hero Başlık', type: 'text', default: 'NetTapu Kurumsal' },
      { key: 'hero_subtitle', label: 'Hero Alt Başlık', type: 'text', default: 'Hakkımızda' },
      { key: 'hero_description', label: 'Hero Açıklama', type: 'textarea', default: "Türkiye'nin önde gelen dijital gayrimenkul ve açık artırma platformu." },
      { key: 'stats', label: 'İstatistikler (JSON)', type: 'json', default: '[{"value":"10.000+","label":"Kullanıcı"},{"value":"5.000+","label":"İlan"},{"value":"1.200+","label":"Satış"},{"value":"81","label":"İl"}]' },
    ],
  },
};

// ─── JSON field helpers ───────────────────────────────────────────────────────

function tryFormatJson(val: string): { formatted: string; error: string | null } {
  try {
    const parsed = JSON.parse(val);
    return { formatted: JSON.stringify(parsed, null, 2), error: null };
  } catch (e: any) {
    return { formatted: val, error: e.message };
  }
}

function isValidJson(val: string): boolean {
  try { JSON.parse(val); return true; } catch { return false; }
}

// ─── JsonField component ──────────────────────────────────────────────────────

function JsonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleChange(v: string) {
    onChange(v);
    if (!isValidJson(v)) {
      try { JSON.parse(v); } catch (e: any) { setJsonError(e.message); }
    } else {
      setJsonError(null);
    }
  }

  function handleFormat() {
    const { formatted, error } = tryFormatJson(value);
    onChange(formatted);
    setJsonError(error);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-[var(--muted-foreground)]">{label}</label>
        <button
          type="button"
          onClick={handleFormat}
          className="text-[10px] font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded transition-colors"
        >
          Biçimlendir
        </button>
      </div>
      <textarea
        value={value}
        onChange={e => handleChange(e.target.value)}
        rows={6}
        className={`w-full rounded-lg border px-3 py-2 text-xs font-mono bg-[var(--muted)]/30 text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors resize-y focus:ring-2 focus:ring-brand-500/20 ${
          jsonError
            ? 'border-red-400 focus:border-red-500'
            : 'border-[var(--border)] focus:border-brand-400'
        }`}
        spellCheck={false}
      />
      {jsonError && (
        <p className="mt-1 text-[10px] text-red-500 font-mono">{jsonError}</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PageContentAdminPage() {
  const [pageData, setPageData] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/content/site-settings')
      .then(({ data }) => {
        const parsed: Record<string, Record<string, string>> = {};
        for (const key of Object.keys(PAGE_SCHEMAS)) {
          try {
            const saved = data?.[key];
            parsed[key] = saved ? JSON.parse(saved) : {};
          } catch {
            parsed[key] = {};
          }
        }
        setPageData(parsed);
      })
      .catch(showApiError)
      .finally(() => setLoading(false));
  }, []);

  function getFieldValue(pageKey: string, field: FieldDef): string {
    return pageData[pageKey]?.[field.key] ?? field.default;
  }

  function updateField(pageKey: string, fieldKey: string, value: string) {
    setPageData(prev => ({
      ...prev,
      [pageKey]: { ...(prev[pageKey] || {}), [fieldKey]: value },
    }));
  }

  async function savePage(settingsKey: string) {
    // Validate JSON fields before saving
    const schema = PAGE_SCHEMAS[settingsKey];
    for (const field of schema.fields) {
      if (field.type === 'json') {
        const val = pageData[settingsKey]?.[field.key] ?? field.default;
        if (val && !isValidJson(val)) {
          alert(`"${field.label}" alanı geçerli JSON değil. Lütfen düzeltin.`);
          return;
        }
      }
    }

    setSaving(settingsKey);
    try {
      // Build content: use current pageData values, fall back to defaults for missing keys
      const content: Record<string, string> = {};
      for (const field of schema.fields) {
        content[field.key] = pageData[settingsKey]?.[field.key] ?? field.default;
      }
      await apiClient.patch('/admin/settings', { [settingsKey]: JSON.stringify(content) });
      setSuccess(settingsKey);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(null);
    }
  }

  function toggleExpand(key: string) {
    setExpanded(prev => (prev === key ? null : key));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sayfa İçerikleri" subtitle="Kurumsal sayfaların içeriklerini yönetin" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-[var(--border)] animate-pulse bg-[var(--muted)]/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sayfa İçerikleri"
        subtitle={`${Object.keys(PAGE_SCHEMAS).length} kurumsal sayfanın içeriklerini sistem ayarları üzerinden yönetin`}
      />

      <div className="space-y-2">
        {Object.entries(PAGE_SCHEMAS).map(([settingsKey, schema]) => {
          const isExpanded = expanded === settingsKey;
          const isSaving = saving === settingsKey;
          const isSuccess = success === settingsKey;

          return (
            <div
              key={settingsKey}
              className="rounded-xl border border-[var(--border)] overflow-hidden transition-shadow hover:shadow-sm"
            >
              {/* Row header */}
              <div
                className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors ${
                  isExpanded ? 'bg-brand-50/60 border-b border-brand-100' : 'bg-[var(--background)] hover:bg-[var(--muted)]/30'
                }`}
                onClick={() => toggleExpand(settingsKey)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base select-none">📄</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{schema.label}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{schema.href}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={schema.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] hover:text-brand-600 transition-colors px-2 py-1 rounded hover:bg-brand-50"
                    title="Sayfayı önizle"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Önizle
                  </a>
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded">
                    {schema.fields.length} alan
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </div>

              {/* Expanded form */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-4 bg-[var(--background)]">
                  <div className="space-y-4">
                    {schema.fields.map(field => (
                      <div key={field.key}>
                        {field.type === 'json' ? (
                          <JsonField
                            label={field.label}
                            value={getFieldValue(settingsKey, field)}
                            onChange={v => updateField(settingsKey, field.key, v)}
                          />
                        ) : field.type === 'textarea' ? (
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                              {field.label}
                            </label>
                            <textarea
                              value={getFieldValue(settingsKey, field)}
                              onChange={e => updateField(settingsKey, field.key, e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--muted)]/20 text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 resize-y"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                              {field.label}
                            </label>
                            <input
                              type="text"
                              value={getFieldValue(settingsKey, field)}
                              onChange={e => updateField(settingsKey, field.key, e.target.value)}
                              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--muted)]/20 text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Save button */}
                  <div className="mt-5 flex items-center justify-end gap-3">
                    {isSuccess && (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Kaydedildi
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => savePage(settingsKey)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Kaydet
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
