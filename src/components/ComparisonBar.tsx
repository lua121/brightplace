import { Listing } from "@/data/listings";

interface ComparisonBarProps {
  listings: Listing[];
}

export default function ComparisonBar({ listings }: ComparisonBarProps) {
  if (listings.length < 2) return null;

  const maxRent = Math.max(...listings.map((l) => l.rent));

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-600">Rent Comparison</h3>
      <div className="space-y-2">
        {listings.map((listing) => {
          const pct = (listing.rent / maxRent) * 100;
          return (
            <div key={listing.id} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-xs text-gray-600">
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
      </div>
    </div>
  );
}
