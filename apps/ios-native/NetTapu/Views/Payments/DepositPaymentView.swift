import SwiftUI
import WebKit

/// Deposit + 3D Secure flow. Mirrors the web's redesigned deposit page:
/// left column (in this layout, top) is the auction summary, right column
/// (bottom) is the payment method picker + bank info / credit card stub.
struct DepositPaymentView: View {
    let auction: Auction

    @State private var method: PaymentMethod = .creditCard
    @State private var loading = false
    @State private var threeDsURL: URL?
    @State private var success = false
    @State private var error: String?
    @State private var bank: BankInfo = BankInfo()

    enum PaymentMethod: String { case creditCard = "credit_card", bankTransfer = "bank_transfer" }

    struct BankInfo {
        var bankName: String = "Banka bilgisi girilmemiş"
        var iban: String = "—"
        var accountHolder: String = "—"
    }

    var body: some View {
        ZStack {
            AnimatedMeshBackground().opacity(0.30)
            ScrollView {
                VStack(spacing: 18) {
                    summary
                    trustSignals
                    methodPicker
                    methodPanel
                    if let error {
                        Label(error, systemImage: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundStyle(Color.brandDanger)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.brandDanger.opacity(0.10),
                                        in: .rect(cornerRadius: 12, style: .continuous))
                    }
                    submitButton
                    Text("Devam ederek ihale şartlarını kabul etmiş olursunuz.")
                        .font(.caption2)
                        .foregroundStyle(Color.inkMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                    Spacer().frame(height: 20)
                }
                .padding(.horizontal, 18)
                .padding(.top, 12)
            }
        }
        .navigationTitle("Depozito Yatır")
        .toolbarTitleDisplayMode(.inline)
        .sheet(item: Binding(
            get: { threeDsURL.map { ThreeDsRoute(url: $0) } },
            set: { threeDsURL = $0?.url })
        ) { route in
            ThreeDsWebView(url: route.url, onDone: { _ in
                threeDsURL = nil
                success = true
            })
        }
        .alert("Depozito Yatırıldı", isPresented: $success) {
            Button("Tamam") { /* dismiss */ }
        } message: {
            Text("Açık artırmaya katılım hakkınız etkinleştirildi.")
        }
        .task { await loadBankInfo() }
    }

    private var summary: some View {
        GlassCard(cornerRadius: 24, tint: Color.brandPrimary.opacity(0.15)) {
            VStack(alignment: .leading, spacing: 10) {
                Text("İHALE")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(Color.inkMuted)
                Text(auction.title)
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(Color.inkPrimary)
                Divider().opacity(0.5)
                HStack {
                    Text("Başlangıç Fiyatı")
                        .font(.caption)
                        .foregroundStyle(Color.inkSecondary)
                    Spacer()
                    Text(PriceFormat.format(auction.startingPrice, currency: auction.currency))
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color.inkPrimary)
                }
                HStack {
                    Text("Gerekli Depozito")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color.brandWarn)
                    Spacer()
                    Text(PriceFormat.format(auction.requiredDeposit, currency: auction.currency))
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(Color.brandWarn)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .background(Color.brandWarn.opacity(0.08),
                            in: .rect(cornerRadius: 10, style: .continuous))
            }
        }
    }

    private var trustSignals: some View {
        HStack(spacing: 8) {
            trustChip(icon: "shield.checkered", label: "3D Secure")
            trustChip(icon: "lock.fill", label: "SSL Şifreli")
            trustChip(icon: "arrow.uturn.backward", label: "İade Garantisi")
        }
    }

