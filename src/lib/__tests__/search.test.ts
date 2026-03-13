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

  it("returns nulls for empty query", () => {
    const result = parseQuery("");
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.beds).toBeNull();
    expect(result.maxPrice).toBeNull();
    expect(result.minPrice).toBeNull();
    expect(result.minSqft).toBeNull();
    expect(result.maxSqft).toBeNull();
    expect(result.availableBy).toBeNull();
    expect(result.keywords).toEqual([]);
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

  it("returns empty when unrecognized location is combined with valid filters", () => {
    const now = new Date("2026-03-13");
    const result = searchListings("bigger than 800 sq ft and available today in brazil", now);
    expect(result.listings).toHaveLength(0);
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
});
