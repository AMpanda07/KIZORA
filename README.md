<div align="center">

<h1>KIZORA</h1>

<p><strong>Premium anime streaming platform with intelligent multi-provider stream resolution</strong></p>

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

<p>
  <img src="https://img.shields.io/badge/architecture-lazy_episode_resolution-8B5CF6?style=for-the-badge" alt="Architecture">
  <img src="https://img.shields.io/badge/providers-5_fallback_cascade-C026D3?style=for-the-badge" alt="Providers">
  <img src="https://img.shields.io/badge/license-ISC-blue?style=for-the-badge" alt="License">
</p>

</div>

---

## Overview

**KIZORA** is a full-stack anime streaming platform built with React 19 and Node.js. It implements a **lazy episode + stream resolution** architecture engineered for minimum external API requests. Instead of eagerly scraping entire episode catalogs, KIZORA resolves only the anime and episode the user actually requests — at the moment they request it.

Stream sources are resolved through a **5-provider sequential fallback cascade**, making the platform resilient to provider downtime, rate limits, and unavailability. If Provider 1 cannot deliver Episode 1, Provider 2 is tried. This repeats until a stream is found or all providers are exhausted.

---

## Features

- **Lazy Episode & Stream Resolution** — resolves only the requested `Episode N`, not the entire catalog.
- **5-Provider Fallback Cascade** — automatic sequential fallback across 5 streaming providers for every episode.
- **2-Tier In-Memory Caching** — provider ID mapping cache (24 hr) and stream URL cache (10 min) for fast repeat access.
- **Request Deduplication** — concurrent in-flight requests for the same episode are deduplicated into a single provider call.
- **Provider Cooldown & Transient Retry** — exponential backoff for transient 5xx/timeout errors; instant skip for 404 responses.
- **Glassmorphism UI** — dark mode premium design with animated hero carousels, server switching, and episode navigation.
- **Multi-Server Switching** — users can switch between multiple servers (ArtPlayer, DPlayer, Ruby, Cloudy, etc.) without reloading.
- **Previous / Next Episode Navigation** — in-page episode navigator with lazy stream resolution on demand.
- **Structured Request Logging** — instrumented log output for audit and debugging.

---

## Architecture

### Lazy Episode + Stream Resolution

The core architectural principle of KIZORA is **load what the user needs, not everything the user might need.**

```
User opens Anime Details Page
    ↓
Canonical metadata only
(title, poster, banner, genres, score, year, status, totalEpisodes)
❌ No episode catalog fetch
❌ No provider scraping

User clicks Episode 25
    ↓
GET /api/provider/stream/:animeId/25
    ↓
Provider 1 (AniWixi)     → Episode 25
       ↓ if fail
Provider 2 (Fetch-Stream) → Episode 25
       ↓ if fail
Provider 3 (AnimeWorldIndia) → Episode 25
       ↓ if fail
Provider 4 (Nekosia)     → Episode 25
       ↓ if fail
Provider 5 (AnimeStreamingBoost) → Episode 25
    ↓
Return stream. STOP.
❌ Episode 26 is NOT requested.
❌ Episode 27 is NOT requested.
```

### 5-Provider Adapter System

All providers implement a common `BaseAdapter` interface and are orchestrated by `ProviderManager`:

| Priority | Provider | Status | Role |
|----------|----------|--------|------|
| 1 | **AniWixi** | Active | Primary — native AniList ID support, direct `/anilist/:id/ep/:epNum` endpoint, ArtPlayer + DPlayer embeds |
| 2 | **Fetch-Stream** | Active | Secondary — scrapes ToonStream and AnimeSalt, resolves multi-server streams (Ruby, Cloudy, Abyss, etc.) |
| 3 | **AnimeWorldIndia** | Local | Tertiary — local daemon microservice on `http://127.0.0.1:3001` with `/embed` endpoints |
| 4 | **Nekosia** | Standby | Image/asset API pass-through; gracefully returns null without blocking the cascade |
| 5 | **AnimeStreamingBoost** | Quarantined | Safely disabled; returns null without executing untrusted upstream code |

### Caching Strategy

```
animeMapping:{animeId}              TTL: 24 hours
└─ { aniwixi: "...", fetch-stream: "...", animeworldindia: "..." }
   Resolved once per session, reused for every subsequent episode of the same anime.

stream:{animeId}:{episodeNumber}    TTL: 10 minutes
└─ { success, provider, url, servers[] }
   Respects provider stream URL expiry; eliminates duplicate provider requests.

In-flight deduplication key: episode:{animeId}:{episodeNumber}
   If two requests arrive simultaneously, both await the same single promise.
```

### Failure Response Schema

When all 5 providers fail to resolve an episode:

```json
{
  "success": false,
  "error": {
    "code": "ALL_PROVIDERS_FAILED",
    "animeId": "21",
    "episode": 1
  },
  "attempted": [
    { "provider": "aniwixi", "status": "no_stream_returned" },
    { "provider": "fetch-stream", "status": "anime_not_found" },
    { "provider": "animeworldindia", "status": "anime_not_found" },
    { "provider": "nekosia", "status": "anime_not_found" },
    { "provider": "anime-streaming-boost", "status": "anime_not_found" }
  ]
}
```

---

## Project Structure

