import Foundation

enum AppConfig {
    /// Production VPS — points at the same monolith the web client uses.
    /// Flip to localhost when developing against a Mac-side dev server.
    static let baseURL = URL(string: "https://nettapu-2.tunasoft.tech/api/v1")!

    /// Auction-service WebSocket (separate process behind nginx). Used by
    /// LiveAuctionView for real-time bids.
    static let auctionSocketURL = URL(string: "wss://nettapu-2.tunasoft.tech/ws")!

    /// Keychain service identifier — keep stable, changing it would
    /// invalidate every existing user's saved tokens.
    static let keychainService = "tech.tunasoft.nettapu.ios"
}
