"use client";

import { useState } from "react";
import Image from "next/image";
import { Listing } from "@/data/listings";

interface PropertyCardProps {
  listing: Listing;
  index: number;
  isSelected?: boolean;
  onToggleCompare?: (id: string) => void;
  compareDisabled?: boolean;
}

export default function PropertyCard({ listing, index, isSelected, onToggleCompare, compareDisabled }: PropertyCardProps) {
  const [imgError, setImgError] = useState(false);

  const availDate = new Date(listing.available + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isAvailableNow = availDate <= now;
  const availableDate = availDate.toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <div
      className="group rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-48 w-full overflow-hidden">
        {imgError ? (
          <div
            className="h-full w-full"
            style={{ background: "linear-gradient(135deg, #00BCD4, #F5A623)" }}
            aria-hidden="true"
          />
        ) : (
          <Image
            src={listing.image}
            alt={`${listing.property_name} in ${listing.city}, ${listing.state} — $${listing.rent.toLocaleString()}/mo`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
        {onToggleCompare && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCompare(listing.id); }}
            disabled={compareDisabled && !isSelected}
            className={`absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-sm
              transition-all duration-200 ${
              isSelected
                ? "bg-primary text-white shadow-md"
                : compareDisabled
                  ? "bg-white/70 text-gray-300 cursor-not-allowed"
                  : "bg-white/80 text-gray-400 hover:bg-white hover:text-primary hover:shadow-md"
            }`}
            aria-label={isSelected ? `Remove ${listing.property_name} from comparison` : `Add ${listing.property_name} to comparison`}
            title={compareDisabled && !isSelected ? "Maximum 4 properties" : undefined}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {isSelected ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              )}
            </svg>
          </button>
        )}
        <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-dark backdrop-blur-sm">
          ${listing.rent.toLocaleString()}/mo
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-dark">{listing.property_name}</h3>
        <p className="text-sm text-gray-500">
          {listing.city}, {listing.state}
        </p>

        <div className="mt-3 flex gap-4 text-sm text-gray-600">
          <span>{listing.beds} Bed</span>
          <span className="text-gray-300" aria-hidden="true">|</span>
          <span>{listing.baths} Bath</span>
          <span className="text-gray-300" aria-hidden="true">|</span>
          <span>{listing.sqft.toLocaleString()} sqft</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-sm">
          {isAvailableNow ? (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
              <span className="text-green-600 font-medium">Available now</span>
            </>
          ) : (
            <span className="text-gray-500">Available {availableDate}</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs text-teal font-medium"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
