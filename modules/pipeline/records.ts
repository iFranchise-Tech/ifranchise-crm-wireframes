import type { LeadAdvancedFilters } from "@/modules/leads/components/advanced-lead-filters";
import type { Enquiry } from "@/modules/leads/types";
import type { Opportunity, PipelineConfig, PipelineStage } from "./types";

export type OpportunityDraft = {
  name: string; email: string; phone: string; brand: string; owner: string;
  source: string; value: string; stageId: string; nextAction: string; pipelineId: string;
};

export const stageTransitions: Record<string, string[]> = {
  new: ["rnr", "cold", "lost"], rnr: ["cold", "lost"], cold: ["manager-meeting", "lost"],
  "manager-meeting": ["warm", "lost"], warm: ["brand-meeting", "lost"], "brand-meeting": ["hot", "lost"],
  hot: ["token", "lost"], token: ["won", "lost"], won: [], lost: [],
};

/** Custom stages extend the closing sequence, without bypassing standard checks. */
export function pipelineStageTransitions(stageId: string, stages: PipelineStage[]): string[] {
  const customStages = stages.filter(stage => stage.id.startsWith("custom-"));
  if (stageId === "token" && customStages.length) return [customStages[0].id, "lost"];
  const customIndex = customStages.findIndex(stage => stage.id === stageId);
  if (customIndex !== -1) return [customStages[customIndex + 1]?.id ?? "won", "lost"];
  return (stageTransitions[stageId] ?? []).filter(id => stages.some(stage => stage.id === id));
}

const nextActions: Record<string, string> = {
  new: "Make initial contact", rnr: "Retry call (RNR 1)", cold: "Share brand deck",
  "manager-meeting": "Conduct manager meeting", warm: "Follow up for brand meeting",
  "brand-meeting": "Confirm brand meeting", hot: "Collect token", token: "Review payment",
  won: "Prepare onboarding", lost: "View lost reason",
};

/** Dragging and the stage picker share the same transition and prerequisite checks. */
export function prepareOpportunityMove(item: Opportunity, targetId: string, stages: PipelineStage[], at: string, day: string):
  { error: string } | { requiresLostReason: true } | { opportunity: Opportunity } {
  const target = stages.find(stage => stage.id === targetId);
  if (!target || !pipelineStageTransitions(item.stageId, stages).includes(targetId)) {
    return { error: "Choose an available next stage. Required stages cannot be skipped." };
  }
  if (targetId === "lost") return { requiresLostReason: true };
  if (["manager-meeting", "brand-meeting"].includes(item.stageId) && (!item.meetingComplete || !item.meetingMinutes?.trim())) {
    return { error: `Complete the ${item.stageId === "manager-meeting" ? "manager" : "brand"} meeting and add meeting minutes before moving to ${target.name}.` };
  }
  if (targetId === "won" && (item.verifiedAmount ?? 0) < item.value) {
    return { error: "Finance must verify the full deal amount before this opportunity can be Won." };
  }
  const enteringMeeting = ["manager-meeting", "brand-meeting"].includes(targetId);
  return { opportunity: {
    ...item, stageId: targetId, rnrStep: targetId === "rnr" ? 1 : undefined,
    nextAction: nextActions[targetId] ?? `Follow up for ${target.name}`, lastActivity: "Just now",
    ...(enteringMeeting ? { meetingComplete: false, meetingMinutes: undefined } : {}),
    history: [{ stage: target.name, at, note: targetId === "rnr" ? `RNR update ${day} · RNR 1 · follow-up email queued in prototype; delivery is not connected.` : undefined }, ...item.history],
  } };
}

export function pipelineSummary(items: Opportunity[], now = new Date()) {
  const active = items.filter(item => !["won", "lost"].includes(item.stageId));
  return {
    active: active.length,
    value: active.reduce((sum, item) => sum + item.value, 0),
    hot: items.filter(item => item.stageId === "hot").length,
    token: items.filter(item => item.stageId === "token").length,
    won: items.filter(item => {
      if (item.stageId !== "won") return false;
      const closed = new Date(item.history.find(entry => entry.stage === "Won")?.at ?? "");
      return closed.getFullYear() === now.getFullYear() && closed.getMonth() === now.getMonth();
    }).length,
  };
}

export function validateOpportunity(draft: OpportunityDraft, pipelines: PipelineConfig[], editing = false): string | null {
  if (!draft.name.trim()) return "Enter the customer or enquiry name.";
  const digits = draft.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15 || !/^[+\d()\s-]+$/.test(draft.phone)) return "Enter a valid contact number with 10–15 digits.";
  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) return "Enter a valid email address.";
  if (!draft.brand.trim() || !draft.owner.trim() || !draft.source.trim()) return "Choose a brand, owner and lead source.";
  const pipeline = pipelines.find(item => item.id === draft.pipelineId);
  if (!pipeline) return "Choose a valid pipeline.";
  if (!pipeline.stages.some(stage => stage.id === draft.stageId)) return "Choose a valid pipeline stage.";
  if (!editing && draft.stageId !== "new") return "New opportunities start in New Opportunity.";
  if (!Number.isFinite(Number(draft.value)) || Number(draft.value) <= 0) return "Enter an expected deal value greater than zero.";
  return null;
}

export function matchesOpportunityFilters(item: Opportunity, filters: LeadAdvancedFilters | null, stages: PipelineStage[]): boolean {
  if (!filters) return true;
  const values: Record<string, string> = {
    person: item.name, enquiryId: item.enquiryId, email: item.email, phone: item.phone,
    brand: item.brand, owner: item.owner, source: item.source,
    stage: stages.find(stage => stage.id === item.stageId)?.name ?? item.stageId,
    value: String(item.value), created: item.createdAt, nextAction: item.nextAction,
  };
  return filters.rules.filter(rule => rule.value.trim() || ["is empty", "is not empty"].includes(rule.operator)).every(rule => {
    const actual = values[rule.field] ?? "";
    const expected = rule.value.trim();
    if (rule.operator === "is empty") return !actual.trim();
    if (rule.operator === "is not empty") return Boolean(actual.trim());
    if (rule.field === "created") {
      const left = new Date(actual);
      const right = new Date(`${expected}T00:00:00`);
      if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return false;
      left.setHours(0, 0, 0, 0);
      if (rule.operator === "before") return left < right;
      if (rule.operator === "after") return left > right;
      return left.getTime() === right.getTime();
    }
    const left = actual.trim().toLocaleLowerCase();
    const right = expected.toLocaleLowerCase();
    if (rule.operator === "is not") return left !== right;
    if (rule.operator === "starts with") return left.startsWith(right);
    return left === right;
  });
}

/** Keep the full lead screen tied to the opportunity, including newly added records. */
export function opportunityLead(item: Opportunity, stages: PipelineStage[], original?: Enquiry): Enquiry {
  return {
    category: "Franchise", city: "", state: "", address: "", investment: `₹${item.value.toLocaleString("en-IN")}`,
    status: "New", focus: "", extra: "", heardAbout: "", heardAboutOther: "", heardAboutBy: "", heardAboutAt: "",
    ...original,
    ...item.leadDetails,
    id: item.enquiryId, name: item.name, email: item.email, mobile: item.phone,
    brand: item.brand, owner: item.owner, originalSource: item.source, received: item.createdAt,
    stage: stages.find(stage => stage.id === item.stageId)?.name ?? item.stageId,
    salesPipeline: true,
  };
}
