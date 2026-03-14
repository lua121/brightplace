import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PropertyCard from "../PropertyCard";
import { Listing } from "@/data/listings";

// Mock next/image to a plain img
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const baseListing: Listing = {
  id: "test-listing",
  property_name: "Test Apartments",
  city: "Denver",
  state: "CO",
  beds: 2,
  baths: 1,
  sqft: 750,
  rent: 1500,
  available: "2020-01-01", // past date → "Available now"
  image: "https://example.com/image.jpg",
  amenities: ["Pool", "Rooftop deck", "In-unit washer/dryer"],
};

describe("PropertyCard", () => {
  it("renders property name, city, and state", () => {
    render(<PropertyCard listing={baseListing} index={0} />);
    expect(screen.getByText("Test Apartments")).toBeInTheDocument();
    expect(screen.getByText("Denver, CO")).toBeInTheDocument();
  });

  it("renders beds, baths, and sqft", () => {
    render(<PropertyCard listing={baseListing} index={0} />);
    expect(screen.getByText("2 Bed")).toBeInTheDocument();
    expect(screen.getByText("1 Bath")).toBeInTheDocument();
    expect(screen.getByText("750 sqft")).toBeInTheDocument();
  });

  it("renders rent as badge overlay", () => {
    render(<PropertyCard listing={baseListing} index={0} />);
    expect(screen.getByText("$1,500/mo")).toBeInTheDocument();
  });

  it("renders all amenities as badges", () => {
    render(<PropertyCard listing={baseListing} index={0} />);
    expect(screen.getByText("Pool")).toBeInTheDocument();
    expect(screen.getByText("Rooftop deck")).toBeInTheDocument();
    expect(screen.getByText("In-unit washer/dryer")).toBeInTheDocument();
  });

  it("shows 'Available now' for past availability dates", () => {
    render(<PropertyCard listing={baseListing} index={0} />);
    expect(screen.getByText("Available now")).toBeInTheDocument();
  });

  it("shows formatted date for future availability", () => {
    const futureListing = { ...baseListing, available: "2099-06-15" };
    render(<PropertyCard listing={futureListing} index={0} />);
    expect(screen.getByText(/Available Jun 15, 2099/)).toBeInTheDocument();
  });

  it("renders descriptive alt text on the image", () => {
    render(<PropertyCard listing={baseListing} index={0} />);
    const img = screen.getByAltText("Test Apartments in Denver, CO — $1,500/mo");
    expect(img).toBeInTheDocument();
  });

  it("shows gradient fallback when image fails to load", () => {
    render(<PropertyCard listing={baseListing} index={0} />);
    const img = screen.getByAltText(/Test Apartments/);
    fireEvent.error(img);
    // Image should be replaced by gradient div
    expect(screen.queryByAltText(/Test Apartments/)).not.toBeInTheDocument();
  });

  it("applies staggered animation delay based on index", () => {
    const { container } = render(<PropertyCard listing={baseListing} index={3} />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.animationDelay).toBe("300ms");
  });
});
