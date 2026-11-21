"use client";

import { useEffect, useMemo, useState } from "react";
import { Fragment } from "react";
import { RiAdvertisementLine, RiArrowDownSLine, RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine, RiCalendarLine, RiCheckboxCircleFill, RiCheckboxCircleLine, RiFacebookLine, RiFilter3Line, RiGlobalLine, RiGoogleLine, RiGroupLine, RiInformationLine, RiInstagramLine, RiLayoutColumnLine, RiLogoutBoxRLine, RiMailLine, RiPhoneLine, RiQuestionLine, RiStarFill, RiStarLine, RiStore2Line, RiUserLine } from "@remixicon/react";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { cx } from "@/utils/cx";
import { useLeadFavourites } from "@/modules/leads/lib/use-lead-favourites";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { TableSelectionCheckbox } from "@/components/base/table/table-selection-checkbox";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { ColumnManagerModal } from "@/modules/screen-library/components/column-manager-modal";
import { activeCrmProfiles, readActiveCrmRole, readTableColumns, saveActiveCrmRole, saveOrganizationTableColumns, savePersonalTableColumns, type ActiveCrmProfile } from "@/modules/screen-library/lib/table-columns";
import { sourceLeads } from "@/modules/leads/data";
import { AdvancedLeadFilters, type LeadAdvancedFilters, type LeadFilterField } from "@/modules/leads/components/advanced-lead-filters";
import { initialUsers } from "@/modules/users-roles/data";
import { portraitFor } from "@/modules/users-roles/portrait";
import "./assignment.css";
import "@/modules/leads/components/leads.css";

type Stage = "Central Allocation" | "Reporting Manager" | "BDA Assignment";
type AssignmentType = "Initial Assignment" | "Reassignment" | "Transfer";
type TargetRole = "Central Allocation" | "Reporting Manager" | "BDA";
type AssignmentUrgency = "Low" | "Medium" | "High" | "Urgent";
type Lead = (typeof sourceLeads)[number];
type Assignment = { stage: Stage; manager?: string; bda?: string; urgency?: AssignmentUrgency };
type HistoryItem = {
  id: string;
  leadId: string;
  opportunityId: string;
  previousOwner: string;
  newOwner: string;
  assignedBy: string;
  previousDepartment: string;
  previousTeam: string;
  newDepartment: string;
  newTeam: string;
  assignmentDate: string;
  assignmentTime: string;
  assignmentReason: string;
  assignmentType: AssignmentType;
};

const managers = initialUsers.filter(user => user.roleId === "manager" && user.status === "Active").map(user => user.name);
const bdas = initialUsers.filter(user => user.roleId === "bda" && user.status === "Active").map(user => user.name);
const coordinator = "Anitha K";
const leadSet = sourceLeads.filter(lead => lead.category !== "Job").slice(0, 24);
const stages: Stage[] = ["Central Allocation", "Reporting Manager", "BDA Assignment"];
const urgencyColors: Record<AssignmentUrgency, ChipColor> = { Low: "blue", Medium: "yellow", High: "orange", Urgent: "rose" };
function sourceIconFor(source: string) {
  if (source === "Google Ads") return RiGoogleLine;
  if (source === "Facebook") return RiFacebookLine;
  if (source === "Instagram") return RiInstagramLine;
  if (source === "Meta Ads") return RiAdvertisementLine;
  if (source === "Referral") return RiGroupLine;
  if (source === "Walk-in") return RiStore2Line;
  return RiGlobalLine;
}
const assignmentColumns = [
  { id: "select", name: "" },
  { id: "opportunity", name: "Enquiry", isRowHeader: true },
  { id: "source", name: "Lead Source" },
  { id: "category", name: "Enquiry Category" },
  { id: "owner", name: "Assigned To" },
  { id: "stage", name: "Assignment Stage" },
  { id: "created", name: "Created On" },
];
const assignmentAvailableColumns = [
  { id: "opportunity", name: "Enquiry", isRowHeader: true },
  { id: "source", name: "Lead Source" },
  { id: "category", name: "Enquiry Category" },
  { id: "owner", name: "Assigned To" },
  { id: "stage", name: "Assignment Stage" },
  { id: "created", name: "Created On" },
  { id: "phone", name: "Mobile Number" },
  { id: "email", name: "Email Address" },
  { id: "leadId", name: "Lead ID" },
  { id: "investment", name: "Investment Capacity" },
  { id: "leadStatus", name: "Lead Status" },
  { id: "notes", name: "Lead Notes" },
];
const assignmentHistoryColumns = [
  { id: "opportunityId", name: "Enquiry ID", isRowHeader: true },
  { id: "assignmentType", name: "Assignment Type" },
  { id: "previousOwner", name: "Previous Owner" },
  { id: "newOwner", name: "New Owner" },
  { id: "assignedBy", name: "Assigned By" },
  { id: "previousTeam", name: "Previous Department / Team" },
  { id: "newTeam", name: "New Department / Team" },
  { id: "dateTime", name: "Date & Time" },
  { id: "reason", name: "Reason" },
];
const emptyAssignmentFilters: LeadAdvancedFilters = { match: "all", rules: [{ id: "rule-1", field: "opportunity", operator: "is", value: "" }] };
const emptyHistoryFilters: LeadAdvancedFilters = { match: "all", rules: [{ id: "rule-history-1", field: "opportunityId", operator: "is", value: "" }] };

function matchesAssignmentRules(lead: Lead, assignment: Assignment | undefined, filters: LeadAdvancedFilters) {
  const values: Record<string, string> = {
    opportunity: lead.name,
    opportunityId: lead.code,
    leadId: lead.id,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    category: lead.category,
    stage: assignment?.stage ?? "Central Allocation",
    owner: assignment && assignment.stage !== "Central Allocation" ? ownerLabel(assignment) : "Unassigned",
    investment: lead.investment ?? "",
    leadStatus: lead.status,
    notes: lead.note ?? "",
    created: lead.when,
  };
  const rules = filters.rules.filter(rule => rule.value || ["is empty", "is not empty"].includes(rule.operator));
  if (!rules.length) return true;
  const matches = rules.map(rule => {
    const actual = (values[rule.field] ?? "").toLowerCase();
    const expected = rule.value.toLowerCase();
    if (rule.operator === "is empty") return actual.length === 0;
    if (rule.operator === "is not empty") return actual.length > 0;
    if (rule.operator === "is") return actual === expected;
    if (rule.operator === "is not") return actual !== expected;
    if (rule.operator === "does not contain") return !actual.includes(expected);
    if (rule.operator === "starts with") return actual.startsWith(expected);
    return actual.includes(expected);
  });
  return filters.match === "all" ? matches.every(Boolean) : matches.some(Boolean);
}

function personInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function AssigneeOption({ name }: { name: string }) {
  return <span className="assignment-owner-option"><Avatar size="sm" src={portraitFor(name)} initials={personInitials(name)} alt="" />{name}</span>;
}
function SelectedOpportunityPill({ lead }: { lead: Lead }) {
  return <Dropdown>
    <DropdownTrigger className="assignment-selected-opportunity-pill">{lead.name}</DropdownTrigger>
    <DropdownPopover aria-label={`${lead.name} opportunity details`} className="assignment-selected-opportunity-popover">
      <div className="assignment-selected-opportunity-card">
        <div className="assignment-selected-opportunity-heading">
          <Avatar size="sm" src={portraitFor(lead.name)} initials={personInitials(lead.name)} alt="" />
          <span><small>{lead.code}</small><strong>{lead.name}</strong></span>
        </div>
        <div className="assignment-selected-opportunity-details">
          <span><RiPhoneLine /><bdi>{lead.phone}</bdi></span>
          <span><RiMailLine /><bdi>{lead.email}</bdi></span>
          <span><RiGlobalLine />{lead.source}</span>
          <span><RiStore2Line />{lead.category}</span>
          <span><RiCalendarLine />{lead.when}</span>
        </div>
      </div>
    </DropdownPopover>
  </Dropdown>;
}
function matchesHistoryRules(item: HistoryItem, filters: LeadAdvancedFilters) {
  const values: Record<string, string> = {
    opportunityId: item.opportunityId,
    leadId: item.leadId,
    assignmentType: item.assignmentType,
    previousOwner: item.previousOwner,
    newOwner: item.newOwner,
    assignedBy: item.assignedBy,
    previousTeam: `${item.previousDepartment} / ${item.previousTeam}`,
    newTeam: `${item.newDepartment} / ${item.newTeam}`,
    date: `${item.assignmentDate} ${item.assignmentTime}`,
    reason: item.assignmentReason,
  };
  const rules = filters.rules.filter(rule => rule.value || ["is empty", "is not empty"].includes(rule.operator));
  if (!rules.length) return true;
  const matches = rules.map(rule => {
    const actual = (values[rule.field] ?? "").toLowerCase();
    const expected = rule.value.toLowerCase();
    if (rule.operator === "is empty") return actual.length === 0;
    if (rule.operator === "is not empty") return actual.length > 0;
    if (rule.operator === "is") return actual === expected;
    if (rule.operator === "is not") return actual !== expected;
    if (rule.operator === "does not contain") return !actual.includes(expected);
    if (rule.operator === "starts with") return actual.startsWith(expected);
    return actual.includes(expected);
  });
  return filters.match === "all" ? matches.every(Boolean) : matches.some(Boolean);
}
const assignmentStageColors: Record<Stage, ChipColor> = { "Central Allocation": "purple", "Reporting Manager": "yellow", "BDA Assignment": "lime" };

function initials(name: string) { return name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase(); }
function ownerLabel(item?: Assignment) { return item?.bda ?? item?.manager ?? coordinator; }
function historyOwnerParts(owner: string) {
  const [role, ...nameParts] = owner.split(" · ");
  return nameParts.length ? { role, name: nameParts.join(" · ") } : { role: "Owner", name: role };
}
function ownerFor(assignment?: Assignment) {
  if (!assignment || assignment.stage === "Central Allocation") return `Central Allocation · ${coordinator}`;
  if (assignment.stage === "Reporting Manager") return `Reporting Manager · ${assignment.manager ?? "Unassigned"}`;
  return `BDA · ${assignment.bda ?? "Unassigned"}`;
}
function teamFor(owner: string) {
  const user = initialUsers.find(item => item.name === owner);
  return { department: user?.department || "—", team: user?.team || "—" };
}

function teamPathLabel(team: { department: string; team: string }) {
  return [team.department, team.team].filter(value => value && value !== "—").join(" · ") || "Unassigned";
}
function dateTime(now: Date) {
  return {
    date: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(now),
    time: new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(now),
  };
}
function stageForTarget(target: TargetRole): Stage { return target === "Central Allocation" ? "Central Allocation" : target === "Reporting Manager" ? "Reporting Manager" : "BDA Assignment"; }

const initialAssignments: Record<string, Assignment> = Object.fromEntries(leadSet.map((lead, index) => [
  lead.id,
  index < 8
    ? { stage: "Central Allocation" }
    : index < 16
      ? { stage: "Reporting Manager", manager: managers[index % Math.max(1, managers.length)] }
      : { stage: "BDA Assignment", manager: managers[index % Math.max(1, managers.length)], bda: bdas[index % Math.max(1, bdas.length)] },
]));

const initialHistory: HistoryItem[] = leadSet.slice(8, 12).map((lead, index) => {
  const manager = managers[index % Math.max(1, managers.length)];
  const previous = teamFor(coordinator);
  const next = teamFor(manager ?? "");
  return {
    id: `ASG-${index + 1}`,
    leadId: lead.id,
    opportunityId: lead.code,
    previousOwner: `Central Allocation · ${coordinator}`,
    newOwner: `Reporting Manager · ${manager ?? "Unassigned"}`,
    assignedBy: coordinator,
    previousDepartment: previous.department,
    previousTeam: "Central Allocation",
    newDepartment: next.department,
    newTeam: next.team,
    assignmentDate: `${16 - index} Nov 2026`,
    assignmentTime: `${10 + index}:15 AM`,
    assignmentReason: "New opportunity distribution",
    assignmentType: "Initial Assignment",
  };
});

