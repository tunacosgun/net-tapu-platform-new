import Foundation

/// Lightweight Socket.IO v4 client.
///
/// The auction-service speaks socket.io-protocol — handshake over HTTP,
/// frames `42["event",payload]`. We use raw URLSessionWebSocketTask and
/// hand-code the frame parsing rather than pull in a CocoaPods dep.
///
/// Lifecycle:
///   1. caller creates `AuctionSocket(token:auctionId:onEvent:)`
///   2. `connect()` opens the WS upgrade and sends `40` (connect)
///   3. server replies `40{"sid":"…"}`; we emit a `join_auction`
///   4. inbound `42["bid_placed", {...}]` frames are decoded and posted
///      to `onEvent` on the main actor
@MainActor
final class AuctionSocket {
    let auctionId: String
    let token: String?
    var onEvent: (SocketEvent) -> Void

    private var task: URLSessionWebSocketTask?
    private var session: URLSession?
    private var pingTimer: Timer?
    private var alive = false

    enum SocketEvent {
        case connected
        case disconnected
        case bidPlaced(amount: String, currency: String?, bidderId: String?)
        case auctionEnded
        case raw(String)
    }

    init(token: String?, auctionId: String,
         onEvent: @escaping (SocketEvent) -> Void) {
        self.token = token
        self.auctionId = auctionId
        self.onEvent = onEvent
    }

    deinit {
        pingTimer?.invalidate()
        task?.cancel(with: .goingAway, reason: nil)
    }

    func connect() {
        // socket.io v4 handshake URL — append /socket.io/?EIO=4&transport=websocket
        var comps = URLComponents(url: AppConfig.auctionSocketURL,
                                  resolvingAgainstBaseURL: false)!
        comps.path = "/socket.io/"
        var items = [
            URLQueryItem(name: "EIO", value: "4"),
            URLQueryItem(name: "transport", value: "websocket"),
        ]
        if let token = token { items.append(URLQueryItem(name: "token", value: token)) }
        comps.queryItems = items
        guard let url = comps.url else { return }

        let cfg = URLSessionConfiguration.default
        cfg.waitsForConnectivity = true
        let s = URLSession(configuration: cfg)
        self.session = s
        let t = s.webSocketTask(with: url)
        self.task = t
        t.resume()
        alive = true
        listen()
        send("40")  // socket.io v4 namespace connect
        startPing()
    }

    func close() {
        alive = false
        pingTimer?.invalidate()
        task?.cancel(with: .goingAway, reason: nil)
        onEvent(.disconnected)
    }

    private func startPing() {
        pingTimer?.invalidate()
        pingTimer = Timer.scheduledTimer(withTimeInterval: 25, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.send("2") }
        }
    }

    private func send(_ frame: String) {
        task?.send(.string(frame)) { _ in /* swallow — listen() loop surfaces real failures */ }
    }

    /// Emit a socket.io event: `42["event_name", payload]`
    func emit(_ event: String, payload: [String: Any]) {
        let arr: [Any] = [event, payload]
        guard let data = try? JSONSerialization.data(withJSONObject: arr),
              let body = String(data: data, encoding: .utf8) else { return }
        send("42" + body)
    }

    private func listen() {
        task?.receive { [weak self] result in
            guard let self else { return }
            Task { @MainActor in
                switch result {
                case .success(.string(let s)):
                    self.handleFrame(s)
                case .success(.data(let d)):
                    if let s = String(data: d, encoding: .utf8) { self.handleFrame(s) }
                case .failure:
                    self.onEvent(.disconnected)
                    self.alive = false
                @unknown default: break
                }
                if self.alive { self.listen() }
            }
        }
    }

    private func handleFrame(_ frame: String) {
        // socket.io frame types: 0=open, 2=ping, 3=pong, 40=connect, 41=disconnect, 42=event
        if frame.hasPrefix("40") {
            onEvent(.connected)
            emit("join_auction", payload: ["auctionId": auctionId])
        } else if frame.hasPrefix("42") {
            let json = String(frame.dropFirst(2))
            if let data = json.data(using: .utf8),
               let arr = try? JSONSerialization.jsonObject(with: data) as? [Any],
               arr.count >= 1, let event = arr[0] as? String {
                let payload = (arr.count > 1 ? arr[1] : nil) as? [String: Any] ?? [:]
                switch event {
                case "bid_placed", "bid":
                    let amount = (payload["amount"] as? String)
                        ?? String(describing: payload["amount"] ?? "")
                    onEvent(.bidPlaced(
                        amount: amount,
                        currency: payload["currency"] as? String,
                        bidderId: payload["userId"] as? String
                    ))
                case "auction_ended":
                    onEvent(.auctionEnded)
                default:
                    onEvent(.raw(event))
                }
            }
        } else if frame == "2" {
            send("3")  // pong
        }
    }
}
