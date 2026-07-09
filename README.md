# 🌿 iTunda — Global Farm-to-Fork Commodity Marketplace

**iTunda** connects farmers directly with grocery stores, exporters and restaurants — trading
avocados, macadamia, coffee, bananas, roses, tea and 20+ more commodities like a farm-to-futures
trading desk. Browse 1,000+ live listings across **26 top growing regions** and **4 export zones** —
from Kenya, Uganda and Ethiopia to Peru, Chile and Mexico — with live prices, spot/limit/futures/put
orders, one-tap **BUY / SELL** buttons, a live currency switcher, GPS farm pins and instant delivery
estimates.

> Fresh produce, direct from the farm. 🌍

**Live:** [itunda.org](https://itunda.org) · ASP.NET Core 8 API + React (Vite) web + .NET MAUI app
· Google sign-in · Android APK download

---

## ✨ Web app

A responsive white-on-green React SPA served by IIS behind Cloudflare, with a live **clickable**
commodity price ticker, a currency switcher (KES / USD / GBP / EUR …), flag-based region/zone
selector, interactive Leaflet maps and a full order book.

| Home (ticker + live stats) | Browse (category icons + BUY / Bid) |
| --- | --- |
| ![iTunda web home](docs/screenshots/web-home-hero.png) | ![iTunda browse](docs/screenshots/web-browse.png) |

| Commodity Exchange (26 commodities, BUY / SELL) | Produce detail — world-class trade ticket |
| --- | --- |
| ![iTunda market](docs/screenshots/web-market.png) | ![iTunda produce detail](docs/screenshots/web-detail.png) |

| Get the App (Android APK download) | Delivery Route Estimator |
| --- | --- |
| ![iTunda downloads](docs/screenshots/web-downloads.png) | ![iTunda delivery](docs/screenshots/web-delivery.png) |

## 📱 Mobile app (.NET MAUI)

Cross-platform (Windows / Android / iOS / macOS) native app sharing the same API — with fruit icons,
produce photo galleries, country flags, export-zone chips and open-in-Google-Maps meet-up points.

| Browse | Produce detail |
| --- | --- |
| ![iTunda app browse](docs/screenshots/app-browse.png) | ![iTunda app detail](docs/screenshots/app-detail.png) |

---

## 🚀 Feature highlights

- **Farm-to-futures trade ticket** — a world-class order panel with **BUY / SELL** sides and four
  order kinds: **Spot** (buy now), **Limit** (bid at your price), **Futures** (forward contract with
  an expiry date) and **Put option** (right to sell) — priced in your chosen currency.
- **Dedicated BUY / SELL buttons** across the site — on every produce card, the commodity board and
  the market, so anyone can place or fill an order in one tap.
- **Commodity exchange** — a forex-style order book with live **buy orders (bids)** and farm-gate
  **offers (asks)** per commodity, plus average / low / high price summaries across **26 commodities**
  (avocados, coffee, bananas, mangoes, apples, macadamia, tea, roses, cocoa, vanilla and more).
- **Live currency switcher** — flip the whole app between KES, USD, GBP, EUR and other currencies
  with live exchange rates (cached, with static fallbacks) right next to the price ticker.
- **Clickable price ticker** — a scrolling under-header ticker of daily commodity prices and %
  change; click any commodity to jump straight to its market.
- **Google sign-in** — one-click sign-up / login with Google (GSI) on both `/login` and `/register`,
  backed by a PostgreSQL-backed session service.
- **Seller requirements** — farmers must upload produce photos, planting date, best-before date and
  a GPS farm location before a listing goes live, so buyers get verifiable provenance.
- **Regions & export zones** — 26 curated growing regions grouped into 4 export zones, with a
  flag-based region selector (auto-detects the visitor's country) that filters the whole app.
- **Interactive maps** — real Leaflet pins for farms, suggested meet-up points and regional hubs,
  each opening turn-by-turn directions in Google Maps.
- **Delivery estimator** — check routes, transit time and freight price between any region and
  market hub, **no login required** (OSRM road routing + great-circle freight lines).
- **Android app** — download the native **.NET MAUI APK** straight from the site header (*Get the App*).
- **Rich imagery** — every listing has a hero photo + gallery and a per-category fruit icon;
  farmer profiles show photos of the growing region.
- **Deep links** — both `/browse/Avocados` and `/browse?category=Avocados` resolve to the same view.

---

## 🧱 Repository structure

```
iTunda/
├── iTunda.Api/   ASP.NET Core 8 Web API (EF Core + SQLite, JWT auth)
├── iTunda.App/   .NET MAUI app (Windows / Android / iOS / macOS)
├── iTunda.Web/   React 19 + Vite + TypeScript SPA
├── auth-server/  Node/Express Google-sign-in sidecar (PostgreSQL sessions)
└── iTunda.sln
```

### Tech stack

- **API** — ASP.NET Core 8, EF Core (SQLite), JWT bearer auth, BCrypt, Swagger. Seeds ~1,000
  produce listings + spot/limit/futures/put orders across 26 farmers/regions and **26 commodities**
  on first run.
- **Web** — React 19, Vite, TypeScript, React Router, Axios, Leaflet (maps), FlagCDN (flags),
  `@react-oauth/google` (Google sign-in) and a live currency context (open.er-api.com rates).
- **Auth** — a small Node/Express sidecar verifies Google credentials (`google-auth-library`) and
  issues PostgreSQL-backed sessions; IIS proxies `/gauth/*` to it.
- **App** — .NET MAUI (net10.0), C# code-behind UI, shared REST client; shipped as a signed Android APK.
- **Design** — white-on-green brand system, Poppins + Inter, harvest-gold accent, red/green BUY-SELL.

### Key API endpoints

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `GET /api/produce` | public | Listings, filterable by `category`, `region`, `country`, `zone`, `exportReady` |
| `POST /api/produce` | farmer | Create a listing (requires photos, planting + best-before dates, farm GPS) |
| `GET /api/regions` | public | Growing regions + export zones with live listing counts |
| `GET /api/commodities` | public | Price board (avg / low / high / daily change) for the ticker |
| `GET /api/buyorders` · `POST /api/buyorders` | public | Read / post orders, filterable by `side` + `kind` (spot/limit/futures/put) |
| `POST /api/delivery/estimate` | public | Route distance, ETA and freight price between two points |
| `POST /gauth/google` · `GET /gauth/me` | public | Google sign-in — verify credential, issue/read a session |

---

## 🎨 Design system

Fresh farm palette — deep forest greens with a harvest-gold call-to-action.

| Token | Value | Use |
| --- | --- | --- |
| Primary green | `#0E7A3E` | Buttons, headings |
| Deep green | `#0A4A26` | Nav bar, hero, footer |
| Fresh green | `#16A34A` | Highlights, links |
| Harvest gold | `#F4A621` | Primary CTAs, prices |
| Page tint | `#F3FAF5` | Backgrounds |

Fonts: **Poppins** (headings) + **Inter** (body).

---

## 🚀 Local development

### Prerequisites
- .NET 10 SDK (with the `maui` workloads for the app)
- Node.js 20+

### 1. API
```bash
cd iTunda.Api
dotnet run
# → http://localhost:5041 (Swagger at /swagger). SQLite DB + seed data are created automatically.
```

### 2. Web
```bash
cd iTunda.Web
npm install
npm run dev
# → http://localhost:3000  (Vite proxies /api → the local API)
```

### 3. Mobile app (Windows)
```bash
cd iTunda.App
dotnet build -f net10.0-windows10.0.19041.0
# or open iTunda.sln in Visual Studio and run the iTunda.App (Windows Machine) target
```
Demo login (any seeded account, password `Password123!`):
`james.kamau@farm.ke` (farmer) · `orders@nairobifresh.ke` (buyer).

---

## 🌐 Production hosting (this server)

iTunda is deployed on IIS (Windows Server) behind Cloudflare, following the same pattern as
the other sites on the box:

- **API** runs as a Windows service (`itunda-api`, via NSSM) on `http://127.0.0.1:5088`.
- **Auth sidecar** runs as a Windows service (`itunda-auth`, via NSSM) on `http://127.0.0.1:3019`
  and handles Google sign-in against PostgreSQL.
- **Web** is built with Vite (`dist/`) and served by the IIS site `itunda.org` from
  `C:\inetpub\wwwroot\itunda.org`.
- `iTunda.Web/public/web.config` gives the SPA a fallback route, **proxies `/api` → the API
  service** and **`/gauth` → the auth sidecar**, and adds an `.apk` MIME map so the Android build is
  served from `/dl/itunda.apk`. The browser only ever talks to `https://itunda.org`.

> **Google sign-in origins:** the client ID lives in the `petezdj` GCP project ("Web client 1").
> `https://itunda.org` (and `https://www.itunda.org`) must be listed under *Authorised JavaScript
> origins* for the button to render. Google does not allow plain `http://` origins, so Cloudflare's
> *Always Use HTTPS* upgrades `http://itunda.org` visitors to the working HTTPS origin.

Rebuild and redeploy the web app at any time with:

```powershell
# from the repo root
powershell -File publish.ps1          # build + deploy to wwwroot
powershell -File publish.ps1 -Install  # also refresh npm dependencies
```

To (re)publish the API service:

```powershell
dotnet publish iTunda.Api -c Release -r win-x64 --self-contained true -o C:\inetpub\apps\itunda-api
nssm restart itunda-api
```

---

## 📄 License

© iTunda — Global Farm-to-Fork Commodity Marketplace.
