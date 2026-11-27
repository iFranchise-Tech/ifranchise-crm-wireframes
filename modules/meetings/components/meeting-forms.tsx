"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { CalendarDate, parseDate } from "@internationalized/date";
import { RiCalendarLine, RiCheckLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { DateCalendar } from "@/components/base/date-picker/date-calendar";
import { Dropdown, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Textarea } from "@/components/base/textarea/textarea";
import { Select, SelectItem } from "@/components/base/select/select";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { assigneesFor, canManageRecord, changeFollowUp, changeMeeting, createFollowUp, createMeeting, displayTime, fromIst, istParts, meetingConflict, meetingProfiles } from "../records";
import { updateMeetings, withCustomer } from "../store";
import { MeetingPlatformLogo } from "./meeting-platform";
import type { ActivitySource, CustomerRecord, FollowUp, FollowUpDraft, Meeting, MeetingAction, MeetingAssistant, MeetingDraft, MeetingPlatform, MeetingProfile, MeetingsState, Minutes } from "../types";

export const fieldClass = "border border-border-button-default bg-background-primary-default text-text-primary";
export function Choice({ label, value, onChange, options, required = false, placeholder, className }: { label: string; value: string; onChange: (value: string) => void; options: (string | { id: string; name: string })[]; required?: boolean; placeholder?: string; className?: string }) {
  return <Select label={label} selectedKey={value || null} onSelectionChange={key => onChange(String(key))} isRequired={required} placeholder={placeholder ?? `Select ${label.toLowerCase()}`} className={className} triggerClassName={fieldClass}>{options.map(option => { const item = typeof option === "string" ? { id: option, name: option } : option; return <SelectItem key={item.id} id={item.id}>{item.name}</SelectItem>; })}</Select>;
}
function suggestedMeetingStart(date: string) {
  const today = istParts(Date.now()).date;
  let selectedDate = date || today;
  let minutes = 10 * 60;
  if (selectedDate === today) {
    const current = istParts(Date.now()).time.split(":").map(Number);
    minutes = Math.max(minutes, Math.ceil((current[0] * 60 + current[1] + 30) / 30) * 30);
  }
  if (minutes > 18 * 60 + 30) minutes = 18 * 60 + 30;
  const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return fromIst(selectedDate, time);
}
export function FormDialog({ title, description, children, error, submit, submitLabel, onClose, wide = false, cancelLabel = "Cancel" }: { title: string; description?: string; children: ReactNode; error: string; submit: (event: FormEvent) => void; submitLabel: string; onClose: () => void; wide?: boolean; cancelLabel?: string }) {
  return <Modal isOpen onOpenChange={open => { if (!open) onClose(); }} size={wide ? "xl" : "lg"}>
    <form onSubmit={submit} className="flex min-h-0 flex-col gap-4">
      <ModalHeader title={title} description={description} />
      <ModalBody><div className="flex flex-col gap-5">{children}{error && <p role="alert" className="text-body-2-medium text-text-error-primary">{error}</p>}</div></ModalBody>
      <ModalFooter><Button variant="secondary" onClick={onClose}>{cancelLabel}</Button><Button type="submit">{submitLabel}</Button></ModalFooter>
    </form>
  </Modal>;
}
export function DateTimeFields({ value, onChange, label = "Due" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const initial = istParts(value);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [open, setOpen] = useState(false);
  const times = Array.from({ length: 96 }, (_, index) => `${String(Math.floor(index / 4)).padStart(2, "0")}:${String(index % 4 * 15).padStart(2, "0")}`);
  if (time && !times.includes(time)) times.push(time);
  const today = parseDate(istParts(Date.now()).date);
  return <div className="grid grid-cols-2 items-end gap-4">
    <div className="flex min-w-0 flex-col gap-1"><span className="text-body-medium text-text-primary">{label} date <span className="text-text-error-primary">*</span></span>
      <Dropdown isOpen={open} onOpenChange={setOpen}><DropdownTrigger aria-label={`${label} date`} className="flex min-h-9 w-full items-center justify-between gap-2 rounded-xl border border-border-button-default bg-background-primary-default px-3 py-2 text-start text-body-regular text-text-primary"><span>{date ? new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }) : "Select a date"}</span><RiCalendarLine className="size-4 shrink-0 text-foreground-icon-secondary" /></DropdownTrigger><DropdownPopover aria-label={`${label} calendar`} placement="bottom start" className="w-max max-w-[calc(100vw-2rem)] overflow-visible" dialogClassName="gap-0"><DateCalendar aria-label={`${label} date calendar`} value={date ? parseDate(date) : null} minValue={today} onChange={next => { const selected = new CalendarDate(next.year, next.month, next.day).toString(); setDate(selected); onChange(fromIst(selected, time)); setOpen(false); }} /></DropdownPopover></Dropdown>
    </div>
    <Choice label={`${label} time (IST)`} required value={time} onChange={next => { setTime(next); onChange(fromIst(date, next)); }} options={times.sort().map(value => { const [hour, minute] = value.split(":").map(Number); return { id: value, name: `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}` }; })} placeholder="Select a time" />
  </div>;
}
export function FollowUpForm({ state, profile, record, source, onClose, onSaved }: { state: MeetingsState; profile: MeetingProfile; record?: CustomerRecord; source?: ActivitySource; onClose: () => void; onSaved?: (id: string) => void }) {
  const working = record ? withCustomer(state, record) : state;
  const records = working.records.filter(item => canManageRecord(profile, item));
  const [draft, setDraft] = useState<FollowUpDraft>({ recordId: record?.id ?? "", linkType: "Enquiry", title: "", description: "", assignedTo: record?.owner && assigneesFor(profile, working.records).includes(record.owner) ? record.owner : assigneesFor(profile, working.records)[0] ?? "", dueAt: "", priority: "Medium", source });
  const [error, setError] = useState("");
  const selected = working.records.find(item => item.id === draft.recordId);
  const patch = (value: Partial<FollowUpDraft>) => setDraft(current => ({ ...current, ...value }));
  function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try { let id = ""; updateMeetings(current => { const next = createFollowUp(record ? withCustomer(current, record) : current, profile, draft); id = next.followUps[0].id; return next; }); onSaved?.(id); onClose(); } catch (failure) { setError((failure as Error).message); }
  }
  return <FormDialog title="Create follow-up" description="Turn a customer interaction into a clear next action. All times are in India Standard Time." submit={submit} submitLabel="Create follow-up" error={error} onClose={onClose} wide>
    {source && <div className="rounded-xl border border-separator-border bg-background-secondary-default p-3"><p className="text-caption-1-semibold text-text-secondary">FROM CUSTOMER ACTIVITY</p><p className="text-body-medium text-text-primary">{source.title}</p><p className="text-body-2-regular text-text-secondary">{source.type} · {source.when} · {source.id}</p></div>}
    {record ? <p className="text-body-medium text-text-primary">{record.name} <span className="text-text-secondary">· {record.id}</span></p> : <Choice label="Customer / enquiry" required value={draft.recordId} options={records.map(item => ({ id: item.id, name: `${item.name} · ${item.id}` }))} onChange={recordId => { const item = records.find(row => row.id === recordId); patch({ recordId, linkType: "Enquiry", assignedTo: item?.owner ?? draft.assignedTo }); }} />}
    <div className="grid gap-4 sm:grid-cols-2">
      <Choice label="Link follow-up to" required value={draft.linkType} options={["Contact", "Enquiry", ...(selected?.opportunityId ? ["Opportunity"] : [])]} onChange={value => patch({ linkType: value as FollowUpDraft["linkType"] })} />
      <Choice label="Assigned employee" required value={draft.assignedTo} options={assigneesFor(profile, working.records)} onChange={assignedTo => patch({ assignedTo })} />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Follow-up title" isRequired fieldClassName={fieldClass} value={draft.title} onChange={title => patch({ title })} placeholder="e.g. Confirm investment range" />
      <Choice label="Priority" required value={draft.priority} options={["High", "Medium", "Low"]} onChange={priority => patch({ priority: priority as FollowUpDraft["priority"] })} />
    </div>
    <DateTimeFields value={draft.dueAt} onChange={dueAt => patch({ dueAt })} />
    <Textarea label="Description" isRequired fieldClassName={fieldClass} value={draft.description} onChange={description => patch({ description })} rows={3} placeholder="Describe the discussion and the action to take" />
  </FormDialog>;
}
export function MeetingForm({ state, profile, record, initialDate, onClose, onSaved }: { state: MeetingsState; profile: MeetingProfile; record?: CustomerRecord; initialDate?: string; onClose: () => void; onSaved?: (id: string) => void }) {
  const working = record ? withCustomer(state, record) : state;
  const records = working.records.filter(item => item.opportunityId && canManageRecord(profile, item));
  const chosen = record ? working.records.find(item => item.id === record.id) : undefined;
  const employees = assigneesFor(meetingProfiles[0], working.records);
  const initialOwner = chosen?.owner ?? employees[0] ?? "";
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [scheduledMeeting, setScheduledMeeting] = useState<Meeting | null>(null);
  const [draft, setDraft] = useState<MeetingDraft>({ recordId: chosen?.id ?? "", opportunityId: chosen?.opportunityId ?? "", title: "", category: "Follow-up meeting", format: "Virtual", platform: "Google Meet", assistant: "Rube", summarizeCall: true, captureActionItems: true, assistLive: false, startAt: suggestedMeetingStart(initialDate ?? ""), duration: 30, assignedTo: initialOwner, participants: initialOwner ? [initialOwner] : [], manager: "", brandRepresentative: "", brandEmail: "", customerEmail: chosen?.email ?? "", agenda: "", remarks: "", location: "", address: "", meetLink: "" });
  const patch = (value: Partial<MeetingDraft>) => setDraft(current => ({ ...current, ...value }));
  const selected = working.records.find(item => item.id === draft.recordId);
  const day = istParts(draft.startAt).date || initialDate || "";
  const time = istParts(draft.startAt).time || "10:00";
  const today = istParts(Date.now()).date;
  const minimumDate = parseDate(today);
  const calendarValue = day ? parseDate(day) : null;
  const times = Array.from({ length: 22 }, (_, index) => `${String(8 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);
  const platforms: MeetingPlatform[] = ["Google Meet", "Zoom", "Microsoft Teams"];
  const dayMeetings = working.meetings.filter(meeting => istParts(meeting.startAt).date === day && meeting.status !== "Cancelled");
  const scheduleHours = Array.from({ length: 11 }, (_, index) => index + 8);
  const assistantOptions: { value: MeetingAssistant; label: string; mark: string }[] = [
    { value: "None", label: "No assistant", mark: "–" },
    { value: "Rube", label: "Meeting notes", mark: "N" },
    { value: "Aether", label: "Sales coach", mark: "S" },
    { value: "Syntax", label: "Action tracker", mark: "A" },
    { value: "Theo", label: "Account copilot", mark: "C" },
    { value: "Clara", label: "Customer insights", mark: "I" },
  ];
  const selectedAssistant = assistantOptions.find(option => option.value === draft.assistant) ?? assistantOptions[1];
  function selectRecord(recordId: string) { const item = records.find(row => row.id === recordId); if (!item) return; patch({ recordId, opportunityId: item.opportunityId ?? "", customerEmail: item.email, assignedTo: item.owner, participants: [...new Set([item.owner, draft.assignedTo].filter(Boolean))] }); }
  function setMeetingDate(date: string) { patch({ startAt: fromIst(date, time) }); }
  function setMeetingTime(value: string) { patch({ startAt: fromIst(day, value) }); }
  function hasTimeConflict(value: string) { if (!day || !draft.recordId) return false; return !!meetingConflict(working.meetings, { ...draft, startAt: fromIst(day, value) }); }
  function validateStep() {
    if (step === 1) { if (!draft.title.trim()) return "Add a meeting title."; if (!draft.recordId) return "Choose a customer opportunity."; }
    if (step === 2) {
      if (!draft.agenda.trim()) return "Add a short meeting agenda.";
      if (!draft.assignedTo) return "Choose the responsible employee.";
      if (!draft.participants.includes(draft.assignedTo) || (selected && !draft.participants.includes(selected.owner))) return "Keep the opportunity owner and responsible employee in the meeting.";
      if (draft.category === "Manager meeting" && (!draft.manager || !draft.participants.includes(draft.manager))) return "Choose a manager and include them as a participant.";
      if (draft.category === "Brand meeting" && (!draft.brandRepresentative.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.brandEmail))) return "Add a valid brand representative name and email.";
      if (draft.format === "Virtual" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.customerEmail)) return "Add a valid customer email for this virtual meeting.";
    }
    if (step === 3) { if (!day || !draft.startAt) return "Choose a meeting date and time."; if (Date.parse(draft.startAt) <= Date.now()) return "Choose a future time."; if (hasTimeConflict(time)) return "That time conflicts with another CRM meeting. Choose a free time."; }
    if (step === 4 && draft.format === "In person" && (!draft.location.trim() || !draft.address.trim())) return "Add the meeting location and full address.";
    return "";
  }
  function continueStep() { const message = validateStep(); if (message) { setError(message); return; } setError(""); setStep(current => Math.min(4, current + 1)); }
  function submit(event: FormEvent) {
    event.preventDefault(); const message = validateStep(); if (message) { setError(message); return; }
    if (scheduledMeeting) return;
    try {
      let saved!: Meeting;
      updateMeetings(current => {
        const next = createMeeting(record ? withCustomer(current, record) : current, profile, draft);
        saved = next.meetings[0];
        return next;
      });
      setScheduledMeeting(saved);
      const savedId = saved.id;
      window.setTimeout(() => { onSaved?.(savedId); onClose(); }, 1100);
    } catch (failure) { setError((failure as Error).message); }
  }
  const previewDate = day ? new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Choose a day";
  const titles = ["Contract extension meeting", "Quarterly business review", "Renewal check-in", "Product demo", "Onboarding kickoff"];
  return <Modal isOpen onOpenChange={open => { if (!open) onClose(); }} size="wide" className="mf-scheduler-modal" aria-label="Schedule a meeting">
    {scheduledMeeting ? <div className="mf-scheduler-success" role="status" aria-live="polite">
      <div className="mf-scheduler-success-mark"><RiCheckLine aria-hidden="true" /></div>
      <span className="mf-scheduler-success-eyebrow">MEETING SCHEDULED</span>
      <h2>{scheduledMeeting.title}</h2>
      <p>Your meeting is saved. Opening the meeting details…</p>
      <div className="mf-scheduler-success-summary"><strong>{working.records.find(item => item.id === scheduledMeeting.recordId)?.name ?? "Customer"}</strong><span>{previewDate} · {time} IST · {scheduledMeeting.duration} minutes</span></div>
    </div> : <div className="mf-scheduler">
      <aside className="mf-scheduler-preview" aria-label="Meeting preview">
        <div className="mf-scheduler-glow" />
        <div className="mf-scheduler-preview-content">
          {step === 3 ? <div className="mf-scheduler-day-preview">
            <div className="mf-scheduler-day-preview-heading"><strong>{day ? new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "Asia/Kolkata" }) : "Choose a day"}</strong><span>{dayMeetings.length} booked</span></div>
            <div className="mf-scheduler-day-preview-grid">{scheduleHours.map(hour => {
              const hourLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(fromIst(day || today, `${String(hour).padStart(2, "0")}:00`)));
              const events = dayMeetings.filter(meeting => Number(istParts(meeting.startAt).time.split(":")[0]) === hour);
              const isDraftHour = Number(time.split(":")[0]) === hour;
              return <div className="mf-scheduler-day-preview-row" key={hour}><span>{hourLabel}</span><div><i aria-hidden="true" />{events.map(meeting => <strong className="mf-scheduler-day-preview-event" key={meeting.id}>{meeting.title}</strong>)}{isDraftHour && <strong className="mf-scheduler-day-preview-event is-draft">{draft.title || "New meeting"}</strong>}</div></div>;
            })}</div>
            <div className="mf-scheduler-preview-footer"><span>CRM schedule</span><span>IST</span></div>
          </div> : step === 4 && draft.format === "Virtual" ? <div className="mf-scheduler-call-preview">
            <div className="mf-scheduler-call-header"><span className="mf-scheduler-call-platform-icon"><MeetingPlatformLogo platform={draft.platform ?? "Google Meet"} className="size-5" /></span><strong>{draft.platform ?? "Video meeting"}</strong><span className="mf-scheduler-call-live"><i />Preview</span></div>
            <div className="mf-scheduler-call-grid">{[selected?.name, ...draft.participants].filter((name): name is string => Boolean(name)).slice(0, 3).map(name => <div className="mf-scheduler-call-person" key={name}><Avatar size="md" initials={name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()} alt="" /><span>{name.split(/\s+/)[0]}</span></div>)}<div className="mf-scheduler-call-assistant"><Image src="/brand/ifranchise-logo.png" width={48} height={46} alt="iFranchise" /><strong>{selectedAssistant.label}</strong><span>Ready to assist</span></div></div>
            <div className="mf-scheduler-call-footer"><span>{draft.summarizeCall ? "✓ Summary" : "Summary off"}</span><span>{draft.captureActionItems ? "✓ Action items" : "Action items off"}</span></div>
          </div> : step === 4 ? <div className="mf-scheduler-inperson-preview">
            <div className="mf-scheduler-inperson-art" aria-hidden="true"><div className="mf-scheduler-inperson-orbit" /><div className="mf-scheduler-inperson-pin"><RiCalendarLine /></div><span className="mf-scheduler-inperson-spark">✦</span></div>
            <div className="mf-scheduler-inperson-copy"><span className="mf-scheduler-eyebrow">IN PERSON</span><strong>{draft.title || "Meeting with your customer"}</strong><span>{previewDate} · {time} IST · {draft.duration} min</span></div>
            <div className="mf-scheduler-inperson-location"><span className="mf-scheduler-inperson-location-icon"><RiCalendarLine /></span><div><small>MEETING LOCATION</small><strong>{draft.location || "Add a meeting location"}</strong><span>{draft.address || "Your address will appear here"}</span></div></div>
            <div className="mf-scheduler-inperson-attendees"><span className="mf-scheduler-eyebrow">ATTENDEES</span><div>{[selected?.name, ...draft.participants].filter((name): name is string => Boolean(name)).slice(0, 5).map(name => <Avatar key={name} size="sm" initials={name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()} alt={name} />)}</div><span>{draft.participants.length + (selected ? 1 : 0)} people invited</span></div>
            <div className="mf-scheduler-preview-footer"><span>Calendar invite</span><span>Ready to schedule</span></div>
          </div> : <>
            <div className="mf-scheduler-event-card"><div className="mf-scheduler-date-badge"><span>{day ? new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-US", { month: "short", timeZone: "Asia/Kolkata" }) : "DATE"}</span><strong>{day ? new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-US", { day: "numeric", timeZone: "Asia/Kolkata" }) : "—"}</strong></div><div className="mf-scheduler-event-copy"><span className="mf-scheduler-eyebrow">MEETING PREVIEW</span><strong>{draft.title || "Untitled meeting"}</strong><span>{previewDate} · {time} IST · {draft.duration} min</span></div></div>
            <div className="mf-scheduler-customer-card"><span className="mf-scheduler-customer-mark">{selected ? selected.name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() : "?"}</span><div><small>WITH CUSTOMER</small><strong>{selected?.name ?? "Choose a customer"}</strong><span>{selected?.brand ?? "Opportunity meeting"}</span></div></div>
            {step === 2 && <div className="mf-scheduler-join-orbit" aria-label={`${draft.participants.length} selected team participants`}>
              <div className="mf-scheduler-join-orbit-ring" aria-hidden="true" />
              <div className="mf-scheduler-join-orbit-center" aria-hidden="true"><Image src="/brand/ifranchise-logo.png" width={48} height={46} alt="iFranchise" /></div>
              {draft.participants.map((name, index) => {
                const angle = -90 + (index * 360) / Math.max(draft.participants.length, 1);
                return <div className="mf-scheduler-join-orbit-person" key={name} style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-7.5rem) rotate(${-angle}deg)` }}>
                  <Avatar size="md" initials={name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()} alt={name} />
                  <span>{name.split(/\s+/)[0]}</span>
                </div>;
              })}
              {!draft.participants.length && <span className="mf-scheduler-join-orbit-empty">Choose teammates to add them</span>}
            </div>}
            {step > 2 && <div className="mf-scheduler-participant-preview"><span className="mf-scheduler-eyebrow">ATTENDEES</span><div className="mf-scheduler-avatar-stack">{draft.participants.slice(0, 5).map(name => <Avatar key={name} size="sm" initials={name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()} alt={name} />)}{!draft.participants.length && <span className="mf-scheduler-muted">Add your team</span>}</div><span>{draft.participants.length} internal participant{draft.participants.length === 1 ? "" : "s"}</span></div>}
            <div className="mf-scheduler-preview-footer"><span>CRM schedule</span><span>IST · {draft.format}</span></div>
          </>}
        </div>
      </aside>
      <div className="mf-scheduler-main">
        <div className="mf-scheduler-progress"><button type="button" className="mf-scheduler-back" onClick={() => step > 1 ? setStep(step - 1) : onClose()} aria-label={step > 1 ? "Previous step" : "Close scheduler"}>{step > 1 ? "←" : ""}</button><div className="mf-scheduler-progress-bars" aria-label={`Step ${step} of 4`}>{[1, 2, 3, 4].map(index => <span key={index} data-active={index <= step} />)}</div><span className="mf-scheduler-step-count">{step}/4</span><button type="button" className="mf-scheduler-close" onClick={onClose} aria-label="Close scheduler">×</button></div>
        <form className="mf-scheduler-form" onSubmit={submit}>
          <div className="mf-scheduler-content" key={step}>
            {step === 1 && <><div className="mf-scheduler-heading"><h2>Schedule a meeting</h2><p>What’s it about and which customer is it with?</p></div><div className="mf-scheduler-fields"><Input label="Meeting title" isRequired fieldClassName={fieldClass} value={draft.title} onChange={title => patch({ title })} placeholder="e.g. Franchise discovery discussion" /><div className="mf-scheduler-suggestions" aria-label="Suggested meeting titles">{titles.map(title => <button type="button" key={title} onClick={() => patch({ title })}>{title}</button>)}</div>{chosen ? <Input label="Customer / opportunity" value={`${chosen.name} · ${chosen.opportunityId}`} isReadOnly fieldClassName={fieldClass} /> : <Choice label="Customer / opportunity" required value={draft.recordId} options={records.map(item => ({ id: item.id, name: `${item.name} · ${item.opportunityId}` }))} onChange={selectRecord} />}<Choice label="Meeting type" required value={draft.category} options={["Manager meeting", "Brand meeting", "Follow-up meeting"]} onChange={category => patch({ category: category as MeetingDraft["category"] })} /></div></>}
            {step === 2 && <><div className="mf-scheduler-heading"><h2>Who’s joining?</h2><p>Choose customer and team participants for this meeting.</p></div><div className="mf-scheduler-fields">{selected && <div className="mf-scheduler-customer-option"><Avatar size="md" initials={selected.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()} alt="" /><div><strong>{selected.name}</strong><span>{selected.category} · {selected.email || "Customer email not provided"}</span></div><span className="mf-scheduler-selected-mark">✓</span></div>}<div className="mf-scheduler-customer-fields"><Input label="Customer email" isRequired={draft.format === "Virtual"} type="email" fieldClassName={fieldClass} value={draft.customerEmail} onChange={customerEmail => patch({ customerEmail })} placeholder="name@company.com" /><Choice label="Responsible employee" required value={draft.assignedTo} options={assigneesFor(profile, working.records)} onChange={assignedTo => patch({ assignedTo, participants: [...new Set([...draft.participants, assignedTo])] })} /></div>{draft.category === "Manager meeting" && <Choice label="Meeting manager" required value={draft.manager} options={meetingProfiles.filter(item => item.scope === "team").map(item => item.name)} onChange={manager => patch({ manager, participants: [...new Set([...draft.participants, manager])] })} />}{draft.category === "Brand meeting" && <div className="grid gap-3 sm:grid-cols-2"><Input label="Brand representative" isRequired fieldClassName={fieldClass} value={draft.brandRepresentative} onChange={brandRepresentative => patch({ brandRepresentative })} /><Input label="Brand representative email" type="email" isRequired fieldClassName={fieldClass} value={draft.brandEmail} onChange={brandEmail => patch({ brandEmail })} /></div>}<fieldset className="mf-scheduler-participants"><legend>From your team</legend><div>{employees.map(name => { const isSelected = draft.participants.includes(name); return <button type="button" key={name} className="mf-scheduler-person outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring" aria-pressed={isSelected} onClick={() => patch({ participants: isSelected ? draft.participants.filter(item => item !== name) : [...new Set([...draft.participants, name])] })}><Avatar size="sm" initials={name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()} alt="" /><span className="mf-scheduler-person-name">{name}</span></button>; })}</div></fieldset><Input label="Meeting agenda" isRequired fieldClassName={fieldClass} value={draft.agenda} onChange={agenda => patch({ agenda })} placeholder="What should the meeting cover?" /></div></>}
            {step === 3 && <>
              <div className="mf-scheduler-heading"><h2>When?</h2><p>Choose a date and an available start time. Times are shown in India Standard Time.</p></div>
              <div className="mf-scheduler-when">
                <div className="mf-scheduler-calendar">
                  <div className="mf-scheduler-calendar-heading"><span>{day ? new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : "Select a date"}</span><RiCalendarLine className="size-4" aria-hidden /></div>
                  <DateCalendar aria-label="Meeting date" value={calendarValue} minValue={minimumDate} onChange={value => setMeetingDate(new CalendarDate(value.year, value.month, value.day).toString())} />
                </div>
                <div className="mf-scheduler-time-panel">
                  <span className="mf-scheduler-field-label">Meeting length</span><div className="mf-scheduler-duration">{[15, 30, 45, 60].map(duration => <button type="button" key={duration} aria-pressed={draft.duration === duration} onClick={() => patch({ duration })}>{duration}m</button>)}</div>
                  <span className="mf-scheduler-field-label">Start time</span>
                  <div className="mf-scheduler-time-grid">{times.map(value => { const conflict = hasTimeConflict(value); const past = day === today && Date.parse(fromIst(day, value)) <= Date.now(); const disabled = conflict || past; return <button type="button" key={value} disabled={disabled} aria-pressed={time === value} title={conflict ? "Conflicts with another CRM meeting" : past ? "This time has passed" : undefined} onClick={() => setMeetingTime(value)}>{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(fromIst(day || today, value)))}</button>; })}</div>
                </div>
              </div><p className="mf-scheduler-helper">Busy slots are based on CRM meeting records. External calendars are not connected.</p>
            </>}
            {step === 4 && <>
              <div className="mf-scheduler-heading"><h2>Video and AI assistant</h2><p>Where the call happens and who takes notes.</p></div>
              <div className="mf-scheduler-fields">
                <span className="mf-scheduler-field-label">Meeting format</span>
                <div className="mf-scheduler-format-options"><button type="button" aria-pressed={draft.format === "Virtual"} onClick={() => patch({ format: "Virtual" })}>Video meeting</button><button type="button" aria-pressed={draft.format === "In person"} onClick={() => patch({ format: "In person", platform: undefined, meetLink: "" })}>In person</button></div>
                {draft.format === "Virtual" ? <>
                  <span className="mf-scheduler-field-label">Video platform</span>
                  <div className="mf-scheduler-platforms">{platforms.map(platform => <button type="button" key={platform} aria-pressed={draft.platform === platform} onClick={() => patch({ platform })}><span className="mf-scheduler-platform-icon"><MeetingPlatformLogo platform={platform} className="size-6" /></span><strong>{platform}</strong><small>{draft.platform === platform ? "Selected · connection setup required" : "Choose platform"}</small></button>)}</div>
                  <Input label="Existing meeting link (optional)" fieldClassName={fieldClass} value={draft.meetLink} onChange={meetLink => patch({ meetLink })} placeholder="Paste an existing https:// meeting link" />
                  <div className="mf-scheduler-setup-note"><span aria-hidden="true">i</span><p>We’ll save this meeting in the CRM. Connect a calendar and video platform to send invitations or create new links.</p></div>
                  <fieldset className="mf-scheduler-participants"><legend>AI assistant</legend><div className="mf-scheduler-assistant-options">{assistantOptions.map(assistant => <button type="button" key={assistant.value} aria-pressed={(draft.assistant ?? "None") === assistant.value} onClick={() => patch({ assistant: assistant.value })}><span className="mf-scheduler-assistant-mark" aria-hidden="true">{assistant.mark}</span>{assistant.label}</button>)}</div></fieldset>
                  <div className="mf-scheduler-ai-settings">
                    <div className="mf-scheduler-ai-setting"><span className="mf-scheduler-ai-setting-copy"><strong>Summarize the call</strong><small>A short recap on the customer’s timeline</small></span><button type="button" role="switch" aria-label="Summarize the call" aria-checked={draft.summarizeCall ?? false} className="mf-scheduler-ai-switch" onClick={() => patch({ summarizeCall: !draft.summarizeCall })} /></div>
                    <div className="mf-scheduler-ai-setting"><span className="mf-scheduler-ai-setting-copy"><strong>Capture action items</strong><small>Turn next steps into tasks with owners</small></span><button type="button" role="switch" aria-label="Capture action items" aria-checked={draft.captureActionItems ?? false} className="mf-scheduler-ai-switch" onClick={() => patch({ captureActionItems: !draft.captureActionItems })} /></div>
                    <div className="mf-scheduler-ai-setting"><span className="mf-scheduler-ai-setting-copy"><strong>Assist live</strong><small>Answers questions with account data during the call</small></span><button type="button" role="switch" aria-label="Assist live" aria-checked={draft.assistLive ?? false} className="mf-scheduler-ai-switch" onClick={() => patch({ assistLive: !draft.assistLive })} /></div>
                  </div>
                </> : <div className="grid gap-3 sm:grid-cols-2"><Input label="Meeting location" isRequired fieldClassName={fieldClass} value={draft.location} onChange={location => patch({ location })} placeholder="Office, venue or customer location" /><Input label="Complete address" isRequired fieldClassName={fieldClass} value={draft.address} onChange={address => patch({ address })} placeholder="Street, city, postal code" /></div>}
                <Textarea label="Additional notes (optional)" fieldClassName={fieldClass} value={draft.remarks} onChange={remarks => patch({ remarks })} rows={2} placeholder="Add a note for the attendees" />
                <div className="mf-scheduler-review"><span>Ready to schedule</span><strong>{draft.title || "Meeting title"}</strong><small>{selected?.name ?? "Customer"} · {previewDate} at {time} IST · {draft.duration} minutes</small></div>
              </div>
            </>}
            {error && <p role="alert" className="mf-scheduler-error">{error}</p>}
          </div>
          <div className="mf-scheduler-actions">{step > 1 && <Button type="button" variant="secondary" onClick={() => { setError(""); setStep(current => current - 1); }}>Back</Button>}{step < 4 ? <Button key="continue-step" type="button" className="mf-scheduler-primary" onClick={continueStep}>Continue</Button> : <Button key="schedule-meeting" type="submit" className="mf-scheduler-primary">Schedule meeting</Button>}</div>
        </form>
      </div>
    </div>}
  </Modal>;
}
export type ActionMode = "reschedule" | "reassign" | "complete" | "cancel" | "postpone" | "outcome" | "review";
export function ActionForm({ item, kind, mode, state, profile, onClose }: { item: Meeting | FollowUp; kind: "meeting" | "follow-up"; mode: ActionMode; state: MeetingsState; profile: MeetingProfile; onClose: () => void }) {
  const [date, setDate] = useState(""); const [text, setText] = useState(""); const [employee, setEmployee] = useState(item.assignedTo); const [outcome, setOutcome] = useState("Conducted"); const [error, setError] = useState("");
  const labels = { reschedule: "Reschedule", reassign: "Reassign", complete: "Complete", cancel: "Cancel", postpone: "Postpone", outcome: "Record outcome", review: "Review minutes" };
  function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      updateMeetings(current => kind === "follow-up" ? changeFollowUp(current, profile, item.id, mode === "reschedule" ? { type: mode, dueAt: date, reason: text } : mode === "reassign" ? { type: mode, assignedTo: employee, reason: text } : mode === "complete" ? { type: mode, outcome: text } : { type: "cancel", reason: text }) : changeMeeting(current, profile, item.id, mode === "reschedule" ? { type: mode, startAt: date, reason: text } : mode === "outcome" ? { type: mode, outcome: outcome as Extract<MeetingAction, { type: "outcome" }>["outcome"], remarks: text } : mode === "review" ? { type: mode, comment: text } : { type: mode === "postpone" ? "postpone" : "cancel", reason: text })); onClose();
    } catch (failure) { setError((failure as Error).message); }
  }
  return <FormDialog title={mode === "review" ? "Review meeting minutes" : mode === "outcome" ? "Record meeting outcome" : `${labels[mode]} ${kind}`} description={item.title} error={error} submit={submit} submitLabel={mode === "cancel" ? `Cancel ${kind}` : labels[mode]} cancelLabel={mode === "cancel" ? `Keep ${kind}` : "Back"} onClose={onClose}>
    {mode === "reschedule" && <><p className="text-body-2-regular text-text-secondary">Current schedule: {displayTime("dueAt" in item ? item.dueAt : item.startAt)} IST</p><DateTimeFields value={date} onChange={setDate} label="New" /></>}
    {mode === "reassign" && <Choice label="Assigned employee" required value={employee} onChange={setEmployee} options={assigneesFor(profile, state.records)} />}
    {mode === "outcome" && <Choice label="Meeting outcome" required value={outcome} onChange={setOutcome} options={["Conducted", "Customer did not attend", "Internal participant did not attend", "Customer requested rescheduling"]} />}
    <Textarea label={mode === "complete" ? "Completion outcome" : mode === "outcome" ? "Outcome remarks" : mode === "review" ? "Review comment" : "Reason"} isRequired value={text} onChange={setText} fieldClassName={fieldClass} rows={4} placeholder={mode === "complete" ? "Record what happened and the agreed next step" : "Explain this update for the activity history"} />
    <p className="text-caption-1-regular text-text-secondary">This update will be recorded in the customer's activity history.</p>
  </FormDialog>;
}
const minuteFields = [{ key: "summary", label: "Discussion summary" }, { key: "requirements", label: "Customer requirements" }, { key: "businessRequirements", label: "Business requirements" }, { key: "concerns", label: "Questions and concerns" }, { key: "investment", label: "Investment discussion" }, { key: "nextSteps", label: "Agreed next steps" }] as const;
export { minuteFields };
export function MinutesForm({ meeting, profile, onClose }: { meeting: Meeting; profile: MeetingProfile; onClose: () => void }) {
  const previous = meeting.minutes.at(-1);
  const [draft, setDraft] = useState<Omit<Minutes, "version" | "author" | "at" | "review">>({ summary: previous?.summary ?? "", requirements: previous?.requirements ?? "", businessRequirements: previous?.businessRequirements ?? "", concerns: previous?.concerns ?? "", investment: previous?.investment ?? "", interest: previous?.interest ?? "", nextSteps: previous?.nextSteps ?? "", remarks: previous?.remarks ?? "", nextFollowUpAt: "" });
  const [follow, setFollow] = useState(false); const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      if (follow && !draft.nextFollowUpAt) throw new Error("Choose a due date and time for the next follow-up.");
      updateMeetings(current => {
        const minutes = { ...draft, nextFollowUpAt: follow ? draft.nextFollowUpAt : previous?.nextFollowUpAt ?? "" };
        let next = changeMeeting(current, profile, meeting.id, { type: "minutes", minutes });
        if (follow) next = createFollowUp(next, profile, { recordId: meeting.recordId, linkType: "Opportunity", title: `Next steps: ${meeting.title}`, description: draft.nextSteps, assignedTo: meeting.assignedTo, dueAt: draft.nextFollowUpAt, priority: "Medium", source: { id: meeting.id, recordId: meeting.recordId, title: meeting.title, type: "Meeting minutes", when: displayTime(meeting.startAt) } });
        return next;
      }); onClose();
    } catch (failure) { setError((failure as Error).message); }
  }
  return <FormDialog title={previous ? `Correct meeting minutes · Version ${meeting.minutes.length + 1}` : "Submit meeting minutes"} description={`${meeting.id} · ${meeting.title}. Previous versions remain in the history.`} error={error} submit={submit} submitLabel="Save minutes" onClose={onClose} wide>
    <p className="text-body-2-regular text-text-secondary">{displayTime(meeting.startAt)} IST · {meeting.category}<br />Participants: {meeting.participants.join(", ")}</p>
    {minuteFields.map(field => <Textarea key={field.key} label={field.label} isRequired fieldClassName={fieldClass} rows={2} value={draft[field.key]} onChange={value => setDraft(current => ({ ...current, [field.key]: value }))} placeholder={field.key === "concerns" ? "Record concerns, or state that none were raised" : undefined} />)}
    <Choice label="Customer interest level" required value={draft.interest} options={["High", "Medium", "Low", "Not interested", "Needs more information"]} onChange={interest => setDraft(current => ({ ...current, interest }))} />
    <Textarea label="Additional remarks (optional)" fieldClassName={fieldClass} value={draft.remarks} rows={2} onChange={remarks => setDraft(current => ({ ...current, remarks }))} />
    <Checkbox isSelected={follow} onChange={setFollow}>Create a follow-up for the agreed next steps</Checkbox>
    {follow && <DateTimeFields value={draft.nextFollowUpAt} onChange={nextFollowUpAt => setDraft(current => ({ ...current, nextFollowUpAt }))} />}
  </FormDialog>;
}
