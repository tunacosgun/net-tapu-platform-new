import Foundation

// MARK: - Auth

struct AuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
}

struct UserSummary: Decodable, Hashable {
    let id: String
    let email: String?
    let firstName: String?
    let lastName: String?
    let phone: String?
    let roles: [String]?

    var displayName: String {
        let parts = [firstName, lastName].compactMap { $0 }.filter { !$0.isEmpty }
        if !parts.isEmpty { return parts.joined(separator: " ") }
        return email ?? "Kullanıcı"
    }

    /// True when the JWT carries admin or superadmin role. Drives the
    /// admin-mode tab in HomeView.
    var isAdmin: Bool {
        let r = roles ?? []
        return r.contains("admin") || r.contains("superadmin")
    }
}

// MARK: - Parcels

struct Parcel: Decodable, Identifiable, Hashable {
    let id: String
    let listingId: String?
    let title: String
    let description: String?
    let city: String?
    let district: String?
    let neighborhood: String?
    let price: String?
    let currency: String?
    let areaM2: String?
    let landType: String?
    let ada: String?
    let parsel: String?
    let isFeatured: Bool?
    let isAuctionEligible: Bool?
    let status: String?
    let createdAt: String?

    var priceDecimal: Decimal? { price.flatMap { Decimal(string: $0) } }
    var areaDecimal: Decimal? { areaM2.flatMap { Decimal(string: $0) } }

    /// Min offer = 80% of asking price, matches the backend rule.
    var minOfferAmount: Decimal? {
        guard let p = priceDecimal else { return nil }
        return p * Decimal(0.8)
    }
}

struct PaginatedResponse<T: Decodable>: Decodable {
    let data: [T]
    let meta: PaginationMeta
}

struct PaginationMeta: Decodable {
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
}

// MARK: - Auctions

struct Auction: Decodable, Identifiable, Hashable {
    let id: String
    let parcelId: String
    let title: String
    let description: String?
    let status: String
    let startingPrice: String?
    let minimumIncrement: String?
    let requiredDeposit: String?
    let currency: String?
    let scheduledStart: String?
    let scheduledEnd: String?
    let createdAt: String?
}

// MARK: - Offers

struct Offer: Decodable, Identifiable, Hashable {
    let id: String
    let userId: String?
    let parcelId: String
    let amount: String
    let currency: String?
    let message: String?
    let status: String
    let createdAt: String

    // From "GET /crm/offers/mine"
    let parcelTitle: String?
    let parcelListingId: String?
    let parcelPrice: String?
    let parcelCurrency: String?
    let lastCounterAmount: String?
}

// MARK: - Favorites

struct Favorite: Decodable, Identifiable, Hashable {
    let id: String
    let parcelId: String
    let createdAt: String
    let parcel: Parcel?
}

// MARK: - Contact requests (admin)

struct ContactRequest: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let phone: String?
    let email: String?
    let message: String?
    let type: String?
    let status: String?
    let parcelId: String?
    let createdAt: String
}

// MARK: - Support tickets

enum TicketStatus: String, Decodable {
    case open, inProgress = "in_progress", waitingUser = "waiting_user", closed

    var localized: String {
        switch self {
        case .open: return "Yeni"
        case .inProgress: return "Görüşmede"
        case .waitingUser: return "Cevap bekleniyor"
        case .closed: return "Kapalı"
        }
    }
}

struct SupportTicket: Decodable, Identifiable, Hashable {
    let id: String
    let subject: String
    let status: TicketStatus
    let source: String?
    let unreadAdmin: Int?
    let unreadUser: Int
    let lastMessageAt: String?
    let createdAt: String

    /// Only present on /admin/support/tickets responses
    let userDisplayName: String?
    let userEmail: String?
}

enum SupportSenderRole: String, Decodable {
    case user, admin, system, consultant
}

struct SupportMessage: Decodable, Identifiable, Hashable {
    let id: String
    let ticketId: String
    let senderRole: SupportSenderRole
    let body: String?
    let attachmentUrl: String?
    let attachmentType: String?
    let attachmentName: String?
    let readAt: String?
    let createdAt: String
}

struct SupportThreadResponse: Decodable {
    let ticket: SupportTicket
    let messages: [SupportMessage]
    let user: SupportThreadUser?

    struct SupportThreadUser: Decodable {
        let name: String
        let email: String?
        let phone: String?
    }
}

struct CountResponse: Decodable {
    let count: Int
}

// MARK: - Helpers

/// Price formatter used across cards / detail screens.
enum PriceFormat {
    static let tr: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "tr_TR")
        f.maximumFractionDigits = 0
        return f
    }()

    static func format(_ value: String?, currency: String? = "TRY") -> String {
        guard let s = value, let n = Decimal(string: s) else { return "—" }
        let symbol = currency == "USD" ? "$" : currency == "EUR" ? "€" : "₺"
        let str = tr.string(from: n as NSDecimalNumber) ?? s
        return "\(symbol)\(str)"
    }
}
