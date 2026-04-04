'use client';

import { useState } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  X,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

/* ─── helpers ──────────────────────────────────────────── */

function parseArray<T>(val: unknown, defaults: T[]): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch {}
  }
  return defaults;
}

/* ─── defaults ────────────────────────────────────────── */

const DEFAULT_CONTENT = {
  hero_title: 'Projelerimiz',
  hero_subtitle: 'Tamamlanan Projeler',
  hero_description: 'NetTapu aracılığıyla gerçekleştirilen başarılı arsa satışları ve ihale projeleri.',
  projects: [] as { title: string; location: string; area: string; value: string; year: string }[],
};

type Category = 'Tümü' | 'İhale' | 'Arsa Satışı' | 'Kentsel Dönüşüm' | 'Tarım Arazisi';
type Status = 'Tamamlandı' | 'Devam Ediyor';

interface Project {
  id: number;
  title: string;
  description: string;
  category: Exclude<Category, 'Tümü'>;
  status: Status;
  saleAmount: string;
  participants: number;
  duration: string;
  gradient: string;
  details: string;
  location: string;
  area: string;
}

const PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Gebze Sanayi Arazisi İhalesi',
    description: 'Kocaeli Gebze\'de 45 dönüm sanayi vasfında arazi ihaleyle satışa sunuldu. Rekor katılımlı bir ihale süreci gerçekleşti.',
    category: 'İhale',
    status: 'Tamamlandı',
    saleAmount: '₺ 48.500.000',
    participants: 312,
    duration: '14 gün',
    gradient: 'from-emerald-600 to-teal-600',
    details: 'Kocaeli Gebze Organize Sanayi Bölgesi yakınlarında konumlanan bu arazi, yoğun katılımlı açık artırma yöntemiyle satıldı. Toplam 312 kayıtlı katılımcı ile NetTapu tarihinin en kalabalık ihalesini oluşturdu.',
    location: 'Gebze, Kocaeli',
    area: '45 Dönüm',
  },
  {
    id: 2,
    title: 'Çanakkale Tarım Arazisi Paketi',
    description: 'Çanakkale Biga ilçesinde toplam 120 dönüm tarım arazisi parsel parsel satışa sunuldu.',
    category: 'Tarım Arazisi',
    status: 'Tamamlandı',
    saleAmount: '₺ 22.800.000',
    participants: 178,
    duration: '21 gün',
    gradient: 'from-green-600 to-emerald-600',
    details: 'Çanakkale Biga ilçesinde sulama kanalına yakın konumlu 120 dönüm tarım arazisi, 8 ayrı parsel halinde ihaleye çıkarıldı. Tüm parseller belirlenen tavan fiyatın üzerinde alıcı buldu.',
    location: 'Biga, Çanakkale',
    area: '120 Dönüm',
  },
  {
    id: 3,
    title: 'İstanbul Avrupa Yakası Kentsel Dönüşüm',
    description: 'Bağcılar\'da riskli alan kapsamındaki yapıların yıkılıp yeniden inşası için arazi pazarlaması yapıldı.',
    category: 'Kentsel Dönüşüm',
    status: 'Devam Ediyor',
    saleAmount: '₺ 135.000.000',
    participants: 54,
    duration: '45+ gün',
    gradient: 'from-orange-500 to-amber-500',
    details: 'İstanbul Bağcılar\'da kentsel dönüşüm kapsamına alınan 3.200 m² arsa, geliştirici firmalar ile özel yatırımcılara yönelik kapalı teklif usulüyle pazarlanmaktadır. Proje devam etmektedir.',
    location: 'Bağcılar, İstanbul',
    area: '3.200 m²',
  },
  {
    id: 4,
    title: 'Antalya Turizm Bölgesi Arsaları',
    description: 'Antalya Döşemealtı\'nda turizm amaçlı kullanıma uygun 6 adet parsel ihale yöntemiyle satıldı.',
    category: 'Arsa Satışı',
    status: 'Tamamlandı',
    saleAmount: '₺ 67.200.000',
    participants: 241,
    duration: '30 gün',
    gradient: 'from-cyan-500 to-blue-500',
    details: 'Antalya Döşemealtı\'nda turizm yatırımına uygun 6 parsel, toplam 241 katılımcıyla gerçekleşen açık artırma sürecinde alıcı buldu. Parsellerin tamamı beklenen fiyatın %40 üzerinde satıldı.',
    location: 'Döşemealtı, Antalya',
    area: '18.400 m²',
  },
  {
    id: 5,
    title: 'Konya Tarımsal Yatırım Projesi',
    description: 'Konya Karatay ilçesinde verimli tarım arazileri küçük yatırımcılara parsel parsel sunuldu.',
    category: 'Tarım Arazisi',
    status: 'Tamamlandı',
    saleAmount: '₺ 19.600.000',
    participants: 423,
    duration: '18 gün',
    gradient: 'from-lime-500 to-green-600',
    details: 'Konya Karatay\'da yer alan 200 dönüm tarım arazisi 50\'şer dönümlük 4 parsel halinde satışa çıkarıldı. Bireysel yatırımcıların yoğun ilgisiyle 18 günde tamamlandı.',
    location: 'Karatay, Konya',
    area: '200 Dönüm',
  },
  {
    id: 6,
    title: 'Bursa Organize Sanayi İhalesi',
    description: 'Bursa Nilüfer Organize Sanayi Bölgesi\'nde sanayi parselleri canlı ihale ile satışa sunuldu.',
    category: 'İhale',
    status: 'Devam Ediyor',
    saleAmount: '₺ 92.000.000',
    participants: 189,
    duration: '60+ gün',
    gradient: 'from-rose-500 to-pink-500',
    details: 'Bursa Nilüfer Organize Sanayi Bölgesi\'nde 12 adet sanayi parseli, NetTapu canlı ihale motoru aracılığıyla uluslararası yatırımcılara da açık şekilde pazarlanmaktadır. İhale devam etmektedir.',
    location: 'Nilüfer, Bursa',
    area: '34.600 m²',
  },
];

