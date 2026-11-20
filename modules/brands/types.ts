export const portalBrands = [
  { id: "emori", name: "Emori", code: "EMO-001", coordinator: "Himani", industry: "Lab-grown diamonds", headline: "Unleash Your", accent: "Inner Radiance", description: "Premium lab grown diamond jewellery, designed for the modern you.", highlights: ["Certified lab grown", "Trusted quality", "Ethical & sustainable"], theme: "emori", logo: "/images/emori-logo-original.png" },
  { id: "brew", name: "Brew Theory", code: "BT-014", coordinator: "Shakshay", industry: "Specialty coffee", headline: "Make Room For", accent: "A Better Break", description: "A modern café experience built around thoughtful coffee and good company.", highlights: ["Craft coffee", "Distinctive cafés", "Made for community"], theme: "coffee", logo: null },
  { id: "odette", name: "Odette Paris", code: "ODT-001", coordinator: "Brand team", industry: "Contemporary fashion", headline: "A Parisian", accent: "Point of View", description: "A considered fashion house with a confident, quietly modern spirit.", highlights: ["Parisian design", "Modern wardrobe", "Elevated details"], theme: "fashion", logo: "/images/brand-logos/odette-paris.png" },
  { id: "franco", name: "Franco", code: "FRC-001", coordinator: "Brand team", industry: "Fashion & lifestyle", headline: "Made to Move", accent: "With You", description: "A personal, expressive brand made for people going their own way.", highlights: ["Personal style", "Everyday ease", "Independent spirit"], theme: "franco", logo: "/images/brand-logos/franco.png" },
  { id: "rasturi", name: "Rasturi Creations", code: "RST-001", coordinator: "Brand team", industry: "Indian ethnic wear", headline: "Tradition,", accent: "Worn Forward", description: "Indian ethnic wear that brings craft, color and contemporary life together.", highlights: ["Indian craftsmanship", "Modern occasionwear", "Color with character"], theme: "rasturi", logo: "/images/brand-logos/rasturi.png" },
  { id: "original", name: "Original Burger Co.", code: "ORG-001", coordinator: "Brand team", industry: "Quick-service restaurants", headline: "Keep It", accent: "Original", description: "A bold burger experience centered on the classics done exceptionally well.", highlights: ["Made to order", "Big, honest flavor", "A signature experience"], theme: "original", logo: "/images/brand-logos/original-burger.png" },
  { id: "biggies", name: "Biggies Burger", code: "BIG-001", coordinator: "Brand team", industry: "Quick-service restaurants", headline: "Go Big", accent: "On Flavor", description: "A high-energy burger brand serving generous flavor and memorable moments.", highlights: ["Big portions", "Grill-forward flavor", "Built for sharing"], theme: "biggies", logo: "/images/brand-logos/biggies-burger.png" },
  { id: "g", name: "Bigguys", code: "BGY-001", coordinator: "Brand team", industry: "Quick-service restaurants", headline: "Big Flavor.", accent: "Big Moments.", description: "A bold burger experience built for generous flavor and easygoing moments.", highlights: ["Fresh off the grill", "Big, bold flavor", "Made for sharing"], theme: "g", logo: "/images/brand-logos/g.png" },
  { id: "downing", name: "10 Downing Street", code: "DS-001", coordinator: "Brand team", industry: "Casual dining", headline: "A Classic", accent: "With a Twist", description: "A polished, welcoming dining experience with a familiar British sensibility.", highlights: ["All-day dining", "Distinctive interiors", "Warm hospitality"], theme: "downing", logo: "/images/brand-logos/10-downing-street.png" },
  { id: "freshco", name: "FreshCo Goli Soda", code: "FCO-001", coordinator: "Brand team", industry: "Beverages", headline: "Bring Back", accent: "The Fizz", description: "A bright, nostalgic soda experience refreshed for a new generation.", highlights: ["Nostalgic refreshment", "Bright flavors", "Made to be shared"], theme: "freshco", logo: "/images/brand-logos/freshco-goli-soda.png" },
  { id: "fusion", name: "Fusion Pizza Big Burger Co.", code: "FUS-001", coordinator: "Brand team", industry: "Pizza & burgers", headline: "More Flavor.", accent: "More to Share.", description: "A playful menu bringing crowd-favorite pizzas and burgers together.", highlights: ["Pizza & burgers", "Made for groups", "Big flavor combinations"], theme: "fusion", logo: "/images/brand-logos/fusion-pizza.png" },
  { id: "avenue", name: "Brand Avenue", code: "BA-001", coordinator: "Brand team", industry: "Brand development", headline: "Find Your", accent: "Next Avenue", description: "A clear path for ambitious brands ready to reach new customers.", highlights: ["Brand strategy", "Retail presence", "Growth opportunities"], theme: "avenue", logo: "/images/brand-logos/brand-avenue.png" },
  { id: "lassi", name: "Lassi No Cafe International", code: "LNC-001", coordinator: "Brand team", industry: "Café & beverages", headline: "A Cooler Kind", accent: "Of Classic", description: "A refreshing café concept celebrating lassi, conversation and Indian flavor.", highlights: ["Indian refreshment", "Modern café", "A familiar favorite"], theme: "lassi", logo: "/images/brand-logos/lassi-no-cafe.png" },
] as const;

