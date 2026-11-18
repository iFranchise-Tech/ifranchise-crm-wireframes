"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { CalendarDate } from "@internationalized/date";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowLeftRightLine,
  RiAttachment2,
  RiCalendarLine,
  RiCheckLine,
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
  RiExternalLinkLine,
  RiEyeLine,
  RiFacebookFill,
  RiInstagramLine,
  RiLinkedinBoxFill,
  RiMoreLine,
  RiPushpinLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiBold,
  RiItalic,
  RiUnderline,
  RiLink,
  RiListUnordered,
  RiListOrdered,
  RiUpload2Line,
  RiPencilLine,
  RiPhoneLine,
  RiSendPlane2Line,
  RiStackLine,
  RiStickyNoteLine,
  RiStore2Line,
  RiTimeLine,
  RiTwitterXLine,
  RiUserSharedLine,
  RiVideoOnLine,
  RiWhatsappLine,
} from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { DateCalendar, DateRangeCalendar } from "@/components/base/date-picker/date-calendar";
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { AlertDialog, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { portraitFor } from "@/modules/users-roles/portrait";
import type { Activity, Enquiry, EnquiryStatus } from "../types";
import { brands, enquiryStatuses, originalSources, timelines } from "../types";
import { cityOptions, formatLeadDate, LeadSelect, stateForCity, stateOptions, SuggestField } from "./lead-fields";

import { useMeetings, useMeetingProfile } from "@/modules/meetings/store";
import { canManageRecord, canViewRecord, displayTime, followUpStatus } from "@/modules/meetings/records";
import type { ActivitySource, CustomerRecord } from "@/modules/meetings/types";
import { FollowUpForm, MeetingForm } from "@/modules/meetings/components/meeting-forms";
import { EntityDetail, StatusBadge } from "@/modules/meetings/components/record-detail";

const statusColor: Record<EnquiryStatus, ChipColor> = { New: "purple", "In Progress": "yellow", Qualified: "lime", Converted: "blue" };
const leadStages = ["New", "Qualified", "Meeting", "Hot", "Token Collected", "Won", "Lost"] as const;
type LeadPipelineStage = (typeof leadStages)[number];
const legacyLeadStages: Record<string, LeadPipelineStage> = {
  Discovery: "New",
  Qualification: "Qualified",
  Proposal: "Meeting",
  Negotiation: "Hot",
};
function pipelineStage(stage?: string): LeadPipelineStage {
  if (leadStages.some(item => item === stage)) return stage as LeadPipelineStage;
  return legacyLeadStages[stage ?? ""] ?? "New";
}
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

type FeedKind = "note" | "call" | "email" | "status" | "created" | "meeting" | "follow" | "form";
type LeadActionDialog = "compose-email" | "templates" | "follow-up-email" | "schedule-email" | "meeting-invite" | "assign" | "transfer" | "change-status" | "change-stage" | "increase-score" | "inactive" | "disqualify";
type FeedItem = { id: string; kind: FeedKind; title: string; when: string; body: string; person?: string; done?: boolean; from?: string; to?: string; files?: string[]; schedule?: string; source?: ActivitySource; entity?: { kind: "meeting" | "follow-up"; id: string } };

function initials(name: string) {
  return (name.trim()[0] ?? "").toUpperCase();
}

function phone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return value;
}

function leadAge(value: string) {
  const date = parseLeadDate(value);
  const receivedAt = new Date(date.year, date.month - 1, date.day).getTime();
  return `${Math.max(0, Math.floor((Date.now() - receivedAt) / 86_400_000))} days`;
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
    return { source: !note && item.type !== "Pipeline stage" && item.type !== "Task" ? { id: item.id, recordId: enquiry.id, title: item.title, type: item.type, when: item.when || item.due } : undefined, id: item.id, kind, title: item.title || "Note added", when: item.when || item.due, body: note ? plainNoteText(item.summary) : item.summary, person: item.createdBy, done: item.status === "Completed", files: note ? item.attachments : undefined, schedule: note && item.followUp ? item.followUp : undefined };
  });
  if (["Website", "Meta Lead Ads"].includes(enquiry.originalSource)) {
    const submissionDetails = [
      enquiry.category === "Franchise" ? enquiry.brand : enquiry.category === "Brand expansion" ? enquiry.focus : enquiry.focus,
      enquiry.investment,
      enquiry.heardAbout ? `Heard about us through ${enquiry.heardAbout}` : "",
      enquiry.campaign ? `Campaign: ${enquiry.campaign}` : "",
      enquiry.city && enquiry.state ? `Location: ${enquiry.city}, ${enquiry.state}` : "",
    ].filter(Boolean).join(" · ");
    rows.push({ id: "form-submitted", kind: "form", title: "Enquiry form submitted", when: enquiry.received, body: submissionDetails || `Form submitted via ${enquiry.originalSource}.` });
  }
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

function LeadStageTracker({ stage, stageNames = leadStages, onChange }: { stage: string; stageNames?: readonly string[]; onChange: (stage: string) => void }) {
  const currentStage = stageNames === leadStages ? pipelineStage(stage) : stage;
  const activeIndex = Math.max(0, stageNames.indexOf(currentStage));
  const progress = `${(activeIndex / stageNames.length) * 100}%`;
  return <section className="ld-stage-tracker ld-card" aria-label="Lead sales pipeline">
    <div className="ld-stage-tracker-heading"><div><h3>Sales Pipeline</h3><p>{stageNames === leadStages ? "Click any stage to move this lead forward or back." : "Select a stage to review the next step and its requirements."}</p></div><span>{currentStage}</span></div>
    <ol className="ld-stage-steps" style={{ "--stage-progress": progress, "--stage-inset": `${50 / stageNames.length}%`, gridTemplateColumns: `repeat(${stageNames.length}, minmax(0, 1fr))` } as CSSProperties}>
      {stageNames.map((item, index) => {
        const state = index < activeIndex ? "complete" : index === activeIndex ? "current" : "upcoming";
        return <li key={item} data-state={state}>
          <button type="button" aria-current={index === activeIndex ? "step" : undefined} aria-label={`Move lead to ${item}${index === activeIndex ? ", current stage" : ""}`} onClick={() => { if (item !== currentStage) onChange(item); }}>
            <span className="ld-stage-node">{index < activeIndex ? <RiCheckLine aria-hidden="true" /> : index + 1}</span>
            <span className="ld-stage-label">{item}</span>
          </button>
        </li>;
      })}
    </ol>
  </section>;
}