const CATEGORIES: Category[] = ['Tümü', 'İhale', 'Arsa Satışı', 'Kentsel Dönüşüm', 'Tarım Arazisi'];

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className={`relative h-44 bg-gradient-to-br ${project.gradient} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`grid-${project.id}`} width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${project.id})`} />
        </svg>

        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white">
            {project.category}
          </span>
        </div>

        <div className="absolute top-4 right-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-md ${
              project.status === 'Tamamlandı'
                ? 'bg-white/20 border border-white/30 text-white'
                : 'bg-amber-500/20 border border-amber-300/40 text-white'
            }`}
          >
            {project.status === 'Tamamlandı' ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {project.status}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 text-xs text-white/80 font-medium">
          {project.location} · {project.area}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/10 flex items-center justify-center"
        >
          <span className="rounded-full border border-white/40 bg-white/20 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white">
            Detayları Gör
          </span>
        </motion.div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-slate-900 text-base leading-snug group-hover:text-emerald-600 transition-colors">
          {project.title}
        </h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">
          {project.description}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-400 mb-0.5">Satış</p>
            <p className="text-[11px] font-semibold text-slate-900 leading-tight">{project.saleAmount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
            <Users className="h-3.5 w-3.5 text-blue-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-400 mb-0.5">Katılımcı</p>
            <p className="text-[11px] font-semibold text-slate-900">{project.participants}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
            <Calendar className="h-3.5 w-3.5 text-violet-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-400 mb-0.5">Süre</p>
            <p className="text-[11px] font-semibold text-slate-900">{project.duration}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-xl"
      >
        <div className={`h-48 bg-gradient-to-br ${project.gradient} relative`}>
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)',
            }}
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white">
              {project.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-md bg-white/20 border border-white/30 text-white`}
            >
              {project.status === 'Tamamlandı' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {project.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-4 left-4 text-xs text-white/80">
            {project.location} · {project.area}
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900">{project.title}</h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{project.details}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: <TrendingUp className="h-4 w-4 text-emerald-600" />, label: 'Satış Tutarı', value: project.saleAmount },
              { icon: <Users className="h-4 w-4 text-blue-600" />, label: 'Katılımcı', value: String(project.participants) },
              { icon: <Calendar className="h-4 w-4 text-violet-600" />, label: 'Süre', value: project.duration },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <div className="flex justify-center mb-1.5">{m.icon}</div>
                <p className="text-[10px] text-slate-400 mb-0.5">{m.label}</p>
                <p className="text-xs font-semibold text-slate-900">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/parcels"
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Mevcut Arsalara Bak
            </Link>
            <Link
              href="/auctions"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              İhalelere Katıl
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProjectsContent() {
  const content = usePageContent('page_content_projects', DEFAULT_CONTENT);
  const [activeCategory, setActiveCategory] = useState<Category>('Tümü');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filtered =
    activeCategory === 'Tümü'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === activeCategory);

  const completedCount = PROJECTS.filter((p) => p.status === 'Tamamlandı').length;
  const totalParticipants = PROJECTS.reduce((acc, p) => acc + p.participants, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-0 right-1/3 h-72 w-72 rounded-full bg-white/10 blur-[100px]" />

        <div className="relative px-4 pt-20 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-medium text-white mb-6">
              <BarChart3 className="h-3 w-3" />
              {completedCount} Proje Tamamlandı
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
              <span className="text-emerald-200">
                {content.hero_title}
              </span>
            </h1>
            <p className="max-w-xl mx-auto text-base text-white/80">
              {content.hero_description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10 flex flex-wrap justify-center gap-6"
          >
            {[
              { label: 'Tamamlanan Proje', value: String(completedCount) },
              { label: 'Toplam Katılımcı', value: totalParticipants.toLocaleString('tr-TR') },
              { label: 'Devam Eden', value: String(PROJECTS.length - completedCount) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-4 text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/70 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-24">
        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="my-10 flex flex-wrap gap-2 justify-center"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">
            Bu kategoride proje bulunmuyor.
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-slate-900">Siz de Yatırım Yapın</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Arsaları inceleyin veya canlı ihaleye katılarak uygun fiyata arsa edinin.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/parcels"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
            >
              Arsaları İncele
            </Link>
            <Link
              href="/auctions"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              İhalelere Katıl
            </Link>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
