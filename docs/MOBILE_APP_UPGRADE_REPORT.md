# iTunda Mobile App — Upgrade Deep-Dive Report

_Last updated: 2026-07-11_

This report covers (1) what was just shipped in this pass, (2) a prioritised roadmap
for turning the .NET MAUI app into a full-featured, store-ready product, and
(3) concrete implementation notes for the two features you called out —
**using the device's real GPS location for the map pin** and **taking photos with
the phone camera**.

---

## 1. What shipped in this pass

| Area | Change |
| --- | --- |
| **Login "connection failure"** | Root cause: the app's API base URL was `http://localhost:5088/api`. On a real phone `localhost` is the phone itself, so every request failed. Changed to **`https://itunda.org/api`** (see `ApiClient.BaseUrl`). Login now reaches the live server. |
| **.NET splash / icon** | The purple `#512BD4` "NET" splash and icon were the stock MAUI assets. Replaced `splash.svg`, `appicon.svg`, `appiconfg.svg` with an **iTunda green (`#0A4A26`) leaf** and updated the `MauiSplashScreen` / `MauiIcon` colors. No more .NET logo on launch. |
| **Google sign-in** | Added **"Continue with Google"** to the app's Login and Register pages. It uses `WebAuthenticator` (the OS secure browser) to open a hosted bridge page (`/mobile-signin.html`) that runs the already-authorised Google Identity button, exchanges the token via the new **`POST /api/auth/google`** endpoint, and deep-links a real iTunda JWT back through the `itunda://auth` scheme. |
| **Price graphs (parity)** | New **Prices** tab: pick a commodity + timeframe (**1W / 1M / 1Y**) and see a native area/line chart (drawn with `Microsoft.Maui.Graphics`, no third-party lib) plus current / avg / low / high / % change and a tappable quote board. Mirrors the new web market graphs. |
| **Backend (shared)** | New `GET /api/commodities/{category}/history?range=1W|1M|1Y` price-history endpoint; `POST /api/auth/google` JWT minting; seed data now guarantees a healthy pool of listings for **every** crop. |

