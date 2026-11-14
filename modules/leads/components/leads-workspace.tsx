"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Selection } from "react-aria-components";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBriefcaseLine,
  RiBuilding4Line,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiFlag2Line,
  RiGlobalLine,
  RiGroupLine,
  RiInformationLine,
  RiLineChartLine,
  RiLoopRightLine,
  RiMailLine,
  RiMapPin2Line,
  RiMoreLine,
  RiPencilLine,
  RiPhoneLine,
  RiPlayCircleLine,
  RiStackLine,
  RiStickyNoteLine,
  RiStore2Line,
  RiTimeLine,
  RiUser3Line,
  RiWhatsappLine,
  type RemixiconComponentType,
} from "@remixicon/react";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { portraitFor } from "@/modules/users-roles/portrait";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { SearchField } from "@/components/base/search-field/search-field";
import { SelectItem } from "@/components/base/select/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { Textarea } from "@/components/base/textarea/textarea";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { cx } from "@/utils/cx";
import { EnquiryDetail } from "./enquiry-detail";
import { SourceLeadsPanel } from "./source-leads-panel";
import { cityOptions, DateField, LeadSelect, leadTimes, PhoneField, stateForCity, stateOptions, SuggestField } from "./lead-fields";
import { initialActivities, initialEnquiries, initialSources, sourceLeads } from "../data";
import {
  activityStatuses,
  activityTypes,
  brands,
  budgetRanges,
  categories,
  enquiryStatuses,
  heardAboutOptions,
  originalSources,
  outcomes,
  sourceKinds,
  timelines,
  type Activity,
  type ActivityKind,
  type ActivityStatus,
  type Category,
  type Enquiry,
  type EnquiryStatus,
  type LeadSource,
  type SourceKind,
} from "../types";
import "./leads.css";

const navItems = ["Enquiries", "Activity", "Sources"] as const;
const owners = ["Himani Bhargava Tapadiya", "Shakshay Gupta", "Vivek Rawat", "Ekta Pattanaik", "Swetha Chintada"];
const categoryViews = ["Franchise", "Brand expansion", "Job"] as const;
type Section = (typeof navItems)[number] | (typeof categoryViews)[number];
type Column = { id: string; name: string; isRowHeader?: boolean };

const selectColumn: Column = { id: "select", name: "" };
const actionsColumn: Column = { id: "actions", name: "" };
const franchiseColumns: Column[] = [
  selectColumn,
  { id: "person", name: "Enquiry", isRowHeader: true },
  { id: "brand", name: "Interested Brand" },
  { id: "location", name: "Location" },
  { id: "investment", name: "Investment Capacity" },
  { id: "owner", name: "Assigned To" },
  { id: "status", name: "Status" },
  { id: "created", name: "Created On" },
  actionsColumn,
];
const brandColumns: Column[] = [
  selectColumn,
  { id: "person", name: "Enquiry", isRowHeader: true },
  { id: "industry", name: "Industry" },
  { id: "location", name: "Location" },
  { id: "presence", name: "Presence" },
  { id: "owner", name: "Assigned To" },
  { id: "status", name: "Status" },
  { id: "created", name: "Created On" },
  actionsColumn,
];
const jobColumns: Column[] = [
  selectColumn,
  { id: "person", name: "Candidate", isRowHeader: true },
  { id: "position", name: "Position" },
  { id: "location", name: "Location" },
  { id: "profile", name: "Profile" },
  { id: "owner", name: "Assigned To" },
  { id: "status", name: "Status" },
  { id: "created", name: "Created On" },
  actionsColumn,
];
const activityColumns: Column[] = [
  { id: "activity", name: "Activity", isRowHeader: true },
  { id: "enquiry", name: "Related Enquiry" },
  { id: "owner", name: "Assigned To" },
  { id: "due", name: "Due Date" },
  { id: "status", name: "Status" },
  { id: "actions", name: "Actions" },
];
const sourceColumns: Column[] = [
  { id: "source", name: "Source Name", isRowHeader: true },
  { id: "kind", name: "Source Type" },
  { id: "leads", name: "Total Leads" },
  { id: "qualified", name: "Qualified Leads" },
  { id: "converted", name: "Converted Leads" },
  { id: "rate", name: "Conversion Rate" },
  { id: "status", name: "Status" },
  { id: "actions", name: "Actions" },
];
const heardColumns: Column[] = [
  { id: "person", name: "Enquiry", isRowHeader: true },
  { id: "original", name: "Original source" },
  { id: "heard", name: "Heard about us" },
  { id: "recorded", name: "Recorded by" },
];

const enquiryTabs: { id: (typeof categoryViews)[number]; label: string; icon: RemixiconComponentType }[] = [
  { id: "Franchise", label: "Franchise Enquiries", icon: RiStore2Line },
  { id: "Brand expansion", label: "Brand Expansion Enquiries", icon: RiBuilding4Line },
  { id: "Job", label: "Job Enquiries", icon: RiBriefcaseLine },
];

const jobCategories = ["Franchise", "Brand expansion", "Job"] as Category[];
const salesCategories = ["Franchise", "Brand expansion"] as Category[];
const leadSections = ["Enquiries", "Activity", "Sources"] as const;
const accessRoles = [
  { id: "ceo", name: "Mohammad Abrar", title: "Superadmin", categories: jobCategories, sections: leadSections, canDelete: true },
  { id: "sumanth", name: "Gangaram Sumanth Reddy", label: "Sumanth Reddy", title: "Superadmin", categories: jobCategories, sections: leadSections, canDelete: true },
  { id: "shakshay", name: "Shakshay Gupta", title: "Admin", categories: jobCategories, sections: leadSections, canDelete: true },
  { id: "shiwali", name: "Shiwali Singh", title: "Admin", categories: jobCategories, sections: leadSections, canDelete: true },
  { id: "swetha", name: "Swetha Chintada", title: "Admin", categories: jobCategories, sections: leadSections, canDelete: true },
  { id: "sales", name: "Himani Bhargava Tapadiya", title: "Sales", categories: salesCategories, sections: leadSections, canDelete: false },
  { id: "hr", name: "Ekta Pattanaik", title: "HR", categories: jobCategories, sections: leadSections, canDelete: false },
];
type AccessRole = (typeof accessRoles)[number];

function activityMark(activity: Activity) {
  const title = `${activity.title} ${activity.type}`.toLowerCase();
  if (title.includes("whatsapp")) return { icon: RiWhatsappLine, tone: "follow" };
  if (title.includes("location") || title.includes("note")) return { icon: RiMapPin2Line, tone: "note" };
  if (activity.type === "Other Communication") return { icon: RiStickyNoteLine, tone: "note" };
  if (activity.kind === "email") return { icon: RiMailLine, tone: "email" };
  if (activity.kind === "meeting") return { icon: RiCalendarLine, tone: "meeting" };
  if (activity.kind === "follow-up") return { icon: RiTimeLine, tone: "follow" };
  return { icon: RiPhoneLine, tone: "call" };
}
const sourceIcon: Record<string, RemixiconComponentType> = {
  Website: RiGlobalLine,
  Referral: RiGroupLine,
  "Walk-in": RiStore2Line,
};
const sourceTone: Record<string, string> = {
  Website: "#32159b",
  Referral: "#5b3cc4",
  "Walk-in": "#5b3cc4",
};

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.07-1.47-.23-2.11H12v3.83h6.58c-.13 1.1-.85 2.76-2.45 3.88l-.02.14 3.55 2.7.25.02c2.27-2.05 3.58-5.07 3.58-8.46z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.05 7.95-2.85l-3.79-2.87c-1.01.7-2.37 1.18-4.16 1.18-3.18 0-5.87-2.05-6.83-4.89l-.14.01-3.7 2.81-.05.13C3.23 21.48 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.17 14.57A7.2 7.2 0 0 1 4.78 12c0-.89.16-1.76.38-2.57l-.01-.17-3.74-2.85-.12.06A11.8 11.8 0 0 0 0 12c0 1.93.47 3.75 1.29 5.36l3.88-2.79z" />
      <path fill="#EA4335" d="M12 4.75c2.25 0 3.77.96 4.64 1.76l3.38-3.24C17.95 1.19 15.24 0 12 0 7.31 0 3.23 2.52 1.29 6.47l3.87 2.96C6.13 6.8 8.82 4.75 12 4.75z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.89v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z" />
    </svg>
  );
}

