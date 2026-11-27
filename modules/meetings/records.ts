import type { AuditEvent, CustomerRecord, FollowUp, FollowUpAction, FollowUpDraft, Meeting, MeetingAction, MeetingDraft, MeetingProfile, MeetingsState, ReminderPolicy, ReminderSettings } from "./types.ts";

// Explicit review profiles. Production authorization must be enforced by the API.
export const meetingProfiles: MeetingProfile[] = [
  { id: "ceo", name: "Mohammad Abrar", title: "Superadmin", scope: "organization", members: [], admin: true },
  { id: "sumanth", name: "Gangaram Sumanth Reddy", title: "Superadmin", scope: "organization", members: [], admin: true },
  { id: "shakshay", name: "Shakshay Gupta", title: "Sales Manager", scope: "team", members: ["Shakshay Gupta", "Himani Bhargava Tapadiya"] },
  { id: "swetha", name: "Swetha Chintada", title: "Sales Manager", scope: "team", members: ["Swetha Chintada"] },
  { id: "shiwali", name: "Shiwali Singh", title: "Sales Manager", scope: "team", members: ["Shiwali Singh"] },
  { id: "sales", name: "Himani Bhargava Tapadiya", title: "Sales / BDA", scope: "own", members: ["Himani Bhargava Tapadiya"] },
  { id: "mis", name: "MIS reporting", title: "MIS · Read only", scope: "organization", members: [], readOnly: true },
  { id: "leadership", name: "Leadership reporting", title: "Leadership · Read only", scope: "organization", members: [], readOnly: true },
  { id: "hr", name: "Ekta Pattanaik", title: "HR · Assigned records", scope: "own", members: ["Ekta Pattanaik"] },
  { id: "assignment-coordinator", name: "Anitha K", title: "Lead Coordinator", scope: "own", members: ["Anitha K"] },
];
export const defaultSettings: ReminderSettings = {
  followUps: { before: [30], atTime: true, overdueAfter: 15 },
  meetings: { before: [60, 30, 5], atTime: true, overdueAfter: null }, history: [],
};
export function canViewRecord(profile: MeetingProfile, record?: CustomerRecord) {
  return !!record && (profile.scope === "organization" || profile.members.includes(record.owner));
}
export function canManageRecord(profile: MeetingProfile, record?: CustomerRecord) { return !profile.readOnly && canViewRecord(profile, record); }
export function assigneesFor(profile: MeetingProfile, records: CustomerRecord[]) {
  return [...new Set(profile.scope === "organization" ? [...records.map(record => record.owner), ...meetingProfiles.filter(item => !item.readOnly).map(item => item.name)] : profile.members)].filter(Boolean);
}
export function followUpStatus(item: FollowUp, now: number) { return item.status === "Pending" && Date.parse(item.dueAt) <= now ? "Overdue" : item.status; }
export function istParts(value: string | number) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return { date: "", time: "" };
  const local = new Date(date.getTime() + 330 * 60_000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}
