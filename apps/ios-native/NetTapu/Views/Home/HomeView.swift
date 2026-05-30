import SwiftUI

/// Top-level tab shell. Admin users get a "Yönetim" tab as the first
/// entry so they see the management hub immediately on sign-in; regular
/// users get the marketing home feed.
struct HomeView: View {
    @State private var auth = AuthStore.shared
    @State private var selectedTab: Tab = .home

    enum Tab: Hashable { case admin, home, parcels, auctions, support, profile }

    var body: some View {
        TabView(selection: $selectedTab) {
            if auth.user?.isAdmin == true {
                AdminDashboardView()
                    .tabItem { Label("Yönetim", systemImage: "shield.checkered") }
                    .tag(Tab.admin)
            }

            HomeFeedView()
                .tabItem { Label("Ana Sayfa", systemImage: "house.fill") }
                .tag(Tab.home)

            ParcelsListView()
                .tabItem { Label("İlanlar", systemImage: "map.fill") }
                .tag(Tab.parcels)

            AuctionsListView()
                .tabItem { Label("İhaleler", systemImage: "hammer.fill") }
                .tag(Tab.auctions)

            SupportTicketsView()
                .tabItem { Label("Destek", systemImage: "bubble.left.and.bubble.right.fill") }
                .tag(Tab.support)

            ProfileView()
                .tabItem { Label("Profil", systemImage: "person.fill") }
                .tag(Tab.profile)
        }
        .tint(Color.brandPrimary)
        .onAppear {
            // Land admins on the dashboard the first time they reach Home,
            // but don't fight them if they manually switch tabs later.
            if auth.user?.isAdmin == true && selectedTab == .home {
                selectedTab = .admin
            }
        }
    }
}

// MARK: - Home feed (regular user marketing surface)

private struct HomeFeedView: View {
    @State private var auth = AuthStore.shared
    @State private var featured: [Parcel] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    heroCard
                    quickActions
                    featuredSection
                    Spacer()
                }
                .padding(.horizontal, 18)
                .padding(.top, 12)
                .padding(.bottom, 32)
            }
            .background {
                AnimatedMeshBackground().opacity(0.40)
            }
            .navigationTitle("")
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top) {
                topBar
            }
            .task { await loadFeatured() }
            .navigationDestination(for: Parcel.self) { p in
                ParcelDetailView(parcel: p)
            }
        }
    }

    private var topBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Merhaba")
                    .font(.footnote)
                    .foregroundStyle(Color.inkSecondary)
                Text(auth.user?.displayName ?? "")
                    .font(.title3.bold())
                    .foregroundStyle(Color.inkPrimary)
            }
            Spacer()
            Image(systemName: "bell")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Color.inkPrimary)
                .padding(10)
                .background(.ultraThinMaterial, in: .circle)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    private var heroCard: some View {
        GlassCard(cornerRadius: 28, tint: Color.brandPrimary.opacity(0.18)) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    GlassChip(text: "BUGÜN", tint: Color.brandAccent)
                    Spacer()
                }
                Text("Aradığınız arsayı bulun.")
                    .font(.system(size: 26, weight: .heavy, design: .rounded))
                    .foregroundStyle(Color.inkPrimary)
                Text("Türkiye'nin güvenilir arsa & ihale platformu — tapulu, sınırlı kaynaklı yatırım fırsatları.")
                    .font(.subheadline)
                    .foregroundStyle(Color.inkSecondary)
                GlassButton(action: { }) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                        Text("Arsa & İhale ara")
                    }
                }
                .padding(.top, 8)
            }
        }
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Hızlı Erişim")
                .font(.headline)
                .foregroundStyle(Color.inkSecondary)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 2),
                      spacing: 12) {
                QuickActionTile(icon: "map.fill", title: "Tüm Arsalar", tint: Color.brandPrimary)
                QuickActionTile(icon: "hammer.fill", title: "Canlı İhaleler", tint: Color.brandAccent)
                QuickActionTile(icon: "heart.fill", title: "Favorilerim", tint: Color.brandDanger)
                QuickActionTile(icon: "doc.text.fill", title: "Tekliflerim", tint: Color.brandInfo)
            }
        }
    }

    private var featuredSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Öne Çıkan Arsalar")
                    .font(.headline)
                    .foregroundStyle(Color.inkSecondary)
                Spacer()
            }
            if featured.isEmpty {
                Text("Yükleniyor…")
                    .font(.caption)
                    .foregroundStyle(Color.inkMuted)
            } else {
                ForEach(featured.prefix(5)) { p in
                    NavigationLink(value: p) {
                        ParcelCard(parcel: p)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func loadFeatured() async {
        do {
            let resp: PaginatedResponse<Parcel> = try await APIClient.shared.get(
                "/parcels", query: ["limit": "5", "isFeatured": "true", "status": "active"]
            )
            featured = resp.data
        } catch {
            // Fallback: any active parcels
            if let resp: PaginatedResponse<Parcel> = try? await APIClient.shared.get(
                "/parcels", query: ["limit": "5", "status": "active"]
            ) {
                featured = resp.data
            }
        }
    }
}

private struct QuickActionTile: View {
    let icon: String
    let title: String
    let tint: Color
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(tint, in: .circle)
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color.inkPrimary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(.ultraThinMaterial)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(.white.opacity(0.25), lineWidth: 0.5)
        }
    }
}
