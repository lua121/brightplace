import { Listing } from "@/data/listings";

interface ComparisonBarProps {
  listings: Listing[];
}

const MAX_BARS = 6;

export default function ComparisonBar({ listings }: ComparisonBarProps) {
  if (listings.length < 2) return null;

  const visible = listings.slice(0, MAX_BARS);
  const hiddenCount = listings.length - visible.length;
  const maxRent = Math.max(...listings.map((l) => l.rent));

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-600">Rent Comparison</h3>
      <div className="space-y-2">
        {visible.map((listing) => {
          const pct = (listing.rent / maxRent) * 100;
          return (
            <div key={listing.id} className="flex items-center gap-3">
              <span
                className="w-28 shrink-0 truncate text-xs text-gray-600 sm:w-44"
                title={listing.property_name}
              >
                {listing.property_name}
              </span>
              <div className="relative h-5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #00BCD4, #F5A623)",
                  }}
                />
              </div>
              <span className="w-20 text-right text-xs font-medium text-gray-700">
                ${listing.rent.toLocaleString()}/mo
              </span>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <p className="pt-1 text-xs text-gray-400">
            +{hiddenCount} more not shown
          </p>
        )}
      </div>
    </div>
  );
}
