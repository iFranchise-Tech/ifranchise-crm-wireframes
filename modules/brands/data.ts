import type { AuditEntry, BrandDocument, Invoice, Meeting, Notice, Opportunity, PortalUser, Stage } from "./types";

const stagePlan: { stage: Stage; count: number }[] = [
  { stage: "New", count: 24 },
  { stage: "Qualified", count: 18 },
  { stage: "Meeting", count: 18 },
  { stage: "Hot", count: 16 },
  { stage: "Token Collected", count: 14 },
  { stage: "Won", count: 32 },
  { stage: "Lost", count: 11 },
];

const customers = ["Aarav Foods", "Bharat Mart", "Coastal Basket", "Deccan Fresh", "Eastern Grocers", "Fern Retail", "Ganga Stores", "Harbour Bites", "Indus Mart", "Jasper Foods", "Kaveri Retail", "Lakeview Stores", "Metro Provisions", "Narmada Mart", "Orchid Foods", "Pearl Grocers", "Quest Retail", "Riverstone Mart", "Saffron Basket", "Tulip Stores", "Unity Mart", "Valley Foods", "Westend Grocers", "Yellow Basket"];
const contacts = ["Aarav N", "Bhavna R", "Chirag P", "Diya M", "Eshan K", "Farah S", "Gaurav T", "Harini V"];
const cities = ["Hyderabad", "Vijayawada", "Bengaluru", "Kochi", "Pune", "Jaipur"];
const models = ["Retail Franchise", "Master Franchise", "Area Franchise"] as const;
const activityFor: Record<Stage, string> = {
  New: "Initial enquiry",
  Qualified: "Documents shared",
  Meeting: "Meeting scheduled",
  Hot: "Call with customer",
  "Token Collected": "Token received",
  Won: "Deal closed",
  Lost: "Not proceeding",
};
const dealFor: Partial<Record<Stage, number>> = {
  Hot: 2500000,
  "Token Collected": 8000000,
  Won: 3200000,
  Lost: 1500000,
};
const paymentFor: Partial<Record<Stage, Opportunity["payment"]>> = {
  Hot: "In Progress",
  "Token Collected": "Partially Paid",
  Won: "Paid",
  Lost: "Not Started",
};

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

const named: Opportunity[] = [
  { id: "EMO-OPP-0148", brandId: "emori", customer: "Ravi Enterprises", contact: "Ravi S", city: "Hyderabad", phone: "+91 98480 11021", model: "Retail Franchise", stage: "Hot", activity: "Call with customer", created: "2026-11-12", dealValue: 2500000, payment: "In Progress", closure: "2026-11-12" },
  { id: "EMO-OPP-0147", brandId: "emori", customer: "Greenfield Foods Pvt. Ltd.", contact: "Anita Rao", city: "Hyderabad", phone: "+91 98480 11034", model: "Master Franchise", stage: "Meeting", activity: "Token received", created: "2026-11-11", dealValue: 12000000, payment: "Partially Paid", closure: "2026-11-11" },
  { id: "EMO-OPP-0146", brandId: "emori", customer: "Sree Retailers", contact: "Sreeja P", city: "Vijayawada", phone: "+91 98480 11048", model: "Retail Franchise", stage: "Token Collected", activity: "Token received", created: "2026-11-10", dealValue: 5000000, payment: "Partially Paid", closure: "2026-11-10" },
  { id: "EMO-OPP-0145", brandId: "emori", customer: "Urban Stores LLP", contact: "Kiran D", city: "Bengaluru", phone: "+91 98480 11056", model: "Area Franchise", stage: "Qualified", activity: "Documents shared", created: "2026-11-09", dealValue: null, payment: null, closure: null },
  { id: "EMO-OPP-0144", brandId: "emori", customer: "Lotus Retail Pvt. Ltd.", contact: "Lakshmi N", city: "Hyderabad", phone: "+91 98480 11063", model: "Retail Franchise", stage: "New", activity: "Initial enquiry", created: "2026-11-08", dealValue: 1800000, payment: "Not Started", closure: "2026-11-08" },
  { id: "EMO-OPP-0143", brandId: "emori", customer: "Vijaya Mart", contact: "Vijay K", city: "Vijayawada", phone: "+91 98480 11077", model: "Retail Franchise", stage: "Won", activity: "Deal closed", created: "2026-11-05", dealValue: 1000000, payment: "Paid", closure: "2026-11-05" },
  { id: "EMO-OPP-0142", brandId: "emori", customer: "RK Distributors", contact: "Rakesh K", city: "Pune", phone: "+91 98480 11082", model: "Area Franchise", stage: "Lost", activity: "Not proceeding", created: "2026-11-04", dealValue: 1500000, payment: "Not Started", closure: "2026-11-04" },
  { id: "EMO-OPP-0141", brandId: "emori", customer: "Bright Retail", contact: "Bhavna R", city: "Kochi", phone: "+91 98480 11095", model: "Retail Franchise", stage: "Qualified", activity: "Follow-up call", created: "2026-11-03", dealValue: 2200000, payment: "In Progress", closure: "2026-11-03" },
];

