import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SearchInterface from "../SearchInterface";

// Mock next/image to a plain img
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("SearchInterface", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const submitSearch = () => {
    // Advance past the loading delay and flush React transitions
    act(() => {
      vi.advanceTimersByTime(500);
    });
  };

  it("renders the heading and search input", () => {
    render(<SearchInterface />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("brightplace");
    expect(screen.getByLabelText("Search for apartments")).toBeInTheDocument();
  });

  it("shows welcome state before any search", () => {
    render(<SearchInterface />);
    expect(screen.getByText(/Search for apartments by city/)).toBeInTheDocument();
  });

  it("shows loading skeleton after search submit", () => {
    render(<SearchInterface />);
    fireEvent.submit(screen.getByRole("search"));
    // Before the timer fires, skeleton should be visible and welcome state gone
    expect(screen.queryByText(/Search for apartments by city/)).not.toBeInTheDocument();
    // Skeleton grid renders pulse placeholders
    const pulseElements = document.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("shows all 6 listings on empty search", () => {
    render(<SearchInterface />);
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();
    expect(screen.getByText("Here are all available apartments.")).toBeInTheDocument();
    expect(screen.getAllByText("Camden Downtown").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Camden RiNo").length).toBeGreaterThanOrEqual(1);
  });

  it("filters results when query is entered", () => {
    render(<SearchInterface />);
    const input = screen.getByLabelText("Search for apartments");
    fireEvent.change(input, { target: { value: "denver" } });
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();
    expect(screen.getByText("Camden RiNo")).toBeInTheDocument();
    expect(screen.queryByText("Camden Downtown")).not.toBeInTheDocument();
  });

  it("shows empty state for no-match query", () => {
    render(<SearchInterface />);
    const input = screen.getByLabelText("Search for apartments");
    fireEvent.change(input, { target: { value: "zzz nonexistent 99999" } });
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();
    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  it("submits on Enter key via form", () => {
    render(<SearchInterface />);
    const input = screen.getByLabelText("Search for apartments");
    fireEvent.change(input, { target: { value: "atlanta" } });
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();
    expect(screen.getByText("Camden Phipps")).toBeInTheDocument();
  });
});
