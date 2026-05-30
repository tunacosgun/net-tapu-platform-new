import SwiftUI

struct AdminContactsView: View {
    @State private var contacts: [ContactRequest] = []
    @State private var loading = true
    @State private var promoteTarget: ContactRequest?

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            if loading && contacts.isEmpty {
                ProgressView().tint(Color.brandPrimary)
            } else if contacts.isEmpty {
                empty
            } else {
                list
            }
        }
        .navigationTitle("İletişim Talepleri")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
        .sheet(item: $promoteTarget) { c in
            PromoteContactSheet(contact: c, onCreated: { _ in
                promoteTarget = nil
                Task { await load() }
            })
        }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Image(systemName: "tray")
                .font(.largeTitle)
                .foregroundStyle(Color.inkMuted)
            Text("Talep yok")
                .font(.title3.bold())
                .foregroundStyle(Color.inkPrimary)
        }
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(contacts) { c in
                    ContactRow(contact: c, onPromote: { promoteTarget = c })
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
            let resp: PaginatedResponse<ContactRequest> = try await APIClient.shared.get(
                "/crm/contact-requests", query: ["limit": "50"]
            )
            contacts = resp.data
        } catch {
            // Some controllers return a plain array
            if let arr: [ContactRequest] = try? await APIClient.shared.get("/crm/contact-requests") {
                contacts = arr
            } else {
                contacts = []
            }
        }
    }
}

private struct ContactRow: View {
    let contact: ContactRequest
    var onPromote: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(contact.name)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(Color.inkPrimary)
                Spacer()
                if let s = contact.status {
                    Text(s.uppercased())
                        .font(.system(size: 9, weight: .black))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(statusTint(s), in: Capsule())
                }
            }
            if let p = contact.phone {
                Label(p, systemImage: "phone")
                    .font(.caption)
                    .foregroundStyle(Color.inkSecondary)
            }
            if let e = contact.email {
                Label(e, systemImage: "envelope")
                    .font(.caption)
                    .foregroundStyle(Color.inkSecondary)
            }
            if let msg = contact.message, !msg.isEmpty {
                Text(msg)
                    .font(.caption)
                    .foregroundStyle(Color.inkPrimary)
                    .lineLimit(3)
                    .padding(.top, 4)
            }
            HStack {
                Text(relativeTime(contact.createdAt))
                    .font(.system(size: 10))
                    .foregroundStyle(Color.inkMuted)
                Spacer()
                Button(action: onPromote) {
                    HStack(spacing: 4) {
                        Image(systemName: "bubble.left.and.bubble.right.fill").font(.caption2)
                        Text("Görüşmeyi Başlat").font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10).padding(.vertical, 6)
                    .background(Color.brandPrimary, in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .background(.ultraThinMaterial, in: .rect(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(.white.opacity(0.20), lineWidth: 0.5)
        }
    }

    private func statusTint(_ s: String) -> Color {
        switch s {
        case "new": return Color.brandInfo
        case "assigned", "in_progress": return Color.brandWarn
        case "completed": return Color.brandSuccess
        case "cancelled": return Color.inkMuted
        default: return Color.inkSecondary
        }
    }
}

private struct PromoteContactSheet: View {
    let contact: ContactRequest
    var onCreated: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var greeting: String
    @State private var loading = false

    init(contact: ContactRequest, onCreated: @escaping (String) -> Void) {
        self.contact = contact
        self.onCreated = onCreated
        _greeting = State(initialValue: "Merhaba \(contact.name), talebinizi aldık. Size nasıl yardımcı olabilirim?")
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.30)
                VStack(alignment: .leading, spacing: 14) {
                    Text("Müşteriyle canlı sohbete geç")
                        .font(.title3.bold())
                        .foregroundStyle(Color.inkPrimary)
                    Text(contact.name + (contact.email.map { " · \($0)" } ?? ""))
                        .font(.caption)
                        .foregroundStyle(Color.inkSecondary)

                    TextEditor(text: $greeting)
                        .frame(minHeight: 140)
                        .padding(8)
                        .scrollContentBackground(.hidden)
                        .background(.white.opacity(0.7), in: .rect(cornerRadius: 14, style: .continuous))

                    Spacer()
                    GlassButton(action: { Task { await submit() } }) {
                        if loading { ProgressView().tint(.white) } else { Text("Başlat") }
                    }
                    .disabled(loading)
                }
                .padding(20)
            }
            .navigationTitle("Görüşmeyi Başlat")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("İptal") { dismiss() } }
            }
        }
    }

    private func submit() async {
        loading = true
        defer { loading = false }
        struct Body: Encodable {
            let contactRequestId: String
            let greeting: String?
        }
        if let t: SupportTicket = try? await APIClient.shared.post(
            "/admin/support/tickets/from-contact",
            body: Body(contactRequestId: contact.id,
                       greeting: greeting.isEmpty ? nil : greeting)
        ) {
            onCreated(t.id)
        }
    }
}
