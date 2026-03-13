import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import SearchInterface from "@/components/SearchInterface";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <ErrorBoundary>
        <Suspense>
          <SearchInterface />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
