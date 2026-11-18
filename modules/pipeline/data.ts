import { initialEnquiries } from "@/modules/leads/data";
import type { Opportunity, PipelineConfig, PipelineStage } from "./types";

export const initialStages: PipelineStage[] = [
  { id: "new", name: "New Opportunity", probability: 5, category: "Open", color: "blue", children: [] },
  { id: "rnr", name: "RNR", probability: 5, category: "Open", color: "purple", children: Array.from({ length: 8 }, (_, index) => `RNR ${index + 1}`) },
  { id: "cold", name: "Cold", probability: 10, category: "Open", color: "slate", children: [] },
  { id: "manager-meeting", name: "Manager Meeting", probability: 25, category: "Open", color: "amber", children: [] },
  { id: "warm", name: "Warm", probability: 40, category: "Open", color: "orange", children: [] },
  { id: "brand-meeting", name: "Brand Meeting", probability: 60, category: "Open", color: "violet", children: [] },
  { id: "hot", name: "Hot", probability: 80, category: "Open", color: "rose", children: [] },
  { id: "token", name: "Token Collected", probability: 90, category: "Open", color: "green", children: [] },
  { id: "won", name: "Won", probability: 100, category: "Closed - Won", color: "green", children: [] },
  { id: "lost", name: "Lost", probability: 0, category: "Closed - Lost", color: "red", children: [] },
];

export const initialPipelines: PipelineConfig[] = [
  { id: "franchise", name: "Franchise Sales Pipeline", description: "Primary pipeline for franchise sales opportunities, from enquiry to deal closure.", stages: initialStages, isDefault: true },
  { id: "brand-partnership", name: "Brand Partnership Pipeline", description: "Pipeline for brand partnerships and collaboration opportunities.", stages: initialStages, isDefault: false },
  { id: "expansion", name: "Expansion Pipeline", description: "Pipeline for existing franchise expansion and multi-unit opportunities.", stages: initialStages, isDefault: false },
];

const amounts: Record<string, number> = {
  "Under ₹25L": 1800000,
  "₹25L – ₹50L": 3500000,
  "₹50L – ₹1Cr": 7500000,
  "₹1Cr – ₹2Cr": 15000000,
  "₹2Cr+": 25000000,
};

const stages = ["new", "rnr", "cold", "manager-meeting", "warm", "brand-meeting", "hot", "token", "won", "lost"];
const actionByStage: Record<string, string> = {
  new: "Make initial contact", rnr: "Retry call (RNR 1)", cold: "Share brand deck", "manager-meeting": "Conduct manager meeting", warm: "Follow up for brand meeting", "brand-meeting": "Confirm brand meeting", hot: "Collect token", token: "Review payment", won: "Prepare onboarding", lost: "View lost reason",
};

export const initialOpportunities: Opportunity[] = initialEnquiries
  .filter(enquiry => enquiry.category !== "Job")
  .slice(0, 42)
  .map((enquiry, index) => {
    const stageId = index === 0 ? "new" : stages[(index * 7 + Math.floor(index / 3)) % stages.length];
    const stageName = initialStages.find(stage => stage.id === stageId)?.name ?? "New Opportunity";
    return {
      id: `OPP-${String(1001 + index)}`,
      pipelineId: "franchise",
      enquiryId: enquiry.id,
      name: enquiry.name,
      email: enquiry.email,
      phone: `+91 ${enquiry.mobile.slice(0, 5)} ${enquiry.mobile.slice(5)}`,
      brand: enquiry.brand,
      owner: enquiry.owner,
      source: enquiry.originalSource,
      stageId,
      rnrStep: stageId === "rnr" ? (index % 8) + 1 : undefined,
      value: amounts[enquiry.investment] ?? (enquiry.investment.includes("2Cr") ? 25000000 : 7500000),
      createdAt: enquiry.received,
      lastActivity: index === 0 ? "Today, 11:20 AM" : `${index % 2 ? "Yesterday" : "Today"}, ${9 + index % 9}:00 AM`,
      nextAction: actionByStage[stageId],
      meetingComplete: stageId === "warm" || stageId === "hot" || stageId === "token" || stageId === "won",
      meetingMinutes: stageId === "warm" || stageId === "hot" || stageId === "token" || stageId === "won" ? "Discussed investment, location and next steps." : undefined,
      verifiedAmount: stageId === "won" ? (amounts[enquiry.investment] ?? 7500000) : stageId === "token" ? 100000 : 0,
      payments: stageId === "token" || stageId === "won" ? [{ id: `PAY-${index}`, amount: stageId === "won" ? (amounts[enquiry.investment] ?? 7500000) : 100000, date: enquiry.received, reference: `TXN${index + 2400}`, verified: true }] : [],
      lostReason: stageId === "lost" ? "Not Interested" : undefined,
      history: [{ stage: stageName, at: enquiry.received }],
    } satisfies Opportunity;
  });

export const lostReasons = ["Budget Not Qualified", "Multiple RNR Attempts", "No Immediate Requirement", "Invested Elsewhere", "Not Interested", "Real Estate Owner", "Broker", "Other"];
export const brands = [...new Set(initialOpportunities.map(opportunity => opportunity.brand))].sort();
export const owners = [...new Set(initialOpportunities.map(opportunity => opportunity.owner))].sort();

