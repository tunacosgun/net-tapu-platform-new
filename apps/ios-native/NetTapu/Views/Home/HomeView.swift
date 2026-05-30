import SwiftUI

struct HomeView: View {
    @State private var auth = AuthStore.shared
    @State private var selectedTab: Tab = .home

    enum Tab { case home, parcels, auctions, support, profile }

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeFeedView()
                .tabItem { Label("Ana Sayfa", systemImage: "house.fill") }
                .tag(Tab.home)

            ParcelsPlaceholderView()
                .tabItem { Label("İlanlar", systemImage: "map.fill") }
                .tag(Tab.parcels)

            AuctionsPlaceholderView()
                .tabItem { Label("İhaleler", systemImage: "hammer.fill") }
                .tag(Tab.auctions)

            SupportTicketsView()
                .tabItem { Label("Destek", systemImage: "bubble.left.and.bubble.right.fill") }
                .tag(Tab.support)

            ProfilePlaceholderView()
                .tabItem { Label("Profil", systemImage: "person.fill") }
                .tag(Tab.profile)
        }
        .tint(Color.brandPrimary)
    }
}

// MARK: - Home tab

private struct HomeFeedView: View {
    @State private var auth = AuthStore.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    heroCard
                    quickActions
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
            }
            .background {
                AnimatedMeshBackground().opacity(0.45)
            }
            .navigationTitle("")
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top) {
                topBar
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
            Button { /* notifications */ } label: {
                Image(systemName: "bell")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(Color.inkPrimary)
                    .padding(10)
                    .background(.ultraThinMaterial, in: .circle)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    private var heroCard: some View {
        GlassCard(cornerRadius: 28, tint: .brandPrimary.opacity(0.18)) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    GlassChip(text: "BUGÜN", tint: .brandAccent)
                    Spacer()
                }
                Text("Aradığınız arsayı bulun.")
                    .font(.system(size: 26, weight: .heavy, design: .rounded))
                    .foregroundStyle(Color.inkPrimary)
                Text("Türkiye'nin güvenilir arsa & ihale platformu — tapulu, sınırlı kaynaklı yatırım fırsatları.")
                    .font(.subheadline)
                    .foregroundStyle(Color.inkSecondary)
                GlassButton(action: { /* search */ }) {
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
                QuickActionTile(icon: "map.fill", title: "Tüm Arsalar", tint: .brandPrimary)
                QuickActionTile(icon: "hammer.fill", title: "Canlı İhaleler", tint: .brandAccent)
                QuickActionTile(icon: "heart.fill", title: "Favorilerim", tint: .brandDanger)
                QuickActionTile(icon: "doc.text.fill", title: "Tekliflerim", tint: .brandInfo)
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

// MARK: - Tab placeholders (filled in next session)

private struct ParcelsPlaceholderView: View {
    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.35)
            VStack(spacing: 8) {
                Image(systemName: "map").font(.largeTitle).foregroundStyle(Color.brandPrimary)
                Text("Arsalar")
                    .font(.title3.bold())
                Text("Yakında — Phase 2'de eklenecek")
                    .font(.footnote)
                    .foregroundStyle(Color.inkSecondary)
            }
        }
    }
}

private struct AuctionsPlaceholderView: View {
    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.35)
            VStack(spacing: 8) {
                Image(systemName: "hammer").font(.largeTitle).foregroundStyle(Color.brandAccent)
                Text("İhaleler")
                    .font(.title3.bold())
                Text("Yakında — Phase 2'de eklenecek")
                    .font(.footnote)
                    .foregroundStyle(Color.inkSecondary)
            }
        }
    }
}

private struct ProfilePlaceholderView: View {
    @State private var auth = AuthStore.shared
    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.35)
            VStack(spacing: 16) {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(Color.brandPrimary)
                Text(auth.user?.displayName ?? "")
                    .font(.title3.bold())
                Text(auth.user?.email ?? "")
                    .font(.footnote)
                    .foregroundStyle(Color.inkSecondary)
                Button(role: .destructive) {
                    Task { await AuthStore.shared.signOut() }
                } label: {
                    Label("Çıkış Yap", systemImage: "rectangle.portrait.and.arrow.right")
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                }
                .background(.ultraThinMaterial, in: Capsule())
            }
        }
    }
}