export function fromIst(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return "";
  const result = new Date(`${date}T${time}:00+05:30`);
  if (!Number.isFinite(result.getTime())) return "";
  const parts = istParts(result.getTime());
  return parts.date === date && parts.time === time ? result.toISOString() : "";
}
export function displayTime(value: string) { return new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); }
function required(value: string, label: string) { if (!value?.trim()) throw new Error(`${label} is required.`); }
function future(value: string, now: number) { if (!Number.isFinite(Date.parse(value)) || Date.parse(value) <= now) throw new Error("Choose a future date and time (India Standard Time)."); }
function authorize(state: MeetingsState, profile: MeetingProfile, recordId: string) {
  const record = state.records.find(item => item.id === recordId);
  if (!canManageRecord(profile, record)) throw new Error("You do not have permission to manage this customer's records.");
  return record!;
}
function assignee(state: MeetingsState, profile: MeetingProfile, value: string) {
  if (!assigneesFor(profile, state.records).includes(value)) throw new Error("Select an employee within your authorised scope.");
}
export function audit(action: string, detail: string, actor: string, now: number): AuditEvent {
  return { id: `EV-${crypto.randomUUID()}`, action, detail, actor, at: new Date(now).toISOString() };
}
export function createFollowUp(state: MeetingsState, profile: MeetingProfile, draft: FollowUpDraft, now = Date.now()): MeetingsState {
  const record = authorize(state, profile, draft.recordId);
  required(draft.title, "Title"); required(draft.description, "Description"); future(draft.dueAt, now); assignee(state, profile, draft.assignedTo);
  if (!["High", "Medium", "Low"].includes(draft.priority)) throw new Error("Select a priority.");
  if (!["Contact", "Enquiry", "Opportunity"].includes(draft.linkType) || (draft.linkType === "Opportunity" && !record.opportunityId)) throw new Error("Choose a valid linked record.");
  if (draft.source && draft.source.recordId !== draft.recordId) throw new Error("The activity must belong to the selected customer.");
  const item: FollowUp = { ...draft, title: draft.title.trim(), description: draft.description.trim(), id: `FU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: "Pending", outcome: "", version: 1, createdAt: new Date(now).toISOString(), history: [audit("Follow-up created", `${draft.title} · Assigned to ${draft.assignedTo} · Due ${displayTime(draft.dueAt)} IST${draft.source ? ` · From ${draft.source.type}: ${draft.source.title} (${draft.source.id})` : ""}`, profile.name, now)] };
  return { ...state, followUps: [item, ...state.followUps] };
}
export function changeFollowUp(state: MeetingsState, profile: MeetingProfile, id: string, action: FollowUpAction, now = Date.now()): MeetingsState {
  const item = state.followUps.find(row => row.id === id);
  if (!item) throw new Error("Follow-up not found.");
  authorize(state, profile, item.recordId);
  if (item.status !== "Pending") throw new Error("This follow-up is closed. Create a new follow-up for the next action.");
  let patch: Partial<FollowUp> = {}; let event: AuditEvent;
  if (action.type === "reschedule") {
    future(action.dueAt, now); required(action.reason, "Rescheduling reason");
    if (action.dueAt === item.dueAt) throw new Error("Choose a different date or time.");
    patch = { dueAt: action.dueAt, version: item.version + 1 };
    event = audit("Follow-up rescheduled", `${displayTime(item.dueAt)} → ${displayTime(action.dueAt)} IST · ${action.reason}`, profile.name, now);
  } else if (action.type === "reassign") {
    required(action.reason, "Reassignment reason"); assignee(state, profile, action.assignedTo);
    if (action.assignedTo === item.assignedTo) throw new Error("Select a different employee.");
    patch = { assignedTo: action.assignedTo };
    event = audit("Follow-up reassigned", `${item.assignedTo} → ${action.assignedTo} · ${action.reason}`, profile.name, now);
  } else if (action.type === "complete") {
    required(action.outcome, "Completion outcome"); patch = { status: "Completed", outcome: action.outcome.trim() };
    event = audit("Follow-up completed", action.outcome.trim(), profile.name, now);
  } else {
    required(action.reason, "Cancellation reason"); patch = { status: "Cancelled" };
    event = audit("Follow-up cancelled", action.reason.trim(), profile.name, now);
  }
  return { ...state, followUps: state.followUps.map(row => row.id === id ? { ...row, ...patch, history: [...row.history, event] } : row) };
}
export const meetingReschedulable = (meeting: Meeting) => ["Pending sync", "Scheduled", "Rescheduled", "Postponed", "Customer did not attend", "Internal participant did not attend"].includes(meeting.status);
export function meetingConflict(meetings: Meeting[], draft: Pick<Meeting, "startAt" | "duration" | "participants" | "recordId">, excludedId?: string) {
  const start = Date.parse(draft.startAt), end = start + draft.duration * 60_000;
  return meetings.find(item => item.id !== excludedId && ["Pending sync", "Scheduled", "Rescheduled"].includes(item.status) && start < Date.parse(item.startAt) + item.duration * 60_000 && end > Date.parse(item.startAt) && (item.recordId === draft.recordId || item.participants.some(person => draft.participants.includes(person))));
}
export function createMeeting(state: MeetingsState, profile: MeetingProfile, draft: MeetingDraft, now = Date.now()): MeetingsState {
  const record = authorize(state, profile, draft.recordId);
  if (!record.opportunityId || record.opportunityId !== draft.opportunityId) throw new Error("Meetings must be linked to a valid opportunity.");
  required(draft.title, "Meeting title"); required(draft.agenda, "Agenda"); future(draft.startAt, now); assignee(state, profile, draft.assignedTo);
  if (![15, 30, 45, 60, 90, 120].includes(draft.duration)) throw new Error("Select a valid duration.");
  if (!draft.participants.includes(draft.assignedTo) || !draft.participants.includes(record.owner)) throw new Error("Include the responsible employee and the opportunity owner as participants.");
  const employees = new Set(assigneesFor(meetingProfiles[0], state.records));
  if (draft.participants.some(name => !employees.has(name))) throw new Error("Select valid internal participants.");
  if (!["Manager meeting", "Brand meeting", "Follow-up meeting"].includes(draft.category)) throw new Error("Select a meeting category.");
  if (draft.category === "Manager meeting" && (!meetingProfiles.some(person => person.name === draft.manager && person.scope === "team") || !draft.participants.includes(draft.manager))) throw new Error("Select a manager and include them in the meeting.");
  const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (draft.category === "Brand meeting") { required(draft.brandRepresentative, "Brand representative"); if (!emailValid(draft.brandEmail)) throw new Error("Enter the brand representative's valid email."); }
  if (draft.format === "Virtual") {
    if (!emailValid(draft.customerEmail)) throw new Error("Enter a valid customer email for a virtual meeting.");
    if (!draft.platform || !["Google Meet", "Zoom", "Microsoft Teams"].includes(draft.platform)) throw new Error("Choose a meeting platform.");
    if (draft.meetLink && !/^https:\/\//i.test(draft.meetLink.trim())) throw new Error("Enter a secure https meeting link, or leave it empty until the platform is connected.");
  } else if (draft.format === "In person") { required(draft.location, "Location"); required(draft.address, "Complete address"); }
  else throw new Error("Select a meeting format.");
  if (meetingConflict(state.meetings, draft)) throw new Error("The customer or an internal participant already has a CRM meeting at this time. Choose another time.");
  const item: Meeting = { ...draft, id: `MTG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: "Pending sync", outcome: "", version: 1, createdAt: new Date(now).toISOString(), minutes: [], history: [audit("Meeting created", `${draft.title} · ${displayTime(draft.startAt)} IST · ${draft.duration} minutes · Saved in CRM; Calendar sync and invitations pending.`, profile.name, now)] };
  return { ...state, meetings: [item, ...state.meetings] };
}
export function changeMeeting(state: MeetingsState, profile: MeetingProfile, id: string, action: MeetingAction, now = Date.now()): MeetingsState {
  const item = state.meetings.find(row => row.id === id);
  if (!item) throw new Error("Meeting not found.");
  authorize(state, profile, item.recordId);
  if (item.status === "Cancelled") throw new Error("This meeting is cancelled. Its history is retained.");
  let patch: Partial<Meeting> = {}; let event: AuditEvent;
  if (action.type === "reschedule") {
    if (!meetingReschedulable(item)) throw new Error("A conducted meeting cannot be rescheduled.");
    future(action.startAt, now); required(action.reason, "Rescheduling reason");
    if (action.startAt === item.startAt) throw new Error("Choose a different date or time.");
    if (meetingConflict(state.meetings, { ...item, startAt: action.startAt }, id)) throw new Error("This time conflicts with another CRM meeting.");
    patch = { startAt: action.startAt, status: "Pending sync", version: item.version + 1, outcome: "" };
    event = audit("Meeting rescheduled", `${displayTime(item.startAt)} → ${displayTime(action.startAt)} IST · ${action.reason} · Updated invitations pending.`, profile.name, now);
  } else if (action.type === "cancel" || action.type === "postpone") {
    if (!meetingReschedulable(item)) throw new Error("A conducted meeting cannot be cancelled or postponed.");
    required(action.reason, "Reason"); patch = { status: action.type === "cancel" ? "Cancelled" : "Postponed" };
    event = audit(action.type === "cancel" ? "Meeting cancelled" : "Meeting postponed", `${action.reason} · CRM reminders stopped.`, profile.name, now);
  } else if (action.type === "outcome") {
    if (!meetingReschedulable(item)) throw new Error("An outcome has already been recorded.");
    if (Date.parse(item.startAt) > now) throw new Error("Record the outcome after the scheduled start time.");
    if (!["Conducted", "Customer did not attend", "Internal participant did not attend", "Customer requested rescheduling"].includes(action.outcome)) throw new Error("Select a valid meeting outcome.");
    required(action.remarks, "Outcome remarks");
    patch = { status: action.outcome === "Conducted" ? "Awaiting MOM" : action.outcome === "Customer requested rescheduling" ? "Postponed" : action.outcome, outcome: `${action.outcome}: ${action.remarks}` };
    event = audit("Meeting outcome recorded", patch.outcome!, profile.name, now);
  } else if (action.type === "minutes") {
    if (!["Awaiting MOM", "MOM submitted"].includes(item.status)) throw new Error("Record the meeting as conducted before submitting minutes.");
    const minutes = action.minutes;
    if (!["High", "Medium", "Low", "Not interested", "Needs more information"].includes(minutes.interest)) throw new Error("Select a valid customer interest level.");
    for (const [key, label] of Object.entries({ summary: "Discussion summary", requirements: "Customer requirements", businessRequirements: "Business requirements", concerns: "Questions and concerns", investment: "Investment discussion", interest: "Interest level", nextSteps: "Agreed next steps" })) required(minutes[key as keyof typeof minutes], label);
    if (minutes.nextFollowUpAt && minutes.nextFollowUpAt !== item.minutes.at(-1)?.nextFollowUpAt) future(minutes.nextFollowUpAt, now);
    patch = { status: "MOM submitted", minutes: [...item.minutes, { ...minutes, version: item.minutes.length + 1, author: profile.name, at: new Date(now).toISOString() }] };
    event = audit(item.minutes.length ? "MOM corrected" : "MOM submitted", `Version ${item.minutes.length + 1} · ${minutes.summary}`, profile.name, now);
  } else if (action.type === "review") {
    if (profile.scope === "own" || !item.minutes.length) throw new Error("Only an authorised manager can review submitted minutes.");
    required(action.comment, "Review comment");
    if (item.minutes.at(-1)?.review) throw new Error("This version has already been reviewed.");
    patch = { minutes: item.minutes.map((entry, index) => index === item.minutes.length - 1 ? { ...entry, review: { author: profile.name, at: new Date(now).toISOString(), comment: action.comment } } : entry) };
    event = audit("MOM reviewed", `Version ${item.minutes.length} · ${action.comment}`, profile.name, now);
  } else throw new Error("Unsupported meeting action.");
  return { ...state, meetings: state.meetings.map(row => row.id === id ? { ...row, ...patch, history: [...row.history, event] } : row) };
}
export function updateReminderSettings(state: MeetingsState, profile: MeetingProfile, settings: Pick<ReminderSettings, "followUps" | "meetings">, now = Date.now()): MeetingsState {
  if (!profile.admin) throw new Error("Only administrators can configure reminders.");
  for (const policy of Object.values(settings)) {
    if (policy.before.some(value => !Number.isInteger(value) || value < 1 || value > 10080) || new Set(policy.before).size !== policy.before.length || (policy.overdueAfter !== null && (!Number.isInteger(policy.overdueAfter) || policy.overdueAfter < 1 || policy.overdueAfter > 10080))) throw new Error("Use unique reminder intervals from 1 to 10,080 minutes.");
  }
  const describe = (policy: ReminderPolicy) => `before: ${policy.before.join(", ") || "off"} minutes; at time: ${policy.atTime ? "on" : "off"}; overdue: ${policy.overdueAfter ?? "off"}`;
  const detail = `Follow-ups (${describe(state.settings.followUps)}) → (${describe(settings.followUps)}). Meetings (${describe(state.settings.meetings)}) → (${describe(settings.meetings)}).`;
  return { ...state, settings: { ...settings, history: [...state.settings.history, audit("Reminder settings updated", detail, profile.name, now)] } };
}
export function collectReminders(state: MeetingsState, now = Date.now()): MeetingsState {
  const notifications = [...state.notifications]; const ids = new Set(notifications.map(item => item.id));
  const rows = [...state.followUps.filter(item => item.status === "Pending").map(item => ({ ...item, kind: "follow-up" as const, at: item.dueAt, policy: state.settings.followUps })), ...state.meetings.filter(item => ["Pending sync", "Scheduled", "Rescheduled"].includes(item.status)).map(item => ({ ...item, kind: "meeting" as const, at: item.startAt, policy: state.settings.meetings }))];
  for (const row of rows) {
    const due = Date.parse(row.at);
    const before = [...row.policy.before].sort((a, b) => b - a);
    const phases = [...before.map((minutes, index) => ({ key: `before-${minutes}`, at: due - minutes * 60_000, label: `Upcoming within ${minutes} minutes`, expires: due - (before[index + 1] ?? 0) * 60_000 })), ...(row.policy.atTime ? [{ key: "due", at: due, label: "Due now", expires: due + 60_000 }] : []), ...(row.policy.overdueAfter !== null ? [{ key: "overdue", at: due + row.policy.overdueAfter * 60_000, label: row.kind === "follow-up" ? "Overdue follow-up" : "Meeting outcome not recorded", expires: Infinity }] : [])];
    for (const phase of phases) {
      const id = `${row.id}:${row.version}:${phase.key}`;
      if (now < phase.at || now >= phase.expires || ids.has(id)) continue;
      notifications.push({ id, entityId: row.id, recordId: row.recordId, kind: row.kind, version: row.version, phase: phase.key, dueAt: row.at, createdAt: new Date(now).toISOString(), title: `${phase.label}: ${row.title}`, readBy: [] }); ids.add(id);
    }
  }
  if (notifications.length === state.notifications.length) return state;
  const added = notifications.slice(state.notifications.length);
  const historyFor = (id: string, history: AuditEvent[]) => [...history, ...added.filter(item => item.entityId === id).map(item => audit("In-app reminder generated", `${item.title} · Scheduled for ${displayTime(item.dueAt)} IST`, "CRM reminders", now))];
  return { ...state, notifications, followUps: state.followUps.map(item => ({ ...item, history: historyFor(item.id, item.history) })), meetings: state.meetings.map(item => ({ ...item, history: historyFor(item.id, item.history) })) };
}
export function reminderIsCurrent(state: MeetingsState, id: string) {
  const reminder = state.notifications.find(item => item.id === id);
  if (!reminder) return false;
  const entity = reminder.kind === "follow-up" ? state.followUps.find(item => item.id === reminder.entityId) : state.meetings.find(item => item.id === reminder.entityId);
  return !!entity && entity.version === reminder.version && ["Pending", "Pending sync", "Scheduled", "Rescheduled"].includes(entity.status);
}
