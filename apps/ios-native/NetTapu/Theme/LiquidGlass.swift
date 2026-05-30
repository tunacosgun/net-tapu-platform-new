import SwiftUI

/// Reusable Liquid Glass primitives. iOS 18+ ships `.glassEffect()` natively
/// — we wrap it in branded helpers so a future iOS 17 fallback (or a tweak
/// to the corner radius / tint across the app) is a single-file change.

/// Glass panel for hero cards / sheets. Subtle shadow + tinted border.
struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat = 24
    var tint: Color = .white.opacity(0.18)
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(20)
            .background {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay {
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .fill(tint)
                    }
            }
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(.white.opacity(0.25), lineWidth: 0.5)
            }
            .shadow(color: .black.opacity(0.06), radius: 18, x: 0, y: 8)
    }
}

/// Pill-shaped glass button. Used for primary CTAs over photographic
/// backgrounds (login hero, parcel detail).
struct GlassButton<Label: View>: View {
    var action: () -> Void
    var tint: Color = .brandPrimary
    var prominent: Bool = true
    @ViewBuilder var label: () -> Label

    var body: some View {
        Button(action: action) {
            label()
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(prominent ? .white : tint)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background {
                    Capsule()
                        .fill(prominent ? AnyShapeStyle(LinearGradient(
                            colors: [tint, tint.opacity(0.85)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )) : AnyShapeStyle(.ultraThinMaterial))
                }
                .overlay {
                    Capsule().strokeBorder(.white.opacity(prominent ? 0.25 : 0.4), lineWidth: 0.5)
                }
                .shadow(color: tint.opacity(prominent ? 0.35 : 0), radius: 16, x: 0, y: 8)
        }
        .buttonStyle(.plain)
    }
}

/// Small badge chip for status / category tags.
struct GlassChip: View {
    let text: String
    var tint: Color = .brandPrimary

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(tint)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background {
                Capsule().fill(tint.opacity(0.15))
            }
    }
}

/// Soft animated mesh background used behind login + onboarding.
/// Three radial gradients drifting independently — looks like a hand-painted
/// brand poster without being noisy.
struct AnimatedMeshBackground: View {
    @State private var phase: CGFloat = 0
    var body: some View {
        ZStack {
            Color(.systemBackground)
            RadialGradient(colors: [.brandPrimary.opacity(0.35), .clear],
                           center: .init(x: 0.2 + 0.1 * sin(phase),
                                         y: 0.25 + 0.05 * cos(phase)),
                           startRadius: 0, endRadius: 280)
            RadialGradient(colors: [.brandAccent.opacity(0.30), .clear],
                           center: .init(x: 0.85 + 0.06 * cos(phase * 1.2),
                                         y: 0.15 + 0.08 * sin(phase * 0.8)),
                           startRadius: 0, endRadius: 260)
            RadialGradient(colors: [.brandInfo.opacity(0.18), .clear],
                           center: .init(x: 0.5,
                                         y: 0.85 + 0.05 * sin(phase * 1.4)),
                           startRadius: 0, endRadius: 320)
        }
        .blur(radius: 40)
        .ignoresSafeArea()
        .onAppear {
            withAnimation(.linear(duration: 24).repeatForever(autoreverses: true)) {
                phase = .pi
            }
        }
    }
}
