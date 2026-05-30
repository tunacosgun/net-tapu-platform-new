# NetTapu iOS (Swift / SwiftUI)

Native iOS app with **Liquid Glass** design language, written in Swift
+ SwiftUI. Shares the same NestJS backend as the web and React-Native
clients.

## Stack

- **Swift 5.10+**
- **SwiftUI** + `@Observable` (Observation framework, iOS 17+)
- **iOS 18.0+** deployment target (Liquid Glass support)
- **async/await** networking, no third-party HTTP lib needed
- **Keychain** for token storage (built-in)
- **URLSession + WebSocket** for live auctions
- **UserNotifications + APNs** for push

## Folder layout

```
apps/ios-native/
└── NetTapu/
    ├── NetTapuApp.swift          – @main entry point
    ├── Config/
    │   └── AppConfig.swift       – API base URL, env switches
    ├── Models/
    │   └── Models.swift          – DTOs (Parcel, Auction, Ticket, …)
    ├── Networking/
    │   └── APIClient.swift       – auth-aware async HTTP client
    ├── Stores/
    │   └── AuthStore.swift       – @Observable session state
    ├── Theme/
    │   ├── Colors.swift          – brand palette
    │   └── LiquidGlass.swift     – reusable glass card / button
    └── Views/
        ├── RootView.swift        – splash / logged-out / logged-in switch
        ├── Auth/LoginView.swift
        ├── Home/HomeView.swift
        ├── Support/SupportTicketsView.swift
        ├── Support/SupportChatView.swift
        └── Components/           – shared atoms
```

## One-time Xcode setup

The repo doesn't ship a pre-baked `.xcodeproj` because it's verbose and
hostile to merge conflicts. Bootstrap once:

1. Open Xcode (16.0 or newer).
2. **File → New → Project → iOS → App**.
3. Name: `NetTapu`, Team: *(your Apple ID)*, Interface: **SwiftUI**,
   Language: **Swift**, Storage: **None**, Include Tests: optional.
4. Save it inside `apps/ios-native/`. Xcode will create
   `apps/ios-native/NetTapu/NetTapu.xcodeproj` and a default
   `NetTapuApp.swift` next to it — **delete the default
   `NetTapuApp.swift`, `ContentView.swift`, and `Assets.xcassets`** that
   Xcode created (we'll replace them).
5. **Drag the `Config/`, `Models/`, `Networking/`, `Stores/`, `Theme/`,
   and `Views/` folders** from Finder into the Xcode project navigator.
   When the import sheet opens: *Copy items if needed* **OFF**, *Create
   groups*, *Add to target: NetTapu*.
6. Also drag the new `NetTapuApp.swift` from this folder (overwriting
   the Xcode default).
7. In the project target → **General → Deployment Target**: set to
   **iOS 18.0**.
8. Build & run on the iPhone 17 Pro Max simulator.

## Configuring the API

`Config/AppConfig.swift` defaults to the production VPS
(`https://nettapu-2.tunasoft.tech`). To point at your local monolith
during development:

```swift
// Config/AppConfig.swift
static let baseURL = URL(string: "http://localhost:8080/api/v1")!
```

iOS Simulator can reach `localhost` directly. A physical iPhone needs
the Mac's LAN IP (`http://192.168.x.x:8080/api/v1`).

## What's already wired up (Phase 1)

- Auth: login (email + password) → `/auth/login` → keychain stores
  access + refresh tokens
- Auto-attach `Authorization: Bearer …` header on every request
- Refresh-token on 401 (single retry, then sign-out)
- Auth-aware `RootView` routes to `LoginView` or `HomeView`
- Home: minimal "Merhaba <name>" hero card + bottom nav placeholder
- Support: list of tickets + chat thread + new-ticket sheet (Liquid
  Glass styled)
- Liquid Glass primitives: `GlassCard`, `GlassButton`, `GlassChip`

## Remaining work (Phase 2+)

- Parcels list/detail/map (with image gallery + favorite)
- Auctions list + LiveAuctionView with WebSocket bid stream
- Deposit + 3DS WebView + payment result flows
- Profile + favorites + offers + saved searches + notifications
- Push notifications (APNs registration → `/user/devices`)
- Real device build with signing