function emoriOpportunities(): Opportunity[] {
  const rows = [...named];
  let serial = 1001;
  stagePlan.forEach(plan => {
    const have = rows.filter(item => item.stage === plan.stage).length;
    for (let index = 0; index < plan.count - have; index += 1) {
      const n = serial++;
      const created = addDays("2026-10-18", n % 15);
      const deal = dealFor[plan.stage] ?? null;
      rows.push({
        id: `EMO-OPP-${n}`,
        brandId: "emori",
        customer: customers[n % customers.length],
        contact: contacts[n % contacts.length],
        city: cities[n % cities.length],
        phone: `+91 98481 ${String(20000 + n).slice(0, 5)}`,
        model: models[n % models.length],
        stage: plan.stage,
        activity: activityFor[plan.stage],
        created,
        dealValue: deal,
        payment: deal ? paymentFor[plan.stage] ?? null : null,
        closure: deal ? created : null,
      });
    }
  });
  return rows;
}

const brewOpportunities: Opportunity[] = [
  { id: "BT-OPP-2008", brandId: "brew", customer: "Malabar Coffee House", contact: "Nithin P", city: "Kochi", phone: "+91 98470 22018", model: "Retail Franchise", stage: "Hot", activity: "Call with customer", created: "2026-11-12", dealValue: 1800000, payment: "In Progress", closure: "2026-11-12" },
  { id: "BT-OPP-2007", brandId: "brew", customer: "Harbour Roast", contact: "Meera K", city: "Bengaluru", phone: "+91 98470 22027", model: "Retail Franchise", stage: "Meeting", activity: "Meeting scheduled", created: "2026-11-09", dealValue: null, payment: null, closure: null },
  { id: "BT-OPP-2006", brandId: "brew", customer: "Daily Grind Co.", contact: "Arun S", city: "Pune", phone: "+91 98470 22036", model: "Area Franchise", stage: "Token Collected", activity: "Token received", created: "2026-11-06", dealValue: 4500000, payment: "Partially Paid", closure: "2026-11-06" },
  { id: "BT-OPP-2005", brandId: "brew", customer: "North Cup", contact: "Leela V", city: "Jaipur", phone: "+91 98470 22044", model: "Master Franchise", stage: "Qualified", activity: "Documents shared", created: "2026-11-02", dealValue: null, payment: null, closure: null },
  { id: "BT-OPP-2004", brandId: "brew", customer: "Bean Street", contact: "Rahul D", city: "Hyderabad", phone: "+91 98470 22051", model: "Retail Franchise", stage: "Won", activity: "Deal closed", created: "2026-10-28", dealValue: 2200000, payment: "Paid", closure: "2026-10-28" },
  { id: "BT-OPP-2003", brandId: "brew", customer: "Filter House", contact: "Sana I", city: "Vijayawada", phone: "+91 98470 22068", model: "Retail Franchise", stage: "Lost", activity: "Not proceeding", created: "2026-10-24", dealValue: 900000, payment: "Not Started", closure: "2026-10-24" },
];

