import SwiftUI

/// Admin-side support inbox. Lists every ticket across users; tapping a
/// row pushes the same admin-mode chat view so the operator can reply.
struct AdminSupportInboxView: View {
    @State private var tickets: [SupportTicket] = []
    @State private var loading = true
    @State private var statusFilter: String = "all"

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            VStack(spacing: 0) {
                filterBar
                if loading && tickets.isEmpty {
                    Spacer(); ProgressView().tint(Color.brandPrimary); Spacer()
                } else {
                    list
                }
            }
        }
        .navigationTitle("Destek Kutusu")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(["all", "open", "in_progress", "waiting_user", "closed"], id: \.self) { s in
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
        case "open": return "Yeni"
        case "in_progress": return "Görüşmede"
        case "waiting_user": return "Cevap Bekliyor"
        case "closed": return "Kapalı"
        default: return s
        }
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(tickets) { t in
                    NavigationLink {
                        AdminChatView(ticketId: t.id, headerName: t.userDisplayName ?? "Kullanıcı",
                                      subject: t.subject)
                    } label: {
                        AdminTicketRow(ticket: t)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        var q: [String: String] = [:]
        if statusFilter != "all" { q["status"] = statusFilter }
        do {
            tickets = try await APIClient.shared.get("/admin/support/tickets", query: q)
        } catch {
            tickets = []
        }
    }
}

private struct AdminTicketRow: View {
    let ticket: SupportTicket

    private var statusTint: Color {
        switch ticket.status {
        case .open: return Color.brandInfo
        case .inProgress: return Color.brandWarn
        case .waitingUser: return Color(hex: 0x8B5CF6)
        case .closed: return Color.inkMuted
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            ZStack(alignment: .bottomTrailing) {
                Circle()
                    .fill(LinearGradient(colors: [Color.brandPrimary.opacity(0.7), Color.brandPrimary],
                                         startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 44, height: 44)
                Text(String((ticket.userDisplayName ?? "?").prefix(1)).uppercased())
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                Circle()
                    .fill(statusTint)
                    .frame(width: 12, height: 12)
                    .overlay(Circle().strokeBorder(.white, lineWidth: 2))
                    .offset(x: 2, y: 2)
            }
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(ticket.userDisplayName ?? "Misafir")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.inkPrimary)
                    Spacer()
                    if let n = ticket.unreadAdmin, n > 0 {
                        Text("\(n)")
                            .font(.caption2.bold())
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.brandDanger, in: Capsule())
                    }
                }
                Text(ticket.subject)
                    .font(.caption)
                    .foregroundStyle(Color.inkSecondary)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    GlassChip(text: ticket.status.localized, tint: statusTint)
                    Text(relativeTime(ticket.lastMessageAt ?? ticket.createdAt))
                        .font(.system(size: 10))
                        .foregroundStyle(Color.inkMuted)
                }
            }
        }
        .padding(12)
        .background(.ultraThinMaterial, in: .rect(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(.white.opacity(0.20), lineWidth: 0.5)
        }
    }
}

/// Admin-mode chat — same UX as SupportChatView but routes through the
/// `/admin/support` endpoints so the "user vs admin" view of read/unread
/// is correct, and the admin can flip a ticket's status from the header.
struct AdminChatView: View {
    let ticketId: String
    let headerName: String
    let subject: String

