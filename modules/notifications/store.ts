"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type ModuleSection = "Overview" | "Notifications" | "Automation Rules" | "Execution Logs" | "Templates" | "Preferences" | "Reports";
export type EventCategory = "Lead assignment" | "Pipeline stage" | "Follow-up" | "Meeting" | "Payment" | "Invoice" | "Marketing" | "Recruitment" | "HR" | "Document" | "System" | "Security";
export type NotificationPriority = "Low" | "Normal" | "High" | "Critical";
export type Notice = { id: string; title: string; body: string; category: EventCategory; at: string; unread: boolean; recipient: string; recordId: string; href: string; priority?: NotificationPriority; module?: string; sourceEventId?: string };
export type AutomationRule = { id: string; name: string; trigger: string; category: EventCategory; condition: string; action: string; recipients: string; channel: string; timing: string; active: boolean; protected: boolean; updatedAt: string; module?: string; retryPolicy?: string; businessHoursOnly?: boolean; templateId?: string };
export type Execution = { id: string; ruleId: string; event: string; eventId: string; recipient: string; channel: string; status: "Queued" | "Processing" | "Delivered" | "Pending" | "Failed" | "Retry scheduled" | "Skipped"; at: string; attempts: number; error?: string; history: string[]; module?: string; actor?: string; idempotencyKey?: string; durationMs?: number; payloadSummary?: string };
export type CrmEvent = { id: string; name: string; module: string; recordId: string; organizationId: string; actor: string; timestamp: string; payloadSummary: string; correlationKey: string };
export type TemplateVersion = { version: number; subject: string; body: string; updatedAt: string };
export type MessageTemplate = { id: string; name: string; category: string; channel: string; subject: string; body: string; status: "Approved" | "Draft" | "Needs review"; version: number; updatedAt: string; protected: boolean; history?: TemplateVersion[]; module?: string };
export type NotificationState = { notices: Notice[]; rules: AutomationRule[]; executions: Execution[]; templates: MessageTemplate[]; events?: CrmEvent[]; preferences: Record<string, boolean>; preferencesByProfile?: Record<string, Record<string, boolean>>; organizationPreferences?: Record<string, boolean>; quietHours?: { enabled: boolean; start: string; end: string; timezone: string; digest: string } };

const minsAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const hoursAgo = (hours: number) => minsAgo(hours * 60);
const daysAgo = (days: number) => minsAgo(days * 1440);

