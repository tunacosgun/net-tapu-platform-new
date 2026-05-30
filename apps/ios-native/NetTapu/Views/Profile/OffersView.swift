import SwiftUI

struct OffersView: View {
    @State private var offers: [Offer] = []
    @State private var loading = true
    @State private var counterTarget: Offer?

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            if loading && offers.isEmpty {
                ProgressView().tint(Color.brandPrimary)
            } else if offers.isEmpty {
                empty
            } else {
                list
            }
        }
        .navigationTitle("Tekliflerim")
        .toolbarTitleDisplayMode(.large)
        .task { await load() }
        .refreshable { await load() }
        .sheet(item: $counterTarget) { offer in
            CounterResponseSheet(offer: offer, onComplete: { Task { await load() } })
        }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Image(systemName: "doc.text")
                .font(.largeTitle)
                .foregroundStyle(Color.brandWarn)
            Text("Henüz teklif vermediniz")
                .font(.title3.bold())
                .foregroundStyle(Color.inkPrimary)
            Text("Beğendiğiniz bir arsa için teklif vererek başlayabilirsiniz.")
                .font(.footnote)
                .foregroundStyle(Color.inkSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(offers) { o in
                    OfferRow(offer: o, onCounter: { counterTarget = o })
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            offers = try await APIClient.shared.get("/crm/offers/mine")
        } catch {
            offers = []
        }
    }
}

private struct OfferRow: View {
    let offer: Offer
    let onCounter: () -> Void

    private var statusMeta: (label: String, tint: Color) {
        switch offer.status {
        case "pending":    return ("Beklemede", Color.brandWarn)
        case "accepted":   return ("Kabul Edildi", Color.brandSuccess)
        case "rejected":   return ("Reddedildi", Color.brandDanger)
        case "countered":  return ("Karşı Teklif", Color.brandInfo)
        case "expired":    return ("Süresi Doldu", Color.inkMuted)
        case "withdrawn":  return ("Geri Çekildi", Color.inkMuted)
        default:           return (offer.status, Color.inkSecondary)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(statusMeta.label)
                    .font(.system(size: 10, weight: .black))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusMeta.tint, in: Capsule())
                Spacer()
            }

            if let title = offer.parcelTitle {
                Text(title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Color.inkPrimary)
                    .lineLimit(2)
            }

            HStack(alignment: .firstTextBaseline) {
                Text(PriceFormat.format(offer.amount, currency: offer.parcelCurrency ?? offer.currency))
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(Color.brandPrimary)
                Spacer()
            }

            if let msg = offer.message, !msg.isEmpty {
                Text(msg)
                    .font(.caption)
                    .foregroundStyle(Color.inkSecondary)
                    .italic()
                    .padding(.leading, 4)
                    .padding(.vertical, 4)
                    .overlay(alignment: .leading) {
                        Rectangle().fill(Color.inkMuted).frame(width: 2)
                    }
            }

            if offer.status == "countered", let counter = offer.lastCounterAmount {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("SATICININ KARŞI TEKLİFİ")
                                .font(.system(size: 9, weight: .heavy))
                                .foregroundStyle(Color.brandInfo)
                            Text(PriceFormat.format(counter, currency: offer.parcelCurrency))
                                .font(.system(size: 20, weight: .black, design: .rounded))
                                .foregroundStyle(Color.brandInfo)
                        }
                        Spacer()
                    }
                    HStack(spacing: 8) {
                        actionButton("Kabul", tint: Color.brandSuccess) {
                            Task { await respond("accept") }
                        }
                        actionButton("Karşı", tint: Color.brandInfo, filled: false, action: onCounter)
                        actionButton("Reddet", tint: Color.brandDanger, filled: false) {
                            Task { await respond("reject") }
                        }
                    }
                }
                .padding(12)
                .background(Color.brandInfo.opacity(0.08), in: .rect(cornerRadius: 12, style: .continuous))
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
    }

    private func actionButton(_ label: String, tint: Color, filled: Bool = true,
                              action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(filled ? .white : tint)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(filled ? tint : tint.opacity(0.12), in: Capsule())
        }
        .buttonStyle(.plain)
    }

    private func respond(_ type: String) async {
        struct Body: Encodable { let responseType: String }
        let _: SupportTicket? = try? await APIClient.shared.post(
            "/crm/offers/\(offer.id)/buyer-respond",
            body: Body(responseType: type)
        )
    }
}

// MARK: - Counter response sheet

private struct CounterResponseSheet: View {
    let offer: Offer
    var onComplete: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var amountText = ""
    @State private var loading = false

    private var amount: Decimal {
        let digits = amountText.filter("0123456789".contains)
        return Decimal(string: digits) ?? 0
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.30)
                VStack(alignment: .leading, spacing: 16) {
                    Text("Karşı teklifinizi gönderin")
                        .font(.title3.bold())
                    Text("Satıcının teklifini reddedip yeni bir tutar önerin.")
                        .font(.subheadline)
                        .foregroundStyle(Color.inkSecondary)

                    TextField("Tutar", text: $amountText)
                        .keyboardType(.numberPad)
                        .padding(14)
                        .background(.white.opacity(0.7), in: .rect(cornerRadius: 14, style: .continuous))

                    Spacer()
                    GlassButton(action: { Task { await send() } }) {
                        if loading { ProgressView().tint(.white) } else { Text("Gönder") }
                    }
                    .disabled(amount == 0 || loading)
                    .opacity(amount == 0 || loading ? 0.5 : 1)
                }
                .padding(20)
            }
            .navigationTitle("Karşı Teklif")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("İptal") { dismiss() }
                }
            }
        }
    }

    private func send() async {
        loading = true
        defer { loading = false }
        struct Body: Encodable {
            let responseType: String
            let counterAmount: String
        }
        let _: SupportTicket? = try? await APIClient.shared.post(
            "/crm/offers/\(offer.id)/buyer-respond",
            body: Body(responseType: "counter", counterAmount: "\(amount)")
        )
        onComplete()
        dismiss()
    }
}