```
KIZORA/
├── kizora-backend/                     # Node.js / Express API
│   └── src/
│       ├── config/
│       │   └── db.js                   # MongoDB connection
│       ├── controllers/
│       │   └── stream.controller.js    # Lazy single-episode stream controller
│       ├── middleware/
│       │   └── cache.js                # HTTP response caching middleware
│       ├── models/                     # Mongoose data models
│       ├── providers/
│       │   ├── BaseAdapter.js          # Abstract adapter interface (transient retry, cooldown)
│       │   ├── ProviderManager.js      # Orchestrator: caching, deduplication, fallback cascade
│       │   └── adapters/
│       │       ├── AniwixiAdapter.js
│       │       ├── FetchStreamAdapter.js
│       │       ├── AnimeWorldIndiaAdapter.js
│       │       ├── NekosiaAdapter.js
│       │       └── AnimeStreamingBoostAdapter.js
│       ├── routes/
│       │   ├── anime.routes.js
│       │   ├── auth.routes.js
│       │   ├── provider.routes.js      # /api/provider/* (stream, episode, episodes, info, health)
│       │   └── stream.routes.js
│       ├── services/
│       │   └── provider.service.js     # Delegates to ProviderManager
│       ├── utils/
│       │   └── metadata.js             # AniList → Jikan → AniWixi → Static catalog fallback
│       └── server.js
│
└── kizora-frontend/                    # React 19 + Vite SPA
    └── src/
        ├── components/
        │   ├── AnimeCard.jsx
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   └── VideoPlayer.jsx         # HLS.js + iframe player with server switching
        ├── pages/
        │   ├── Home.jsx                # Hero carousel, trending grid, ranking panel
        │   └── Watch.jsx               # Lazy episode resolution, Prev/Next navigator
        └── services/
            └── api.js                  # fetchAnimeInfo, fetchEpisodeStream, fetchStreamSources
```

---

## API Reference

### Provider Routes — `/api/provider`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/provider/stream/:animeId/:episodeNumber` | **Lazy single-episode stream resolution** across 5-provider fallback cascade |
| `GET` | `/api/provider/episode/:animeId/:episodeNumber` | Alias for lazy single-episode resolution |
| `GET` | `/api/provider/stream/:episodeId` | Compound ID resolution (e.g. `21-ep-1`) |
| `GET` | `/api/provider/info/:animeId` | Anime metadata (AniList → Jikan → AniWixi → static catalog) |
| `GET` | `/api/provider/episodes/:animeId` | Lazy episode list from `totalEpisodes` metadata |
| `GET` | `/api/provider/health` | Real-time health status of all 5 providers |
| `GET` | `/api/provider/test/:animeId/:episodeNumber` | Diagnostic: test all 5 providers for an episode |
| `GET` | `/api/provider/trending` | Trending anime list (cached 30 min) |
| `GET` | `/api/provider/spotlight` | Spotlight anime for hero carousel (cached 1 hr) |
| `GET` | `/api/provider/search` | Search anime by query, genre, or type |
| `GET` | `/api/provider/genres` | Full genre list (cached 24 hr) |

---

## Request Instrumentation

Every stream resolution produces structured, traceable logs:

```
[WATCH] Anime: 21
[WATCH] Episode: 1
[METADATA] request (animeId: 21)
[aniwixi] Episode 1
[STREAM] aniwixi SUCCESS
```

Stream cache hit:
```
[WATCH] Anime: 21
[WATCH] Episode: 1
[STREAM] aniwixi (from cache)
```

All-providers failure:
```
[WATCH] Anime: 999999999
[WATCH] Episode: 9999
[aniwixi] Episode 9999
[fetch-stream] Episode 9999
[animeworldindia] Episode 9999
[nekosia] Episode 9999
[anime-streaming-boost] Episode 9999
[STREAM] ALL_PROVIDERS_FAILED for anime 999999999 ep 9999
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (Atlas or local)
- **AnimeWorldIndia daemon** running on `http://127.0.0.1:3001` (optional — Provider 3)

### Environment Variables

Create `kizora-backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development

# Optional: override provider base URLs
ANIWIXI_API_URL=https://aniwixi.xyz/wp-json/aniwixi/v1
FETCH_STREAM_API_URL=https://fetch-stream.vercel.app
ANIME_WORLD_INDIA_API_URL=http://127.0.0.1:3001/api

# AniList OAuth (optional)
ANILIST_CLIENT_ID=your_client_id
ANILIST_CLIENT_SECRET=your_client_secret
```

### Running Locally

**Backend:**
```bash
cd kizora-backend
npm install
npm run dev        # starts on http://localhost:5000
```

**Frontend:**
```bash
cd kizora-frontend
npm install
npm run dev        # starts on http://localhost:5173
```

---

## Rate Limit Protection

KIZORA implements multiple layers of rate-limit protection:

| Mechanism | Description |
|-----------|-------------|
| **Lazy Resolution** | Only the requested episode is fetched; no catalog pre-loading |
| **Provider ID Cache** | AniList/MAL → provider ID mapping cached 24 hr; no re-search per episode |
| **Stream Cache** | Successful streams cached 10 min; no duplicate provider calls for the same episode |
| **Request Deduplication** | Concurrent requests for the same episode share one in-flight promise |
| **Provider Cooldown** | Temporarily deprioritizes providers after failures (2-minute cooldown) |
| **Transient Retry** | Retries only 5xx / timeout errors with exponential backoff |
| **404 Skip** | `Not Found` responses are not retried; cascade moves immediately to the next provider |
| **5-Attempt Hard Limit** | One attempt per provider per request; no cycling |

---

## Tech Stack

**Frontend**
- React 19 · Vite 8 · React Router v7
- Vanilla CSS / Tailwind CSS · Lucide React icons
- HLS.js for adaptive bitrate streaming

**Backend**
- Node.js · Express 5
- Mongoose · MongoDB Atlas
- Axios · Node-Cache · Node-Cron
- Helmet · CORS

**Metadata Sources**
- AniList GraphQL API (primary)
- Jikan REST API / MyAnimeList (secondary)
- AniWixi API (tertiary)
- Static catalog (offline fallback)

---

## License

ISC © [AMpanda07](https://github.com/AMpanda07)
