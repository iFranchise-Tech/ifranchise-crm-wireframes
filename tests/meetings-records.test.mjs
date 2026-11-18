import test from "node:test";
import assert from "node:assert/strict";
import { canViewRecord, changeFollowUp, changeMeeting, collectReminders, createFollowUp, createMeeting, defaultSettings, followUpStatus, fromIst, istParts, meetingProfiles, reminderIsCurrent, updateReminderSettings } from "../modules/meetings/records.ts";

const now = Date.parse("2026-11-18T06:00:00Z");
const later = new Date(now + 3600000).toISOString();
const admin = meetingProfiles[0], sales = meetingProfiles.find(item => item.id === "sales"), manager = meetingProfiles.find(item => item.id === "shakshay"), mis = meetingProfiles.find(item => item.id === "mis");
const customer = { id: "ENQ-2401", name: "Asha Menon", owner: sales.name, email: "asha@example.com", brand: "Brew Theory", category: "Franchise", opportunityId: "OPP-1001" };
const other = { ...customer, id: "ENQ-2", owner: "Swetha Chintada", opportunityId: "OPP-2" };
const state = () => ({ records: [customer, other], followUps: [], meetings: [], notifications: [], settings: structuredClone(defaultSettings) });
const draft = () => ({ recordId: customer.id, linkType: "Enquiry", title: "Confirm budget", description: "Discuss the requested investment range.", assignedTo: sales.name, dueAt: later, priority: "High", source: { id: "ACT-1", recordId: customer.id, title: "WhatsApp discussion", type: "WhatsApp Conversation", when: "18 Nov 2026" } });
const meetingDraft = () => ({ recordId: customer.id, opportunityId: customer.opportunityId, title: "Investment discussion", category: "Manager meeting", format: "Virtual", startAt: later, duration: 30, assignedTo: sales.name, participants: [sales.name, manager.name], manager: manager.name, brandRepresentative: "", brandEmail: "", customerEmail: customer.email, agenda: "Review investment and agree next steps", remarks: "", location: "", address: "", meetLink: "" });

