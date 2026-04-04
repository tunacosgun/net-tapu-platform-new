'use client';

import { useEffect, useRef, useState } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import { motion } from 'framer-motion';
import { Scale, Shield, Cookie, UserCheck, ChevronRight, Info } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  lastUpdated: string;
  content: React.ReactNode;
}

function HighlightBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' }) {
  return (
    <div
      className={`my-4 flex gap-3 rounded-xl border p-4 ${
        variant === 'info'
          ? 'border-blue-200 bg-blue-50 text-blue-900'
          : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <Info className={`mt-0.5 h-4 w-4 shrink-0 ${variant === 'info' ? 'text-blue-500' : 'text-amber-500'}`} />
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-3 text-xl font-bold text-slate-900">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-2 text-base font-semibold text-slate-800">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="my-3 text-sm leading-relaxed text-slate-600">{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="my-3 space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          {item}
        </li>
      ))}
    </ul>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'kullanim-sartlari',
    title: 'Kullanım Şartları',
    icon: <Scale className="h-4 w-4" />,
    lastUpdated: '1 Ocak 2026',
    content: (
      <>
        <H2>Genel Hükümler</H2>
        <P>
          Bu Kullanım Şartları, NetTapu Gayrimenkul Teknoloji A.Ş. (bundan böyle "NetTapu" olarak anılacaktır)
          tarafından işletilen nettapu.com internet sitesi ve mobil uygulamalar aracılığıyla sunulan hizmetlerin
          kullanımına ilişkin koşulları düzenlemektedir.
        </P>
        <HighlightBox>
          Platformu kullanarak bu şartları kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız hizmetlerimizi
          kullanmayı derhal bırakınız.
        </HighlightBox>

        <H2>Hesap Oluşturma ve Güvenlik</H2>
        <P>Platforma erişim sağlamak için kullanıcı hesabı oluşturmanız gerekmektedir. Hesabınızın güvenliğinden siz sorumlusunuz.</P>
        <Ul items={[
          'Gerçek ve güncel bilgilerle kayıt olunması zorunludur.',
          'Hesap bilgilerinizi üçüncü kişilerle paylaşmamalısınız.',
          'Yetkisiz erişim tespitinde derhal bildirim yapılmalıdır.',
          'Tek kişi adına birden fazla hesap açılamaz.',
        ]} />

        <H2>İhale Kuralları</H2>
        <P>
          NetTapu üzerinde gerçekleştirilen açık artırmalar, yasal ihale mevzuatına uygun biçimde
          yürütülmektedir. Verilen teklifler hukuken bağlayıcıdır.
        </P>
        <Ul items={[
          'Teklif vermek için önceden depozito yatırılması gerekir.',
          'Verilen teklifler geri alınamaz.',
          'En yüksek teklif veren, yasal sözleşme imzalamakla yükümlüdür.',
          'Sahte teklif tespit edilmesi durumunda hesap kalıcı olarak kapatılır.',
        ]} />

        <H2>Sorumluluk Sınırlaması</H2>
        <P>
          NetTapu, ilan edilen gayrimenkullerin hukuki durumundan bizzat sorumlu olmamakla birlikte
          doğrulama süreçleri uygulamaktadır. Platform üzerinden gerçekleştirilen tüm işlemler için
          kullanıcılar kendi hukuki danışmanına başvurması önerilir.
        </P>
      </>
    ),
  },
  {
    id: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    icon: <Shield className="h-4 w-4" />,
    lastUpdated: '1 Ocak 2026',
    content: (
      <>
        <H2>Toplanan Veriler</H2>
        <P>
          NetTapu, hizmetlerin sağlanması amacıyla aşağıdaki kişisel verilerinizi işlemektedir:
        </P>
        <Ul items={[
          'Ad, soyad, T.C. kimlik numarası',
          'İletişim bilgileri (telefon, e-posta, adres)',
          'Finansal işlem kayıtları',
          'Platform kullanım istatistikleri',
          'Cihaz ve tarayıcı bilgileri',
        ]} />

        <H2>Verilerin Kullanımı</H2>
        <P>Toplanan veriler şu amaçlarla kullanılmaktadır:</P>
        <Ul items={[
          'Hizmetlerin sunulması ve geliştirilmesi',
          'Kimlik doğrulama ve güvenlik',
          'Yasal yükümlülüklerin yerine getirilmesi',
          'Kullanıcı desteği sağlanması',
          'Pazarlama (açık onay alınması koşuluyla)',
        ]} />

        <HighlightBox variant="warning">
          Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmamaktadır.
          Verilerinizin silinmesini her zaman talep edebilirsiniz.
        </HighlightBox>

        <H2>Veri Güvenliği</H2>
        <P>
          NetTapu, kişisel verileri korumak amacıyla endüstri standardı güvenlik önlemleri uygulamaktadır.
          SSL şifrelemesi, erişim kısıtlamaları ve düzenli güvenlik denetimleri bu önlemler arasındadır.
        </P>
      </>
    ),
  },
  {
    id: 'cerez-politikasi',
    title: 'Çerez Politikası',
    icon: <Cookie className="h-4 w-4" />,
    lastUpdated: '1 Ocak 2026',
    content: (
      <>
        <H2>Çerezler Nedir?</H2>
        <P>
          Çerezler, internet sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır.
          NetTapu, kullanıcı deneyimini iyileştirmek ve hizmet kalitesini artırmak için çerezlerden yararlanmaktadır.
        </P>

        <H2>Kullandığımız Çerez Türleri</H2>
        <H3>Zorunlu Çerezler</H3>
        <P>Platformun temel işlevleri için gereklidir. Devre dışı bırakılamazlar.</P>
        <Ul items={[
          'Oturum yönetimi',
          'Güvenlik doğrulaması',
          'Dil tercihleri',
        ]} />

        <H3>Analitik Çerezler</H3>
        <P>Ziyaretçi davranışlarını anonim olarak analiz etmek amacıyla kullanılır.</P>
        <Ul items={[
          'Sayfa görüntüleme sayıları',
          'Oturum süresi',
          'Kullanıcı akışları',
        ]} />

        <H3>Pazarlama Çerezleri</H3>
        <P>Yalnızca onayınız alındıktan sonra etkinleştirilir.</P>
        <HighlightBox>
          Çerez tercihlerinizi site ayarlarından dilediğiniz zaman değiştirebilirsiniz. Zorunlu çerezler
          dışındakileri reddetmek platformun temel işlevlerini etkilemez.
        </HighlightBox>
      </>
    ),
  },
  {
    id: 'kvkk',
    title: 'KVKK Aydınlatma Metni',
    icon: <UserCheck className="h-4 w-4" />,
    lastUpdated: '1 Ocak 2026',
    content: (
      <>
        <H2>Veri Sorumlusu</H2>
        <P>
          6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz;
          <strong> NetTapu Gayrimenkul Teknoloji Anonim Şirketi</strong> tarafından işlenmektedir.
        </P>
        <Ul items={[
          'Ünvan: NetTapu Gayrimenkul Teknoloji A.Ş.',
          'Adres: Maslak, Büyükdere Cad. No:123, Sarıyer / İstanbul',
          'E-posta: kvkk@nettapu.com',
        ]} />

        <H2>Kişisel Verilerin İşlenme Amaçları</H2>
        <P>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</P>
        <Ul items={[
          'Platformdaki hizmetlerin yürütülmesi',
          'Sözleşme süreçlerinin yönetimi',
          'Yasal yükümlülüklerin yerine getirilmesi',
          'Müşteri hizmetleri ve destek operasyonları',
          'Dolandırıcılık önleme ve güvenlik',
        ]} />

        <H2>Haklarınız</H2>
        <P>KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</P>
        <Ul items={[
          'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
          'İşlenme amacını ve bunların amaca uygun kullanılıp kullanılmadığını öğrenme',
          'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme',
          'Eksik veya yanlış işlenmesi hâlinde düzeltilmesini isteme',
          'Silinmesini veya yok edilmesini isteme',
          'İşlemenin reddi hâlinde itiraz etme',
          'Otomatik sistemler vasıtasıyla aleyhine sonuç doğurmasına itiraz etme',
        ]} />

        <HighlightBox>
          Haklarınızı kullanmak için kvkk@nettapu.com adresine e-posta gönderebilir ya da bize yazılı başvuruda
          bulunabilirsiniz. Başvurunuz 30 gün içinde yanıtlanacaktır.
        </HighlightBox>

        <H2>İletişim</H2>
        <P>
          KVKK kapsamındaki başvurularınız için:{' '}
          <a href="mailto:kvkk@nettapu.com" className="text-emerald-600 hover:underline font-medium">
            kvkk@nettapu.com
          </a>
        </P>
      </>
    ),
  },
];

const DEFAULT_CONTENT = {
  hero_title: 'Yasal Bilgiler',
  content: '',
  kvkk_text: '',
};

export function LegalContent() {
  const pageContent = usePageContent('page_content_legal', DEFAULT_CONTENT);
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function scrollTo(id: string) {
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-4 py-16 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-medium text-white mb-5">
            <Scale className="h-3 w-3" />
            Yasal Bilgiler
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{pageContent.hero_title}</h1>
          <p className="text-sm text-white/70 max-w-md mx-auto">
            Kullanım şartları, gizlilik politikası, çerez politikası ve KVKK aydınlatma metni.
          </p>
        </motion.div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Bölümler
              </p>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                    activeId === s.id
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      activeId === s.id
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}
                  >
                    {s.icon}
                  </span>
                  <span className="leading-snug">{s.title}</span>
                  {activeId === s.id && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-emerald-500" />
                  )}
                </button>
              ))}

              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-medium text-slate-400 mb-1">Son güncelleme</p>
                <p className="text-xs text-slate-600">1 Ocak 2026</p>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 space-y-16">
            {/* Mobile quick-nav */}
            <div className="flex overflow-x-auto gap-2 pb-2 lg:hidden">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeId === s.id
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {s.icon}
                  {s.title}
                </button>
              ))}
            </div>

            {SECTIONS.map((section, idx) => (
              <motion.article
                key={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el; }}
                id={section.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
              >
                <div className="mb-6 flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      {section.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[11px] text-slate-400 whitespace-nowrap">
                    Güncelleme: {section.lastUpdated}
                  </span>
                </div>

                <div className="prose-container">
                  {section.content}
                </div>
              </motion.article>
            ))}

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-center">
              <p className="text-xs text-slate-500">
                Bu sayfadaki tüm metinler bilgilendirme amacıyla sunulmaktadır.
                Hukuki danışmanlık için bir avukata başvurmanız önerilir.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                NetTapu Gayrimenkul Teknoloji A.Ş. — Tüm hakları saklıdır.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
