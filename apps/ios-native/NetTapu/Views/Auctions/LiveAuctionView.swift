import SwiftUI

struct LiveAuctionView: View {
    let auction: Auction

    @State private var bids: [BidEntry] = []
    @State private var currentBid: Decimal = 0
    @State private var connected = false
    @State private var showBidSheet = false
    @State private var socket: AuctionSocket?
    @State private var auth = AuthStore.shared

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            ScrollView {
                VStack(spacing: 16) {
                    heroImage
                    VStack(spacing: 18) {
                        header
                        currentBidCard
                        bidsFeed
                        Spacer().frame(height: 24)
                    }
                    .padding(.horizontal, 18)
                }
                .padding(.top, 0)
            }
        }
        .navigationTitle(auction.title)
        .toolbarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            bottomBar
        }
        .sheet(isPresented: $showBidSheet) {
            BidSheet(auction: auction,
                     currentBid: currentBid > 0 ? currentBid : Decimal(string: auction.startingPrice ?? "0") ?? 0,
                     onPlace: { amount in placeBid(amount) })
        }
        .task { startSocket() }
        .onDisappear { socket?.close() }
    }

    @ViewBuilder
    private var heroImage: some View {
        if let url = auction.coverImageURL {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let img): img.resizable().scaledToFill()
                case .empty:
                    ZStack {
                        Color.brandPrimary.opacity(0.15)
                        ProgressView()
                    }
                case .failure: Color.brandPrimary.opacity(0.15)
                @unknown default: Color.brandPrimary.opacity(0.15)
                }
            }
            .frame(height: 220)
            .clipped()
            .overlay {
                LinearGradient(colors: [.black.opacity(0.20), .clear, .clear, .black.opacity(0.30)],
                               startPoint: .top, endPoint: .bottom)
            }
        }
    }

    private var header: some View {
        HStack {
            HStack(spacing: 6) {
                Circle()
                    .fill(connected ? Color.brandSuccess : Color.brandDanger)
                    .frame(width: 8, height: 8)
                    .overlay {
                        if connected {
                            Circle()
                                .fill(Color.brandSuccess)
                                .frame(width: 8, height: 8)
                                .scaleEffect(2)
                                .opacity(0.3)
                                .animation(.easeOut(duration: 1.2).repeatForever(autoreverses: false), value: connected)
                        }
                    }
                Text(connected ? "CANLI" : "BAĞLANIYOR")
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(connected ? Color.brandSuccess : Color.inkMuted)
            }
            Spacer()
            if let end = auction.scheduledEnd {
                Label(timeRemaining(end), systemImage: "clock.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.brandDanger)
            }
        }
    }

    private var currentBidCard: some View {
        GlassCard(cornerRadius: 24, tint: Color.brandPrimary.opacity(0.12)) {
            VStack(alignment: .leading, spacing: 4) {
                Text("ŞU ANKİ TEKLİF")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(Color.inkMuted)
                Text(PriceFormat.format(currentBid > 0 ? "\(currentBid)" : auction.startingPrice,
                                        currency: auction.currency))
                    .font(.system(size: 36, weight: .black, design: .rounded))
                    .foregroundStyle(Color.brandPrimary)
                    .contentTransition(.numericText())
                    .animation(.bouncy, value: currentBid)
                HStack(spacing: 16) {
                    detail(label: "BAŞLANGIÇ", value: PriceFormat.format(auction.startingPrice, currency: auction.currency))
                    detail(label: "ARTIŞ", value: PriceFormat.format(auction.minimumIncrement, currency: auction.currency))
                    detail(label: "DEPOZİTO", value: PriceFormat.format(auction.requiredDeposit, currency: auction.currency))
                }
                .padding(.top, 8)
            }
        }
    }

    private func detail(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 9, weight: .heavy))
                .foregroundStyle(Color.inkMuted)
            Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.inkPrimary)
        }
    }

    private var bidsFeed: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("TEKLİF AKIŞI")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(Color.inkMuted)
                Spacer()
                Text("\(bids.count) teklif")
                    .font(.caption2)
                    .foregroundStyle(Color.inkSecondary)
            }
            if bids.isEmpty {
                Text("Henüz teklif yok — ilk teklifi siz verin!")
                    .font(.subheadline)
                    .foregroundStyle(Color.inkSecondary)
                    .padding(20)
                    .frame(maxWidth: .infinity)
                    .background(.ultraThinMaterial, in: .rect(cornerRadius: 14, style: .continuous))
            } else {
                ForEach(bids) { b in
                    HStack {
                        Circle().fill(Color.brandPrimary.opacity(0.7))
                            .frame(width: 32, height: 32)
                            .overlay {
                                Text(String(b.bidderInitial))
                                    .font(.caption.bold())
                                    .foregroundStyle(.white)
                            }
                        VStack(alignment: .leading, spacing: 1) {
                            Text(b.label)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(Color.inkPrimary)
                            Text(b.time)
                                .font(.system(size: 10))
                                .foregroundStyle(Color.inkMuted)
                        }
                        Spacer()
                        Text(PriceFormat.format("\(b.amount)", currency: b.currency))
                            .font(.system(size: 15, weight: .black, design: .rounded))
                            .foregroundStyle(Color.brandPrimary)
                    }
                    .padding(12)
                    .background(.ultraThinMaterial, in: .rect(cornerRadius: 14, style: .continuous))
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
    }

    private var bottomBar: some View {
        HStack(spacing: 10) {
            NavigationLink {
                DepositPaymentView(auction: auction)
            } label: {
                Label("Depozito", systemImage: "creditcard.fill")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(.ultraThinMaterial, in: Capsule())
                    .foregroundStyle(Color.inkPrimary)
                    .font(.subheadline.bold())
            }
            GlassButton(action: { showBidSheet = true }) {
                HStack {
                    Image(systemName: "hammer.fill")
                    Text("Teklif Ver")
                }
            }
            .frame(maxWidth: .infinity)
            .disabled(!connected || auction.status != "live")
            .opacity((!connected || auction.status != "live") ? 0.5 : 1)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.thinMaterial)
    }

    private func startSocket() {
        socket = AuctionSocket(token: auth.accessToken, auctionId: auction.id) { event in
            switch event {
            case .connected:    connected = true
            case .disconnected: connected = false
            case .bidPlaced(let amount, let currency, let bidderId):
                let d = Decimal(string: amount) ?? 0
                if d > currentBid { currentBid = d }
                let entry = BidEntry(
                    id: UUID().uuidString,
                    amount: d,
                    currency: currency,
                    label: bidderId == AuthStore.shared.user?.id ? "Sizin teklifiniz" : "Anonim teklif",
                    time: Date().formatted(date: .omitted, time: .shortened),
                    bidderInitial: bidderId == AuthStore.shared.user?.id ? "S" : "A"
                )
                withAnimation(.spring) { bids.insert(entry, at: 0) }
            case .auctionEnded: connected = false
            case .raw: break
            }
        }
        socket?.connect()
    }

    private func placeBid(_ amount: Decimal) {
        socket?.emit("place_bid", payload: [
            "auctionId": auction.id,
            "amount": "\(amount)"
        ])
        showBidSheet = false
    }

    private func timeRemaining(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let end = f.date(from: iso) ?? {
            let g = ISO8601DateFormatter(); g.formatOptions = [.withInternetDateTime]
            return g.date(from: iso)
        }()
        guard let end else { return "" }
        let diff = end.timeIntervalSinceNow
        if diff <= 0 { return "Bitti" }
        let h = Int(diff) / 3600
        let m = (Int(diff) % 3600) / 60
        let s = Int(diff) % 60
        return h > 0 ? "\(h)s \(m)dk" : "\(m)dk \(s)sn"
    }
}

