import SwiftUI

struct ProfileView: View {
    @State private var auth = AuthStore.shared

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.30)
                ScrollView {
                    VStack(spacing: 16) {
                        header

                        // Menu items
                        VStack(spacing: 10) {
                            menuRow(icon: "heart.fill", title: "Favorilerim",
                                    tint: Color.brandDanger, destination: .favorites)
                            menuRow(icon: "doc.text.fill", title: "Tekliflerim",
                                    tint: Color.brandWarn, destination: .offers)
                            menuRow(icon: "hammer.fill", title: "İhale Geçmişim",
                                    tint: Color.brandPrimary, destination: .auctions)
                            menuRow(icon: "creditcard.fill", title: "Ödeme Geçmişim",
                                    tint: Color.brandSuccess, destination: .payments)
                            menuRow(icon: "bubble.left.and.bubble.right.fill", title: "Destek Mesajlarım",
                                    tint: Color.brandInfo, destination: .support)
                            menuRow(icon: "magnifyingglass", title: "Kayıtlı Aramalar",
                                    tint: Color.inkSecondary, destination: .savedSearches)
                            menuRow(icon: "bell.fill", title: "Bildirim Ayarları",
                                    tint: Color.brandAccent, destination: .notifications)
                        }

                        signOutButton
                        Spacer().frame(height: 24)
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 16)
                }
            }
            .navigationTitle("Profil")
            .toolbarTitleDisplayMode(.large)
            .navigationDestination(for: ProfileDestination.self) { dest in
                switch dest {
                case .favorites:     FavoritesView()
                case .offers:        OffersView()
                case .auctions:      ProfileEmptyView(title: "İhale Geçmişim", icon: "hammer")
                case .payments:      ProfileEmptyView(title: "Ödeme Geçmişim", icon: "creditcard")
                case .support:       SupportTicketsView()
                case .savedSearches: SavedSearchesView()
                case .notifications: NotificationsSettingsView()
                }
            }
        }
    }

    private var header: some View {
        GlassCard(cornerRadius: 24, tint: Color.brandPrimary.opacity(0.15)) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Color.brandPrimary, Color.brandPrimaryDeep],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 64, height: 64)
                    Text(String((auth.user?.displayName ?? "?").prefix(1)).uppercased())
                        .font(.title.bold())
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(auth.user?.displayName ?? "Kullanıcı")
                        .font(.title3.bold())
                        .foregroundStyle(Color.inkPrimary)
                    Text(auth.user?.email ?? "")
                        .font(.caption)
                        .foregroundStyle(Color.inkSecondary)
                    if auth.user?.isAdmin == true {
                        Text("YÖNETİCİ")
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.brandDanger, in: Capsule())
                            .padding(.top, 2)
                    }
                }
                Spacer()
            }
        }
    }

    private func menuRow(icon: String, title: String, tint: Color,
                         destination: ProfileDestination) -> some View {
        NavigationLink(value: destination) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(tint, in: .circle)
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.inkPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.inkMuted)
            }
            .padding(14)
            .background {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.ultraThinMaterial)
            }
            .overlay {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(.white.opacity(0.20), lineWidth: 0.5)
            }
        }
        .buttonStyle(.plain)
    }

    private var signOutButton: some View {
        Button(role: .destructive) {
            Task { await AuthStore.shared.signOut() }
        } label: {
            Label("Çıkış Yap", systemImage: "rectangle.portrait.and.arrow.right")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(Color.brandDanger)
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity)
                .background(Color.brandDanger.opacity(0.10), in: Capsule())
        }
        .padding(.top, 8)
    }
}

enum ProfileDestination: Hashable {
    case favorites, offers, auctions, payments, support, savedSearches, notifications
}

private struct ProfileEmptyView: View {
    let title: String
    let icon: String
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.largeTitle).foregroundStyle(Color.brandPrimary)
            Text(title).font(.title3.bold())
            Text("Yakında — Phase 3'te eklenecek")
                .font(.footnote).foregroundStyle(Color.inkSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AnimatedMeshBackground().opacity(0.30))
        .navigationTitle(title)
    }
}
