import { listings } from "@/data/listings";

export interface ParsedQuery {
  city: string | null;
  state: string | null;
  beds: number | null;
  minBeds: number | null;
  baths: number | null;
  minBaths: number | null;
  maxPrice: number | null;
  minPrice: number | null;
  minSqft: number | null;
  maxSqft: number | null;
  availableBy: string | null;
  keywords: string[];
  keywordMode: "and" | "or";
}

export const EMPTY_PARSED: ParsedQuery = {
  city: null, state: null, beds: null, minBeds: null, baths: null,
  minBaths: null, maxPrice: null, minPrice: null, minSqft: null,
  maxSqft: null, availableBy: null, keywords: [], keywordMode: "or",
};

// Derive searchable values from the dataset so the parser stays in sync
// with whatever listings exist.
const CITIES = [...new Set(listings.map((l) => l.city.toLowerCase()))];
const STATE_ABBRS = [...new Set(listings.map((l) => l.state.toLowerCase()))];

// Full-name → abbreviation lookup, filtered to only include states present
// in the dataset. The source list is hardcoded here for simplicity — in a
// production app this would come from a library like `us-states` or a
// backend endpoint so the parser doesn't need manual updates when new
// states are added to the dataset.
const STATE_FULL_NAMES: Record<string, string> = Object.fromEntries(
  [
    ["texas", "TX"],
    ["colorado", "CO"],
    ["arizona", "AZ"],
    ["georgia", "GA"],
  ].filter(([, abbr]) => STATE_ABBRS.includes(abbr.toLowerCase()))
);

// Reverse lookup used by buildSummary — derived from the same map.
export const STATE_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_FULL_NAMES).map(([full, abbr]) => [abbr, full.charAt(0).toUpperCase() + full.slice(1)])
);

