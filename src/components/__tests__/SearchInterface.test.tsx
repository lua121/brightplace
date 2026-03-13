import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchInterface from "../SearchInterface";

// Mock next/image to a plain img
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("SearchInterface", () => {
  it("renders the heading and search input", () => {
    render(<SearchInterface />);
    expect(screen.getByText("place")).toBeInTheDocument();
    expect(screen.getByLabelText("Search for apartments")).toBeInTheDocument();
  });

  it("shows welcome state before any search", () => {
    render(<SearchInterface />);
    expect(screen.getByText(/Search for apartments by city/)).toBeInTheDocument();
  });

  it("shows all 6 listings on empty search", () => {
    render(<SearchInterface />);
    fireEvent.click(screen.getByText("Search"));
    expect(screen.getByText("Here are all available apartments.")).toBeInTheDocument();
    expect(screen.getAllByText("Camden Downtown").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Camden RiNo").length).toBeGreaterThanOrEqual(1);
  });

  it("filters results when query is entered", () => {
    render(<SearchInterface />);
    const input = screen.getByLabelText("Search for apartments");
    fireEvent.change(input, { target: { value: "denver" } });
    fireEvent.click(screen.getByText("Search"));
    expect(screen.getByText("Camden RiNo")).toBeInTheDocument();
    expect(screen.queryByText("Camden Downtown")).not.toBeInTheDocument();
  });

  it("shows empty state for no-match query", () => {
    render(<SearchInterface />);
    const input = screen.getByLabelText("Search for apartments");
    fireEvent.change(input, { target: { value: "zzz nonexistent 99999" } });
    fireEvent.click(screen.getByText("Search"));
    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  it("submits on Enter key", () => {
    render(<SearchInterface />);
    const input = screen.getByLabelText("Search for apartments");
    fireEvent.change(input, { target: { value: "atlanta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Camden Phipps")).toBeInTheDocument();
  });
});
