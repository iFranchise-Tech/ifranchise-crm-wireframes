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
  RiBuilding4Line,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiFlag2Line,
  RiFilter3Line,
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
  RiLayoutColumnLine,
  RiBarChartBoxLine,
  RiStarLine,
  RiStarFill,
  RiStackLine,
  RiStickyNoteLine,
  RiStore2Line,
  RiTimeLine,
  RiUser3Line,
  RiWhatsappLine,
  type RemixiconComponentType,
} from "@remixicon/react";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { ColumnManagerModal } from "@/modules/screen-library/components/column-manager-modal";
import { AdvancedLeadFilters } from "./advanced-lead-filters";
import type { LeadAdvancedFilters, LeadFilterField } from "./advanced-lead-filters";
import { activeCrmProfiles, readActiveCrmRole, readTableColumns, saveActiveCrmRole, saveOrganizationTableColumns, savePersonalTableColumns } from "@/modules/screen-library/lib/table-columns";
import { portalBrands } from "@/modules/brands/types";
import { portraitFor } from "@/modules/users-roles/portrait";
import { initialUsers } from "@/modules/users-roles/data";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { IconButton } from "@/components/base/buttons/icon-button";
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
const activeBrandNames = portalBrands.map(item => item.name);
const categoryViews = ["Franchise", "Brand expansion"] as const;
type Section = (typeof navItems)[number] | (typeof categoryViews)[number];
type Column = { id: string; name: string; isRowHeader?: boolean };

const selectColumn: Column = { id: "select", name: "" };
const favouriteColumn: Column = { id: "favourite", name: "Favourite" };
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
const franchiseAvailableColumns: Column[] = [
  { id: "person", name: "Enquiry", isRowHeader: true }, { id: "brand", name: "Interested Brand" }, { id: "location", name: "Location" }, { id: "investment", name: "Investment Capacity" }, { id: "owner", name: "Assigned To" }, { id: "status", name: "Status" }, { id: "created", name: "Created On" },
  { id: "phone", name: "Mobile Number" }, { id: "email", name: "Email Address" }, { id: "state", name: "State" }, { id: "leadSource", name: "Lead Source" }, { id: "enquiryType", name: "Enquiry Type" }, { id: "timeline", name: "Start Timeline" }, { id: "preferredLocation", name: "Preferred Location" }, { id: "campaign", name: "Campaign" },
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
const brandAvailableColumns: Column[] = [
  { id: "person", name: "Enquiry", isRowHeader: true }, { id: "industry", name: "Industry" }, { id: "location", name: "Location" }, { id: "presence", name: "Presence" }, { id: "owner", name: "Assigned To" }, { id: "status", name: "Status" }, { id: "created", name: "Created On" },
  { id: "contactPerson", name: "Contact Person" }, { id: "phone", name: "Mobile Number" }, { id: "email", name: "Email Address" }, { id: "state", name: "Headquarters State" }, { id: "website", name: "Website" }, { id: "leadSource", name: "Lead Source" }, { id: "campaign", name: "Campaign" },
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
];

const salesCategories = ["Franchise", "Brand expansion"] as Category[];
const leadSections = ["Enquiries", "Activity", "Sources"] as const;
const crmSources = initialSources.map(source => {
  const rows = sourceLeads.filter(lead => lead.source === source.name && lead.category !== "Job");
  return {
    ...source,
    leads: rows.length,
    qualified: rows.filter(lead => lead.status === "Qualified" || lead.status === "Converted").length,
    converted: rows.filter(lead => lead.status === "Converted").length,
  };
});
const accessRoles = activeCrmProfiles.map(profile => ({
  ...profile,
  categories: salesCategories,
  sections: leadSections,
  canDelete: profile.title === "Superadmin" || profile.title === "Admin",
}));
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
    <LeadSelect aria-label={label} selectedKey={value} onSelectionChange={key => onChange(String(key))} className={cx("ld-toolbar-select shrink-0", width)} triggerClassName="w-full shadow-none">
      {items.map(option => <SelectItem key={option.id} id={option.id}>{option.label}</SelectItem>)}
    </LeadSelect>
  );
}

function advancedFieldValue(enquiry: Enquiry, field: string): string {
  const values: Record<string, string | undefined> = {
    person: enquiry.name,
    name: enquiry.name,
    id: enquiry.id,
    brand: enquiry.brand,
    contactPerson: enquiry.contactPerson || enquiry.name,
    industry: enquiry.industry || enquiry.focus,
    position: enquiry.focus,
    presence: enquiry.presence || enquiry.extra,
    profile: enquiry.extra,
    location: enquiry.city,
    city: enquiry.city,
    state: enquiry.state,
    phone: enquiry.mobile,
    email: enquiry.email,
    leadSource: enquiry.originalSource,
    enquiryType: enquiry.enquiryType || enquiry.category,
    timeline: enquiry.timeline,
    preferredLocation: enquiry.preferredLocation || enquiry.address,
    campaign: enquiry.campaign,
    website: enquiry.website,
    qualification: enquiry.focus,
    experience: enquiry.experience,
    noticePeriod: enquiry.noticePeriod,
    resume: enquiry.resume,
    coverLetter: enquiry.coverLetter,
    portfolio: enquiry.portfolio,
    investment: enquiry.investment,
    owner: enquiry.owner,
    status: enquiry.status,
    created: enquiry.received,
  };
  return values[field] ?? "";
}

