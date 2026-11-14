export const categories = ["Franchise", "Brand expansion", "Job"] as const;
export type Category = (typeof categories)[number];

export const originalSources = ["Website", "Meta Lead Ads", "WhatsApp", "Phone Call", "Email", "Direct Enquiry"] as const;

export const heardAboutOptions = [
  "Instagram Advertisement",
  "Facebook Advertisement",
  "Google Search",
  "YouTube",
  "Website",
  "WhatsApp",
  "Friend / Family Referral",
  "Existing Customer Referral",
  "LinkedIn",
  "Exhibition / Event",
  "Newspaper / Magazine",
  "Other",
  "Don't Remember",
] as const;

export const activityTypes = ["WhatsApp Conversation", "Phone Call", "Face-to-Face Discussion", "In-Person Meeting", "SMS", "Email", "Other Communication"] as const;
export const outcomes = ["Interested", "Follow-up Required", "Not Interested", "Meeting Scheduled", "Other"] as const;
export const budgetRanges = ["Under ₹10 lakh", "₹10–25 lakh", "₹25–50 lakh", "₹50 lakh–₹1 crore", "Above ₹1 crore"] as const;
export const timelines = ["Immediately", "Within 3 months", "3–6 months", "6–12 months"] as const;
export const brands = ["Brew Theory", "Little Campus", "FitForge", "Daily Bowl", "Northspoon Foods"] as const;
export const enquiryStatuses = ["New", "In Progress", "Qualified", "Converted"] as const;
export type EnquiryStatus = (typeof enquiryStatuses)[number];
export const activityStatuses = ["Completed", "Scheduled", "In Progress", "Pending"] as const;
export type ActivityStatus = (typeof activityStatuses)[number];
export const activityKinds = ["call", "meeting", "email", "follow-up"] as const;
export type ActivityKind = (typeof activityKinds)[number];
export const sourceKinds = ["Digital", "Partner", "Offline"] as const;
export type SourceKind = (typeof sourceKinds)[number];

export type Enquiry = {
  id: string;
  category: Category;
  name: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  address: string;
  brand: string;
  investment: string;
  status: EnquiryStatus;
  focus: string;
  extra: string;
  originalSource: string;
  heardAbout: string;
  heardAboutOther: string;
  heardAboutBy: string;
  heardAboutAt: string;
  owner: string;
  received: string;
  salesPipeline: boolean;
  resume?: string;
};

export type Activity = {
  id: string;
  enquiryId: string;
  title: string;
  kind: ActivityKind;
  status: ActivityStatus;
  due: string;
  type: string;
  when: string;
  direction: "Incoming" | "Outgoing" | "—";
  summary: string;
  outcome: string;
  followUp: string;
  manual: boolean;
  createdBy: string;
  createdAt: string;
  meetLink?: string;
  attachments?: string[];
};

export type SourceLead = {
  id: string;
  code: string;
  source: string;
  category: Category;
  name: string;
  phone: string;
  email: string;
  investment: string;
  owner: string;
  status: "New" | "In Progress" | "Qualified" | "Converted";
  date: string;
  when: string;
  note: string;
};

export type LeadSource = {
  id: string;
  name: string;
  detail: string;
  kind: SourceKind;
  leads: number;
  qualified: number;
  converted: number;
  active: boolean;
};