type EnquiryDoc = { id: string; name: string; type: string; size: string; by: string; when: string; previewUrl?: string };

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
  contacts,
  canDelete,
  onBack,
  onSave,
  onStatus,
  onSchedule,
  onPatchActivity,
  onCreateTask,
  onCreateNote,
  onDeleteActivity,
  onDeleteEnquiry,
  pipelineStages,
  onPipelineStageChange,
  backLabel = "Back to enquiries",
  opportunityId,
}: {
  enquiry: Enquiry;
  activities: Activity[];
  owners: string[];
  contacts: { name: string; email: string }[];
  canDelete: boolean;
  onBack: () => void;
  onSave: (patch: Partial<Enquiry>) => void;
  onStatus: (status: EnquiryStatus) => void;
  onSchedule: (update: { id?: string; due: string; meetLink?: string; kind?: Activity["kind"]; title?: string; type?: string; summary?: string }) => void;
  onPatchActivity: (id: string, patch: Partial<Activity>) => void;
  onCreateTask: (task: { title: string; summary: string; due: string; priority: "High" | "Medium" | "Low"; status: "Scheduled" | "In Progress" | "Pending"; assignedTo: string; reminder: boolean; reminderTiming: string }) => void;
  onCreateNote: (note: { title: string; detail: string; noteType: string; pinned: boolean }) => void;
  onDeleteActivity: (id: string) => void;
  onDeleteEnquiry: () => void;
  pipelineStages?: readonly string[];
  onPipelineStageChange?: (stage?: string) => void;
  backLabel?: string;
  opportunityId?: string;
}) {
  const { state: meetingState, now: meetingNow } = useMeetings();
  const [meetingProfile] = useMeetingProfile();
  const customer: CustomerRecord = { id: enquiry.id, name: enquiry.name, email: enquiry.email, owner: enquiry.owner, brand: enquiry.brand, category: enquiry.category, opportunityId: opportunityId ?? meetingState.records.find(item => item.id === enquiry.id)?.opportunityId, snapshot: enquiry };
  const canManageActions = canManageRecord(meetingProfile, customer);
  const canViewActions = canViewRecord(meetingProfile, customer);
  const [followUpComposer, setFollowUpComposer] = useState<{ source?: ActivitySource } | null>(null);
  const [meetingComposer, setMeetingComposer] = useState(false);
  const [actionDetail, setActionDetail] = useState<{ kind: "meeting" | "follow-up"; id: string } | null>(null);
  const customerFollowUps = canViewActions ? meetingState.followUps.filter(item => item.recordId === enquiry.id) : [];
  const customerMeetings = canViewActions ? meetingState.meetings.filter(item => item.recordId === enquiry.id) : [];
  const actionHistory: FeedItem[] = [...customerFollowUps.flatMap(item => item.history.map(event => ({ id: event.id, kind: "follow" as const, title: event.action, when: event.at, body: event.detail, person: event.actor, entity: { kind: "follow-up" as const, id: item.id } }))), ...customerMeetings.flatMap(item => item.history.map(event => ({ id: event.id, kind: "meeting" as const, title: event.action, when: event.at, body: event.detail, person: event.actor, entity: { kind: "meeting" as const, id: item.id } })))];
  const [tab, setTab] = useState("Activity History");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsView, setActionsView] = useState<"main" | "status" | "stage">("main");
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const [leadActionDialog, setLeadActionDialog] = useState<LeadActionDialog | null>(null);
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [emailPrefill, setEmailPrefill] = useState({ subject: "", message: "" });
  const [noteComposerOpen, setNoteComposerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => snapshot(enquiry));
  const [activityTypeFilter, setActivityTypeFilter] = useState("All selected");
  const [activityTimeFilter, setActivityTimeFilter] = useState("All Time");
  const [docs, setDocs] = useState<EnquiryDoc[]>(sampleDocs);
  useEffect(() => {
    setEditing(false);
    setDraft(snapshot(enquiry));
    setActivityTypeFilter("All selected");
    setActivityTimeFilter("All Time");
    setDocs(sampleDocs);
  }, [enquiry.id]);
  const followable = (item: Activity) => item.type !== "Other Communication" && !/note/i.test(item.title);
  const followUp = activities.find(item => followable(item) && (item.status === "Pending" || item.status === "Scheduled")) ?? [...activities].reverse().find(item => followable(item) && item.due);
  const followUps = activities.filter(followable);
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
  function startEdit() {
    setDraft(snapshot(enquiry));
    setEditing(true);
    setTab("Lead Details");
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

  function openEmailDialog(dialog: LeadActionDialog) {
    setEmailMenuOpen(false);
    setEmailPrefill({
      subject: dialog === "follow-up-email" ? "Following up on your iFranchise enquiry" : dialog === "schedule-email" ? "Scheduled follow-up" : "",
      message: dialog === "follow-up-email" ? `Hi ${firstName(enquiry.name)},\n\nJust following up on our discussion. Please let us know if you have any questions.\n\nRegards,\niFranchise` : "",
    });
    setLeadActionDialog(dialog);
  }

  function openLeadAction(dialog: LeadActionDialog) {
    setActionsOpen(false);
    setActionsView("main");
    if (dialog === "change-stage" && onPipelineStageChange) { onPipelineStageChange(); return; }
    setLeadActionDialog(dialog);
  }

  return (
    <div className="ld-detail">
      <div className="ld-detail-top">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="ld-back" aria-label={backLabel} onClick={onBack}><RiArrowLeftLine /></button>
          <div><h2>Lead Details</h2></div>
        </div>
        <div className="ld-detail-actions">
          {canManageActions && <Button variant="secondary" size="small" leadingIcon={RiAddLine} onClick={() => setFollowUpComposer({})}>Create follow-up</Button>}
          {canManageActions && customer.opportunityId && <Button variant="secondary" size="small" leadingIcon={RiCalendarLine} onClick={() => setMeetingComposer(true)}>Schedule meeting</Button>}
          {editing ? <Button variant="secondary" size="small" onClick={() => setEditing(false)}>Cancel edit</Button> : null}
          <Dropdown isOpen={emailMenuOpen} onOpenChange={setEmailMenuOpen}>
            <DropdownTrigger className="ld-email-trigger"><RiMailLine />Send Email<RiArrowDownSLine /></DropdownTrigger>
            <DropdownPopover aria-label="Send email actions" placement="bottom end" className="w-[240px] ld-action-menu" dialogClassName="text-body-medium">
              <DropdownItem onSelect={() => openEmailDialog("compose-email")}><RiMailLine />Compose Email</DropdownItem>
              <DropdownItem onSelect={() => openEmailDialog("templates")}><RiFileTextLine />Use Email Template<RiArrowDownSLine className="ld-menu-trailing" /></DropdownItem>
              <DropdownItem onSelect={() => openEmailDialog("follow-up-email")}><RiSendPlane2Line />Send Follow-up</DropdownItem>
              {canManageActions && customer.opportunityId && <DropdownItem onSelect={() => { setEmailMenuOpen(false); setMeetingComposer(true); }}><RiCalendarLine />Schedule meeting</DropdownItem>}
              <DropdownItem onSelect={() => openEmailDialog("schedule-email")}><RiTimeLine />Schedule Email</DropdownItem>
            </DropdownPopover>
          </Dropdown>
          <Dropdown isOpen={actionsOpen} onOpenChange={open => { setActionsOpen(open); if (!open) setActionsView("main"); }}>
            <DropdownTrigger className="ld-update">Lead Actions <RiArrowDownSLine className="size-4" /></DropdownTrigger>
            <DropdownPopover aria-label="Lead actions" placement="bottom end" className="w-[250px] ld-action-menu" dialogClassName="text-body-medium">
              {actionsView === "main" ? <>
                <DropdownItem onSelect={() => openLeadAction("assign")}><RiUserSharedLine />Assign Lead</DropdownItem>
                <DropdownItem onSelect={() => openLeadAction("transfer")}><RiArrowLeftRightLine />Transfer Lead</DropdownItem>
                <DropdownItem onSelect={() => openLeadAction("change-status")}><RiArrowLeftRightLine />Update Lead Status</DropdownItem>
                <DropdownItem onSelect={() => openLeadAction("change-stage")}><RiArrowLeftRightLine />Change Lead Stage</DropdownItem>
                <DropdownItem onSelect={() => openLeadAction("increase-score")}><RiCheckboxCircleLine />Increase Lead Score</DropdownItem>
                <DropdownItem onSelect={() => openLeadAction("inactive")}><RiCloseLine />Mark as Inactive</DropdownItem>
                <DropdownItem onSelect={() => openLeadAction("disqualify")}><RiCloseLine />Disqualify Lead</DropdownItem>
                {canDelete && <><DropdownDivider /><DropdownItem className="text-text-error-primary" onSelect={() => { setActionsOpen(false); onDeleteEnquiry(); }}><RiDeleteBinLine />Delete Lead</DropdownItem></>}
              </> : <>
                <DropdownItem onSelect={() => setActionsView("main")}><RiArrowLeftLine />Back to lead actions</DropdownItem>
                <DropdownDivider />
                {enquiryStatuses.map(item => <DropdownItem key={item} selected={item === enquiry.status} onSelect={() => { setActionsOpen(false); setActionsView("main"); onStatus(item); }}>{item}</DropdownItem>)}
              </>}
            </DropdownPopover>
          </Dropdown>
        </div>
      </div>

      {enquiry.salesPipeline && !enquiry.disqualified ? <LeadStageTracker stage={enquiry.stage || leadStages[0]} stageNames={pipelineStages} onChange={onPipelineStageChange ?? setPendingStage} /> : null}

      <div className={`ld-detail-layout${tab === "Lead Details" ? " is-lead-details" : ""}`}>
        <aside className="ld-profile-column">
          <section className="ld-hero">
            <div className="ld-profile-heading">
              <Avatar size="lg" initials={initials(enquiry.name)} alt="" className="ld-initials size-14" />
              <div className="min-w-0">
                <small>{enquiry.id}</small>
                <strong>{enquiry.name}</strong>
              </div>
            </div>
            <div className="ld-profile-contact">
              <span className="ld-investment-line"><RiStackLine /><b>Investment Capacity</b><bdi>{enquiry.investment || "Not specified"}</bdi></span>
              <span><RiMailLine /><bdi>{view.email}</bdi></span>
              <span><RiPhoneLine /><bdi>{phone(view.mobile)}</bdi></span>
              <span className="ld-profile-location"><RiMapPin2Line /><bdi>{[view.city, view.state].filter(Boolean).join(", ") || "Location not added"}</bdi><Chip variant="caption" color={enquiry.disqualified ? "gray" : enquiry.active === false ? "neutral" : statusColor[enquiry.status]} className="ld-pill rounded-full px-2">{enquiry.disqualified ? "Disqualified" : enquiry.active === false ? "Inactive" : enquiry.status}</Chip></span>
            </div>
            <div className="ld-profile-stats">
              <div><strong>{enquiry.score ?? 54}</strong><small>Lead Score</small></div>
              <div><strong>{enquiry.status === "Qualified" ? "9/10" : enquiry.status === "Converted" ? "10/10" : enquiry.status === "In Progress" ? "7/10" : "6/10"}</strong><small>Lead Quality</small></div>
              <div><strong>{activities.filter(activity => activity.enquiryId === enquiry.id).length}</strong><small>Engaged</small></div>
            </div>
          </section>

          <section className="ld-card ld-properties-card">
            <h3>Lead Properties</h3>
            <div className="ld-properties">
              <Field label="Lead Owner" editing={editing} value={view.owner} display={<span className="ld-with-icon"><Avatar size="sm" src={portraitFor(view.owner)} initials={initials(view.owner)} alt="" />{firstName(view.owner)}</span>} onChange={owner => setDraft(current => ({ ...current, owner }))} options={withCurrent(owners, view.owner)} />
              <Field label="Lead Type" editing={false} value={enquiry.category} />
              <Field label="Lead Source" editing={editing} value={view.source} display={<span className="ld-with-icon"><SourceGlyph name={view.source} />{view.source}</span>} onChange={source => setDraft(current => ({ ...current, source }))} options={withCurrent(originalSources, view.source)} />
              {enquiry.category === "Brand expansion" ? <Field label="Industry" editing={editing} value={view.qualification} onChange={qualification => setDraft(current => ({ ...current, qualification }))} /> : <Field label="Interested Brand" editing={editing} value={view.brand} onChange={brand => setDraft(current => ({ ...current, brand }))} options={withCurrent(brands, view.brand)} />}
              <Field label="Investment Capacity" editing={false} value={enquiry.investment} />
              <Field label="Requirement" editing={editing} value={view.requirement} onChange={requirement => setDraft(current => ({ ...current, requirement }))} options={enquiry.category === "Franchise" ? withCurrent(timelines, view.requirement) : undefined} />
              <Field label="Enquiry Date" editing={editing} value={view.received} onChange={received => setDraft(current => ({ ...current, received }))} date />
              <Field label="Address" editing={editing} value={view.address} onChange={address => setDraft(current => ({ ...current, address }))} />
            </div>
            {editing ? <div className="ld-property-actions"><Button variant="secondary" size="small" onClick={() => setEditing(false)}>Cancel</Button><Button size="small" onClick={save}>Save changes</Button></div> : null}
          </section>
        </aside>

        <main className="ld-detail-main">
          <div className="ld-tabs" role="tablist" aria-label="Lead details sections">
            {["Activity History", "Lead Details", "Follow-ups", "Social", "Tasks", "Notes", "Sales Activity", "Documents"].map(item => (
              <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => { setTab(item); if (item === "Notes") setNoteComposerOpen(false); }}>{item}</button>
            ))}
          </div>

      {tab === "Lead Details" && (
        <div className="ld-detail-grid ld-lead-info-grid">
          <section className="ld-card ld-lead-basic">
            <h3><RiUserSharedLine />Basic Information</h3>
            <div className="ld-facts">
              <Field label="Full Name" editing={false} value={enquiry.name} />
              <div className="ld-fact-split">
                <Field label="Email" editing={editing} value={view.email} onChange={email => setDraft(current => ({ ...current, email }))} />
                <Field label="Phone" editing={editing} value={editing ? draft.mobile : phone(view.mobile)} onChange={mobile => setDraft(current => ({ ...current, mobile }))} />
              </div>
              <div className="ld-fact-split">
                <Field label="Lead Type" editing={false} value={enquiry.category} />
                <Field label={enquiry.category === "Job" ? "Position" : "Company / Brand"} editing={false} value={enquiry.category === "Brand expansion" ? enquiry.name : view.brand} />
              </div>
              <div className="ld-fact-split">
                <Field label="City" editing={editing} value={view.city} onChange={city => setDraft(current => ({ ...current, city, state: stateForCity(city) ?? current.state }))} suggest={cityOptions} />
                <Field label="State" editing={editing} value={view.state} onChange={state => setDraft(current => ({ ...current, state }))} suggest={stateOptions} />
              </div>
            </div>
          </section>
          <section className="ld-card ld-lead-status">
            <h3><RiCheckboxCircleLine />Lead Status</h3>
            <div className="ld-facts">
              <Field label="Status" editing={false} value={enquiry.status} display={<Chip variant="caption" color={statusColor[enquiry.status]}>{enquiry.status}</Chip>} />
              <Field label="Lead Owner" editing={false} value={view.owner} display={<span className="ld-with-icon"><Avatar size="sm" src={portraitFor(view.owner)} initials={initials(view.owner)} alt="" />{view.owner}</span>} />
              <Field label="Lead Age" editing={false} value={leadAge(view.received)} />
              <Field label="Enquiry Date" editing={editing} value={view.received} onChange={received => setDraft(current => ({ ...current, received }))} date />
            </div>
          </section>
          <section className="ld-card ld-lead-additional">
            <h3><RiStackLine />Additional Details</h3>
            <div className="ld-lead-additional-grid">
              <Field label="Lead Source" editing={editing} value={view.source} display={<span className="ld-with-icon"><SourceGlyph name={view.source} />{view.source}</span>} onChange={source => setDraft(current => ({ ...current, source }))} options={withCurrent(originalSources, view.source)} />
              {enquiry.category === "Brand expansion" ? <Field label="Industry" editing={editing} value={view.qualification} onChange={qualification => setDraft(current => ({ ...current, qualification }))} /> : <Field label={enquiry.category === "Job" ? "Qualification" : "Interested Brand"} editing={editing} value={enquiry.category === "Job" ? view.qualification : view.brand} onChange={value => setDraft(current => ({ ...current, [enquiry.category === "Job" ? "qualification" : "brand"]: value }))} options={enquiry.category === "Job" ? undefined : withCurrent(brands, view.brand)} />}
              {enquiry.category !== "Job" && <Field label="Investment Capacity" editing={false} value={enquiry.investment} />}
              <Field label="Requirement" editing={editing} value={view.requirement} onChange={requirement => setDraft(current => ({ ...current, requirement }))} options={enquiry.category === "Franchise" ? withCurrent(timelines, view.requirement) : undefined} />
              {enquiry.heardAbout && <Field label="How they heard about us" editing={false} value={enquiry.heardAbout} />}
              {enquiry.campaign && <Field label="Campaign" editing={false} value={enquiry.campaign} />}
              {enquiry.address && <Field label="Address" editing={editing} value={view.address} onChange={address => setDraft(current => ({ ...current, address }))} />}
              {enquiry.category === "Job" && <Field label="Resume" editing={editing} value={view.resume} onChange={resume => setDraft(current => ({ ...current, resume }))} />}
              {(enquiry.remarks || enquiry.description) && <Field label="Notes" editing={false} value={enquiry.remarks || enquiry.description || ""} />}
            </div>
            {editing ? <div className="ld-property-actions"><Button variant="secondary" size="small" onClick={() => setEditing(false)}>Cancel</Button><Button size="small" onClick={save}>Save changes</Button></div> : null}
          </section>
        </div>
      )}

      {tab === "Activity History" && <ActivityHistory
        items={[...feedItems(enquiry, activities), ...actionHistory]}
        onFollowUp={canManageActions ? source => setFollowUpComposer({ source }) : undefined}
        onOpenRecord={setActionDetail}
        typeFilter={activityTypeFilter}
        timeFilter={activityTimeFilter}
        onTypeFilter={setActivityTypeFilter}
        onTimeFilter={setActivityTimeFilter}
      />}

      {tab === "Follow-ups" && <section className="ld-card flex flex-col gap-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3>Customer follow-ups</h3>{canManageActions && <Button size="small" leadingIcon={RiAddLine} onClick={() => setFollowUpComposer({})}>Create follow-up</Button>}</div>{customerFollowUps.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-separator-border p-4"><div className="flex flex-col gap-1"><Button variant="ghost" size="small" className="self-start" onClick={() => setActionDetail({ kind: "follow-up", id: item.id })}>{item.title}</Button><p className="text-body-2-regular text-text-secondary">{item.assignedTo} · {displayTime(item.dueAt)} IST</p></div><StatusBadge status={followUpStatus(item, meetingNow)} /></div>)}{!customerFollowUps.length && <p className="text-body-regular text-text-secondary">No follow-ups in your authorised view.</p>}</section>}

      {tab === "Social" && <SocialProfiles enquiry={enquiry} source={view.source} />}

      {tab === "Tasks" && <TasksPage items={followUps} owners={owners} onCreate={onCreateTask} onPatch={onPatchActivity} onDelete={onDeleteActivity} />}

      {tab === "Notes" && <NotesPage items={activities.filter(item => item.type === "Other Communication" || /note/i.test(item.title))} onCreate={onCreateNote} onPatch={onPatchActivity} onDelete={onDeleteActivity} openRequested={noteComposerOpen} onRequestConsumed={() => setNoteComposerOpen(false)} />}

      {tab === "Sales Activity" && <SalesActivityPage items={activities} />}

      {tab === "Documents" && <Documents docs={docs} onChange={setDocs} />}

        </main>
      </div>

      {followUpComposer && <FollowUpForm state={meetingState} profile={meetingProfile} record={customer} source={followUpComposer.source} onClose={() => setFollowUpComposer(null)} />}
      {meetingComposer && <MeetingForm state={meetingState} profile={meetingProfile} record={customer} onClose={() => setMeetingComposer(false)} />}
      {actionDetail && <EntityDetail {...actionDetail} state={meetingState} profile={meetingProfile} now={meetingNow} onClose={() => setActionDetail(null)} />}
      {leadActionDialog && <LeadActionModal
        kind={leadActionDialog}
        enquiry={enquiry}
        owners={owners}
        contacts={contacts}
        initialSubject={emailPrefill.subject}
        initialMessage={emailPrefill.message}
        onClose={() => setLeadActionDialog(null)}
        onSubmit={(kind, values) => {
          if (kind === "assign" || kind === "transfer") onSave({ owner: values.owner ?? enquiry.owner });
          if (kind === "change-status" && values.status) onStatus(values.status as EnquiryStatus);
          if (kind === "change-stage" && values.stage) setPendingStage(values.stage);
          if (kind === "increase-score") onSave({ score: (enquiry.score ?? 54) + Number(values.increaseBy ?? 10) });
          if (kind === "inactive") onSave({ active: false });
          if (kind === "disqualify") onSave({ disqualified: true });
          if (kind === "schedule-email") {
            const scheduledAt = new Date(`${values.date}T${values.time}:00`);
            onSchedule({ due: scheduledAt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }), kind: "email", title: values.subject || "Scheduled email", type: "Email", summary: values.message || "Email scheduled to send." });
          }
          setLeadActionDialog(null);
        }}
        onUseTemplate={(subject, message) => {
          setLeadActionDialog("compose-email");
          setEmailPrefill({ subject, message });
        }}
      />}
      {pendingStage && <AlertDialog
        isOpen
        onOpenChange={open => { if (!open) setPendingStage(null); }}
        className="ld-dialog ld-stage-confirm-dialog"
        title="Confirm stage change"
        icon={false}
        variant="default"
        confirmLabel={`Move to ${pendingStage}`}
        cancelLabel="Keep current stage"
        onCancel={() => setPendingStage(null)}
        onConfirm={() => { onSave({ stage: pendingStage }); }}
      >
        <div className="ld-stage-confirm-identity">
          <Avatar size="md" initials={initials(enquiry.name)} alt="" className="ld-initials" />
          <strong>{enquiry.name}</strong>
          <small>{enquiry.id}</small>
        </div>
        <div className="ld-stage-confirm-flow" aria-label={`Stage change from ${pipelineStage(enquiry.stage)} to ${pendingStage}`}>
          <span><small>Current stage</small><strong>{pipelineStage(enquiry.stage)}</strong></span>
          <span><small>New stage</small><strong>{pendingStage}</strong></span>
        </div>
      </AlertDialog>}
    </div>
  );
}

