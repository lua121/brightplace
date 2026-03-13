import { Listing, listings } from "@/data/listings";

export interface ParsedQuery {
  city: string | null;
  state: string | null;
  beds: number | null;
  maxPrice: number | null;
  minPrice: number | null;
  minSqft: number | null;
  maxSqft: number | null;
  availableBy: string | null;
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

const MONTH_NAMES: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function endOfMonth(year: number, month: number): string {
  const d = new Date(year, month + 1, 0);
  return d.toISOString().split("T")[0];
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function parseQuery(query: string, now: Date = new Date()): ParsedQuery {
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

  // Extract sqft first (before price, to prevent "under 700 sq ft" matching as price)
  let minSqft: number | null = null;
  let maxSqft: number | null = null;
  const maxSqftPatterns = [
    /(?:smaller|less|under|below|no more|up to|max|maximum)\s*(?:than\s*)?\s*(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)/i,
    /(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)\s*(?:or less|max|maximum)/i,
  ];
  const minSqftPatterns = [
    /(?:bigger|larger|over|above|more than|at least|min|minimum)\s*(?:than\s*)?\s*(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)/i,
    /(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)\s*(?:or more|minimum|\+)/i,
    /(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet|sf)/i,
  ];
  let sqftMatch: RegExpMatchArray | null = null;
  for (const pattern of maxSqftPatterns) {
    const match = q.match(pattern);
    if (match) {
      maxSqft = parseInt(match[1].replace(/,/g, ""), 10);
      sqftMatch = match;
      break;
    }
  }
  if (!sqftMatch) {
    for (const pattern of minSqftPatterns) {
      const match = q.match(pattern);
      if (match) {
        minSqft = parseInt(match[1].replace(/,/g, ""), 10);
        sqftMatch = match;
        break;
      }
    }
  }

  // Strip sqft tokens before price extraction to avoid conflicts
  const qForPrice = sqftMatch ? q.replace(sqftMatch[0], "") : q;

  // Extract max price
  let maxPrice: number | null = null;
  const pricePatterns = [
    /(?:under|below|less than|max|up to)\s*\$?([\d,]+)/i,
    /\$?([\d,]+)\s*(?:or less|max|maximum)/i,
    /budget.*?\$?([\d,]+)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = qForPrice.match(pattern);
    if (match) {
      maxPrice = parseInt(match[1].replace(/,/g, ""), 10);
      break;
    }
  }

  // Extract min price
  let minPrice: number | null = null;
  const minPricePatterns = [
    /(?:over|above|more than|at least|min|minimum)\s*\$([\d,]+)/i,
    /\$([\d,]+)\s*(?:or more|minimum|\+)/i,
  ];
  let minPriceMatch: RegExpMatchArray | null = null;
  for (const pattern of minPricePatterns) {
    const match = qForPrice.match(pattern);
    if (match) {
      minPrice = parseInt(match[1].replace(/,/g, ""), 10);
      minPriceMatch = match;
      break;
    }
  }

  // Extract availability
  let availableBy: string | null = null;
  const availPatterns: { pattern: RegExp; resolve: (m: RegExpMatchArray) => string }[] = [
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
  let availMatch: RegExpMatchArray | null = null;
  for (const { pattern, resolve } of availPatterns) {
    const match = q.match(pattern);
    if (match) {
      const resolved = resolve(match);
      if (resolved) {
        availableBy = resolved;
        availMatch = match;
      }
      break;
    }
  }

  // Extract remaining keywords for amenity/feature matching
  // Remove already-parsed tokens
  let remaining = q;
  if (city) remaining = remaining.replace(city, "");
  if (state) {
    remaining = remaining.replace(new RegExp(`\\b${state}\\b`, "gi"), "");
    // Also strip the full state name if that's what matched
    const fullName = Object.entries(STATE_FULL_NAMES).find(([, abbr]) => abbr === state)?.[0];
    if (fullName) remaining = remaining.replace(new RegExp(`\\b${fullName}\\b`, "gi"), "");
  }
  if (bedMatch) remaining = remaining.replace(bedMatch[0], "");
  if (sqftMatch) remaining = remaining.replace(sqftMatch[0], "");
  for (const pattern of pricePatterns) {
    remaining = remaining.replace(pattern, "");
  }
  if (minPriceMatch) remaining = remaining.replace(minPriceMatch[0], "");
  if (availMatch) remaining = remaining.replace(availMatch[0], "");

  // Clean up common filler words
  const fillers = [
    "i need", "i want", "looking for", "find me", "show me", "search for",
    "apartments", "apartment", "in", "with", "and", "a", "an", "the", "that",
    "has", "have", "near", "around", "available",
  ];
  for (const filler of fillers) {
    remaining = remaining.replace(new RegExp(`\\b${filler}\\b`, "gi"), "");
  }

  const keywords = remaining
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ""))
    .filter((w) => w.length > 2);

  return { city, state, beds, maxPrice, minPrice, minSqft, maxSqft, availableBy, keywords };
}

export interface SearchResult {
  listings: Listing[];
  summary: string;
  parsed: ParsedQuery;
}

export function searchListings(query: string, now?: Date): SearchResult {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      listings: [...listings],
      summary: "Here are all available apartments.",
      parsed: { city: null, state: null, beds: null, maxPrice: null, minPrice: null, minSqft: null, maxSqft: null, availableBy: null, keywords: [] },
    };
  }

  const parsed = now ? parseQuery(trimmed, now) : parseQuery(trimmed);
  const { city, state, beds, maxPrice, minPrice, minSqft, maxSqft, availableBy, keywords } = parsed;

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
    if (minPrice !== null && listing.rent >= minPrice) score += 8;

    // Sqft match
    if (minSqft !== null && listing.sqft >= minSqft) score += 8;
    if (maxSqft !== null && listing.sqft <= maxSqft) score += 8;

    // Availability match
    if (availableBy && listing.available <= availableBy) score += 8;

    // Keyword matches against name and amenities
    for (const kw of keywords) {
      if (lowerName.includes(kw)) score += 3;
      if (amenityStr.includes(kw)) score += 3;
      if (lowerCity.includes(kw)) score += 2;
    }

    return { listing, score };
  });

  // Determine if we have any structured filters active
  const hasFilters = city || state || beds !== null || maxPrice !== null || minPrice !== null || minSqft !== null || maxSqft !== null || availableBy;

  // Check which keywords actually match at least one listing
  const unmatchedKeywords = keywords.filter((kw) =>
    !listings.some((l) => {
      const lName = l.property_name.toLowerCase();
      const lCity = l.city.toLowerCase();
      const lAmenities = l.amenities.join(" ").toLowerCase();
      return lName.includes(kw) || lCity.includes(kw) || lAmenities.includes(kw);
    })
  );

  // Filter: if structured filters exist, require all structural matches
  let filtered = scored;
  if (hasFilters || keywords.length > 0) {
    filtered = scored.filter((item) => {
      if (city && item.listing.city.toLowerCase() !== city) return false;
      if (state && item.listing.state !== state) return false;
      if (beds !== null && item.listing.beds !== beds) return false;
      if (maxPrice !== null && item.listing.rent > maxPrice) return false;
      if (minPrice !== null && item.listing.rent < minPrice) return false;
      if (minSqft !== null && item.listing.sqft < minSqft) return false;
      if (maxSqft !== null && item.listing.sqft > maxSqft) return false;
      if (availableBy && item.listing.available > availableBy) return false;
      // If any keyword matches nothing in the entire dataset, exclude all results
      if (unmatchedKeywords.length > 0) return false;
      // If keywords exist but none match this listing, exclude it
      if (keywords.length > 0 && !hasFilters) {
        const lName = item.listing.property_name.toLowerCase();
        const lCity = item.listing.city.toLowerCase();
        const lAmenities = item.listing.amenities.join(" ").toLowerCase();
        const hasKeywordMatch = keywords.some((kw) =>
          lName.includes(kw) || lCity.includes(kw) || lAmenities.includes(kw)
        );
        if (!hasKeywordMatch) return false;
      }
      return true;
    });
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

  if (parsed.minPrice !== null) {
    parts.push(`over $${parsed.minPrice.toLocaleString()}`);
  }

  if (parsed.minSqft !== null) {
    parts.push(`over ${parsed.minSqft.toLocaleString()} sqft`);
  }

  if (parsed.maxSqft !== null) {
    parts.push(`under ${parsed.maxSqft.toLocaleString()} sqft`);
  }

  if (parsed.availableBy) {
    parts.push(`available by ${parsed.availableBy}`);
  }

  return parts.join(" ") + ".";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
