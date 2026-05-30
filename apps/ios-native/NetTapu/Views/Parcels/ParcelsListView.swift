import SwiftUI

struct ParcelsListView: View {
    @State private var parcels: [Parcel] = []
    @State private var loading = true
    @State private var search = ""

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.30)

                if loading && parcels.isEmpty {
                    ProgressView().tint(Color.brandPrimary)
                } else {
                    list
                }
            }
            .navigationTitle("İlanlar")
            .toolbarTitleDisplayMode(.large)
            .searchable(text: $search, prompt: "Şehir, ilçe, ada/parsel…")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private var filtered: [Parcel] {
        guard !search.isEmpty else { return parcels }
        let q = search.lowercased()
        return parcels.filter {
            $0.title.lowercased().contains(q)
            || ($0.city ?? "").lowercased().contains(q)
            || ($0.district ?? "").lowercased().contains(q)
            || ($0.ada ?? "").contains(q)
            || ($0.parsel ?? "").contains(q)
        }
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(filtered) { p in
                    NavigationLink(value: p) {
                        ParcelCard(parcel: p)
                    }
                    .buttonStyle(.plain)
                }
                if filtered.isEmpty {
                    Text("Sonuç bulunamadı")
                        .font(.subheadline)
                        .foregroundStyle(Color.inkSecondary)
                        .padding(.top, 40)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 4)
            .padding(.bottom, 32)
        }
        .navigationDestination(for: Parcel.self) { p in
            ParcelDetailView(parcel: p)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            let resp: PaginatedResponse<Parcel> = try await APIClient.shared.get(
                "/parcels",
                query: ["limit": "30", "status": "active"]
            )
            parcels = resp.data
        } catch {
            parcels = []
        }
    }
}

struct ParcelCard: View {
    let parcel: Parcel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image / placeholder
            ZStack(alignment: .topTrailing) {
                LinearGradient(
                    colors: [Color.brandPrimary.opacity(0.35),
                             Color.brandAccent.opacity(0.25)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
                .frame(height: 160)

                if parcel.isFeatured == true {
                    Text("ÖNE ÇIKAN")
                        .font(.system(size: 10, weight: .black))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.brandAccent, in: Capsule())
                        .padding(10)
                }

                VStack {
                    Spacer()
                    HStack {
                        if let area = parcel.areaM2 {
                            Label(area + " m²", systemImage: "ruler")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.black.opacity(0.45), in: Capsule())
                        }
                        Spacer()
                    }
                    .padding(10)
                }
            }
            .frame(height: 160)
            .clipShape(UnevenRoundedRectangle(topLeadingRadius: 18, topTrailingRadius: 18))

            // Body
            VStack(alignment: .leading, spacing: 8) {
                Text(parcel.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Color.inkPrimary)
                    .lineLimit(2)

                if let city = parcel.city, let district = parcel.district {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse")
                            .font(.system(size: 11))
                            .foregroundStyle(Color.inkMuted)
                        Text("\(city), \(district)")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.inkSecondary)
                    }
                }

                HStack(spacing: 6) {
                    if let lt = parcel.landType {
                        GlassChip(text: lt.uppercased())
                    }
                    if let ada = parcel.ada, let par = parcel.parsel {
                        GlassChip(text: "Ada \(ada) / Parsel \(par)", tint: Color.inkSecondary)
                    }
                }

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Fiyat")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(Color.inkMuted)
                        Text(PriceFormat.format(parcel.price, currency: parcel.currency))
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundStyle(Color.brandPrimary)
                    }
                    Spacer()
                }
            }
            .padding(14)
        }
        .background {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(.ultraThinMaterial)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(.white.opacity(0.25), lineWidth: 0.5)
        }
        .shadow(color: .black.opacity(0.06), radius: 12, x: 0, y: 6)
    }
}