const MONTH_NAMES: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function endOfMonth(year: number, month: number): string {
  const d = new Date(year, month + 1, 0);
  return d.toISOString().split("T")[0];
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Try each pattern in order; return the first match or null. */
function firstMatch(q: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match) return match;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Field extractors — each returns the parsed value(s) and the matched string
// so the caller can strip consumed tokens from the remaining text.
// ---------------------------------------------------------------------------

function extractCity(q: string) {
  const city = CITIES.find((c) => q.includes(c)) ?? null;
  return { city };
}

function extractState(q: string) {
  for (const [fullName, abbr] of Object.entries(STATE_FULL_NAMES)) {
    if (q.includes(fullName)) return { state: abbr };
  }
  for (const abbr of STATE_ABBRS) {
    if (new RegExp(`\\b${abbr}\\b`, "i").test(q)) return { state: abbr.toUpperCase() };
  }
  return { state: null };
}

function extractBeds(q: string) {
  const minBedPatterns = [
    /(?:at least|minimum|min)\s+(\d)\s*(?:bedrooms|bedroom|beds|bed|br)/i,
    /(\d)\s*(?:bedrooms|bedroom|beds|bed|br)\s+or\s+more/i,
    /(\d)\+\s*(?:bedrooms|bedroom|beds|bed|br)/i,
    /(\d)\s*(?:bedrooms|bedroom|beds|bed|br)\+/i,
  ];

  const minMatch = firstMatch(q, minBedPatterns);
  if (minMatch) {
    return { beds: null, minBeds: parseInt(minMatch[1], 10), match: minMatch };
  }

  const exactMatch = q.match(/(\d)\s*(?:bedrooms|bedroom|beds|bed|br)/i);
  if (exactMatch) {
    return { beds: parseInt(exactMatch[1], 10), minBeds: null, match: exactMatch };
  }

  if (/\bstudio\b/i.test(q)) {
    return { beds: 0, minBeds: null, match: null };
  }

  return { beds: null, minBeds: null, match: null };
}

function extractBaths(q: string) {
  const minBathPatterns = [
    /(?:at least|minimum|min)\s+(\d)\s*(?:bathrooms|bathroom|baths|bath|ba)/i,
    /(\d)\s*(?:bathrooms|bathroom|baths|bath|ba)\s+or\s+more/i,
    /(\d)\+\s*(?:bathrooms|bathroom|baths|bath|ba)/i,
    /(\d)\s*(?:bathrooms|bathroom|baths|bath|ba)\+/i,
  ];

  const minMatch = firstMatch(q, minBathPatterns);
  if (minMatch) {
    return { baths: null, minBaths: parseInt(minMatch[1], 10), match: minMatch };
  }

  const exactMatch = q.match(/(\d)\s*(?:bathrooms|bathroom|baths|bath|ba)/i);
  if (exactMatch) {
    return { baths: parseInt(exactMatch[1], 10), minBaths: null, match: exactMatch };
  }

  return { baths: null, minBaths: null, match: null };
}

function extractSqft(q: string) {
  const maxPatterns = [
    /(?:smaller|less|under|below|no more|up to|max|maximum)\s*(?:than\s*)?\s*(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)/i,
    /(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)\s*(?:or less|max|maximum)/i,
  ];
  const minPatterns = [
    /(?:bigger|larger|over|above|more than|at least|min|minimum)\s*(?:than\s*)?\s*(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)/i,
    /(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)\s*(?:or more|minimum|\+)/i,
    /(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)/i,
  ];

  const maxMatch = firstMatch(q, maxPatterns);
  if (maxMatch) {
    return { minSqft: null, maxSqft: parseInt(maxMatch[1].replace(/,/g, ""), 10), match: maxMatch };
  }

  const minMatch = firstMatch(q, minPatterns);
  if (minMatch) {
    return { minSqft: parseInt(minMatch[1].replace(/,/g, ""), 10), maxSqft: null, match: minMatch };
  }

  return { minSqft: null, maxSqft: null, match: null };
}

const MAX_PRICE_PATTERNS = [
  /(?:under|below|less than|max|up to)\s*\$?([\d,]+)\s*(?:dollars|dollar)?/i,
  /\$?([\d,]+)\s*(?:dollars|dollar)?\s*(?:or less|max|maximum)/i,
  /budget.*?\$?([\d,]+)\s*(?:dollars|dollar)?/i,
];

function extractMaxPrice(q: string) {
  const match = firstMatch(q, MAX_PRICE_PATTERNS);
  return { maxPrice: match ? parseInt(match[1].replace(/,/g, ""), 10) : null };
}

function extractMinPrice(q: string) {
  const patterns = [
    /(?:over|above|more than|at least|min|minimum)\s*\$?([\d,]+)\s*(?:dollars|dollar)?/i,
    /\$?([\d,]+)\s*(?:dollars|dollar)?\s*(?:or more|minimum|\+)/i,
  ];
  const match = firstMatch(q, patterns);
  return {
    minPrice: match ? parseInt(match[1].replace(/,/g, ""), 10) : null,
    match,
  };
}

function extractAvailability(q: string, now: Date) {
  const patterns: { pattern: RegExp; resolve: (m: RegExpMatchArray) => string }[] = [
    {
      pattern: /available\s+(?:today|now|immediately)/i,
      resolve: () => toISODate(now),
    },
    {
      pattern: /available\s+this\s+month/i,
      resolve: () => endOfMonth(now.getFullYear(), now.getMonth()),
    },
    {
      pattern: /available\s+next\s+month/i,
      resolve: () => {
        const m = now.getMonth() + 1;
        const y = m > 11 ? now.getFullYear() + 1 : now.getFullYear();
        return endOfMonth(y, m % 12);
      },
    },
    {
      pattern: /available\s+(?:in|by)\s+(\w+)/i,
      resolve: (m) => {
        const monthIdx = MONTH_NAMES[m[1].toLowerCase()];
        if (monthIdx === undefined) return "";
        const y = monthIdx < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
        return endOfMonth(y, monthIdx);
      },
    },
  ];

  for (const { pattern, resolve } of patterns) {
    const match = q.match(pattern);
    if (match) {
      const resolved = resolve(match);
      if (resolved) return { availableBy: resolved, match };
      break;
    }
  }

  return { availableBy: null, match: null };
}

// ---------------------------------------------------------------------------
// Keyword extraction — strips already-parsed tokens and filler words,
// leaving only meaningful search terms.
// ---------------------------------------------------------------------------

const FILLER_WORDS = [
  "i need", "i want", "looking for", "find me", "show me", "search for",
  "apartments", "apartment", "in", "with", "a", "an", "the", "that",
  "has", "have", "near", "around", "available",
  "place", "home", "house", "houses", "room", "something", "somewhere",
  "cheap", "nice", "good", "great",
];

interface ConsumedTokens {
  city: string | null;
  state: string | null;
  bedMatch: RegExpMatchArray | null;
  bathMatch: RegExpMatchArray | null;
  sqftMatch: RegExpMatchArray | null;
  minPriceMatch: RegExpMatchArray | null;
  availMatch: RegExpMatchArray | null;
}

function extractKeywords(q: string, tokens: ConsumedTokens) {
  let remaining = q;

  if (tokens.city) remaining = remaining.replace(tokens.city, "");
  if (tokens.state) {
    remaining = remaining.replace(new RegExp(`\\b${tokens.state}\\b`, "gi"), "");
    const fullName = Object.entries(STATE_FULL_NAMES).find(([, abbr]) => abbr === tokens.state)?.[0];
    if (fullName) remaining = remaining.replace(new RegExp(`\\b${fullName}\\b`, "gi"), "");
  }
  if (tokens.bedMatch) remaining = remaining.replace(tokens.bedMatch[0], "");
  if (tokens.bathMatch) remaining = remaining.replace(tokens.bathMatch[0], "");
  if (tokens.sqftMatch) remaining = remaining.replace(tokens.sqftMatch[0], "");
  for (const pattern of MAX_PRICE_PATTERNS) {
    remaining = remaining.replace(pattern, "");
  }
  if (tokens.minPriceMatch) remaining = remaining.replace(tokens.minPriceMatch[0], "");
  if (tokens.availMatch) remaining = remaining.replace(tokens.availMatch[0], "");

  for (const filler of FILLER_WORDS) {
    remaining = remaining.replace(new RegExp(`\\b${filler}\\b`, "gi"), "");
  }

  let keywordMode: "and" | "or" = "or";
  if (/\band\b/.test(remaining)) {
    keywordMode = "and";
  } else if (/\bor\b/.test(remaining)) {
    keywordMode = "or";
  }

  remaining = remaining.replace(/\b(?:and|or)\b/gi, "");

  const keywords = remaining
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ""))
    .filter((w) => w.length > 2);

  return { keywords, keywordMode };
}