export const opportunities: Opportunity[] = [...emoriOpportunities(), ...brewOpportunities];

const upcoming: Meeting[] = [
  {
    id: "MTG-EMO-18",
    brandId: "emori",
    opportunityId: "EMO-OPP-0148",
    title: "Franchise Discussion – Hyderabad",
    date: "2026-11-18",
    time: "11:00 AM – 12:00 PM",
    kind: "Virtual",
    meetLink: "https://meet.google.com/emori-hyd-018",
    place: "",
    status: "Upcoming",
    participants: [
      { name: "Ravi S", side: "Customer" },
      { name: "Anitha K", side: "Emori" },
      { name: "Praveen M", side: "Emori" },
      { name: "Suresh G", side: "Customer" },
    ],
    agenda: [
      "Discuss franchise model and investment requirements",
      "Share brand overview and support structure",
      "Understand location and timeline",
    ],
    feedback: "",
    followUps: [{ text: "Share detailed investment brochure", due: "2026-11-19" }],
    mom: "",
  },
  { id: "MTG-EMO-20", brandId: "emori", opportunityId: "EMO-OPP-0147", title: "Site Feasibility Review", date: "2026-11-20", time: "3:00 PM – 4:00 PM", kind: "In-person", meetLink: "", place: "Emori office, Hyderabad", status: "Upcoming", participants: [{ name: "Anita Rao", side: "Customer" }, { name: "Anitha K", side: "Emori" }], agenda: ["Review the shortlisted site", "Confirm catchment and rent"], feedback: "", followUps: [], mom: "" },
  { id: "MTG-EMO-22", brandId: "emori", opportunityId: "EMO-OPP-0146", title: "Commercial Terms Discussion", date: "2026-11-22", time: "11:30 AM – 12:30 PM", kind: "Virtual", meetLink: "https://meet.google.com/emori-terms-022", place: "", status: "Upcoming", participants: [{ name: "Sreeja P", side: "Customer" }, { name: "Praveen M", side: "Emori" }], agenda: ["Walk through the franchise fee", "Confirm the token schedule"], feedback: "", followUps: [], mom: "" },
  { id: "MTG-EMO-25", brandId: "emori", opportunityId: "EMO-OPP-0144", title: "Store Layout & Investment", date: "2026-11-25", time: "4:00 PM – 5:00 PM", kind: "In-person", meetLink: "", place: "Lotus Retail, Hyderabad", status: "Upcoming", participants: [{ name: "Lakshmi N", side: "Customer" }, { name: "Anitha K", side: "Emori" }], agenda: ["Review the store layout", "Share the investment outline"], feedback: "", followUps: [], mom: "" },
  { id: "MTG-EMO-27", brandId: "emori", opportunityId: "EMO-OPP-0141", title: "Final Review & Next Steps", date: "2026-11-27", time: "12:00 PM – 1:00 PM", kind: "In-person", meetLink: "", place: "Emori office, Kochi", status: "Upcoming", participants: [{ name: "Bhavna R", side: "Customer" }, { name: "Praveen M", side: "Emori" }], agenda: ["Confirm the remaining questions", "Agree the next step"], feedback: "", followUps: [], mom: "" },
  { id: "MTG-EMO-28", brandId: "emori", opportunityId: "EMO-OPP-0145", title: "Document Walkthrough", date: "2026-11-28", time: "10:00 AM – 10:45 AM", kind: "Virtual", meetLink: "https://meet.google.com/emori-docs-028", place: "", status: "Upcoming", participants: [{ name: "Kiran D", side: "Customer" }, { name: "Anitha K", side: "Emori" }], agenda: ["Review the shared documents"], feedback: "", followUps: [], mom: "" },
  { id: "MTG-EMO-29", brandId: "emori", opportunityId: "EMO-OPP-0148", title: "Location Shortlist", date: "2026-11-29", time: "2:00 PM – 2:45 PM", kind: "Virtual", meetLink: "https://meet.google.com/emori-loc-029", place: "", status: "Upcoming", participants: [{ name: "Ravi S", side: "Customer" }, { name: "Anitha K", side: "Emori" }], agenda: ["Compare the two Hyderabad locations"], feedback: "", followUps: [], mom: "" },
  { id: "MTG-EMO-30", brandId: "emori", opportunityId: "EMO-OPP-0146", title: "Token Confirmation", date: "2026-11-30", time: "5:00 PM – 5:30 PM", kind: "Virtual", meetLink: "https://meet.google.com/emori-token-030", place: "", status: "Upcoming", participants: [{ name: "Sreeja P", side: "Customer" }, { name: "Praveen M", side: "Emori" }], agenda: ["Confirm the token receipt"], feedback: "", followUps: [], mom: "" },
];

