import SwiftUI

// MARK: - Saved searches

struct SavedSearchesView: View {
    @State private var items: [SavedSearch] = []
    @State private var loading = true

    struct SavedSearch: Identifiable, Decodable, Hashable {
        let id: String
        let name: String?
        let filters: [String: String]?
        let notifyOnMatch: Bool
        let createdAt: String
    }

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            if loading {
                ProgressView().tint(Color.brandPrimary)
            } else if items.isEmpty {
                empty
            } else {
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(items) { s in
                            row(s)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 32)
                }
            }
        }
        .navigationTitle("Kayıtlı Aramalar")
        .toolbarTitleDisplayMode(.large)
        .task { await load() }
        .refreshable { await load() }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Image(systemName: "magnifyingglass.circle")
                .font(.largeTitle)
                .foregroundStyle(Color.inkMuted)
            Text("Kayıtlı arama yok")
                .font(.title3.bold())
            Text("Arsalar sayfasında filtre uygulayıp kaydedebilirsiniz.")
                .font(.footnote)
                .foregroundStyle(Color.inkSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }

    private func row(_ s: SavedSearch) -> some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 32, height: 32)
                .background(Color.brandPrimary, in: .circle)
            VStack(alignment: .leading, spacing: 2) {
                Text(s.name ?? "Kayıtlı Arama")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Color.inkPrimary)
                if let f = s.filters, !f.isEmpty {
                    Text(f.map { "\($0.key): \($0.value)" }.joined(separator: " · "))
                        .font(.caption)
                        .foregroundStyle(Color.inkSecondary)
                        .lineLimit(1)
                }
            }
            Spacer()
            Image(systemName: s.notifyOnMatch ? "bell.fill" : "bell.slash")
                .font(.system(size: 14))
                .foregroundStyle(s.notifyOnMatch ? Color.brandPrimary : Color.inkMuted)
            Button { Task { await delete(s.id) } } label: {
                Image(systemName: "trash")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.brandDanger)
            }
        }
        .padding(12)
        .background(.ultraThinMaterial, in: .rect(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(.white.opacity(0.20), lineWidth: 0.5)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        if let arr: [SavedSearch] = try? await APIClient.shared.get("/saved-searches") {
            items = arr
        } else {
            items = []
        }
    }

    private func delete(_ id: String) async {
        let _: EmptyResponse? = try? await APIClient.shared.delete("/saved-searches/\(id)")
        await load()
    }
}

// MARK: - Notification preferences

struct NotificationsSettingsView: View {
    @State private var pushEnabled = true
    @State private var emailEnabled = true
    @State private var smsEnabled = false
    @State private var bidAlerts = true
    @State private var offerUpdates = true
    @State private var favoriteAlerts = true
    @State private var loading = true

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            ScrollView {
                VStack(spacing: 18) {
                    section("KANALLAR") {
                        toggle("Push Bildirim", systemImage: "bell.fill",
                               isOn: $pushEnabled, tint: Color.brandPrimary)
                        toggle("E-posta", systemImage: "envelope.fill",
                               isOn: $emailEnabled, tint: Color.brandInfo)
                        toggle("SMS", systemImage: "message.fill",
                               isOn: $smsEnabled, tint: Color.brandWarn)
                    }
                    section("KONULAR") {
                        toggle("Canlı ihale teklif uyarıları", systemImage: "hammer.fill",
                               isOn: $bidAlerts, tint: Color.brandAccent)
                        toggle("Teklif güncellemeleri", systemImage: "doc.text.fill",
                               isOn: $offerUpdates, tint: Color.brandInfo)
                        toggle("Favori fiyat değişimi", systemImage: "heart.fill",
                               isOn: $favoriteAlerts, tint: Color.brandDanger)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 16)
            }
        }
        .navigationTitle("Bildirim Ayarları")
        .toolbarTitleDisplayMode(.large)
        .task { await load() }
        .onChange(of: pushEnabled) { Task { await save() } }
        .onChange(of: emailEnabled) { Task { await save() } }
        .onChange(of: smsEnabled) { Task { await save() } }
        .onChange(of: bidAlerts) { Task { await save() } }
        .onChange(of: offerUpdates) { Task { await save() } }
        .onChange(of: favoriteAlerts) { Task { await save() } }
    }

    @ViewBuilder
    private func section<C: View>(_ title: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(Color.inkMuted)
            VStack(spacing: 8) { content() }
        }
    }

    private func toggle(_ label: String, systemImage: String,
                        isOn: Binding<Bool>, tint: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 32, height: 32)
                .background(tint, in: .circle)
            Text(label)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.inkPrimary)
            Spacer()
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(Color.brandPrimary)
        }
        .padding(14)
        .background(.ultraThinMaterial, in: .rect(cornerRadius: 14, style: .continuous))
    }

    private struct Prefs: Codable {
        var pushEnabled: Bool
        var emailEnabled: Bool
        var smsEnabled: Bool
        var bidAlerts: Bool
        var offerUpdates: Bool
        var favoriteAlerts: Bool
    }

    private func load() async {
        loading = true
        defer { loading = false }
        if let p: Prefs = try? await APIClient.shared.get("/user/notification-preferences") {
            pushEnabled = p.pushEnabled
            emailEnabled = p.emailEnabled
            smsEnabled = p.smsEnabled
            bidAlerts = p.bidAlerts
            offerUpdates = p.offerUpdates
            favoriteAlerts = p.favoriteAlerts
        }
    }

    private func save() async {
        let p = Prefs(pushEnabled: pushEnabled, emailEnabled: emailEnabled,
                      smsEnabled: smsEnabled, bidAlerts: bidAlerts,
                      offerUpdates: offerUpdates, favoriteAlerts: favoriteAlerts)
        let _: EmptyResponse? = try? await APIClient.shared.patch(
            "/user/notification-preferences", body: p
        )
    }
}