const initial: NotificationState = {
  notices: [
    { id: "NT-24031", title: "New enquiry assigned", body: "Northspoon Foods · Meta Lead Ads · assigned by Anitha K", category: "Lead assignment", at: minsAgo(4), unread: true, recipient: "Vivek Rawat", recordId: "ENQ-2403", href: "/library/modules/leads?enquiry=ENQ-2403" },
    { id: "NT-24030", title: "Manager meeting reminder", body: "Asha Menon · Today at 3:30 PM · Calendar invitation is in preview only", category: "Meeting", at: minsAgo(18), unread: true, recipient: "Himani Bhargava Tapadiya", recordId: "ENQ-2401", href: "/library/modules/meetings" },
    { id: "NT-24029", title: "Follow-up is overdue", body: "Confirm investment range · assigned to Himani Bhargava Tapadiya", category: "Follow-up", at: hoursAgo(1), unread: true, recipient: "Himani Bhargava Tapadiya", recordId: "ENQ-2401", href: "/library/modules/meetings" },
    { id: "NT-24028", title: "Payment proof needs verification", body: "Brew Theory · Token payment · Finance review requested", category: "Payment", at: hoursAgo(2), unread: false, recipient: "Finance team", recordId: "PAY-0084", href: "/library/modules/finance" },
    { id: "NT-24027", title: "Marketing lead sync needs attention", body: "Meta Lead Ads · 2 records could not be matched to a campaign", category: "Marketing", at: hoursAgo(5), unread: false, recipient: "Marketing team", recordId: "SYNC-019", href: "/library/modules/marketing" },
    { id: "NT-24026", title: "Opportunity moved to Warm", body: "Ravi Enterprises · Stage updated by Vivek Rawat", category: "Pipeline stage", at: daysAgo(1), unread: false, recipient: "Sales team", recordId: "ENQ-2402", href: "/library/modules/pipeline" },
    { id: "NT-24025", title: "Invoice is ready for review", body: "INV-2026-104 · Brew Theory · Finance approval required", category: "Invoice", at: daysAgo(1), unread: false, recipient: "Finance team", recordId: "INV-2026-104", href: "/library/modules/finance" },
    { id: "NT-24024", title: "RNR attempt 3 recorded", body: "Asha Menon · Next approved follow-up scheduled for review", category: "Pipeline stage", at: daysAgo(2), unread: false, recipient: "Himani Bhargava Tapadiya", recordId: "ENQ-2401", href: "/library/modules/pipeline" },
    { id: "NT-24023", title: "New document uploaded", body: "Franchise proposal · Northspoon Foods", category: "Document", at: daysAgo(3), unread: false, recipient: "Vivek Rawat", recordId: "DOC-0197", href: "/library/modules/documents" },
    { id: "NT-24022", title: "Security sign-in alert", body: "New session detected · review account activity", category: "Security", at: daysAgo(4), unread: false, recipient: "Account owner", recordId: "SEC-002", href: "/library/modules/notifications" },
  ],
  rules: [
    { id: "AR-001", name: "New lead owner notification", trigger: "Lead assigned", category: "Lead assignment", condition: "Always", action: "Notify assigned owner and reporting manager", recipients: "Assigned owner, reporting manager", channel: "In-app", timing: "Immediately", active: true, protected: false, updatedAt: daysAgo(1) },
    { id: "SYS-MTG", name: "Meeting reminders", trigger: "Meeting scheduled or updated", category: "Meeting", condition: "Meeting is upcoming and not cancelled", action: "Send reminders at 60, 30 and 5 minutes before", recipients: "Customer, owner, manager and participants", channel: "In-app · Email · Google Calendar", timing: "60m, 30m, 5m before", active: true, protected: true, updatedAt: daysAgo(4) },
    { id: "SYS-RNR", name: "RNR follow-up sequence", trigger: "Opportunity enters RNR stage", category: "Pipeline stage", condition: "RNR attempt is valid · maximum 8 attempts", action: "Create next follow-up using the matching approved RNR template", recipients: "Opportunity owner; customer message requires approved template", channel: "In-app · Email", timing: "Respect RNR attempt schedule · max 2 customer emails/day", active: true, protected: true, updatedAt: daysAgo(4) },
    { id: "AR-004", name: "Overdue follow-up escalation", trigger: "Follow-up becomes overdue", category: "Follow-up", condition: "Follow-up is still open after due time", action: "Notify owner, then escalate to manager", recipients: "Follow-up owner, reporting manager", channel: "In-app", timing: "At due time · escalate after 15m", active: true, protected: false, updatedAt: daysAgo(2) },
    { id: "SYS-PAY", name: "Payment status and proof", trigger: "Payment status or proof changes", category: "Payment", condition: "Payment belongs to a visible opportunity", action: "Notify Finance and owner; request verification on missing proof", recipients: "Finance, owner, authorized manager", channel: "In-app · Email", timing: "Immediately", active: true, protected: true, updatedAt: daysAgo(3) },
    { id: "SYS-INV", name: "Invoice lifecycle alerts", trigger: "Invoice created, approved, due or overdue", category: "Invoice", condition: "Invoice is not void", action: "Notify Finance and record owner; remind customer only after approval", recipients: "Finance, owner; customer after approval", channel: "In-app · Email", timing: "On event · due date · overdue", active: true, protected: true, updatedAt: daysAgo(3) },
    { id: "AR-007", name: "Marketing sync exception", trigger: "Lead sync fails or cannot match", category: "Marketing", condition: "Sync contains an error or unmatched lead", action: "Create an exception alert and retain source identifiers", recipients: "Marketing operations", channel: "In-app", timing: "Immediately", active: true, protected: false, updatedAt: daysAgo(2) },
    { id: "AR-008", name: "Weekly pipeline digest", trigger: "Weekly schedule", category: "System", condition: "Recipient has pipeline access", action: "Prepare weekly activity summary", recipients: "Sales managers", channel: "In-app", timing: "Monday · 9:00 AM", active: false, protected: false, updatedAt: daysAgo(5) },
  ],
  executions: [
    { id: "EX-8831", ruleId: "AR-001", event: "Lead assigned", eventId: "ENQ-2403", recipient: "Vivek Rawat", channel: "In-app", status: "Delivered", at: minsAgo(4), attempts: 1, history: ["In-app alert created in preview"] },
    { id: "EX-8830", ruleId: "SYS-MTG", event: "Meeting reminder · 60 minutes", eventId: "ENQ-2401", recipient: "Asha Menon · owner · manager", channel: "Google Calendar", status: "Pending", at: minsAgo(18), attempts: 1, error: "Calendar connection is not configured", history: ["Preview event queued; no external request sent"] },
    { id: "EX-8829", ruleId: "SYS-RNR", event: "RNR attempt 3", eventId: "ENQ-2388", recipient: "customer@example.com", channel: "Email", status: "Failed", at: hoursAgo(1), attempts: 2, error: "Email delivery is not configured in this workspace", history: ["Attempt 1 · connection unavailable", "Attempt 2 · connection unavailable"] },
    { id: "EX-8828", ruleId: "AR-007", event: "Marketing sync exception", eventId: "SYNC-019", recipient: "Marketing operations", channel: "In-app", status: "Delivered", at: hoursAgo(2), attempts: 1, history: ["Exception logged in preview"] },
    { id: "EX-8827", ruleId: "AR-004", event: "Follow-up overdue", eventId: "ENQ-2401", recipient: "Himani Bhargava Tapadiya", channel: "In-app", status: "Delivered", at: daysAgo(1), attempts: 1, history: ["Owner alert created in preview"] },
    { id: "EX-8826", ruleId: "SYS-PAY", event: "Payment proof submitted", eventId: "PAY-0084", recipient: "Finance team", channel: "In-app", status: "Delivered", at: daysAgo(1), attempts: 1, history: ["Finance review alert created"] },
    { id: "EX-8825", ruleId: "SYS-INV", event: "Invoice approved", eventId: "INV-2026-104", recipient: "Finance team", channel: "Email", status: "Skipped", at: daysAgo(2), attempts: 0, error: "Email channel unavailable; no customer message was sent", history: ["Safety check skipped customer delivery"] },
  ],
  templates: [
    ...Array.from({ length: 8 }, (_, index) => ({ id: `RNR-${index + 1}`, name: `RNR ${index + 1} · ${index === 0 ? "First contact" : `Attempt ${index + 1}`}`, category: "RNR follow-up", channel: "Email", subject: "Following up on {{brand}} franchise enquiry", body: "Hello {{customer_name}},\n\nWe are following up on your interest in {{brand}}. Your franchise enquiry reference is {{enquiry_id}}.\n\nPlease let {{employee_name}} know a suitable time to speak.\n\nRegards,\niFranchise team", status: index === 0 ? "Approved" as const : "Draft" as const, version: index === 0 ? 3 : 1, updatedAt: daysAgo(index), protected: false })),
    { id: "TPL-MTG", name: "Meeting invitation and reminder", category: "Meeting", channel: "Email", subject: "Your {{meeting_type}} with {{brand}}", body: "Hello {{customer_name}},\n\nYour meeting is scheduled for {{meeting_time}}.\n{{meeting_link}}\n\nRegards, {{employee_name}}", status: "Approved", version: 2, updatedAt: daysAgo(3), protected: true },
    { id: "TPL-PAY", name: "Payment status update", category: "Payment", channel: "In-app", subject: "Payment update · {{enquiry_id}}", body: "Payment status: {{payment_status}}. Invoice: {{invoice_number}}.", status: "Approved", version: 1, updatedAt: daysAgo(5), protected: true },
    { id: "TPL-INV", name: "Invoice approved", category: "Invoice", channel: "Email", subject: "Invoice {{invoice_number}} for {{brand}}", body: "Hello {{customer_name}},\n\nInvoice {{invoice_number}} is approved. Due date: {{due_date}}.\n\nRegards, Finance team", status: "Approved", version: 1, updatedAt: daysAgo(4), protected: true },
  ],
  preferences: { "Lead assignments": true, "Pipeline changes": true, "Follow-ups": true, "Meeting reminders": true, "Marketing alerts": true, "Recruitment updates": true, "Email channel": true, "SMS channel": true, "WhatsApp channel": true, "Push channel": true, "Security alerts": true, "Financial alerts": true, "Weekly digest": false },
  organizationPreferences: { "Critical security alerts": true, "Financial verification alerts": true, "Allow quiet hours": false },
  quietHours: { enabled: false, start: "21:00", end: "08:00", timezone: "Asia/Kolkata", digest: "Daily" },
};

