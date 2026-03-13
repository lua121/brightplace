export type SortKey = "price" | "size" | "name";
export type SortDir = "asc" | "desc";

interface SortBarProps {
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

const options: { key: SortKey; label: string }[] = [
  { key: "price", label: "Price" },
  { key: "size", label: "Size" },
  { key: "name", label: "Name" },
];

export default function SortBar({ sortKey, sortDir, onSort }: SortBarProps) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-sm text-gray-500">Sort by:</span>
      {options.map(({ key, label }) => {
        const active = sortKey === key;
        return (
          <button
            key={key}
            onClick={() => onSort(key)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? "bg-teal text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label} {active && (sortDir === "asc" ? "\u2191" : "\u2193")}
          </button>
        );
      })}
    </div>
  );
}