// MARK: - Account settings

struct SettingsView: View {
    @State private var auth = AuthStore.shared
    @State private var showSignOutConfirm = false

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            ScrollView {
                VStack(spacing: 18) {
                    profileCard
                    sectionList("HESAP", items: [
                        ("Profili Düzenle", "person.crop.circle.fill", Color.brandPrimary, .editProfile),
                        ("Şifreyi Değiştir", "key.fill", Color.brandWarn, .changePassword),
                        ("Güvenlik", "lock.shield.fill", Color.brandInfo, .security),
                    ])
                    sectionList("UYGULAMA", items: [
                        ("Bildirimler", "bell.fill", Color.brandAccent, .notifications),
                        ("Dil ve Bölge", "globe", Color.brandPrimary, .language),
                        ("Hakkında", "info.circle.fill", Color.inkSecondary, .about),
                    ])
                    signOutButton
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 16)
            }
        }
        .navigationTitle("Ayarlar")
        .toolbarTitleDisplayMode(.large)
        .confirmationDialog("Çıkış yapmak istediğine emin misin?",
                            isPresented: $showSignOutConfirm, titleVisibility: .visible) {
            Button("Çıkış Yap", role: .destructive) { Task { await auth.signOut() } }
            Button("İptal", role: .cancel) { }
        }
        .navigationDestination(for: SettingsDestination.self) { dest in
            switch dest {
            case .notifications: NotificationsSettingsView()
            case .editProfile, .changePassword, .security, .language, .about:
                ComingSoonView(title: dest.title)
            }
        }
    }

    private var profileCard: some View {
        GlassCard(cornerRadius: 22, tint: Color.brandPrimary.opacity(0.12)) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Color.brandPrimary, Color.brandPrimaryDeep],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 56, height: 56)
                    Text(String((auth.user?.displayName ?? "?").prefix(1)).uppercased())
                        .font(.title.bold())
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(auth.user?.displayName ?? "Kullanıcı")
                        .font(.headline)
                        .foregroundStyle(Color.inkPrimary)
                    Text(auth.user?.email ?? "")
                        .font(.caption)
                        .foregroundStyle(Color.inkSecondary)
                }
                Spacer()
            }
        }
    }

    private func sectionList(_ title: String,
                             items: [(String, String, Color, SettingsDestination)]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(Color.inkMuted)
            VStack(spacing: 6) {
                ForEach(items, id: \.0) { (label, icon, tint, dest) in
                    NavigationLink(value: dest) {
                        HStack(spacing: 12) {
                            Image(systemName: icon)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 32, height: 32)
                                .background(tint, in: .circle)
                            Text(label)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(Color.inkPrimary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(Color.inkMuted)
                        }
                        .padding(14)
                        .background(.ultraThinMaterial, in: .rect(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var signOutButton: some View {
        Button(role: .destructive) { showSignOutConfirm = true } label: {
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

enum SettingsDestination: Hashable {
    case editProfile, changePassword, security, notifications, language, about

    var title: String {
        switch self {
        case .editProfile: return "Profili Düzenle"
        case .changePassword: return "Şifreyi Değiştir"
        case .security: return "Güvenlik"
        case .notifications: return "Bildirimler"
        case .language: return "Dil ve Bölge"
        case .about: return "Hakkında"
        }
    }
}

struct ComingSoonView: View {
    let title: String
    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            VStack(spacing: 12) {
                Image(systemName: "sparkles")
                    .font(.system(size: 48))
                    .foregroundStyle(Color.brandAccent)
                Text(title).font(.title3.bold()).foregroundStyle(Color.inkPrimary)
                Text("Yakında")
                    .font(.subheadline)
                    .foregroundStyle(Color.inkSecondary)
            }
        }
        .navigationTitle(title)
        .toolbarTitleDisplayMode(.inline)
    }
}
