"use client";

import { useState } from "react";
import Image from "next/image";
import { Listing } from "@/data/listings";

interface PropertyCardProps {
  listing: Listing;
  index: number;
}

export default function PropertyCard({ listing, index }: PropertyCardProps) {
  const [imgError, setImgError] = useState(false);

  const availableDate = new Date(listing.available + "T00:00:00").toLocaleDateString(
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

        <div className="mt-2 text-sm text-gray-500">
          Available {availableDate}
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