function completedMeetings(): Meeting[] {
  const titles = ["Proposal review", "Catchment check", "Investment walkthrough", "Agreement readout", "Intro with the brand team"];
  return Array.from({ length: 24 }, (_, index) => {
    const pending = index >= 19;
    const opportunity = named[index % named.length];
    return {
      id: `MTG-EMO-C${index + 1}`,
      brandId: "emori" as const,
      opportunityId: opportunity.id,
      title: `${titles[index % titles.length]} – ${opportunity.city}`,
      date: addDays("2026-10-20", index),
      time: "11:00 AM – 12:00 PM",
      kind: index % 2 === 0 ? "Virtual" as const : "In-person" as const,
      meetLink: index % 2 === 0 ? `https://meet.google.com/emori-done-${index + 1}` : "",
      place: index % 2 === 0 ? "" : `Emori office, ${opportunity.city}`,
      status: "Completed" as const,
      participants: [
        { name: opportunity.contact, side: "Customer" },
        { name: "Anitha K", side: "Emori" },
      ],
      agenda: ["Review progress on this opportunity", "Agree what the brand will share next"],
      feedback: pending ? "" : "The customer is aligned on the model and asked for the brochure.",
      followUps: pending ? [{ text: "Send the pending documents", due: addDays("2026-10-20", index + 2) }] : [],
      mom: pending ? "" : "Model, investment and location were discussed. The brand will share the brochure. Sales keeps the stage.",
    };
  });
}

const brewMeetings: Meeting[] = [
  { id: "MTG-BT-19", brandId: "brew", opportunityId: "BT-OPP-2007", title: "Menu & Store Format", date: "2026-11-19", time: "4:00 PM – 5:00 PM", kind: "Virtual", meetLink: "https://meet.google.com/brew-menu-019", place: "", status: "Upcoming", participants: [{ name: "Meera K", side: "Customer" }, { name: "Meera Shah", side: "Brew Theory" }], agenda: ["Walk through the store format", "Confirm the city"], feedback: "", followUps: [{ text: "Share the format deck", due: "2026-11-20" }], mom: "" },
  { id: "MTG-BT-C1", brandId: "brew", opportunityId: "BT-OPP-2006", title: "Token follow-up", date: "2026-11-08", time: "11:00 AM – 11:30 AM", kind: "Virtual", meetLink: "https://meet.google.com/brew-token-008", place: "", status: "Completed", participants: [{ name: "Arun S", side: "Customer" }, { name: "Meera Shah", side: "Brew Theory" }], agenda: ["Confirm the token"], feedback: "Token received. Waiting on the agreement draft.", followUps: [], mom: "Token confirmed for Daily Grind Co. Agreement draft is the next share." },
];

export const initialMeetings: Meeting[] = [...upcoming, ...completedMeetings(), ...brewMeetings];

