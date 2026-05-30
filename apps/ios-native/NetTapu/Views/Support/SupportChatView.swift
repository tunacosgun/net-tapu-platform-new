import SwiftUI

struct SupportChatView: View {
    let ticketId: String
    let initialSubject: String

    @State private var thread: SupportThreadResponse?
    @State private var loading = true
    @State private var draft = ""
    @State private var sending = false
    @State private var pollTask: Task<Void, Never>?

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)

            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(thread?.messages ?? []) { msg in
                                MessageBubble(msg: msg)
                                    .id(msg.id)
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
        .navigationTitle(thread?.ticket.subject ?? initialSubject)
        .toolbarTitleDisplayMode(.inline)
        .task { await startPolling() }
        .onDisappear { pollTask?.cancel() }
    }

    private var composer: some View {
        HStack(spacing: 10) {
            TextField("Mesajınızı yazın…", text: $draft, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial, in: .rect(cornerRadius: 22, style: .continuous))

            Button { Task { await send() } } label: {
                ZStack {
                    Circle().fill(
                        LinearGradient(colors: [.brandPrimary, .brandPrimaryDeep],
                                       startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    if sending {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: "paperplane.fill")
                            .foregroundStyle(.white)
                            .font(.system(size: 14, weight: .bold))
                    }
                }
                .frame(width: 40, height: 40)
                .shadow(color: .brandPrimary.opacity(0.4), radius: 10, y: 4)
            }
            .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || sending)
            .opacity(draft.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(.thinMaterial)
    }

    // MARK: Networking

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
            thread = try await APIClient.shared.get("/support/tickets/\(ticketId)")
            let _: EmptyResponse = (try? await APIClient.shared.post("/support/tickets/\(ticketId)/read")) ?? EmptyResponse()
            loading = false
        } catch { /* keep last good copy */ }
    }

    private func send() async {
        let text = draft.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty, !sending else { return }
        sending = true
        draft = ""
        struct Body: Encodable { let body: String }
        do {
            let _: SupportMessage = try await APIClient.shared.post(
                "/support/tickets/\(ticketId)/messages",
                body: Body(body: text)
            )
            await load()
        } catch {
            draft = text  // restore for retry
        }
        sending = false
    }
}

private struct MessageBubble: View {
    let msg: SupportMessage

    private var mine: Bool { msg.senderRole == .user }
    private var isSystem: Bool { msg.senderRole == .system }

    var body: some View {
        if isSystem {
            HStack {
                Spacer()
                Text(msg.body ?? "")
                    .font(.caption)
                    .foregroundStyle(Color.inkSecondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(.ultraThinMaterial, in: Capsule())
                Spacer()
            }
        } else {
            HStack(alignment: .bottom, spacing: 6) {
                if mine { Spacer(minLength: 50) }

                if !mine {
                    Circle()
                        .fill(LinearGradient(colors: [.brandPrimary.opacity(0.7), .brandPrimary],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 28, height: 28)
                        .overlay(Text("NT").font(.caption2.bold()).foregroundStyle(.white))
                }

                VStack(alignment: mine ? .trailing : .leading, spacing: 2) {
                    Text(msg.body ?? "")
                        .font(.subheadline)
                        .foregroundStyle(mine ? .white : .inkPrimary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background {
                            if mine {
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .fill(LinearGradient(colors: [.brandPrimary, .brandPrimaryDeep],
                                                         startPoint: .topLeading, endPoint: .bottomTrailing))
                            } else {
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .fill(.ultraThinMaterial)
                            }
                        }
                        .clipShape(RoundedCornerShape(
                            radius: 18,
                            corners: mine ? [.topLeft, .topRight, .bottomLeft]
                                          : [.topLeft, .topRight, .bottomRight]
                        ))

                    HStack(spacing: 3) {
                        Text(shortTime(msg.createdAt))
                            .font(.system(size: 10))
                            .foregroundStyle(Color.inkMuted)
                        if mine {
                            Image(systemName: msg.readAt != nil ? "checkmark.message.fill" : "checkmark")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(msg.readAt != nil ? Color.brandSuccess : Color.inkMuted)
                        }
                    }
                }

                if !mine { Spacer(minLength: 50) }
            }
        }
    }

    private func shortTime(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let d = f.date(from: iso) ?? {
            let g = ISO8601DateFormatter(); g.formatOptions = [.withInternetDateTime]
            return g.date(from: iso)
        }()
        guard let d else { return "" }
        let df = DateFormatter()
        df.locale = .init(identifier: "tr_TR")
        df.dateFormat = "HH:mm"
        return df.string(from: d)
    }
}

/// Custom corner radius for chat-bubble tail effect.
private struct RoundedCornerShape: Shape {
    let radius: CGFloat
    let corners: UIRectCorner
    func path(in rect: CGRect) -> Path {
        Path(UIBezierPath(roundedRect: rect, byRoundingCorners: corners,
                          cornerRadii: CGSize(width: radius, height: radius)).cgPath)
    }
}