function matchesLeadCriteria(enquiry: Enquiry, filters: LeadAdvancedFilters, fields: LeadFilterField[]) {
  const fieldRules = filters.rules.filter(rule => rule.value || ["is empty", "is not empty"].includes(rule.operator));
  const ruleMatches = fieldRules.map(rule => {
    const actual = advancedFieldValue(enquiry, rule.field);
    const expected = rule.value;
    const left = actual.toLocaleLowerCase();
    const right = expected.toLocaleLowerCase();
    const field = fields.find(item => item.id === rule.field);
    if (rule.operator === "is empty") return !actual.trim();
    if (rule.operator === "is not empty") return Boolean(actual.trim());
    if (field?.type === "date") {
      const actualDate = new Date(actual);
      const expectedDate = new Date(`${expected}T00:00:00`);
      if (Number.isNaN(actualDate.getTime()) || Number.isNaN(expectedDate.getTime())) return false;
      if (rule.operator === "before") return actualDate < expectedDate;
      if (rule.operator === "after") return actualDate > expectedDate;
      return actualDate.toDateString() === expectedDate.toDateString();
    }
    switch (rule.operator) {
      case "is": return left === right;
      case "is not": return left !== right;
      case "does not contain": return !left.includes(right);
      case "starts with": return left.startsWith(right);
      default: return left.includes(right);
    }
  });
  return !ruleMatches.length || ruleMatches.every(Boolean);
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
  const [sources, setSources] = useState(crmSources);
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
  const [draftEnquiryType, setDraftEnquiryType] = useState("Specific brand");
  const [draftCity, setDraftCity] = useState("");
  const [draftState, setDraftState] = useState("");
  const [sourceName, setSourceName] = useState("Website");
  const [draftHeard, setDraftHeard] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ name: string; run: () => void } | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<LeadAdvancedFilters | null>(null);
  const [columnIds, setColumnIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showOverview, setShowOverview] = useState(false);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [favourites, setFavourites] = useState<{ profile: string; ids: string[] }>({ profile: "", ids: [] });
  const favouriteIds = useMemo(() => new Set(favourites.profile === roleId ? favourites.ids : []), [favourites, roleId]);

  useEffect(() => {
    let ids: string[] = [];
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem(`ifranchise:lead-favourites:${roleId}`) ?? "[]");
      if (Array.isArray(stored)) ids = [...new Set(stored.filter((id): id is string => typeof id === "string"))];
    } catch { /* Ignore outdated or unavailable browser preferences. */ }
    setFavourites({ profile: roleId, ids });
  }, [roleId]);

  useEffect(() => {
    if (favourites.profile !== roleId) return;
    try {
      window.localStorage.setItem(`ifranchise:lead-favourites:${roleId}`, JSON.stringify(favourites.ids));
    } catch { /* Keep favourites available in this session when storage is unavailable. */ }
  }, [favourites, roleId]);

  function toggleFavourite(id: string) {
    setFavourites(current => {
      const ids = new Set(current.profile === roleId ? current.ids : []);
      if (ids.has(id)) ids.delete(id); else ids.add(id);
      return { profile: roleId, ids: [...ids] };
    });
  }

  useEffect(() => {
    const activeProfile = readActiveCrmRole();
    if (accessRoles.some(item => item.id === activeProfile.id)) setRoleId(activeProfile.id);
  }, []);

  useEffect(() => {
    setQuery("");
    setShowOverview(false);
    setFavouritesOnly(false);
    setStatus("All statuses");
    setBrand("All brands");
    setLocation("All locations");
    setActivityKind("All types");
    setRelated("All enquiries");
    setAssignee("All people");
    setSourceKind("All types");
    setAdvancedFilters(null);
    setAdvancedFiltersOpen(false);
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

  useEffect(() => { setPage(1); }, [query, status, brand, location, activityKind, related, assignee, sourceKind, roleId, favouritesOnly]);

  const scopedEnquiries = useMemo(() => enquiries.filter(item => item.category !== "Job" && role.categories.includes(item.category)), [enquiries, role]);
  const scopedActivities = useMemo(() => activities.filter(item => scopedEnquiries.some(enquiry => enquiry.id === item.enquiryId)), [activities, scopedEnquiries]);

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
  const activityPage = slicePage(visibleActivities, page);
  const sourcePage = slicePage(visibleSources, page);

  const brandsInView = [...new Set(scopedEnquiries.filter(item => !activeCategory || item.category === activeCategory).map(item => item.brand))];
  const citiesInView = [...new Set(scopedEnquiries.filter(item => !activeCategory || item.category === activeCategory).map(item => item.city))];
  const visiblePool = scopedEnquiries.filter(item => !activeCategory || item.category === activeCategory);
  const columnKind = activeCategory ?? (role.categories.length === 1 ? role.categories[0] : "Franchise");
  const enquiryColumns = columnKind === "Brand expansion" ? brandColumns : franchiseColumns;
  const baseColumns = enquiryView ? enquiryColumns : section === "Activity" ? activityColumns : sourceColumns;
  const availableColumnDefs = enquiryView
    ? columnKind === "Brand expansion" ? brandAvailableColumns : franchiseAvailableColumns
    : (section === "Activity" ? activityColumns : sourceColumns).filter(column => column.id !== "actions");
  const configurableColumnDefs = availableColumnDefs.filter(column => column.id !== "select" && column.id !== "actions");
  const advancedFilterFields = useMemo<LeadFilterField[]>(() => {
    const selectOptions: Record<string, string[]> = {
      brand: [...new Set(scopedEnquiries.map(item => item.brand).filter((value): value is string => Boolean(value)))],
      city: [...new Set(scopedEnquiries.map(item => item.city).filter((value): value is string => Boolean(value)))],
      location: [...new Set(scopedEnquiries.map(item => item.city).filter((value): value is string => Boolean(value)))],
      state: [...new Set(scopedEnquiries.map(item => item.state).filter((value): value is string => Boolean(value)))],
      owner: [...new Set(scopedEnquiries.map(item => item.owner).filter((value): value is string => Boolean(value)))],
      status: [...new Set(scopedEnquiries.map(item => item.status))],
      leadSource: [...new Set(scopedEnquiries.map(item => item.originalSource).filter((value): value is string => Boolean(value)))],
      enquiryType: [...new Set(scopedEnquiries.map(item => item.enquiryType || item.category).filter((value): value is string => Boolean(value)))],
      investment: [...new Set(scopedEnquiries.map(item => item.investment).filter((value): value is string => Boolean(value)))],
      timeline: [...new Set(scopedEnquiries.map(item => item.timeline).filter((value): value is string => Boolean(value)))],
      experience: [...new Set(scopedEnquiries.map(item => item.experience).filter((value): value is string => Boolean(value)))],
      noticePeriod: [...new Set(scopedEnquiries.map(item => item.noticePeriod).filter((value): value is string => Boolean(value)))],
    };
    const selectFields = new Set(Object.keys(selectOptions));
    return [
      { id: "id", name: "Enquiry ID", type: "text" },
      ...configurableColumnDefs.map(column => ({
        id: column.id,
        name: column.name,
        type: column.id === "created" ? "date" as const : selectFields.has(column.id) ? "select" as const : "text" as const,
        options: selectOptions[column.id],
      })),
    ];
  }, [configurableColumnDefs, scopedEnquiries]);
  const matchingEnquiryPool = useMemo(() => scopedEnquiries.filter(enquiry => {
    const text = `${enquiry.name} ${enquiry.brand} ${enquiry.city} ${enquiry.owner} ${enquiry.id} ${enquiry.mobile} ${enquiry.email}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (!activeCategory || enquiry.category === activeCategory)
      && (!favouritesOnly || favouriteIds.has(enquiry.id))
      && (status === "All statuses" || enquiry.status === status)
      && (brand === "All brands" || enquiry.brand === brand)
      && (location === "All locations" || enquiry.city === location);
  }), [scopedEnquiries, query, activeCategory, status, brand, location, favouritesOnly, favouriteIds]);
  const visibleEnquiries = useMemo(() => matchingEnquiryPool.filter(enquiry => !advancedFilters || matchesLeadCriteria(enquiry, advancedFilters, advancedFilterFields)), [matchingEnquiryPool, advancedFilters, advancedFilterFields]);
  const enquiryPage = slicePage(visibleEnquiries, page);
  const selectedIds = selected === "all" ? visibleEnquiries.map(item => item.id) : [...selected].map(String).filter(id => visibleEnquiries.some(item => item.id === id));
  const advancedFilterCount = advancedFilters ? advancedFilters.rules.filter(rule => rule.value || ["is empty", "is not empty"].includes(rule.operator)).length : 0;
  const defaultColumnIds = baseColumns.filter(column => column.id !== "select" && column.id !== "actions").map(column => column.id);
  const requiredColumnId = enquiryView ? "person" : section === "Activity" ? "activity" : "source";
  const columnScope = `leads:${section}`;
  useEffect(() => {
    setColumnIds(readTableColumns(columnScope, role.id, configurableColumnDefs, [requiredColumnId], defaultColumnIds));
  // The category view defines the set of available fields; role changes select a separate personal layout.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnScope, role.id]);
  const visibleColumnIds = columnIds.length ? columnIds.filter(id => configurableColumnDefs.some(column => column.id === id)) : defaultColumnIds;
  const tableColumns: Column[] = [selectColumn, favouriteColumn, ...visibleColumnIds.map(id => configurableColumnDefs.find(column => column.id === id)).filter((column): column is Column => Boolean(column)), actionsColumn];
  const dataColumns: Column[] = [...visibleColumnIds.map(id => configurableColumnDefs.find(column => column.id === id)).filter((column): column is Column => Boolean(column)), actionsColumn];
  const showBrandFilter = configurableColumnDefs.some(column => column.id === "brand");
  const favouritesCount = visiblePool.filter(item => favouriteIds.has(item.id)).length;
  const leadTotal = sources.reduce((sum, item) => sum + item.leads, 0);
  const convertedTotal = sources.reduce((sum, item) => sum + item.converted, 0);
  function saveColumns(ids: string[], organizationDefault: boolean) {
    const normalized = [...new Set([requiredColumnId, ...ids.filter(id => configurableColumnDefs.some(column => column.id === id))])];
    setColumnIds(normalized);
    savePersonalTableColumns(columnScope, role.id, normalized);
    if (organizationDefault && role.title === "Superadmin") saveOrganizationTableColumns(columnScope, normalized);
    setColumnManagerOpen(false);
  }
  function exportSelectedEnquiries(ids: string[]) {
    const rows = scopedEnquiries.filter(enquiry => ids.includes(enquiry.id));
    const headers = ["Enquiry ID", "Category", "Full Name", "Mobile Number", "Email Address", "City", "State", "Interested Brand / Position", "Status", "Assigned Employee", "Lead Source", "Created On"];
    const csv = [headers, ...rows.map(enquiry => [enquiry.id, enquiry.category, enquiry.name, enquiry.mobile, enquiry.email, enquiry.city, enquiry.state, enquiry.brand, enquiry.status, enquiry.owner, enquiry.originalSource, enquiry.received])]
      .map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ifranchise-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function saveEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    const kind = draftCategory;
    const heardAbout = draftHeard;
    const stamp = now();
    const name = value("name");
    const fileName = (field: string) => {
      const file = form.get(field);
      return file instanceof File && file.name ? file.name : "";
    };
    const selectedFile = (field: string) => {
      const file = form.get(field);
      return file instanceof File && file.name ? file : undefined;
    };
    const enteredDate = value("received");
    const received = enteredDate ? new Date(enteredDate).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : stamp;
    const brand = kind === "Franchise" ? (draftEnquiryType === "General franchise enquiry" ? "General franchise enquiry" : value("brand")) : kind === "Brand expansion" ? name : value("position");
    const next: Enquiry = {
      id: `ENQ-${2400 + enquiries.length + 1}`,
      category: kind,
      name,
      mobile: value("mobile"),
      email: value("email"),
      city: value("city"),
      state: value("state"),
      address: kind === "Franchise" ? value("preferredLocation") : "",
      brand: brand || name,
      investment: kind === "Franchise" ? value("budget") || "—" : "—",
      status: "New",
      focus: kind === "Franchise" ? brand || "General franchise enquiry" : kind === "Job" ? value("position") || "Job application" : value("industry"),
      extra: kind === "Franchise"
        ? `${draftEnquiryType} · ${value("budget")} · ${value("timeline")}`
        : kind === "Job"
          ? `${value("qualification")} · ${value("experience")} · ${value("noticePeriod")}`
          : `${value("industry")} · ${value("presence")}`,
      contactPerson: kind === "Brand expansion" ? value("contactPerson") : undefined,
      enquiryType: kind === "Franchise" ? draftEnquiryType : undefined,
      timeline: kind === "Franchise" ? value("timeline") : undefined,
      preferredLocation: kind === "Franchise" ? value("preferredLocation") : undefined,
      requirements: kind === "Franchise" ? value("requirements") : kind === "Brand expansion" ? value("expansionRequirements") : undefined,
      remarks: value("remarks"),
      campaign: value("campaign"),
      industry: kind === "Brand expansion" ? value("industry") : undefined,
      website: kind === "Brand expansion" ? value("website") : undefined,
      description: kind === "Brand expansion" ? value("description") : undefined,
      presence: kind === "Brand expansion" ? value("presence") : undefined,
      experience: kind === "Job" ? value("experience") : undefined,
      noticePeriod: kind === "Job" ? value("noticePeriod") : undefined,
      resume: kind === "Job" ? fileName("resume") : undefined,
      resumeFile: kind === "Job" ? selectedFile("resume") : undefined,
      coverLetterFile: kind === "Job" ? selectedFile("coverLetter") : undefined,
      coverLetter: kind === "Job" ? fileName("coverLetter") : undefined,
      portfolio: kind === "Job" ? value("portfolio") : undefined,
      previousExperience: kind === "Job" ? value("previousExperience") : undefined,
      skills: kind === "Job" ? value("skills") : undefined,
      originalSource: value("originalSource") || "Direct Enquiry",
      heardAbout,
      heardAboutOther: heardAbout === "Other" ? value("heardOther") : "",
      heardAboutBy: heardAbout ? "Customer" : "",
      heardAboutAt: heardAbout ? stamp : "",
      owner: value("owner") || "Unassigned",
      received,
      salesPipeline: kind !== "Job",
    };
    if (!next.name || !next.mobile || !next.email || !next.city || !next.state || (kind === "Franchise" && draftEnquiryType === "Specific brand" && !value("brand")) || (kind === "Brand expansion" && !next.contactPerson) || (kind === "Job" && (!value("qualification") || !value("experience") || !value("noticePeriod") || !fileName("resume") || !fileName("coverLetter")))) return;
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

  const leadActivities = open ? activities.filter(activity => activity.enquiryId === open.id) : [];
  const heading = open ? open.id : section === "Activity" ? "Activities" : section === "Sources" ? "Lead Sources" : enquiryTabs.find(tab => tab.id === section)?.label ?? "Enquiries";
  const description = enquiryView
    ? "Manage all incoming franchise and brand expansion enquiries."
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
            <RiArrowDownSLine className="size-4 text-text-secondary" />
          </DropdownTrigger>
          <DropdownPopover aria-label="Switch role" placement="bottom end" className="w-[280px]">
            {accessRoles.map(item => (
              <DropdownItem key={item.id} selected={item.id === role.id} onSelect={() => { setRoleOpen(false); setRoleId(item.id); saveActiveCrmRole({ id: item.id, name: item.name, title: item.title }); }}>
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
              owners={owners}
              contacts={[...enquiries.map(item => ({ name: item.name, email: item.email })), ...initialUsers.map(item => ({ name: item.name, email: item.email }))]}
              canDelete={role.canDelete}
              onBack={() => setOpen(null)}
              onSave={patch => {
                setEnquiries(list => list.map(item => item.id === open.id ? { ...item, ...patch } : item));
                setOpen(current => current && current.id === open.id ? { ...current, ...patch } : current);
              }}
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
                  title: update.title ?? "Follow-up call",
                  kind: update.kind ?? "follow-up",
                  status: "Scheduled",
                  due: update.due,
                  type: update.type ?? "Phone Call",
                  when: update.due,
                  direction: "Outgoing",
                  summary: update.summary ?? "Follow-up scheduled.",
                  outcome: "Follow-up Required",
                  followUp: update.due,
                  meetLink: update.meetLink,
                  manual: true,
                  createdBy: role.name,
                  createdAt: stamp,
                }, ...list]);
              }}
              onPatchActivity={(id, patch) => setActivities(list => list.map(item => item.id === id ? { ...item, ...patch } : item))}
              onDeleteActivity={id => setActivities(list => list.filter(item => item.id !== id))}
              onDeleteEnquiry={() => setPendingDelete({ name: open.name, run: () => { setEnquiries(list => list.filter(item => item.id !== open.id)); setActivities(list => list.filter(item => item.enquiryId !== open.id)); setOpen(current => current?.id === open.id ? null : current); } })}
              onCreateTask={task => {
                const stamp = now();
                setActivities(list => [{
                  id: `ACT-${Date.now()}`,
                  enquiryId: open.id,
                  title: task.title,
                  kind: "follow-up",
                  status: task.status,
                  due: task.due,
                  type: "Task",
                  when: task.due,
                  direction: "—",
                  summary: task.summary,
                  outcome: "Follow-up Required",
                  followUp: task.due,
                  manual: true,
                  createdBy: role.name,
                  createdAt: stamp,
                  priority: task.priority,
                  assignedTo: task.assignedTo,
                  reminder: task.reminder,
                  reminderTiming: task.reminderTiming,
                }, ...list]);
              }}
              onCreateNote={noteDraft => {
                const stamp = now();
                setActivities(list => [{
                  id: `ACT-${Date.now()}`,
                  enquiryId: open.id,
                  title: noteDraft.title,
                  kind: "follow-up",
                  status: "Completed",
                  due: stamp,
                  type: "Other Communication",
                  when: stamp,
                  direction: "—",
                  summary: noteDraft.detail,
                  outcome: "Other",
                  followUp: "",
                  manual: true,
                  createdBy: role.name,
                  createdAt: stamp,
                  noteType: noteDraft.noteType,
                  pinned: noteDraft.pinned,
                }, ...list]);
              }}
            />
          ) : (
          <div className="contents">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
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
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" leadingIcon={RiBarChartBoxLine} aria-expanded={showOverview} aria-controls="lead-quick-overview" onClick={() => setShowOverview(current => !current)}>Quick overview</Button>
            {enquiryView && <Button leadingIcon={RiAddLine} onClick={() => { setDraftCategory(activeCategory && role.categories.includes(activeCategory) ? activeCategory : role.categories[0]); setDraftEnquiryType("Specific brand"); setDraftCity(""); setDraftState(""); setAdding(true); }}>Add Enquiry</Button>}
            {section === "Activity" && <Button leadingIcon={RiAddLine} onClick={() => setLogging(true)}>Add Activity</Button>}
            {section === "Sources" && <Button leadingIcon={RiAddLine} onClick={() => { setSourceName("Website"); setAddingSource(true); }}>Add Source</Button>}
            </div>
          </div>

          {showOverview && enquiryView && (
            <div id="lead-quick-overview" role="region" aria-label="Quick overview" className="ld-stats shrink-0">
              <Stat icon={RiUser3Line} value={visibleEnquiries.length} label="Total Enquiries" tone="purple" onClick={() => setStatus("All statuses")} />
              <Stat icon={RiStackLine} value={visibleEnquiries.filter(item => item.status === "New").length} label="New" tone="purple" onClick={() => setStatus(current => current === "New" ? "All statuses" : "New")} />
              <Stat icon={RiLoopRightLine} value={visibleEnquiries.filter(item => item.status === "In Progress").length} label="In Progress" tone="yellow" onClick={() => setStatus(current => current === "In Progress" ? "All statuses" : "In Progress")} />
              <Stat icon={RiCheckboxCircleLine} value={visibleEnquiries.filter(item => item.status === "Qualified").length} label="Qualified" tone="green" onClick={() => setStatus(current => current === "Qualified" ? "All statuses" : "Qualified")} />
              <Stat icon={RiFlag2Line} value={visibleEnquiries.filter(item => item.status === "Converted").length} label="Converted" tone="blue" onClick={() => setStatus(current => current === "Converted" ? "All statuses" : "Converted")} />
            </div>
          )}
          {showOverview && section === "Activity" && (
            <div id="lead-quick-overview" role="region" aria-label="Quick overview" className="ld-stats shrink-0">
              <Stat icon={RiStackLine} value={visibleActivities.length} label="Total Activities" tone="purple" onClick={() => setActivityKind("All types")} />
              <Stat icon={RiPhoneLine} value={visibleActivities.filter(item => item.kind === "call").length} label="Calls" tone="purple" onClick={() => setActivityKind(current => current === "Calls" ? "All types" : "Calls")} />
              <Stat icon={RiCalendarLine} value={visibleActivities.filter(item => item.kind === "meeting").length} label="Meetings" tone="purple" onClick={() => setActivityKind(current => current === "Meetings" ? "All types" : "Meetings")} />
              <Stat icon={RiMailLine} value={visibleActivities.filter(item => item.kind === "email").length} label="Emails" tone="purple" onClick={() => setActivityKind(current => current === "Emails" ? "All types" : "Emails")} />
              <Stat icon={RiTimeLine} value={visibleActivities.filter(item => item.kind === "follow-up" && item.type !== "Other Communication").length} label="Follow-ups" tone="purple" onClick={() => setActivityKind(current => current === "Follow-ups" ? "All types" : "Follow-ups")} />
            </div>
          )}
          {showOverview && section === "Sources" && (
            <div id="lead-quick-overview" role="region" aria-label="Quick overview" className="ld-stats ld-stats-4 shrink-0">
              <Stat icon={RiStackLine} value={sources.length} label="Total Sources" tone="purple" onClick={() => { setStatus("All statuses"); setSourceKind("All types"); }} />
              <Stat icon={RiPlayCircleLine} value={sources.filter(item => item.active).length} label="Active Sources" tone="green" onClick={() => setStatus(current => current === "Active" ? "All statuses" : "Active")} />
              <Stat icon={RiGroupLine} value={leadTotal.toLocaleString("en-IN")} label="Total Leads" tone="purple" onClick={() => setSourceView({ name: "All", rows: sourceLeads })} />
              <Stat icon={RiLineChartLine} value={conversion(convertedTotal, leadTotal)} label="Conversion Rate" tone="green" onClick={() => setRateText(`Conversion rate is converted leads divided by total leads. Across every source that is ${convertedTotal.toLocaleString("en-IN")} converted from ${leadTotal.toLocaleString("en-IN")} leads, which is ${conversion(convertedTotal, leadTotal)}.`) } />
            </div>
          )}

          <Panel>
            {enquiryView && <div className="flex shrink-0 items-center gap-2 border-b border-separator-border px-3 py-2" role="group" aria-label="Enquiry lists">
              <Button size="small" variant={favouritesOnly ? "ghost" : "primary"} aria-pressed={!favouritesOnly} onClick={() => { setFavouritesOnly(false); setSelected(new Set()); }}>All enquiries</Button>
              <Button className="ld-favourites-list-button" size="small" variant={favouritesOnly ? "primary" : "ghost"} leadingIcon={favouritesOnly ? RiStarFill : RiStarLine} aria-pressed={favouritesOnly} onClick={() => { setFavouritesOnly(true); setSelected(new Set()); }}>Favourites ({favouritesCount})</Button>
            </div>}
            <div className={cx("ld-toolbar flex shrink-0 items-center gap-2 border-b border-separator-border p-3", enquiryView && "ld-enquiry-toolbar", enquiryView && !showBrandFilter && "ld-enquiry-toolbar-no-brand")}>
              <SearchField
                aria-label={`Search ${heading.toLowerCase()}`}
                placeholder={section === "Activity" ? "Search activity, notes or enquiry ID" : section === "Sources" ? "Search source name..." : "Search enquiries"}
                value={query}
                onChange={setQuery}
                className="min-w-0 flex-1"
              />
              {enquiryView && <>
                <FilterSelect label="Status" value={status} onChange={setStatus} options={["All statuses", "New", "In Progress", "Qualified", "Converted"]} />
                {showBrandFilter && <FilterSelect label="Interested brand" value={brand} onChange={setBrand} options={["All brands", ...brandsInView]} />}
                <FilterSelect label="Location" width="ld-location-filter" value={location} onChange={setLocation} options={["All locations", ...citiesInView]} />
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
              <div className="ld-toolbar-actions ms-auto flex max-w-full items-center gap-2">
              {enquiryView && <Button size="small" variant={advancedFiltersOpen || advancedFilterCount > 0 ? "primary" : "secondary"} leadingIcon={RiFilter3Line} aria-label={advancedFilterCount ? `Advanced filters (${advancedFilterCount})` : "Advanced filters"} title="Advanced filters" aria-expanded={advancedFiltersOpen} aria-controls="lead-advanced-filters" onClick={() => setAdvancedFiltersOpen(current => !current)}><span className="ld-toolbar-action-label">{advancedFilterCount ? `Filters (${advancedFilterCount})` : "Advanced filters"}</span></Button>}
              <Button className="ld-column-button" size="small" variant="secondary" leadingIcon={RiLayoutColumnLine} aria-label="Customize columns" title="Customize columns" onClick={() => setColumnManagerOpen(true)}><span className="ld-toolbar-action-label">Customize columns</span></Button>
              </div>
            </div>
            {enquiryView && selectedIds.length > 0 && (
              <div className="ld-bulk">
                <span className="text-body-2-medium">{selectedIds.length} selected</span>
                <Button size="small" variant="secondary" onClick={() => { setStatusChoice(""); setStatusIds(selectedIds); }}>Update status</Button>
                <Button size="small" variant="secondary" onClick={() => { setAssignOwner(owners[0]); setAssignIds(selectedIds); }}>Assign</Button>
                <Button size="small" variant="secondary" onClick={() => exportSelectedEnquiries(selectedIds)}>Export selected</Button>
                {role.canDelete && <Button size="small" variant="secondary" onClick={() => setPendingDelete({ name: `${selectedIds.length} enquiries`, run: () => { setEnquiries(list => list.filter(item => !selectedIds.includes(item.id))); setActivities(list => list.filter(item => !selectedIds.includes(item.enquiryId))); setSelected(new Set()); } })}>Delete</Button>}
                <Button size="small" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              </div>
            )}

            <div className={cx("ld-record-layout", advancedFiltersOpen && enquiryView && "is-filter-open")}>

            <div className={cx("ld-record-content", section === "Activity" && "ld-scroll-fit")}>
            <div className="ld-scroll">
              {enquiryView && (
                <Table key={`${role.id}:${columnScope}:${visibleColumnIds.join(",")}`} aria-label="Enquiries" selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} onRowAction={key => setOpen(scopedEnquiries.find(enquiry => enquiry.id === String(key)) || null)}>
                  <TableHeader columns={tableColumns}>
                    {(column: Column) => (
                      <TableColumn isRowHeader={column.isRowHeader} aria-label={column.id === "favourite" ? "Favourite" : undefined} className={cx(column.id === "status" && "ld-status-heading", column.id === "favourite" && "ld-favourite-cell")}>
                        {column.id === "select" ? <Checkbox slot="selection" aria-label="Select all enquiries" /> : column.id === "favourite" ? <RiStarLine className="size-4" aria-hidden /> : column.name}
                      </TableColumn>
                    )}
                  </TableHeader>
                  <TableBody items={enquiryPage.rows} dependencies={[favouriteIds]}>
                    {enquiry => (
                      <TableRow columns={tableColumns} dependencies={[enquiry, favouriteIds.has(enquiry.id)]} className="cursor-pointer outline-none">
                        {(column: Column) => (
                          <TableCell className={cx(column.id === "status" && "ld-status-cell", column.id === "favourite" && "ld-favourite-cell")}>
                            {column.id === "select" && <Checkbox slot="selection" aria-label={`Select ${enquiry.name}`} />}
                            {column.id === "favourite" && <IconButton size="small" icon={favouriteIds.has(enquiry.id) ? RiStarFill : RiStarLine} aria-label={`${favouriteIds.has(enquiry.id) ? "Remove" : "Add"} ${enquiry.name} ${favouriteIds.has(enquiry.id) ? "from" : "to"} favourites`} aria-pressed={favouriteIds.has(enquiry.id)} title={favouriteIds.has(enquiry.id) ? "Remove from favourites" : "Add to favourites"} className="ld-favourite-button border-0 bg-transparent text-foreground-icon-secondary shadow-none" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); toggleFavourite(enquiry.id); }} />}
                            {column.id === "person" && <Person name={enquiry.name} meta={enquiry.id} />}
                            {column.id === "brand" && enquiry.brand}
                            {column.id === "contactPerson" && (enquiry.contactPerson || enquiry.name)}
                            {column.id === "industry" && enquiry.focus}
                            {column.id === "position" && enquiry.focus}
                            {column.id === "presence" && enquiry.extra}
                            {column.id === "profile" && enquiry.extra}
                            {column.id === "location" && <span className="inline-flex items-center gap-1 text-text-secondary"><RiMapPin2Line className="size-4 text-text-tertiary" />{enquiry.city}</span>}
                            {column.id === "state" && enquiry.state}
                            {column.id === "phone" && enquiry.mobile}
                            {column.id === "email" && enquiry.email}
                            {column.id === "leadSource" && enquiry.originalSource}
                            {column.id === "enquiryType" && (enquiry.enquiryType || enquiry.category)}
                            {column.id === "timeline" && (enquiry.timeline || "—")}
                            {column.id === "preferredLocation" && (enquiry.preferredLocation || enquiry.address || "—")}
                            {column.id === "campaign" && (enquiry.campaign || "—")}
                            {column.id === "website" && (enquiry.website || "—")}
                            {column.id === "qualification" && (enquiry.focus || "—")}
                            {column.id === "experience" && (enquiry.experience || "—")}
                            {column.id === "noticePeriod" && (enquiry.noticePeriod || "—")}
                            {column.id === "resume" && (enquiry.resume || "—")}
                            {column.id === "coverLetter" && (enquiry.coverLetter || "—")}
                            {column.id === "portfolio" && (enquiry.portfolio || "—")}
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
                <Table key={`${role.id}:${columnScope}:${visibleColumnIds.join(",")}`} aria-label="Activities" className="ld-activity-table" containerClassName="ld-fit-table" onRowAction={key => {
                  const activity = activities.find(item => item.id === String(key));
                  const enquiry = enquiries.find(item => item.id === activity?.enquiryId);
                  if (enquiry) setOpen(enquiry);
                }}>
                  <TableHeader columns={dataColumns}>{(column: Column) => <TableColumn isRowHeader={column.isRowHeader} className={column.id === "status" ? "ld-status-heading" : undefined}>{column.name}</TableColumn>}</TableHeader>
                  <TableBody items={activityPage.rows}>
                    {activity => {
                      const enquiry = enquiries.find(item => item.id === activity.enquiryId);
                      const mark = activityMark(activity);
                      return (
                        <TableRow columns={dataColumns} className="cursor-pointer outline-none">
                          {(column: Column) => (
                            <TableCell className={column.id === "status" ? "ld-status-cell" : undefined}>
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
                <Table key={`${role.id}:${columnScope}:${visibleColumnIds.join(",")}`} aria-label="Lead sources" onRowAction={key => {
                  const item = sources.find(source => source.id === String(key));
                  if (item) setSourceView({ name: item.name, rows: sourceLeads.filter(lead => lead.source === item.name) });
                }}>
                  <TableHeader columns={dataColumns}>{(column: Column) => <TableColumn isRowHeader={column.isRowHeader} className={column.id === "status" ? "ld-status-heading" : undefined}>{column.name}</TableColumn>}</TableHeader>
                  <TableBody items={sourcePage.rows}>
                    {item => (
                        <TableRow columns={dataColumns} className="cursor-pointer outline-none">
                          {(column: Column) => (
                            <TableCell className={column.id === "status" ? "ld-status-cell" : undefined}>
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

              {enquiryView && !visibleEnquiries.length && <Empty title={favouritesOnly ? "No favourite enquiries found" : "No enquiries found"} detail={favouritesOnly ? "Star an enquiry to save it here, or adjust your filters." : "Try another name, status, brand or city."} />}
              {section === "Activity" && !visibleActivities.length && <Empty title="No activity found" detail="Try another enquiry, person or status." />}
              {section === "Sources" && !visibleSources.length && <Empty title="No sources found" detail="Try another name, type or status." />}
              {enquiryView && visibleEnquiries.length > 0 && <Pager page={enquiryPage.current} pages={enquiryPage.pages} onPage={setPage} label={`Showing ${enquiryPage.start}–${enquiryPage.end} of ${visibleEnquiries.length} enquiries`} />}
              {section === "Activity" && visibleActivities.length > 0 && <Pager page={activityPage.current} pages={activityPage.pages} onPage={setPage} label={`Showing ${activityPage.start}–${activityPage.end} of ${visibleActivities.length} activities`} />}
              {section === "Sources" && visibleSources.length > 0 && <Pager page={sourcePage.current} pages={sourcePage.pages} onPage={setPage} label={`Showing ${sourcePage.start}–${sourcePage.end} of ${visibleSources.length} sources`} />}
            </div>
            </div>
            {advancedFiltersOpen && enquiryView && <AdvancedLeadFilters
              id="lead-advanced-filters"
              initialFilters={advancedFilters}
              title="Advanced filters"
              description="Choose the enquiries to show."
              recordLabel="enquiries"
              searchPlaceholder="Find a field"
              fields={advancedFilterFields}
              scope={columnScope}
              userId={role.id}
              resultCount={visibleEnquiries.length}
              countFor={filters => matchingEnquiryPool.filter(enquiry => matchesLeadCriteria(enquiry, filters, advancedFilterFields)).length}
              activeFilterCount={advancedFilterCount}
              onApply={filters => { setAdvancedFilters(filters); setPage(1); }}
              onClear={() => { setAdvancedFilters(null); setPage(1); }}
              onClose={() => setAdvancedFiltersOpen(false)}
            />}
            </div>
          </Panel>
          </div>
          )}
        </div>

        {adding && (
          <Modal className="ld-dialog" isOpen onOpenChange={next => { if (!next) setAdding(false); }} size="lg">
            <ModalHeader title={`Add ${draftCategory === "Franchise" ? "franchise" : draftCategory === "Brand expansion" ? "brand expansion" : "job"} enquiry`} description={draftCategory === "Job" ? "Capture the candidate profile, application source and supporting files." : draftCategory === "Brand expansion" ? "Capture the brand profile and its franchise expansion requirements." : "Capture the prospective franchisee, brand interest and investment plans."} />
            <ModalBody>
              <form id="enquiry-form" className="grid grid-cols-6 gap-3" onSubmit={saveEnquiry}>
                <LeadSelect className="col-span-3" aria-label="Assigned employee" label="Assigned employee (optional)" name="owner" defaultSelectedKey="Unassigned">{["Unassigned", ...owners].map(item => <SelectItem key={item} id={item}>{item === "Unassigned" ? item : firstName(item)}</SelectItem>)}</LeadSelect>
                {draftCategory === "Franchise" && <>
                  <Input className="col-span-3" label="Full name" name="name" isRequired />
                  <div className="col-span-3"><PhoneField /></div>
                  <Input className="col-span-3" label="Email address" name="email" type="email" isRequired />
                  <div className="col-span-3"><SuggestField label="City" name="city" value={draftCity} options={cityOptions} onChange={city => { setDraftCity(city); const state = stateForCity(city); if (state) setDraftState(state); }} /></div>
                  <div className="col-span-3"><SuggestField label="State" name="state" value={draftState} options={stateOptions} onChange={setDraftState} /></div>
                  <LeadSelect className="col-span-3" aria-label="Enquiry type" label="Franchise enquiry type" name="enquiryType" isRequired selectedKey={draftEnquiryType} onSelectionChange={key => setDraftEnquiryType(String(key))}>{["Specific brand", "General franchise enquiry"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  {draftEnquiryType === "Specific brand" ? <LeadSelect className="col-span-3" aria-label="Interested brand" label="Interested brand" name="brand" isRequired defaultSelectedKey={activeBrandNames[0]}>{activeBrandNames.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect> : <div className="col-span-3 ld-form-note">General franchise enquiry · no specific brand selected</div>}
                  {draftEnquiryType === "General franchise enquiry" && <input type="hidden" name="brand" value="General franchise enquiry" />}
                  <LeadSelect className="col-span-3" aria-label="Expected investment budget" label="Expected investment budget" name="budget" isRequired defaultSelectedKey={budgetRanges[0]}>{budgetRanges.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  <LeadSelect className="col-span-3" aria-label="Expected business start timeline" label="Expected business start timeline" name="timeline" isRequired defaultSelectedKey={timelines[1]}>{timelines.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  <Input className="col-span-3" label="Preferred location (optional)" name="preferredLocation" />
                  <Input className="col-span-3" label="Campaign (optional)" name="campaign" />
                  <Textarea className="col-span-6" label="Additional requirements (optional)" name="requirements" />
                  <Textarea className="col-span-6" label="Customer remarks (optional)" name="remarks" />
                </>}
                {draftCategory === "Brand expansion" && <>
                  <Input className="col-span-3" label="Brand name" name="name" isRequired />
                  <Input className="col-span-3" label="Contact person name" name="contactPerson" isRequired />
                  <Input className="col-span-3" label="Industry" name="industry" isRequired />
                  <div className="col-span-3"><PhoneField /></div>
                  <Input className="col-span-3" label="Email address" name="email" type="email" isRequired />
                  <div className="col-span-3"><SuggestField label="Headquarters city" name="city" value={draftCity} options={cityOptions} onChange={city => { setDraftCity(city); const state = stateForCity(city); if (state) setDraftState(state); }} /></div>
                  <div className="col-span-3"><SuggestField label="Headquarters state" name="state" value={draftState} options={stateOptions} onChange={setDraftState} /></div>
                  <Input className="col-span-3" label="Official website" name="website" type="url" isRequired />
                  <LeadSelect className="col-span-3" aria-label="Lead source" label="Lead source" name="originalSource" isRequired defaultSelectedKey="Website">{originalSources.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  <Input className="col-span-3" label="Current business presence (optional)" name="presence" />
                  <Input className="col-span-3" label="Campaign (optional)" name="campaign" />
                  <Textarea className="col-span-6" label="Brand description (optional)" name="description" />
                  <Textarea className="col-span-6" label="Expansion requirements (optional)" name="expansionRequirements" />
                  <Textarea className="col-span-6" label="Additional remarks (optional)" name="remarks" />
                </>}
                {draftCategory === "Job" && <>
                  <Input className="col-span-3" label="Candidate full name" name="name" isRequired />
                  <div className="col-span-3"><PhoneField /></div>
                  <Input className="col-span-3" label="Email address" name="email" type="email" isRequired />
                  <Input className="col-span-3" label="Educational qualification" name="qualification" isRequired />
                  <LeadSelect className="col-span-3" aria-label="Work experience" label="Work experience" name="experience" isRequired defaultSelectedKey="Fresher">{["Fresher", "Experienced"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  <LeadSelect className="col-span-3" aria-label="Notice period" label="Notice period" name="noticePeriod" isRequired defaultSelectedKey="Immediate">{["Immediate", "15 days", "30 days", "60 days", "90 days", "Serving notice", "Other"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>
                  <div className="col-span-3"><SuggestField label="Candidate city" name="city" value={draftCity} options={cityOptions} onChange={city => { setDraftCity(city); const state = stateForCity(city); if (state) setDraftState(state); }} /></div>
                  <div className="col-span-3"><SuggestField label="Candidate state" name="state" value={draftState} options={stateOptions} onChange={setDraftState} /></div>
                  <Input className="col-span-3" label="Applied position (optional)" name="position" />
                  <label className="ld-file-field col-span-3"><span>Resume <b>*</b></span><input type="file" name="resume" accept=".pdf,.doc,.docx" required /></label>
                  <label className="ld-file-field col-span-3"><span>Cover letter <b>*</b></span><input type="file" name="coverLetter" accept=".pdf,.doc,.docx,.txt" required /></label>
                  <Input className="col-span-3" label="Portfolio link (optional)" name="portfolio" type="url" placeholder="https://…" />
                  <Input className="col-span-3" label="Campaign (optional)" name="campaign" />
                  <Textarea className="col-span-6" label="Previous work experience (optional)" name="previousExperience" />
                  <Textarea className="col-span-6" label="Relevant skills (optional)" name="skills" />
                  <Textarea className="col-span-6" label="Candidate remarks (optional)" name="remarks" />
                </>}
                {draftCategory !== "Brand expansion" && <LeadSelect className="col-span-3" aria-label="Lead source" label={draftCategory === "Job" ? "Application source" : "Lead source"} name="originalSource" isRequired defaultSelectedKey="Website">{originalSources.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</LeadSelect>}
                <Input className="col-span-3" label={draftCategory === "Job" ? "Application date and time" : "Enquiry date and time"} name="received" type="datetime-local" defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} isRequired />
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
        <ColumnManagerModal
          isOpen={columnManagerOpen}
          onOpenChange={setColumnManagerOpen}
          availableColumns={configurableColumnDefs}
          selectedIds={visibleColumnIds}
          requiredIds={[requiredColumnId]}
          isSuperAdmin={role.title === "Superadmin"}
          scopeLabel={enquiryView ? `${columnKind} enquiries` : section === "Activity" ? "lead activity" : "lead sources"}
          onSave={saveColumns}
        />
      </ReviewShell>
    </DirectionProvider>
  );
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-16 text-center"><h3 className="text-headline-medium text-text-primary">{title}</h3><p className="text-body-regular text-text-secondary">{detail}</p></div>;
}