function Field({ label, value, display, editing, onChange, options, suggest, date }: { label: string; value: string; display?: ReactNode; editing: boolean; onChange?: (value: string) => void; options?: string[]; suggest?: string[]; date?: boolean }) {
  const choices = options && !options.includes(value) ? [value, ...options] : options;
  return (
    <div className="ld-fact-line">
      <span>{label}</span>
      {editing && onChange ? (
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

function SchedulePanel({ enquiry, followUp, mode, onClose, onSave }: { enquiry: Enquiry; followUp?: Activity; mode: "meeting" | "email"; onClose: () => void; onSave: (due: string, meetLink: string) => void }) {
  const initialDate = parseLeadDate(followUp?.due || enquiry.received);
  const initialTime = parseLeadTime(followUp?.due || "4:00 PM");
  const [range, setRange] = useState({ start: initialDate, end: initialDate });
  const [startTime, setStartTime] = useState(slotTimes.includes(initialTime) ? initialTime : "4:00 PM");
  const [endTime, setEndTime] = useState(() => laterTime(slotTimes.includes(initialTime) ? initialTime : "4:00 PM"));
  const [meetLink, setMeetLink] = useState(followUp?.meetLink || "https://meet.google.com/abc-defg-hij");
  const startLabel = formatLeadDate(range.start);
  const endLabel = formatLeadDate(range.end);
  return (
    <Modal className="ld-dialog ld-event" isOpen onOpenChange={next => { if (!next) onClose(); }} size="wide" aria-label={mode === "email" ? "Schedule email" : "Select a date and time"}>
      <ModalHeader title={<span className="ld-event-title">{mode === "email" ? <RiMailLine /> : <RiTimeLine />} {mode === "email" ? "Schedule Email" : "Select a Date & Time"}</span>} description={`${enquiry.name} · ${followUp?.title ?? (mode === "email" ? "Follow-up email" : "Follow-up call")}`} />
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

type LeadActionValues = Record<string, string>;

function RecipientField({ label, contacts, value, onChange }: { label: string; contacts: { name: string; email: string }[]; value: string; onChange: (value: string) => void }) {
  const uniqueContacts = [...new Map(contacts.filter(contact => contact.email.trim()).map(contact => [contact.email.trim().toLowerCase(), contact])).values()];
  const initialTokens = [...new Map(value.split(",").map(email => email.trim()).filter(Boolean).map(email => {
    const contact = uniqueContacts.find(item => item.email.toLowerCase() === email.toLowerCase());
    const token = contact ?? { name: email, email };
    return [token.email.toLowerCase(), token] as const;
  }))].map(([, token]) => token);
  const [tokens, setTokens] = useState(initialTokens);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const suggestions = query.trim()
    ? uniqueContacts.filter(contact => !tokens.some(token => token.email.toLowerCase() === contact.email.toLowerCase()) && `${contact.name} ${contact.email}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];
  const commit = (contact: { name: string; email: string }) => {
    const next = [...tokens, contact];
    setTokens(next);
    setQuery("");
    setIsOpen(false);
    onChange(next.map(token => token.email).join(", "));
  };
  const remove = (email: string) => {
    const next = tokens.filter(token => token.email !== email);
    setTokens(next);
    onChange(next.map(token => token.email).join(", "));
  };
  return <div className="ld-recipient-field">
    <label>{label}{label === "To" && <span aria-hidden="true"> *</span>}</label>
    <div className="ld-recipient-shell" role="group" aria-label={label}>
      {tokens.map(token => <span className="ld-recipient-chip" key={`${token.email}-${token.name}`}><Avatar size="sm" src={portraitFor(token.name)} initials={initials(token.name)} alt="" /><span>{token.name}</span><button type="button" aria-label={`Remove ${token.email}`} onClick={() => remove(token.email)}><RiCloseLine /></button></span>)}
      <input type="text" autoComplete="off" aria-label={`${label} email address`} aria-autocomplete="list" aria-expanded={isOpen && suggestions.length > 0} value={query} placeholder={tokens.length ? "Add recipient" : "Enter a name or email"} onFocus={() => setIsOpen(true)} onBlur={() => window.setTimeout(() => setIsOpen(false), 120)} onChange={event => { setQuery(event.target.value); setIsOpen(true); }} onKeyDown={event => {
        if (event.key === "Enter") {
          event.preventDefault();
          if (suggestions[0]) commit(suggestions[0]);
          else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim())) commit({ name: query.trim(), email: query.trim() });
        } else if (event.key === "Backspace" && !query && tokens.length) remove(tokens[tokens.length - 1].email);
      }} />
    </div>
    {isOpen && suggestions.length > 0 && <div className="ld-recipient-suggestions" role="listbox" aria-label={`${label} suggestions`}>{suggestions.map(contact => <button type="button" role="option" key={contact.email} onMouseDown={event => event.preventDefault()} onClick={() => commit(contact)}><Avatar size="sm" src={portraitFor(contact.name)} initials={initials(contact.name)} alt="" /><span><strong>{contact.name}</strong><small>{contact.email}</small></span></button>)}</div>}
    {label === "To" && tokens.length === 0 && <input className="ld-recipient-required" type="email" tabIndex={-1} aria-hidden value={query} required readOnly />}
  </div>;
}

function LeadActionModal({
  kind,
  enquiry,
  owners,
  contacts,
  initialSubject,
  initialMessage,
  onClose,
  onSubmit,
  onUseTemplate,
}: {
  kind: LeadActionDialog;
  enquiry: Enquiry;
  owners: string[];
  contacts: { name: string; email: string }[];
  initialSubject: string;
  initialMessage: string;
  onClose: () => void;
  onSubmit: (kind: LeadActionDialog, values: LeadActionValues) => void;
  onUseTemplate: (subject: string, message: string) => void;
}) {
  const [values, setValues] = useState<LeadActionValues>({
    recipient: enquiry.email,
    subject: initialSubject,
    message: initialMessage,
    owner: enquiry.owner || owners[0] || "",
    status: enquiry.status,
    stage: pipelineStage(enquiry.stage),
    increaseBy: "10",
    reason: "",
    date: "2026-11-20",
    time: "10:00",
    timezone: "(GMT+05:30) Asia/Kolkata",
    title: `Product Demo – ${enquiry.name}`,
    location: "Google Meet",
  });
  const [selectedTemplate, setSelectedTemplate] = useState("Product Demo Invitation");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const attachmentInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setValues(current => ({ ...current, recipient: enquiry.email, subject: initialSubject, message: initialMessage, owner: enquiry.owner || owners[0] || "", status: enquiry.status, stage: pipelineStage(enquiry.stage) }));
  }, [kind, initialSubject, initialMessage, enquiry.id, enquiry.email, enquiry.owner, enquiry.status, enquiry.stage, owners]);
  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));
  const titles: Record<LeadActionDialog, string> = {
    "compose-email": "Compose Email", templates: "Use Email Template", "follow-up-email": "Send Follow-up", "schedule-email": "Schedule Email", "meeting-invite": "Send Meeting Invite",
    assign: "Assign Lead", transfer: "Transfer Lead", "change-status": "Update Lead Status", "change-stage": "Change Lead Stage", "increase-score": "Increase Lead Score", inactive: "Mark as Inactive", disqualify: "Disqualify Lead",
  };
  const templates = [
    { name: "Product Demo Invitation", detail: "Invite leads for a product demo.", subject: "Product Demo Invitation", message: `Hi ${firstName(enquiry.name)},\n\nThanks for your interest in our product. Would you like to schedule a quick demo to see how it can help your business?\n\nRegards,\niFranchise` },
    { name: "Follow-up – No Response", detail: "Follow up with leads who haven't replied.", subject: "Following up on your enquiry", message: `Hi ${firstName(enquiry.name)},\n\nJust following up to see if you had a chance to review the details we shared earlier. Let me know a good time to connect.\n\nRegards,\niFranchise` },
    { name: "Proposal / Quotation", detail: "Share proposal or pricing details.", subject: "Proposal and pricing details", message: `Hi ${firstName(enquiry.name)},\n\nPlease find the proposal and pricing details for your review. Let me know if you have any questions.\n\nRegards,\niFranchise` },
    { name: "Meeting Confirmation", detail: "Confirm a scheduled meeting.", subject: "Meeting confirmation", message: `Hi ${firstName(enquiry.name)},\n\nThis is to confirm our meeting. Looking forward to speaking with you.\n\nRegards,\niFranchise` },
    { name: "Thank You", detail: "Thank the lead for their time or interest.", subject: "Thank you for your interest", message: `Hi ${firstName(enquiry.name)},\n\nThank you for your time and interest in iFranchise. We look forward to speaking with you again.\n\nRegards,\niFranchise` },
  ];
  const template = templates.find(item => item.name === selectedTemplate) ?? templates[0];
  const isEmail = ["compose-email", "follow-up-email", "schedule-email"].includes(kind);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (kind === "templates") { onUseTemplate(template.subject, template.message); return; }
    if (kind === "compose-email" && !plainNoteText(values.message).trim()) return;
    onSubmit(kind, values);
  };
  const fieldSelect = (label: string, key: string, options: string[], className?: string) => <Select label={label} className={className} selectedKey={values[key]} triggerClassName="ld-form-white-select" onSelectionChange={value => value && set(key, String(value))}>{options.map(option => <SelectItem key={option} id={option}>{option}</SelectItem>)}</Select>;
  const messageField = <Textarea label="Message" isRequired value={values.message} onChange={value => set("message", value)} rows={5} fieldClassName="ld-form-white-field" />;
  const emailFields = <>
    <div className="ld-compose-recipient"><RecipientField key={`to-${kind}-${enquiry.id}`} label="To" contacts={contacts} value={values.recipient} onChange={value => set("recipient", value)} /><div><button type="button" onClick={() => setShowCc(value => !value)}>Cc</button><button type="button" onClick={() => setShowBcc(value => !value)}>Bcc</button></div></div>
    {showCc && <RecipientField key={`cc-${kind}-${enquiry.id}`} label="Cc" contacts={contacts} value={values.cc ?? ""} onChange={value => set("cc", value)} />}
    {showBcc && <RecipientField key={`bcc-${kind}-${enquiry.id}`} label="Bcc" contacts={contacts} value={values.bcc ?? ""} onChange={value => set("bcc", value)} />}
    <Input label="Subject" isRequired value={values.subject} onChange={value => set("subject", value)} fieldClassName="ld-form-white-field" />
    {kind === "compose-email" ? <>
      <RichNoteEditor key={`compose-${kind}-${initialSubject}-${selectedTemplate}`} label="Message" value={values.message} onChange={value => set("message", value)} />
      <div className="ld-compose-tools"><input ref={attachmentInput} hidden type="file" multiple onChange={event => setAttachedFiles(Array.from(event.target.files ?? []).map(file => file.name))} /><Button type="button" variant="secondary" size="small" leadingIcon={RiAttachment2} onClick={() => attachmentInput.current?.click()}>Attach Files{attachedFiles.length ? ` (${attachedFiles.length})` : ""}</Button><Dropdown><DropdownTrigger className="ld-compose-template-trigger">Use Template<RiArrowDownSLine /></DropdownTrigger><DropdownPopover aria-label="Use email template" placement="top start" className="w-[250px] ld-action-menu" dialogClassName="text-body-medium">{templates.map(item => <DropdownItem key={item.name} onSelect={() => { set("subject", item.subject); set("message", item.message); setSelectedTemplate(item.name); }}>{item.name}</DropdownItem>)}</DropdownPopover></Dropdown><div className="ld-compose-tools-spacer" /></div>
    </> : messageField}
  </>;
  return <Modal className={`ld-dialog ld-lead-action-dialog${kind === "templates" || kind === "compose-email" ? " is-email-wide" : ""}`} overlayClassName="ld-action-overlay" isOpen onOpenChange={open => !open && onClose()} size={kind === "templates" || kind === "compose-email" ? "wide" : "md"} aria-label={titles[kind]}>
    <ModalHeader title={<span className="ld-action-dialog-title">{kind === "meeting-invite" ? <RiCalendarLine /> : isEmail || kind === "templates" ? <RiMailLine /> : kind === "transfer" ? <RiArrowLeftRightLine /> : kind === "increase-score" ? <RiCheckboxCircleLine /> : <RiUserSharedLine />}{titles[kind]}</span>} description={kind === "templates" ? "Choose a message template and preview it before composing." : `${enquiry.name} · ${enquiry.email}`} />
    <form onSubmit={submit} className="ld-action-form">
      <ModalBody className="ld-action-body">
        {kind === "templates" ? <div className="ld-template-browser">
          <div className="ld-template-list" role="listbox" aria-label="Email templates">{templates.map(item => <button type="button" key={item.name} className={selectedTemplate === item.name ? "is-selected" : ""} onClick={() => setSelectedTemplate(item.name)}><RiMailLine /><span><strong>{item.name}</strong><small>{item.detail}</small></span></button>)}</div>
          <section className="ld-template-preview"><strong>Preview</strong><small>Subject: {template.subject}</small><p>{template.message}</p></section>
        </div> : isEmail ? <>
          {emailFields}
          {kind === "schedule-email" && <div className="ld-action-grid"><Input label="Send On" type="date" value={values.date} onChange={value => set("date", value)} fieldClassName="ld-form-white-field" /><Input label="Send At" type="time" value={values.time} onChange={value => set("time", value)} fieldClassName="ld-form-white-field" />{fieldSelect("Timezone", "timezone", ["(GMT+05:30) Asia/Kolkata", "(GMT+00:00) UTC", "(GMT-05:00) Eastern Time"], "ld-timezone-field")}</div>}
          {kind === "follow-up-email" && fieldSelect("Follow-up Type", "followType", ["General Follow-up", "Pricing Follow-up", "Meeting Follow-up", "Document Follow-up"])}
        </> : kind === "meeting-invite" ? <>
          <div className="ld-action-info"><RiCalendarLine />Send a calendar invite to schedule a meeting with the lead.</div>
          <Input label="Title" isRequired value={values.title} onChange={value => set("title", value)} fieldClassName="ld-form-white-field" />
          <div className="ld-action-grid"><Input label="Date" value={values.date} onChange={value => set("date", value)} fieldClassName="ld-form-white-field" /><Input label="Time" value={values.time} onChange={value => set("time", value)} fieldClassName="ld-form-white-field" /></div>
          {fieldSelect("Location", "location", ["Google Meet", "Phone Call", "In Person"])}
          <Textarea label="Description" value={values.message} onChange={value => set("message", value)} rows={3} fieldClassName="ld-form-white-field" />
        </> : kind === "assign" || kind === "transfer" ? <>
          <div className="ld-action-info">{kind === "assign" ? "Assign this lead to a team member." : "Transfer this lead to another user or team."}</div>
          {fieldSelect(kind === "assign" ? "Assign To" : "Transfer To", "owner", owners)}
          <Textarea label={kind === "assign" ? "Assignment Reason" : "Reason"} value={values.reason} onChange={value => set("reason", value)} rows={3} placeholder="Add context for the team" fieldClassName="ld-form-white-field" />
        </> : kind === "change-status" ? <>
          <div className="ld-action-info">Change the current status of this lead.</div>
          <div className="ld-action-current"><span>Current Status</span><Chip variant="caption" color={statusColor[enquiry.status]}>{enquiry.status}</Chip></div>
          {fieldSelect("New Status", "status", [...enquiryStatuses])}
          <Textarea label="Reason (Optional)" value={values.reason} onChange={value => set("reason", value)} rows={3} fieldClassName="ld-form-white-field" />
        </> : kind === "change-stage" ? <>
          <div className="ld-action-info">Move this lead to a different stage in the pipeline.</div>
          <div className="ld-action-current"><span>Current Stage</span><Chip variant="caption" color="blue">{pipelineStage(enquiry.stage)}</Chip></div>
          {fieldSelect("New Stage", "stage", [...leadStages])}
          <Textarea label="Notes (Optional)" value={values.reason} onChange={value => set("reason", value)} rows={3} fieldClassName="ld-form-white-field" />
        </> : kind === "increase-score" ? <>
          <div className="ld-action-info">Manually update the lead score based on recent engagement.</div>
          <div className="ld-action-current"><span>Current Lead Score</span><Chip variant="caption" color="neutral">{enquiry.score ?? 54}</Chip></div>
          {fieldSelect("Increase By", "increaseBy", ["5", "10", "15", "20"])}
          <div className="ld-action-current"><span>New Lead Score</span><Chip variant="caption" color="lime">{(enquiry.score ?? 54) + Number(values.increaseBy ?? 10)}</Chip></div>
          <Textarea label="Reason" isRequired value={values.reason} onChange={value => set("reason", value)} rows={3} fieldClassName="ld-form-white-field" />
        </> : <>
          <div className="ld-action-info">{kind === "inactive" ? "Mark this lead as inactive. You can reactivate it later." : "Disqualify this lead and record the reason."}</div>
          {kind === "disqualify" && <Textarea label="Reason" isRequired value={values.reason} onChange={value => set("reason", value)} rows={3} fieldClassName="ld-form-white-field" />}
        </>}
      </ModalBody>
      <ModalFooter className="ld-action-footer"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{kind === "templates" ? "Use This Template" : kind === "compose-email" ? "Send Email" : kind === "follow-up-email" ? "Send Follow-up" : kind === "schedule-email" ? "Schedule Email" : kind === "meeting-invite" ? "Send Invite" : kind === "assign" ? "Assign Lead" : kind === "transfer" ? "Transfer Lead" : kind === "change-status" ? "Update Status" : kind === "change-stage" ? "Change Stage" : kind === "increase-score" ? "Update Score" : kind === "inactive" ? "Mark Inactive" : "Disqualify Lead"}</Button></ModalFooter>
    </form>
  </Modal>;
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

const activityTypeOptions = ["All selected", "Calls", "Meetings", "Follow-ups", "Emails", "Notes", "Form submissions", "Status Changes"] as const;
const activityTimeOptions = ["All Time", "Today", "Last 7 days", "Last 30 days"] as const;

function historyTimestamp(value: string) {
  if (/^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))) return Date.parse(value);
  const date = parseLeadDate(value);
  const time = parseLeadTime(value);
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hour = match ? Number(match[1]) % 12 : 12;
  if (match?.[3].toUpperCase() === "PM") hour += 12;
  const minute = match ? Number(match[2]) : 0;
  return new Date(date.year, date.month - 1, date.day, hour, minute).getTime();
}

function historyGroupLabel(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (dateStart === dayStart) return "Today";
  if (dateStart === dayStart - 86_400_000) return "Yesterday";
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function ActivityHistory({ items, typeFilter, timeFilter, onTypeFilter, onTimeFilter, onFollowUp, onOpenRecord }: {
  onFollowUp?: (source: ActivitySource) => void;
  onOpenRecord: (entity: { kind: "meeting" | "follow-up"; id: string }) => void;
  items: FeedItem[];
  typeFilter: string;
  timeFilter: string;
  onTypeFilter: (value: string) => void;
  onTimeFilter: (value: string) => void;
}) {
  const now = Date.now();
  const dayStart = new Date().setHours(0, 0, 0, 0);
  const visible = items
    .map(item => ({ item, timestamp: historyTimestamp(item.when) }))
    .filter(({ item, timestamp }) => {
      const typeMatch = typeFilter === "All selected" ||
        (typeFilter === "Calls" && item.kind === "call") ||
        (typeFilter === "Meetings" && item.kind === "meeting") ||
        (typeFilter === "Follow-ups" && item.kind === "follow") ||
        (typeFilter === "Emails" && item.kind === "email") ||
        (typeFilter === "Notes" && item.kind === "note") ||
        (typeFilter === "Form submissions" && item.kind === "form") ||
        (typeFilter === "Status Changes" && item.kind === "status");
      const timeMatch = timeFilter === "All Time" ||
        (timeFilter === "Today" && timestamp >= dayStart) ||
        (timeFilter === "Last 7 days" && timestamp >= now - 7 * 86_400_000) ||
        (timeFilter === "Last 30 days" && timestamp >= now - 30 * 86_400_000);
      return typeMatch && timeMatch;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
  const groups = visible.reduce<{ label: string; entries: typeof visible }[]>((result, entry) => {
    const label = historyGroupLabel(entry.timestamp);
    const group = result.find(candidate => candidate.label === label);
    if (group) group.entries.push(entry);
    else result.push({ label, entries: [entry] });
    return result;
  }, []);

  return <section className="ld-card ld-history-panel">
    <div className="ld-history-controls">
      <label><span>Notable Activity Type</span><LeadSelect aria-label="Notable activity type" selectedKey={typeFilter} onSelectionChange={key => onTypeFilter(String(key))} className="ld-history-select" triggerClassName="ld-history-select-trigger">{activityTypeOptions.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect></label>
      <label><span>Time</span><LeadSelect aria-label="Activity time range" selectedKey={timeFilter} onSelectionChange={key => onTimeFilter(String(key))} className="ld-history-select" triggerClassName="ld-history-select-trigger">{activityTimeOptions.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect></label>
      <span className="ld-history-count">{visible.length} activities</span>
    </div>
    <div className="ld-history-list">
      {groups.map(group => <section className="ld-history-group" key={group.label}>
        <h3>{group.label}</h3>
        <ol>{group.entries.map(({ item, timestamp }) => <ActivityHistoryRow key={item.id} item={item} timestamp={timestamp} onFollowUp={onFollowUp} onOpenRecord={onOpenRecord} />)}</ol>
      </section>)}
      {!visible.length && <p className="ld-history-empty">No activities match these filters.</p>}
    </div>
  </section>;
}

function ActivityHistoryRow({ item, timestamp, onFollowUp, onOpenRecord }: { item: FeedItem; timestamp: number; onFollowUp?: (source: ActivitySource) => void; onOpenRecord: (entity: { kind: "meeting" | "follow-up"; id: string }) => void }) {
  const Icon = item.kind === "note" ? RiFileTextLine : item.kind === "email" ? RiMailLine : item.kind === "status" ? RiArrowLeftRightLine : item.kind === "created" || item.kind === "form" ? RiAddLine : item.kind === "meeting" ? RiCalendarLine : item.kind === "call" ? RiPhoneLine : RiTimeLine;
  const date = new Date(timestamp);
  return <li className={`ld-history-row ld-history-${item.kind}`}>
    <time dateTime={date.toISOString()}><strong>{date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</strong><span>{date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span></time>
    <span className="ld-history-icon"><Icon /></span>
    <div className="ld-history-copy">
      <p><strong>{item.title}</strong>{item.body ? <>: {item.body}</> : null}</p>
      {item.person && <em>Added by {item.person} on {date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</em>}
    </div>
    <div className="ld-history-actions flex flex-col items-end gap-2">
    {item.source && onFollowUp && <Button variant="secondary" size="small" onClick={() => onFollowUp(item.source!)}>Create follow-up</Button>}
    {item.entity && <Button variant="secondary" size="small" onClick={() => onOpenRecord(item.entity!)}>View {item.entity.kind}</Button>}
    {item.done && <span className="ld-history-status"><RiCheckboxCircleLine />Completed</span>}
    </div>
  </li>;
}

function SocialProfiles({ enquiry, source }: { enquiry: Enquiry; source: string }) {
  const website = enquiry.website?.trim() || "";
  const websiteUrl = website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : "";
  const profiles = [
    { label: "LinkedIn", value: "", Icon: RiLinkedinBoxFill },
    { label: "Twitter (X)", value: "", Icon: RiTwitterXLine },
    { label: "Facebook", value: "", Icon: RiFacebookFill },
    { label: "Instagram", value: "", Icon: RiInstagramLine },
    { label: "Website", value: websiteUrl, Icon: RiGlobalLine },
  ];
  return <div className="ld-social-page">
    <section className="ld-card ld-social-profiles">
      <div className="ld-section-heading"><div><h3>Social Profiles</h3><p>View the lead’s social presence and professional information.</p></div></div>
      <div className="ld-social-list">
        {profiles.map(profile => <div className="ld-social-row" key={profile.label}>
          <span className="ld-social-platform"><profile.Icon />{profile.label}</span>
          {profile.value ? <a href={profile.value} target="_blank" rel="noreferrer">{profile.value}<RiExternalLinkLine /></a> : <span className="ld-social-empty">Not provided</span>}
        </div>)}
      </div>
    </section>
    <section className="ld-card ld-social-attribution">
      <h3><RiGlobalLine />Source &amp; attribution</h3>
      <div className="ld-facts">
        <Field label="Lead source" editing={false} value={source} display={<span className="ld-with-icon"><SourceGlyph name={source} />{source}</span>} />
        <Field label="Enquiry type" editing={false} value={enquiry.enquiryType || enquiry.category} />
        <Field label="Campaign" editing={false} value={enquiry.campaign || "No campaign recorded"} />
        <Field label="Heard about us" editing={false} value={enquiry.heardAbout || "No additional attribution recorded"} />
        <Field label="Recorded by" editing={false} value={enquiry.heardAboutBy || "—"} />
      </div>
    </section>
  </div>;
}

type TaskDraft = { title: string; summary: string; due: string; priority: "High" | "Medium" | "Low"; status: "Scheduled" | "In Progress" | "Pending"; assignedTo: string; reminder: boolean; reminderTiming: string };
const emptyTask = (owner: string): TaskDraft => ({ title: "", summary: "", due: "", priority: "Medium", status: "Scheduled", assignedTo: owner, reminder: true, reminderTiming: "30 Minutes Before" });
const taskTimeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour24 = Math.floor(index / 2);
  const minute = index % 2 ? "30" : "00";
  const hour = hour24 % 12 || 12;
  return { value: `${String(hour24).padStart(2, "0")}:${minute}`, label: `${hour}:${minute} ${hour24 >= 12 ? "PM" : "AM"}` };
});

function TaskDateTimeField({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  const now = new Date();
  const date = parts ? new CalendarDate(Number(parts[1]), Number(parts[2]), Number(parts[3])) : new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const time = parts ? `${parts[4]}:${parts[5]}` : "09:00";
  const setDate = (next: CalendarDate) => onChange(`${next.toString()}T${time}`);
  return <div className="ld-task-datetime-field">
    <label>Due Date &amp; Time <span aria-hidden="true">*</span></label>
    <Dropdown isOpen={open} onOpenChange={setOpen}>
      <DropdownTrigger className="ld-date-trigger" aria-label="Due date and time" isDisabled={disabled}>
        <span>{value ? taskDateLabel(value) : "Select date and time"}</span><RiCalendarLine aria-hidden />
      </DropdownTrigger>
      <DropdownPopover aria-label="Choose due date and time" placement="bottom start" className="ld-date-popover" dialogClassName="gap-3">
        <DateCalendar aria-label="Due date" value={date} onChange={setDate} />
        <Select aria-label="Due time" selectedKey={time} size="sm" className="ld-date-time-select" popoverClassName="w-[180px] max-w-[calc(100vw-48px)]" triggerClassName="ld-form-white-select" onSelectionChange={key => { if (key) { onChange(`${date.toString()}T${String(key)}`); setOpen(false); } }}>
          {taskTimeOptions.map(item => <SelectItem key={item.value} id={item.value}>{item.label}</SelectItem>)}
        </Select>
      </DropdownPopover>
    </Dropdown>
  </div>;
}

function taskDateInput(value: string) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
  const date = value.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!date) return "";
  const month = months.findIndex(name => name.toLowerCase() === date[2].slice(0, 3).toLowerCase());
  if (month < 0) return "";
  const time = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hour = time ? Number(time[1]) % 12 : 9;
  if (time?.[3].toLowerCase() === "pm") hour += 12;
  return `${date[3]}-${String(month + 1).padStart(2, "0")}-${String(Number(date[1])).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${time?.[2] ?? "00"}`;
}
function taskDateLabel(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  const date = new Date(value);
  return date.toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const allowedNoteTags = new Set(["p", "strong", "b", "em", "i", "u", "ul", "ol", "li", "br", "a", "blockquote", "h3"]);
function sanitizeRichNote(value: string) {
  const withoutActiveContent = value.replace(/<(script|style|iframe|object)[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  return withoutActiveContent.replace(/<(\/?)\s*([a-z0-9]+)([^>]*)>/gi, (whole, closing: string, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!allowedNoteTags.has(tag)) return "";
    if (closing) return tag === "br" ? "" : `</${tag}>`;
    if (tag === "br") return "<br>";
    if (tag !== "a") return `<${tag}>`;
    const href = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const url = (href?.[1] ?? href?.[2] ?? href?.[3] ?? "").trim();
    return /^(https?:\/\/|mailto:)/i.test(url) ? `<a href="${url.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}" target="_blank" rel="noopener noreferrer">` : "<a>";
  });
}
function plainNoteText(value: string) {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|li|blockquote|h3)>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function NoteContent({ html }: { html: string }) {
  return <div className="ld-note-content" dangerouslySetInnerHTML={{ __html: sanitizeRichNote(html) }} />;
}

function RichNoteEditor({ value, onChange, label = "Note Detail" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [block, setBlock] = useState("p");
  useEffect(() => { if (editorRef.current) editorRef.current.innerHTML = sanitizeRichNote(value); }, []);
  const apply = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    onChange(editorRef.current?.innerHTML ?? "");
  };
  const toolbarButton = (label: string, icon: typeof RiBold, command: string) => {
    const Icon = icon;
    return <button type="button" aria-label={label} title={label} onMouseDown={event => event.preventDefault()} onClick={() => apply(command)}><Icon className="size-4" aria-hidden /></button>;
  };
  return <div className="ld-rich-note-field">
    <label className="ld-rich-note-label">{label} <span aria-hidden="true">*</span></label>
    <div className="ld-rich-note-toolbar">
      <Select aria-label="Paragraph style" selectedKey={block} size="sm" className="ld-rich-note-block" triggerClassName="ld-form-white-select" onSelectionChange={key => { if (key) { setBlock(String(key)); apply("formatBlock", String(key)); } }}>
        {[{ id: "paragraph", label: "Paragraph", value: "p" }, { id: "heading", label: "Heading", value: "h3" }, { id: "quote", label: "Quote", value: "blockquote" }].map(item => <SelectItem key={item.id} id={item.value}>{item.label}</SelectItem>)}
      </Select>
      {toolbarButton("Bold", RiBold, "bold")}{toolbarButton("Italic", RiItalic, "italic")}{toolbarButton("Underline", RiUnderline, "underline")}
      {toolbarButton("Bulleted list", RiListUnordered, "insertUnorderedList")}{toolbarButton("Numbered list", RiListOrdered, "insertOrderedList")}
      <button type="button" aria-label="Insert link" title="Insert link" onMouseDown={event => event.preventDefault()} onClick={() => { const url = window.prompt("Enter link URL"); if (url) apply("createLink", url); }}><RiLink className="size-4" aria-hidden /></button>
    </div>
    <div ref={editorRef} className="ld-rich-note-editor" contentEditable role="textbox" aria-label="Note detail" aria-multiline="true" data-placeholder="Write your note" onInput={event => onChange(event.currentTarget.innerHTML)} />
  </div>;
}

function TasksPage({ items, owners, onCreate, onPatch, onDelete }: { items: Activity[]; owners: string[]; onCreate: (task: TaskDraft) => void; onPatch: (id: string, patch: Partial<Activity>) => void; onDelete: (id: string) => void }) {
  const [dialog, setDialog] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(emptyTask(owners[0] ?? ""));
  const [menu, setMenu] = useState<{ id: string; view: "main" | "priority" | "status" | "assignee" } | null>(null);
  const open = (mode: "add" | "edit" | "view", item?: Activity) => {
    setSelected(item ?? null);
    setDraft(item ? { title: item.title, summary: item.type === "Task" ? item.summary : "", due: taskDateInput(item.due), priority: item.priority ?? "Medium", status: item.status === "Completed" ? "Scheduled" : item.status as TaskDraft["status"], assignedTo: item.assignedTo || item.createdBy, reminder: item.reminder ?? true, reminderTiming: item.reminderTiming || "30 Minutes Before" } : emptyTask(owners[0] ?? ""));
    setDialog(mode);
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.due) return;
    if (selected) onPatch(selected.id, { title: draft.title.trim(), summary: draft.summary, due: draft.due, when: draft.due, priority: draft.priority, status: draft.status, assignedTo: draft.assignedTo, reminder: draft.reminder, reminderTiming: draft.reminderTiming });
    else onCreate({ ...draft, title: draft.title.trim() });
    setDialog(null);
  };
  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const statusOptions = ["Scheduled", "In Progress", "Pending"] as const;
  return <section className="ld-card ld-tasks-page">
    <div className="ld-section-heading"><div><h3>Tasks ({items.length})</h3><p>Track follow-ups and actions for this lead.</p></div><Button size="small" leadingIcon={RiAddLine} onClick={() => open("add")}>Add Task</Button></div>
    <div className="ld-task-table-wrap"><table className="ld-task-table"><thead><tr><th aria-label="Complete" /><th>Task</th><th>Due date</th><th>Priority</th><th>Status</th><th /></tr></thead><tbody>
      {items.map(item => <tr key={item.id}>
        <td><Checkbox aria-label={`Complete ${item.title}`} isSelected={item.status === "Completed"} onChange={() => onPatch(item.id, { status: item.status === "Completed" ? "Scheduled" : "Completed" })} /></td>
        <td className="ld-task-title-cell"><strong>{item.title}</strong><small>{item.summary || item.type}</small></td>
        <td><span className="ld-table-date"><RiCalendarLine />{taskDateLabel(item.due || item.when || "—")}</span></td>
        <td><span className={`ld-task-priority is-${(item.priority ?? "Medium").toLowerCase()}`}>{item.priority ?? "Medium"}</span></td>
        <td><span className={`ld-task-status is-${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status === "Scheduled" ? "Open" : item.status}</span></td>
        <td><Dropdown isOpen={menu?.id === item.id} onOpenChange={isOpen => setMenu(isOpen ? { id: item.id, view: "main" } : null)}><DropdownTrigger className="ld-more" aria-label={`Actions for ${item.title}`}><RiMoreLine /></DropdownTrigger><DropdownPopover aria-label={`Actions for ${item.title}`} placement="bottom end" className="w-[220px]">
          {menu?.id === item.id && menu.view !== "main" ? <>
            <DropdownItem onSelect={() => setMenu({ id: item.id, view: "main" })}><RiArrowLeftLine />Back to task actions</DropdownItem><DropdownDivider />
            {menu.view === "priority" && (["High", "Medium", "Low"] as const).map(value => <DropdownItem key={value} selected={(item.priority ?? "Medium") === value} onSelect={() => { onPatch(item.id, { priority: value }); setMenu(null); }}>{value}</DropdownItem>)}
            {menu.view === "status" && (["Scheduled", "In Progress", "Pending", "Completed"] as const).map(value => <DropdownItem key={value} selected={item.status === value} onSelect={() => { onPatch(item.id, { status: value }); setMenu(null); }}>{value === "Scheduled" ? "Open" : value}</DropdownItem>)}
            {menu.view === "assignee" && owners.map(value => <DropdownItem key={value} selected={(item.assignedTo || item.createdBy) === value} onSelect={() => { onPatch(item.id, { assignedTo: value }); setMenu(null); }}><Avatar size="xs" src={portraitFor(value)} initials={initials(value)} alt="" />{value}</DropdownItem>)}
          </> : <>
            <DropdownItem onSelect={() => { setMenu(null); open("view", item); }}><RiFileTextLine />View Task</DropdownItem><DropdownItem onSelect={() => { setMenu(null); open("edit", item); }}><RiPencilLine />Edit Task</DropdownItem><DropdownItem onSelect={() => { onPatch(item.id, { status: item.status === "Completed" ? "Scheduled" : "Completed" }); setMenu(null); }}><RiCheckboxCircleLine />{item.status === "Completed" ? "Reopen Task" : "Mark as Complete"}</DropdownItem><DropdownItem onSelect={() => setMenu({ id: item.id, view: "assignee" })}><RiUserSharedLine />Reassign Task<RiArrowDownSLine className="ld-menu-trailing" /></DropdownItem><DropdownItem onSelect={() => setMenu({ id: item.id, view: "priority" })}><RiArrowLeftRightLine />Change Priority<RiArrowDownSLine className="ld-menu-trailing" /></DropdownItem><DropdownItem onSelect={() => setMenu({ id: item.id, view: "status" })}><RiArrowDownSLine />Change Status<RiArrowDownSLine className="ld-menu-trailing" /></DropdownItem><DropdownDivider /><DropdownItem className="text-text-error-primary" onSelect={() => { onDelete(item.id); setMenu(null); }}><RiDeleteBinLine />Delete Task</DropdownItem>
          </>}
        </DropdownPopover></Dropdown></td>
      </tr>)}
      {!items.length && <tr><td colSpan={6} className="ld-task-empty">No tasks yet.</td></tr>}
    </tbody></table></div>
    {dialog && <Modal isOpen onOpenChange={openState => !openState && setDialog(null)} size="lg" aria-label={dialog === "add" ? "Add task" : dialog === "edit" ? "Edit task" : "View task"}>
      <ModalHeader title={dialog === "add" ? "Add Task" : dialog === "edit" ? "Edit Task" : "Task Details"} />
      <form onSubmit={save} className="ld-action-form">
        <ModalBody className="ld-action-body">
          <div className="ld-action-grid ld-task-title-row"><Input label="Task Title" isRequired isReadOnly={dialog === "view"} value={draft.title} onChange={value => set("title", value)} placeholder="Enter task title" fieldClassName="ld-form-white-field" /><Select label="Priority" selectedKey={draft.priority} isDisabled={dialog === "view"} triggerClassName="ld-form-white-select" onSelectionChange={key => key && set("priority", String(key) as TaskDraft["priority"])}>{["High", "Medium", "Low"].map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select></div>
          <div className="ld-action-grid"><TaskDateTimeField value={draft.due} disabled={dialog === "view"} onChange={value => set("due", value)} /><Select label="Status" selectedKey={draft.status} isDisabled={dialog === "view"} className="ld-task-status-field" triggerClassName="ld-form-white-select" onSelectionChange={key => key && set("status", String(key) as TaskDraft["status"])}>{statusOptions.map(value => <SelectItem key={value} id={value}>{value === "Scheduled" ? "Open" : value}</SelectItem>)}</Select></div>
          <div className="ld-action-grid ld-task-owner-row"><Select label="Assigned To" selectedKey={draft.assignedTo} isDisabled={dialog === "view"} triggerClassName="ld-form-white-select" onSelectionChange={key => key && set("assignedTo", String(key))}>{owners.map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select><Select label="Reminder timing" selectedKey={draft.reminderTiming} isDisabled={dialog === "view" || !draft.reminder} popoverClassName="w-[210px] max-w-[calc(100vw-48px)]" triggerClassName="ld-form-white-select" onSelectionChange={key => key && set("reminderTiming", String(key))}>{["At time of task", "15 Minutes Before", "30 Minutes Before", "1 Hour Before", "1 Day Before"].map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select></div>
          <Textarea label="Description" isReadOnly={dialog === "view"} value={draft.summary} onChange={value => set("summary", value)} placeholder="Add task details" rows={3} fieldClassName="ld-form-white-field" />
        </ModalBody>
        <ModalFooter className="ld-action-footer"><Checkbox className="ld-footer-pin" isSelected={draft.reminder} isDisabled={dialog === "view"} onChange={value => set("reminder", value)}>Set Reminder</Checkbox><Button type="button" variant="secondary" onClick={() => setDialog(null)}>{dialog === "view" ? "Close" : "Cancel"}</Button>{dialog !== "view" && <Button type="submit">{dialog === "add" ? "Create Task" : "Save Changes"}</Button>}</ModalFooter>
      </form>
    </Modal>}
  </section>;
}

function NotesPage({ items, onCreate, onPatch, onDelete, openRequested, onRequestConsumed }: { items: Activity[]; onCreate: (note: { title: string; detail: string; noteType: string; pinned: boolean }) => void; onPatch: (id: string, patch: Partial<Activity>) => void; onDelete: (id: string) => void; openRequested: boolean; onRequestConsumed: () => void }) {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [noteType, setNoteType] = useState("General");
  const [pinned, setPinned] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  useEffect(() => { if (openRequested) { open(); onRequestConsumed(); } }, [openRequested, onRequestConsumed]);
  const open = (item?: Activity) => { setEditing(item ?? null); setTitle(item?.title ?? ""); setDetail(item?.summary ?? ""); setNoteType(item?.noteType ?? "General"); setPinned(item?.pinned ?? false); setDialog(true); };
  const save = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!title.trim() || !plainNoteText(detail).trim()) return; if (editing) onPatch(editing.id, { title: title.trim(), summary: sanitizeRichNote(detail), noteType, pinned }); else onCreate({ title: title.trim(), detail: sanitizeRichNote(detail), noteType, pinned }); setDialog(false); };
  return <section className="ld-card ld-notes-page">
    <div className="ld-section-heading"><div><h3>Notes ({items.length})</h3><p>Keep key conversations and context together.</p></div><Button size="small" leadingIcon={RiAddLine} onClick={() => open()}>Add Note</Button></div>
    <div className="ld-note-list">
      {[...items].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))).map(item => <article className="ld-note-entry" key={item.id}><span className="ld-note-entry-icon"><RiFileTextLine /></span><div><strong>{item.title}</strong><small>{item.when}{item.noteType ? ` · ${item.noteType}` : ""}{item.createdBy ? ` · By ${item.createdBy}` : ""}{item.pinned ? " · Pinned" : ""}</small><NoteContent html={item.summary || "No note details added."} /></div><Dropdown isOpen={openMenuId === item.id} onOpenChange={isOpen => setOpenMenuId(isOpen ? item.id : null)}><DropdownTrigger className="ld-more" aria-label={`Actions for ${item.title}`}><RiMoreLine /></DropdownTrigger><DropdownPopover aria-label={`Actions for ${item.title}`} placement="bottom end" className="w-[190px]"><DropdownItem onSelect={() => { open(item); setOpenMenuId(null); }}><RiPencilLine />Edit Note</DropdownItem><DropdownItem onSelect={() => { onPatch(item.id, { pinned: !item.pinned }); setOpenMenuId(null); }}><RiPushpinLine />{item.pinned ? "Unpin Note" : "Pin Note"}</DropdownItem><DropdownItem onSelect={() => { void navigator.clipboard?.writeText(`${item.title}\n${plainNoteText(item.summary)}`); setOpenMenuId(null); }}><RiFileCopyLine />Copy Note</DropdownItem><DropdownDivider /><DropdownItem className="text-text-error-primary" onSelect={() => { onDelete(item.id); setOpenMenuId(null); }}><RiDeleteBinLine />Delete Note</DropdownItem></DropdownPopover></Dropdown></article>)}
      {!items.length && <p className="ld-task-empty">No notes yet. Add a note to keep useful details here.</p>}
    </div>
    {dialog && <Modal isOpen onOpenChange={openState => !openState && setDialog(false)} size="md" aria-label={editing ? "Edit note" : "Add note"}>
      <ModalHeader title={editing ? "Edit Note" : "Add Note"} />
      <form onSubmit={save} className="ld-action-form"><ModalBody className="ld-action-body">
        <div className="ld-action-grid ld-note-title-row"><Input label="Note Title" isRequired value={title} onChange={setTitle} placeholder="Enter note title" fieldClassName="ld-form-white-field" /><Select label="Note Type" selectedKey={noteType} triggerClassName="ld-form-white-select" onSelectionChange={key => key && setNoteType(String(key))}>{["General", "Call", "Meeting", "Requirement", "Follow-up"].map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select></div>
        <RichNoteEditor key={editing?.id ?? "new-note"} value={detail} onChange={setDetail} />
      </ModalBody><ModalFooter className="ld-action-footer"><Checkbox className="ld-footer-pin" isSelected={pinned} onChange={setPinned}>Pin this note</Checkbox><Button type="button" variant="secondary" onClick={() => setDialog(false)}>Cancel</Button><Button type="submit">{editing ? "Save Note" : "Create Note"}</Button></ModalFooter></form>
    </Modal>}
  </section>;
}

function SalesActivityPage({ items }: { items: Activity[] }) {
  return <section className="ld-card ld-sales-page">
    <div className="ld-section-heading"><div><h3>Sales Activity ({items.length})</h3><p>Review calls, meetings, emails and follow-ups recorded for this lead.</p></div></div>
    <div className="ld-task-table-wrap"><table className="ld-sales-table"><thead><tr><th>Date &amp; time</th><th>Activity</th><th>Details</th><th>Owner</th><th>Outcome</th></tr></thead><tbody>
      {[...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(item => <tr key={item.id}>
        <td><span className="ld-table-date"><RiCalendarLine />{item.when || item.due || "—"}</span></td>
        <td><span className="ld-sales-kind">{item.kind === "email" ? <RiMailLine /> : item.kind === "meeting" ? <RiCalendarLine /> : <RiPhoneLine />}{item.title}</span></td>
        <td>{item.type === "Other Communication" ? plainNoteText(item.summary) || "—" : item.summary || "—"}</td><td>{item.createdBy || "—"}</td><td><span className={`ld-task-status is-${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.outcome || item.status}</span></td>
      </tr>)}
      {!items.length && <tr><td colSpan={5} className="ld-task-empty">No sales activity recorded yet.</td></tr>}
    </tbody></table></div>
  </section>;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  function add(files: FileList | null) {
    if (!files?.length) return;
    const stamp = "12 Nov 2026, 6:20 PM";
    const next = [...files].map(file => ({ id: `doc-${file.name}-${file.size}-${file.lastModified}`, name: file.name, type: fileType(file.name), size: fileSize(file.size), by: "Mohammad Abrar", when: stamp, previewUrl: URL.createObjectURL(file) }));
    onChange([...next, ...docs]);
  }
  return (
    <div className="ld-pane ld-documents-pane">
      <section className={`ld-card ld-docs${over ? " is-over" : ""}`} onDragOver={event => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={event => { event.preventDefault(); setOver(false); add(event.dataTransfer.files); }}>
        <div className="ld-docs-head">
          <div>
            <h3>Documents</h3>
            <p>Manage all files related to this enquiry.</p>
          </div>
          <Button size="small" leadingIcon={RiUpload2Line} onClick={() => fileInputRef.current?.click()}>Upload Files</Button>
          <input ref={fileInputRef} className="ld-doc-upload-input" type="file" multiple aria-label="Upload documents" onChange={event => { add(event.target.files); event.target.value = ""; }} />
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
    </div>
  );
}

function DocRow({ doc, onRemove }: { doc: EnquiryDoc; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState(false);
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
            <DropdownItem onSelect={() => { setOpen(false); setViewing(true); }}><RiEyeLine />View</DropdownItem>
            <DropdownDivider />
            <DropdownItem className="text-text-error-primary" onSelect={() => { setOpen(false); onRemove(); }}><RiDeleteBinLine />Delete</DropdownItem>
          </DropdownPopover>
        </Dropdown>
      </td>
      {viewing && <Modal isOpen onOpenChange={isOpen => !isOpen && setViewing(false)} size="lg" aria-label={`View ${doc.name}`}>
        <ModalHeader title={doc.name} />
        <ModalBody className="ld-document-preview">
          {doc.previewUrl ? doc.type === "PNG" || doc.type === "JPG" ? <img src={doc.previewUrl} alt={doc.name} /> : <iframe title={`Preview of ${doc.name}`} src={doc.previewUrl} /> : <div className="ld-document-preview-empty"><Icon /><strong>{doc.name}</strong><span>{doc.type} · {doc.size}</span><p>Preview is unavailable for this sample document.</p></div>}
        </ModalBody>
        <ModalFooter><Button variant="secondary" onClick={() => setViewing(false)}>Close</Button></ModalFooter>
      </Modal>}
    </tr>
  );
}