> **One manual step for Google sign-in to go live on device:** the flow reuses the
> existing **Web** OAuth client, whose authorised JavaScript origin is already
> `https://itunda.org`, so no secret or new client is strictly required. If Google
> ever blocks the embedded browser, register a dedicated **Android OAuth client**
> (package `com.companyname.itunda.app` + the APK's SHA-1 fingerprint) and switch to
> the native `Xamarin.Google.Android.Play.Services.Auth` flow described in §3.3.

---

## 2. Prioritised upgrade roadmap

### P0 — Make the core loop excellent (1–2 weeks)
1. **Real device GPS for the map pin** — see §3.1.
2. **Camera + gallery photo capture for listings** — see §3.2.
3. **Native "Post produce / Sell" flow** with drafts, delivery scope (Local/Export),
   decimal quantities, planting & best-before dates — full parity with the website's
   `SellPage`. The API already supports all of this (`CreateProduceRequest`,
   `IsDraft`, `DeliveryScope`, `PUT /api/produce/{id}`, `GET /api/produce/mine`).
4. **Secure token storage** — move the JWT from `Preferences` to
   `SecureStorage` (Keychain / Android Keystore).

### P1 — Trading & money (1–2 weeks)
5. **Buy/Sell trade tickets** (Spot / Limit / Futures / Put) matching the web
   `TradeTicket`, posting to `POST /api/buyorders` and `POST /api/orders`.
6. **Currency switch** (KES / USD / GBP …) with the same live-rate service the web
   uses; cache the last rate for offline.
7. **Delivery estimator** (distance, ETA, price) calling `POST /api/delivery/estimate`,
   with an interactive map.

### P2 — Retention & polish (ongoing)
8. **Push notifications** — order status changes and **price alerts** ("Avocado avg
   crossed KES 120"). Firebase Cloud Messaging on Android, APNs on iOS.
9. **Offline-first caching** — cache commodities, listings and the last price series
   (e.g. `MonkeyCache` or a small SQLite store) so the app opens instantly and works
   on poor connectivity.
10. **Biometric unlock** (`Plugin.Fingerprint`) for returning users.
11. **Deep links / universal links** — `https://itunda.org/produce/123` opens the
    native detail page; share sheets from listings.
12. **Localization** (English / Swahili / French) via `.resx` + `CultureInfo`.
13. **Accessibility** — semantic properties, dynamic font sizes, sufficient contrast.

### P3 — Production hardening
14. **Crash & usage analytics** — App Center / Sentry.
15. **CI/CD** — GitHub Actions building signed AAB/APK + IPA, auto-uploading to the
    Play Console internal track and TestFlight.
16. **Performance** — enable NativeAOT/trimming where safe, image downsampling &
    caching (`FFImageLoading`/`Microsoft.Maui` image caching), and lazy tab loading.
17. **App Store / Play Store readiness** — privacy policy, data-safety form,
    screenshots, versioning (`ApplicationDisplayVersion` / `ApplicationVersion`).

---

## 3. Implementation notes for the highlighted features

### 3.1 Use the device's real location for the map pin

**Permissions** (`Platforms/Android/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```
iOS (`Platforms/iOS/Info.plist`):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>iTunda uses your location to pin your farm or delivery address.</string>
```

**Getting the location** (built into MAUI Essentials — no extra package):
```csharp
async Task<Location?> GetCurrentAsync()
{
    var status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
    if (status != PermissionStatus.Granted) return null;

    var loc = await Geolocation.Default.GetLocationAsync(new GeolocationRequest(
        GeolocationAccuracy.Medium, TimeSpan.FromSeconds(10)));
    return loc; // loc.Latitude, loc.Longitude
}
```

**Interactive map + draggable pin.** MAUI's built-in `Microsoft.Maui.Controls.Maps`
`Map` shows pins but isn't freely draggable. Two good options:
- **`Microsoft.Maui.Controls.Maps`** — quickest; drop a `Pin`, and let the user
  long-press to move it (handle `MapClicked`).
- **`Mapsui`** (OpenStreetMap, keyless) — matches the web's Leaflet/OSM look, supports
  a draggable marker layer, and needs no Google Maps key.

**Reverse geocoding** (coords → address label), keyless via the same Nominatim
service the website uses:
```csharp
var placemarks = await Geocoding.Default.GetPlacemarksAsync(lat, lng); // MAUI Essentials
// or GET https://nominatim.openstreetmap.org/reverse?format=json&lat=..&lon=..
```
Feed the resulting `FarmLatitude` / `FarmLongitude` straight into
`CreateProduceRequest` and `CreateOrderRequest` (`DeliveryLat` / `DeliveryLng`) — the
backend already persists them.

### 3.2 Take photos with the phone camera

**Permissions** (Android): `CAMERA` (and on <=API 32, `READ_EXTERNAL_STORAGE`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
```
iOS: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`.

**Capture / pick** (MAUI Essentials `MediaPicker`, no extra package):
```csharp
FileResult? photo = MediaPicker.Default.IsCaptureSupported
    ? await MediaPicker.Default.CapturePhotoAsync()
    : await MediaPicker.Default.PickPhotoAsync();

using var src = await photo.OpenReadAsync();
```

**Downscale + encode** to keep uploads small (the web downsizes to a data-URI; do the
same on device so the payload matches `CreateProduceRequest.Images`):
```csharp
// Microsoft.Maui.Graphics: load, resize to ~1024px, re-encode JPEG, base64
var image = PlatformImage.FromStream(src);
var resized = image.Downsize(1024, true);
using var ms = new MemoryStream();
resized.Save(ms, ImageFormat.Jpeg, 0.8f);
var dataUri = "data:image/jpeg;base64," + Convert.ToBase64String(ms.ToArray());
```
Collect several into `request.Images` (first becomes the hero image) exactly like the
web `SellPage`. Add a horizontal thumbnail strip with a remove button per photo.

### 3.3 (Optional) Native Google sign-in

The current browser-bridge flow works with the existing web client. If you want the
native one-tap sheet instead:
- Create an **Android OAuth 2.0 client** in Google Cloud Console using package
  `com.companyname.itunda.app` and the signing certificate SHA-1
  (`keytool -list -v -keystore <your.keystore>`).
- Use `Xamarin.Google.Android.Play.Services.Auth` (Credential Manager / One Tap) to get
  a Google **ID token**, then POST it to the existing `POST /api/auth/google` — the
  server side needs no change.
- iOS: add `GoogleSignIn` pod equivalent + reversed-client-id URL scheme.

---

## 4. Effort & impact summary

| # | Feature | Impact | Effort |
| --- | --- | --- | --- |
| 1 | Device GPS pin | High | S |
| 2 | Camera capture | High | S |
| 3 | Native sell/draft flow | High | M |
| 4 | Secure token storage | Med (security) | S |
| 5 | Trade tickets (spot/limit/fut/put) | High | M |
| 6 | Currency switch | Med | S |
| 7 | Delivery estimator + map | Med | M |
| 8 | Push notifications | High (retention) | M–L |
| 9 | Offline caching | Med | M |
| 10 | Biometric unlock | Low–Med | S |
| 11 | Deep links | Med | S |
| 12 | Localization (EN/SW/FR) | Med | M |
| 14 | Crash/analytics | Med (ops) | S |
| 15 | CI/CD to stores | High (ops) | M |

_S = ≤2 days, M = ~1 week, L = 2+ weeks._

---

## 5. Suggested next sprint

1. GPS pin + camera capture (§3.1, §3.2) — biggest UX wins, both use built-in MAUI
   Essentials, minimal new dependencies.
2. Native sell/draft flow reusing those two.
3. Move JWT to `SecureStorage`.
4. Wire push notifications for order status + price alerts.