    @State private var thread: SupportThreadResponse?
    @State private var draft = ""
    @State private var sending = false
    @State private var pollTask: Task<Void, Never>?

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            VStack(spacing: 0) {
                statusPicker
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(thread?.messages ?? []) { m in
                                MessageBubbleAdmin(msg: m).id(m.id)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                    .onChange(of: thread?.messages.count) {
                        if let last = thread?.messages.last?.id {
                            withAnimation { proxy.scrollTo(last, anchor: .bottom) }
                        }
                    }
                }
                composer
            }
        }
        .navigationTitle(headerName)
        .toolbarTitleDisplayMode(.inline)
        .task { await startPolling() }
        .onDisappear { pollTask?.cancel() }
    }

    private var statusPicker: some View {
        HStack {
            Text(subject)
                .font(.caption)
                .foregroundStyle(Color.inkSecondary)
                .lineLimit(1)
            Spacer()
            Menu {
                Button("Görüşmede") { Task { await setStatus("in_progress") } }
                Button("Cevap Bekliyor") { Task { await setStatus("waiting_user") } }
                Button("Kapat", role: .destructive) { Task { await setStatus("closed") } }
                Button("Yeniden Aç") { Task { await setStatus("open") } }
            } label: {
                HStack(spacing: 4) {
                    Text(thread?.ticket.status.localized ?? "—")
                        .font(.system(size: 11, weight: .bold))
                    Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Color.brandPrimary, in: Capsule())
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(.thinMaterial)
    }

    private var composer: some View {
        HStack(spacing: 10) {
            TextField("Cevabınızı yazın…", text: $draft, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial, in: .rect(cornerRadius: 22, style: .continuous))
            Button { Task { await send() } } label: {
                ZStack {
                    Circle().fill(
                        LinearGradient(colors: [Color.brandPrimary, Color.brandPrimaryDeep],
                                       startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    if sending { ProgressView().tint(.white) }
                    else { Image(systemName: "paperplane.fill")
                            .foregroundStyle(.white).font(.system(size: 14, weight: .bold)) }
                }
                .frame(width: 40, height: 40)
                .shadow(color: Color.brandPrimary.opacity(0.4), radius: 10, y: 4)
            }
            .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || sending)
            .opacity(draft.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(.thinMaterial)
    }

    private func startPolling() async {
        await load()
        pollTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 6_000_000_000)
                if !Task.isCancelled { await load() }
            }
        }
    }

    private func load() async {
        do {
            thread = try await APIClient.shared.get("/admin/support/tickets/\(ticketId)")
            let _: EmptyResponse = (try? await APIClient.shared.post("/admin/support/tickets/\(ticketId)/read")) ?? EmptyResponse()
        } catch { }
    }

    private func send() async {
        let text = draft.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty, !sending else { return }
        sending = true; draft = ""
        struct Body: Encodable { let body: String }
        let _: SupportMessage? = try? await APIClient.shared.post(
            "/admin/support/tickets/\(ticketId)/messages", body: Body(body: text)
        )
        sending = false
        await load()
    }

    private func setStatus(_ s: String) async {
        struct Body: Encodable { let status: String }
        let _: SupportTicket? = try? await APIClient.shared.patch(
            "/admin/support/tickets/\(ticketId)/status", body: Body(status: s)
        )
        await load()
    }
}

private struct MessageBubbleAdmin: View {
    let msg: SupportMessage
    /// Admin's POV: messages from admin/consultant are "mine" (right side).
    private var mine: Bool { msg.senderRole == .admin || msg.senderRole == .consultant }
    private var isSystem: Bool { msg.senderRole == .system }

    var body: some View {
        if isSystem {
            HStack {
                Spacer()
                Text(msg.body ?? "")
                    .font(.caption)
                    .foregroundStyle(Color.inkSecondary)
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(.ultraThinMaterial, in: Capsule())
                Spacer()
            }
        } else {
            HStack(alignment: .bottom, spacing: 6) {
                if mine { Spacer(minLength: 50) }
                Text(msg.body ?? "")
                    .font(.subheadline)
                    .foregroundStyle(mine ? .white : Color.inkPrimary)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background {
                        if mine {
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(LinearGradient(colors: [Color.brandPrimary, Color.brandPrimaryDeep],
                                                     startPoint: .topLeading, endPoint: .bottomTrailing))
                        } else {
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(.ultraThinMaterial)
                        }
                    }
                if !mine { Spacer(minLength: 50) }
            }
        }
    }
}