export const invoices: Invoice[] = [
  { id: "INV-EMO-0045", brandId: "emori", opportunityId: "EMO-OPP-0146", date: "2026-11-10", amount: 500000, status: "Paid" },
  { id: "INV-EMO-0044", brandId: "emori", opportunityId: "EMO-OPP-0143", date: "2026-11-05", amount: 1000000, status: "Paid" },
  { id: "INV-EMO-0043", brandId: "emori", opportunityId: "EMO-OPP-0141", date: "2026-11-02", amount: 1500000, status: "Partially Paid" },
  { id: "INV-EMO-0042", brandId: "emori", opportunityId: "EMO-OPP-0148", date: "2026-10-28", amount: 500000, status: "Pending" },
  { id: "INV-EMO-0041", brandId: "emori", opportunityId: "EMO-OPP-0147", date: "2026-10-22", amount: 800000, status: "Paid" },
  { id: "INV-BT-0112", brandId: "brew", opportunityId: "BT-OPP-2004", date: "2026-10-28", amount: 600000, status: "Paid" },
  { id: "INV-BT-0118", brandId: "brew", opportunityId: "BT-OPP-2006", date: "2026-11-06", amount: 400000, status: "Pending" },
];

/** Portfolio figures shown on the Emori overview, matching the review screen. */
export const emoriInvoiceSummary = { total: 2450000, paid: 1800000, pending: 650000 };

export const documents: BrandDocument[] = [
  { id: "DOC-EMO-1", brandId: "emori", opportunityId: "EMO-OPP-0147", name: "KYC – Greenfield Foods Pvt. Ltd.", party: "Greenfield Foods Pvt. Ltd.", status: "Pending" },
  { id: "DOC-EMO-2", brandId: "emori", opportunityId: "EMO-OPP-0143", name: "Site Photos – Vijay", party: "Vijaya Mart", status: "Pending" },
  { id: "DOC-EMO-3", brandId: "emori", opportunityId: "EMO-OPP-0148", name: "Franchise Agreement (Draft)", party: "Ravi Enterprises", status: "Pending" },
  { id: "DOC-EMO-4", brandId: "emori", opportunityId: "EMO-OPP-0144", name: "KYC – Lotus Retail Pvt. Ltd.", party: "Lotus Retail Pvt. Ltd.", status: "Pending" },
  { id: "DOC-EMO-5", brandId: "emori", opportunityId: "EMO-OPP-0145", name: "Site layout – Urban Stores LLP", party: "Urban Stores LLP", status: "Pending" },
  { id: "DOC-EMO-6", brandId: "emori", opportunityId: "EMO-OPP-0148", name: "Brand deck – Emori", party: "Ravi Enterprises", status: "Approved" },
  { id: "DOC-EMO-7", brandId: "emori", opportunityId: "EMO-OPP-0147", name: "Meeting notes – Site Feasibility", party: "Greenfield Foods Pvt. Ltd.", status: "Approved" },
  { id: "DOC-BT-1", brandId: "brew", opportunityId: "BT-OPP-2008", name: "KYC – Malabar Coffee House", party: "Malabar Coffee House", status: "Pending" },
  { id: "DOC-BT-2", brandId: "brew", opportunityId: "BT-OPP-2004", name: "Franchise agreement – Bean Street", party: "Bean Street", status: "Approved" },
];

