"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CalendarDate } from "@internationalized/date";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowLeftRightLine,
  RiAttachment2,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiFileTextLine,
  RiGlobalLine,
  RiMailLine,
  RiMapPin2Line,
  RiFileExcelLine,
  RiFilePdf2Line,
  RiFileZipLine,
  RiImageLine,
  RiMoreLine,
  RiPencilLine,
  RiPhoneLine,
  RiSendPlane2Line,
  RiStackLine,
  RiStickyNoteLine,
  RiStore2Line,
  RiTimeLine,
  RiUserSharedLine,
  RiVideoOnLine,
  RiWhatsappLine,
} from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { DateCalendar, DateRangeCalendar } from "@/components/base/date-picker/date-calendar";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { SelectItem } from "@/components/base/select/select";
import { portraitFor } from "@/modules/users-roles/portrait";
import type { Activity, Enquiry, EnquiryStatus } from "../types";
import { brands, enquiryStatuses, originalSources, timelines } from "../types";
import { cityOptions, formatLeadDate, LeadSelect, stateForCity, stateOptions, SuggestField } from "./lead-fields";

const statusColor: Record<EnquiryStatus, ChipColor> = { New: "purple", "In Progress": "yellow", Qualified: "lime", Converted: "blue" };
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const slotTimes = Array.from({ length: 25 }, (_, index) => {
  const minutes = 9 * 60 + index * 30;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour = hour24 % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${hour24 >= 12 ? "PM" : "AM"}`;
});

type Draft = {
  brand: string;
  mobile: string;
  email: string;
  requirement: string;
  qualification: string;
  resume: string;
  source: string;
  owner: string;
  received: string;
  state: string;
  city: string;
  address: string;
};

type FeedKind = "note" | "call" | "email" | "status" | "created" | "meeting" | "follow";
type FeedItem = { id: string; kind: FeedKind; title: string; when: string; body: string; person?: string; done?: boolean; from?: string; to?: string; files?: string[]; schedule?: string };
type NoteFile = { id: string; name: string; size: string; type: string };

function initials(name: string) {
  return (name.trim()[0] ?? "").toUpperCase();
}

function phone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return value;
}

function partsOf(extra: string) {
  return extra.split(" · ").map(part => part.trim()).filter(Boolean);
}

function requirementOf(enquiry: Enquiry) {
  const parts = partsOf(enquiry.extra);
  if (enquiry.category === "Job") return parts.find(part => /notice|within|month/i.test(part)) ?? parts.at(-1) ?? "—";
  const known = [...parts].reverse().find(part => (timelines as readonly string[]).includes(part));
  return known ?? parts.at(-1) ?? "—";
}

function qualificationOf(enquiry: Enquiry) {
  const requirement = requirementOf(enquiry);
  return partsOf(enquiry.extra).filter(part => part !== requirement).join(" · ") || "—";
}

function applyRequirement(extra: string, requirement: string) {
  const parts = extra.split(" · ").map(part => part.trim()).filter(Boolean);
  const index = parts.findIndex(part => (timelines as readonly string[]).includes(part));
  if (index >= 0) {
    parts[index] = requirement;
    return parts.join(" · ");
  }
  if (!parts.length) return requirement;
  parts[parts.length - 1] = requirement;
  return parts.join(" · ");
}

function withCurrent(list: readonly string[], current: string) {
  return list.includes(current) ? [...list] : [current, ...list];
}

function parseLeadDate(value: string) {
  const match = value.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return new CalendarDate(2026, 11, 12);
  const month = months.findIndex(item => item.toLowerCase() === match[2].slice(0, 3).toLowerCase());
  return new CalendarDate(Number(match[3]), Math.max(month, 0) + 1, Number(match[1]));
}

function parseLeadTime(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "4:00 PM";
  return `${Number(match[1])}:${match[2]} ${match[3].toUpperCase()}`;
}

function snapshot(enquiry: Enquiry): Draft {
  return {
    brand: enquiry.category === "Job" ? enquiry.focus : enquiry.brand,
    mobile: enquiry.mobile,
    email: enquiry.email,
    requirement: requirementOf(enquiry),
    qualification: enquiry.category === "Brand expansion" ? enquiry.focus : qualificationOf(enquiry),
    resume: enquiry.resume || "Resume received",
    source: enquiry.originalSource,
    owner: enquiry.owner,
    received: enquiry.received,
    state: enquiry.state,
    city: enquiry.city,
    address: enquiry.address,
  };
}

function feedItems(enquiry: Enquiry, activities: Activity[]): FeedItem[] {
  const rows: FeedItem[] = activities.map(item => {
    const note = item.type === "Other Communication" || /note/i.test(item.title);
    const kind: FeedKind = note ? "note" : item.kind === "email" ? "email" : item.kind === "meeting" ? "meeting" : item.kind === "call" || /call/i.test(item.title) ? "call" : "follow";
    return { id: item.id, kind, title: note ? "Note added" : item.title, when: item.when || item.due, body: item.summary, person: item.createdBy, done: item.status === "Completed", files: note ? item.attachments : undefined, schedule: note && item.followUp ? item.followUp : undefined };
  });
  if (enquiry.status !== "New") rows.push({ id: "status", kind: "status", title: "Status changed", when: enquiry.received, body: "", from: "New", to: enquiry.status });
  rows.push({ id: "created", kind: "created", title: "Enquiry created", when: enquiry.received, body: `Enquiry received from ${enquiry.originalSource.toLowerCase()}.` });
  return rows;
}

function laterTime(time: string) {
  const index = slotTimes.indexOf(time);
  if (index < 0) return time;
  return slotTimes[Math.min(index + 1, slotTimes.length - 1)];
}

function firstName(name: string) {
  return name.split(" ").filter(Boolean)[0] ?? name;
}

type EnquiryDoc = { id: string; name: string; type: string; size: string; by: string; when: string };

const sampleDocs: EnquiryDoc[] = [
  { id: "doc-1", name: "Franchise Deck.pdf", type: "PDF", size: "4.2 MB", by: "Himani Bhargava Tapadiya", when: "12 Nov 2026, 4:00 PM" },
  { id: "doc-2", name: "Investment Breakdown.xlsx", type: "XLSX", size: "1.8 MB", by: "Shakshay Gupta", when: "10 Nov 2026, 11:20 AM" },
  { id: "doc-3", name: "Site Photos.zip", type: "ZIP", size: "12.6 MB", by: "Himani Bhargava Tapadiya", when: "7 Nov 2026, 2:15 PM" },
  { id: "doc-4", name: "Location Map.png", type: "PNG", size: "624 KB", by: "Swetha Chintada", when: "4 Nov 2026, 10:30 AM" },
];

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileType(name: string) {
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  if (ext === "JPEG") return "JPG";
  return ext;
}

export function EnquiryDetail({
  enquiry,
  activities,
  owners,
  note,
  onNote,
  onBack,
  onSave,
  onChangeOwner,
  onStatus,
  onSchedule,
  onSendNote,
  onPatchActivity,
  actor,
}: {
  enquiry: Enquiry;
  activities: Activity[];
  owners: string[];
  note: string;
  onNote: (value: string) => void;
  onBack: () => void;
  onSave: (patch: Partial<Enquiry>) => void;
  onChangeOwner: () => void;
  onStatus: (status: EnquiryStatus) => void;
  onSchedule: (update: { id?: string; due: string; meetLink?: string }) => void;
  onSendNote: (extra?: { files: { name: string }[]; schedule?: string }) => void;
  onPatchActivity: (id: string, patch: Partial<Activity>) => void;
  actor: string;
}) {
  const [tab, setTab] = useState("Overview");
  const [statusOpen, setStatusOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => snapshot(enquiry));
  const [scheduling, setScheduling] = useState(false);
  const [feed, setFeed] = useState("All Activity");
  const [followFilter, setFollowFilter] = useState("All");
  const [docs, setDocs] = useState<EnquiryDoc[]>(sampleDocs);
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [schedule, setSchedule] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("4:00 PM");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setEditing(false);
    setDraft(snapshot(enquiry));
    setFeed("All Activity");
    setFollowFilter("All");
    setDocs(sampleDocs);
    setFiles([]);
    setSchedule("");
    setScheduleOpen(false);
  }, [enquiry.id]);
  const followable = (item: Activity) => item.type !== "Other Communication" && !/note/i.test(item.title);
  const followUp = activities.find(item => followable(item) && (item.status === "Pending" || item.status === "Scheduled")) ?? [...activities].reverse().find(item => followable(item) && item.due);
  const followUps = activities.filter(followable);
  function sendComposer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim() && !files.length && !schedule) return;
    if (files.length) {
      const stamp = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      setDocs(list => [...files.map(file => ({ id: file.id, name: file.name, type: file.type, size: file.size, by: actor, when: stamp })), ...list]);
    }
    onSendNote({ files, schedule: schedule || undefined });
    setFiles([]);
    setSchedule("");
    setScheduleOpen(false);
  }
  const view = editing ? draft : snapshot(enquiry);
  const facts = enquiry.category === "Job"
    ? [
        { icon: RiStore2Line, label: "Position", value: editing ? draft.brand : enquiry.focus },
        { icon: RiMapPin2Line, label: "Location", value: enquiry.city },
      ]
    : [
        { icon: RiMapPin2Line, label: "Location", value: enquiry.city },
        { icon: RiStore2Line, label: "Investment Capacity", value: enquiry.investment },
      ];
  const timeline = [
    { id: "created", title: "Enquiry created", detail: `Enquiry received from ${enquiry.originalSource.toLowerCase()}.`, when: enquiry.received },
    { id: "owner", title: `Assigned to ${enquiry.owner}`, detail: "Lead assigned for follow-up.", when: enquiry.received },
    ...[...activities].reverse().map(item => ({ id: item.id, title: item.title, detail: item.summary, when: item.when || item.due })),
  ];

  function startEdit() {
    setDraft(snapshot(enquiry));
    setEditing(true);
    setTab("Overview");
  }

  function save() {
    const brand = draft.brand.trim() || (enquiry.category === "Job" ? enquiry.focus : enquiry.brand);
    const requirement = draft.requirement.trim() || requirementOf(enquiry);
    onSave({
      mobile: draft.mobile.trim() || enquiry.mobile,
      email: draft.email.trim(),
      brand: enquiry.category === "Job" ? enquiry.brand : brand,
      focus: enquiry.category === "Job" ? brand : enquiry.category === "Brand expansion" ? (draft.qualification.trim() || enquiry.focus) : brand || enquiry.focus,
      extra: enquiry.category === "Job"
        ? [draft.qualification.trim(), requirement].filter(Boolean).join(" · ")
        : enquiry.category === "Franchise"
          ? applyRequirement(enquiry.extra, requirement)
          : enquiry.extra.replace(requirementOf(enquiry), requirement),
      resume: enquiry.category === "Job" ? draft.resume.trim() : enquiry.resume,
      originalSource: draft.source,
      owner: draft.owner,
      state: draft.state.trim() || enquiry.state,
      city: draft.city.trim() || enquiry.city,
      address: draft.address.trim(),
      received: draft.received,
    });
    setEditing(false);
  }

  return (
    <div className="ld-detail">
      <div className="ld-detail-top">
        <div className="flex min-w-0 items-start gap-3">
          <button type="button" className="ld-back" aria-label="Back to enquiries" onClick={onBack}><RiArrowLeftLine /></button>
          <div>
            <h2>Enquiry Details</h2>
            <p>View, update and manage this enquiry.</p>
          </div>
        </div>
        <div className="ld-detail-actions">
          {editing ? (
            <>
              <Button variant="secondary" size="small" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="small" onClick={save}>Save</Button>
            </>
          ) : (
            <Button variant="secondary" size="small" leadingIcon={RiPencilLine} onClick={startEdit}>Edit</Button>
          )}
          <Button variant="secondary" size="small" leadingIcon={RiStickyNoteLine} onClick={() => { setTab("Activity & Notes"); window.setTimeout(() => document.getElementById("enquiry-note")?.focus(), 40); }}>Add Note</Button>
          <Button variant="secondary" size="small" leadingIcon={RiUserSharedLine} onClick={onChangeOwner}>Change Owner</Button>
          <Dropdown isOpen={statusOpen} onOpenChange={setStatusOpen}>
            <DropdownTrigger className="ld-update" aria-label="Update status">Update Status <RiArrowDownSLine className="size-4" /></DropdownTrigger>
            <DropdownPopover aria-label="Update status" placement="bottom end" className="w-[180px]">
              {enquiryStatuses.map(item => (
                <DropdownItem key={item} selected={item === enquiry.status} onSelect={() => { setStatusOpen(false); onStatus(item); }}>{item}</DropdownItem>
              ))}
            </DropdownPopover>
          </Dropdown>
        </div>
      </div>

      <section className="ld-hero">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" initials={initials(enquiry.name)} alt="" className="ld-initials size-14" />
          <div className="min-w-0">
            <strong>{enquiry.name}</strong>
            <span>{enquiry.id} · {view.source}</span>
          </div>
          <Chip variant="caption" color={statusColor[enquiry.status]} className="ld-pill rounded-full px-2">{enquiry.status}</Chip>
        </div>
        <div className="ld-hero-facts">
          {facts.filter(fact => fact.value).map(fact => (
            <div key={fact.label}>
              <fact.icon />
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="ld-tabs" role="tablist">
        {["Overview", "Activity & Notes", "Follow-ups", "Documents"].map(item => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="ld-detail-grid">
          <div className="ld-detail-col">
            <section className="ld-card">
              <h3>Lead Information</h3>
              <div className="ld-facts">
                <div className="ld-fact-split">
                  <Field label="Requirement" editing={editing} value={view.requirement} onChange={requirement => setDraft(current => ({ ...current, requirement }))} options={enquiry.category === "Franchise" ? withCurrent(timelines, view.requirement) : undefined} />
                  {enquiry.category === "Job" ? (
                    <Field label="Qualification" editing={editing} value={view.qualification} onChange={qualification => setDraft(current => ({ ...current, qualification }))} />
                  ) : enquiry.category === "Brand expansion" ? (
                    <Field label="Industry" editing={editing} value={view.qualification} onChange={qualification => setDraft(current => ({ ...current, qualification }))} />
                  ) : (
                    <Field label="Interested Brand" editing={editing} value={view.brand} onChange={brand => setDraft(current => ({ ...current, brand }))} options={withCurrent(brands, view.brand)} />
                  )}
                </div>
                {enquiry.category === "Job" && (
                  <div className="ld-fact-split">
                    <Field label="Position" editing={editing} value={view.brand} onChange={brand => setDraft(current => ({ ...current, brand }))} />
                    <Field label="Resume" editing={editing} value={view.resume} onChange={resume => setDraft(current => ({ ...current, resume }))} />
                  </div>
                )}
                <div className="ld-fact-split">
                  <Field label="Phone" editing={editing} value={editing ? draft.mobile : phone(view.mobile)} onChange={mobile => setDraft(current => ({ ...current, mobile }))} />
                  <Field label="Email" editing={editing} value={view.email} onChange={email => setDraft(current => ({ ...current, email }))} />
                </div>
              </div>
            </section>
            <section className="ld-card">
              <h3>Enquiry Details</h3>
              <div className="ld-facts">
                <div className="ld-fact-split">
                  <Field
                    label="Source"
                    editing={editing}
                    value={view.source}
                    display={<span className="ld-with-icon"><SourceGlyph name={view.source} />{view.source}</span>}
                    onChange={source => setDraft(current => ({ ...current, source }))}
                    options={withCurrent(originalSources, view.source)}
                  />
                  <Field
                    label="Assigned To"
                    editing={editing}
                    value={view.owner}
                    display={<span className="ld-with-icon"><Avatar size="sm" src={portraitFor(view.owner)} initials={initials(view.owner)} alt="" />{view.owner}</span>}
                    onChange={owner => setDraft(current => ({ ...current, owner }))}
                    options={withCurrent(owners, view.owner)}
                  />
                </div>
                <div className="ld-fact-split">
                  <Field label="Enquiry Date" editing={editing} value={view.received} onChange={received => setDraft(current => ({ ...current, received }))} date />
                  <Field label="Address" editing={editing} value={view.address} onChange={address => setDraft(current => ({ ...current, address }))} />
                </div>
                <div className="ld-fact-split">
                  <Field label="State" editing={editing} value={view.state} onChange={state => setDraft(current => ({ ...current, state }))} suggest={stateOptions} />
                  <Field label="City" editing={editing} value={view.city} onChange={city => setDraft(current => ({ ...current, city, state: stateForCity(city) ?? current.state }))} suggest={cityOptions} />
                </div>
              </div>
            </section>
          </div>
          <div className="ld-detail-col">
            <section className="ld-follow">
              <h3><RiCalendarLine /> Next Follow-up</h3>
              {followUp ? (
                <>
                  <div className="ld-follow-line">
                    <strong>{followUp.title}</strong>
                    <Button variant="secondary" size="small" onClick={() => setScheduling(true)}>Reschedule</Button>
                  </div>
                  <span><RiCalendarLine /> {followUp.due}</span>
                  {followUp.meetLink && <span><RiVideoOnLine /> {followUp.meetLink}</span>}
                </>
              ) : (
                <div className="ld-follow-line">
                  <p>No follow-up scheduled.</p>
                  <Button variant="secondary" size="small" onClick={() => setScheduling(true)}>Schedule</Button>
                </div>
              )}
            </section>
            <section className="ld-card ld-recent">
              <h3>Recent Activity</h3>
              <ol className="ld-timeline">
                {timeline.map(item => (
                  <li key={item.id}>
                    <div><strong>{item.title}</strong><em>{item.when}</em></div>
                    <p>{item.detail}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      )}

      {tab === "Activity & Notes" && (
        <div className="ld-pane ld-split">
          <section className="ld-card ld-feed-card">
            <form className="ld-composer-form" onSubmit={sendComposer}>
              <div className="ld-composer">
                <Avatar size="sm" src={portraitFor(enquiry.owner)} initials={initials(enquiry.owner)} alt="" />
                <input id="enquiry-note" value={note} placeholder="Add a note, update or log an activity..." onChange={event => onNote(event.target.value)} />
                <label className="ld-composer-icon">
                  <RiAttachment2 />
                  <input ref={fileRef} type="file" multiple aria-label="Attach files or images" onChange={event => {
                    const picked = [...(event.target.files ?? [])].map(file => ({ id: `${file.name}-${file.size}-${file.lastModified}`, name: file.name, size: fileSize(file.size), type: fileType(file.name) }));
                    setFiles(list => {
                      const seen = new Set(list.map(item => item.id));
                      const next = picked.filter(file => seen.has(file.id) ? false : (seen.add(file.id), true));
                      return next.length ? [...list, ...next] : list;
                    });
                    event.target.value = "";
                  }} />
                </label>
                <Dropdown isOpen={scheduleOpen} onOpenChange={setScheduleOpen}>
                  <DropdownTrigger className="ld-composer-icon" aria-label="Schedule with this note"><RiCalendarLine /></DropdownTrigger>
                  <DropdownPopover aria-label="Schedule with this note" placement="bottom end" className="ld-composer-pop" dialogClassName="gap-2">
                    <DateCalendar aria-label="Schedule date" defaultValue={new CalendarDate(2026, 11, 13)} onChange={date => { setSchedule(`${formatLeadDate(date)}, ${scheduleTime}`); setScheduleOpen(false); }} />
                    <LeadSelect aria-label="Schedule time" selectedKey={scheduleTime} onSelectionChange={key => {
                      const time = String(key);
                      setScheduleTime(time);
                      setSchedule(current => current ? current.replace(/, .+$/, `, ${time}`) : current);
                    }}>{slotTimes.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  </DropdownPopover>
                </Dropdown>
                <button type="submit" aria-label="Send note" disabled={!note.trim() && !files.length && !schedule}><RiSendPlane2Line /></button>
              </div>
              {(files.length > 0 || schedule) && (
                <div className="ld-composer-tags">
                  {schedule && <span><RiCalendarLine /> {schedule}<button type="button" aria-label="Remove schedule" onClick={() => setSchedule("")}><RiCloseLine /></button></span>}
                  {files.map(file => <span key={file.id}><RiAttachment2 /> {file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(list => list.filter(item => item.id !== file.id))}><RiCloseLine /></button></span>)}
                </div>
              )}
            </form>
            <ol className="ld-feed-list">
              {feedItems(enquiry, activities).filter(item => feed === "All Activity" || (feed === "Notes" && item.kind === "note") || (feed === "Calls" && item.kind === "call") || (feed === "Emails" && item.kind === "email") || (feed === "Status Changes" && item.kind === "status")).map(item => <FeedRow key={item.id} item={item} />)}
            </ol>
          </section>
          <section className="ld-card ld-side-card">
            <h3>Activity</h3>
            <div className="ld-feed-filters" role="tablist" aria-label="Activity filters">
              {(["All Activity", "Notes", "Calls", "Emails", "Status Changes"] as const).map(item => {
                const rows = feedItems(enquiry, activities);
                const count = item === "All Activity" ? rows.length : rows.filter(row => (item === "Notes" && row.kind === "note") || (item === "Calls" && row.kind === "call") || (item === "Emails" && row.kind === "email") || (item === "Status Changes" && row.kind === "status")).length;
                return <button key={item} type="button" aria-selected={feed === item} onClick={() => setFeed(item)}><span>{item}</span><em>{count}</em></button>;
              })}
            </div>
          </section>
        </div>
      )}

      {tab === "Follow-ups" && (
        <FollowUps
          items={followUps}
          next={followUp}
          filter={followFilter}
          onFilter={setFollowFilter}
          onAdd={() => setScheduling(true)}
          onReschedule={() => setScheduling(true)}
          onPatch={onPatchActivity}
        />
      )}

      {tab === "Documents" && <Documents docs={docs} onChange={setDocs} />}

      {scheduling && (
        <SchedulePanel
          enquiry={enquiry}
          followUp={followUp}
          onClose={() => setScheduling(false)}
          onSave={(due, meetLink) => { onSchedule({ id: followUp?.id, due, meetLink }); setScheduling(false); }}
        />
      )}
    </div>
  );
}

function Field({ label, value, display, editing, onChange, options, suggest, date }: { label: string; value: string; display?: ReactNode; editing: boolean; onChange: (value: string) => void; options?: string[]; suggest?: string[]; date?: boolean }) {
  const choices = options && !options.includes(value) ? [value, ...options] : options;
  return (
    <div className="ld-fact-line">
      <span>{label}</span>
      {editing ? (
        date ? <InlineDate value={value} onChange={onChange} /> : choices ? (
          <LeadSelect aria-label={label} selectedKey={value} onSelectionChange={key => onChange(String(key))} className="ld-field-select" triggerClassName="ld-field-trigger">
            {choices.map(option => <SelectItem key={option} id={option}>{option}</SelectItem>)}
          </LeadSelect>
        ) : suggest ? (
          <SuggestField compact label={label} value={value} options={suggest} onChange={onChange} />
        ) : <input className="ld-inline" aria-label={label} value={value} onChange={event => onChange(event.target.value)} />
      ) : <strong>{display ?? (value || "—")}</strong>}
    </div>
  );
}

function InlineDate({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown isOpen={open} onOpenChange={setOpen}>
      <DropdownTrigger className="ld-inline" aria-label="Enquiry date">{value}</DropdownTrigger>
      <DropdownPopover aria-label="Enquiry date" placement="bottom start" className="ld-calendar-pop" dialogClassName="gap-0">
        <DateCalendar aria-label="Enquiry date" value={parseLeadDate(value)} onChange={date => { onChange(formatLeadDate(date)); setOpen(false); }} />
      </DropdownPopover>
    </Dropdown>
  );
}

function SourceGlyph({ name }: { name: string }) {
  if (name === "Meta Lead Ads" || name === "Meta Ads") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path fill="#0081FB" d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
      </svg>
    );
  }
  const Icon = name === "WhatsApp" ? RiWhatsappLine : name === "Phone Call" ? RiPhoneLine : name === "Email" ? RiMailLine : name === "Direct Enquiry" ? RiStore2Line : RiGlobalLine;
  return <Icon aria-hidden />;
}

function SchedulePanel({ enquiry, followUp, onClose, onSave }: { enquiry: Enquiry; followUp?: Activity; onClose: () => void; onSave: (due: string, meetLink: string) => void }) {
  const initialDate = parseLeadDate(followUp?.due || enquiry.received);
  const initialTime = parseLeadTime(followUp?.due || "4:00 PM");
  const [range, setRange] = useState({ start: initialDate, end: initialDate });
  const [startTime, setStartTime] = useState(slotTimes.includes(initialTime) ? initialTime : "4:00 PM");
  const [endTime, setEndTime] = useState(() => laterTime(slotTimes.includes(initialTime) ? initialTime : "4:00 PM"));
  const [meetLink, setMeetLink] = useState(followUp?.meetLink || "https://meet.google.com/abc-defg-hij");
  const startLabel = formatLeadDate(range.start);
  const endLabel = formatLeadDate(range.end);
  return (
    <Modal className="ld-dialog ld-event" isOpen onOpenChange={next => { if (!next) onClose(); }} size="wide" aria-label="Select a date and time">
      <ModalHeader title={<span className="ld-event-title"><RiTimeLine /> Select a Date & Time</span>} description={`${enquiry.name} · ${followUp?.title ?? "Follow-up call"}`} />
      <ModalBody>
        <div className="ld-event-grid">
          <div className="ld-event-cal">
            <DateRangeCalendar aria-label="Follow-up dates" visibleMonths={1} value={range} onChange={next => { if (next) setRange({ start: next.start, end: next.end }); }} />
          </div>
          <div className="ld-event-side">
            <label className="ld-event-field">
              <span>Start date</span>
              <div>
                <input readOnly value={startLabel} aria-label="Start date" />
                <LeadSelect aria-label="Start time" selectedKey={startTime} onSelectionChange={key => setStartTime(String(key))} className="w-[118px] shrink-0" triggerClassName="h-10 shadow-none">
                  {slotTimes.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                </LeadSelect>
              </div>
            </label>
            <label className="ld-event-field">
              <span>End date</span>
              <div>
                <input readOnly value={endLabel} aria-label="End date" />
                <LeadSelect aria-label="End time" selectedKey={endTime} onSelectionChange={key => setEndTime(String(key))} className="w-[118px] shrink-0" triggerClassName="h-10 shadow-none">
                  {slotTimes.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                </LeadSelect>
              </div>
            </label>
            <label className="ld-event-field">
              <span>Updated google meeting link</span>
              <input value={meetLink} aria-label="Updated google meeting link" placeholder="https://meet.google.com/abc-defg-hij" onChange={event => setMeetLink(event.target.value)} />
            </label>
            <div className="ld-meet">
              <div className="ld-meet-top">
                <div>
                  <strong>{followUp?.title ?? "Follow-up call"}</strong>
                  <span>{followUp?.type ?? "Phone Call"}</span>
                </div>
                <div className="ld-meet-faces">
                  <Avatar size="md" initials={initials(enquiry.name)} alt="" className="ld-meet-avatar ld-initials" />
                  <span aria-hidden>+</span>
                  <Avatar size="md" src={portraitFor(enquiry.owner)} initials={initials(enquiry.owner)} alt="" className="ld-meet-avatar" />
                </div>
              </div>
              <div className="ld-meet-meta">
                <em><RiTimeLine /> {startTime}</em>
                <em><RiPhoneLine /> 45 min</em>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="ld-schedule-foot">
        <span className="ld-schedule-choice">{startLabel === endLabel ? `${startLabel}, ${startTime} – ${endTime}` : `${startLabel}, ${startTime} – ${endLabel}, ${endTime}`}</span>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(`${startLabel}, ${startTime}`, meetLink.trim())}>Save</Button>
      </ModalFooter>
    </Modal>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const Icon = item.kind === "note" ? RiFileTextLine : item.kind === "email" ? RiMailLine : item.kind === "status" ? RiArrowLeftRightLine : item.kind === "created" ? RiAddLine : item.kind === "meeting" ? RiCalendarLine : RiPhoneLine;
  return (
    <li className={`ld-feed-item ld-feed-${item.kind}`}>
      <span className="ld-feed-mark"><Icon /></span>
      <div>
        <div className="ld-feed-line"><strong>{item.title}</strong><em>{item.when}</em></div>
        {item.kind === "status" ? <p>Status updated from <b>{item.from}</b> to <b>{item.to}</b></p> : item.body ? <p className={item.kind === "note" ? "is-note" : undefined}>{item.kind === "note" ? `“${item.body}”` : item.body}</p> : null}
        {(item.files?.length || item.schedule) && (
          <span className="ld-feed-tags">
            {item.schedule && <em><RiCalendarLine /> {item.schedule}</em>}
            {item.files?.map(name => <em key={name}><RiAttachment2 /> {name}</em>)}
          </span>
        )}
        {item.person && (
          <span className="ld-feed-meta">
            {item.done && <><RiCheckboxCircleLine /><em>Completed</em></>}
            <strong>{item.person}</strong>
          </span>
        )}
      </div>
    </li>
  );
}

function followLabel(item: Activity) {
  if (item.status === "Completed") return "Completed";
  const date = parseLeadDate(item.due || item.when);
  const today = new CalendarDate(2026, 11, 12);
  return date.compare(today) < 0 ? "Overdue" : "Upcoming";
}

function FollowUps({ items, next, filter, onFilter, onAdd, onReschedule, onPatch }: { items: Activity[]; next?: Activity; filter: string; onFilter: (value: string) => void; onAdd: () => void; onReschedule: () => void; onPatch: (id: string, patch: Partial<Activity>) => void }) {
  const labeled = items.map(item => ({ item, label: followLabel(item) }));
  const visible = labeled.filter(row => filter === "All" || row.label === filter);
  const completed = labeled.filter(row => row.label === "Completed").length;
  const upcoming = labeled.filter(row => row.label === "Upcoming").length;
  const overdue = labeled.filter(row => row.label === "Overdue").length;
  const percent = labeled.length ? Math.round((completed / labeled.length) * 100) : 0;
  return (
    <div className="ld-pane ld-split">
      <section className="ld-card ld-follow-board">
        <div className="ld-follow-head">
          <div>
            <h3>Follow-ups</h3>
            <p>Track and manage all your follow-up activities with this lead.</p>
          </div>
          <Button size="small" leadingIcon={RiAddLine} onClick={onAdd}>Add Follow-up</Button>
        </div>
        <div className="ld-follow-filters">
          {[["All", labeled.length], ["Upcoming", upcoming], ["Completed", completed]].map(([label, count]) => (
            <button key={label} type="button" aria-selected={filter === label} onClick={() => onFilter(String(label))}>
              {label === "All" ? <RiStackLine /> : label === "Upcoming" ? <RiCalendarLine /> : <RiCheckboxCircleLine />}
              {label} ({count})
            </button>
          ))}
        </div>
        <ol className="ld-follow-list">
          {visible.map(({ item, label }) => <FollowRow key={item.id} item={item} label={label} onReschedule={onReschedule} onPatch={onPatch} />)}
          {!visible.length && <li className="ld-follow-empty">No follow-ups in this view.</li>}
        </ol>
      </section>
      <div className="ld-follow-side">
        <section className="ld-follow">
          <h3><RiCalendarLine /> Next Follow-up</h3>
          {next ? <><strong>{next.title}</strong><span><RiCalendarLine /> {next.due}</span></> : <p>No follow-up scheduled.</p>}
        </section>
        <section className="ld-card ld-progress">
          <h3>Follow-up Progress</h3>
          <div className="ld-ring" style={{ background: `conic-gradient(#34b26b 0 ${percent * 3.6}deg, #efeaff ${percent * 3.6}deg 360deg)` }}><strong>{percent}%</strong></div>
          <ul>
            <li><i className="is-done" /><span>Completed</span><b>{completed}</b></li>
            <li><i className="is-next" /><span>Upcoming</span><b>{upcoming}</b></li>
            <li><i className="is-late" /><span>Overdue</span><b>{overdue}</b></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function FollowRow({ item, label, onReschedule, onPatch }: { item: Activity; label: string; onReschedule: () => void; onPatch: (id: string, patch: Partial<Activity>) => void }) {
  const [open, setOpen] = useState(false);
  const Icon = item.kind === "email" ? RiFileTextLine : item.kind === "meeting" ? RiCalendarLine : item.title.toLowerCase().includes("brief") ? RiUserSharedLine : RiPhoneLine;
  return (
    <li className={`ld-follow-item is-${label.toLowerCase()}`}>
      <span className="ld-follow-mark"><Icon /></span>
      <div>
        <strong>{item.title}</strong>
        <p>{item.summary}</p>
      </div>
      <em className={`ld-follow-state is-${label.toLowerCase()}`}>{label}</em>
      <time><RiCalendarLine /> {item.due || item.when}</time>
      <Dropdown isOpen={open} onOpenChange={setOpen}>
        <DropdownTrigger className="ld-more" aria-label={`Actions for ${item.title}`}><RiMoreLine /></DropdownTrigger>
        <DropdownPopover aria-label={`Actions for ${item.title}`} placement="bottom end" className="w-[180px]">
          <DropdownItem onSelect={() => { setOpen(false); onReschedule(); }}>Reschedule</DropdownItem>
          <DropdownItem onSelect={() => { setOpen(false); onPatch(item.id, { status: item.status === "Completed" ? "Scheduled" : "Completed" }); }}>{item.status === "Completed" ? "Mark upcoming" : "Mark completed"}</DropdownItem>
        </DropdownPopover>
      </Dropdown>
    </li>
  );
}

function Documents({ docs, onChange }: { docs: EnquiryDoc[]; onChange: (docs: EnquiryDoc[]) => void }) {
  const [over, setOver] = useState(false);
  function add(files: FileList | null) {
    if (!files?.length) return;
    const stamp = "12 Nov 2026, 6:20 PM";
    const next = [...files].map(file => ({ id: `doc-${file.name}-${file.size}-${file.lastModified}`, name: file.name, type: fileType(file.name), size: fileSize(file.size), by: "Mohammad Abrar", when: stamp }));
    onChange([...next, ...docs]);
  }
  return (
    <div className="ld-pane ld-split">
      <section className="ld-card ld-docs">
        <div className="ld-docs-head">
          <div>
            <h3>Documents</h3>
            <p>Manage all files related to this enquiry.</p>
          </div>
        </div>
        <div className="ld-docs-table">
          <table>
            <thead>
              <tr><th>Name</th><th>Size</th><th>Uploaded By</th><th>Uploaded On</th><th /></tr>
            </thead>
            <tbody>
              {docs.map(doc => <DocRow key={doc.id} doc={doc} onRemove={() => onChange(docs.filter(item => item.id !== doc.id))} />)}
              {!docs.length && <tr><td colSpan={5} className="ld-follow-empty">No documents yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="ld-card ld-side-card ld-upload-card" onDragOver={event => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={event => { event.preventDefault(); setOver(false); add(event.dataTransfer.files); }}>
        <label className={over ? "ld-drop is-over" : "ld-drop"}>
          <span className="ld-cloud" aria-hidden>
            <span className="ld-cloud-ring" />
            <span className="ld-cloud-ring is-mid" />
            <span className="ld-cloud-ring is-inner" />
            <svg className="ld-cloud-shape" viewBox="0 0 160 96">
              <g fill="#fff">
                <ellipse cx="82" cy="62" rx="54" ry="26" />
                <circle cx="58" cy="54" r="24" />
                <circle cx="90" cy="44" r="30" />
                <circle cx="118" cy="56" r="20" />
              </g>
            </svg>
            <span className="ld-cloud-btn">
              <svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M12 18V7M7.5 11.5 12 7l4.5 4.5" /></svg>
            </span>
          </span>
          <strong>Drag and drop files here</strong>
          <span>or click to browse from your device</span>
          <input type="file" multiple aria-label="Upload documents" onChange={event => { add(event.target.files); event.target.value = ""; }} />
        </label>
      </section>
    </div>
  );
}

function DocRow({ doc, onRemove }: { doc: EnquiryDoc; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const Icon = doc.type === "PDF" ? RiFilePdf2Line : doc.type === "XLSX" || doc.type === "XLS" ? RiFileExcelLine : doc.type === "ZIP" ? RiFileZipLine : doc.type === "PNG" || doc.type === "JPG" ? RiImageLine : RiFileTextLine;
  return (
    <tr>
      <td><span className={`ld-doc-file ld-doc-${doc.type.toLowerCase()}`}><Icon />{doc.name}</span></td>
      <td>{doc.size}</td>
      <td><span className="ld-doc-person"><Avatar size="sm" src={portraitFor(doc.by)} initials={initials(doc.by)} alt="" />{firstName(doc.by)}</span></td>
      <td className="ld-doc-when">{doc.when}</td>
      <td>
        <Dropdown isOpen={open} onOpenChange={setOpen}>
          <DropdownTrigger className="ld-more" aria-label={`Actions for ${doc.name}`}><RiMoreLine /></DropdownTrigger>
          <DropdownPopover aria-label={`Actions for ${doc.name}`} placement="bottom end" className="w-[160px]">
            <DropdownItem onSelect={() => { setOpen(false); onRemove(); }}>Remove</DropdownItem>
          </DropdownPopover>
        </Dropdown>
      </td>
    </tr>
  );
}

