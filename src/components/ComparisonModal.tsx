"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Listing } from "@/data/listings";

interface ComparisonModalProps {
  listings: Listing[];
  onClose: () => void;
}

export default function ComparisonModal({ listings, onClose }: ComparisonModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Simple focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const minRent = Math.min(...listings.map((l) => l.rent));
  const maxSqft = Math.max(...listings.map((l) => l.sqft));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Property comparison"
      ref={dialogRef}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-dark">
            Comparing {listings.length} Properties
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close comparison"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto p-6">
          <div className="inline-grid min-w-full" style={{ gridTemplateColumns: `8rem repeat(${listings.length}, minmax(12rem, 1fr))` }}>
            {/* Images row */}
            <Cell label>Property</Cell>
            {listings.map((l) => (
              <div key={l.id} className="p-2">
                <PropertyImage listing={l} />
                <p className="mt-2 text-sm font-semibold text-dark">{l.property_name}</p>
              </div>
            ))}

            {/* Location */}
            <Cell label>Location</Cell>
            {listings.map((l) => (
              <Cell key={l.id}>{l.city}, {l.state}</Cell>
            ))}

            {/* Rent */}
            <Cell label>Rent</Cell>
            {listings.map((l) => (
              <Cell key={l.id} highlight={l.rent === minRent}>
                ${l.rent.toLocaleString()}/mo
              </Cell>
            ))}

            {/* Beds / Baths */}
            <Cell label>Beds / Baths</Cell>
            {listings.map((l) => (
              <Cell key={l.id}>{l.beds} bed / {l.baths} bath</Cell>
            ))}

            {/* Sqft */}
            <Cell label>Size</Cell>
            {listings.map((l) => (
              <Cell key={l.id} highlight={l.sqft === maxSqft}>
                {l.sqft.toLocaleString()} sqft
              </Cell>
            ))}

            {/* Availability */}
            <Cell label>Available</Cell>
            {listings.map((l) => {
              const d = new Date(l.available + "T00:00:00");
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const isNow = d <= now;
              return (
                <Cell key={l.id}>
                  {isNow ? (
                    <span className="font-medium text-green-600">Available now</span>
                  ) : (
                    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  )}
                </Cell>
              );
            })}

            {/* Amenities */}
            <Cell label>Amenities</Cell>
            {listings.map((l) => (
              <div key={l.id} className="flex flex-col gap-1 p-3">
                {l.amenities.map((a) => (
                  <span key={a} className="w-fit rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal">
                    {a}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ children, label, highlight }: { children: React.ReactNode; label?: boolean; highlight?: boolean }) {
  return (
    <div
      className={`p-3 text-sm border-b border-gray-100 ${
        label ? "font-medium text-gray-500" : "text-gray-800"
      } ${highlight ? "font-semibold text-green-700 bg-green-50/50 rounded" : ""}`}
    >
      {children}
    </div>
  );
}

function PropertyImage({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative h-28 w-full overflow-hidden rounded-lg">
      {imgError ? (
        <div
          className="h-full w-full"
          style={{ background: "linear-gradient(135deg, #00BCD4, #F5A623)" }}
          aria-hidden="true"
        />
      ) : (
        <Image
          src={listing.image}
          alt={listing.property_name}
          fill
          sizes="200px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
