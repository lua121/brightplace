interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export default function SearchBar({ query, onQueryChange, onSearch, isLoading }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mb-8 flex max-w-2xl gap-2" role="search">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Search for apartments"
        placeholder='Try "1BR in Denver under $1,500" or "apartments in Texas"'
        className="flex-1 rounded-full border border-gray-300 bg-white px-5 py-3 text-dark
          shadow-sm transition-shadow duration-200
          placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-full bg-primary px-6 py-3 font-medium text-white shadow-sm
          transition-colors duration-200 hover:bg-primary/90 active:bg-primary/80
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Search
      </button>
    </form>
  );
}
