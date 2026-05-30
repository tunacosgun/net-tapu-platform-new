import SwiftUI

struct RootView: View {
    @State private var auth = AuthStore.shared

    var body: some View {
        Group {
            if auth.isHydrating {
                SplashView()
                    .transition(.opacity)
            } else if auth.isAuthenticated {
                HomeView()
                    .transition(.opacity)
            } else {
                LoginView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: auth.isAuthenticated)
        .animation(.easeInOut(duration: 0.25), value: auth.isHydrating)
    }
}

private struct SplashView: View {
    var body: some View {
        ZStack {
            AnimatedMeshBackground()
            VStack(spacing: 16) {
                Text("NetTapu")
                    .font(.system(size: 36, weight: .black, design: .rounded))
                    .foregroundStyle(.brandPrimary)
                ProgressView().tint(.brandPrimary)
            }
        }
    }
}
