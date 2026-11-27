import type { Enquiry } from "../leads/types";

export type Priority = "High" | "Medium" | "Low";
export type CustomerRecord = { id: string; name: string; email: string; owner: string; brand: string; category: string; opportunityId?: string; snapshot?: Enquiry };
export type ActivitySource = { id: string; recordId: string; title: string; type: string; when: string };
export type AuditEvent = { id: string; action: string; at: string; actor: string; detail: string };
export type FollowUp = {
  id: string; recordId: string; linkType: "Contact" | "Enquiry" | "Opportunity";
  title: string; description: string; assignedTo: string; dueAt: string; priority: Priority;
  status: "Pending" | "Completed" | "Cancelled"; outcome: string; source?: ActivitySource;
  version: number; createdAt: string; history: AuditEvent[];
};
export type MeetingCategory = "Manager meeting" | "Brand meeting" | "Follow-up meeting";
export type MeetingPlatform = "Google Meet" | "Zoom" | "Microsoft Teams";
export type MeetingAssistant = "None" | "Rube" | "Aether" | "Syntax" | "Theo" | "Clara";
export type MeetingStatus = "Pending sync" | "Scheduled" | "Rescheduled" | "Awaiting MOM" | "MOM submitted" | "Postponed" | "Customer did not attend" | "Internal participant did not attend" | "Cancelled";
export type Minutes = {
  summary: string; requirements: string; businessRequirements: string; concerns: string;
  investment: string; interest: string; nextSteps: string; remarks: string; nextFollowUpAt: string;
  version: number; author: string; at: string; review?: { author: string; at: string; comment: string };
};
export type Meeting = {
  id: string; recordId: string; opportunityId: string; title: string; category: MeetingCategory;
  format: "Virtual" | "In person"; platform?: MeetingPlatform; assistant?: MeetingAssistant; summarizeCall?: boolean; captureActionItems?: boolean; assistLive?: boolean; startAt: string; duration: number; assignedTo: string;
  participants: string[]; manager: string; brandRepresentative: string; brandEmail: string; customerEmail: string;
  agenda: string; remarks: string; location: string; address: string; meetLink: string;
  status: MeetingStatus; outcome: string; version: number; createdAt: string;
  minutes: Minutes[]; history: AuditEvent[];
};
export type ReminderPolicy = { before: number[]; atTime: boolean; overdueAfter: number | null };
export type ReminderSettings = { followUps: ReminderPolicy; meetings: ReminderPolicy; history: AuditEvent[] };
export type Reminder = { id: string; entityId: string; kind: "meeting" | "follow-up"; recordId: string; version: number; phase: string; dueAt: string; createdAt: string; title: string; readBy: string[]; archivedBy?: string[]; deletedBy?: string[]; starredBy?: string[] };
export type MeetingsState = { records: CustomerRecord[]; followUps: FollowUp[]; meetings: Meeting[]; settings: ReminderSettings; notifications: Reminder[] };
export type MeetingProfile = { id: string; name: string; title: string; scope: "organization" | "team" | "own"; members: string[]; readOnly?: boolean; admin?: boolean };
export type FollowUpDraft = Pick<FollowUp, "recordId" | "linkType" | "title" | "description" | "assignedTo" | "dueAt" | "priority" | "source">;
export type MeetingDraft = Omit<Meeting, "id" | "status" | "outcome" | "version" | "createdAt" | "minutes" | "history">;
export type FollowUpAction = { type: "reschedule"; dueAt: string; reason: string } | { type: "reassign"; assignedTo: string; reason: string } | { type: "complete"; outcome: string } | { type: "cancel"; reason: string };
export type MeetingAction = { type: "reschedule"; startAt: string; reason: string } | { type: "cancel" | "postpone"; reason: string } | { type: "outcome"; outcome: "Conducted" | "Customer did not attend" | "Internal participant did not attend" | "Customer requested rescheduling"; remarks: string } | { type: "minutes"; minutes: Omit<Minutes, "version" | "author" | "at" | "review"> } | { type: "review"; comment: string };
