import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ComparisonBar from "../ComparisonBar";
import { Listing } from "@/data/listings";

const makeListing = (overrides: Partial<Listing>): Listing => ({
  id: "test",
  property_name: "Test",
  city: "Denver",
  state: "CO",
  beds: 1,
  baths: 1,
  sqft: 600,
  rent: 1000,
  available: "2026-01-01",
  image: "https://example.com/img.jpg",
  amenities: [],
  ...overrides,
});

describe("ComparisonBar", () => {
  it("renders nothing when fewer than 2 listings", () => {
    const { container } = render(
      <ComparisonBar listings={[makeListing({ id: "1" })]} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the heading for 2+ listings", () => {
    render(
      <ComparisonBar
        listings={[
          makeListing({ id: "1", property_name: "Place A", rent: 1000 }),
          makeListing({ id: "2", property_name: "Place B", rent: 1500 }),
        ]}
      />
    );
    expect(screen.getByText("Rent Comparison")).toBeInTheDocument();
  });

  it("displays property names and rents", () => {
    render(
      <ComparisonBar
        listings={[
          makeListing({ id: "1", property_name: "Place A", rent: 1200 }),
          makeListing({ id: "2", property_name: "Place B", rent: 1800 }),
        ]}
      />
    );
    expect(screen.getByText("Place A")).toBeInTheDocument();
    expect(screen.getByText("Place B")).toBeInTheDocument();
    expect(screen.getByText("$1,200/mo")).toBeInTheDocument();
    expect(screen.getByText("$1,800/mo")).toBeInTheDocument();
  });

  it("sets bar width proportional to max rent", () => {
    const { container } = render(
      <ComparisonBar
        listings={[
          makeListing({ id: "1", property_name: "Cheap", rent: 500 }),
          makeListing({ id: "2", property_name: "Expensive", rent: 1000 }),
        ]}
      />
    );
    const bars = container.querySelectorAll("[style*='width']");
    // The more expensive listing should be 100%, the cheaper 50%
    const widths = Array.from(bars).map((el) =>
      (el as HTMLElement).style.width
    );
    expect(widths).toContain("100%");
    expect(widths).toContain("50%");
  });
});