// Review fixtures are deliberately labeled as preview data. They model event
// envelopes and workflow outcomes without claiming that a CRM service ran them.
initial.notices.push(
  { id: "NT-24021", title: "Candidate moved to interview", body: "Nisha Rao · Marketing manager · Interview panel requested", category: "Recruitment", at: daysAgo(2), unread: false, recipient: "HR team", recordId: "JOB-0142", href: "/library/modules/roles", priority: "Normal", module: "Recruitment", sourceEventId: "EV-24021" },
  { id: "NT-24020", title: "Employee access changed", body: "Finance permissions updated by an administrator", category: "HR", at: daysAgo(3), unread: true, recipient: "Account owner", recordId: "USR-0081", href: "/library/modules/roles", priority: "High", module: "HR", sourceEventId: "EV-24020" },
  { id: "NT-24019", title: "Integration connection needs attention", body: "Google Calendar authorization has expired · no invitations were sent", category: "System", at: daysAgo(4), unread: true, recipient: "Account owner", recordId: "INT-0004", href: "/library/modules/marketing", priority: "High", module: "IT & Security", sourceEventId: "EV-24019" },
  { id: "NT-24018", title: "Suspicious sign-in detected", body: "New location detected · review account access", category: "Security", at: daysAgo(5), unread: true, recipient: "Account owner", recordId: "SEC-003", href: "/library/modules/notifications", priority: "Critical", module: "IT & Security", sourceEventId: "EV-24018" },
  { id: "NT-24017", title: "Invoice delivery is queued", body: "INV-2026-104 · Email connection is unavailable", category: "Invoice", at: daysAgo(6), unread: false, recipient: "Finance team", recordId: "INV-2026-104", href: "/library/modules/finance", priority: "High", module: "Finance & Invoices", sourceEventId: "EV-24017" },
);
initial.rules.push(
  { id: "AR-009", name: "Recruitment interview reminder", trigger: "Interview reminder", category: "Recruitment", condition: "Candidate status is Interview scheduled", action: "Create notification", recipients: "Recruiter and interview panel", channel: "In-app", timing: "30 minutes before", active: true, protected: false, updatedAt: daysAgo(3), module: "Recruitment" },
  { id: "SYS-SEC", name: "Security access alerts", trigger: "Employee access changed", category: "Security", condition: "Role or permission changes", action: "Notify account owner", recipients: "Account owner and security administrator", channel: "In-app", timing: "Immediately", active: true, protected: true, updatedAt: daysAgo(1), module: "IT & Security" },
  { id: "AR-010", name: "Integration failure escalation", trigger: "Integration disconnected", category: "System", condition: "Connection is not restored after 15 minutes", action: "Escalate to manager", recipients: "System administrator and module owner", channel: "In-app", timing: "Immediately · escalate after 15m", active: true, protected: false, updatedAt: daysAgo(1), module: "IT & Security" },
);
initial.templates.push(
  { id: "TPL-JOB", name: "Application status update", category: "Recruitment", channel: "Email", subject: "Update on your application · {{job_title}}", body: "Hello {{candidate_name}},\n\nYour application status is {{application_status}}. The iFranchise recruitment team will follow up with next steps.\n\nRegards, Talent team", status: "Draft", version: 1, updatedAt: daysAgo(1), protected: true },
  { id: "TPL-SEC", name: "Security access alert", category: "Security", channel: "In-app", subject: "Access change · {{employee_name}}", body: "{{actor_name}} changed {{employee_name}} access for {{module_name}} at {{event_time}}. Review the audit record {{record_link}}.", status: "Approved", version: 1, updatedAt: daysAgo(2), protected: true },
);
initial.executions = initial.executions.map((item, index) => {
  const category = initial.rules.find(rule => rule.id === item.ruleId)?.category ?? "System";
  const module = category === "Lead assignment" ? "Lead Assignment" : category === "Meeting" || category === "Follow-up" || category === "Pipeline stage" ? "Sales Pipeline" : category === "Payment" || category === "Invoice" ? "Finance & Invoices" : category === "Marketing" ? "Marketing" : ["HR", "Recruitment"].includes(category) ? category : category === "Security" || category === "System" ? "IT & Security" : "Lead Management";
  return { ...item, module, actor: "CRM workflow · preview", idempotencyKey: `preview:${item.ruleId}:${item.eventId}:${item.id}`, durationMs: item.status === "Failed" ? 842 : item.status === "Pending" ? undefined : 96 + index * 37, payloadSummary: `${item.event} · source record ${item.eventId}` };
});
initial.events = initial.notices.map(item => ({ id: item.sourceEventId ?? `EV-${item.id.slice(-5)}`, name: item.title, module: item.module ?? "Lead Management", recordId: item.recordId, organizationId: "org-review-preview", actor: "CRM event preview", timestamp: item.at, payloadSummary: `${item.category} notification source`, correlationKey: `preview:${item.recordId}:${item.category}:${item.id}` }));

