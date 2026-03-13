export interface Listing {
  id: string;
  property_name: string;
  city: string;
  state: string;
  beds: number;
  baths: number;
  sqft: number;
  rent: number;
  available: string;
  image: string;
  amenities: string[];
}

export const listings: Listing[] = [
  {
    id: "camden-downtown-houston",
    property_name: "Camden Downtown",
    city: "Houston",
    state: "TX",
    beds: 1,
    baths: 1,
    sqft: 884,
    rent: 1909,
    available: "2026-03-11",
    image: "https://images.ctfassets.net/pg6xj64qk0kh/ld3R3EYyLEdiFqPeiHO3C/c6a5008ad27a5e1e058fe8683ca3e884/3-camden-downtown-apartments-houston-tx-warm_modern-finishes-kitchen-with-quartz-countertops-stainless-steel-appliances-and-.jpg",
    amenities: [
      "Airbnb-friendly",
      "Gas ranges",
      "Walk-in closets",
      "Pool with downtown views",
    ],
  },
  {
    id: "camden-stoneleigh-austin",
    property_name: "Camden Stoneleigh",
    city: "Austin",
    state: "TX",
    beds: 1,
    baths: 1,
    sqft: 692,
    rent: 1059,
    available: "2026-03-11",
    image: "https://images.ctfassets.net/pg6xj64qk0kh/4iVIDs7OU2vx58KWPSMKVs/caea383513fcc56c127d3ee0bc111a60/camden-stoneleigh-apartments-austin-tx-open-concept-layout-with-light-modern-finishes.jpg",
    amenities: [
      "White quartz countertops",
      "Stainless steel appliances",
      "In-unit washer/dryer",
    ],
  },
  {
    id: "camden-rino-denver",
    property_name: "Camden RiNo",
    city: "Denver",
    state: "CO",
    beds: 1,
    baths: 1,
    sqft: 562,
    rent: 1389,
    available: "2026-03-11",
    image: "https://images.ctfassets.net/pg6xj64qk0kh/65vkirdEzDfkBmJEkBPxlV/c9ad1e8d30c786a0d5db0575591ccb8b/3-camden-rino-apartments-denver-co-kitchen-with-bar-seating-and-living-room.jpg",
    amenities: [
      "Herringbone marble backsplash",
      "White quartz countertops",
      "Rooftop deck",
    ],
  },
  {
    id: "camden-legacy-scottsdale",
    property_name: "Camden Legacy",
    city: "Scottsdale",
    state: "AZ",
    beds: 1,
    baths: 1,
    sqft: 722,
    rent: 1519,
    available: "2026-03-11",
    image: "https://images.ctfassets.net/pg6xj64qk0kh/5ePzwDLaRFA3AaTdC203A6/11d2e6d3d0a89c8f6df5af4fd72967c8/2-camden-legacy-apartments-scottsdale-az-dining-living-kitchen-open-concept.jpg",
    amenities: [
      "Modern greige cabinets",
      "Whirlpool stainless steel appliances",
      "Resort-style pool",
    ],
  },
  {
    id: "camden-phipps-atlanta",
    property_name: "Camden Phipps",
    city: "Atlanta",
    state: "GA",
    beds: 1,
    baths: 1,
    sqft: 664,
    rent: 1499,
    available: "2026-03-11",
    image: "https://images.ctfassets.net/pg6xj64qk0kh/4PkzHycT904T5xQ3089cZc/bf76295fe69c758583db42c95eed7727/camden-phipps-apartments-atlanta-ga-renovated-kitchen-and-living-room-with-hardwood-style-flooring-and-ceiling-fan.jpg",
    amenities: [
      "Quartz countertops",
      "Hardwood-style flooring",
      "Ceiling fans",
    ],
  },
  {
    id: "camden-cinco-ranch-katy",
    property_name: "Camden Downs at Cinco Ranch",
    city: "Katy",
    state: "TX",
    beds: 1,
    baths: 1,
    sqft: 811,
    rent: 1249,
    available: "2026-05-22",
    image: "https://images.ctfassets.net/pg6xj64qk0kh/12uQzQedH5K8ryLcnAQHrW/ed4627da2b484c6f922bf8305cb54c5b/camden-downs-at-cinco-ranch-apartments__3_.jpg",
    amenities: [
      "Granite countertops",
      "Chestnut brown cabinetry",
      "Private patio",
    ],
  },
];