struct BidEntry: Identifiable, Hashable {
    let id: String
    let amount: Decimal
    let currency: String?
    let label: String
    let time: String
    let bidderInitial: Character
}

// MARK: - Bid input sheet

private struct BidSheet: View {
    let auction: Auction
    let currentBid: Decimal
    var onPlace: (Decimal) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var text = ""

    private var minBid: Decimal {
        let inc = Decimal(string: auction.minimumIncrement ?? "1") ?? 1
        return currentBid + inc
    }

    private var amount: Decimal {
        let digits = text.filter("0123456789".contains)
        return Decimal(string: digits) ?? 0
    }
    private var tooLow: Bool { amount > 0 && amount < minBid }

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.30)
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "info.circle.fill").foregroundStyle(Color.brandWarn)
                        Text("Minimum teklif: \(PriceFormat.format("\(minBid)", currency: auction.currency))")
                            .font(.footnote)
                            .foregroundStyle(Color.inkSecondary)
                    }
                    .padding(12)
                    .background(Color.brandWarn.opacity(0.10), in: .rect(cornerRadius: 12, style: .continuous))

                    TextField("Teklif tutarı", text: $text)
                        .keyboardType(.numberPad)
                        .padding(14)
                        .background(.white.opacity(0.7), in: .rect(cornerRadius: 14, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .strokeBorder(tooLow ? Color.brandDanger : .clear, lineWidth: 1)
                        }
                    if tooLow {
                        Text("Şu anki tekliften en az minimum artış kadar yüksek olmalı.")
                            .font(.caption)
                            .foregroundStyle(Color.brandDanger)
                    }

                    Spacer()
                    GlassButton(action: { onPlace(amount); dismiss() }) {
                        Text("Teklifi Gönder")
                    }
                    .disabled(amount == 0 || tooLow)
                    .opacity(amount == 0 || tooLow ? 0.5 : 1)
                }
                .padding(20)
            }
            .navigationTitle("Canlı Teklif Ver")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("İptal") { dismiss() } }
            }
        }
    }
}
