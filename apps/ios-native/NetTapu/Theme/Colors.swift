import SwiftUI

/// Brand palette mirroring the web/RN clients so a user moving between
/// platforms doesn't feel jarred.
extension Color {
    static let brandPrimary       = Color(hex: 0x515D2B)   // olive
    static let brandPrimaryDeep   = Color(hex: 0x3B441F)
    static let brandAccent        = Color(hex: 0xB8894D)   // gold
    static let brandSuccess       = Color(hex: 0x16A34A)
    static let brandDanger        = Color(hex: 0xDC2626)
    static let brandWarn          = Color(hex: 0xD97706)
    static let brandInfo          = Color(hex: 0x2563EB)
    static let inkPrimary         = Color(hex: 0x111827)
    static let inkSecondary       = Color(hex: 0x4B5563)
    static let inkMuted           = Color(hex: 0x9CA3AF)

    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8)  & 0xFF) / 255.0
        let b = Double((hex >> 0)  & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}