const storageKey = "ifranchise:notifications-automation:v2";
const listeners = new Set<() => void>();
let current = initial;
let ready = false;
const empty: NotificationState = { notices: [], rules: [], executions: [], templates: [], preferences: {}, preferencesByProfile: {} };
const publish = () => listeners.forEach(listener => listener());
export function updateNotifications(updater: (state: NotificationState) => NotificationState) {
  current = updater(current);
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(current));
  publish();
}
/** Adds a module-originated in-app event without replacing saved notification settings. */
export function addPreviewNotification(notice: Notice) {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(storageKey);
    const saved = stored ? JSON.parse(stored) as Partial<NotificationState> : null;
    const base = saved ? { ...initial, ...saved, preferences: { ...initial.preferences, ...saved.preferences } } : current;
    if (base.notices.some(item => item.recordId === notice.recordId && item.title === notice.title)) return;
    const event: CrmEvent = { id: notice.sourceEventId ?? notice.id, name: notice.title, module: "Calling Management", recordId: notice.recordId, organizationId: "org-review-preview", actor: "Calling Management preview", timestamp: notice.at, payloadSummary: notice.body, correlationKey: `calling:${notice.recordId}:${notice.title}` };
    current = { ...base, notices: [notice, ...base.notices], events: [event, ...(base.events ?? [])] };
    window.localStorage.setItem(storageKey, JSON.stringify(current));
    ready = true;
    publish();
  } catch {
    // Leave existing notification records intact if the saved state is malformed or unavailable.
  }
}
export function useNotifications() {
  const state = useSyncExternalStore(callback => { listeners.add(callback); return () => listeners.delete(callback); }, () => ready ? current : empty, () => empty);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<NotificationState>;
        current = { ...initial, ...saved, preferences: { ...initial.preferences, ...saved.preferences } };
      }
      ready = true;
      publish();
    } catch { setLoadError("Saved notification data could not be read. This session is using the sample data."); ready = true; publish(); }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try { current = event.newValue ? { ...initial, ...(JSON.parse(event.newValue) as Partial<NotificationState>) } : initial; publish(); } catch { setLoadError("Updated notification data could not be read."); }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { state, ready, loadError };
}