export const initialNotices: Notice[] = [
  { id: "NT-1", brandId: "emori", title: "New opportunity visible", detail: "EMO-OPP-0148 · Ravi Enterprises is now visible to Emori.", when: "12 Nov 2026, 9:40 AM", unread: true, targetType: "opportunity", targetId: "EMO-OPP-0148" },
  { id: "NT-2", brandId: "emori", title: "Meeting scheduled", detail: "Franchise Discussion – Hyderabad is on 18 Nov, 11:00 AM.", when: "12 Nov 2026, 10:15 AM", unread: true, targetType: "meeting", targetId: "MTG-EMO-18" },
  { id: "NT-3", brandId: "emori", title: "Meeting reminder", detail: "Site Feasibility Review is in two days.", when: "16 Nov 2026, 8:00 AM", unread: true, targetType: "meeting", targetId: "MTG-EMO-20" },
  { id: "NT-4", brandId: "emori", title: "Invoice generated", detail: "INV-EMO-0045 for Sree Retailers is ready.", when: "10 Nov 2026, 4:10 PM", unread: false, targetType: "invoice", targetId: "INV-EMO-0045" },
  { id: "NT-5", brandId: "emori", title: "Document uploaded", detail: "Franchise Agreement (Draft) was shared for Ravi Enterprises.", when: "11 Nov 2026, 1:20 PM", unread: false, targetType: "document", targetId: "DOC-EMO-3" },
  { id: "NT-6", brandId: "emori", title: "Deal updated", detail: "Vijaya Mart moved to Won.", when: "5 Nov 2026, 6:05 PM", unread: false, targetType: "opportunity", targetId: "EMO-OPP-0143" },
  { id: "NT-7", brandId: "emori", title: "MOM finalized", detail: "Proposal review – Hyderabad has an approved MOM.", when: "2 Nov 2026, 11:45 AM", unread: false, targetType: "document", targetId: "DOC-EMO-7" },
  { id: "NT-8", brandId: "emori", title: "Follow-up assigned", detail: "Share the investment brochure before 19 Nov.", when: "16 Nov 2026, 9:05 AM", unread: true, targetType: "meeting", targetId: "MTG-EMO-18" },
  { id: "NT-9", brandId: "brew", title: "Meeting scheduled", detail: "Menu & Store Format is on 19 Nov, 4:00 PM.", when: "14 Nov 2026, 3:10 PM", unread: true, targetType: "meeting", targetId: "MTG-BT-19" },
  { id: "NT-10", brandId: "brew", title: "Invoice generated", detail: "INV-BT-0118 for Daily Grind Co. is pending.", when: "6 Nov 2026, 2:40 PM", unread: true, targetType: "invoice", targetId: "INV-BT-0118" },
];

export const initialUsers: PortalUser[] = [
  { id: "BU-1", brandId: "emori", name: "Anitha K", email: "anitha@emori.example", role: "Brand Admin", status: "Active", lastLogin: "16 Nov 2026, 9:10 AM" },
  { id: "BU-2", brandId: "emori", name: "Praveen M", email: "praveen@emori.example", role: "Brand Representative", status: "Active", lastLogin: "15 Nov 2026, 6:40 PM" },
  { id: "BU-3", brandId: "emori", name: "Kavya N", email: "kavya@emori.example", role: "Brand Representative", status: "Active", lastLogin: "14 Nov 2026, 11:05 AM" },
  { id: "BU-4", brandId: "brew", name: "Meera Shah", email: "meera@brewtheory.example", role: "Brand Admin", status: "Active", lastLogin: "16 Nov 2026, 8:20 AM" },
  { id: "BU-5", brandId: "brew", name: "Arjun Iyer", email: "arjun@brewtheory.example", role: "Brand Representative", status: "Active", lastLogin: "13 Nov 2026, 4:15 PM" },
];

export const initialAudits: AuditEntry[] = [
  { id: "AUD-1", brandId: "emori", user: "Anitha K", action: "Signed in", related: "Emori portal", when: "16 Nov 2026, 9:10 AM" },
  { id: "AUD-2", brandId: "emori", user: "Anitha K", action: "Opened an invoice", related: "INV-EMO-0044", when: "15 Nov 2026, 5:12 PM" },
  { id: "AUD-3", brandId: "brew", user: "Meera Shah", action: "Signed in", related: "Brew Theory portal", when: "16 Nov 2026, 8:20 AM" },
];

export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function shortDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}

export function weekdayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}

export function monthDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return { month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date), day: String(date.getDate()) };
}
