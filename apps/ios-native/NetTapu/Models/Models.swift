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
    let createdAt: String?

    var priceDecimal: Decimal? { price.flatMap { Decimal(string: $0) } }
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
    let unreadUser: Int
    let lastMessageAt: String?
    let createdAt: String
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
}

struct CountResponse: Decodable {
    let count: Int
}
