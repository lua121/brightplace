import { describe, it, expect } from "vitest";
import { parseQuery, searchListings } from "../search";

describe("parseQuery", () => {
  it("extracts city", () => {
    const result = parseQuery("apartments in denver");
    expect(result.city).toBe("denver");
  });

  it("extracts state full name", () => {
    const result = parseQuery("apartments in texas");
    expect(result.state).toBe("TX");
  });

  it("extracts state abbreviation", () => {
    const result = parseQuery("apartments in tx");
    expect(result.state).toBe("TX");
  });

  it("extracts bed count", () => {
    const result = parseQuery("2 bedroom apartment");
    expect(result.beds).toBe(2);
  });

  it("extracts max price with under", () => {
    const result = parseQuery("under $1500");
    expect(result.maxPrice).toBe(1500);
  });

  it("extracts max price with comma formatting", () => {
    const result = parseQuery("under $1,500");
    expect(result.maxPrice).toBe(1500);
  });

  it("extracts keywords", () => {
    const result = parseQuery("pool rooftop");
    expect(result.keywords).toEqual(expect.arrayContaining(["pool", "rooftop"]));
  });

  it("handles combined query", () => {
    const result = parseQuery("1br in denver under $1500");
    expect(result.city).toBe("denver");
    expect(result.beds).toBe(1);
    expect(result.maxPrice).toBe(1500);
  });

  it("extracts minSqft from 'bigger than X sqft'", () => {
    const result = parseQuery("bigger than 500 sqft");
    expect(result.minSqft).toBe(500);
  });

  it("extracts minSqft from 'over X sq ft'", () => {
    const result = parseQuery("over 700 sq ft");
    expect(result.minSqft).toBe(700);
  });

  it("extracts minSqft from 'at least X square feet'", () => {
    const result = parseQuery("at least 600 square feet");
    expect(result.minSqft).toBe(600);
  });

  it("minSqft is null for queries without size", () => {
    const result = parseQuery("apartments in denver");
    expect(result.minSqft).toBeNull();
  });

  it("extracts maxSqft from 'smaller than X sqft'", () => {
    const result = parseQuery("smaller than 800 sqft");
    expect(result.maxSqft).toBe(800);
    expect(result.minSqft).toBeNull();
  });

  it("extracts maxSqft from 'under X sq ft'", () => {
    const result = parseQuery("under 700 sq ft");
    expect(result.maxSqft).toBe(700);
  });

  it("extracts maxSqft from 'X sqft or less'", () => {
    const result = parseQuery("600 sqft or less");
    expect(result.maxSqft).toBe(600);
  });

  it("extracts max price from 'under X dollars'", () => {
    const result = parseQuery("under 1300 dollars");
    expect(result.maxPrice).toBe(1300);
  });

  it("extracts minPrice from 'over $X'", () => {
    const result = parseQuery("over $1200");
    expect(result.minPrice).toBe(1200);
  });

  it("extracts minPrice from 'at least $X'", () => {
    const result = parseQuery("at least $1000");
    expect(result.minPrice).toBe(1000);
  });

  it("extracts minPrice from '$X or more'", () => {
    const result = parseQuery("$1500 or more");
    expect(result.minPrice).toBe(1500);
  });

  it("extracts availableBy for 'available today'", () => {
    const now = new Date("2026-03-13");
    const result = parseQuery("available today", now);
    expect(result.availableBy).toBe("2026-03-13");
  });

  it("extracts availableBy for 'available now'", () => {
    const now = new Date("2026-03-13");
    const result = parseQuery("available now", now);
    expect(result.availableBy).toBe("2026-03-13");
  });

  it("extracts availableBy for 'available next month'", () => {
    const now = new Date("2026-03-13");
    const result = parseQuery("available next month", now);
    expect(result.availableBy).toBe("2026-04-30");
  });

  it("extracts availableBy for 'available in april'", () => {
    const now = new Date("2026-03-13");
    const result = parseQuery("available in april", now);
    expect(result.availableBy).toBe("2026-04-30");
  });

  it("extracts availableBy for 'available by june'", () => {
    const now = new Date("2026-03-13");
    const result = parseQuery("available by june", now);
    expect(result.availableBy).toBe("2026-06-30");
  });

  it("extracts minBeds from '1br or more'", () => {
    const result = parseQuery("1br or more in denver");
    expect(result.minBeds).toBe(1);
    expect(result.beds).toBeNull();
    expect(result.city).toBe("denver");
  });

  it("extracts minBeds from 'at least 2 bedrooms'", () => {
    const result = parseQuery("at least 2 bedrooms");
    expect(result.minBeds).toBe(2);
    expect(result.beds).toBeNull();
  });

  it("extracts minBeds from '1+ beds'", () => {
    const result = parseQuery("1+ beds");
    expect(result.minBeds).toBe(1);
    expect(result.beds).toBeNull();
  });

  it("keeps exact beds when no >= pattern", () => {
    const result = parseQuery("1BR in Denver");
    expect(result.beds).toBe(1);
    expect(result.minBeds).toBeNull();
  });

  it("detects keywordMode 'and'", () => {
    const result = parseQuery("pool and rooftop");
    expect(result.keywordMode).toBe("and");
    expect(result.keywords).toEqual(expect.arrayContaining(["pool", "rooftop"]));
  });

  it("detects keywordMode 'or'", () => {
    const result = parseQuery("pool or patio");
    expect(result.keywordMode).toBe("or");
    expect(result.keywords).toEqual(expect.arrayContaining(["pool", "patio"]));
  });

  it("defaults keywordMode to 'or'", () => {
    const result = parseQuery("pool rooftop");
    expect(result.keywordMode).toBe("or");
  });

  it("filters generic housing words from keywords", () => {
    const result = parseQuery("a place in texas");
    expect(result.state).toBe("TX");
    expect(result.keywords).toEqual([]);
  });

  it("extracts beds from '2 bedrooms in denver' (plural regression)", () => {
    const result = parseQuery("2 bedrooms in denver");
    expect(result.beds).toBe(2);
    expect(result.city).toBe("denver");
    expect(result.keywords).toEqual([]);
  });

  it("extracts exact baths from '1 bath apartment'", () => {
    const result = parseQuery("1 bath apartment");
    expect(result.baths).toBe(1);
    expect(result.minBaths).toBeNull();
  });

  it("extracts minBaths from 'at least 2 bathrooms'", () => {
    const result = parseQuery("at least 2 bathrooms");
    expect(result.minBaths).toBe(2);
    expect(result.baths).toBeNull();
  });

  it("extracts minBaths from '1+ baths'", () => {
    const result = parseQuery("1+ baths");
    expect(result.minBaths).toBe(1);
    expect(result.baths).toBeNull();
  });

  it("returns nulls for empty query", () => {
    const result = parseQuery("");
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.beds).toBeNull();
    expect(result.minBeds).toBeNull();
    expect(result.baths).toBeNull();
    expect(result.minBaths).toBeNull();
    expect(result.maxPrice).toBeNull();
    expect(result.minPrice).toBeNull();
    expect(result.minSqft).toBeNull();
    expect(result.maxSqft).toBeNull();
    expect(result.availableBy).toBeNull();
    expect(result.keywords).toEqual([]);
    expect(result.keywordMode).toBe("or");
  });
});

