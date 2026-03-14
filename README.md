# brightplace

Conversational apartment search — describe what you want in plain English and brightplace finds matching listings.

**Live:** [brightplace.vercel.app](https://brightplace.vercel.app/)

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit + integration tests (Vitest)
npm run build    # production build
npm run lint     # ESLint
```

## Architecture Decisions

### Why client-side search?

This is a frontend exercise, so all filtering logic runs in the browser against an in-memory dataset of 6 listings. No API routes or server actions — the goal is to demonstrate frontend problem-solving: NLP-style parsing, weighted scoring, responsive UI, and good UX patterns. In production, `searchListings()` would be replaced by an API call and the skeleton loading state would cover the real network round-trip.

### NLP-style scoring search

As specified in the exercise requirements, the app uses a conversational single-input approach instead of a traditional faceted filter UI (dropdowns for city, sliders for price). Queries are parsed into structured filters (city, state, beds, price range, square footage range, availability) plus free-text keywords. Each listing is scored against these dimensions — city match is weighted highest (10), beds/price/sqft/availability at 8, state at 5, keyword/amenity hits at 3. Results are hard-filtered first, then ranked by score. This gives users flexibility: "1br in Denver under $1,500", "bigger than 800 sqft available today", and "pool in Texas" all work naturally.

Keywords that don't match anything in the dataset (e.g., "in Brazil") correctly produce zero results, preventing false positives when combining unknown locations with valid filters.

The tradeoff is discoverability — users don't know what filters are available without trying. The example query buttons mitigate this by showing what kinds of queries work.

### URL state sync

Search queries are synced to the URL via `?q=` parameter using `useSearchParams`. This means search results are shareable — you can copy a URL and someone else sees the same results. This is a small detail that makes the app feel production-ready.

### Simulated loading state

A 400ms delay is added so the skeleton loading state (`SkeletonGrid`) is visible. This mirrors a real API call and lets us validate that the loading UX works correctly. The search button is disabled during loading to prevent request stacking.

### CSS-only comparison chart

The rent comparison bar uses CSS percentage widths instead of a charting library like Recharts or Chart.js. For a simple horizontal bar chart with 6 items, pulling in a 40KB+ library would be over-engineering. The CSS approach is zero-dependency and keeps the bundle small.

## Bonus Features

- **Side-by-side comparison modal** — Select up to 4 properties via checkbox overlays on cards, then open a full-screen comparison table covering rent, size, location, availability, and amenities. Best values (lowest rent, most sqft) are highlighted in green for quick evaluation.
- **Sort controls** — Pill buttons to sort results by Price, Size, or Name with ascending/descending toggle.
- **Rent comparison bar** — Horizontal bar chart comparing rent across results using a teal-to-orange gradient. Shown automatically for 2+ results, capped at 6 entries.
- **Image error fallback** — Broken image URLs gracefully show a gradient placeholder instead of a broken image icon.
- **Shareable URLs** — Search query is synced to `?q=` so results can be bookmarked and shared.

## Component Structure

```
SearchInterface       — orchestrates state, search, sort, comparison, URL sync
├── SearchBar         — input + button, aria-labeled
├── SortBar           — sort pill buttons
├── ComparisonBar     — rent comparison visualization
├── ComparisonDock    — sticky bottom bar with selection count + compare action
├── ComparisonModal   — accessible side-by-side comparison table (focus trap, Escape)
└── PropertyCard      — listing card with image fallback + compare checkbox
```

## Testing

Vitest with jsdom. Tests cover:

100 tests across 4 test files:

- **Search engine** (`parseQuery`, `searchListings`) — query parsing, combined filters, keyword matching, edge cases, score ordering, security inputs.
- **UI integration** (`SearchInterface`, `PropertyCard`, `ComparisonBar`) — rendering, user interactions, loading/empty states, sort toggling, accessibility, image fallback.

## Deployment

CI runs lint → test → build on every push and PR to `master`. The `master` branch is protected — all changes must go through a pull request. On merge to `master`, the deploy workflow automatically pushes the build to Vercel at [brightplace.vercel.app](https://brightplace.vercel.app/).