    private func trustChip(icon: String, label: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.caption2)
            Text(label).font(.system(size: 11, weight: .bold))
        }
        .foregroundStyle(Color.brandSuccess)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.brandSuccess.opacity(0.08),
                    in: Capsule())
    }

    private var methodPicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("ÖDEME YÖNTEMİ")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(Color.inkMuted)
            HStack(spacing: 10) {
                methodTile(.creditCard, icon: "creditcard.fill",
                           title: "Kredi Kartı", subtitle: "Anında, 3DS")
                methodTile(.bankTransfer, icon: "building.columns.fill",
                           title: "Havale / EFT", subtitle: "Manuel onay")
            }
        }
    }

    private func methodTile(_ m: PaymentMethod, icon: String, title: String, subtitle: String) -> some View {
        let selected = method == m
        return Button { method = m } label: {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(selected ? Color.brandPrimary : Color.inkMuted, in: .circle)
                Text(title)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(Color.inkPrimary)
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(Color.inkSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(.ultraThinMaterial, in: .rect(cornerRadius: 18, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(selected ? Color.brandPrimary : Color.white.opacity(0.25),
                                  lineWidth: selected ? 2 : 0.5)
            }
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var methodPanel: some View {
        if method == .creditCard {
            GlassCard(cornerRadius: 18) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Kredi Kartı ile Öde")
                        .font(.headline)
                        .foregroundStyle(Color.inkPrimary)
                    Text("Bankanızın 3D Secure sayfasında tamamlanır. Depozito bloke edilir; ihaleyi kazanamazsanız iade edilir.")
                        .font(.caption)
                        .foregroundStyle(Color.inkSecondary)
                    HStack(spacing: 6) {
                        Image(systemName: "lock.fill").font(.caption2)
                        Text("Banka bilgileriniz sunucumuzda saklanmaz")
                            .font(.system(size: 10))
                    }
                    .foregroundStyle(Color.inkMuted)
                    .padding(.top, 4)
                }
            }
        } else {
            GlassCard(cornerRadius: 18) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Havale / EFT Bilgileri")
                        .font(.headline)
                        .foregroundStyle(Color.inkPrimary)
                    copyRow(label: "BANKA", value: bank.bankName)
                    copyRow(label: "IBAN", value: bank.iban)
                    copyRow(label: "HESAP SAHİBİ", value: bank.accountHolder)
                    copyRow(label: "AÇIKLAMA", value: "\(auction.title) - \(String(auction.id.prefix(8)).uppercased())")
                    Text("Havale sonrası dekontunuzu WhatsApp veya e-posta ile iletmeniz gerekir. Ödemeniz manuel onay sonrası ihaleye katılım hakkı kazandırır.")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.brandWarn)
                        .padding(10)
                        .background(Color.brandWarn.opacity(0.10),
                                    in: .rect(cornerRadius: 10, style: .continuous))
                }
            }
        }
    }

    private func copyRow(label: String, value: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 9, weight: .heavy))
                    .foregroundStyle(Color.inkMuted)
                Text(value)
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color.inkPrimary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
            Spacer()
            Button { UIPasteboard.general.string = value } label: {
                Image(systemName: "doc.on.doc")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Color.brandPrimary)
                    .padding(8)
                    .background(Color.brandPrimary.opacity(0.10), in: .circle)
            }
        }
        .padding(.vertical, 6)
    }

    private var submitButton: some View {
        GlassButton(action: { Task { await submit() } }) {
            if loading { ProgressView().tint(.white) }
            else {
                HStack {
                    Image(systemName: method == .creditCard ? "lock.shield.fill" : "paperplane.fill")
                    Text(method == .creditCard
                         ? "\(PriceFormat.format(auction.requiredDeposit, currency: auction.currency)) Yatır"
                         : "Havale Bildirimini Gönder")
                }
            }
        }
        .disabled(loading)
        .opacity(loading ? 0.5 : 1)
    }

    private func loadBankInfo() async {
        struct Resp: Decodable {
            let bank_name: String?
            let bank_iban: String?
            let bank_account_holder: String?
        }
        if let s: Resp = try? await APIClient.shared.get("/content/site-settings") {
            bank = BankInfo(
                bankName: s.bank_name ?? bank.bankName,
                iban: s.bank_iban ?? bank.iban,
                accountHolder: s.bank_account_holder ?? bank.accountHolder
            )
        }
    }

    private func submit() async {
        loading = true
        defer { loading = false }
        error = nil

        struct Body: Encodable {
            let parcelId: String
            let auctionId: String
            let amount: String
            let currency: String
            let paymentMethod: String
            let idempotencyKey: String
            let description: String
        }
        struct Resp: Decodable {
            let id: String
            let status: String
            let threeDsRedirectUrl: String?
        }
        do {
            let resp: Resp = try await APIClient.shared.post(
                "/payments",
                body: Body(
                    parcelId: auction.parcelId,
                    auctionId: auction.id,
                    amount: auction.requiredDeposit ?? "0",
                    currency: auction.currency ?? "TRY",
                    paymentMethod: method.rawValue,
                    idempotencyKey: UUID().uuidString,
                    description: "Depozito: \(auction.title)"
                )
            )
            if resp.status == "awaiting_3ds", let url = resp.threeDsRedirectUrl.flatMap(URL.init) {
                threeDsURL = url
            } else {
                success = true
            }
        } catch let e as APIError {
            error = e.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct ThreeDsRoute: Identifiable {
    let url: URL
    var id: String { url.absoluteString }
}

/// WKWebView-backed 3D Secure flow. Watches for the bank's success/failure
/// callback URL (returns to our domain) and closes itself.
struct ThreeDsWebView: View {
    let url: URL
    var onDone: (Bool) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ThreeDsWebViewRepresentable(url: url, onDone: { success in
                dismiss()
                onDone(success)
            })
            .navigationTitle("3D Secure Doğrulama")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("İptal") { dismiss(); onDone(false) }
                }
            }
        }
    }
}

private struct ThreeDsWebViewRepresentable: UIViewRepresentable {
    let url: URL
    var onDone: (Bool) -> Void

    func makeUIView(context: Context) -> WKWebView {
        let wv = WKWebView()
        wv.navigationDelegate = context.coordinator
        wv.load(URLRequest(url: url))
        return wv
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(onDone: onDone) }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let onDone: (Bool) -> Void
        init(onDone: @escaping (Bool) -> Void) { self.onDone = onDone }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            let urlStr = navigationAction.request.url?.absoluteString ?? ""
            // Backend redirects to /payments/3ds/return?status=success|failed
            if urlStr.contains("/payments/3ds/return") {
                let success = urlStr.contains("status=success")
                decisionHandler(.cancel)
                onDone(success)
                return
            }
            decisionHandler(.allow)
        }
    }
}
