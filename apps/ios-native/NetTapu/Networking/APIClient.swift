import Foundation

/// Errors surfaced from the API layer.
enum APIError: LocalizedError {
    case invalidResponse
    case http(status: Int, message: String?)
    case decoding(Error)
    case network(URLError)
    case unauthorized
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Sunucudan geçersiz yanıt"
        case .http(_, let msg):  return msg ?? "Sunucu hatası"
        case .decoding:          return "Yanıt çözümlenemedi"
        case .network(let e):    return e.localizedDescription
        case .unauthorized:      return "Oturum süreniz doldu, tekrar giriş yapın"
        case .unknown(let e):    return e.localizedDescription
        }
    }
}

/// Minimal async/await HTTP client wired against the monolith API.
///
/// Responsibilities:
///   – Inject `Authorization: Bearer …` automatically when AuthStore has a token
///   – Single-attempt refresh-token retry on 401 (mirrors the web axios interceptor)
///   – JSON encode/decode bodies via a snake-case-aware JSONDecoder
///
/// Anything more sophisticated (request cancellation policies, response caching,
/// progress callbacks for uploads) can be layered on later — this is the floor.
@MainActor
final class APIClient {
    static let shared = APIClient()
    private let session: URLSession
    private let baseURL = AppConfig.baseURL

    private init() {
        let cfg = URLSessionConfiguration.default
        cfg.waitsForConnectivity = true
        cfg.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: cfg)
    }

    // MARK: Public methods

    func get<T: Decodable>(_ path: String, query: [String: String]? = nil) async throws -> T {
        try await request(path: path, method: "GET", query: query, body: Optional<EmptyBody>.none)
    }

    func post<Body: Encodable, T: Decodable>(_ path: String, body: Body) async throws -> T {
        try await request(path: path, method: "POST", body: body)
    }

    func post<T: Decodable>(_ path: String) async throws -> T {
        try await request(path: path, method: "POST", body: Optional<EmptyBody>.none)
    }

    func patch<Body: Encodable, T: Decodable>(_ path: String, body: Body) async throws -> T {
        try await request(path: path, method: "PATCH", body: body)
    }

    func delete<T: Decodable>(_ path: String) async throws -> T {
        try await request(path: path, method: "DELETE", body: Optional<EmptyBody>.none)
    }

    // MARK: Core

    private func request<Body: Encodable, T: Decodable>(
        path: String,
        method: String,
        query: [String: String]? = nil,
        body: Body?,
        isRetry: Bool = false
    ) async throws -> T {
        var components = URLComponents(url: baseURL.appendingPathComponent(path),
                                       resolvingAgainstBaseURL: false)!
        if let query, !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        guard let url = components.url else { throw APIError.invalidResponse }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONEncoder.api.encode(body)
        }
        if let token = AuthStore.shared.accessToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: req)
        } catch let urlError as URLError {
            throw APIError.network(urlError)
        }

        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }

        switch http.statusCode {
        case 200..<300:
            if T.self == EmptyResponse.self {
                return EmptyResponse() as! T
            }
            do {
                return try JSONDecoder.api.decode(T.self, from: data)
            } catch {
                throw APIError.decoding(error)
            }

        case 401:
            // Try one refresh, then bail. Avoids infinite loops on bad refresh
            // tokens.
            if !isRetry, await AuthStore.shared.tryRefresh() {
                return try await request(path: path, method: method, query: query,
                                         body: body, isRetry: true)
            }
            await AuthStore.shared.signOut()
            throw APIError.unauthorized

        default:
            let message = APIClient.parseErrorMessage(from: data)
            throw APIError.http(status: http.statusCode, message: message)
        }
    }

    // Empty body convenience.
    private struct EmptyBody: Encodable {}

    /// Servers reply with `{ "message": "…" }` or `{ "message": ["…", "…"] }` —
    /// surface a friendly single string either way.
    private static func parseErrorMessage(from data: Data) -> String? {
        struct Envelope: Decodable { let message: ErrorPayload? }
        enum ErrorPayload: Decodable {
            case single(String)
            case multiple([String])
            init(from decoder: Decoder) throws {
                let c = try decoder.singleValueContainer()
                if let s = try? c.decode(String.self) { self = .single(s); return }
                if let a = try? c.decode([String].self) { self = .multiple(a); return }
                self = .single("")
            }
            var joined: String {
                switch self {
                case .single(let s): return s
                case .multiple(let arr): return arr.joined(separator: ", ")
                }
            }
        }
        guard let env = try? JSONDecoder().decode(Envelope.self, from: data),
              let msg = env.message?.joined, !msg.isEmpty else { return nil }
        return msg
    }
}

/// Marker type used when the caller doesn't care about the response body.
struct EmptyResponse: Decodable {}

private extension JSONDecoder {
    static let api: JSONDecoder = {
        let d = JSONDecoder()
        // Backend already returns camelCase JSON, so no key transformation needed.
        return d
    }()
}

private extension JSONEncoder {
    static let api: JSONEncoder = {
        let e = JSONEncoder()
        return e
    }()
}