function InstagramLogo() {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <defs>
        <radialGradient id={id} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="15%" stopColor="#fdf497" />
          <stop offset="35%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill={`url(#${id})`} />
      <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.7" cy="7.35" r="1" fill="#fff" />
    </svg>
  );
}

function MetaLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#0081FB" d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
    </svg>
  );
}

function SourceMark({ name }: { name: string }) {
  if (name === "Google Ads") return <span className="ld-logo"><GoogleLogo /></span>;
  if (name === "Meta Ads") return <span className="ld-logo"><MetaLogo /></span>;
  if (name === "Facebook") return <span className="ld-logo"><FacebookLogo /></span>;
  if (name === "Instagram") return <span className="ld-logo"><InstagramLogo /></span>;
  const Icon = sourceIcon[name] ?? RiGlobalLine;
  return <span className="ld-mark" style={{ color: sourceTone[name] ?? "#5b3cc4" }}><Icon /></span>;
}
const kindColor: Record<SourceKind, ChipColor> = { Digital: "purple", Partner: "cyan", Offline: "yellow" };
const enquiryStatusColor: Record<EnquiryStatus, ChipColor> = { New: "purple", "In Progress": "yellow", Qualified: "lime", Converted: "blue" };
const activityStatusColor: Record<ActivityStatus, ChipColor> = { Completed: "lime", Scheduled: "blue", "In Progress": "yellow", Pending: "cyan" };

const now = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function isSection(value?: string): value is Section {
  return !!value && ([...navItems, ...categoryViews] as string[]).includes(value);
}

function isEnquiryView(section: Section) {
  return section === "Enquiries" || (categoryViews as readonly string[]).includes(section);
}

function initials(name: string) {
  return (name.trim()[0] ?? "").toUpperCase();
}

function shortName(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function firstName(name: string) {
  return name.split(" ").filter(Boolean)[0] ?? name;
}

function heardLabel(enquiry: Pick<Enquiry, "heardAbout" | "heardAboutOther">) {
  if (!enquiry.heardAbout) return "Not answered";
  return enquiry.heardAbout === "Other" && enquiry.heardAboutOther ? `Other · ${enquiry.heardAboutOther}` : enquiry.heardAbout;
}

function conversion(converted: number, leads: number) {
  if (!leads) return "0%";
  return `${((converted / leads) * 100).toFixed(1)}%`;
}

function kindFor(type: string): ActivityKind {
  if (type === "Email") return "email";
  if (type === "In-Person Meeting" || type === "Face-to-Face Discussion") return "meeting";
  if (type === "Phone Call") return "call";
  return "follow-up";
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-button-default bg-background-primary-default">{children}</section>;
}

function FilterSelect({ label, value, options, onChange, width = "w-[158px]" }: { label: string; value: string; options: Array<string | { id: string; label: string }>; onChange: (value: string) => void; width?: string }) {
  const items = options.map(option => typeof option === "string" ? { id: option, label: option } : option);
  return (
    <LeadSelect aria-label={label} selectedKey={value} onSelectionChange={key => onChange(String(key))} className={`${width} shrink-0`} triggerClassName="w-full shadow-none">
      {items.map(option => <SelectItem key={option.id} id={option.id}>{option.label}</SelectItem>)}
    </LeadSelect>
  );
}

function Stat({ icon: Icon, value, label, tone, onClick }: { icon: RemixiconComponentType; value: string | number; label: string; tone: string; onClick?: () => void }) {
  return (
    <button type="button" className={cx("ld-stat", `ld-tone-${tone}`)} onClick={onClick}>
      <span className="ld-stat-icon"><Icon /></span>
      <span className="min-w-0">
        <strong>{value}</strong>
        <em>{label}</em>
      </span>
    </button>
  );
}

function Person({ name, meta, photo }: { name: string; meta: string; photo?: string }) {
  return (
    <span className="flex items-center gap-3">
      <Avatar size="md" src={photo} initials={initials(name)} alt="" className={photo ? undefined : "ld-initials"} />
      <span className="min-w-0">
        <span className="block truncate text-body-2-medium text-text-primary">{name}</span>
        <span className="block truncate text-caption-1-regular text-text-tertiary">{meta}</span>
      </span>
    </span>
  );
}

function Assignee({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar size="sm" src={portraitFor(name)} initials={initials(name)} alt="" />
      <span className="truncate text-body-2-regular">{firstName(name)}</span>
    </span>
  );
}

function StatusPill({ status }: { status: EnquiryStatus | ActivityStatus }) {
  const color = status in enquiryStatusColor ? enquiryStatusColor[status as EnquiryStatus] : activityStatusColor[status as ActivityStatus];
  const Icon = status === "Qualified" || status === "Converted" || status === "Completed" ? RiCheckboxCircleLine : status === "Scheduled" ? RiCalendarLine : status === "Pending" ? RiTimeLine : null;
  return (
    <Chip variant="caption" color={color} className="ld-pill gap-1 rounded-full px-2">
      {Icon && <Icon className="size-3.5" />}
      {status}
    </Chip>
  );
}

function EnquiryActions({ label, canDelete, onView, onEdit, onAssign, onStatus, onDelete }: { label: string; canDelete: boolean; onView?: () => void; onEdit?: () => void; onAssign?: () => void; onStatus?: () => void; onDelete?: () => void }) {
  const [open, setOpen] = useState(false);
  const pick = (action?: () => void) => () => { setOpen(false); action?.(); };
  const hasAction = Boolean(onView || onEdit || onAssign || onStatus || (canDelete && onDelete));
  return (
    <span className="inline-flex items-center" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
      {hasAction && <Dropdown isOpen={open} onOpenChange={setOpen}>
        <DropdownTrigger className="ld-more" aria-label={`Actions for ${label}`}>
          <RiMoreLine />
        </DropdownTrigger>
        <DropdownPopover aria-label={`Actions for ${label}`} placement="bottom end" className="w-[210px] overflow-visible">
          {onView && <DropdownItem onSelect={pick(onView)}>View</DropdownItem>}
          {onEdit && <DropdownItem onSelect={pick(onEdit)}>Edit</DropdownItem>}
          {onAssign && <DropdownItem onSelect={pick(onAssign)}>Assign</DropdownItem>}
          {onStatus && <DropdownItem onSelect={pick(onStatus)}>Update status</DropdownItem>}
          {canDelete && onDelete && <>
            <DropdownDivider />
            <div className="ld-restricted">
              <button type="button" className="ld-delete" onClick={pick(onDelete)}><RiDeleteBinLine className="size-4" /> Delete</button>
              <button type="button" className="ld-info" aria-label="Delete access is restricted to authorized users.">
                <RiInformationLine className="size-4" />
                <span className="ld-info-tip" role="tooltip">Delete access is restricted to authorized users.</span>
              </button>
            </div>
          </>}
        </DropdownPopover>
      </Dropdown>}
      {!canDelete && (
        <button type="button" className="ld-info" aria-label="Delete access is restricted to authorized users.">
          <RiInformationLine className="size-4" />
          <span className="ld-info-tip" role="tooltip">Delete access is restricted to authorized users.</span>
        </button>
      )}
    </span>
  );
}

const pageSize = 20;

function Pager({ label, page, pages, onPage }: { label: string; page: number; pages: number; onPage: (page: number) => void }) {
  return (
    <footer className="ld-pager">
      <span>{label}</span>
      <div className="ld-pages">
        <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><RiArrowLeftSLine className="mx-auto size-4" /></button>
        {Array.from({ length: pages }, (_, index) => index + 1).map(number => (
          <button key={number} type="button" aria-current={number === page ? "page" : undefined} onClick={() => onPage(number)}>{number}</button>
        ))}
        <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><RiArrowRightSLine className="mx-auto size-4" /></button>
      </div>
    </footer>
  );
}

function slicePage<T>(items: T[], page: number) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(page, 1), pages);
  const start = items.length ? (current - 1) * pageSize : 0;
  return { rows: items.slice(start, start + pageSize), pages, current, start: items.length ? start + 1 : 0, end: Math.min(current * pageSize, items.length) };
}