export function AssignmentWorkspace() {
  const [tab, setTab] = useState<"Assign Leads" | "Assignment History">("Assign Leads");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<TargetRole>("Reporting Manager");
  const [assignee, setAssignee] = useState(managers[0] ?? "");
  const [urgency, setUrgency] = useState<AssignmentUrgency>("Medium");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [storageReady, setStorageReady] = useState(false);
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [assignmentDateFilter, setAssignmentDateFilter] = useState("All dates");
  const [historyAssignedByFilter, setHistoryAssignedByFilter] = useState("All assigners");
  const [historyDateFilter, setHistoryDateFilter] = useState("All dates");
  const [advancedFilters, setAdvancedFilters] = useState<LeadAdvancedFilters | null>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [historyAdvancedFilters, setHistoryAdvancedFilters] = useState<LeadAdvancedFilters | null>(null);
  const [historyAdvancedFiltersOpen, setHistoryAdvancedFiltersOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("All sources");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("All types");
  const [activeProfile, setActiveProfile] = useState<ActiveCrmProfile>({ id: "assignment-coordinator", name: coordinator, title: "Lead Coordinator" });
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const { favouriteIds, toggleFavourite } = useLeadFavourites(activeProfile.id);
  const favouritesCount = leadSet.filter(lead => favouriteIds.has(lead.code)).length;
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const [columnIds, setColumnIds] = useState<string[]>([]);
  const [historyColumnIds, setHistoryColumnIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const assignmentColumnScope = "assignment:assign-leads";
  const historyColumnScope = "assignment:history";
  const assignmentDefaultIds = assignmentColumns.filter(column => column.id !== "select" && column.id !== "action").map(column => column.id);
  const historyDefaultIds = assignmentHistoryColumns.map(column => column.id);
  const advancedFilterFields: LeadFilterField[] = useMemo(() => [
    { id: "opportunity", name: "Enquiry name", type: "text", placeholder: "Enter an enquiry name" },
    { id: "opportunityId", name: "Enquiry ID", type: "text", placeholder: "Enter an enquiry ID" },
    { id: "leadId", name: "Lead ID", type: "text" },
    { id: "phone", name: "Mobile number", type: "text" },
    { id: "email", name: "Email address", type: "text" },
    { id: "source", name: "Lead source", type: "select", placeholder: "Select a lead source", options: Array.from(new Set(leadSet.map(lead => lead.source))) },
    { id: "category", name: "Enquiry category", type: "select", placeholder: "Select an enquiry category", options: Array.from(new Set(leadSet.map(lead => lead.category))) },
    { id: "stage", name: "Assignment stage", type: "select", placeholder: "Select an assignment stage", options: stages },
    { id: "owner", name: "Assigned to", type: "select", options: ["Unassigned", ...managerOwnerOptions()] },
    { id: "investment", name: "Investment capacity", type: "select", options: Array.from(new Set(leadSet.map(lead => lead.investment).filter((value): value is string => Boolean(value)))) },
    { id: "leadStatus", name: "Lead status", type: "select", options: Array.from(new Set(leadSet.map(lead => lead.status))) },
    { id: "notes", name: "Lead notes", type: "text" },
    { id: "created", name: "Created on", type: "text", placeholder: "Enter a creation date" },
  ], []);
  const historyAdvancedFilterFields: LeadFilterField[] = useMemo(() => [
    { id: "opportunityId", name: "Enquiry ID", type: "text", placeholder: "Enter an enquiry ID" },
    { id: "leadId", name: "Lead ID", type: "text" },
    { id: "assignmentType", name: "Assignment type", type: "select", placeholder: "Select an assignment type", options: ["Initial Assignment", "Reassignment", "Transfer"] },
    { id: "previousOwner", name: "Previous owner", type: "select", placeholder: "Select a previous owner", options: Array.from(new Set(history.map(item => item.previousOwner))) },
    { id: "newOwner", name: "New owner", type: "select", placeholder: "Select a new owner", options: Array.from(new Set(history.map(item => item.newOwner))) },
    { id: "assignedBy", name: "Assigned by", type: "select", placeholder: "Select who made the assignment", options: Array.from(new Set(history.map(item => item.assignedBy))) },
    { id: "previousTeam", name: "Previous department / team", type: "text" },
    { id: "newTeam", name: "New department / team", type: "text" },
    { id: "date", name: "Date and time", type: "text" },
    { id: "reason", name: "Assignment reason", type: "text" },
  ], [history]);

  useEffect(() => {
    const profile = readActiveCrmRole();
    setActiveProfile(profile);
    setColumnIds(readTableColumns(assignmentColumnScope, profile.id, assignmentAvailableColumns, ["opportunity"], assignmentDefaultIds));
    setHistoryColumnIds(readTableColumns(historyColumnScope, profile.id, assignmentHistoryColumns, ["opportunityId"], historyDefaultIds));
  }, []);

  useEffect(() => {
    setColumnIds(readTableColumns(assignmentColumnScope, activeProfile.id, assignmentAvailableColumns, ["opportunity"], assignmentDefaultIds));
    setHistoryColumnIds(readTableColumns(historyColumnScope, activeProfile.id, assignmentHistoryColumns, ["opportunityId"], historyDefaultIds));
  }, [activeProfile.id]);

  function saveAssignmentColumns(ids: string[], organizationDefault: boolean) {
    const normalized = [...new Set(["opportunity", ...ids.filter(id => assignmentAvailableColumns.some(column => column.id === id))])];
    setColumnIds(normalized);
    savePersonalTableColumns(assignmentColumnScope, activeProfile.id, normalized);
    if (organizationDefault && activeProfile.title === "Superadmin") saveOrganizationTableColumns(assignmentColumnScope, normalized);
    setColumnManagerOpen(false);
  }

  function saveHistoryColumns(ids: string[], organizationDefault: boolean) {
    const normalized = [...new Set(["opportunityId", ...ids.filter(id => assignmentHistoryColumns.some(column => column.id === id))])];
    setHistoryColumnIds(normalized);
    savePersonalTableColumns(historyColumnScope, activeProfile.id, normalized);
    if (organizationDefault && activeProfile.title === "Superadmin") saveOrganizationTableColumns(historyColumnScope, normalized);
    setColumnManagerOpen(false);
  }

  useEffect(() => {
    try {
      const savedAssignments = window.localStorage.getItem("ifranchise:lead-assignment:assignments");
      const savedHistory = window.localStorage.getItem("ifranchise:lead-assignment:history");
      if (savedAssignments) setAssignments(JSON.parse(savedAssignments) as Record<string, Assignment>);
      if (savedHistory) setHistory(JSON.parse(savedHistory) as HistoryItem[]);
    } catch {
      // Keep the in-memory prototype data if saved browser data is unavailable.
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem("ifranchise:lead-assignment:assignments", JSON.stringify(assignments));
      window.localStorage.setItem("ifranchise:lead-assignment:history", JSON.stringify(history));
    } catch {
      // The board remains usable when browser storage is disabled or full.
    }
  }, [assignments, history, storageReady]);

  const selected = leadSet.find(lead => lead.id === selectedId) ?? null;
  const targets = checked.length ? checked : selected ? [selected.id] : [];
  const assignmentTargetLeads = targets.map(id => leadSet.find(lead => lead.id === id)).filter((lead): lead is Lead => Boolean(lead));
  const isBulkAssignment = assignmentTargetLeads.length > 1;
  const selectedAssignment = selected ? assignments[selected.id] : undefined;
  const targetStage = stageForTarget(targetRole);
  const assigneeOptions = targetRole === "Reporting Manager" ? managers : targetRole === "BDA" ? bdas : [];
  const assignmentDateCutoff = assignmentDateFilter === "Last 7 days" || assignmentDateFilter === "Last 30 days"
    ? new Date(Date.now() - (assignmentDateFilter === "Last 7 days" ? 7 : 30) * 24 * 60 * 60 * 1000)
    : null;
  const matchingLeads = leadSet.filter(lead => {
    const assignment = assignments[lead.id];
    const owner = assignment ? ownerLabel(assignment) : "";
    const query = search.trim().toLowerCase();
    const createdAt = new Date(lead.date);
    const inAssignmentDateRange = assignmentDateFilter === "All dates"
      || (assignmentDateFilter === "This month" && createdAt.getMonth() === new Date().getMonth() && createdAt.getFullYear() === new Date().getFullYear())
      || (assignmentDateCutoff !== null && createdAt >= assignmentDateCutoff);
    return (!query || [lead.name, lead.code, lead.phone, lead.email, lead.source, lead.category, lead.investment ?? "", lead.status, lead.note ?? "", owner, assignment?.stage ?? "Central Allocation"].some(value => value.toLowerCase().includes(query)))
      && (sourceFilter === "All sources" || lead.source === sourceFilter)
      && (categoryFilter === "All categories" || lead.category === categoryFilter)
      && (stageFilter === "All stages" || assignment?.stage === stageFilter)
      && inAssignmentDateRange
      && (!favouritesOnly || favouriteIds.has(lead.code));
  });
  const filteredLeads = matchingLeads.filter(lead => !advancedFilters || matchesAssignmentRules(lead, assignments[lead.id], advancedFilters));
  const dateCutoff = historyDateFilter === "Last 7 days" || historyDateFilter === "Last 30 days"
    ? new Date(Date.now() - (historyDateFilter === "Last 7 days" ? 7 : 30) * 24 * 60 * 60 * 1000)
    : null;
  const matchingHistory = tab === "Assignment History" ? history.filter(item => {
    const query = historySearch.trim().toLowerCase();
    const assignedAt = new Date(`${item.assignmentDate} ${item.assignmentTime}`);
    const inDateRange = historyDateFilter === "All dates"
      || (historyDateFilter === "This month" && assignedAt.getMonth() === new Date().getMonth() && assignedAt.getFullYear() === new Date().getFullYear())
      || (dateCutoff !== null && assignedAt >= dateCutoff);
    return (!query || [item.opportunityId, item.leadId, item.previousOwner, item.newOwner, item.assignedBy, item.assignmentReason, item.assignmentType, item.assignmentDate, item.assignmentTime, item.previousTeam, item.newTeam].some(value => value.toLowerCase().includes(query)))
      && (historyTypeFilter === "All types" || item.assignmentType === historyTypeFilter)
      && (historyAssignedByFilter === "All assigners" || item.assignedBy === historyAssignedByFilter)
      && inDateRange;
  }) : [];
  const filteredHistory = matchingHistory.filter(item => !historyAdvancedFilters || matchesHistoryRules(item, historyAdvancedFilters));
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil((tab === "Assign Leads" ? filteredLeads.length : filteredHistory.length) / pageSize));
  const currentPage = Math.min(page, pages);
  const leadRows = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const historyRows = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visibleCount = tab === "Assign Leads" ? filteredLeads.length : filteredHistory.length;
  const advancedFilterCount = advancedFilters ? advancedFilters.rules.filter(rule => rule.value || ["is empty", "is not empty"].includes(rule.operator)).length : 0;
  const historyAdvancedFilterCount = historyAdvancedFilters ? historyAdvancedFilters.rules.filter(rule => rule.value || ["is empty", "is not empty"].includes(rule.operator)).length : 0;
  const visibleAssignmentColumns = columnIds.length ? columnIds : assignmentDefaultIds;
  const tableColumns = [
    { id: "select", name: "" },
    { id: "favourite", name: "Favourite" },
    ...visibleAssignmentColumns.map(id => assignmentAvailableColumns.find(column => column.id === id)).filter((column): column is (typeof assignmentAvailableColumns)[number] => Boolean(column)),
  ];
  const visibleHistoryColumns = historyColumnIds.length ? historyColumnIds : historyDefaultIds;
  const visibleHistoryColumnDefs = visibleHistoryColumns.map(id => assignmentHistoryColumns.find(column => column.id === id)).filter((column): column is (typeof assignmentHistoryColumns)[number] => Boolean(column));
  const currentNewOwner = targetRole === "Central Allocation" ? `Central Allocation · ${coordinator}` : `${targetRole} · ${assignee || "Select an owner"}`;
  const previousOwner = selected ? ownerFor(selectedAssignment) : "—";
  const previousStaff = selectedAssignment?.stage === "BDA Assignment" ? selectedAssignment.bda : selectedAssignment?.stage === "Reporting Manager" ? selectedAssignment.manager : coordinator;
  const previousTeam = selectedAssignment?.stage === "Central Allocation" ? { department: teamFor(coordinator).department, team: "Central Allocation" } : teamFor(previousStaff ?? coordinator);
  const newTeam = targetRole === "Central Allocation" ? { department: teamFor(coordinator).department, team: "Central Allocation" } : teamFor(assignee);
  const previewDateTime = dateTime(new Date());

  function managerOwnerOptions() { return Array.from(new Set([...managers, ...bdas])); }

  function openAssignment(lead: Lead, suggestedTarget?: TargetRole) {
    const current = assignments[lead.id];
    const target = suggestedTarget ?? (current?.stage === "Central Allocation" ? "Reporting Manager" : "BDA");
    const options = target === "Reporting Manager" ? managers : target === "BDA" ? bdas : [];
    setSelectedId(lead.id);
    if (!checked.includes(lead.id)) setChecked([]);
    setTargetRole(target);
    setAssignee(options[0] ?? "");
    setUrgency(current?.urgency ?? "Medium");
    setReason("");
  }

  function saveAssignments() {
    if (!targets.length || !reason.trim() || (targetRole !== "Central Allocation" && !assignee)) return;
    const now = new Date();
    const { date, time } = dateTime(now);
    const selectedLeads = targets.map(id => leadSet.find(lead => lead.id === id)).filter((lead): lead is Lead => Boolean(lead));
    const nextStage = stageForTarget(targetRole);
    setAssignments(current => {
      const next = { ...current };
      for (const lead of selectedLeads) {
        next[lead.id] = targetRole === "Central Allocation"
          ? { stage: nextStage, urgency }
          : targetRole === "Reporting Manager"
            ? { stage: nextStage, manager: assignee, urgency }
            : { stage: nextStage, manager: current[lead.id]?.manager, bda: assignee, urgency };
      }
      return next;
    });
    setHistory(current => [
      ...selectedLeads.map((lead, index) => {
        const before = assignments[lead.id];
        const beforeStaff = before?.stage === "BDA Assignment" ? before.bda : before?.stage === "Reporting Manager" ? before.manager : coordinator;
        const beforeInfo = before?.stage === "Central Allocation" || !before ? { department: teamFor(coordinator).department, team: "Central Allocation" } : teamFor(beforeStaff ?? coordinator);
        const assignmentType: AssignmentType = !before || before.stage === "Central Allocation" ? "Initial Assignment" : before.stage === nextStage ? "Reassignment" : "Transfer";
        return {
          id: `ASG-${now.getTime()}-${index}`,
          leadId: lead.id,
          opportunityId: lead.code,
          previousOwner: ownerFor(before),
          newOwner: currentNewOwner,
          assignedBy: coordinator,
          previousDepartment: beforeInfo.department,
          previousTeam: beforeInfo.team,
          newDepartment: newTeam.department,
          newTeam: newTeam.team,
          assignmentDate: date,
          assignmentTime: time,
          assignmentReason: reason.trim(),
          assignmentType,
        };
      }),
      ...current,
    ]);
    setSelectedId(null);
    setChecked([]);
    setReason("");
  }

  const tabItems = ["Assign Leads", "Assignment History"] as const;
  const assignmentNavigation = <nav className="review-navigation assignment-nav" aria-label="Lead assignment navigation"><button type="button" className="review-overview-link is-active" onClick={() => { setTab("Assign Leads"); setPage(1); }}><RiLayoutColumnLine aria-hidden="true" />Lead Assignment</button></nav>;

  return <ReviewShell className="assignment-shell" moduleName="Lead Assignment" icon="user" subtitle="Assignments & history" overviewHref="/library/modules/assignment" title={tab} navigation={assignmentNavigation} sidebarFooter={<div className="assignment-sidebar-spacer" aria-hidden="true" />} controls={<div className="assignment-header-meta"><Dropdown>
    <DropdownTrigger className="assignment-profile-trigger" aria-label={`Switch profile, current profile ${activeProfile.name}`}>
      <span className="assignment-user-avatar">{personInitials(activeProfile.name)}</span><span className="assignment-profile-name">{activeProfile.name}</span><RiArrowDownSLine aria-hidden="true" />
    </DropdownTrigger>
    <DropdownPopover aria-label="Switch profile" placement="bottom end" className="assignment-profile-popover w-[280px]">
      {activeCrmProfiles.map(profile => <DropdownItem key={profile.id} selected={profile.id === activeProfile.id} onSelect={() => { setActiveProfile(profile); saveActiveCrmRole(profile); setSelectedId(null); setChecked([]); setPage(1); }}>
        <Avatar size="sm" src={portraitFor(profile.name)} initials={personInitials(profile.name)} alt="" />
        <span className="min-w-0"><span className="block truncate">{profile.label ?? profile.name}</span><span className="block text-caption-1-regular text-text-tertiary">{profile.title}</span></span>
      </DropdownItem>)}
      <DropdownDivider />
      <DropdownItem onSelect={() => { window.location.href = "/library"; }}><RiQuestionLine />Help &amp; guides</DropdownItem>
      <DropdownDivider />
      <DropdownItem className="assignment-profile-logout" onSelect={() => { window.location.href = "/sign-in"; }}><RiLogoutBoxRLine />Sign out</DropdownItem>
    </DropdownPopover>
  </Dropdown></div>}>
      <div className="assignment-content">
        <div className="assignment-tabs" role="tablist" aria-label="Assignment views">
          {tabItems.map(label => <button key={label} role="tab" aria-selected={tab === label} className={tab === label ? "is-active" : ""} onClick={() => { setTab(label); setPage(1); }}>{label}</button>)}
        </div>

        {tab === "Assign Leads" ? <section className="assignment-table-panel">
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-separator-border px-3 py-2">
            <Button size="small" variant={favouritesOnly ? "ghost" : "primary"} aria-pressed={!favouritesOnly} onClick={() => { setFavouritesOnly(false); setChecked([]); setPage(1); }}>All enquiries</Button>
            <Button className="assignment-favourites-list-button" size="small" variant={favouritesOnly ? "primary" : "ghost"} leadingIcon={favouritesOnly ? RiStarFill : RiStarLine} aria-pressed={favouritesOnly} onClick={() => { setFavouritesOnly(true); setChecked([]); setPage(1); }}>Favourites ({favouritesCount})</Button>
          </div>
          <div className="assignment-toolbar assignment-leads-toolbar">
            <SearchField aria-label="Search enquiries by name, phone, email or enquiry ID" placeholder="Search enquiries" value={search} onChange={value => { setSearch(value); setPage(1); }} className="assignment-search-field" fieldClassName="bg-background-primary-default" />
            <Select aria-label="Filter by assignment stage" selectedKey={stageFilter} onSelectionChange={key => { setStageFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter" triggerClassName="w-full" popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu"><SelectItem key="All stages" id="All stages">All stages</SelectItem>{stages.map(stage => <SelectItem key={stage} id={stage}>{stage}</SelectItem>)}</Select>
            <Select aria-label="Filter by lead source" selectedKey={sourceFilter} onSelectionChange={key => { setSourceFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter" triggerClassName="w-full" popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu"><SelectItem key="All sources" id="All sources">All sources</SelectItem>{Array.from(new Set(leadSet.map(lead => lead.source))).map(source => <SelectItem key={source} id={source}>{source}</SelectItem>)}</Select>
            <Select aria-label="Filter by enquiry category" selectedKey={categoryFilter} onSelectionChange={key => { setCategoryFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter" triggerClassName="w-full" popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu"><SelectItem key="All categories" id="All categories">All categories</SelectItem>{Array.from(new Set(leadSet.map(lead => lead.category))).map(category => <SelectItem key={category} id={category}>{category}</SelectItem>)}</Select>
            <Select aria-label="Filter enquiries by date" selectedKey={assignmentDateFilter} onSelectionChange={key => { setAssignmentDateFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter assignment-leads-date-filter" triggerClassName="w-full" popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu"><SelectItem key="All dates" id="All dates">All dates</SelectItem>{["Last 7 days", "Last 30 days", "This month"].map(range => <SelectItem key={range} id={range}>{range}</SelectItem>)}</Select>
            <div className="assignment-toolbar-actions">
              <Button size="small" aria-label={advancedFilterCount ? `Advanced filters, ${advancedFilterCount} applied` : "Advanced filters"} aria-expanded={advancedFiltersOpen} aria-controls="assignment-advanced-filters" title="Advanced filters" variant={advancedFiltersOpen || advancedFilterCount > 0 ? "primary" : "secondary"} leadingIcon={RiFilter3Line} onClick={() => setAdvancedFiltersOpen(current => !current)}><span className="assignment-toolbar-action-label">{advancedFilterCount ? `Filters (${advancedFilterCount})` : "Advanced filters"}</span></Button>
              <Button size="small" variant="secondary" leadingIcon={RiLayoutColumnLine} aria-label="Customize columns" title="Customize columns" onClick={() => setColumnManagerOpen(true)}><span className="assignment-toolbar-action-label">Customize columns</span></Button>
            </div>
          </div>
          <div className={cx("assignment-list-body", advancedFiltersOpen && "has-advanced-filters")}>
          <div className="assignment-list-main">
          {checked.length > 0 ? <div className="assignment-bulk-row"><span>{checked.length} selected</span><Button size="small" leadingIcon={RiArrowRightLine} onClick={() => { const lead = leadSet.find(item => item.id === checked[0]); if (lead) openAssignment(lead); }}>Assign selected</Button><Button size="small" variant="ghost" onClick={() => setChecked([])}>Clear selection</Button></div> : null}
          <div className="assignment-table-scroll">
            <Table key={`assignment:${visibleAssignmentColumns.join(",")}`} aria-label="Enquiries for assignment" size="sm" className="assignment-record-table" containerClassName="assignment-table-overflow" onRowAction={key => { const lead = leadSet.find(item => item.id === String(key)); if (lead) openAssignment(lead); }}>
              <TableHeader columns={tableColumns}>{column => <TableColumn className={cx(`assignment-column-${column.id}`, (column.id === "owner" || column.id === "stage") && "assignment-centered-header")} aria-label={column.id === "favourite" ? "Favourite" : undefined} isRowHeader={"isRowHeader" in column ? column.isRowHeader : false}>{column.id === "select" ? <TableSelectionCheckbox label="Select all enquiries" isSelected={leadRows.length > 0 && leadRows.every(lead => checked.includes(lead.id))} onChange={isSelected => setChecked(current => isSelected ? [...new Set([...current, ...leadRows.map(lead => lead.id)])] : current.filter(id => !leadRows.some(lead => lead.id === id)))} /> : column.id === "favourite" ? <RiStarLine className="size-4" aria-hidden /> : column.name}</TableColumn>}</TableHeader>
              <TableBody items={leadRows.map(lead => ({ ...lead, __selected: checked.includes(lead.id) }))} dependencies={[favouriteIds, assignments]}>
                {lead => <TableRow columns={tableColumns} dependencies={[lead, favouriteIds.has(lead.code), assignments[lead.id]]} className="assignment-record-row cursor-pointer outline-none">
                  {column => <TableCell className={cx(`assignment-column-${column.id}`, (column.id === "owner" || column.id === "stage") && "assignment-centered-cell")}>
                    {column.id === "select" && <TableSelectionCheckbox label={`Select ${lead.name}`} isSelected={lead.__selected === true} onChange={isSelected => setChecked(current => isSelected ? [...new Set([...current, lead.id])] : current.filter(id => id !== lead.id))} />}
                    {column.id === "favourite" && <IconButton size="small" icon={favouriteIds.has(lead.code) ? RiStarFill : RiStarLine} aria-label={`${favouriteIds.has(lead.code) ? "Remove" : "Add"} ${lead.name} ${favouriteIds.has(lead.code) ? "from" : "to"} favourites`} aria-pressed={favouriteIds.has(lead.code)} title={favouriteIds.has(lead.code) ? "Remove from favourites" : "Add to favourites"} className="assignment-favourite-button border-0 bg-transparent text-foreground-icon-secondary shadow-none" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); toggleFavourite(lead.code); }} />}
                    {column.id === "opportunity" && <span className="assignment-opportunity"><strong>{lead.name}</strong><small>{lead.code}</small></span>}
                    {column.id === "source" && <span className={`assignment-source source-${lead.source.toLowerCase().replace(/[^a-z]/g, "")}`}>{lead.source}</span>}
                    {column.id === "category" && <span className="assignment-category">{lead.category}</span>}
                    {column.id === "owner" && <span className="assignment-owner"><span>{assignments[lead.id]?.stage === "Central Allocation" ? "—" : initials(ownerLabel(assignments[lead.id]))}</span><span><strong>{assignments[lead.id]?.stage === "Central Allocation" ? "Unassigned" : ownerLabel(assignments[lead.id])}</strong><small>{assignments[lead.id]?.stage === "Central Allocation" ? "Central Allocation" : assignments[lead.id]?.stage}</small></span></span>}
                    {column.id === "stage" && <Chip variant="caption" color={assignmentStageColors[assignments[lead.id]?.stage ?? "Central Allocation"]} className="assignment-stage-pill">{assignments[lead.id]?.stage ?? "Central Allocation"}</Chip>}
                    {column.id === "created" && <span className="assignment-created">{lead.when}</span>}
                    {column.id === "phone" && <span className="assignment-created">{lead.phone}</span>}
                    {column.id === "email" && <span className="assignment-created">{lead.email}</span>}
                    {column.id === "leadId" && <span className="assignment-created">{lead.id}</span>}
                    {column.id === "investment" && <span className="assignment-created">{lead.investment || "—"}</span>}
                    {column.id === "leadStatus" && <span className="assignment-created">{lead.status}</span>}
                    {column.id === "notes" && <span className="assignment-created">{lead.note || "—"}</span>}
                  </TableCell>}
                </TableRow>}
              </TableBody>
            </Table>
            {leadRows.length === 0 ? <div className="assignment-empty-state">{favouritesOnly ? "No favourite enquiries match these filters. Star an enquiry to save it here." : "No enquiries match these filters."}</div> : null}
          </div>
          <div className="assignment-pager"><span>Showing {visibleCount ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, visibleCount)} of {visibleCount} enquiries</span><div><button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><RiArrowLeftSLine /></button><span>Page {currentPage} of {pages}</span><button aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><RiArrowRightSLine /></button></div></div>
          </div>
          {advancedFiltersOpen && <AdvancedLeadFilters id="assignment-advanced-filters" className="assignment-advanced-filter-panel" fields={advancedFilterFields} scope="assignment:opportunities" userId={activeProfile.id} resultCount={filteredLeads.length} countFor={filters => matchingLeads.filter(lead => matchesAssignmentRules(lead, assignments[lead.id], filters)).length} activeFilterCount={advancedFilterCount} initialFilters={advancedFilters ?? emptyAssignmentFilters} onApply={filters => { setAdvancedFilters(filters); setPage(1); }} onClear={() => { setAdvancedFilters(null); setPage(1); }} onClose={() => setAdvancedFiltersOpen(false)} title="Filter enquiries by" description="Build and save an assignment view." recordLabel="enquiries" searchPlaceholder="Find a field" />}
          </div>
        </section> : <section className="assignment-table-panel assignment-history-panel">
          <div className="assignment-toolbar assignment-history-toolbar">
            <SearchField aria-label="Search assignment history" placeholder="Search assignment history" value={historySearch} onChange={value => { setHistorySearch(value); setPage(1); }} className="assignment-search-field" fieldClassName="bg-background-primary-default" />
            <Select aria-label="Filter by assignment type" selectedKey={historyTypeFilter} onSelectionChange={key => { setHistoryTypeFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter assignment-history-type-filter" triggerClassName="w-full" popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu"><SelectItem key="All types" id="All types">All types</SelectItem>{["Initial Assignment", "Reassignment", "Transfer"].map(type => <SelectItem key={type} id={type}>{type}</SelectItem>)}</Select>
            <Select aria-label="Filter by who made the assignment" selectedKey={historyAssignedByFilter} onSelectionChange={key => { setHistoryAssignedByFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter assignment-history-assigned-by-filter" triggerClassName="w-full" popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu"><SelectItem key="All assigners" id="All assigners">All assigners</SelectItem>{Array.from(new Set(history.map(item => item.assignedBy))).map(name => <SelectItem key={name} id={name}>{name}</SelectItem>)}</Select>
            <Select aria-label="Filter assignment history by date" selectedKey={historyDateFilter} onSelectionChange={key => { setHistoryDateFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter assignment-history-date-filter" triggerClassName="w-full" popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu"><SelectItem key="All dates" id="All dates">All dates</SelectItem>{["Last 7 days", "Last 30 days", "This month"].map(range => <SelectItem key={range} id={range}>{range}</SelectItem>)}</Select>
            <div className="assignment-toolbar-actions">
              <Button size="small" aria-label={historyAdvancedFilterCount ? `Advanced filters, ${historyAdvancedFilterCount} applied` : "Advanced filters"} aria-expanded={historyAdvancedFiltersOpen} aria-controls="assignment-history-filters" title="Advanced filters" variant={historyAdvancedFiltersOpen || historyAdvancedFilterCount > 0 ? "primary" : "secondary"} leadingIcon={RiFilter3Line} onClick={() => setHistoryAdvancedFiltersOpen(current => !current)}><span className="assignment-toolbar-action-label">{historyAdvancedFilterCount ? `Filters (${historyAdvancedFilterCount})` : "Advanced filters"}</span></Button>
              <Button size="small" variant="secondary" leadingIcon={RiLayoutColumnLine} aria-label="Customize columns" title="Customize columns" onClick={() => setColumnManagerOpen(true)}><span className="assignment-toolbar-action-label">Customize columns</span></Button>
            </div>
          </div>
          <div className={cx("assignment-history-layout", historyAdvancedFiltersOpen && "has-advanced-filters")}>
            <div className="assignment-history-main">
          <div className="assignment-table-scroll"><Table key={`assignment-history:${visibleHistoryColumns.join(",")}`} aria-label="Assignment history" size="sm" className="assignment-history-table" containerClassName="assignment-table-overflow"><TableHeader columns={visibleHistoryColumnDefs}>{column => <TableColumn className={`assignment-history-column-${column.id}`} isRowHeader={"isRowHeader" in column ? column.isRowHeader : false}>{column.name}</TableColumn>}</TableHeader><TableBody items={historyRows}>{item => <TableRow columns={visibleHistoryColumnDefs}>{column => <TableCell className={`assignment-history-column-${column.id}`}>
            {column.id === "opportunityId" && <span className="assignment-history-id"><strong>{item.opportunityId}</strong><small>{item.leadId}</small></span>}
            {column.id === "assignmentType" && <Chip variant="caption" color={item.assignmentType === "Initial Assignment" ? "purple" : item.assignmentType === "Transfer" ? "blue" : "yellow"} className="assignment-stage-pill">{item.assignmentType}</Chip>}
            {column.id === "previousOwner" && <span className="assignment-history-owner"><strong>{historyOwnerParts(item.previousOwner).role}</strong><small>{historyOwnerParts(item.previousOwner).name}</small></span>}
            {column.id === "newOwner" && <span className="assignment-history-owner"><strong>{historyOwnerParts(item.newOwner).role}</strong><small>{historyOwnerParts(item.newOwner).name}</small></span>}
            {column.id === "assignedBy" && item.assignedBy}
            {column.id === "previousTeam" && `${item.previousDepartment} / ${item.previousTeam}`}
            {column.id === "newTeam" && `${item.newDepartment} / ${item.newTeam}`}
            {column.id === "dateTime" && <span className="assignment-history-date"><strong>{item.assignmentDate}</strong><small>{item.assignmentTime.replace(/\b(am|pm)\b/i, period => period.toUpperCase())}</small></span>}
            {column.id === "reason" && item.assignmentReason}
          </TableCell>}</TableRow>}</TableBody></Table>{historyRows.length === 0 ? <div className="assignment-empty-state">No assignment history matches these filters.</div> : null}</div>
          <div className="assignment-pager"><span>Showing {visibleCount ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, visibleCount)} of {visibleCount} records</span><div><button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><RiArrowLeftSLine /></button><span>Page {currentPage} of {pages}</span><button aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><RiArrowRightSLine /></button></div></div>
            </div>
            {historyAdvancedFiltersOpen && <AdvancedLeadFilters id="assignment-history-filters" className="assignment-history-advanced-filter-panel" fields={historyAdvancedFilterFields} scope="assignment:history" userId={activeProfile.id} resultCount={filteredHistory.length} countFor={filters => matchingHistory.filter(item => matchesHistoryRules(item, filters)).length} activeFilterCount={historyAdvancedFilterCount} initialFilters={historyAdvancedFilters ?? emptyHistoryFilters} onApply={filters => { setHistoryAdvancedFilters(filters); setPage(1); }} onClear={() => { setHistoryAdvancedFilters(null); setPage(1); }} onClose={() => setHistoryAdvancedFiltersOpen(false)} title="Filter assignment history by" description="Combine owner, date, and assignment details." recordLabel="records" searchPlaceholder="Find a field" />}
          </div>
        </section>}
      </div>
    <Modal isOpen={Boolean(selected)} onOpenChange={open => { if (!open) { setSelectedId(null); setChecked([]); } }} size="lg" overlayClassName="assignment-drawer-overlay" className="assignment-confirm-dialog assignment-drawer-panel" aria-label={isBulkAssignment ? `Assign ${assignmentTargetLeads.length} selected opportunities` : "Assign opportunity"}>
      {selected ? <>
        <ModalHeader className="assignment-modal-header" title={<span className="assignment-title-with-info">{isBulkAssignment ? `Assign ${assignmentTargetLeads.length} selected opportunities` : targetRole === "Central Allocation" ? "Return Opportunity to Central Allocation" : targetRole === "BDA" ? "Assign Opportunity to BDA" : "Assign Opportunity"}<Dropdown><DropdownTrigger aria-label="Assignment information" className="assignment-info-trigger"><RiInformationLine aria-hidden="true" /></DropdownTrigger><DropdownPopover aria-label="Assignment guidance" className="w-72 assignment-guidance-popover"><p>Choose an active teammate for this opportunity. The new owner and your reason are saved in assignment history.</p></DropdownPopover></Dropdown></span>} icon={isBulkAssignment ? RiGlobalLine : sourceIconFor(selected.source)} />
        <ModalBody className="assignment-confirm-body">
          {!isBulkAssignment ? <div className="assignment-lead-summary">
            <div className="summary-contact">
              <div className="summary-code-row"><small>{selected.code}</small></div>
              <strong>{isBulkAssignment ? `${selected.name} and ${assignmentTargetLeads.length - 1} more` : selected.name}</strong>
              {!isBulkAssignment ? <span className="summary-email"><RiMailLine /><bdi>{selected.email}</bdi></span> : null}
            </div>
            {!isBulkAssignment ? <>
              <div className="summary-data summary-contact-phone"><small>Contact</small><strong><RiPhoneLine />{selected.phone}</strong></div>
              <div className="summary-data"><small>Enquiry category</small><strong>{selected.category}</strong></div>
              <div className="summary-data"><small>Created on</small><strong><RiCalendarLine />{selected.when}</strong></div>
            </> : null}
          </div> : null}
          {isBulkAssignment ? <div className="assignment-bulk-lead-list" aria-label="Selected opportunities"><span>Selected opportunities <small>{assignmentTargetLeads.length}</small></span><div>{assignmentTargetLeads.map(lead => <SelectedOpportunityPill key={lead.id} lead={lead} />)}</div></div> : null}
          <div className="assignment-hierarchy"><strong>Assignment hierarchy</strong><div className="hierarchy-track">{stages.map((stage, index) => { const current = selectedAssignment?.stage === stage; const passed = (selectedAssignment ? stages.indexOf(selectedAssignment.stage) : 0) > index; const Icon = index === 0 ? RiLayoutColumnLine : index === 1 ? RiUserLine : RiGroupLine; return <Fragment key={stage}><div className={`hierarchy-stage ${current ? "is-current" : ""} ${passed ? "is-passed" : ""}`} aria-current={current ? "step" : undefined}>{passed ? <RiCheckboxCircleFill className="hierarchy-stage-check" aria-label="Stage completed" /> : <Icon />}<span>{stage === "BDA Assignment" ? "BDA" : stage}</span></div>{index < stages.length - 1 ? <RiArrowRightLine className="hierarchy-arrow" aria-hidden="true" /> : null}</Fragment>; })}</div></div>
          <div className="assignment-target"><strong>Assign to <i>*</i></strong><div className="target-options">{(isBulkAssignment || selectedAssignment?.stage !== "Central Allocation" ? ["Central Allocation", "Reporting Manager", "BDA"] as const : ["Reporting Manager", "BDA"] as const).map(role => <label key={role}><input type="radio" name="assignment-target" checked={targetRole === role} onChange={() => { const next = role as TargetRole; setTargetRole(next); setAssignee((next === "Reporting Manager" ? managers : next === "BDA" ? bdas : [])[0] ?? ""); }} />{role}</label>)}</div></div>
          <div className="assignment-confirm-fields">
            {targetRole !== "Central Allocation" ? <div className="assignee-field"><Select aria-label={`Select ${targetRole === "Reporting Manager" ? "reporting manager" : "BDA"}`} label={`Select ${targetRole === "Reporting Manager" ? "reporting manager" : "BDA"}`} isRequired selectedKey={assignee} onSelectionChange={key => setAssignee(String(key))} size="md" className="assignment-assignee-select" triggerClassName="assignment-assignee-trigger" popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu">{assigneeOptions.map(name => <SelectItem key={name} id={name}><AssigneeOption name={name} /></SelectItem>)}</Select></div> : <div className="assignee-field"><label>New owner</label><div className="central-owner-preview"><Avatar size="sm" src={portraitFor(coordinator)} initials={personInitials(coordinator)} alt="" />Central Allocation · {coordinator}</div></div>}
            <div className="assignment-urgency-field"><Select aria-label="Urgency" label="Urgency" selectedKey={urgency} onSelectionChange={key => setUrgency(String(key) as AssignmentUrgency)} size="md" className="assignment-urgency-select" triggerClassName="assignment-urgency-trigger" renderValue={<Chip variant="caption" color={urgencyColors[urgency]}>{urgency}</Chip>} popoverClassName="w-max min-w-(--trigger-width) max-w-[calc(100vw-32px)] assignment-option-menu">{(["Low", "Medium", "High", "Urgent"] as const).map(level => <SelectItem key={level} id={level}>{level}</SelectItem>)}</Select></div>
            <div className="assignment-reason-field"><label htmlFor="assignment-reason">Assignment reason <i>*</i></label><textarea id="assignment-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={200} placeholder="Enter reason for assignment…" /><small>{reason.length} / 200</small></div>
          </div>
          {isBulkAssignment ? <p className="assignment-preview-note">Owner change preview for {selected.name}; each selected opportunity keeps its own previous owner and history.</p> : null}
          <div className="assignment-audit-preview">
            <span><small>Previous owner</small><span className="assignment-audit-owner"><Avatar size="sm" src={portraitFor(previousStaff ?? coordinator)} initials={personInitials(previousStaff ?? coordinator)} alt="" /><span className="assignment-audit-person"><small>{selectedAssignment?.stage === "Central Allocation" ? "Central Allocation" : selectedAssignment?.stage === "BDA Assignment" ? "BDA" : "Reporting Manager"}</small><strong>{previousStaff ?? coordinator}</strong></span></span></span>
            <span><small>New owner</small><span className="assignment-audit-owner"><Avatar size="sm" src={portraitFor(targetRole === "Central Allocation" ? coordinator : assignee)} initials={personInitials(targetRole === "Central Allocation" ? coordinator : assignee)} alt="" /><span className="assignment-audit-person"><small>{targetRole}</small><strong>{targetRole === "Central Allocation" ? coordinator : assignee}</strong></span></span></span>
            <span><small>Assigned by</small><span className="assignment-audit-owner"><Avatar size="sm" color="blue" src={portraitFor(coordinator)} initials={personInitials(coordinator)} alt="" /><strong>{coordinator}</strong></span></span>
            <span><small>Team path · department / team</small><strong>{teamPathLabel(previousTeam)} → {teamPathLabel(newTeam)}</strong></span><span><small>Urgency</small><strong>{urgency}</strong></span><span><small>Recorded</small><strong>{previewDateTime.date}, {previewDateTime.time}</strong></span>
          </div>
        </ModalBody>
        <ModalFooter className="assignment-modal-footer"><Button variant="secondary" onClick={() => { setSelectedId(null); setChecked([]); setPage(1); }}>Cancel</Button><Button leadingIcon={RiArrowRightLine} onClick={saveAssignments} disabled={!reason.trim() || (targetRole !== "Central Allocation" && !assignee)}>{targetRole === "Central Allocation" ? "Return to Central Allocation" : `Assign to ${targetRole === "Reporting Manager" ? "Manager" : "BDA"}`}</Button></ModalFooter>
      </> : null}
    </Modal>
    {tab === "Assign Leads" ? <ColumnManagerModal isOpen={columnManagerOpen} onOpenChange={setColumnManagerOpen} availableColumns={assignmentAvailableColumns} selectedIds={visibleAssignmentColumns} requiredIds={["opportunity"]} isSuperAdmin={activeProfile.title === "Superadmin"} scopeLabel="lead assignment" onSave={saveAssignmentColumns} /> : <ColumnManagerModal isOpen={columnManagerOpen} onOpenChange={setColumnManagerOpen} availableColumns={assignmentHistoryColumns} selectedIds={visibleHistoryColumns} requiredIds={["opportunityId"]} isSuperAdmin={activeProfile.title === "Superadmin"} scopeLabel="assignment history" onSave={saveHistoryColumns} />}
  </ReviewShell>;
}
