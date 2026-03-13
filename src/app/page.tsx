import ErrorBoundary from "@/components/ErrorBoundary";
import SearchInterface from "@/components/SearchInterface";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <ErrorBoundary>
        <SearchInterface />
      </ErrorBoundary>
    </main>
  );
}
