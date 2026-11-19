import test from "node:test";
import assert from "node:assert/strict";
import { matchesOpportunityFilters, opportunityLead, pipelineSummary, pipelineStageTransitions, prepareOpportunityMove, validateOpportunity } from "../modules/pipeline/records.ts";

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

const flowStages = [
  ...stages, { id: "rnr", name: "RNR" }, { id: "manager-meeting", name: "Manager Meeting" },
  { id: "warm", name: "Warm" }, { id: "brand-meeting", name: "Brand Meeting" },
  { id: "hot", name: "Hot" }, { id: "token", name: "Token Collected" },
  { id: "won", name: "Won" }, { id: "lost", name: "Lost" },
];
const move = (item, target) => prepareOpportunityMove(item, target, flowStages, "2026-11-18T08:00:00.000Z", "2026-11-18");

test("card moves update stage, next action and history without mutating the original record", () => {
  const result = move(opportunity, "rnr");
  assert.equal(result.opportunity.stageId, "rnr");
  assert.equal(result.opportunity.rnrStep, 1);
  assert.equal(result.opportunity.nextAction, "Retry call (RNR 1)");
  assert.equal(result.opportunity.lastActivity, "Just now");
  assert.match(result.opportunity.history[0].note, /RNR update 2026-11-18/);
  assert.equal(opportunity.stageId, "new");
  assert.equal(opportunity.history.length, 0);
  assert.equal(move(opportunity, "cold").opportunity.nextAction, "Share brand deck");
});

test("drag moves reject skipped, unknown, same and closed stages; loss requires its reason dialog", () => {
  for (const target of ["new", "hot", "won", "missing"]) assert.ok(move(opportunity, target).error);
  for (const stageId of ["won", "lost"]) assert.ok(move({ ...opportunity, stageId }, "new").error);
  assert.deepEqual(move(opportunity, "lost"), { requiresLostReason: true });
});

test("moving cards enforces meeting notes and resets completion for the next meeting", () => {
  for (const [stageId, target] of [["manager-meeting", "warm"], ["brand-meeting", "hot"]]) {
    assert.match(move({ ...opportunity, stageId }, target).error, /meeting minutes/);
    assert.ok(move({ ...opportunity, stageId, meetingComplete: true, meetingMinutes: " " }, target).error);
    assert.equal(move({ ...opportunity, stageId, meetingComplete: true, meetingMinutes: "Discussed location" }, target).opportunity.stageId, target);
  }
  const entered = move({ ...opportunity, stageId: "warm", meetingComplete: true, meetingMinutes: "Old meeting" }, "brand-meeting").opportunity;
  assert.equal(entered.meetingComplete, false);
  assert.equal(entered.meetingMinutes, undefined);
});

test("a card cannot become Won until its entire deal value is verified", () => {
  const token = { ...opportunity, stageId: "token" };
  assert.match(move({ ...token, verifiedAmount: 100000 }, "won").error, /verify the full deal amount/);
  assert.equal(move({ ...token, verifiedAmount: opportunity.value }, "won").opportunity.stageId, "won");
});

test("quick overview reflects its input records and counts wins by closure month", () => {
  const items = [opportunity, { ...opportunity, stageId: "hot" }, { ...opportunity, stageId: "token" },
    { ...opportunity, stageId: "won", history: [{ stage: "Won", at: "2026-11-02T10:00:00" }] },
    { ...opportunity, stageId: "won", history: [{ stage: "Won", at: "2026-10-31T10:00:00" }] },
    { ...opportunity, stageId: "lost" }];
  assert.deepEqual(pipelineSummary(items, new Date("2026-11-18T10:00:00")), { active: 3, value: 22500000, hot: 1, token: 1, won: 1 });
  assert.deepEqual(pipelineSummary([], new Date("2026-11-18T10:00:00")), { active: 0, value: 0, hot: 0, token: 0, won: 0 });
});


test("custom closing stages are reachable in order and cannot bypass verified payment", () => {
  const configuredStages = [
    { id: "token", name: "Token Collected" },
    { id: "custom-review", name: "Final review" },
    { id: "custom-signature", name: "Signature" },
    { id: "won", name: "Won" },
    { id: "lost", name: "Lost" },
  ];
  assert.deepEqual(pipelineStageTransitions("token", configuredStages), ["custom-review", "lost"]);
  assert.deepEqual(pipelineStageTransitions("custom-review", configuredStages), ["custom-signature", "lost"]);
  assert.deepEqual(pipelineStageTransitions("custom-signature", configuredStages), ["won", "lost"]);
  assert.deepEqual(pipelineStageTransitions("won", configuredStages), []);
  const move = (stageId, target, verifiedAmount = 0) => prepareOpportunityMove({ ...opportunity, stageId, verifiedAmount }, target, configuredStages, "2026-11-18", "2026-11-18");
  assert.ok(move("token", "won").error);
  assert.equal(move("token", "custom-review").opportunity.stageId, "custom-review");
  assert.ok(move("custom-signature", "won").error);
  assert.equal(move("custom-signature", "won", opportunity.value).opportunity.stageId, "won");
  assert.deepEqual(move("custom-review", "lost"), { requiresLostReason: true });
});
