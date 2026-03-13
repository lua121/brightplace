# brightplace

Conversational apartment search — describe what you want in plain English and brightplace finds matching listings.

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (Vitest)
npm run build    # production build
npm run lint     # ESLint
```

## Architecture Decisions

### NLP-style scoring search
Queries are parsed into structured filters (city, state, beds, max price) plus free-text keywords. Each listing is scored against these dimensions — city match is weighted highest (10), beds/price at 8, state at 5, keyword/amenity hits at 3. Results are filtered by hard constraints first, then ranked by score. This gives users flexibility: "1br in Denver under $1,500" and "pool in Texas" both work naturally.

### Simulated loading state
The search runs synchronously against an in-memory dataset of 6 listings. A brief 400 ms delay is added so the skeleton loading state (`SkeletonGrid`) is visible to the user — mirroring the experience of a real API call. In production this delay would be replaced by the actual network round-trip. The search button is disabled during loading to prevent request stacking.

### Vitest for testing
Vitest was chosen over Jest for zero-config Vite compatibility, fast startup, and native ESM/TypeScript support. Tests cover the query parser (`parseQuery`) and the search engine (`searchListings`) with 16 cases including edge cases like empty queries, no-match, combined filters, and score ordering.

## Bonus Features

- **Sort controls** — Pill buttons to sort results by Price, Size, or Name with ascending/descending toggle.
- **Rent comparison bar** — Horizontal bar chart comparing rent across results using a teal-to-orange gradient. Shown automatically for 2+ results.
- **Image error fallback** — Broken image URLs gracefully show a gradient placeholder instead of a broken image icon.

## Component Structure

```
SearchInterface       — orchestrates state, search, sort
├── SearchBar         — input + button, aria-labeled
├── SortBar           — sort pill buttons
├── ComparisonBar     — rent comparison visualization
└── PropertyCard      — individual listing card with image fallback
```

## Tradeoffs

- **Fixed dataset**: The 6 listings are hardcoded per the spec. In production, `searchListings` would become an API call and the skeleton loading state would be used.
- **No component tests**: UI component tests were skipped in favor of thorough unit tests on the search logic, which is where the core complexity lives.
- **CSS-only comparison chart**: The rent comparison uses CSS percentage widths instead of a charting library — keeps the bundle small for a simple visualization.
