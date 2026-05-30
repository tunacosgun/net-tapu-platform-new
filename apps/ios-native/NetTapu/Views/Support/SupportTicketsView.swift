import SwiftUI

struct SupportTicketsView: View {
    @State private var tickets: [SupportTicket] = []
    @State private var loading = true
    @State private var showingNew = false
    @State private var selectedTicket: SupportTicket?

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.35)

                if loading {
                    ProgressView().tint(.brandPrimary)
                } else if tickets.isEmpty {
                    emptyState
                } else {
                    list
                }
            }
            .navigationTitle("Destek Mesajları")
            .toolbarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingNew = true } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.brandPrimary)
                    }
                }
            }
            .task { await load() }
            .refreshable { await load() }
            .sheet(isPresented: $showingNew, onDismiss: { Task { await load() } }) {
                SupportNewTicketSheet()
            }
            .navigationDestination(item: $selectedTicket) { t in
                SupportChatView(ticketId: t.id, initialSubject: t.subject)
            }
        }
    }

    private var list: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(tickets) { t in
                    Button { selectedTicket = t } label: {
                        SupportTicketRow(ticket: t)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 32)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "bubble.left.and.bubble.right.fill")
                .font(.system(size: 48))
                .foregroundStyle(.brandPrimary.opacity(0.7))
            Text("Henüz konuşmanız yok")
                .font(.title3.bold())
            Text("Sorularınız için destek ekibimizle hemen iletişime geçin.")
                .font(.subheadline)
                .foregroundStyle(.inkSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Button { showingNew = true } label: {
                Label("Yeni Konuşma", systemImage: "plus")
                    .font(.subheadline.bold())
                    .padding(.horizontal, 22)
                    .padding(.vertical, 12)
                    .background(.brandPrimary, in: Capsule())
                    .foregroundStyle(.white)
            }
            .padding(.top, 8)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            tickets = try await APIClient.shared.get("/support/tickets")
        } catch {
            tickets = []
        }
    }
}

private struct SupportTicketRow: View {
    let ticket: SupportTicket

    var body: some View {
        HStack(spacing: 12) {
            ZStack(alignment: .bottomTrailing) {
                Circle()
                    .fill(LinearGradient(colors: [.brandPrimary.opacity(0.7), .brandPrimary],
                                         startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 44, height: 44)
                Text(String(ticket.subject.prefix(1)).uppercased())
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                Circle()
                    .fill(statusColor(ticket.status))
                    .frame(width: 12, height: 12)
                    .overlay(Circle().strokeBorder(.white, lineWidth: 2))
                    .offset(x: 2, y: 2)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(ticket.subject)
                        .font(.subheadline.bold())
                        .foregroundStyle(.inkPrimary)
                        .lineLimit(1)
                    Spacer()
                    if ticket.unreadUser > 0 {
                        Text("\(ticket.unreadUser)")
                            .font(.caption2.bold())
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(.brandDanger, in: Capsule())
                    }
                }
                HStack(spacing: 6) {
                    GlassChip(text: ticket.status.localized, tint: statusColor(ticket.status))
                    Text(relativeTime(ticket.lastMessageAt ?? ticket.createdAt))
                        .font(.caption)
                        .foregroundStyle(.inkMuted)
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.inkMuted)
        }
        .padding(14)
        .background {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(.ultraThinMaterial)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(.white.opacity(0.25), lineWidth: 0.5)
        }
    }

    private func statusColor(_ s: TicketStatus) -> Color {
        switch s {
        case .open: return .brandInfo
        case .inProgress: return .brandWarn
        case .waitingUser: return Color(hex: 0x8B5CF6)
        case .closed: return .inkMuted
        }
    }
}

func relativeTime(_ iso: String) -> String {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let d = f.date(from: iso) ?? {
        let g = ISO8601DateFormatter()
        g.formatOptions = [.withInternetDateTime]
        return g.date(from: iso)
    }()
    guard let d else { return "" }
    let diff = Date().timeIntervalSince(d)
    if diff < 60 { return "az önce" }
    if diff < 3600 { return "\(Int(diff/60)) dk önce" }
    if diff < 86400 { return "\(Int(diff/3600)) saat önce" }
    return "\(Int(diff/86400)) gün önce"
}

// MARK: - New ticket sheet

private struct SupportNewTicketSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var subject = ""
    @State private var message = ""
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ZStack {
                AnimatedMeshBackground().opacity(0.35)
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Sorununuzu yazın")
                            .font(.title3.bold())

                        VStack(alignment: .leading, spacing: 6) {
                            Text("KONU").font(.caption.bold()).foregroundStyle(.inkSecondary)
                            TextField("Örn. Depozito iadesi", text: $subject)
                                .padding(12)
                                .background(.white.opacity(0.7), in: .rect(cornerRadius: 12, style: .continuous))
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("MESAJ").font(.caption.bold()).foregroundStyle(.inkSecondary)
                            TextEditor(text: $message)
                                .frame(minHeight: 150)
                                .padding(8)
                                .scrollContentBackground(.hidden)
                                .background(.white.opacity(0.7), in: .rect(cornerRadius: 12, style: .continuous))
                        }

                        if let error {
                            Text(error).font(.footnote).foregroundStyle(.brandDanger)
                        }

                        GlassButton(action: { Task { await submit() } }) {
                            if loading { ProgressView().tint(.white) } else { Text("Gönder") }
                        }
                        .disabled(subject.isEmpty || loading)
                        .opacity(subject.isEmpty || loading ? 0.5 : 1)
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Yeni Konuşma")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("İptal") { dismiss() }
                }
            }
        }
    }

    private func submit() async {
        guard !loading else { return }
        loading = true
        error = nil
        struct Body: Encodable { let subject: String; let initialMessage: String? }
        do {
            let _: SupportTicket = try await APIClient.shared.post(
                "/support/tickets",
                body: Body(subject: subject, initialMessage: message.isEmpty ? nil : message)
            )
            dismiss()
        } catch let e as APIError {
            error = e.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
