# NetTapu Platform — Design System Redesign

## Original Request
"bunun tasarımlarını çok profesyonel hale getir"
(Make the design very professional)

User-provided context:
- Preferred colors: #515D2B (olive green) + white
- Logo: NETTAPU (olive "NET" + white "TAPU" on dark backdrop)
- Reference: sahibinden.com style
- Scope: All pages, headers, mobile app + web site

## Project Overview
NetTapu is a real-estate & land-sales platform with a live online auction engine.
Monorepo containing:
- `apps/web`   — Next.js 14 web app (public, user, admin)
- `apps/mobile`— React Native mobile app
- `apps/monolith` / `apps/auction-service` — NestJS backends
- `packages/shared` — shared types

## Design System (Jan 2026)
Professional sahibinden-style visual language:
- **Primary**: Olive green `#515d2b` (brand-600) — full 50–950 scale
- **Ink charcoal**: `#2c2c28`..`#121210` — headers, footers, dark panels
- **Gold accent**: `#b8894d` — premium highlights, CTAs
- **Typography**: Manrope (display/heading) + Inter fallback; tabular numerics for prices
- **Radii**: Sharper 3/5/8/10/14 px (was bubbly)
- **Shadows**: Tight, professional (replaced "AI slop" neon glows)

## Implemented (Jan 2026)
### Web (`apps/web`)
- `src/app/globals.css` — fully rewritten design tokens
- `tailwind.config.ts` — new brand/ink/gold palettes; emerald aliased to brand for backwards compat
- `src/components/ui/nettapu-logo.tsx` — reusable NETTAPU logo (light/dark/mono variants) + square mark
- `src/app/icon.svg` — NT favicon in olive
- `src/components/layout/header-pro.tsx` — 3-tier sahibinden-style header:
  1. Dark charcoal utility strip (phone, email, help, favorites)
  2. White main bar (logo + prominent persistent search + auth)
  3. Olive category bar (Arsalar, İhaleler, Harita, Kampanyalar, Rehber, Kurumsal, Destek)
- `src/components/layout/footer.tsx` — dark charcoal footer with trust strip, 4 link columns, social
- `src/components/layout/mobile-bottom-nav.tsx` — professional solid bottom tab bar
- `src/app/page.tsx` — redesigned home: olive hero + search + stats + category chips + featured/latest/auctions + 3-step + trust bar + testimonials + CTA
- `src/components/parcel-card.tsx` — sahibinden-style dense cards with sharp corners, status badges, meta pills
- `src/app/layout.tsx` — Manrope + Inter fonts, white bg, ink text
### Mobile (`apps/mobile`)
- `src/theme/colors.ts` — palette synced to olive #515d2b + charcoal

## Verified
✅ TypeScript compiles (only pre-existing @nettapu/shared issues)
✅ Next.js dev server runs, pages render
✅ Screenshots validated: desktop + mobile views show professional layout
✅ Dark text on dark checked — not present (white-on-olive + dark-on-white only)

## Backlog / P2
- Update inner pages that might still use legacy emerald/purple classes (parcels detail, auctions detail, admin)
- Replace logo with user's SVG when provided
- Mobile app screens (React Native) can get matching header/card components in a follow-up pass
