import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var loading = false
    @State private var errorMessage: String?
    @FocusState private var focused: Field?

    private enum Field { case email, password }

    var body: some View {
        ZStack {
            AnimatedMeshBackground()

            ScrollView {
                VStack(spacing: 28) {
                    Spacer().frame(height: 60)

                    // Brand
                    VStack(spacing: 8) {
                        Image(systemName: "leaf.fill")
                            .font(.system(size: 44, weight: .bold))
                            .foregroundStyle(Color.brandPrimary)
                        Text("NetTapu")
                            .font(.system(size: 32, weight: .black, design: .rounded))
                            .foregroundStyle(Color.brandPrimary)
                        Text("Türkiye'nin güvenilir arsa & ihale platformu")
                            .font(.footnote)
                            .foregroundStyle(Color.inkSecondary)
                    }

                    // Glass card form
                    GlassCard {
                        VStack(spacing: 16) {
                            Text("Hoş Geldiniz")
                                .font(.title2.bold())
                                .foregroundStyle(Color.inkPrimary)
                                .frame(maxWidth: .infinity, alignment: .leading)

                            // Email
                            HStack(spacing: 10) {
                                Image(systemName: "envelope")
                                    .foregroundStyle(Color.inkMuted)
                                TextField("E-posta", text: $email)
                                    .textInputAutocapitalization(.never)
                                    .keyboardType(.emailAddress)
                                    .autocorrectionDisabled()
                                    .focused($focused, equals: .email)
                                    .submitLabel(.next)
                                    .onSubmit { focused = .password }
                            }
                            .padding(.vertical, 14)
                            .padding(.horizontal, 14)
                            .background(.white.opacity(0.6), in: .rect(cornerRadius: 14, style: .continuous))

                            // Password
                            HStack(spacing: 10) {
                                Image(systemName: "lock")
                                    .foregroundStyle(Color.inkMuted)
                                SecureField("Şifre", text: $password)
                                    .focused($focused, equals: .password)
                                    .submitLabel(.go)
                                    .onSubmit { Task { await submit() } }
                            }
                            .padding(.vertical, 14)
                            .padding(.horizontal, 14)
                            .background(.white.opacity(0.6), in: .rect(cornerRadius: 14, style: .continuous))

                            if let errorMessage {
                                Text(errorMessage)
                                    .font(.footnote)
                                    .foregroundStyle(Color.brandDanger)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .transition(.opacity)
                            }

                            GlassButton(action: { Task { await submit() } }) {
                                if loading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Giriş Yap")
                                }
                            }
                            .disabled(loading || email.isEmpty || password.isEmpty)
                            .opacity((loading || email.isEmpty || password.isEmpty) ? 0.5 : 1)

                            HStack {
                                Spacer()
                                Button("Şifremi unuttum") { /* TODO */ }
                                    .font(.footnote)
                                    .foregroundStyle(Color.inkSecondary)
                            }
                        }
                    }
                    .padding(.horizontal, 20)

                    // Register hint
                    HStack(spacing: 4) {
                        Text("Hesabınız yok mu?")
                            .foregroundStyle(Color.inkSecondary)
                        Button("Kayıt Ol") { /* TODO */ }
                            .foregroundStyle(Color.brandPrimary)
                            .bold()
                    }
                    .font(.footnote)
                    .padding(.bottom, 40)
                }
            }
        }
    }

    private func submit() async {
        guard !loading else { return }
        loading = true
        errorMessage = nil
        do {
            try await AuthStore.shared.signIn(email: email.trimmingCharacters(in: .whitespaces),
                                              password: password)
        } catch let err as APIError {
            errorMessage = err.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        loading = false
    }
}
