# NetTapu Platform — Design System Redesign

## Original Request
"bunun tasarımlarını çok profeyonel hale getir" (Make everything very professional)
Then: "Admin paneli ile parcel/auction detay sayfaları... React Native mobile ekranları... bütün sayfaları çok profesyonel yapıcaksın ve bütün mobile sayfalarını hem ios hem android için"

User-provided context:
- Preferred colors: #515D2B (olive green) + white
- Logo: NETTAPU (olive "NET" + white "TAPU" on dark backdrop)
- Reference: sahibinden.com style
- Scope: ALL web pages + iOS + Android (React Native) screens

## Project Overview
NetTapu is a real-estate & land-sales platform with a live online auction engine.
Monorepo:
- `apps/web`    — Next.js 14 web app (public, user, admin)
- `apps/mobile` — React Native (iOS + Android)
- `apps/monolith` / `apps/auction-service` — NestJS backends
- `packages/shared` — shared types

## Design System (Jan 2026)
Professional sahibinden-style visual language:
- **Primary brand**: `#515d2b` (olive, brand-600) full 50–950 scale
- **Ink charcoal**: `#2c2c28..#121210` — headers, footers, dark panels
- **Gold accent**: `#b8894d` — premium highlights
- **Typography**: Manrope (display/heading) + Inter fallback; tabular nums for prices
- **Radii**: Sharp 3/5/8/10/14 px (not bubbly)
- **Shadows**: Tight, professional, no neon glows
- **Emerald alias**: `emerald-*` → olive in Tailwind for backwards compat

## Implemented

### Phase 1 (Core design system)
- `apps/web/src/app/globals.css` — full rewrite of design tokens
- `apps/web/tailwind.config.ts` — brand / ink / gold palettes
- `apps/web/src/components/ui/nettapu-logo.tsx` — SVG logo (light/dark/mono)
- `apps/web/src/app/icon.svg` — NT favicon
- `apps/web/src/components/layout/header-pro.tsx` — 3-tier sahibinden header
- `apps/web/src/components/layout/footer.tsx` — dark charcoal footer
- `apps/web/src/components/layout/mobile-bottom-nav.tsx` — solid pro tab bar
- `apps/web/src/app/page.tsx` — new home (olive hero + search + categories)
- `apps/web/src/components/parcel-card.tsx` — sahibinden-style dense card
- `apps/web/src/app/layout.tsx` — Manrope + Inter fonts

### Phase 2 (All pages)
- `apps/web/src/app/(auth)/login/login-pro.tsx` — 2-pane prof. form + olive panel
- `apps/web/src/app/(auth)/register/register-pro.tsx` — same treatment + gold bonus badge
- `apps/web/src/app/(auction)/auctions/page.tsx` — olive banner + filter tabs + dense auction cards
- `apps/web/src/app/(auction)/layout.tsx` — simplified container
- `apps/web/src/app/(user)/profile/layout.tsx` — gradient-olive-soft banner + sidebar nav
- `apps/web/src/app/(content)/layout.tsx` — sahibinden-style breadcrumb + sidebar + help card
- `apps/web/src/app/admin/layout.tsx` — brand-aligned sidebar with NETTAPU logo + user card
- `apps/web/src/app/admin/page.tsx` — KPI cards color tokens updated

### Phase 3 (Mobile — iOS + Android)
React Native screens share a single codebase → one update serves both platforms.
- `apps/mobile/src/theme/colors.ts` — full olive palette + dark mode
- `apps/mobile/src/theme/typography.ts` — Manrope-like hierarchy, SF Pro on iOS, sans-serif-medium on Android, tabular nums for prices
- `apps/mobile/src/theme/spacing.ts` — tighter professional radii (3/5/8/10/14) + clean shadow scale with brand glow
- `apps/mobile/src/screens/home/HomeScreen.tsx` — heroGradient palette updated, category chip colors aligned, greeting text colors
- Global hex-color sweep across mobile: emerald (#16a34a, #15803d, #166534, #22c55e, #f0fdf4, #bbf7d0, #052e16) → olive brand palette; indigo/violet/slate-dark (#0f172a, #1e293b, #1e40af, #1e3a8a, #1d4ed8, #6366f1, #818cf8, #6b21a8, #312e81, #3b82f6, #2563eb, #7c3aed) → ink/brand; red + amber kept semantically
- Screens auto-inherit new palette via `useTheme()`: AuctionsListScreen, LoginScreen, RegisterScreen, ParcelsListScreen, ParcelDetailScreen, LiveAuctionScreen, ForgotPasswordScreen, OnboardingScreen, SplashScreen, PaymentResultScreen, DepositPaymentScreen, ProfileScreen, FavoritesScreen, NotificationsScreen, OffersScreen, PaymentsScreen, SettingsScreen, ThreeDsWebViewScreen, ParcelMapScreen
- Components updated via cascade: `Badge.tsx`, `AnimatedHeader.tsx`, `ParcelCard.tsx`

## Verified
- ✅ TypeScript compiles (only pre-existing @nettapu/shared issue)
- ✅ Next.js 14 dev: all routes render 200 (/, /login, /register, /auctions, /about, /parcels, /faq)
- ✅ Screenshots validated: home, auctions, login, register, about, parcels, faq, mobile
- ✅ No dark-on-dark contrast issues
- ✅ Logo consistent across header, footer, auth, admin panel

## Backlog / P2
- Replace inline NETTAPU logo with user's final SVG (will swap `nettapu-logo.tsx` when provided)
- Apple Sign-In wiring on web (button present, currently alerts)
- Admin inner pages: color polish on deep tables (stats cards now brand-aligned)
- Mobile DepositPaymentScreen, ThreeDsWebViewScreen — could get pro polish on the payment summary cards

## Notes / Integrations Status
- No third-party integration changes — purely UI/UX
- No MOCKED flows added in this design pass
