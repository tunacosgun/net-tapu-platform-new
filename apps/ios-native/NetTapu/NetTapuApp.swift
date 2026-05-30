import SwiftUI

@main
struct NetTapuApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(nil)   // honour system light/dark
        }
    }
}
