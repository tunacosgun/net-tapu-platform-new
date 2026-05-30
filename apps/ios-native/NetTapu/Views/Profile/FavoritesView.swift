import SwiftUI

struct FavoritesView: View {
    @State private var favorites: [Favorite] = []
    @State private var loading = true

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            if loading && favorites.isEmpty {
                ProgressView().tint(Color.brandPrimary)
            } else if favorites.isEmpty {
                empty
            } else {
                list
            }
        }
        .navigationTitle("Favorilerim")
        .toolbarTitleDisplayMode(.large)
        .task { await load() }
        .refreshable { await load() }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Image(systemName: "heart")
                .font(.largeTitle)
                .foregroundStyle(Color.brandDanger)
            Text("Favori ilanınız yok")
                .font(.title3.bold())
                .foregroundStyle(Color.inkPrimary)
            Text("Beğendiğiniz ilanları kalp ikonuna basarak favorilerinize ekleyin.")
                .font(.footnote)
                .foregroundStyle(Color.inkSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(favorites) { f in
                    if let parcel = f.parcel {
                        NavigationLink(value: parcel) {
                            ParcelCard(parcel: parcel)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .navigationDestination(for: Parcel.self) { p in
            ParcelDetailView(parcel: p)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        struct Resp: Decodable { let data: [Favorite]? }
        do {
            let resp: Resp = try await APIClient.shared.get("/favorites")
            favorites = resp.data ?? []
        } catch {
            // /favorites might return [Favorite] directly without pagination wrapper
            if let arr: [Favorite] = try? await APIClient.shared.get("/favorites") {
                favorites = arr
            } else {
                favorites = []
            }
        }
    }
}
