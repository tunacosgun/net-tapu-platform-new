import SwiftUI

struct AdminParcelsView: View {
    @State private var parcels: [Parcel] = []
    @State private var loading = true
    @State private var statusFilter: String = "all"

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            VStack(spacing: 0) {
                filterBar
                if loading && parcels.isEmpty {
                    Spacer()
                    ProgressView().tint(Color.brandPrimary)
                    Spacer()
                } else {
                    listScroll
                }
            }
        }
        .navigationTitle("Tüm Arsalar")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(["all", "active", "draft", "deposit_taken", "sold", "withdrawn"], id: \.self) { s in
                    Button { statusFilter = s; Task { await load() } } label: {
                        Text(label(for: s))
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(statusFilter == s ? .white : Color.inkSecondary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .background(statusFilter == s ? Color.brandPrimary : Color.inkSecondary.opacity(0.10),
                                        in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
    }

    private func label(for s: String) -> String {
        switch s {
        case "all": return "Tümü"
        case "active": return "Aktif"
        case "draft": return "Taslak"
        case "deposit_taken": return "Depozito Alındı"
        case "sold": return "Satıldı"
        case "withdrawn": return "Geri Çekildi"
        default: return s
        }
    }

    private var listScroll: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(parcels) { p in
                    AdminParcelRow(parcel: p, onChanged: { Task { await load() } })
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        var q: [String: String] = ["limit": "50"]
        if statusFilter != "all" { q["status"] = statusFilter }
        do {
            let resp: PaginatedResponse<Parcel> = try await APIClient.shared.get(
                "/admin/parcels", query: q
            )
            parcels = resp.data
        } catch {
            // fallback to public listing
            do {
                let resp: PaginatedResponse<Parcel> = try await APIClient.shared.get(
                    "/parcels", query: q
                )
                parcels = resp.data
            } catch { parcels = [] }
        }
    }
}

private struct AdminParcelRow: View {
    let parcel: Parcel
    var onChanged: () -> Void
    @State private var working = false
    @State private var showDeleteConfirm = false

    private var statusTint: Color {
        switch parcel.status {
        case "active": return Color.brandSuccess
        case "draft": return Color.brandWarn
        case "deposit_taken": return Color.brandInfo
        case "sold": return Color(hex: 0x6D28D9)
        case "withdrawn": return Color.inkMuted
        default: return Color.inkSecondary
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(parcel.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.inkPrimary)
                        .lineLimit(2)
                    HStack(spacing: 4) {
                        if let id = parcel.listingId {
                            Text(id)
                                .font(.system(size: 10, weight: .heavy, design: .monospaced))
                                .foregroundStyle(Color.inkMuted)
                        }
                        if let city = parcel.city, let district = parcel.district {
                            Text("· \(city), \(district)")
                                .font(.system(size: 11))
                                .foregroundStyle(Color.inkSecondary)
                        }
                    }
                }
                Spacer()
                Text((parcel.status ?? "").uppercased())
                    .font(.system(size: 9, weight: .black))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(statusTint, in: Capsule())
            }

            HStack {
                Text(PriceFormat.format(parcel.price, currency: parcel.currency))
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundStyle(Color.brandPrimary)
                if let m = parcel.areaM2 {
                    Text("· \(m) m²")
                        .font(.caption)
                        .foregroundStyle(Color.inkSecondary)
                }
                Spacer()
            }

            // Action row
            HStack(spacing: 8) {
                if parcel.status == "draft" {
                    actionButton("Yayınla", tint: Color.brandSuccess, icon: "checkmark.circle") {
                        Task { await setStatus("active") }
                    }
                } else if parcel.status == "active" {
                    actionButton("Pasifleştir", tint: Color.brandWarn, icon: "pause.circle") {
                        Task { await setStatus("withdrawn") }
                    }
                }
                actionButton("Sil", tint: Color.brandDanger, icon: "trash") {
                    showDeleteConfirm = true
                }
                Spacer()
            }
        }
        .padding(14)
        .background(.ultraThinMaterial, in: .rect(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(.white.opacity(0.20), lineWidth: 0.5)
        }
        .opacity(working ? 0.5 : 1)
        .confirmationDialog("Bu arsayı silmek üzeresin",
                            isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button("Sil", role: .destructive) { Task { await deleteParcel() } }
            Button("İptal", role: .cancel) { }
        }
    }

    private func actionButton(_ label: String, tint: Color, icon: String,
                              action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .bold))
                Text(label)
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(tint)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(tint.opacity(0.12), in: Capsule())
        }
        .buttonStyle(.plain)
        .disabled(working)
    }

    private func setStatus(_ s: String) async {
        working = true
        defer { working = false }
        struct Body: Encodable { let status: String }
        let _: Parcel? = try? await APIClient.shared.patch(
            "/admin/parcels/\(parcel.id)/status", body: Body(status: s)
        )
        onChanged()
    }

    private func deleteParcel() async {
        working = true
        defer { working = false }
        let _: EmptyResponse? = try? await APIClient.shared.delete("/admin/parcels/\(parcel.id)")
        onChanged()
    }
}
