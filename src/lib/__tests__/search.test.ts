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

  it("returns nulls for empty query", () => {
    const result = parseQuery("");
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.beds).toBeNull();
    expect(result.maxPrice).toBeNull();
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

  it("sorts by score descending", () => {
    const result = searchListings("houston pool");
    if (result.listings.length > 1) {
      expect(result.listings[0].city).toBe("Houston");
    }
  });
});
