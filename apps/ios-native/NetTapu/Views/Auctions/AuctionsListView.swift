import SwiftUI

struct AuctionsListView: View {
    @State private var auctions: [Auction] = []
    @State private var loading = true

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.30)
                if loading && auctions.isEmpty {
                    ProgressView().tint(Color.brandPrimary)
                } else if auctions.isEmpty {
                    empty
                } else {
                    list
                }
            }
            .navigationTitle("İhaleler")
            .toolbarTitleDisplayMode(.large)
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(auctions) { a in
                    AuctionCard(auction: a)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
            .padding(.bottom, 32)
        }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Image(systemName: "hammer")
                .font(.largeTitle)
                .foregroundStyle(Color.brandAccent)
            Text("Aktif ihale yok")
                .font(.title3.bold())
                .foregroundStyle(Color.inkPrimary)
            Text("Yakında yeni ihaleler eklenecek")
                .font(.footnote)
                .foregroundStyle(Color.inkSecondary)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            let resp: PaginatedResponse<Auction> = try await APIClient.shared.get(
                "/auctions",
                query: ["limit": "30"]
            )
            auctions = resp.data
        } catch {
            auctions = []
        }
    }
}

private struct AuctionCard: View {
    let auction: Auction

    private var statusTint: Color {
        switch auction.status {
        case "live", "ending": return Color.brandDanger
        case "scheduled": return Color.brandInfo
        case "ended": return Color.inkMuted
        default: return Color.brandPrimary
        }
    }

    private var statusLabel: String {
        switch auction.status {
        case "live": return "CANLI"
        case "scheduled": return "PLANLI"
        case "ending": return "SON DAKIKA"
        case "ended": return "BİTTİ"
        case "draft": return "TASLAK"
        case "cancelled": return "İPTAL"
        default: return auction.status.uppercased()
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(statusLabel)
                    .font(.system(size: 10, weight: .black))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusTint, in: Capsule())
                Spacer()
            }

            Text(auction.title)
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(Color.inkPrimary)
                .lineLimit(2)

            HStack(spacing: 18) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("BAŞLANGIÇ")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(Color.inkMuted)
                    Text(PriceFormat.format(auction.startingPrice, currency: auction.currency))
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundStyle(Color.brandPrimary)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("DEPOZİTO")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(Color.inkMuted)
                    Text(PriceFormat.format(auction.requiredDeposit, currency: auction.currency))
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.brandAccent)
                }
                Spacer()
            }
        }
        .padding(16)
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
