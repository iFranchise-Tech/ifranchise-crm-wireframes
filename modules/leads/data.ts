import type { Activity, Enquiry, LeadSource, SourceLead } from "./types";

/** Review fixtures aligned to the Lead Management screens. */
const listedEnquiries: Enquiry[] = [
  { id: "ENQ-2401", category: "Franchise", name: "Asha Menon", mobile: "9847011201", email: "asha.menon@example.com", city: "Kochi", state: "Kerala", address: "14 Marine Drive", brand: "Brew Theory", investment: "₹50L – ₹1Cr", status: "New", focus: "Brew Theory", extra: "Specific brand · ₹50L – ₹1Cr · Within 3 months", originalSource: "Website", heardAbout: "Instagram Advertisement", heardAboutOther: "", heardAboutBy: "Customer", heardAboutAt: "24 Jan 2026, 09:12", owner: "Himani Bhargava Tapadiya", received: "10 Nov 2026", salesPipeline: true },
  { id: "ENQ-2402", category: "Franchise", name: "Rahul Deshmukh", mobile: "9822094418", email: "rahul.deshmukh@example.com", city: "Pune", state: "Maharashtra", address: "22 FC Road", brand: "FitForge", investment: "₹1Cr – ₹2Cr", status: "In Progress", focus: "FitForge", extra: "General franchise enquiry · ₹1Cr – ₹2Cr · 3–6 months", originalSource: "Phone Call", heardAbout: "", heardAboutOther: "", heardAboutBy: "", heardAboutAt: "", owner: "Shakshay Gupta", received: "8 Nov 2026", salesPipeline: true },
  { id: "ENQ-2403", category: "Brand expansion", name: "Northspoon Foods", mobile: "9845098821", email: "hello@northspoon.example", city: "Bengaluru", state: "Karnataka", address: "8 Indiranagar", brand: "Northspoon Foods", investment: "₹2Cr+", status: "Qualified", focus: "Packaged foods", extra: "12 stores · Wants a south-India franchise model", originalSource: "Meta Lead Ads", heardAbout: "Google Search", heardAboutOther: "", heardAboutBy: "Customer", heardAboutAt: "22 Jan 2026, 11:05", owner: "Vivek Rawat", received: "6 Nov 2026", salesPipeline: true },
  { id: "ENQ-2404", category: "Job", name: "Meera Iyer", mobile: "9886013344", email: "meera.iyer@example.com", city: "Hyderabad", state: "Telangana", address: "41 Banjara Hills", brand: "Brew Theory", investment: "₹50L – ₹1Cr", status: "In Progress", focus: "HR Intern", extra: "MBA · Fresher · Notice period: immediate", resume: "Resume received", originalSource: "Website", heardAbout: "LinkedIn", heardAboutOther: "", heardAboutBy: "Customer", heardAboutAt: "21 Jan 2026, 14:22", owner: "Ekta Pattanaik", received: "4 Nov 2026", salesPipeline: false },
  { id: "ENQ-2405", category: "Franchise", name: "Imran Qureshi", mobile: "9700012288", email: "imran.qureshi@example.com", city: "Hyderabad", state: "Telangana", address: "19 Jubilee Hills", brand: "Little Campus", investment: "₹1Cr – ₹2Cr", status: "New", focus: "Little Campus", extra: "Specific brand · ₹1Cr – ₹2Cr · Immediately", originalSource: "WhatsApp", heardAbout: "Friend / Family Referral", heardAboutOther: "", heardAboutBy: "Himani Bhargava Tapadiya", heardAboutAt: "21 Jan 2026, 18:04", owner: "Himani Bhargava Tapadiya", received: "2 Nov 2026", salesPipeline: true },
  { id: "ENQ-2406", category: "Franchise", name: "Sana Kapoor", mobile: "9810027761", email: "sana.kapoor@example.com", city: "Jaipur", state: "Rajasthan", address: "6 C-Scheme", brand: "FitForge", investment: "₹1Cr – ₹2Cr", status: "Qualified", focus: "FitForge", extra: "Specific brand · ₹1Cr – ₹2Cr · 6–12 months", originalSource: "Direct Enquiry", heardAbout: "Don't Remember", heardAboutOther: "", heardAboutBy: "Customer", heardAboutAt: "20 Jan 2026, 10:41", owner: "Swetha Chintada", received: "31 Oct 2026", salesPipeline: true },
];

