import Foundation
import Observation
import Security

/// Global session state. Mirrors the web `useAuthStore` + RN equivalent —
/// access + refresh tokens persisted in the Keychain, user profile decoded
/// from the JWT.
///
/// `@Observable` (iOS 17+) makes any SwiftUI view that reads a property
/// re-render when the property changes, no `@Published` or `@StateObject`
/// boilerplate.
@MainActor
@Observable
final class AuthStore {
    static let shared = AuthStore()

    private(set) var accessToken: String?
    private(set) var refreshToken: String?
    private(set) var user: UserSummary?
    private(set) var isHydrating = true
    var isAuthenticated: Bool { accessToken != nil }

    // Keychain account names
    private let kAccess  = "accessToken"
    private let kRefresh = "refreshToken"

    private init() {
        hydrateFromKeychain()
    }

    // MARK: Public actions

    func signIn(email: String, password: String) async throws {
        struct Body: Encodable { let email: String; let password: String }
        let resp: AuthResponse = try await APIClient.shared.post(
            "/auth/login",
            body: Body(email: email, password: password)
        )
        await applyTokens(access: resp.accessToken, refresh: resp.refreshToken)
    }

    func signOut() async {
        accessToken = nil
        refreshToken = nil
        user = nil
        keychainDelete(account: kAccess)
        keychainDelete(account: kRefresh)
    }

    /// Single attempt — the APIClient calls this when it sees a 401 to avoid
    /// every screen having to handle expiry. Returns true on success.
    func tryRefresh() async -> Bool {
        guard let refresh = refreshToken else { return false }
        struct Body: Encodable { let refreshToken: String }
        do {
            let resp: AuthResponse = try await APIClient.shared.post(
                "/auth/refresh",
                body: Body(refreshToken: refresh)
            )
            await applyTokens(access: resp.accessToken, refresh: resp.refreshToken)
            return true
        } catch {
            return false
        }
    }

    // MARK: Private

    private func applyTokens(access: String, refresh: String) async {
        accessToken = access
        refreshToken = refresh
        user = Self.decodeJWTUser(from: access)
        keychainSave(account: kAccess, value: access)
        keychainSave(account: kRefresh, value: refresh)
    }

    private func hydrateFromKeychain() {
        defer { isHydrating = false }
        if let access = keychainLoad(account: kAccess),
           let refresh = keychainLoad(account: kRefresh) {
            accessToken = access
            refreshToken = refresh
            user = Self.decodeJWTUser(from: access)
        }
    }

    // MARK: JWT decode

    private static func decodeJWTUser(from token: String) -> UserSummary? {
        let parts = token.split(separator: ".")
        guard parts.count >= 2 else { return nil }
        var payload = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        // base64url padding
        let pad = 4 - payload.count % 4
        if pad != 4 { payload.append(String(repeating: "=", count: pad)) }
        guard let data = Data(base64Encoded: payload),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }

        return UserSummary(
            id: (json["sub"] as? String) ?? "",
            email: json["email"] as? String,
            firstName: json["firstName"] as? String,
            lastName: json["lastName"] as? String,
            phone: json["phone"] as? String,
            roles: json["roles"] as? [String]
        )
    }

    // MARK: Keychain helpers

    private func keychainSave(account: String, value: String) {
        let data = Data(value.utf8)
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: AppConfig.keychainService,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(q as CFDictionary)
        var add = q
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(add as CFDictionary, nil)
    }

    private func keychainLoad(account: String) -> String? {
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: AppConfig.keychainService,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let str = String(data: data, encoding: .utf8) else { return nil }
        return str
    }

    private func keychainDelete(account: String) {
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: AppConfig.keychainService,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(q as CFDictionary)
    }
}