export function LeadsWorkspace({ view = "Enquiries" }: { view?: string }) {
  const router = useRouter();
  const section = isSection(view) ? view : "Enquiries";
  const enquiryView = isEnquiryView(section);
  const activeCategory = (categoryViews as readonly string[]).includes(section) ? section as Category : null;
  const [roleId, setRoleId] = useState(accessRoles[0].id);
  const role = accessRoles.find(item => item.id === roleId) ?? accessRoles[0];
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [activities, setActivities] = useState(initialActivities);
  const [sources, setSources] = useState(initialSources);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [brand, setBrand] = useState("All brands");
  const [location, setLocation] = useState("All locations");
  const [activityKind, setActivityKind] = useState("All types");
  const [related, setRelated] = useState("All enquiries");
  const [assignee, setAssignee] = useState("All people");
  const [sourceKind, setSourceKind] = useState("All types");
  const [selected, setSelected] = useState<Selection>(new Set());
  const [open, setOpen] = useState<Enquiry | null>(null);
  const [editing, setEditing] = useState<Enquiry | null>(null);
  const [assignIds, setAssignIds] = useState<string[] | null>(null);
  const [assignOwner, setAssignOwner] = useState(owners[0]);
  const [statusIds, setStatusIds] = useState<string[] | null>(null);
  const [statusChoice, setStatusChoice] = useState<EnquiryStatus | "">("");
  const [sourceView, setSourceView] = useState<{ name: string; rows: typeof sourceLeads } | null>(null);
  const [rateText, setRateText] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [logging, setLogging] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [draftCategory, setDraftCategory] = useState<Category>("Franchise");
  const [draftCity, setDraftCity] = useState("");
  const [draftState, setDraftState] = useState("");
  const [sourceName, setSourceName] = useState("Website");
  const [note, setNote] = useState("");
  const [draftHeard, setDraftHeard] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ name: string; run: () => void } | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setQuery("");
    setStatus("All statuses");
    setBrand("All brands");
    setLocation("All locations");
    setActivityKind("All types");
    setRelated("All enquiries");
    setAssignee("All people");
    setSourceKind("All types");
    setSelected(new Set());
    setOpen(null);
    setPage(1);
  }, [section]);

  useEffect(() => {
    setRoleOpen(false);
  }, [roleId]);

  useEffect(() => {
    if (section === "Activity" || section === "Sources") {
      if (!role.sections.includes(section)) router.replace(`/library/modules/leads?view=${encodeURIComponent(role.categories[0])}`);
      return;
    }
    const category = activeCategory && role.categories.includes(activeCategory) ? activeCategory : role.categories[0];
    if (section !== category) router.replace(`/library/modules/leads?view=${encodeURIComponent(category)}`);
  }, [role, section, activeCategory, router]);

  useEffect(() => { setPage(1); }, [query, status, brand, location, activityKind, related, assignee, sourceKind, roleId]);

  const scopedEnquiries = useMemo(() => enquiries.filter(item => role.categories.includes(item.category)), [enquiries, role]);
  const scopedActivities = useMemo(() => activities.filter(item => scopedEnquiries.some(enquiry => enquiry.id === item.enquiryId)), [activities, scopedEnquiries]);

  const visibleEnquiries = useMemo(() => scopedEnquiries.filter(enquiry => {
    const text = `${enquiry.name} ${enquiry.brand} ${enquiry.city} ${enquiry.owner} ${enquiry.id} ${enquiry.mobile} ${enquiry.email}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (!activeCategory || enquiry.category === activeCategory)
      && (status === "All statuses" || enquiry.status === status)
      && (brand === "All brands" || enquiry.brand === brand)
      && (location === "All locations" || enquiry.city === location);
  }), [scopedEnquiries, query, activeCategory, status, brand, location]);

  const visibleActivities = useMemo(() => scopedActivities.filter(activity => {
    const enquiry = scopedEnquiries.find(item => item.id === activity.enquiryId);
    const text = `${activity.title} ${activity.summary} ${enquiry?.name ?? ""} ${enquiry?.id ?? ""} ${activity.createdBy}`.toLowerCase();
    const kindLabel = activity.type === "Other Communication" ? "Notes" : activity.kind === "call" ? "Calls" : activity.kind === "meeting" ? "Meetings" : activity.kind === "email" ? "Emails" : "Follow-ups";
    return text.includes(query.toLowerCase())
      && (activityKind === "All types" || kindLabel === activityKind)
      && (related === "All enquiries" || enquiry?.name === related)
      && (assignee === "All people" || activity.createdBy === assignee)
      && (status === "All statuses" || activity.status === status);
  }), [scopedActivities, scopedEnquiries, query, activityKind, related, assignee, status]);

  const visibleSources = useMemo(() => sources.filter(item => {
    const activeLabel = item.active ? "Active" : "Inactive";
    return `${item.name} ${item.detail}`.toLowerCase().includes(query.toLowerCase())
      && (sourceKind === "All types" || item.kind === sourceKind)
      && (status === "All statuses" || activeLabel === status);
  }), [sources, query, sourceKind, status]);
  const enquiryPage = slicePage(visibleEnquiries, page);
  const activityPage = slicePage(visibleActivities, page);
  const sourcePage = slicePage(visibleSources, page);

  const brandsInView = [...new Set(scopedEnquiries.filter(item => !activeCategory || item.category === activeCategory).map(item => item.brand))];
  const citiesInView = [...new Set(scopedEnquiries.filter(item => !activeCategory || item.category === activeCategory).map(item => item.city))];
  const visiblePool = scopedEnquiries.filter(item => !activeCategory || item.category === activeCategory);
  const selectedIds = selected === "all" ? visibleEnquiries.map(item => item.id) : [...selected].map(String).filter(id => visibleEnquiries.some(item => item.id === id));
  const columnKind = activeCategory ?? (role.categories.length === 1 ? role.categories[0] : "Franchise");
  const tableColumns = columnKind === "Job" ? jobColumns : columnKind === "Brand expansion" ? brandColumns : franchiseColumns;
  const showBrandFilter = tableColumns.some(column => column.id === "brand");
  const leadTotal = sources.reduce((sum, item) => sum + item.leads, 0);
  const convertedTotal = sources.reduce((sum, item) => sum + item.converted, 0);
  function saveEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    const kind = draftCategory;
    const heardAbout = draftHeard;
    const stamp = now();
    const name = value("name");
    const next: Enquiry = {
      id: `ENQ-${2400 + enquiries.length + 1}`,
      category: kind,
      name,
      mobile: value("mobile"),
      email: value("email"),
      city: value("city"),
      state: value("state"),
      address: value("address"),
      brand: kind === "Job" ? value("position") || name : value("brand") || name,
      investment: kind === "Franchise" ? value("budget") || "—" : "—",
      status: "New",
      focus: kind === "Franchise" ? value("brand") || "General franchise enquiry" : kind === "Job" ? value("position") : value("industry"),
      extra: kind === "Franchise"
        ? `${value("enquiryType")} · ${value("budget")} · ${value("timeline")}`
        : kind === "Job"
          ? `${value("qualification")} · ${value("experience")} · ${value("timeline")}`
          : `${value("presence")} · ${value("timeline")}`,
      originalSource: value("originalSource") || "Direct Enquiry",
      heardAbout,
      heardAboutOther: heardAbout === "Other" ? value("heardOther") : "",
      heardAboutBy: heardAbout ? "Customer" : "",
      heardAboutAt: heardAbout ? stamp : "",
      owner: "Unassigned",
      received: stamp,
      salesPipeline: kind !== "Job",
    };
    if (!next.name || !next.mobile || !next.email || !next.address || !next.city || !next.state) return;
    setEnquiries(list => [next, ...list]);
    setAdding(false);
  }

  function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    const enquiryId = value("enquiryId");
    const type = value("type") || activityTypes[0];
    if (!enquiryId || !value("summary")) return;
    const stamp = now();
    const when = [value("whenDate"), value("whenTime")].filter(Boolean).join(", ") || stamp;
    const next: Activity = {
      id: `ACT-${1000 + activities.length + 1}`,
      enquiryId,
      title: value("title") || type,
      kind: kindFor(type),
      status: "Pending",
      due: value("followUp") || stamp,
      type,
      when,
      direction: (value("direction") || "—") as Activity["direction"],
      summary: value("summary"),
      outcome: value("outcome") || "Other",
      followUp: value("followUp"),
      manual: true,
      createdBy: role.name,
      createdAt: stamp,
    };
    setActivities(list => [next, ...list]);
    setLogging(false);
  }

  function saveSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    const next: LeadSource = {
      id: `SRC-${sources.length + 1}`,
      name,
      detail: String(form.get("detail") || "").trim() || "Added from the review library",
      kind: (String(form.get("kind") || "Digital") as SourceKind),
      leads: 0,
      qualified: 0,
      converted: 0,
      active: true,
    };
    setSources(list => [...list, next]);
    setAddingSource(false);
  }

  function sendNote(extra?: { files: { name: string }[]; schedule?: string }) {
    if (!open) return;
    const text = note.trim();
    const files = extra?.files ?? [];
    if (!text && !files.length && !extra?.schedule) return;
    const stamp = now();
    setActivities(list => [{
      id: `ACT-${Date.now()}`,
      enquiryId: open.id,
      title: "Note added",
      kind: "follow-up",
      status: "Completed",
      due: extra?.schedule || stamp,
      type: "Other Communication",
      when: stamp,
      direction: "—",
      summary: text || (files.length ? "Files shared with this note." : "Follow-up scheduled."),
      outcome: "Other",
      followUp: extra?.schedule || "",
      attachments: files.map(file => file.name),
      manual: true,
      createdBy: role.name,
      createdAt: stamp,
    }, ...list]);
    setNote("");
  }

  const leadActivities = open ? activities.filter(activity => activity.enquiryId === open.id) : [];
  const heading = open ? open.id : section === "Activity" ? "Activities" : section === "Sources" ? "Lead Sources" : enquiryTabs.find(tab => tab.id === section)?.label ?? "Enquiries";
  const description = enquiryView
    ? "Manage all incoming enquiries across franchise, brand expansion and jobs."
    : section === "Activity"
      ? "Track calls, meetings, emails, follow-ups and notes."
      : "Manage and track all the channels that bring enquiries into iFranchise.";

  const nav = (
    <nav className="review-navigation ld-side-nav">
      {enquiryTabs.filter(tab => role.categories.includes(tab.id)).map(tab => (
        <Link className="review-overview-link" key={tab.id} href={`/library/modules/leads?view=${encodeURIComponent(tab.id)}`} aria-current={section === tab.id ? "page" : undefined}>{tab.label}</Link>
      ))}
      {role.sections.includes("Activity") && <Link className="review-overview-link ld-side-split" href="/library/modules/leads?view=Activity" aria-current={section === "Activity" ? "page" : undefined}>Activity</Link>}
      {role.sections.includes("Sources") && <Link className="review-overview-link" href="/library/modules/leads?view=Sources" aria-current={section === "Sources" ? "page" : undefined}>Sources</Link>}
    </nav>
  );

  return (
    <DirectionProvider locale="en-US">
      <ReviewShell className="ld-shell" moduleName="Lead Management" icon="user" subtitle="Enquiries, activity & sources" overviewHref="/library/modules/leads?view=Franchise" title={heading} navigation={nav} controls={
        <Dropdown isOpen={roleOpen} onOpenChange={setRoleOpen}>
          <DropdownTrigger className="ld-role" aria-label={`${role.name}, ${role.title}`}>
            <Avatar size="sm" src={portraitFor(role.name)} initials={initials(role.name)} alt="" />
            <span><strong>{"label" in role && role.label ? role.label : shortName(role.name)}</strong><em>{role.title}</em></span>
            <RiArrowDownSLine className="size-4 text-text-tertiary" />
          </DropdownTrigger>
          <DropdownPopover aria-label="Switch role" placement="bottom end" className="w-[280px]">
            {accessRoles.map(item => (
              <DropdownItem key={item.id} selected={item.id === role.id} onSelect={() => { setRoleOpen(false); setRoleId(item.id); }}>
                <Avatar size="sm" src={portraitFor(item.name)} initials={initials(item.name)} alt="" />
                <span className="min-w-0"><span className="block truncate">{"label" in item && item.label ? item.label : shortName(item.name)}</span><span className="block text-caption-1-regular text-text-tertiary">{item.title}</span></span>
              </DropdownItem>
            ))}
          </DropdownPopover>
        </Dropdown>
      }>
        <div className="ld-board flex h-full min-h-0 flex-col gap-5 overflow-hidden p-6 font-sans text-text-primary">
          {open ? (
            <EnquiryDetail
              enquiry={open}
              activities={leadActivities}
              note={note}
              onNote={setNote}
              owners={owners}
              onBack={() => setOpen(null)}
              onSave={patch => {
                setEnquiries(list => list.map(item => item.id === open.id ? { ...item, ...patch } : item));
                setOpen(current => current && current.id === open.id ? { ...current, ...patch } : current);
              }}
              onChangeOwner={() => { setAssignOwner(owners.includes(open.owner) ? open.owner : owners[0]); setAssignIds([open.id]); }}
              onStatus={status => { setStatusChoice(status); setStatusIds([open.id]); }}
              onSchedule={update => {
                if (update.id) {
                  setActivities(list => list.map(item => item.id === update.id ? { ...item, due: update.due, when: update.due, followUp: update.due, meetLink: update.meetLink, status: item.status === "Completed" ? "Scheduled" : item.status } : item));
                  return;
                }
                const stamp = now();
                setActivities(list => [{
                  id: `ACT-${Date.now()}`,
                  enquiryId: open.id,
                  title: "Follow-up call",
                  kind: "follow-up",
                  status: "Scheduled",
                  due: update.due,
                  type: "Phone Call",
                  when: update.due,
                  direction: "Outgoing",
                  summary: "Follow-up scheduled.",
                  outcome: "Follow-up Required",
                  followUp: update.due,
                  meetLink: update.meetLink,
                  manual: true,
                  createdBy: role.name,
                  createdAt: stamp,
                }, ...list]);
              }}
              onSendNote={sendNote}
              actor={role.name}
              onPatchActivity={(id, patch) => setActivities(list => list.map(item => item.id === id ? { ...item, ...patch } : item))}
            />
          ) : (
          <div className="contents">
          <div className="flex shrink-0 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="m-0 flex items-center gap-1 text-title-2-medium text-text-primary">
                {heading}
                {section === "Sources" && (
                  <button type="button" className="ld-info ld-info-down" aria-label="About the source status switch">
                    <RiInformationLine className="size-4" />
                    <span className="ld-info-tip" role="tooltip">The switch turns a source on or off. When it is off, the channel stays in the list and stops receiving new enquiries.</span>
                  </button>
                )}
              </h2>
              <p className="m-0 text-body-regular text-text-secondary">{description}</p>
            </div>
            {enquiryView && <Button leadingIcon={RiAddLine} onClick={() => { setDraftCategory(activeCategory && role.categories.includes(activeCategory) ? activeCategory : role.categories[0]); setDraftCity(""); setDraftState(""); setAdding(true); }}>Add Enquiry</Button>}
            {section === "Activity" && <Button leadingIcon={RiAddLine} onClick={() => setLogging(true)}>Add Activity</Button>}
            {section === "Sources" && <Button leadingIcon={RiAddLine} onClick={() => { setSourceName("Website"); setAddingSource(true); }}>Add Source</Button>}
          </div>

          {enquiryView && (
            <div className="ld-stats shrink-0">
              <Stat icon={RiUser3Line} value={visiblePool.length} label="Total Enquiries" tone="purple" onClick={() => setStatus("All statuses")} />
              <Stat icon={RiStackLine} value={visiblePool.filter(item => item.status === "New").length} label="New" tone="purple" onClick={() => setStatus(current => current === "New" ? "All statuses" : "New")} />
              <Stat icon={RiLoopRightLine} value={visiblePool.filter(item => item.status === "In Progress").length} label="In Progress" tone="yellow" onClick={() => setStatus(current => current === "In Progress" ? "All statuses" : "In Progress")} />
              <Stat icon={RiCheckboxCircleLine} value={visiblePool.filter(item => item.status === "Qualified").length} label="Qualified" tone="green" onClick={() => setStatus(current => current === "Qualified" ? "All statuses" : "Qualified")} />
              <Stat icon={RiFlag2Line} value={visiblePool.filter(item => item.status === "Converted").length} label="Converted" tone="blue" onClick={() => setStatus(current => current === "Converted" ? "All statuses" : "Converted")} />
            </div>
          )}
          {section === "Activity" && (
            <div className="ld-stats shrink-0">
              <Stat icon={RiStackLine} value={scopedActivities.length} label="Total Activities" tone="purple" onClick={() => setActivityKind("All types")} />
              <Stat icon={RiPhoneLine} value={scopedActivities.filter(item => item.kind === "call").length} label="Calls" tone="purple" onClick={() => setActivityKind(current => current === "Calls" ? "All types" : "Calls")} />
              <Stat icon={RiCalendarLine} value={scopedActivities.filter(item => item.kind === "meeting").length} label="Meetings" tone="purple" onClick={() => setActivityKind(current => current === "Meetings" ? "All types" : "Meetings")} />
              <Stat icon={RiMailLine} value={scopedActivities.filter(item => item.kind === "email").length} label="Emails" tone="purple" onClick={() => setActivityKind(current => current === "Emails" ? "All types" : "Emails")} />
              <Stat icon={RiTimeLine} value={scopedActivities.filter(item => item.kind === "follow-up" && item.type !== "Other Communication").length} label="Follow-ups" tone="purple" onClick={() => setActivityKind(current => current === "Follow-ups" ? "All types" : "Follow-ups")} />
            </div>
          )}
          {section === "Sources" && (
            <div className="ld-stats ld-stats-4 shrink-0">
              <Stat icon={RiStackLine} value={sources.length} label="Total Sources" tone="purple" onClick={() => { setStatus("All statuses"); setSourceKind("All types"); }} />
              <Stat icon={RiPlayCircleLine} value={sources.filter(item => item.active).length} label="Active Sources" tone="green" onClick={() => setStatus(current => current === "Active" ? "All statuses" : "Active")} />
              <Stat icon={RiGroupLine} value={leadTotal.toLocaleString("en-IN")} label="Total Leads" tone="purple" onClick={() => setSourceView({ name: "All", rows: sourceLeads })} />
              <Stat icon={RiLineChartLine} value={conversion(convertedTotal, leadTotal)} label="Conversion Rate" tone="green" onClick={() => setRateText(`Conversion rate is converted leads divided by total leads. Across every source that is ${convertedTotal.toLocaleString("en-IN")} converted from ${leadTotal.toLocaleString("en-IN")} leads, which is ${conversion(convertedTotal, leadTotal)}.`) } />
            </div>
          )}

          <Panel>
            <div className="ld-toolbar flex shrink-0 items-center gap-2 border-b border-separator-border p-3">
              <SearchField
                aria-label={`Search ${heading.toLowerCase()}`}
                placeholder={section === "Activity" ? "Search activity, notes or enquiry ID" : section === "Sources" ? "Search source name..." : "Search by name, phone, email or enquiry ID"}
                value={query}
                onChange={setQuery}
                className="min-w-0 flex-1"
              />
              {enquiryView && <>
                <FilterSelect label="Status" value={status} onChange={setStatus} options={["All statuses", "New", "In Progress", "Qualified", "Converted"]} />
                {showBrandFilter && <FilterSelect label="Interested brand" value={brand} onChange={setBrand} options={["All brands", ...brandsInView]} />}
                <FilterSelect label="Location" value={location} onChange={setLocation} options={["All locations", ...citiesInView]} />
              </>}
              {section === "Activity" && <>
                <FilterSelect label="Activity type" value={activityKind} onChange={setActivityKind} options={["All types", "Calls", "Meetings", "Emails", "Follow-ups", "Notes"]} />
                <FilterSelect label="Related enquiry" value={related} onChange={setRelated} options={["All enquiries", ...new Set(scopedEnquiries.map(item => item.name))]} />
                <FilterSelect label="Assigned to" value={assignee} onChange={setAssignee} options={[{ id: "All people", label: "All people" }, ...[...new Set(scopedActivities.map(item => item.createdBy))].map(name => ({ id: name, label: firstName(name) }))]} />
                <FilterSelect label="Status" value={status} onChange={setStatus} options={["All statuses", ...activityStatuses]} />
              </>}
              {section === "Sources" && <>
                <FilterSelect label="Source type" value={sourceKind} onChange={setSourceKind} options={["All types", ...sourceKinds]} />
                <FilterSelect label="Status" value={status} onChange={setStatus} options={["All statuses", "Active", "Inactive"]} />
              </>}
            </div>
            {enquiryView && selectedIds.length > 0 && (
              <div className="ld-bulk">
                <span className="text-body-2-medium">{selectedIds.length} selected</span>
                <Button size="small" variant="secondary" onClick={() => { setStatusChoice(""); setStatusIds(selectedIds); }}>Update status</Button>
                <Button size="small" variant="secondary" onClick={() => { setAssignOwner(owners[0]); setAssignIds(selectedIds); }}>Assign</Button>
                {role.canDelete && <Button size="small" variant="secondary" onClick={() => setPendingDelete({ name: `${selectedIds.length} enquiries`, run: () => { setEnquiries(list => list.filter(item => !selectedIds.includes(item.id))); setActivities(list => list.filter(item => !selectedIds.includes(item.enquiryId))); setSelected(new Set()); } })}>Delete</Button>}
                <Button size="small" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              </div>
            )}

            <div className={section === "Activity" ? "ld-scroll ld-scroll-fit" : "ld-scroll"}>
              {enquiryView && (
                <Table key={role.id} aria-label="Enquiries" selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} onRowAction={key => setOpen(scopedEnquiries.find(enquiry => enquiry.id === String(key)) || null)}>
                  <TableHeader columns={tableColumns}>
                    {(column: Column) => (
                      <TableColumn isRowHeader={column.isRowHeader}>
                        {column.id === "select" ? <Checkbox slot="selection" aria-label="Select all enquiries" /> : column.name}
                      </TableColumn>
                    )}
                  </TableHeader>
                  <TableBody items={enquiryPage.rows}>
                    {enquiry => (
                      <TableRow columns={tableColumns} className="cursor-pointer outline-none">
                        {(column: Column) => (
                          <TableCell>
                            {column.id === "select" && <Checkbox slot="selection" aria-label={`Select ${enquiry.name}`} />}
                            {column.id === "person" && <Person name={enquiry.name} meta={enquiry.id} />}
                            {column.id === "brand" && enquiry.brand}
                            {column.id === "industry" && enquiry.focus}
                            {column.id === "position" && enquiry.focus}
                            {column.id === "presence" && enquiry.extra}
                            {column.id === "profile" && enquiry.extra}
                            {column.id === "location" && <span className="inline-flex items-center gap-1 text-text-secondary"><RiMapPin2Line className="size-4 text-text-tertiary" />{enquiry.city}</span>}
                            {column.id === "investment" && enquiry.investment}
                            {column.id === "owner" && <Assignee name={enquiry.owner} />}
                            {column.id === "status" && (
                              <button type="button" className="ld-status-button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setStatusChoice(""); setStatusIds([enquiry.id]); }}>
                                <StatusPill status={enquiry.status} />
                              </button>
                            )}
                            {column.id === "created" && enquiry.received}
                            {column.id === "actions" && (
                              <EnquiryActions
                                label={enquiry.name}
                                canDelete={role.canDelete}
                                onView={() => setOpen(enquiry)}
                                onEdit={() => setEditing(enquiry)}
                                onAssign={() => { setAssignOwner(enquiry.owner); setAssignIds([enquiry.id]); }}
                                onStatus={() => { setStatusChoice(""); setStatusIds([enquiry.id]); }}
                                onDelete={() => setPendingDelete({ name: enquiry.name, run: () => { setEnquiries(list => list.filter(item => item.id !== enquiry.id)); setActivities(list => list.filter(item => item.enquiryId !== enquiry.id)); setOpen(current => current?.id === enquiry.id ? null : current); } })}
                              />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {section === "Activity" && (
                <Table key={role.id} aria-label="Activities" className="ld-activity-table" containerClassName="ld-fit-table" onRowAction={key => {
                  const activity = activities.find(item => item.id === String(key));
                  const enquiry = enquiries.find(item => item.id === activity?.enquiryId);
                  if (enquiry) setOpen(enquiry);
                }}>
                  <TableHeader columns={activityColumns}>{(column: Column) => <TableColumn isRowHeader={column.isRowHeader}>{column.name}</TableColumn>}</TableHeader>
                  <TableBody items={activityPage.rows}>
                    {activity => {
                      const enquiry = enquiries.find(item => item.id === activity.enquiryId);
                      const mark = activityMark(activity);
                      return (
                        <TableRow columns={activityColumns} className="cursor-pointer outline-none">
                          {(column: Column) => (
                            <TableCell>
                              {column.id === "activity" && (
                                <span className="ld-activity-cell">
                                  <span className={`ld-activity-icon ld-activity-${mark.tone}`}><mark.icon /></span>
                                  <span className="truncate text-body-2-medium">{activity.title}</span>
                                </span>
                              )}
                              {column.id === "enquiry" && enquiry && <Person name={enquiry.name} meta={`${enquiry.id} · ${enquiry.category}`} />}
                              {column.id === "owner" && <Assignee name={activity.createdBy} />}
                              {column.id === "due" && <span className="ld-due">{activity.due ? <><RiCalendarLine />{activity.due}</> : "—"}</span>}
                              {column.id === "status" && <StatusPill status={activity.status} />}
                              {column.id === "actions" && enquiry && (
                                <EnquiryActions
                                  label={activity.title}
                                  canDelete={role.canDelete}
                                  onView={() => setOpen(enquiry)}
                                  onEdit={() => setLogging(true)}
                                  onDelete={() => setPendingDelete({ name: activity.title, run: () => setActivities(list => list.filter(item => item.id !== activity.id)) })}
                                />
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    }}
                  </TableBody>
                </Table>
              )}

              {section === "Sources" && (
                <Table key={role.id} aria-label="Lead sources" onRowAction={key => {
                  const item = sources.find(source => source.id === String(key));
                  if (item) setSourceView({ name: item.name, rows: sourceLeads.filter(lead => lead.source === item.name) });
                }}>
                  <TableHeader columns={sourceColumns}>{(column: Column) => <TableColumn isRowHeader={column.isRowHeader}>{column.name}</TableColumn>}</TableHeader>
                  <TableBody items={sourcePage.rows}>
                    {item => (
                        <TableRow columns={sourceColumns} className="cursor-pointer outline-none">
                          {(column: Column) => (
                            <TableCell>
                              {column.id === "source" && (
                                <span className="ld-source-open">
                                  <SourceMark name={item.name} />
                                  <span>
                                    <span className="block text-body-2-medium">{item.name}</span>
                                    <span className="block text-caption-1-regular text-text-tertiary">{item.detail}</span>
                                  </span>
                                </span>
                              )}
                              {column.id === "kind" && <Chip variant="caption" color={kindColor[item.kind]} className="rounded-full px-2">{item.kind}</Chip>}
                              {column.id === "leads" && <button type="button" className="ld-figure" onClick={() => setSourceView({ name: item.name, rows: sourceLeads.filter(lead => lead.source === item.name) })}>{item.leads.toLocaleString("en-IN")}</button>}
                              {column.id === "qualified" && <button type="button" className="ld-figure" onClick={() => setSourceView({ name: item.name, rows: sourceLeads.filter(lead => lead.source === item.name) })}>{item.qualified.toLocaleString("en-IN")}</button>}
                              {column.id === "converted" && <button type="button" className="ld-figure" onClick={() => setSourceView({ name: item.name, rows: sourceLeads.filter(lead => lead.source === item.name) })}>{item.converted.toLocaleString("en-IN")}</button>}
                              {column.id === "rate" && <button type="button" className="ld-figure font-medium text-[#1f7a45]" onClick={() => setRateText(`${item.name} converts ${item.converted.toLocaleString("en-IN")} of ${item.leads.toLocaleString("en-IN")} leads. Conversion rate is converted leads divided by total leads, which is ${conversion(item.converted, item.leads)}.`)}>{conversion(item.converted, item.leads)}</button>}
                              {column.id === "status" && (
                                <button type="button" className="ld-switch" role="switch" aria-checked={item.active} aria-label={`${item.active ? "Deactivate" : "Activate"} ${item.name}`} onClick={() => setSources(list => list.map(source => source.id === item.id ? { ...source, active: !source.active } : source))} />
                              )}
                              {column.id === "actions" && <EnquiryActions label={item.name} canDelete={role.canDelete} onDelete={() => setPendingDelete({ name: item.name, run: () => setSources(list => list.filter(source => source.id !== item.id)) })} />}
                            </TableCell>
                          )}
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {enquiryView && !visibleEnquiries.length && <Empty title="No enquiries found" detail="Try another name, status, brand or city." />}
              {section === "Activity" && !visibleActivities.length && <Empty title="No activity found" detail="Try another enquiry, person or status." />}
              {section === "Sources" && !visibleSources.length && <Empty title="No sources found" detail="Try another name, type or status." />}
            </div>
            {enquiryView && visibleEnquiries.length > 0 && <Pager page={enquiryPage.current} pages={enquiryPage.pages} onPage={setPage} label={`Showing ${enquiryPage.start}–${enquiryPage.end} of ${visibleEnquiries.length} enquiries`} />}
            {section === "Activity" && visibleActivities.length > 0 && <Pager page={activityPage.current} pages={activityPage.pages} onPage={setPage} label={`Showing ${activityPage.start}–${activityPage.end} of ${visibleActivities.length} activities`} />}
            {section === "Sources" && visibleSources.length > 0 && <Pager page={sourcePage.current} pages={sourcePage.pages} onPage={setPage} label={`Showing ${sourcePage.start}–${sourcePage.end} of ${visibleSources.length} sources`} />}
          </Panel>
          </div>
          )}
        </div>

        {adding && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setAdding(false); }} size="lg">
            <ModalHeader title="Add enquiry" description="Franchise, brand expansion and job enquiries stay in one list. A job enquiry does not enter the sales pipeline." />
            <ModalBody>
              <form id="enquiry-form" className="grid grid-cols-6 gap-3" onSubmit={saveEnquiry}>
                <Input className="col-span-3" label={draftCategory === "Brand expansion" ? "Brand name" : "Full name"} name="name" isRequired />
                <div className="col-span-3"><PhoneField /></div>
                <Input className="col-span-3" label="Email" name="email" type="email" isRequired />
                <div className="col-span-3">
                  <LeadSelect aria-label="Start timeline" label="Start timeline" name="timeline" isRequired defaultSelectedKey={timelines[1]}>{timelines.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                </div>
                <Input className="col-span-3" label="Address" name="address" isRequired />
                <LeadSelect className="col-span-3" aria-label="Original lead source" label="Original lead source" name="originalSource" isRequired defaultSelectedKey="Website">{originalSources.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                <div className="col-span-3"><SuggestField label="State" name="state" value={draftState} options={stateOptions} onChange={setDraftState} /></div>
                <div className="col-span-3"><SuggestField label="City" name="city" value={draftCity} options={cityOptions} onChange={city => { setDraftCity(city); const state = stateForCity(city); if (state) setDraftState(state); }} /></div>
                {draftCategory === "Franchise" && <>
                  <LeadSelect className="col-span-3" aria-label="Interested brand" label="Interested brand" name="brand" isRequired defaultSelectedKey="Brew Theory">{brands.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  <LeadSelect className="col-span-3" aria-label="Investment budget" label="Investment budget" name="budget" isRequired defaultSelectedKey={budgetRanges[3]}>{budgetRanges.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                </>}
                {draftCategory === "Brand expansion" && <>
                  <Input className="col-span-3" label="Industry" name="industry" isRequired />
                  <Input className="col-span-3" label="Current presence" name="presence" isRequired />
                </>}
                {draftCategory === "Job" && <>
                  <Input className="col-span-3" label="Applied position" name="position" isRequired />
                  <Input className="col-span-3" label="Qualification" name="qualification" isRequired />
                </>}
                {draftCategory === "Franchise" && <LeadSelect className="col-span-3" aria-label="Enquiry type" label="Enquiry type" name="enquiryType" isRequired defaultSelectedKey="Specific brand">{["Specific brand", "General franchise enquiry"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>}
                {draftCategory === "Job" && <LeadSelect className="col-span-3" aria-label="Experience" label="Experience" name="experience" isRequired defaultSelectedKey="Fresher">{["Fresher", "Experienced"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>}
                {draftCategory === "Brand expansion" && <Input className="col-span-3" label="Website" name="website" isRequired />}
                <LeadSelect className="col-span-3" aria-label="Category" label="Category" isRequired selectedKey={draftCategory} onSelectionChange={key => setDraftCategory(String(key) as Category)}>
                  {categories.filter(item => role.categories.includes(item)).map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                </LeadSelect>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
              <Button type="submit" form="enquiry-form">Save enquiry</Button>
            </ModalFooter>
          </Modal>
        )}

        {logging && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setLogging(false); }} size="lg">
            <ModalHeader title="Add activity" description="A conversation logged here stays marked as manually recorded." />
            <ModalBody>
              <form id="activity-form" className="grid grid-cols-2 gap-3" onSubmit={saveActivity}>
                <LeadSelect aria-label="Enquiry" label="Enquiry" name="enquiryId" isRequired defaultSelectedKey={open?.id || scopedEnquiries[0]?.id}>
                  {scopedEnquiries.map(enquiry => <SelectItem key={enquiry.id} id={enquiry.id}>{enquiry.name}</SelectItem>)}
                </LeadSelect>
                <Input label="Title" name="title" placeholder="Follow-up call" isRequired />
                <LeadSelect aria-label="Activity type" label="Activity type" name="type" isRequired defaultSelectedKey={activityTypes[0]}>{activityTypes.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                <LeadSelect aria-label="Outcome" label="Outcome" name="outcome" isRequired defaultSelectedKey={outcomes[0]}>{outcomes.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                <div className="ld-when">
                  <span className="ld-field-label">When it happened</span>
                  <div className="ld-when-row">
                    <DateField name="whenDate" defaultValue={new Date(2026, 10, 12)} />
                    <LeadSelect aria-label="Time" name="whenTime" defaultSelectedKey="4:00 PM" className="w-[132px] shrink-0" triggerClassName="h-10 shadow-none">{leadTimes.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  </div>
                </div>
                <div className="ld-when">
                  <span className="ld-field-label">Due date</span>
                  <DateField name="followUp" defaultValue={new Date(2026, 10, 14)} />
                </div>
                <Textarea className="col-span-2" label="Discussion summary" name="summary" isRequired />
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setLogging(false)}>Cancel</Button>
              <Button type="submit" form="activity-form">Save activity</Button>
            </ModalFooter>
          </Modal>
        )}

        {addingSource && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setAddingSource(false); }} size="md">
            <ModalHeader title="Add source" description="Channels that bring enquiries into iFranchise." />
            <ModalBody>
              <form id="source-form" className="grid grid-cols-2 gap-3" onSubmit={saveSource}>
                <LeadSelect aria-label="Source name" label="Source name" name="name" selectedKey={sourceName} onSelectionChange={key => setSourceName(String(key))}>
                  {["Website", "Google Ads", "Meta Ads", "Facebook", "Instagram", "WhatsApp", "LinkedIn", "Referral", "Walk-in", "Email", "Phone"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                </LeadSelect>
                <LeadSelect key={sourceName} aria-label="Source type" label="Source type" name="kind" defaultSelectedKey={sourceName === "Referral" ? "Partner" : sourceName === "Walk-in" || sourceName === "Phone" ? "Offline" : "Digital"}>{sourceKinds.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                <Input className="col-span-2" label="Description" name="detail" />
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setAddingSource(false)}>Cancel</Button>
              <Button type="submit" form="source-form">Save source</Button>
            </ModalFooter>
          </Modal>
        )}

        {pendingDelete && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setPendingDelete(null); }} size="sm">
            <ModalHeader title="Delete this record?" description={`${pendingDelete.name} will be removed from this review list.`} />
            <ModalFooter>
              <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
              <Button className="ld-confirm-delete" onClick={() => { pendingDelete.run(); setPendingDelete(null); }}>Delete</Button>
            </ModalFooter>
          </Modal>
        )}

        {editing && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setEditing(null); }} size="md">
            <ModalHeader title="Edit enquiry" description={`${editing.category} · ${editing.id}`} />
            <ModalBody>
              <form id="edit-form" className="grid grid-cols-2 gap-3" onSubmit={event => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const value = (name: string) => String(form.get(name) || "").trim();
                const status = enquiryStatuses.includes(value("status") as EnquiryStatus) ? value("status") as EnquiryStatus : editing.status;
                const patch = {
                  name: value("name") || editing.name,
                  mobile: value("mobile") || editing.mobile,
                  email: value("email"),
                  city: value("city") || editing.city,
                  state: value("state") || editing.state,
                  address: value("address") || editing.address,
                  brand: value("brand") || editing.brand,
                  investment: value("investment") || editing.investment,
                  focus: value("focus") || (value("brand") || editing.focus),
                  extra: value("extra") || editing.extra,
                  originalSource: value("originalSource") || editing.originalSource,
                  status,
                  owner: value("owner") || editing.owner,
                };
                setEnquiries(list => list.map(item => item.id === editing.id ? { ...item, ...patch } : item));
                setOpen(current => current && current.id === editing.id ? { ...current, ...patch } : current);
                setEditing(null);
              }}>
                <Input className="col-span-2" label={editing.category === "Brand expansion" ? "Brand name" : "Full name"} name="name" defaultValue={editing.name} isRequired />
                <Input label="Mobile" name="mobile" defaultValue={editing.mobile} />
                <Input label="Email" name="email" type="email" defaultValue={editing.email} />
                <Input label="City" name="city" defaultValue={editing.city} isRequired />
                <Input label="State" name="state" defaultValue={editing.state} isRequired />
                <Input className="col-span-2" label="Address" name="address" defaultValue={editing.address} isRequired />
                {editing.category === "Job" ? (
                  <Input className="col-span-2" label="Applied position" name="focus" defaultValue={editing.focus} />
                ) : (
                  <Input label="Interested brand" name="brand" defaultValue={editing.brand} />
                )}
                {editing.category === "Job" ? (
                  <Input className="col-span-2" label="Profile" name="extra" defaultValue={editing.extra} />
                ) : editing.category === "Brand expansion" ? (
                  <>
                    <Input label="Investment" name="investment" defaultValue={editing.investment} />
                    <Input className="col-span-2" label="Current presence" name="extra" defaultValue={editing.extra} />
                  </>
                ) : (
                  <Input label="Investment" name="investment" defaultValue={editing.investment} />
                )}
                <LeadSelect aria-label="Original lead source" label="Original lead source" name="originalSource" defaultSelectedKey={originalSources.includes(editing.originalSource as (typeof originalSources)[number]) ? editing.originalSource : originalSources[0]}>{originalSources.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                <LeadSelect aria-label="Status" label="Status" name="status" defaultSelectedKey={editing.status}>{enquiryStatuses.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                <LeadSelect className="col-span-2" aria-label="Assigned to" label="Assigned to" name="owner" defaultSelectedKey={owners.includes(editing.owner) ? editing.owner : owners[0]}>{owners.map(item => <SelectItem key={item} id={item}>{firstName(item)}</SelectItem>)}</LeadSelect>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" form="edit-form">Save</Button>
            </ModalFooter>
          </Modal>
        )}

        {assignIds && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setAssignIds(null); }} size="sm">
            <ModalHeader title="Assign owner" description={assignIds.length === 1 ? "Choose who should own this enquiry." : `Choose an owner for ${assignIds.length} enquiries.`} />
            <ModalBody>
              <LeadSelect aria-label="Owner" label="Owner" selectedKey={assignOwner} onSelectionChange={key => setAssignOwner(String(key))}>
                {owners.map(item => <SelectItem key={item} id={item}>{firstName(item)}</SelectItem>)}
              </LeadSelect>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setAssignIds(null)}>Cancel</Button>
              <Button onClick={() => { setEnquiries(list => list.map(item => assignIds.includes(item.id) ? { ...item, owner: assignOwner } : item)); setOpen(current => current && assignIds.includes(current.id) ? { ...current, owner: assignOwner } : current); setAssignIds(null); setSelected(new Set()); }}>Assign</Button>
            </ModalFooter>
          </Modal>
        )}

        {statusIds && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setStatusIds(null); }} size="sm">
            <ModalHeader title="Update status" description="Choose the new status, then confirm the change." />
            <ModalBody>
              <div className="flex flex-wrap gap-2">
                {enquiryStatuses.map(item => <button key={item} type="button" className="ld-status-button" onClick={() => setStatusChoice(item)}><StatusPill status={item} /></button>)}
              </div>
              {statusChoice && <p className="mt-3 text-body-regular text-text-secondary">Change {statusIds.length === 1 ? "this enquiry" : `${statusIds.length} enquiries`} to {statusChoice}?</p>}
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setStatusIds(null)}>Cancel</Button>
              <Button disabled={!statusChoice} onClick={() => { if (!statusChoice) return; setEnquiries(list => list.map(item => statusIds.includes(item.id) ? { ...item, status: statusChoice } : item)); setOpen(current => current && statusIds.includes(current.id) ? { ...current, status: statusChoice } : current); setStatusIds(null); setSelected(new Set()); }}>Confirm</Button>
            </ModalFooter>
          </Modal>
        )}

        {sourceView && <SourceLeadsPanel name={sourceView.name} rows={sourceView.rows.filter(row => role.categories.includes(row.category))} categories={role.categories} mark={<SourceMark name={sourceView.name} />} onClose={() => setSourceView(null)} onOpenLead={row => {
          const existing = enquiries.find(item => item.id === row.code) ?? enquiries.find(item => item.name === row.name && item.originalSource === row.source);
          setSourceView(null);
          if (existing && role.categories.includes(existing.category)) setOpen(existing);
        }} />}

        {rateText && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setRateText(null); }} size="sm">
            <ModalHeader title="Conversion rate" description="Converted leads divided by total leads." />
            <ModalBody><p className="text-body-regular text-text-secondary">{rateText}</p></ModalBody>
            <ModalFooter><Button variant="secondary" onClick={() => setRateText(null)}>Close</Button></ModalFooter>
          </Modal>
        )}
      </ReviewShell>
    </DirectionProvider>
  );
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-16 text-center"><h3 className="text-headline-medium text-text-primary">{title}</h3><p className="text-body-regular text-text-secondary">{detail}</p></div>;
}
