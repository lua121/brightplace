import { Listing, listings } from "@/data/listings";

export interface ParsedQuery {
  city: string | null;
  state: string | null;
  beds: number | null;
  maxPrice: number | null;
  keywords: string[];
}

// Derive searchable values from the dataset so the parser stays in sync
// with whatever listings exist — no manual hardcoding required.
const CITIES = [...new Set(listings.map((l) => l.city.toLowerCase()))];
const STATE_ABBRS = [...new Set(listings.map((l) => l.state.toLowerCase()))];

// Full-name → abbreviation lookup. Only includes states present in the dataset
// so the parser doesn't match irrelevant tokens.
const STATE_FULL_NAMES: Record<string, string> = Object.fromEntries(
  [
    ["texas", "TX"],
    ["colorado", "CO"],
    ["arizona", "AZ"],
    ["georgia", "GA"],
  ].filter(([, abbr]) => STATE_ABBRS.includes(abbr.toLowerCase()))
);

// Reverse lookup used by buildSummary — derived from the same map.
const STATE_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_FULL_NAMES).map(([full, abbr]) => [abbr, full.charAt(0).toUpperCase() + full.slice(1)])
);

export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase().trim();

  // Extract city
  const city = CITIES.find((c) => q.includes(c)) ?? null;

  // Extract state (full name or abbreviation)
  let state: string | null = null;
  for (const [fullName, abbr] of Object.entries(STATE_FULL_NAMES)) {
    if (q.includes(fullName)) {
      state = abbr;
      break;
    }
  }
  if (!state) {
    for (const abbr of STATE_ABBRS) {
      const regex = new RegExp(`\\b${abbr}\\b`, "i");
      if (regex.test(q)) {
        state = abbr.toUpperCase();
        break;
      }
    }
  }

  // Extract bed count
  let beds: number | null = null;
  const bedMatch = q.match(/(\d)\s*(?:br|bed|bedroom|beds|bedrooms)/i);
  if (bedMatch) {
    beds = parseInt(bedMatch[1], 10);
  } else if (/\bstudio\b/i.test(q)) {
    beds = 0;
  }

  // Extract max price
  let maxPrice: number | null = null;
  const pricePatterns = [
    /(?:under|below|less than|max|up to)\s*\$?([\d,]+)/i,
    /\$?([\d,]+)\s*(?:or less|max|maximum)/i,
    /budget.*?\$?([\d,]+)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = q.match(pattern);
    if (match) {
      maxPrice = parseInt(match[1].replace(/,/g, ""), 10);
      break;
    }
  }

  // Extract remaining keywords for amenity/feature matching
  // Remove already-parsed tokens
  let remaining = q;
  if (city) remaining = remaining.replace(city, "");
  if (state) remaining = remaining.replace(new RegExp(`\\b${state}\\b`, "gi"), "");
  if (bedMatch) remaining = remaining.replace(bedMatch[0], "");
  for (const pattern of pricePatterns) {
    remaining = remaining.replace(pattern, "");
  }

  // Clean up common filler words
  const fillers = [
    "i need", "i want", "looking for", "find me", "show me", "search for",
    "apartments", "apartment", "in", "with", "and", "a", "an", "the", "that",
    "has", "have", "near", "around",
  ];
  for (const filler of fillers) {
    remaining = remaining.replace(new RegExp(`\\b${filler}\\b`, "gi"), "");
  }

  const keywords = remaining
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ""))
    .filter((w) => w.length > 2);

  return { city, state, beds, maxPrice, keywords };
}

export interface SearchResult {
  listings: Listing[];
  summary: string;
  parsed: ParsedQuery;
}

export function searchListings(query: string): SearchResult {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      listings: [...listings],
      summary: "Here are all available apartments.",
      parsed: { city: null, state: null, beds: null, maxPrice: null, keywords: [] },
    };
  }

  const parsed = parseQuery(trimmed);
  const { city, state, beds, maxPrice, keywords } = parsed;

  // Score each listing
  const scored = listings.map((listing) => {
    let score = 0;
    const lowerCity = listing.city.toLowerCase();
    const lowerName = listing.property_name.toLowerCase();
    const amenityStr = listing.amenities.join(" ").toLowerCase();

    // City match
    if (city && lowerCity === city) score += 10;

    // State match
    if (state && listing.state === state) score += 5;

    // Beds match
    if (beds !== null && listing.beds === beds) score += 8;

    // Price match
    if (maxPrice !== null && listing.rent <= maxPrice) score += 8;

    // Keyword matches against name and amenities
    for (const kw of keywords) {
      if (lowerName.includes(kw)) score += 3;
      if (amenityStr.includes(kw)) score += 3;
      if (lowerCity.includes(kw)) score += 2;
    }

    return { listing, score };
  });

  // Determine if we have any structured filters active
  const hasFilters = city || state || beds !== null || maxPrice !== null;

  // Filter: if structured filters exist, require at least one structural match
  let filtered = scored;
  if (hasFilters) {
    filtered = scored.filter((item) => {
      if (city && item.listing.city.toLowerCase() !== city) return false;
      if (state && item.listing.state !== state) return false;
      if (beds !== null && item.listing.beds !== beds) return false;
      if (maxPrice !== null && item.listing.rent > maxPrice) return false;
      return true;
    });
  } else if (keywords.length > 0) {
    // Only keyword search — require some relevance
    filtered = scored.filter((item) => item.score > 0);
  }

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);
  const results = filtered.map((item) => item.listing);

  // Build summary
  const summary = buildSummary(results, parsed);

  return { listings: results, summary, parsed };
}

function buildSummary(results: Listing[], parsed: ParsedQuery): string {
  if (results.length === 0) {
    return "No apartments match your search. Try adjusting your criteria.";
  }

  const parts: string[] = [];
  parts.push(`Found ${results.length} apartment${results.length !== 1 ? "s" : ""}`);

  if (parsed.city) {
    parts.push(`in ${capitalize(parsed.city)}`);
  } else if (parsed.state) {
    parts.push(`in ${STATE_DISPLAY_NAMES[parsed.state] ?? parsed.state}`);
  }

  if (parsed.beds !== null) {
    parts.push(`with ${parsed.beds} bedroom${parsed.beds !== 1 ? "s" : ""}`);
  }

  if (parsed.maxPrice !== null) {
    parts.push(`under $${parsed.maxPrice.toLocaleString()}`);
  }

  return parts.join(" ") + ".";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
