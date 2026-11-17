"use client";

import { useEffect, useState } from "react";
import type { Selection } from "react-aria-components";
import { RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine, RiCalendarLine, RiCheckboxCircleLine, RiGroupLine, RiLayoutColumnLine, RiMoreLine, RiPhoneLine, RiStore2Line, RiUserLine } from "@remixicon/react";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { sourceLeads } from "@/modules/leads/data";
import { initialUsers } from "@/modules/users-roles/data";
import "./assignment.css";

type Stage = "Central Allocation" | "Reporting Manager" | "BDA Assignment";
type AssignmentType = "Initial Assignment" | "Reassignment" | "Transfer";
type TargetRole = "Central Allocation" | "Reporting Manager" | "BDA";
type Lead = (typeof sourceLeads)[number];
type Assignment = { stage: Stage; manager?: string; bda?: string };
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
const assignmentColumns = [
  { id: "select", name: "" },
  { id: "opportunity", name: "Opportunity", isRowHeader: true },
  { id: "source", name: "Source" },
  { id: "category", name: "Enquiry Category" },
  { id: "owner", name: "Assigned To" },
  { id: "stage", name: "Assignment Stage" },
  { id: "created", name: "Created On" },
  { id: "action", name: "" },
];
const assignmentStageColors: Record<Stage, ChipColor> = { "Central Allocation": "purple", "Reporting Manager": "yellow", "BDA Assignment": "lime" };