describe("searchListings", () => {
  it("returns all 6 listings for empty query", () => {
    const result = searchListings("");
    expect(result.listings).toHaveLength(6);
  });

  it("filters by city", () => {
    const result = searchListings("denver");
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].city).toBe("Denver");
  });

  it("filters by state", () => {
    const result = searchListings("tx");
    expect(result.listings).toHaveLength(3);
    result.listings.forEach((l) => expect(l.state).toBe("TX"));
  });

  it("filters by price", () => {
    const result = searchListings("under $1300");
    expect(result.listings.length).toBeGreaterThanOrEqual(1);
    result.listings.forEach((l) => expect(l.rent).toBeLessThanOrEqual(1300));
  });

  it("matches keyword/amenity", () => {
    const result = searchListings("pool");
    expect(result.listings.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for no-match query", () => {
    const result = searchListings("xyz nonexistent city 99999");
    expect(result.listings).toHaveLength(0);
  });

  it("treats unrecognized keywords as soft when structural filters are present", () => {
    const now = new Date("2026-03-13");
    // "brazil" is unrecognized but structural filters (sqft, availability) still apply
    const result = searchListings("bigger than 800 sq ft and available today in brazil", now);
    expect(result.listings.length).toBeGreaterThan(0);
    result.listings.forEach((l) => {
      expect(l.sqft).toBeGreaterThanOrEqual(800);
      expect(l.available <= "2026-03-13").toBe(true);
    });
  });

  it("filters by sqft", () => {
    const result = searchListings("apartments bigger than 700 sqft");
    expect(result.listings).toHaveLength(3);
    result.listings.forEach((l) => expect(l.sqft).toBeGreaterThanOrEqual(700));
    const names = result.listings.map((l) => l.property_name);
    expect(names).toContain("Camden Downtown");
    expect(names).toContain("Camden Legacy");
    expect(names).toContain("Camden Downs at Cinco Ranch");
  });

  it("filters by sqft combined with other filters", () => {
    const result = searchListings("apartments in texas bigger than 800 sqft");
    expect(result.listings).toHaveLength(2);
    result.listings.forEach((l) => {
      expect(l.state).toBe("TX");
      expect(l.sqft).toBeGreaterThanOrEqual(800);
    });
  });

  it("filters by maxSqft", () => {
    const result = searchListings("apartments under 700 sqft");
    result.listings.forEach((l) => expect(l.sqft).toBeLessThanOrEqual(700));
    const names = result.listings.map((l) => l.property_name);
    expect(names).toContain("Camden Stoneleigh");
    expect(names).toContain("Camden RiNo");
    expect(names).toContain("Camden Phipps");
  });

  it("filters by minPrice", () => {
    const result = searchListings("apartments over $1500");
    result.listings.forEach((l) => expect(l.rent).toBeGreaterThanOrEqual(1500));
    const names = result.listings.map((l) => l.property_name);
    expect(names).toContain("Camden Downtown");
    expect(names).toContain("Camden Legacy");
  });

  it("filters by availability — available today excludes future listings", () => {
    const now = new Date("2026-03-13");
    // 5 listings available 2026-03-11, 1 available 2026-05-22
    const result = searchListings("available today", now);
    expect(result.listings).toHaveLength(5);
    result.listings.forEach((l) => expect(l.available <= "2026-03-13").toBe(true));
  });

  it("filters by availability — available next month includes all before end of April", () => {
    const now = new Date("2026-03-13");
    // End of April = 2026-04-30; Camden Downs (2026-05-22) excluded
    const result = searchListings("available next month", now);
    expect(result.listings).toHaveLength(5);
  });

  it("filters by availability — available in june includes all", () => {
    const now = new Date("2026-03-13");
    const result = searchListings("available in june", now);
    expect(result.listings).toHaveLength(6);
  });

  it("combines availability with other filters", () => {
    const now = new Date("2026-03-13");
    const result = searchListings("apartments in texas available today", now);
    expect(result.listings).toHaveLength(2);
    result.listings.forEach((l) => {
      expect(l.state).toBe("TX");
      expect(l.available <= "2026-03-13").toBe(true);
    });
  });

  it("sorts by score descending", () => {
    const result = searchListings("houston pool");
    if (result.listings.length > 1) {
      expect(result.listings[0].city).toBe("Houston");
    }
  });

  it("minBeds filters with >=", () => {
    const result = searchListings("1br or more");
    expect(result.listings).toHaveLength(6);
  });

  it("keyword AND requires all keywords match", () => {
    const result = searchListings("cabinets and pool");
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].property_name).toBe("Camden Legacy");
  });

  it("keyword OR matches any keyword", () => {
    const result = searchListings("pool or patio");
    expect(result.listings).toHaveLength(3);
  });

  it("keyword OR ignores unrecognized keywords", () => {
    const result = searchListings("pool or xyznonexistent");
    expect(result.listings).toHaveLength(2);
  });

  it("filters by exact baths — '1 bath' returns all (all have 1 bath)", () => {
    const result = searchListings("1 bath");
    expect(result.listings).toHaveLength(6);
  });

  it("filters by exact baths — '2 baths' returns 0 (none have 2 baths)", () => {
    const result = searchListings("2 baths");
    expect(result.listings).toHaveLength(0);
  });

  it("filters by price with 'dollars' word", () => {
    const result = searchListings("1BR in texas under 1300 dollars");
    expect(result.listings.length).toBeGreaterThanOrEqual(1);
    result.listings.forEach((l) => {
      expect(l.state).toBe("TX");
      expect(l.rent).toBeLessThanOrEqual(1300);
    });
  });

  it("filters by bed + bath + state combined", () => {
    const result = searchListings("1 bed 1 bath in texas");
    expect(result.listings).toHaveLength(3);
    result.listings.forEach((l) => expect(l.state).toBe("TX"));
  });

  it("handles the spec example: '1BR in Denver under $1,500 with modern finishes'", () => {
    const result = searchListings("I need a 1BR in Denver under $1,500 with modern finishes");
    // Should return Camden RiNo (Denver, 1BR, $1,389) — keywords are soft
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].property_name).toBe("Camden RiNo");
    expect(result.listings[0].city).toBe("Denver");
    expect(result.listings[0].beds).toBe(1);
    expect(result.listings[0].rent).toBeLessThanOrEqual(1500);
  });

  it("returns empty for keyword-only query with no matches", () => {
    const result = searchListings("xyz nonexistent");
    expect(result.listings).toHaveLength(0);
  });

  // --- Edge cases ---

  it("handles XSS-like input without crashing", () => {
    const result = searchListings('<script>alert("xss")</script>');
    expect(result.listings).toHaveLength(0);
    expect(result.summary).toBe("No apartments match your search. Try adjusting your criteria.");
  });

  it("handles HTML injection in query", () => {
    const result = searchListings('<img src=x onerror=alert(1)> denver');
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].city).toBe("Denver");
  });

  it("handles special characters without crashing", () => {
    const inputs = [
      "apartments (in) denver",
      "under $1,500 && pool",
      "denver | austin",
      "1br; drop table;",
      "pool \\n rooftop",
      '{"city": "denver"}',
      "apartments in denver!!!",
    ];
    for (const input of inputs) {
      expect(() => searchListings(input)).not.toThrow();
    }
  });

  it("handles very long query without crashing", () => {
    const longQuery = "apartments in denver ".repeat(200);
    expect(() => searchListings(longQuery)).not.toThrow();
    const result = searchListings(longQuery);
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].city).toBe("Denver");
  });

  it("handles empty and whitespace-only queries", () => {
    expect(searchListings("").listings).toHaveLength(6);
    expect(searchListings("   ").listings).toHaveLength(6);
    expect(searchListings("\t\n").listings).toHaveLength(6);
  });

  it("handles regex metacharacters in query without crashing", () => {
    const inputs = ["[pool]", "pool.*rooftop", "den(ver", "austin+", "^houston$"];
    for (const input of inputs) {
      expect(() => searchListings(input)).not.toThrow();
    }
  });
});
