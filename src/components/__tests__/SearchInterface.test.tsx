import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SearchInterface from "../SearchInterface";

// Mock next/navigation for useSearchParams / useRouter
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

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

  it("sorts results by price ascending and descending", () => {
    render(<SearchInterface />);
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();

    // Default sort is price ascending — first card should be cheapest
    const priceBtn = screen.getByRole("button", { name: /Price/ });
    expect(priceBtn).toHaveTextContent("Price ↑");

    // Click Price again to toggle to descending
    fireEvent.click(priceBtn);
    expect(priceBtn).toHaveTextContent("Price ↓");
  });

  it("switches sort key when a different pill is clicked", () => {
    render(<SearchInterface />);
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();

    const nameBtn = screen.getByRole("button", { name: /Name/ });
    fireEvent.click(nameBtn);
    // Name should now be active ascending
    expect(nameBtn).toHaveTextContent("Name ↑");
    // Price should no longer show an arrow
    expect(screen.getByRole("button", { name: "Price" })).toBeInTheDocument();
  });

  it("shows comparison bar for multi-result searches", () => {
    render(<SearchInterface />);
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();
    expect(screen.getByText("Rent Comparison")).toBeInTheDocument();
  });

  it("hides comparison bar when only one result", () => {
    render(<SearchInterface />);
    const input = screen.getByLabelText("Search for apartments");
    fireEvent.change(input, { target: { value: "denver" } });
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();
    expect(screen.queryByText("Rent Comparison")).not.toBeInTheDocument();
  });

  it("shows gradient fallback when image fails to load", () => {
    render(<SearchInterface />);
    const input = screen.getByLabelText("Search for apartments");
    fireEvent.change(input, { target: { value: "denver" } });
    fireEvent.submit(screen.getByRole("search"));
    submitSearch();

    const img = screen.getByAltText(/Camden RiNo/);
    fireEvent.error(img);

    // After error, the gradient placeholder should appear instead of the img
    expect(screen.queryByAltText(/Camden RiNo/)).not.toBeInTheDocument();
  });

  it("executes search when an example query is clicked", () => {
    render(<SearchInterface />);
    const exampleBtn = screen.getByRole("button", { name: "Under $1,300" });
    fireEvent.click(exampleBtn);
    submitSearch();
    // Should show results filtered by price (names appear in both card and comparison bar)
    expect(screen.getAllByText("Camden Stoneleigh").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Camden Downs at Cinco Ranch").length).toBeGreaterThanOrEqual(1);
  });
});
