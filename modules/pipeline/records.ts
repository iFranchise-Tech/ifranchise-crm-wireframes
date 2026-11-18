import type { LeadAdvancedFilters } from "@/modules/leads/components/advanced-lead-filters";
import type { Enquiry } from "@/modules/leads/types";
import type { Opportunity, PipelineConfig, PipelineStage } from "./types";

export type OpportunityDraft = {
  name: string; email: string; phone: string; brand: string; owner: string;
  source: string; value: string; stageId: string; nextAction: string; pipelineId: string;
};

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