export const initialActivities: Activity[] = [
  { id: "ACT-1001", enquiryId: "ENQ-2401", title: "Follow-up call", kind: "call", status: "Completed", due: "12 Nov 2026, 4:00 PM", type: "Phone Call", when: "12 Nov 2026, 4:00 PM", direction: "Outgoing", summary: "Discussed investment and shared the franchise deck.", outcome: "Interested", followUp: "", manual: true, createdBy: "Himani Bhargava Tapadiya", createdAt: "12 Nov 2026, 16:05" },
  { id: "ACT-1002", enquiryId: "ENQ-2403", title: "Discovery meeting", kind: "meeting", status: "Scheduled", due: "13 Nov 2026, 11:00 AM", type: "In-Person Meeting", when: "13 Nov 2026, 11:00 AM", direction: "—", summary: "Initial discussion on brand expansion in South India.", outcome: "Meeting Scheduled", followUp: "13 Nov 2026, 11:00 AM", manual: true, createdBy: "Ekta Pattanaik", createdAt: "12 Nov 2026, 11:20" },
  { id: "ACT-1003", enquiryId: "ENQ-2402", title: "Send proposal", kind: "email", status: "In Progress", due: "14 Nov 2026", type: "Email", when: "14 Nov 2026", direction: "Outgoing", summary: "Share detailed proposal and next steps.", outcome: "Follow-up Required", followUp: "14 Nov 2026", manual: true, createdBy: "Shakshay Gupta", createdAt: "11 Nov 2026, 15:10" },
  { id: "ACT-1004", enquiryId: "ENQ-2405", title: "Follow-up reminder", kind: "follow-up", status: "Pending", due: "14 Nov 2026", type: "WhatsApp Conversation", when: "14 Nov 2026", direction: "Outgoing", summary: "Check on application status and document readiness.", outcome: "Follow-up Required", followUp: "14 Nov 2026", manual: true, createdBy: "Himani Bhargava Tapadiya", createdAt: "11 Nov 2026, 18:06" },
  { id: "ACT-1005", enquiryId: "ENQ-2404", title: "Introductory call", kind: "call", status: "Completed", due: "11 Nov 2026", type: "Phone Call", when: "11 Nov 2026", direction: "Outgoing", summary: "Explained role details and hiring process.", outcome: "Interested", followUp: "", manual: false, createdBy: "Ekta Pattanaik", createdAt: "10 Nov 2026, 16:41" },
  { id: "ACT-1006", enquiryId: "ENQ-2406", title: "Location note", kind: "follow-up", status: "Pending", due: "15 Nov 2026", type: "Other Communication", when: "11 Nov 2026", direction: "—", summary: "Noted her preferred Jaipur neighbourhood after the call.", outcome: "Follow-up Required", followUp: "15 Nov 2026", manual: true, createdBy: "Swetha Chintada", createdAt: "11 Nov 2026, 12:40" },
  { id: "ACT-1007", enquiryId: "ENQ-2401", title: "Note added", kind: "follow-up", status: "Completed", due: "10 Nov 2026, 11:15 AM", type: "Other Communication", when: "10 Nov 2026, 11:15 AM", direction: "—", summary: "Interested in the Kochi region. Will review the deck with family and get back by next week.", outcome: "Interested", followUp: "", manual: true, createdBy: "Himani Bhargava Tapadiya", createdAt: "10 Nov 2026, 11:15 AM" },
];

