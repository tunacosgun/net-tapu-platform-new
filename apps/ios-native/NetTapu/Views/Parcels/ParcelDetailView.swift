import SwiftUI

struct ParcelDetailView: View {
    let parcel: Parcel

    @State private var showOfferSheet = false
    @State private var isFavorite = false
    @State private var favoritePending = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                heroImage
                content
            }
            .padding(.bottom, 40)
        }
        .background(Color(.systemBackground))
        .navigationTitle("")
        .toolbarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            bottomBar
        }
        .sheet(isPresented: $showOfferSheet) {
            OfferSheet(parcel: parcel)
        }
        .task { await loadFavorite() }
    }

    private var heroImage: some View {
        ZStack(alignment: .topTrailing) {
            LinearGradient(
                colors: [Color.brandPrimary.opacity(0.45),
                         Color.brandAccent.opacity(0.35)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            .frame(height: 280)

            HStack {
                Button { Task { await toggleFavorite() } } label: {
                    Image(systemName: isFavorite ? "heart.fill" : "heart")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(isFavorite ? Color.brandDanger : Color.inkPrimary)
                        .frame(width: 40, height: 40)
                        .background(.ultraThinMaterial, in: .circle)
                }
                .disabled(favoritePending)
                .padding(.top, 8)
                .padding(.trailing, 16)
            }

            VStack {
                Spacer()
                HStack {
                    if let area = parcel.areaM2 {
                        Label("\(area) m²", systemImage: "ruler")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(.black.opacity(0.45), in: Capsule())
                    }
                    Spacer()
                }
                .padding(16)
            }
        }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text(parcel.title)
                    .font(.system(size: 22, weight: .heavy, design: .rounded))
                    .foregroundStyle(Color.inkPrimary)
                if let city = parcel.city, let district = parcel.district {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.inkMuted)
                        Text("\(city), \(district)" + (parcel.neighborhood.map { " · \($0)" } ?? ""))
                            .font(.subheadline)
                            .foregroundStyle(Color.inkSecondary)
                    }
                }
            }

            // Chips row
            HStack(spacing: 6) {
                if let lt = parcel.landType {
                    GlassChip(text: lt.uppercased())
                }
                if let ada = parcel.ada, let par = parcel.parsel {
                    GlassChip(text: "Ada \(ada)/Parsel \(par)", tint: Color.inkSecondary)
                }
                if parcel.isAuctionEligible == true {
                    GlassChip(text: "AÇIK ARTTIRMA", tint: Color.brandAccent)
                }
            }

            // Price card
            GlassCard(cornerRadius: 20, tint: Color.brandPrimary.opacity(0.10)) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("FİYAT")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(Color.inkMuted)
                    Text(PriceFormat.format(parcel.price, currency: parcel.currency))
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(Color.brandPrimary)
                    if let min = parcel.minOfferAmount {
                        Text("Minimum teklif: \(PriceFormat.format(String(describing: min), currency: parcel.currency))")
                            .font(.caption)
                            .foregroundStyle(Color.inkSecondary)
                    }
                }
            }

            // Description
            if let desc = parcel.description, !desc.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Açıklama")
                        .font(.headline)
                        .foregroundStyle(Color.inkPrimary)
                    Text(desc)
                        .font(.subheadline)
                        .foregroundStyle(Color.inkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(.horizontal, 18)
    }

    private var bottomBar: some View {
        HStack(spacing: 10) {
            Button { /* call */ } label: {
                Label("Ara", systemImage: "phone.fill")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(.ultraThinMaterial, in: Capsule())
                    .foregroundStyle(Color.inkPrimary)
                    .font(.subheadline.bold())
            }
            GlassButton(action: { showOfferSheet = true }) {
                HStack {
                    Image(systemName: "hand.raised.fill")
                    Text("Teklif Ver")
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.thinMaterial)
    }

    private func toggleFavorite() async {
        favoritePending = true
        defer { favoritePending = false }
        do {
            if isFavorite {
                let _: EmptyResponse = try await APIClient.shared.delete("/favorites/\(parcel.id)")
            } else {
                struct Body: Encodable { let parcelId: String }
                let _: Favorite = try await APIClient.shared.post(
                    "/favorites", body: Body(parcelId: parcel.id)
                )
            }
            isFavorite.toggle()
        } catch { /* ignore */ }
    }

    private func loadFavorite() async {
        // The /favorites endpoint returns the full list; check if this parcel is in it.
        struct FavListResp: Decodable { let data: [Favorite]? }
        if let resp: FavListResp = try? await APIClient.shared.get("/favorites") {
            isFavorite = (resp.data ?? []).contains { $0.parcelId == parcel.id }
        }
    }
}

// MARK: - Offer sheet (with 80% min-price enforcement)

struct OfferSheet: View {
    let parcel: Parcel
    @Environment(\.dismiss) private var dismiss
    @State private var amountText = ""
    @State private var note = ""
    @State private var loading = false
    @State private var error: String?

    private var amountNumeric: Decimal {
        let digits = amountText.filter("0123456789".contains)
        return Decimal(string: digits) ?? 0
    }
    private var tooLow: Bool {
        guard let min = parcel.minOfferAmount else { return false }
        return amountNumeric > 0 && amountNumeric < min
    }
    private var canSubmit: Bool { amountNumeric > 0 && !tooLow && !loading }

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.30)
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Teklifinizi girin")
                            .font(.title3.bold())

                        if let min = parcel.minOfferAmount {
                            HStack {
                                Image(systemName: "info.circle.fill").foregroundStyle(Color.brandWarn)
                                Text("Minimum teklif: \(PriceFormat.format(String(describing: min), currency: parcel.currency))")
                                    .font(.footnote)
                                    .foregroundStyle(Color.inkSecondary)
                            }
                            .padding(12)
                            .background(Color.brandWarn.opacity(0.10), in: .rect(cornerRadius: 12, style: .continuous))
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("TUTAR")
                                .font(.caption.bold())
                                .foregroundStyle(Color.inkSecondary)
                            TextField("Örn. 4.000.000", text: $amountText)
                                .keyboardType(.numberPad)
                                .padding(14)
                                .background(.white.opacity(0.7), in: .rect(cornerRadius: 14, style: .continuous))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .strokeBorder(tooLow ? Color.brandDanger : .clear, lineWidth: 1)
                                }
                            if tooLow {
                                Text("İlan fiyatının %80'inden düşük olamaz.")
                                    .font(.caption)
                                    .foregroundStyle(Color.brandDanger)
                            }
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("NOTUNUZ (opsiyonel)")
                                .font(.caption.bold())
                                .foregroundStyle(Color.inkSecondary)
                            TextEditor(text: $note)
                                .frame(minHeight: 100)
                                .padding(8)
                                .scrollContentBackground(.hidden)
                                .background(.white.opacity(0.7), in: .rect(cornerRadius: 14, style: .continuous))
                        }

                        if let error {
                            Text(error).font(.footnote).foregroundStyle(Color.brandDanger)
                        }

                        GlassButton(action: { Task { await submit() } }) {
                            if loading { ProgressView().tint(.white) } else { Text("Teklif Gönder") }
                        }
                        .disabled(!canSubmit)
                        .opacity(canSubmit ? 1 : 0.5)
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Teklif Ver")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("İptal") { dismiss() }
                }
            }
        }
    }

    private func submit() async {
        guard canSubmit else { return }
        loading = true
        defer { loading = false }
        struct Body: Encodable {
            let parcelId: String
            let amount: String
            let message: String?
        }
        do {
            let _: Offer = try await APIClient.shared.post(
                "/crm/offers",
                body: Body(parcelId: parcel.id,
                           amount: "\(amountNumeric)",
                           message: note.isEmpty ? nil : note)
            )
            dismiss()
        } catch let e as APIError {
            error = e.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