export type BrandId = (typeof portalBrands)[number]["id"];
export type PortalRole = "Brand Admin" | "Brand Representative";
export type Stage = "New" | "Qualified" | "Meeting" | "Hot" | "Token Collected" | "Won" | "Lost";
export type PaymentStatus = "In Progress" | "Partially Paid" | "Not Started" | "Paid" | "Pending";
export type FranchiseModel = "Retail Franchise" | "Master Franchise" | "Area Franchise";

export type PortalUser = {
  id: string;
  brandId: BrandId;
  name: string;
  email: string;
  role: PortalRole;
  status: "Active" | "Inactive";
  lastLogin: string;
};

export type Opportunity = {
  id: string;
  brandId: BrandId;
  customer: string;
  contact: string;
  email?: string;
  city: string;
  phone: string;
  model: FranchiseModel;
  stage: Stage;
  activity: string;
  created: string;
  dealValue: number | null;
  payment: PaymentStatus | null;
  closure: string | null;
};

export type Meeting = {
  id: string;
  brandId: BrandId;
  createdBy?: "Brand" | "iFranchise";
  opportunityId: string;
  title: string;
  date: string;
  time: string;
  kind: "Virtual" | "In-person";
  meetLink: string;
  place: string;
  status: "Upcoming" | "Completed";
  participants: { name: string; side: string; email?: string }[];
  agenda: string[];
  feedback: string;
  followUps: { text: string; due: string }[];
  mom: string;
};

export type Invoice = {
  id: string;
  brandId: BrandId;
  opportunityId: string;
  date: string;
  amount: number;
  status: "Paid" | "Partially Paid" | "Pending";
};

export type BrandDocument = {
  id: string;
  brandId: BrandId;
  opportunityId: string;
  name: string;
  party: string;
  status: "Pending" | "Approved";
};

export type Notice = {
  id: string;
  brandId: BrandId;
  title: string;
  detail: string;
  when: string;
  unread: boolean;
  targetType?: "meeting" | "opportunity" | "invoice" | "document";
  targetId?: string;
};

export type AuditEntry = {
  id: string;
  brandId: BrandId;
  user: string;
  action: string;
  related: string;
  when: string;
};

export const stages: Stage[] = ["New", "Qualified", "Meeting", "Hot", "Token Collected", "Won", "Lost"];
export const franchiseModels: FranchiseModel[] = ["Retail Franchise", "Master Franchise", "Area Franchise"];
export const reviewDate = "2026-11-16";
