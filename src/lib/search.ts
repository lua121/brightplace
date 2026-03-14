import { Listing, listings } from "@/data/listings";
import { ParsedQuery, EMPTY_PARSED, STATE_DISPLAY_NAMES, parseQuery } from "./parse-query";

export type { ParsedQuery };
export { parseQuery };

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
      parsed: EMPTY_PARSED,
    };
  }

  let parsed: ParsedQuery;
  try {
    parsed = now ? parseQuery(trimmed, now) : parseQuery(trimmed);
  } catch {
    // If the parser throws (e.g. malformed regex from unusual input),
    // fall back gracefully instead of crashing the UI.
    return {
      listings: [],
      summary: "Something went wrong parsing your search. Try rephrasing your query.",
      parsed: EMPTY_PARSED,
    };
  }

  const { city, state, beds, minBeds, baths, minBaths, maxPrice, minPrice, minSqft, maxSqft, availableBy, keywords, keywordMode } = parsed;

  // Score each listing
  const scored = listings.map((listing) => {
    let score = 0;
    const lowerCity = listing.city.toLowerCase();
    const lowerName = listing.property_name.toLowerCase();
    const amenityStr = listing.amenities.join(" ").toLowerCase();

    if (city && lowerCity === city) score += 10;
    if (state && listing.state === state) score += 5;
    if (beds !== null && listing.beds === beds) score += 8;
    if (minBeds !== null && listing.beds >= minBeds) score += 8;
    if (baths !== null && listing.baths === baths) score += 8;
    if (minBaths !== null && listing.baths >= minBaths) score += 8;
    if (maxPrice !== null && listing.rent <= maxPrice) score += 8;
    if (minPrice !== null && listing.rent >= minPrice) score += 8;
    if (minSqft !== null && listing.sqft >= minSqft) score += 8;
    if (maxSqft !== null && listing.sqft <= maxSqft) score += 8;
    if (availableBy && listing.available <= availableBy) score += 8;

    for (const kw of keywords) {
      if (lowerName.includes(kw)) score += 3;
      if (amenityStr.includes(kw)) score += 3;
      if (lowerCity.includes(kw)) score += 2;
    }

    return { listing, score };
  });

  const hasFilters = city || state || beds !== null || minBeds !== null || baths !== null || minBaths !== null || maxPrice !== null || minPrice !== null || minSqft !== null || maxSqft !== null || availableBy;

  const matchesKw = (kw: string, l: Listing) => {
    const lName = l.property_name.toLowerCase();
    const lCity = l.city.toLowerCase();
    const lAmenities = l.amenities.join(" ").toLowerCase();
    return lName.includes(kw) || lCity.includes(kw) || lAmenities.includes(kw);
  };

  const recognizedKeywords = keywords.filter((kw) => listings.some((l) => matchesKw(kw, l)));

  let filtered = scored;
  if (hasFilters || keywords.length > 0) {
    filtered = scored.filter((item) => {
      if (city && item.listing.city.toLowerCase() !== city) return false;
      if (state && item.listing.state !== state) return false;
      if (beds !== null && item.listing.beds !== beds) return false;
      if (minBeds !== null && item.listing.beds < minBeds) return false;
      if (baths !== null && item.listing.baths !== baths) return false;
      if (minBaths !== null && item.listing.baths < minBaths) return false;
      if (maxPrice !== null && item.listing.rent > maxPrice) return false;
      if (minPrice !== null && item.listing.rent < minPrice) return false;
      if (minSqft !== null && item.listing.sqft < minSqft) return false;
      if (maxSqft !== null && item.listing.sqft > maxSqft) return false;
      if (availableBy && item.listing.available > availableBy) return false;

      // Keyword filtering — only hard-filter when no structural filters are
      // active. When structural filters are present, keywords act as soft
      // scoring boosters so that queries like "1BR in Denver with modern
      // finishes" still return Denver results even if "finishes" doesn't
      // match any amenity.
      if (keywords.length > 0 && !hasFilters) {
        if (keywordMode === "and") {
          if (!keywords.every((kw) => matchesKw(kw, item.listing))) return false;
        } else {
          if (recognizedKeywords.length === 0) return false;
          if (!recognizedKeywords.some((kw) => matchesKw(kw, item.listing))) return false;
        }
      }

      return true;
    });
  }

  filtered.sort((a, b) => b.score - a.score);
  const results = filtered.map((item) => item.listing);
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
    parts.push(`in ${parsed.city.charAt(0).toUpperCase() + parsed.city.slice(1)}`);
  } else if (parsed.state) {
    parts.push(`in ${STATE_DISPLAY_NAMES[parsed.state] ?? parsed.state}`);
  }

  if (parsed.beds !== null) {
    parts.push(`with ${parsed.beds} bedroom${parsed.beds !== 1 ? "s" : ""}`);
  } else if (parsed.minBeds !== null) {
    parts.push(`with ${parsed.minBeds}+ bedrooms`);
  }

  if (parsed.baths !== null) {
    parts.push(`with ${parsed.baths} bathroom${parsed.baths !== 1 ? "s" : ""}`);
  } else if (parsed.minBaths !== null) {
    parts.push(`with ${parsed.minBaths}+ bathrooms`);
  }

  if (parsed.maxPrice !== null) parts.push(`under $${parsed.maxPrice.toLocaleString()}`);
  if (parsed.minPrice !== null) parts.push(`over $${parsed.minPrice.toLocaleString()}`);
  if (parsed.minSqft !== null) parts.push(`over ${parsed.minSqft.toLocaleString()} sqft`);
  if (parsed.maxSqft !== null) parts.push(`under ${parsed.maxSqft.toLocaleString()} sqft`);
  if (parsed.availableBy) parts.push(`available by ${parsed.availableBy}`);

  return parts.join(" ") + ".";
}
