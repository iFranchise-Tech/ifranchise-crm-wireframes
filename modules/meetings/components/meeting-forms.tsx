"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarDate, parseDate } from "@internationalized/date";
import { RiCalendarLine } from "@remixicon/react";
import { DateCalendar } from "@/components/base/date-picker/date-calendar";
import { Dropdown, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Textarea } from "@/components/base/textarea/textarea";
import { Select, SelectItem } from "@/components/base/select/select";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { assigneesFor, canManageRecord, changeFollowUp, changeMeeting, createFollowUp, createMeeting, displayTime, fromIst, istParts, meetingProfiles } from "../records";
import { updateMeetings, withCustomer } from "../store";
import type { ActivitySource, CustomerRecord, FollowUp, FollowUpDraft, Meeting, MeetingAction, MeetingDraft, MeetingProfile, MeetingsState, Minutes } from "../types";

export const fieldClass = "border border-border-button-default bg-background-primary-default text-text-primary";
export function Choice({ label, value, onChange, options, required = false, placeholder, className }: { label: string; value: string; onChange: (value: string) => void; options: (string | { id: string; name: string })[]; required?: boolean; placeholder?: string; className?: string }) {
  return <Select label={label} selectedKey={value || null} onSelectionChange={key => onChange(String(key))} isRequired={required} placeholder={placeholder ?? `Select ${label.toLowerCase()}`} className={className} triggerClassName={fieldClass}>{options.map(option => { const item = typeof option === "string" ? { id: option, name: option } : option; return <SelectItem key={item.id} id={item.id}>{item.name}</SelectItem>; })}</Select>;
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
export function MeetingForm({ state, profile, record, onClose, onSaved }: { state: MeetingsState; profile: MeetingProfile; record?: CustomerRecord; onClose: () => void; onSaved?: (id: string) => void }) {
  const working = record ? withCustomer(state, record) : state;
  const records = working.records.filter(item => item.opportunityId && canManageRecord(profile, item));
  const chosen = record ? working.records.find(item => item.id === record.id) : undefined;
  const [draft, setDraft] = useState<MeetingDraft>({ recordId: chosen?.id ?? "", opportunityId: chosen?.opportunityId ?? "", title: "", category: "Follow-up meeting", format: "Virtual", startAt: "", duration: 30, assignedTo: chosen?.owner ?? "", participants: chosen ? [chosen.owner] : [], manager: "", brandRepresentative: "", brandEmail: "", customerEmail: chosen?.email ?? "", agenda: "", remarks: "", location: "", address: "", meetLink: "" });
  const [error, setError] = useState("");
  const patch = (value: Partial<MeetingDraft>) => setDraft(current => ({ ...current, ...value }));
  const employees = assigneesFor(meetingProfiles[0], working.records);
  function selectRecord(recordId: string) { const selected = records.find(item => item.id === recordId)!; patch({ recordId, opportunityId: selected.opportunityId!, customerEmail: selected.email, assignedTo: selected.owner, participants: [selected.owner] }); }
  function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try { let id = ""; updateMeetings(current => { const next = createMeeting(record ? withCustomer(current, record) : current, profile, draft); id = next.meetings[0].id; return next; }); onSaved?.(id); onClose(); } catch (failure) { setError((failure as Error).message); }
  }
  return <FormDialog title="Schedule meeting" description="Coordinate a manager, brand, or follow-up meeting linked to an opportunity." submit={submit} submitLabel="Save meeting" error={error} onClose={onClose} wide>
    <p className="rounded-xl bg-background-secondary-default p-3 text-body-2-regular text-text-secondary">Google Calendar is not connected. This saves the meeting in CRM as “Pending sync”. No Meet link or invitation will be generated or sent.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {chosen?.opportunityId ? <Input label="Opportunity" value={`${chosen.name} · ${chosen.opportunityId}`} isReadOnly fieldClassName={fieldClass} /> : <Choice label="Opportunity" required value={draft.recordId} options={records.map(item => ({ id: item.id, name: `${item.name} · ${item.opportunityId}` }))} onChange={selectRecord} />}
      <Input label="Customer email" isRequired type="email" fieldClassName={fieldClass} value={draft.customerEmail} onChange={customerEmail => patch({ customerEmail })} />
    </div>
    <div className={draft.format === "Virtual" ? "grid gap-4 sm:grid-cols-2" : undefined}>
      <Input label="Meeting title" isRequired fieldClassName={fieldClass} value={draft.title} onChange={title => patch({ title })} placeholder="e.g. Franchise discovery discussion" />
      {draft.format === "Virtual" && <Input label="Existing Google Meet link (optional)" fieldClassName={fieldClass} value={draft.meetLink} onChange={meetLink => patch({ meetLink })} placeholder="https://meet.google.com/abc-defg-hij" />}
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Choice label="Meeting category" required value={draft.category} options={["Manager meeting", "Brand meeting", "Follow-up meeting"]} onChange={category => patch({ category: category as MeetingDraft["category"] })} />
      <Choice label="Meeting format" required value={draft.format} options={["Virtual", "In person"]} onChange={format => patch({ format: format as MeetingDraft["format"] })} />
      <Choice label="Responsible employee" required value={draft.assignedTo} options={assigneesFor(profile, working.records)} onChange={assignedTo => patch({ assignedTo, participants: [...new Set([...draft.participants, assignedTo])] })} />
      <Choice label="Duration" required value={String(draft.duration)} options={[15, 30, 45, 60, 90, 120].map(value => ({ id: String(value), name: `${value} minutes` }))} onChange={value => patch({ duration: Number(value) })} />
    </div>
    <DateTimeFields label="Meeting" value={draft.startAt} onChange={startAt => patch({ startAt })} />
    <p className="text-caption-1-regular text-text-secondary">Conflicts are checked against CRM meetings. External calendars are not available.</p>
    {draft.category === "Manager meeting" && <Choice label="Meeting manager" required value={draft.manager} options={meetingProfiles.filter(item => item.scope === "team").map(item => item.name)} onChange={manager => patch({ manager, participants: [...new Set([...draft.participants, manager])] })} />}
    {draft.category === "Brand meeting" && <div className="grid gap-4 sm:grid-cols-2"><Input label="Brand representative" isRequired fieldClassName={fieldClass} value={draft.brandRepresentative} onChange={brandRepresentative => patch({ brandRepresentative })} /><Input label="Brand representative email" type="email" isRequired fieldClassName={fieldClass} value={draft.brandEmail} onChange={brandEmail => patch({ brandEmail })} /></div>}
    <fieldset className="flex flex-col gap-3"><legend className="mb-2 text-body-medium text-text-primary">Internal participants <span className="text-text-error-primary">*</span></legend><div className="grid gap-3 sm:grid-cols-2">{employees.map(name => <Checkbox key={name} isSelected={draft.participants.includes(name)} onChange={selected => patch({ participants: selected ? [...draft.participants, name] : draft.participants.filter(item => item !== name) })}>{name}</Checkbox>)}</div></fieldset>
    {draft.format === "In person" && <><Input label="Meeting location" isRequired fieldClassName={fieldClass} value={draft.location} onChange={location => patch({ location })} placeholder="Office, venue or customer location" /><Textarea label="Complete address" isRequired fieldClassName={fieldClass} value={draft.address} onChange={address => patch({ address })} rows={2} /></>}
    <Textarea label="Agenda" isRequired fieldClassName={fieldClass} value={draft.agenda} onChange={agenda => patch({ agenda })} rows={3} placeholder="What should the meeting cover?" />
    <Textarea label="Remarks (optional)" fieldClassName={fieldClass} value={draft.remarks} onChange={remarks => patch({ remarks })} rows={2} />
  </FormDialog>;
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
