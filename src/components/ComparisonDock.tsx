import { Listing } from "@/data/listings";

interface ComparisonDockProps {
  selectedListings: Listing[];
  onCompare: () => void;
  onClear: () => void;
}

export default function ComparisonDock({ selectedListings, onCompare, onClear }: ComparisonDockProps) {
  if (selectedListings.length < 2) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 animate-fade-in">
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-dark px-4 py-3 shadow-2xl">
          <span className="text-sm font-medium text-white/80">
            {selectedListings.length} properties selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white/70
                transition-colors hover:text-white hover:bg-white/10"
            >
              Clear
            </button>
            <button
              onClick={onCompare}
              className="shrink-0 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm
                transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
            >
              Compare Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
