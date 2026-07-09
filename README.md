# 🌿 iTunda — Kenya Farm-to-Fork Marketplace

**iTunda** connects Kenyan farmers directly with grocery stores, exporters and restaurants.
Browse 1,000+ live listings of avocados, macadamia, roses, tea and more — with real-time
expiry tracking, GPS farm locations and export-ready grading.

> Fresh produce, direct from the farm. 🇰🇪

**Live:** [itunda.org](https://itunda.org) · ASP.NET Core 8 API + React (Vite) web + .NET MAUI app

---

## ✨ Web app

A responsive white-on-green React SPA served by IIS behind Cloudflare.

| Home | Browse |
| --- | --- |
| ![iTunda web home](docs/screenshots/web-home-hero.png) | ![iTunda browse](docs/screenshots/web-browse.png) |

## 📱 Mobile app (.NET MAUI)

Cross-platform (Windows / Android / iOS / macOS) native app sharing the same API.

| Sign in | Browse |
| --- | --- |
| ![iTunda app login](docs/screenshots/app-login.png) | ![iTunda app browse](docs/screenshots/app-browse.png) |

---

## 🧱 Repository structure

```
iTunda/
├── iTunda.Api/   ASP.NET Core 8 Web API (EF Core + SQLite, JWT auth)
├── iTunda.App/   .NET MAUI app (Windows / Android / iOS / macOS)
├── iTunda.Web/   React 19 + Vite + TypeScript SPA
└── iTunda.sln
```

### Tech stack

- **API** — ASP.NET Core 8, EF Core (SQLite), JWT bearer auth, BCrypt, Swagger. Seeds
  ~700 produce listings across 15 farmers and 12 export categories on first run.
- **Web** — React 19, Vite, TypeScript, React Router, Axios.
- **App** — .NET MAUI (net10.0), C# code-behind UI, shared REST client.
- **Design** — white-on-green brand system, Poppins + Inter, harvest-gold accent.

---

## 🎨 Design system

Fresh Kenyan farm palette — deep forest greens with a harvest-gold call-to-action.

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
- **Web** is built with Vite (`dist/`) and served by the IIS site `itunda.org` from
  `C:\inetpub\wwwroot\itunda.org`.
- `iTunda.Web/public/web.config` gives the SPA a fallback route and **proxies `/api` → the
  API service**, so the browser only ever talks to `https://itunda.org`.

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

© iTunda — Farm to Fork Marketplace, Kenya.