function initials(name: string) { return name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase(); }
function ownerLabel(item?: Assignment) { return item?.bda ?? item?.manager ?? coordinator; }
function ownerFor(assignment?: Assignment) {
  if (!assignment || assignment.stage === "Central Allocation") return `Central Allocation · ${coordinator}`;
  if (assignment.stage === "Reporting Manager") return `Reporting Manager · ${assignment.manager ?? "Unassigned"}`;
  return `BDA · ${assignment.bda ?? "Unassigned"}`;
}
function teamFor(owner: string) {
  const user = initialUsers.find(item => item.name === owner);
  return { department: user?.department || "—", team: user?.team || "—" };
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
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [storageReady, setStorageReady] = useState(false);
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All sources");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [ownerFilter, setOwnerFilter] = useState("All owners");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("All assignment types");
  const [page, setPage] = useState(1);

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
  const selectedAssignment = selected ? assignments[selected.id] : undefined;
  const targetStage = stageForTarget(targetRole);
  const assigneeOptions = targetRole === "Reporting Manager" ? managers : targetRole === "BDA" ? bdas : [];
  const filteredLeads = leadSet.filter(lead => {
    const assignment = assignments[lead.id];
    const owner = assignment ? ownerLabel(assignment) : "";
    const query = search.trim().toLowerCase();
    return (!query || [lead.name, lead.code, lead.phone].some(value => value.toLowerCase().includes(query)))
      && (sourceFilter === "All sources" || lead.source === sourceFilter)
      && (categoryFilter === "All categories" || lead.category === categoryFilter)
      && (ownerFilter === "All owners" || owner === ownerFilter)
      && (stageFilter === "All stages" || assignment?.stage === stageFilter);
  });
  const filteredHistory = tab === "Assignment History" ? history.filter(item => {
    const query = historySearch.trim().toLowerCase();
    return (!query || [item.opportunityId, item.leadId, item.previousOwner, item.newOwner, item.assignedBy, item.assignmentReason].some(value => value.toLowerCase().includes(query)))
      && (historyTypeFilter === "All assignment types" || item.assignmentType === historyTypeFilter);
  }) : [];
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil((tab === "Assign Leads" ? filteredLeads.length : filteredHistory.length) / pageSize));
  const currentPage = Math.min(page, pages);
  const leadRows = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const historyRows = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visibleCount = tab === "Assign Leads" ? filteredLeads.length : filteredHistory.length;
  const currentNewOwner = targetRole === "Central Allocation" ? `Central Allocation · ${coordinator}` : `${targetRole} · ${assignee || "Select an owner"}`;
  const previousOwner = selected ? ownerFor(selectedAssignment) : "—";
  const previousStaff = selectedAssignment?.stage === "BDA Assignment" ? selectedAssignment.bda : selectedAssignment?.stage === "Reporting Manager" ? selectedAssignment.manager : coordinator;
  const previousTeam = selectedAssignment?.stage === "Central Allocation" ? { department: teamFor(coordinator).department, team: "Central Allocation" } : teamFor(previousStaff ?? coordinator);
  const newTeam = targetRole === "Central Allocation" ? { department: teamFor(coordinator).department, team: "Central Allocation" } : teamFor(assignee);
  const previewDateTime = dateTime(new Date());
  const managerOwnerFilter = Array.from(new Set([...managers, ...bdas]));

  function openAssignment(lead: Lead, suggestedTarget?: TargetRole) {
    const current = assignments[lead.id];
    const target = suggestedTarget ?? (current?.stage === "Central Allocation" ? "Reporting Manager" : "BDA");
    const options = target === "Reporting Manager" ? managers : target === "BDA" ? bdas : [];
    setSelectedId(lead.id);
    if (!checked.includes(lead.id)) setChecked([]);
    setTargetRole(target);
    setAssignee(options[0] ?? "");
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
          ? { stage: nextStage }
          : targetRole === "Reporting Manager"
            ? { stage: nextStage, manager: assignee }
            : { stage: nextStage, manager: current[lead.id]?.manager, bda: assignee };
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

  return <div className="assignment-project-shell">
    <aside className="assignment-sidebar" aria-label="CRM navigation">
      <div className="assignment-brand"><div className="assignment-brand-mark">IF</div><div><strong>iFranchise</strong><span>CRM</span></div></div>
      <nav className="assignment-primary-nav" aria-label="Lead assignment"><button className="assignment-side-link is-active" type="button"><RiLayoutColumnLine />Lead Assignment</button></nav>
      <div className="assignment-account"><span>AK</span><div><strong>Anitha K</strong><small>Lead Coordinator</small></div><RiMoreLine /></div>
    </aside>

    <main className="assignment-main">
      <div className="assignment-page-header">
        <div className="assignment-title-icon"><RiGroupLine /></div>
        <div className="assignment-title-copy"><h1>{tab === "Assign Leads" ? "Lead Assignment" : "Assignment History"}</h1><p>{tab === "Assign Leads" ? "Allocate and distribute opportunities from central allocation to reporting managers and BDAs." : "Complete record of all lead assignments, reassignments and transfers."}</p></div>
        <div className="assignment-header-meta"><span><strong>{leadSet.length}</strong> incoming</span><span><strong>{Object.values(assignments).filter(item => item.stage === "Central Allocation").length}</strong> awaiting allocation</span><span className="assignment-user-avatar">AK</span></div>
      </div>

      <div className="assignment-content">
        <div className="assignment-tabs" role="tablist" aria-label="Assignment views">
          {tabItems.map(label => <button key={label} role="tab" aria-selected={tab === label} className={tab === label ? "is-active" : ""} onClick={() => { setTab(label); setPage(1); }}>{label}</button>)}
          {tab === "Assign Leads" && checked.length > 0 ? <Button className="assignment-bulk-button" leadingIcon={RiArrowRightLine} onClick={() => { const lead = leadSet.find(item => item.id === checked[0]); if (lead) openAssignment(lead); }}>Assign {checked.length} selected</Button> : null}
        </div>

        {tab === "Assign Leads" ? <section className="assignment-table-panel">
          <div className="assignment-toolbar">
            <SearchField aria-label="Search opportunities" placeholder="Search by name, phone or opportunity ID" value={search} onChange={value => { setSearch(value); setPage(1); }} className="assignment-search-field" />
            <Select aria-label="Filter by assignment stage" selectedKey={stageFilter} onSelectionChange={key => { setStageFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter" triggerClassName="w-full"><SelectItem key="All stages" id="All stages">All stages</SelectItem>{stages.map(stage => <SelectItem key={stage} id={stage}>{stage}</SelectItem>)}</Select>
            <Select aria-label="Filter by source" selectedKey={sourceFilter} onSelectionChange={key => { setSourceFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter" triggerClassName="w-full"><SelectItem key="All sources" id="All sources">All sources</SelectItem>{Array.from(new Set(leadSet.map(lead => lead.source))).map(source => <SelectItem key={source} id={source}>{source}</SelectItem>)}</Select>
            <Select aria-label="Filter by category" selectedKey={categoryFilter} onSelectionChange={key => { setCategoryFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter" triggerClassName="w-full"><SelectItem key="All categories" id="All categories">All categories</SelectItem>{Array.from(new Set(leadSet.map(lead => lead.category))).map(category => <SelectItem key={category} id={category}>{category}</SelectItem>)}</Select>
            <Select aria-label="Filter by owner" selectedKey={ownerFilter} onSelectionChange={key => { setOwnerFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter assignment-filter-owner" triggerClassName="w-full"><SelectItem key="All owners" id="All owners">All owners</SelectItem>{managerOwnerFilter.map(owner => <SelectItem key={owner} id={owner}>{owner}</SelectItem>)}</Select>
          </div>
          {checked.length > 0 ? <div className="assignment-bulk-row"><span>{checked.length} selected</span><Button size="small" leadingIcon={RiArrowRightLine} onClick={() => { const lead = leadSet.find(item => item.id === checked[0]); if (lead) openAssignment(lead); }}>Assign selected</Button><Button size="small" variant="ghost" onClick={() => setChecked([])}>Clear selection</Button></div> : null}
          <div className="assignment-table-scroll">
            <Table aria-label="Opportunities for assignment" size="sm" className="assignment-record-table" containerClassName="assignment-table-overflow" selectionMode="multiple" selectedKeys={new Set(checked)} onSelectionChange={(keys: Selection) => setChecked(keys === "all" ? leadRows.map(lead => lead.id) : Array.from(keys, key => String(key)))} onRowAction={key => { const lead = leadSet.find(item => item.id === String(key)); if (lead) openAssignment(lead); }}>
              <TableHeader columns={assignmentColumns}>{column => <TableColumn isRowHeader={"isRowHeader" in column ? column.isRowHeader : false}>{column.id === "select" ? <Checkbox slot="selection" aria-label="Select all opportunities" /> : column.name}</TableColumn>}</TableHeader>
              <TableBody items={leadRows}>
                {lead => <TableRow columns={assignmentColumns} className="assignment-record-row cursor-pointer outline-none">
                  {column => <TableCell>
                    {column.id === "select" && <Checkbox slot="selection" aria-label={`Select ${lead.name}`} />}
                    {column.id === "opportunity" && <span className="assignment-opportunity"><strong>{lead.name}</strong><small>{lead.code}</small></span>}
                    {column.id === "source" && <span className={`assignment-source source-${lead.source.toLowerCase().replace(/[^a-z]/g, "")}`}>{lead.source}</span>}
                    {column.id === "category" && <span className="assignment-category">{lead.category}</span>}
                    {column.id === "owner" && <span className="assignment-owner"><span>{assignments[lead.id]?.stage === "Central Allocation" ? "—" : initials(ownerLabel(assignments[lead.id]))}</span><span><strong>{assignments[lead.id]?.stage === "Central Allocation" ? "Unassigned" : ownerLabel(assignments[lead.id])}</strong><small>{assignments[lead.id]?.stage === "Central Allocation" ? "Central Allocation" : assignments[lead.id]?.stage}</small></span></span>}
                    {column.id === "stage" && <Chip variant="caption" color={assignmentStageColors[assignments[lead.id]?.stage ?? "Central Allocation"]} className="assignment-stage-pill">{assignments[lead.id]?.stage ?? "Central Allocation"}</Chip>}
                    {column.id === "created" && <span className="assignment-created">{lead.when}</span>}
                    {column.id === "action" && <Button size="small" variant="secondary" leadingIcon={RiArrowRightLine} onClick={event => { event.stopPropagation(); openAssignment(lead); }}>{assignments[lead.id]?.stage === "Central Allocation" ? "Assign" : "Reassign"}</Button>}
                  </TableCell>}
                </TableRow>}
              </TableBody>
            </Table>
            {leadRows.length === 0 ? <div className="assignment-empty-state">No opportunities match these filters.</div> : null}
          </div>
          <div className="assignment-pager"><span>Showing {visibleCount ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, visibleCount)} of {visibleCount} opportunities</span><div><button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><RiArrowLeftSLine /></button><span>Page {currentPage} of {pages}</span><button aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><RiArrowRightSLine /></button></div></div>
        </section> : <section className="assignment-table-panel assignment-history-panel">
          <div className="assignment-toolbar assignment-history-toolbar"><SearchField aria-label="Search assignment history" placeholder="Search opportunity, owner or reason" value={historySearch} onChange={value => { setHistorySearch(value); setPage(1); }} className="assignment-search-field" /><Select aria-label="Filter by assignment type" selectedKey={historyTypeFilter} onSelectionChange={key => { setHistoryTypeFilter(String(key)); setPage(1); }} size="sm" className="assignment-filter" triggerClassName="w-full"><SelectItem key="All assignment types" id="All assignment types">All assignment types</SelectItem>{["Initial Assignment", "Reassignment", "Transfer"].map(type => <SelectItem key={type} id={type}>{type}</SelectItem>)}</Select></div>
          <div className="assignment-table-scroll"><Table aria-label="Assignment history" size="sm" className="assignment-history-table" containerClassName="assignment-table-overflow"><TableHeader columns={[{ id: "opportunityId", name: "Opportunity ID" }, { id: "assignmentType", name: "Assignment Type" }, { id: "previousOwner", name: "Previous Owner" }, { id: "newOwner", name: "New Owner" }, { id: "assignedBy", name: "Assigned By" }, { id: "previousTeam", name: "Previous Department / Team" }, { id: "newTeam", name: "New Department / Team" }, { id: "dateTime", name: "Date & Time" }, { id: "reason", name: "Reason" }]}>{column => <TableColumn>{column.name}</TableColumn>}</TableHeader><TableBody items={historyRows}>{item => <TableRow columns={[{ id: "opportunityId" }, { id: "assignmentType" }, { id: "previousOwner" }, { id: "newOwner" }, { id: "assignedBy" }, { id: "previousTeam" }, { id: "newTeam" }, { id: "dateTime" }, { id: "reason" }]}>{column => <TableCell>
            {column.id === "opportunityId" && <span className="assignment-history-id"><strong>{item.opportunityId}</strong><small>{item.leadId}</small></span>}
            {column.id === "assignmentType" && <Chip variant="caption" color={item.assignmentType === "Initial Assignment" ? "purple" : item.assignmentType === "Transfer" ? "blue" : "yellow"} className="assignment-stage-pill">{item.assignmentType}</Chip>}
            {column.id === "previousOwner" && item.previousOwner}
            {column.id === "newOwner" && item.newOwner}
            {column.id === "assignedBy" && item.assignedBy}
            {column.id === "previousTeam" && `${item.previousDepartment} / ${item.previousTeam}`}
            {column.id === "newTeam" && `${item.newDepartment} / ${item.newTeam}`}
            {column.id === "dateTime" && <span className="assignment-history-date">{item.assignmentDate}<small>{item.assignmentTime}</small></span>}
            {column.id === "reason" && item.assignmentReason}
          </TableCell>}</TableRow>}</TableBody></Table>{historyRows.length === 0 ? <div className="assignment-empty-state">No assignment history matches these filters.</div> : null}</div>
          <div className="assignment-pager"><span>Showing {visibleCount ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, visibleCount)} of {visibleCount} records</span><div><button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><RiArrowLeftSLine /></button><span>Page {currentPage} of {pages}</span><button aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><RiArrowRightSLine /></button></div></div>
        </section>}
      </div>
    </main>

    <Modal isOpen={Boolean(selected)} onOpenChange={open => { if (!open) { setSelectedId(null); setChecked([]); } }} size="xl" className="assignment-confirm-dialog" aria-label="Assign opportunity">
      {selected ? <>
        <ModalHeader title={targetRole === "Central Allocation" ? "Return Opportunity to Central Allocation" : targetRole === "BDA" ? "Assign Opportunity to BDA" : "Assign Opportunity"} description={targetRole === "BDA" ? "Distribute this opportunity to a sales BDA." : undefined} icon={RiGroupLine} />
        <ModalBody className="assignment-confirm-body">
          <div className="assignment-lead-summary"><div className="summary-icon"><RiStore2Line /></div><div className="summary-contact"><small>{selected.code}</small><strong>{selected.name}</strong><span><RiUserLine />{selected.email}<RiPhoneLine />{selected.phone}</span></div><div className="summary-data"><small>Source</small><strong>{selected.source}</strong></div><div className="summary-data"><small>Enquiry category</small><strong>{selected.category}</strong></div><div className="summary-data"><small>Created on</small><strong><RiCalendarLine />{selected.when}</strong></div></div>
          <div className="assignment-hierarchy"><strong>Assignment hierarchy</strong><div className="hierarchy-track">{stages.map((stage, index) => { const current = selectedAssignment?.stage === stage; const passed = (selectedAssignment ? stages.indexOf(selectedAssignment.stage) : 0) > index; const Icon = index === 0 ? RiLayoutColumnLine : index === 1 ? RiUserLine : RiGroupLine; return <div className={`hierarchy-stage ${current ? "is-current" : ""} ${passed ? "is-passed" : ""}`} key={stage}><Icon /><span>{stage === "BDA Assignment" ? "BDA" : stage}{current ? <small>(Current stage)</small> : null}</span>{index < stages.length - 1 ? <RiArrowRightLine className="hierarchy-arrow" /> : null}</div>; })}</div></div>
          <div className="assignment-target"><strong>Assign to <i>*</i></strong><div className="target-options">{(selectedAssignment?.stage === "Central Allocation" ? ["Reporting Manager", "BDA"] as const : ["Central Allocation", "Reporting Manager", "BDA"] as const).map(role => <label key={role}><input type="radio" name="assignment-target" checked={targetRole === role} onChange={() => { const next = role as TargetRole; setTargetRole(next); setAssignee((next === "Reporting Manager" ? managers : next === "BDA" ? bdas : [])[0] ?? ""); }} />{role}</label>)}</div></div>
          <div className="assignment-confirm-fields">
            {targetRole !== "Central Allocation" ? <div className="assignee-field"><label htmlFor="assignment-assignee">Select {targetRole === "Reporting Manager" ? "reporting manager" : "BDA"} <i>*</i></label><select id="assignment-assignee" value={assignee} onChange={event => setAssignee(event.target.value)}>{assigneeOptions.map(name => <option key={name}>{name}</option>)}</select></div> : <div className="assignee-field"><label>New owner</label><div className="central-owner-preview">Central Allocation · {coordinator}</div></div>}
            <div className="assignment-reason-field"><label htmlFor="assignment-reason">Assignment reason <i>*</i></label><textarea id="assignment-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={200} placeholder="Enter reason for assignment…" /><small>{reason.length} / 200</small></div>
          </div>
          <div className="assignment-info-note"><RiCheckboxCircleLine /><span>{targetRole === "Central Allocation" ? "The opportunity will return to the central allocation queue." : `Only active, eligible ${targetRole === "Reporting Manager" ? "reporting managers" : "BDAs"} in your authorized sales operations can be selected.`}</span></div>
          <div className="assignment-audit-preview"><span>Previous owner: <strong>{previousOwner}</strong></span><span>New owner: <strong>{currentNewOwner}</strong></span><span>Assigned by: <strong>{coordinator}</strong></span><span>Team: <strong>{previousTeam.department} / {previousTeam.team} → {newTeam.department} / {newTeam.team}</strong></span><span>Recorded: <strong>{previewDateTime.date}, {previewDateTime.time}</strong></span></div>
          {checked.length > 1 ? <p className="bulk-hint">This assignment applies to {checked.length} opportunities. Each lead gets its own owner, team, date, time, reason and assignment type in history.</p> : null}
        </ModalBody>
        <ModalFooter className="assignment-modal-footer"><div className="assignment-footer-note"><RiCheckboxCircleLine /><span>Assignment history records previous and new owners, assigned by, date, time and reason.</span></div><Button variant="secondary" onClick={() => { setSelectedId(null); setChecked([]); }}>Cancel</Button><Button leadingIcon={RiArrowRightLine} onClick={saveAssignments} disabled={!reason.trim() || (targetRole !== "Central Allocation" && !assignee)}>{targetRole === "Central Allocation" ? "Return to Central Allocation" : `Assign to ${targetRole === "Reporting Manager" ? "Manager" : "BDA"}`}</Button></ModalFooter>
      </> : null}
    </Modal>
  </div>;
}
