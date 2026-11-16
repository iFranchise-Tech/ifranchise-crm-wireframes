"use client";

import { useEffect, useState } from "react";
import { RiArrowRightLine, RiCalendarLine, RiCheckboxCircleLine, RiGroupLine, RiHistoryLine, RiLayoutColumnLine, RiListCheck2, RiMoreLine, RiPhoneLine, RiSearchLine, RiStackLine, RiStore2Line, RiUserLine, RiUserAddLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
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
  const [view, setView] = useState<"board" | "list">("board");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<Stage | null>(null);
  const [targetRole, setTargetRole] = useState<TargetRole>("Reporting Manager");
  const [assignee, setAssignee] = useState(managers[0] ?? "");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [storageReady, setStorageReady] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All sources");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [ownerFilter, setOwnerFilter] = useState("All owners");
  const [openMenu, setOpenMenu] = useState<Stage | null>(null);

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
    const owner = assignments[lead.id] ? ownerLabel(assignments[lead.id]) : "";
    const query = search.trim().toLowerCase();
    return (!query || [lead.name, lead.code, lead.phone].some(value => value.toLowerCase().includes(query)))
      && (sourceFilter === "All sources" || lead.source === sourceFilter)
      && (categoryFilter === "All categories" || lead.category === categoryFilter)
      && (ownerFilter === "All owners" || owner === ownerFilter);
  });
  const filteredHistory = tab === "Assignment History" ? history : [];
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
    setOpenMenu(null);
  }

  function openColumnAction(stage: Stage, action: "assign" | "bulk" | "transfer" | "history" | "details") {
    setOpenMenu(null);
    if (action === "history") { setTab("Assignment History"); return; }
    const lead = leadSet.find(item => assignments[item.id]?.stage === stage);
    if (action === "bulk" && checked.length) {
      const selectedLead = leadSet.find(item => item.id === checked[0]);
      if (selectedLead) openAssignment(selectedLead, stage === "Central Allocation" ? "Reporting Manager" : "BDA");
      return;
    }
    if (lead) openAssignment(lead, action === "assign" && stage === "Central Allocation" ? "Reporting Manager" : "BDA");
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, stage: Stage) {
    event.preventDefault();
    setDropTarget(null);
    const leadId = event.dataTransfer.getData("text/opportunity-id");
    const lead = leadSet.find(item => item.id === leadId);
    if (!lead || assignments[lead.id]?.stage === stage) return;
    openAssignment(lead, stage === "Central Allocation" ? "Central Allocation" : stage === "Reporting Manager" ? "Reporting Manager" : "BDA");
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
          {tabItems.map(label => <button key={label} role="tab" aria-selected={tab === label} className={tab === label ? "is-active" : ""} onClick={() => setTab(label)}>{label}</button>)}
          {tab === "Assign Leads" && checked.length > 0 ? <Button className="assignment-bulk-button" leadingIcon={RiArrowRightLine} onClick={() => { const lead = leadSet.find(item => item.id === checked[0]); if (lead) openAssignment(lead); }}>Assign {checked.length} selected</Button> : null}
          <div className="assignment-view-toggle" role="group" aria-label="Board layout"><button aria-pressed={view === "board"} className={view === "board" ? "is-active" : ""} onClick={() => setView("board")} aria-label="Board view"><RiLayoutColumnLine /></button><button aria-pressed={view === "list"} className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label="List view"><RiListCheck2 /></button></div>
        </div>

        {tab === "Assign Leads" ? <>
          <div className="assignment-toolbar">
            <label className="assignment-search"><RiSearchLine /><input aria-label="Search opportunities" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by opportunity ID, company or phone…" /></label>
            <select aria-label="Filter by source" value={sourceFilter} onChange={event => setSourceFilter(event.target.value)}><option>All sources</option>{Array.from(new Set(leadSet.map(lead => lead.source))).map(source => <option key={source}>{source}</option>)}</select>
            <select aria-label="Filter by category" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option>All categories</option>{Array.from(new Set(leadSet.map(lead => lead.category))).map(category => <option key={category}>{category}</option>)}</select>
            <select aria-label="Filter by owner" value={ownerFilter} onChange={event => setOwnerFilter(event.target.value)}><option>All owners</option>{managerOwnerFilter.map(owner => <option key={owner}>{owner}</option>)}</select>
          </div>
          <div className="assignment-board-wrap"><div className={`assignment-board ${view === "list" ? "is-list" : ""}`}>
            {stages.map((stage, stageIndex) => {
              const Icon = stageIndex === 0 ? RiStackLine : stageIndex === 1 ? RiUserLine : RiGroupLine;
              const rows = filteredLeads.filter(lead => assignments[lead.id]?.stage === stage);
              return <section className={`assignment-lane lane-${stageIndex} ${dropTarget === stage ? "is-drop-target" : ""}`} key={stage} aria-label={stage} onDragOver={event => { event.preventDefault(); setDropTarget(stage); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null); }} onDrop={event => handleDrop(event, stage)}>
                <header className="assignment-lane-header"><div className="lane-icon"><Icon /></div><div className="lane-heading"><h2>{stage}</h2><p>{stage === "Central Allocation" ? "New opportunities from all sources." : stage === "Reporting Manager" ? "Assigned to reporting managers." : "Assigned to sales BDAs."}</p></div><span className="lane-count">{rows.length}</span><div className="lane-menu-wrap"><button className="lane-menu-trigger" aria-label={`${stage} actions`} aria-expanded={openMenu === stage} onClick={() => setOpenMenu(openMenu === stage ? null : stage)}><RiMoreLine /></button>{openMenu === stage ? <div className="lane-menu" role="menu"><button role="menuitem" onClick={() => openColumnAction(stage, "assign")}><RiUserAddLine />Assign {stageIndex === 0 ? "to reporting manager" : "opportunity"}</button><button role="menuitem" disabled={!checked.length} onClick={() => openColumnAction(stage, "bulk")}><RiStackLine />Bulk assign</button><button role="menuitem" onClick={() => openColumnAction(stage, "transfer")}><RiHistoryLine />Reassign / transfer</button><button role="menuitem" onClick={() => openColumnAction(stage, "history")}><RiHistoryLine />View assignment history</button></div> : null}</div></header>
                <div className="assignment-lane-list">{rows.map(lead => <article key={lead.id} className={`assignment-lead ${checked.includes(lead.id) ? "is-checked" : ""}`} draggable tabIndex={0} aria-label={`${lead.name}, ${lead.code}. Drag to change assignment stage, or open to assign.`} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openAssignment(lead); } }} onDragStart={event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/opportunity-id", lead.id); }} onDragEnd={() => setDropTarget(null)} onClick={() => openAssignment(lead)}>
                  <Checkbox aria-label={`Select ${lead.name}`} isSelected={checked.includes(lead.id)} onClick={event => event.stopPropagation()} onChange={isSelected => setChecked(current => isSelected ? [...current, lead.id] : current.filter(id => id !== lead.id))} />
                  <div className="assignment-lead-main"><span className="lead-card-top"><span>{lead.code}</span><time>{lead.when}</time></span><strong>{lead.name}</strong><span className="lead-phone"><RiPhoneLine />{lead.phone}</span><span className="lead-tags"><em className={`source-tag source-${lead.source.toLowerCase().replace(/[^a-z]/g, "")}`}>{lead.source}</em><em>{lead.category}</em></span>{assignments[lead.id]?.stage !== "Central Allocation" ? <span className="lead-owner"><span>{initials(ownerLabel(assignments[lead.id]))}</span>{ownerLabel(assignments[lead.id])}</span> : null}</div>
                </article>)}</div>
                {!rows.length ? <p className="assignment-empty">{search || sourceFilter !== "All sources" || categoryFilter !== "All categories" || ownerFilter !== "All owners" ? "No matching opportunities" : "Drop an opportunity here"}</p> : null}
              </section>;
            })}
          </div></div>
        </> : <section className="assignment-history-panel"><div className="history-scroll"><table><thead><tr><th>Opportunity ID</th><th>Lead ID</th><th>Assignment type</th><th>Previous owner</th><th>New owner</th><th>Assigned by</th><th>Previous department / team</th><th>New department / team</th><th>Assignment date</th><th>Assignment time</th><th>Reason</th></tr></thead><tbody>{filteredHistory.map(item => <tr key={item.id}><td>{item.opportunityId}</td><td>{item.leadId}</td><td><span className={`history-kind kind-${item.assignmentType.toLowerCase().split(" ")[0]}`}>{item.assignmentType}</span></td><td>{item.previousOwner}</td><td>{item.newOwner}</td><td>{item.assignedBy}</td><td>{item.previousDepartment} / {item.previousTeam}</td><td>{item.newDepartment} / {item.newTeam}</td><td>{item.assignmentDate}</td><td>{item.assignmentTime}</td><td>{item.assignmentReason}</td></tr>)}</tbody></table>{filteredHistory.length === 0 ? <p className="assignment-empty">No assignment history yet.</p> : null}</div></section>}
      </div>
    </main>

    <Modal isOpen={Boolean(selected)} onOpenChange={open => { if (!open) { setSelectedId(null); setChecked([]); } }} size="xl" className="assignment-confirm-dialog" aria-label="Assign opportunity">
      {selected ? <>
        <ModalHeader title={targetRole === "Central Allocation" ? "Return Opportunity to Central Allocation" : targetRole === "BDA" ? "Assign Opportunity to BDA" : "Assign Opportunity"} description={targetRole === "BDA" ? "Distribute this opportunity to a sales BDA." : undefined} icon={RiGroupLine} />
        <ModalBody className="assignment-confirm-body">
          <div className="assignment-lead-summary"><div className="summary-icon"><RiStore2Line /></div><div className="summary-contact"><small>{selected.code}</small><strong>{selected.name}</strong><span><RiUserLine />{selected.email}<RiPhoneLine />{selected.phone}</span></div><div className="summary-data"><small>Source</small><strong>{selected.source}</strong></div><div className="summary-data"><small>Enquiry category</small><strong>{selected.category}</strong></div><div className="summary-data"><small>Created on</small><strong><RiCalendarLine />{selected.when}</strong></div></div>
          <div className="assignment-hierarchy"><strong>Assignment hierarchy</strong><div className="hierarchy-track">{stages.map((stage, index) => { const current = selectedAssignment?.stage === stage; const passed = (selectedAssignment ? stages.indexOf(selectedAssignment.stage) : 0) > index; const Icon = index === 0 ? RiStackLine : index === 1 ? RiUserLine : RiGroupLine; return <div className={`hierarchy-stage ${current ? "is-current" : ""} ${passed ? "is-passed" : ""}`} key={stage}><Icon /><span>{stage === "BDA Assignment" ? "BDA" : stage}{current ? <small>(Current stage)</small> : null}</span>{index < stages.length - 1 ? <RiArrowRightLine className="hierarchy-arrow" /> : null}</div>; })}</div></div>
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
