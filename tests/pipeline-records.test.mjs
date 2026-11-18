import test from "node:test";
import assert from "node:assert/strict";
import { matchesOpportunityFilters, opportunityLead, validateOpportunity } from "../modules/pipeline/records.ts";

const stages = [{ id: "new", name: "New Opportunity" }, { id: "cold", name: "Cold" }];
const pipelines = [{ id: "franchise", stages }];
const draft = { name: "Asha Menon", phone: "+91 98470 11201", email: "", brand: "Brew Theory", owner: "Himani", source: "Website", pipelineId: "franchise", stageId: "new", value: "7500000", nextAction: "" };
const opportunity = { ...draft, id: "OPP-1001", enquiryId: "ENQ-2401", value: 7500000, createdAt: "2026-11-10T10:30:00", history: [] };
const filters = rules => ({ match: "all", rules });

test("opportunity creation requires contact and commercial details, with email and next action optional", () => {
  assert.equal(validateOpportunity(draft, pipelines), null);
  for (const field of ["name", "phone", "brand", "owner", "source", "pipelineId", "stageId", "value"]) {
    assert.ok(validateOpportunity({ ...draft, [field]: "" }, pipelines), field);
  }
  for (const phone of ["123", "1234567890123456", "abcdefghij1234567890"]) assert.ok(validateOpportunity({ ...draft, phone }, pipelines));
  for (const value of ["0", "-1", "Infinity", "NaN"]) assert.ok(validateOpportunity({ ...draft, value }, pipelines));
  assert.ok(validateOpportunity({ ...draft, email: "asha@example" }, pipelines));
  assert.equal(validateOpportunity({ ...draft, email: "asha@example.com" }, pipelines), null);
});

test("new opportunities cannot skip to a later stage, but editing preserves a valid existing stage", () => {
  assert.ok(validateOpportunity({ ...draft, stageId: "cold" }, pipelines));
  assert.equal(validateOpportunity({ ...draft, stageId: "cold" }, pipelines, true), null);
  assert.ok(validateOpportunity({ ...draft, stageId: "unknown" }, pipelines, true));
});

test("advanced filters require every criterion, including previously saved any-mode filters", () => {
  const rules = [{ field: "brand", operator: "is", value: " brew theory " }, { field: "stage", operator: "is", value: "Cold" }];
  assert.equal(matchesOpportunityFilters(opportunity, filters(rules), stages), false);
  assert.equal(matchesOpportunityFilters(opportunity, { match: "any", rules }, stages), false);
  assert.equal(matchesOpportunityFilters(opportunity, filters([{ ...rules[0] }, { field: "person", operator: "starts with", value: "ASHA" }]), stages), true);
});

test("filters compare calendar dates, empty fields, and the configured stage name", () => {
  for (const rule of [
    { field: "created", operator: "is", value: "2026-11-10" },
    { field: "created", operator: "before", value: "2026-11-11" },
    { field: "created", operator: "after", value: "2026-11-09" },
    { field: "email", operator: "is empty", value: "" },
    { field: "stage", operator: "is", value: "New Opportunity" },
  ]) assert.equal(matchesOpportunityFilters(opportunity, filters([rule]), stages), true, rule.field);
  assert.equal(matchesOpportunityFilters(opportunity, filters([{ field: "created", operator: "is", value: "invalid" }]), stages), false);
});

test("full lead details use the current opportunity identity and retain edited lead properties", () => {
  const result = opportunityLead({ ...opportunity, stageId: "cold", leadDetails: { name: "Stale name", stage: "Won", address: "14 Marine Drive" } }, stages, { city: "Kochi", name: "Old name", owner: "Old owner" });
  assert.equal(result.id, opportunity.enquiryId);
  assert.equal(result.name, opportunity.name);
  assert.equal(result.owner, opportunity.owner);
  assert.equal(result.stage, "Cold");
  assert.equal(result.address, "14 Marine Drive");
  assert.equal(result.city, "Kochi");
  assert.equal(opportunityLead(opportunity, stages).salesPipeline, true);
});
