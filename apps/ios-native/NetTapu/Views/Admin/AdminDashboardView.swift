import SwiftUI

/// Admin hub. Shown as the leftmost tab when an admin signs in.
/// Cards lead to drill-down management surfaces; each handles its own
/// list / form lifecycle.
struct AdminDashboardView: View {
    @State private var stats: AdminStats?
    @State private var auth = AuthStore.shared

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.30)
                ScrollView {
                    VStack(spacing: 18) {
                        header
                        statRow
                        sectionGrid
                        Spacer().frame(height: 32)
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 12)
                }
            }
            .navigationTitle("Yönetim Paneli")
            .toolbarTitleDisplayMode(.large)
            .task { await loadStats() }
            .refreshable { await loadStats() }
            .navigationDestination(for: AdminRoute.self) { route in
                switch route {
                case .parcels:  AdminParcelsView()
                case .support:  AdminSupportInboxView()
                case .contacts: AdminContactsView()
                case .placeholder(let title, let icon):
                    AdminPlaceholderView(title: title, icon: icon)
                }
            }
        }
    }

    private var header: some View {
        GlassCard(cornerRadius: 24, tint: Color.brandDanger.opacity(0.12)) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Color.brandDanger, Color(hex: 0x991B1B)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 52, height: 52)
                    Image(systemName: "shield.checkered")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Yönetici Modu")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(Color.brandDanger)
                    Text(auth.user?.displayName ?? "Admin")
                        .font(.title3.bold())
                        .foregroundStyle(Color.inkPrimary)
                    Text(auth.user?.email ?? "")
                        .font(.caption)
                        .foregroundStyle(Color.inkSecondary)
                }
                Spacer()
            }
        }
    }

    private var statRow: some View {
        HStack(spacing: 10) {
            StatTile(value: stats?.parcels ?? 0, label: "Arsa", tint: Color.brandPrimary)
            StatTile(value: stats?.auctions ?? 0, label: "İhale", tint: Color.brandAccent)
            StatTile(value: stats?.openSupport ?? 0, label: "Açık Talep", tint: Color.brandDanger)
        }
    }

    private var sectionGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("YÖNETİM")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(Color.inkMuted)

            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10),
                                GridItem(.flexible(), spacing: 10)], spacing: 10) {
                AdminTile(icon: "map.fill", title: "Arsalar",
                          subtitle: "Liste, aktif/pasif, sil",
                          tint: Color.brandPrimary,
                          route: .parcels)
                AdminTile(icon: "hammer.fill", title: "İhaleler",
                          subtitle: "Yakında",
                          tint: Color.brandAccent,
                          route: .placeholder(title: "İhaleler", icon: "hammer.fill"))
                AdminTile(icon: "bubble.left.and.bubble.right.fill", title: "Destek",
                          subtitle: "Tüm konuşmalar",
                          tint: Color.brandInfo,
                          route: .support)
                AdminTile(icon: "phone.fill", title: "İletişim",
                          subtitle: "Talepler + görüşme başlat",
                          tint: Color.brandSuccess,
                          route: .contacts)
                AdminTile(icon: "person.2.fill", title: "Kullanıcılar",
                          subtitle: "Yakında",
                          tint: Color.inkSecondary,
                          route: .placeholder(title: "Kullanıcılar", icon: "person.2.fill"))
                AdminTile(icon: "chart.bar.fill", title: "Raporlar",
                          subtitle: "Yakında",
                          tint: Color(hex: 0x8B5CF6),
                          route: .placeholder(title: "Raporlar", icon: "chart.bar.fill"))
            }
        }
    }

    private func loadStats() async {
        do {
            struct Stats: Decodable {
                let parcels: Int?
                let auctions: Int?
                let openSupport: Int?
            }
            let s: Stats = try await APIClient.shared.get("/admin/analytics/overview")
            stats = AdminStats(parcels: s.parcels ?? 0,
                               auctions: s.auctions ?? 0,
                               openSupport: s.openSupport ?? 0)
        } catch {
            // fallback: just count tickets via the existing endpoint
            if let c: CountResponse = try? await APIClient.shared.get("/admin/support/unread-count") {
                stats = AdminStats(parcels: 0, auctions: 0, openSupport: c.count)
            }
        }
    }
}

struct AdminStats {
    let parcels: Int
    let auctions: Int
    let openSupport: Int
}

enum AdminRoute: Hashable {
    case parcels, support, contacts
    case placeholder(title: String, icon: String)
}

private struct StatTile: View {
    let value: Int
    let label: String
    let tint: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("\(value)")
                .font(.system(size: 26, weight: .black, design: .rounded))
                .foregroundStyle(tint)
            Text(label.uppercased())
                .font(.system(size: 9, weight: .heavy))
                .foregroundStyle(Color.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(.ultraThinMaterial, in: .rect(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(.white.opacity(0.20), lineWidth: 0.5)
        }
    }
}

private struct AdminTile: View {
    let icon: String
    let title: String
    let subtitle: String
    let tint: Color
    let route: AdminRoute

    var body: some View {
        NavigationLink(value: route) {
            VStack(alignment: .leading, spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(tint, in: .circle)
                Text(title)
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(Color.inkPrimary)
                Text(subtitle)
                    .font(.system(size: 11))
                    .foregroundStyle(Color.inkSecondary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(.ultraThinMaterial, in: .rect(cornerRadius: 18, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(.white.opacity(0.20), lineWidth: 0.5)
            }
        }
        .buttonStyle(.plain)
    }
}

struct AdminPlaceholderView: View {
    let title: String
    let icon: String
    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            VStack(spacing: 8) {
                Image(systemName: icon).font(.largeTitle).foregroundStyle(Color.brandPrimary)
                Text(title).font(.title3.bold())
                Text("Phase 3'te eklenecek")
                    .font(.footnote).foregroundStyle(Color.inkSecondary)
            }
        }
        .navigationTitle(title)
        .toolbarTitleDisplayMode(.inline)
    }
}