test("IST date entry is timezone-independent and rejects impossible dates", () => {
  assert.equal(fromIst("2026-11-18", "11:30"), "2026-11-18T06:00:00.000Z");
  assert.deepEqual(istParts(now), { date: "2026-11-18", time: "11:30" });
  for (const date of ["2026-02-30", "bad", "2026-13-01"]) assert.equal(fromIst(date, "11:30"), "");
});
test("follow-up creation validates required fields, linked activity and employee scope", () => {
  for (const key of ["title", "description", "dueAt", "assignedTo", "recordId"]) assert.throws(() => createFollowUp(state(), sales, { ...draft(), [key]: "" }, now));
  assert.throws(() => createFollowUp(state(), sales, { ...draft(), source: { ...draft().source, recordId: "ENQ-2" } }, now), /activity/);
  assert.throws(() => createFollowUp(state(), sales, { ...draft(), assignedTo: other.owner }, now), /scope/);
  assert.equal(createFollowUp(state(), sales, draft(), now).followUps[0].source.type, "WhatsApp Conversation");
});
test("employees see assigned customers, managers see their team, and MIS cannot mutate", () => {
  assert.equal(canViewRecord(sales, customer), true); assert.equal(canViewRecord(sales, other), false);
  assert.equal(canViewRecord(manager, customer), true); assert.equal(canViewRecord(manager, other), false);
  assert.equal(canViewRecord(mis, other), true);
  assert.throws(() => createFollowUp(state(), mis, draft(), now), /permission/);
  const created = createFollowUp(state(), admin, { ...draft(), recordId: other.id, source: undefined }, now);
  assert.throws(() => changeFollowUp(created, sales, created.followUps[0].id, { type: "complete", outcome: "Done" }, now), /permission/);
});
test("overdue persists until completion, cancellation or audited rescheduling", () => {
  let current = createFollowUp(state(), sales, draft(), now); const id = current.followUps[0].id;
  assert.equal(followUpStatus(current.followUps[0], now + 3600001), "Overdue");
  assert.equal(followUpStatus(current.followUps[0], now + 30 * 86400000), "Overdue");
  assert.throws(() => changeFollowUp(current, sales, id, { type: "complete", outcome: " " }, now), /outcome/);
  const rescheduledAt = new Date(now + 7200000).toISOString();
  current = changeFollowUp(current, sales, id, { type: "reschedule", dueAt: rescheduledAt, reason: "Customer requested later" }, now + 3600001);
  assert.equal(followUpStatus(current.followUps[0], now + 3600001), "Pending");
  assert.match(current.followUps[0].history.at(-1).detail, /→/); assert.equal(current.followUps[0].version, 2);
  current = changeFollowUp(current, manager, id, { type: "reassign", assignedTo: manager.name, reason: "Manager follow-up" }, now);
  assert.match(current.followUps[0].history.at(-1).detail, /Himani.*Shakshay/);
  current = changeFollowUp(current, manager, id, { type: "complete", outcome: "Budget confirmed" }, now);
  assert.equal(followUpStatus(current.followUps[0], now + 999999999), "Completed");
  assert.equal(current.followUps[0].outcome, "Budget confirmed");
  assert.throws(() => changeFollowUp(current, manager, id, { type: "cancel", reason: "No longer needed" }, now), /closed/);
});
test("reminders deduplicate and obsolete schedules or closed follow-ups stop active notifications", () => {
  let current = createFollowUp(state(), sales, draft(), now); const id = current.followUps[0].id;
  current = collectReminders(current, now + 31 * 60000);
  assert.equal(current.notifications.length, 1);
  assert.equal(collectReminders(current, now + 32 * 60000).notifications.length, 1);
  current = changeFollowUp(current, sales, id, { type: "reschedule", dueAt: new Date(now + 120 * 60000).toISOString(), reason: "Customer unavailable" }, now + 32 * 60000);
  assert.equal(reminderIsCurrent(current, current.notifications[0].id), false);
  current = collectReminders(current, now + 136 * 60000);
  assert.equal(current.notifications.at(-1).phase, "overdue");
  current = changeFollowUp(current, sales, id, { type: "cancel", reason: "Customer declined" }, now + 137 * 60000);
  assert.equal(reminderIsCurrent(current, current.notifications.at(-1).id), false);
  assert.equal(collectReminders(current, now + 999999999).notifications.length, current.notifications.length);
});
test("only admins can set reminder timing and changes retain the old and new policy", () => {
  const settings = { meetings: defaultSettings.meetings, followUps: { before: [10], atTime: false, overdueAfter: 20 } };
  assert.throws(() => updateReminderSettings(state(), manager, settings, now), /administrators/);
  assert.throws(() => updateReminderSettings(state(), admin, { ...settings, followUps: { ...settings.followUps, before: [NaN] } }, now));
  const updated = updateReminderSettings(state(), admin, settings, now);
  assert.match(updated.settings.history[0].detail, /30.*10/);
});
test("meeting validation requires valid opportunity, participants and conditional format details", () => {
  for (const patch of [{ opportunityId: "wrong" }, { participants: [] }, { customerEmail: "bad" }, { meetLink: "https://example.com" }, { format: "In person", location: "", address: "" }, { category: "Brand meeting", brandRepresentative: "", brandEmail: "" }]) assert.throws(() => createMeeting(state(), sales, { ...meetingDraft(), ...patch }, now));
  const result = createMeeting(state(), sales, meetingDraft(), now);
  assert.equal(result.meetings[0].status, "Pending sync"); assert.equal(result.meetings[0].meetLink, "");
  assert.match(result.meetings[0].history[0].detail, /invitations pending/);
});
test("CRM meeting conflicts reject overlapping customers or participants but allow adjacent slots", () => {
  const current = createMeeting(state(), sales, meetingDraft(), now);
  assert.throws(() => createMeeting(current, sales, meetingDraft(), now), /already has/);
  assert.equal(createMeeting(current, sales, { ...meetingDraft(), startAt: new Date(Date.parse(later) + 30 * 60000).toISOString() }, now).meetings.length, 2);
  const cancelled = changeMeeting(current, sales, current.meetings[0].id, { type: "cancel", reason: "No longer needed" }, now);
  assert.equal(createMeeting(cancelled, sales, meetingDraft(), now).meetings.length, 2);
});
test("meeting outcomes are explicit; minutes keep immutable versions and manager reviews", () => {
  let current = createMeeting(state(), sales, meetingDraft(), now); const id = current.meetings[0].id;
  assert.throws(() => changeMeeting(current, sales, id, { type: "outcome", outcome: "Conducted", remarks: "Met" }, now), /after/);
  current = changeMeeting(current, sales, id, { type: "outcome", outcome: "Conducted", remarks: "Met and reviewed the investment" }, now + 7200000);
  assert.equal(current.meetings[0].status, "Awaiting MOM");
  const minutes = { summary: "Discussed budget", requirements: "Cafe", businessRequirements: "Ground floor", concerns: "None raised", investment: "50 lakh", interest: "High", nextSteps: "Share deck", remarks: "", nextFollowUpAt: "" };
  current = changeMeeting(current, sales, id, { type: "minutes", minutes }, now + 7200000);
  const original = structuredClone(current.meetings[0].minutes[0]);
  current = changeMeeting(current, sales, id, { type: "minutes", minutes: { ...minutes, summary: "Corrected budget discussion" } }, now + 7300000);
  assert.deepEqual(current.meetings[0].minutes[0], original); assert.equal(current.meetings[0].minutes[1].version, 2);
  assert.throws(() => changeMeeting(current, sales, id, { type: "review", comment: "Reviewed" }, now + 7400000), /manager/);
  current = changeMeeting(current, manager, id, { type: "review", comment: "Proceed with the next action" }, now + 7400000);
  assert.equal(current.meetings[0].minutes[1].review.author, manager.name);
  assert.throws(() => changeMeeting(current, manager, id, { type: "reschedule", startAt: later, reason: "Change" }, now), /conducted/);
});
