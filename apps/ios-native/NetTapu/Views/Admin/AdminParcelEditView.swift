import SwiftUI
import PhotosUI

/// Full create/edit form for a parcel — mirrors web's /admin/parcels/new.
/// Lazy-loads existing values when `parcelId` is passed, otherwise starts
/// blank. Status radio at the bottom controls draft vs immediate publish.
struct AdminParcelEditView: View {
    let parcelId: String?

    @Environment(\.dismiss) private var dismiss
    @State private var form = ParcelForm()
    @State private var loading = false
    @State private var saving = false
    @State private var error: String?

    private var isEditing: Bool { parcelId != nil }

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            if loading {
                ProgressView().tint(Color.brandPrimary)
            } else {
                ScrollView {
                    VStack(spacing: 16) {
                        sectionHeader("TEMEL BİLGİLER")
                        textField("Başlık *", text: $form.title)
                        textArea("Açıklama", text: $form.description)

                        sectionHeader("KONUM")
                        textField("Şehir *", text: $form.city)
                        textField("İlçe *", text: $form.district)
                        textField("Mahalle / Köy", text: $form.neighborhood)

                        sectionHeader("PARSEL")
                        HStack(spacing: 10) {
                            textField("Ada *", text: $form.ada).frame(maxWidth: .infinity)
                            textField("Parsel *", text: $form.parsel).frame(maxWidth: .infinity)
                        }
                        textField("m²", text: $form.areaM2, keyboard: .decimalPad)
                        landTypePicker

                        sectionHeader("FİYAT")
                        textField("Fiyat (TL)", text: $form.price, keyboard: .numberPad)

                        sectionHeader("YAYIN DURUMU")
                        statusRadio

                        if let error {
                            Text(error).font(.caption).foregroundStyle(Color.brandDanger)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        submitButton
                        Spacer().frame(height: 24)
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 12)
                }
            }
        }
        .navigationTitle(isEditing ? "Arsayı Düzenle" : "Yeni Arsa")
        .toolbarTitleDisplayMode(.inline)
        .task { if isEditing { await loadExisting() } }
    }

    // MARK: Form helpers

    private func sectionHeader(_ s: String) -> some View {
        Text(s)
            .font(.system(size: 11, weight: .heavy))
            .foregroundStyle(Color.inkMuted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 6)
    }

    private func textField(_ label: String, text: Binding<String>,
                           keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption2.bold())
                .foregroundStyle(Color.inkSecondary)
            TextField(label, text: text)
                .keyboardType(keyboard)
                .textInputAutocapitalization(.sentences)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(.white.opacity(0.7), in: .rect(cornerRadius: 12, style: .continuous))
        }
    }

    private func textArea(_ label: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption2.bold())
                .foregroundStyle(Color.inkSecondary)
            TextEditor(text: text)
                .frame(minHeight: 110)
                .padding(8)
                .scrollContentBackground(.hidden)
                .background(.white.opacity(0.7), in: .rect(cornerRadius: 12, style: .continuous))
        }
    }

    private var landTypePicker: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Arazi Türü *")
                .font(.caption2.bold())
                .foregroundStyle(Color.inkSecondary)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(landTypes, id: \.0) { (slug, label) in
                        Button { form.landType = slug } label: {
                            Text(label)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(form.landType == slug ? .white : Color.inkSecondary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .background(form.landType == slug ? Color.brandPrimary : Color.inkSecondary.opacity(0.10),
                                            in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private let landTypes: [(String, String)] = [
        ("arsa", "Arsa"), ("tarla", "Tarla"), ("bag", "Bağ"),
        ("bahce", "Bahçe"), ("zeytinlik", "Zeytinlik"), ("orman", "Orman"),
        ("mera", "Mera"), ("imarli", "İmarlı"), ("imarsiz", "İmarsız"),
        ("diger", "Diğer")
    ]

    private var statusRadio: some View {
        VStack(spacing: 8) {
            statusOption("active", title: "Hemen Yayınla",
                         subtitle: "İlan oluşturulduğu anda canlıya alınır.",
                         tint: Color.brandSuccess)
            statusOption("draft", title: "Taslak Olarak Kaydet",
                         subtitle: "Sitede görünmez; sonra elle yayınlarsınız.",
                         tint: Color.brandWarn)
        }
    }

    private func statusOption(_ value: String, title: String, subtitle: String, tint: Color) -> some View {
        let selected = form.status == value
        return Button { form.status = value } label: {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    Circle()
                        .strokeBorder(selected ? tint : Color.inkMuted, lineWidth: 2)
                        .frame(width: 20, height: 20)
                    if selected {
                        Circle().fill(tint).frame(width: 10, height: 10)
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(Color.inkPrimary)
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(Color.inkSecondary)
                }
                Spacer()
            }
            .padding(14)
            .background(.ultraThinMaterial, in: .rect(cornerRadius: 14, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(selected ? tint : Color.white.opacity(0.20),
                                  lineWidth: selected ? 2 : 0.5)
            }
        }
        .buttonStyle(.plain)
    }

    private var submitButton: some View {
        GlassButton(action: { Task { await submit() } }) {
            if saving { ProgressView().tint(.white) }
            else { Text(isEditing ? "Değişiklikleri Kaydet" : "Arsayı Oluştur") }
        }
        .disabled(saving || !form.isValid)
        .opacity((saving || !form.isValid) ? 0.5 : 1)
    }

    // MARK: Networking

    private func loadExisting() async {
        guard let id = parcelId else { return }
        loading = true
        defer { loading = false }
        if let p: Parcel = try? await APIClient.shared.get("/parcels/\(id)") {
            form = ParcelForm(from: p)
        }
    }

    private func submit() async {
        saving = true
        defer { saving = false }
        error = nil
        do {
            if let id = parcelId {
                let _: Parcel = try await APIClient.shared.patch("/admin/parcels/\(id)",
                                                                  body: form.encodable)
            } else {
                let _: Parcel = try await APIClient.shared.post("/parcels", body: form.encodable)
            }
            dismiss()
        } catch let e as APIError {
            error = e.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}

private struct ParcelForm {
    var title: String = ""
    var description: String = ""
    var city: String = ""
    var district: String = ""
    var neighborhood: String = ""
    var ada: String = ""
    var parsel: String = ""
    var areaM2: String = ""
    var landType: String = "arsa"
    var price: String = ""
    var status: String = "active"

    init() {}
    init(from p: Parcel) {
        title = p.title
        description = p.description ?? ""
        city = p.city ?? ""
        district = p.district ?? ""
        neighborhood = p.neighborhood ?? ""
        ada = p.ada ?? ""
        parsel = p.parsel ?? ""
        areaM2 = p.areaM2 ?? ""
        landType = p.landType ?? "arsa"
        price = p.price ?? ""
        status = p.status ?? "active"
    }

    var isValid: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty
        && !city.isEmpty && !district.isEmpty
        && !ada.isEmpty && !parsel.isEmpty
        && !landType.isEmpty
    }

    var encodable: Body {
        Body(title: title, description: description.isEmpty ? nil : description,
             city: city, district: district,
             neighborhood: neighborhood.isEmpty ? nil : neighborhood,
             ada: ada, parsel: parsel,
             areaM2: areaM2.isEmpty ? nil : areaM2,
             landType: landType,
             price: price.isEmpty ? nil : price,
             status: status)
    }

    struct Body: Encodable {
        let title: String
        let description: String?
        let city: String
        let district: String
        let neighborhood: String?
        let ada: String
        let parsel: String
        let areaM2: String?
        let landType: String
        let price: String?
        let status: String
    }
}
