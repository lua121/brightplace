"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { searchListings, SearchResult } from "@/lib/search";
import PropertyCard from "./PropertyCard";
import SearchBar from "./SearchBar";
import SkeletonGrid from "./SkeletonGrid";
import SortBar, { SortKey, SortDir } from "./SortBar";
import ComparisonBar from "./ComparisonBar";

const EXAMPLE_QUERIES = [
  "1BR in Denver under $1,500",
  "Apartments in Texas",
  "Pool with a view",
  "Under $1,300",
];

export default function SearchInterface() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeSearch = useCallback((searchQuery: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHasSearched(true);
    setIsLoading(true);
    // Brief delay so the skeleton is visible — in production this would be
    // the real network round-trip to an API.
    timerRef.current = setTimeout(() => {
      setResult(searchListings(searchQuery));
      setIsLoading(false);
    }, 400);
  }, []);

  const handleSearch = useCallback(() => {
    executeSearch(query);
  }, [query, executeSearch]);

  const handleExampleClick = useCallback((example: string) => {
    setQuery(example);
    executeSearch(example);
  }, [executeSearch]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedListings = useMemo(() => {
    if (!result) return [];
    const items = [...result.listings];
    const dir = sortDir === "asc" ? 1 : -1;
    items.sort((a, b) => {
      if (sortKey === "price") return (a.rent - b.rent) * dir;
      if (sortKey === "size") return (a.sqft - b.sqft) * dir;
      return a.property_name.localeCompare(b.property_name) * dir;
    });
    return items;
  }, [result, sortKey, sortDir]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-dark sm:text-4xl">
          <span className="text-primary">bright</span>place
        </h1>
        <p className="mt-2 text-gray-500">
          Tell us what you&apos;re looking for — we&apos;ll find your next home.
        </p>
      </div>

      <SearchBar query={query} onQueryChange={setQuery} onSearch={handleSearch} isLoading={isLoading} />

      {/* Welcome state */}
      {!hasSearched && (
        <div className="mt-16 text-center text-gray-400">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg aria-hidden="true" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-lg">Search for apartments by city, price, beds, or amenities.</p>
          <p className="mt-2 text-sm">Try one of these:</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-600
                  shadow-sm transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-md"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && <SkeletonGrid />}

      {/* Results */}
      {!isLoading && hasSearched && result && (
        <div role="status" aria-live="polite">
          {/* Conversational summary */}
          <div className="mb-6 rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-600">{result.summary}</p>
          </div>

          {sortedListings.length > 0 ? (
            <>
              <SortBar sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <ComparisonBar listings={sortedListings} />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedListings.map((listing, i) => (
                  <PropertyCard key={listing.id} listing={listing} index={i} />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-12 text-center text-gray-400">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg aria-hidden="true" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-500">No matches found</p>
              <p className="mt-1 text-sm">Try a different search:</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {EXAMPLE_QUERIES.map((example) => (
                  <button
                    key={example}
                    onClick={() => handleExampleClick(example)}
                    className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-600
                      shadow-sm transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-md"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