const sourcePlans: { name: string; detail: string; kind: LeadSource["kind"]; active: boolean; count: number; qualified: number; converted: number }[] = [
  { name: "Website", detail: "Enquiries from official website", kind: "Digital", active: true, count: 18, qualified: 5, converted: 4 },
  { name: "Google Ads", detail: "Leads from Google campaigns", kind: "Digital", active: true, count: 14, qualified: 4, converted: 3 },
  { name: "Facebook", detail: "Leads from Facebook ads & posts", kind: "Digital", active: true, count: 11, qualified: 3, converted: 2 },
  { name: "Instagram", detail: "Leads from Instagram campaigns", kind: "Digital", active: true, count: 9, qualified: 2, converted: 2 },
  { name: "Referral", detail: "Leads from partners, employees or existing owners", kind: "Partner", active: true, count: 7, qualified: 2, converted: 1 },
  { name: "Walk-in", detail: "Direct enquiries at offices or events", kind: "Offline", active: false, count: 5, qualified: 1, converted: 1 },
  { name: "Meta Ads", detail: "Leads from Meta ad campaigns", kind: "Digital", active: true, count: 8, qualified: 2, converted: 1 },
];

const leadFirst = ["Asha", "Rahul", "Meera", "Imran", "Sana", "Kavya", "Arjun", "Devika", "Harish", "Neha", "Omar", "Ritika", "Leela", "Mohit", "Ananya", "Vikram", "Pooja", "Nikhil", "Tara", "Farhan", "Ishita", "Rohan", "Diya", "Kabir", "Naina", "Aditya", "Sara", "Yusuf", "Lakshmi", "Arnav", "Kiara", "Manav", "Zoya", "Harsh", "Inaya"];
const leadLast = ["Menon", "Deshmukh", "Iyer", "Qureshi", "Kapoor", "Nair", "Sethi", "Rao", "Patel", "Kulkarni", "Farooq", "Shah", "Thomas", "Bansal", "Reddy", "Joshi", "Malhotra", "Das", "Pillai", "Khan", "Bose", "Mehta", "Gill", "Chopra", "Varma"];

function leadStatus(index: number, qualified: number, converted: number): SourceLead["status"] {
  if (index < converted) return "Converted";
  if (index < converted + qualified) return "Qualified";
  return index % 2 === 0 ? "New" : "In Progress";
}

const leadInvestments = ["₹50L – ₹1Cr", "₹1Cr – ₹2Cr", "₹25L – ₹50L", "Under ₹25L"];
const leadOwners = ["Himani Bhargava Tapadiya", "Shakshay Gupta", "Swetha Chintada", "Ekta Pattanaik", "Vivek Rawat"];
const leadNotes: Record<SourceLead["status"], string[]> = {
  Converted: ["Deal closed", "Franchise agreed"],
  Qualified: ["Documents requested", "Site visit planned"],
  "In Progress": ["Contract sent", "Follow-up call"],
  New: ["Intro call done", "Deck shared"],
};

function leadDate(index: number) {
  const day = ((index * 3) % 27) + 1;
  const month = index % 2 === 0 ? "Nov" : "Oct";
  const hour = 8 + (index % 10);
  const shown = hour % 12 || 12;
  return {
    date: `${day} ${month} 2026`,
    when: `${day} ${month}, ${shown}:${index % 2 === 0 ? "00" : "30"} ${hour >= 12 ? "PM" : "AM"}`,
  };
}

const leadPlaces: [string, string][] = [
  ["Kochi", "Kerala"],
  ["Pune", "Maharashtra"],
  ["Hyderabad", "Telangana"],
  ["Jaipur", "Rajasthan"],
  ["Bengaluru", "Karnataka"],
  ["Mumbai", "Maharashtra"],
  ["Chennai", "Tamil Nadu"],
  ["Ahmedabad", "Gujarat"],
  ["Kolkata", "West Bengal"],
  ["Lucknow", "Uttar Pradesh"],
];
const leadBrands = ["Brew Theory", "Little Campus", "FitForge", "Daily Bowl", "Northspoon Foods"];
const leadPositions = ["HR Intern", "Store Manager", "Sales Associate", "Accountant"];
const leadIndustries = ["Packaged foods", "Cafe retail", "Education", "Fitness"];