// ---------------------------------------------------------------------------
// Main parser — orchestrates field extractors and keyword extraction.
// ---------------------------------------------------------------------------

export function parseQuery(query: string, now: Date = new Date()): ParsedQuery {
  const q = query.toLowerCase().trim();

  const { city } = extractCity(q);
  const { state } = extractState(q);
  const { beds, minBeds, match: bedMatch } = extractBeds(q);
  const { baths, minBaths, match: bathMatch } = extractBaths(q);
  const { minSqft, maxSqft, match: sqftMatch } = extractSqft(q);

  // Strip sqft tokens before price extraction to avoid conflicts
  // (e.g. "under 700 sq ft" should not match as a price).
  const qForPrice = sqftMatch ? q.replace(sqftMatch[0], "") : q;

  const { maxPrice } = extractMaxPrice(qForPrice);
  const { minPrice, match: minPriceMatch } = extractMinPrice(qForPrice);
  const { availableBy, match: availMatch } = extractAvailability(q, now);

  const { keywords, keywordMode } = extractKeywords(q, {
    city, state, bedMatch, bathMatch, sqftMatch, minPriceMatch, availMatch,
  });

  return {
    city, state, beds, minBeds, baths, minBaths,
    maxPrice, minPrice, minSqft, maxSqft, availableBy,
    keywords, keywordMode,
  };
}