/** Every listed lead. The source counts are these rows, each channel under 100. */
const rawSourceLeads: SourceLead[] = sourcePlans.flatMap((plan, planIndex) =>
  Array.from({ length: plan.count }, (_, index) => {
    const seed = planIndex * 11 + index;
    const name = `${leadFirst[seed % leadFirst.length]} ${leadLast[(seed * 3) % leadLast.length]}`;
    const status = leadStatus(index, plan.qualified, plan.converted);
    const prefixes = ["98470", "98220", "98860", "97000", "98100", "98450", "99860", "90080", "97410", "98330"];
    const digits = `${prefixes[seed % prefixes.length]}${String(10000 + ((seed * 173) % 89999)).padStart(5, "0")}`;
    const stamp = leadDate(seed);
    const category: Enquiry["category"] = index % 8 === 0 ? "Job" : index % 5 === 0 ? "Brand expansion" : "Franchise";
    return {
      id: `SL-${planIndex + 1}-${index + 1}`,
      code: `ENQ-${3101 + planIndex * 40 + index}`,
      category,
      source: plan.name,
      name,
      phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
      email: `${name.split(" ")[0].toLowerCase()}.${name.split(" ")[1][0].toLowerCase()}@example.com`,
      investment: leadInvestments[seed % leadInvestments.length],
      owner: leadOwners[seed % leadOwners.length],
      status,
      date: stamp.date,
      when: stamp.when,
      note: leadNotes[status][seed % 2],
    };
  }),
);

export const sourceLeads: SourceLead[] = rawSourceLeads.map(lead => {
  const match = listedEnquiries.find(item => item.name === lead.name);
  if (!match) return lead;
  const digits = match.mobile.replace(/\D/g, "").slice(-10);
  return {
    ...lead,
    code: match.id,
    category: match.category,
    owner: match.owner,
    status: match.status,
    investment: match.investment,
    email: match.email,
    phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
  };
});

export const initialEnquiries: Enquiry[] = [
  ...listedEnquiries,
  ...sourceLeads.flatMap(lead => {
    if (listedEnquiries.some(item => item.id === lead.code)) return [];
    const serial = Number(lead.code.replace(/\D/g, "")) || 0;
    const [city, state] = leadPlaces[serial % leadPlaces.length];
    const brand = leadBrands[serial % leadBrands.length];
    const position = leadPositions[serial % leadPositions.length];
    const industry = leadIndustries[serial % leadIndustries.length];
    const enquiry: Enquiry = {
      id: lead.code,
      category: lead.category,
      name: lead.name,
      mobile: lead.phone.replace(/\D/g, "").slice(-10),
      email: lead.email,
      city,
      state,
      address: `${12 + (serial % 70)} Main Road`,
      brand: lead.category === "Brand expansion" ? lead.name : brand,
      investment: lead.category === "Franchise" ? lead.investment : "—",
      status: lead.status,
      focus: lead.category === "Job" ? position : lead.category === "Brand expansion" ? industry : brand,
      extra: lead.category === "Job"
        ? "MBA · Fresher · Within 3 months"
        : lead.category === "Brand expansion"
          ? `12 stores · ${industry}`
          : `Specific brand · ${lead.investment} · Within 3 months`,
      resume: lead.category === "Job" ? "Resume received" : undefined,
      originalSource: lead.source,
      heardAbout: "",
      heardAboutOther: "",
      heardAboutBy: "",
      heardAboutAt: "",
      owner: lead.owner,
      received: lead.date,
      salesPipeline: lead.category !== "Job",
    };
    return [enquiry];
  }),
];

export const initialSources: LeadSource[] = sourcePlans.map((plan, index) => {
  const rows = sourceLeads.filter(lead => lead.source === plan.name);
  return {
    id: `SRC-${index + 1}`,
    name: plan.name,
    detail: plan.detail,
    kind: plan.kind,
    active: plan.active,
    leads: rows.length,
    qualified: rows.filter(lead => lead.status === "Qualified" || lead.status === "Converted").length,
    converted: rows.filter(lead => lead.status === "Converted").length,
  };
});
