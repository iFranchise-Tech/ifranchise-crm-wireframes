"use client";

import Link from "next/link";
import { useMemo, useState, type Key } from "react";
import {
  RiAddLine, RiAlertLine, RiArrowRightSLine, RiBuilding4Line, RiCheckLine, RiDatabaseLine,
  RiDownload2Line, RiFileList3Line, RiFileShield2Line, RiGlobalLine, RiGroupLine, RiHistoryLine,
  RiLock2Line, RiMore2Line, RiOrganizationChart, RiRefreshLine, RiSearchLine, RiShieldCheckLine,
  RiShieldUserLine, RiTimeLine, RiUpload2Line, RiUserLine,
} from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { cx } from "@/utils/cx";
import {
  securityGroups, securityProfiles, securitySeeds, sectionDescriptions,
  type SecurityProfile, type SecurityRecord, type SecuritySection,
} from "../data";
import "./security.css";

const sectionIcons: Record<SecuritySection, typeof RiDatabaseLine> = {
  Overview: RiDatabaseLine,
  "Data Directory": RiDatabaseLine,
  "Duplicate Management": RiGroupLine,
  "Data Merge & Corrections": RiRefreshLine,
  "Import Management": RiUpload2Line,
  "Export Management": RiDownload2Line,
  "Role-Based Access": RiShieldCheckLine,
  "Record-Level Restrictions": RiShieldUserLine,
  "Authentication & Sessions": RiLock2Line,
  "File & Document Security": RiFileShield2Line,
  "Sensitive Data Protection": RiLock2Line,
  "Data Retention & Deletion": RiTimeLine,
  "Audit Logs": RiHistoryLine,
  "Security Monitoring": RiAlertLine,
  "Security Incidents": RiAlertLine,
  "Backup & Recovery": RiDatabaseLine,
  "Data Synchronization": RiRefreshLine,
  "Privacy & Compliance": RiFileList3Line,
};

type Workflow = { mode: string; row?: SecurityRecord; step?: number };
type Column = { id: string; name: string; isRowHeader?: boolean };

const statusOptions = ["All statuses", "Active", "Review", "Completed", "Failed", "Open", "Verified", "Protected", "Restricted"];
const actionPermissions = ["View", "Create", "Edit", "Delete", "Assign", "Approve", "Verify", "Export", "Configure", "Administer"];
const permissionsMatrix = [
  { role: "CEO / Super Admin", scope: "Organization-wide", allowed: "All actions · policy controlled" },
  { role: "Reporting Manager", scope: "Authorized team", allowed: "View · Assign · Approve · team reports" },
  { role: "BDA / Sales Employee", scope: "Assigned opportunities", allowed: "View · Create · Edit · authorized activity" },
  { role: "Marketing", scope: "Authorized marketing leads", allowed: "View · Create · Edit · campaign attribution" },
  { role: "Finance", scope: "Payments & invoices", allowed: "View · Edit · Approve · Verify" },
  { role: "MIS / Operations", scope: "Authorized reports", allowed: "View · approved report export" },
  { role: "Brand Administrator", scope: "Assigned brand only", allowed: "View · Edit · brand documents" },
  { role: "Brand Representative", scope: "Assigned brand · limited", allowed: "View · authorized enquiries" },
  { role: "HR", scope: "People & recruitment", allowed: "View · Create · Edit · authorized export" },
  { role: "IT Administrator", scope: "Technical operations", allowed: "View · Configure · technical Administer" },
];

function statusColor(value: string): ChipColor {
  const normalized = value.toLowerCase();
  if (/verified|completed|active|protected|healthy|contained|resolved|closed|ready for import/.test(normalized)) return "lime";
  if (/review|pending|failed|blocked|high|investigation|conflict|attention|due|detected/.test(normalized)) return /failed|blocked|high|detected/.test(normalized) ? "rose" : "yellow";
  if (/restricted|confidential/.test(normalized)) return "neutral";
  return "neutral";
}

function isStatusColumn(id: string) {
  return /status|result|severity|classification|confidence|health|verification|retry|access/i.test(id);
}

function RowActions({ section, row, profile, onAction }: { section: SecuritySection; row: SecurityRecord; profile: SecurityProfile; onAction: (action: string, row: SecurityRecord) => void }) {
  const options = section === "Duplicate Management" ? ["Compare records", "Review merge"]
    : section === "Data Merge & Corrections" ? ["View merge details", "Review correction"]
      : section === "Import Management" ? ["View validation", "Preview import", ...(row.Status === "Ready for Import" && profile === "CEO / Super Admin" ? ["Confirm import"] : [])]
        : section === "Export Management" ? ["View export details", "Download preview"]
          : section === "Authentication & Sessions" ? ["View access details", ...(row.Status === "Active" && (profile === "CEO / Super Admin" || profile === "IT Administrator") ? ["Revoke session"] : [])]
            : section === "File & Document Security" ? ["View file details", "Preview protected file", "Request download"]
              : section === "Data Retention & Deletion" ? ["View policy", "Request archive review", "Request deletion review"]
                : section === "Security Monitoring" ? ["View signal", "Create incident"]
                  : section === "Security Incidents" ? ["View incident", "Update investigation", "Change status"]
                    : section === "Backup & Recovery" ? ["View backup details", ...(row.Status === "Verified" ? ["Request recovery test"] : [])]
                      : section === "Data Synchronization" ? ["View sync details", ...(row.Retry === "Eligible" ? ["Retry synchronization"] : [])]
                        : section === "Privacy & Compliance" ? ["View request", "Update request"]
                          : ["View details", ...(section === "Role-Based Access" && (profile === "CEO / Super Admin" || profile === "IT Administrator") ? ["Preview effective access", "Edit permissions"] : [])];
  return <Dropdown><DropdownTrigger aria-label={`Actions for ${row.id}`} className="sec-more-trigger"><RiMore2Line className="size-5" /></DropdownTrigger><DropdownPopover aria-label={`Actions for ${row.id}`} placement="bottom end">{options.map(option => <DropdownItem key={option} onSelect={() => onAction(option, row)}>{option}</DropdownItem>)}</DropdownPopover></Dropdown>;
}

export function SecurityWorkspace({ view = "Overview" }: { view?: string }) {
  const [section, setSection] = useState<SecuritySection>((["Overview", ...securityGroups.flatMap(group => group.sections)] as string[]).includes(view) ? view as SecuritySection : "Overview");
  const [profile, setProfile] = useState<SecurityProfile>("CEO / Super Admin");
  const [records, setRecords] = useState(securitySeeds);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all");
  const [sortKey, setSortKey] = useState("");
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [notice, setNotice] = useState("");
  const [auditEvents, setAuditEvents] = useState<SecurityRecord[]>(securitySeeds["Audit Logs"].slice(0, 4));
  const [incidentStatus, setIncidentStatus] = useState("Under Investigation");
  const [requestText, setRequestText] = useState("");

  const canBulkTransfer = profile === "CEO / Super Admin";
  const isAdmin = profile === "CEO / Super Admin" || profile === "IT Administrator";
  const visibleGroups = securityGroups.map(group => ({ ...group, sections: group.sections.filter(item => {
    if (item === "Import Management" || item === "Export Management") return canBulkTransfer;
    if (["Role-Based Access", "Authentication & Sessions", "Sensitive Data Protection", "Data Retention & Deletion", "Security Monitoring", "Security Incidents", "Backup & Recovery", "Data Synchronization"].includes(item)) return isAdmin || (item === "Data Retention & Deletion" && profile === "HR") || (item === "Data Synchronization" && profile === "MIS / Operations");
    if (item === "Audit Logs") return isAdmin || ["Finance", "HR", "MIS / Operations"].includes(profile);
    if (item === "Data Merge & Corrections" || item === "Duplicate Management") return isAdmin || ["Reporting Manager", "BDA / Sales Employee", "Marketing"].includes(profile);
    return true;
  }) })).filter(group => group.sections.length > 0);

  const allRows = section === "Overview" ? [] : records[section as Exclude<SecuritySection, "Overview">];
  const filterField = allRows[0] ? Object.keys(allRows[0]).find(key => /status|result|severity|health/i.test(key)) ?? ({ "Data Directory": "Classification", "Duplicate Management": "Confidence", "Role-Based Access": "Scope", "Record-Level Restrictions": "Role", "File & Document Security": "Category", "Sensitive Data Protection": "Category", "Audit Logs": "Module", "Security Monitoring": "Source", "Backup & Recovery": "Verification", "Data Synchronization": "Service", "Privacy & Compliance": "Request" } as Partial<Record<SecuritySection, string>>)[section] ?? "" : "";
  const filterValues = [...new Set(allRows.map(row => filterField ? row[filterField] : "").filter(Boolean))];
  const filterAllLabel = filterField && !/status|result|severity|health/i.test(filterField) ? `All ${filterField.toLowerCase()}s` : "All statuses";
  const filteredRows = useMemo(() => allRows.filter(row => {
    const haystack = Object.values(row).join(" ").toLowerCase();
    const scopedAway = profile === "Brand Representative" && /Finance|payment|invoice|candidate|internal audit/i.test(haystack);
    const filterValue = filterField ? row[filterField] ?? "" : "";
    return !scopedAway && haystack.includes(query.trim().toLowerCase()) && (statusFilter === "__all" || filterValue.toLowerCase().includes(statusFilter.toLowerCase()));
  }).sort((a, b) => sortKey ? (a[sortKey] ?? "").localeCompare(b[sortKey] ?? "") * (ascending ? 1 : -1) : 0), [allRows, ascending, filterAllLabel, filterField, profile, query, sortKey, statusFilter]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column[] = allRows[0] ? Object.keys(allRows[0]).filter(key => key !== "id").map((key, index) => ({ id: key, name: key, isRowHeader: index === 0 })) : [];

  function addAudit(action: string, resource: string) {
    const next: SecurityRecord = { id: `AUD-${8842 + auditEvents.length}`, User: profile, Module: "Data Management & Security", Record: resource, Action: action, "Previous value": "—", "New value": "Preview action recorded", "Date and time": "21 Nov 2026, 9:30 am", "IP · device": "Preview environment", Result: "Simulated" };
    setAuditEvents(events => [next, ...events].slice(0, 8));
  }

  function setSectionAndReset(next: SecuritySection) {
    setSection(next);
    setQuery("");
    setStatusFilter("__all");
    setSelected([]);
    setNotice("");
    setPage(1);
    setSortKey("");
  }

  function applyAction(action: string, row?: SecurityRecord) {
    setWorkflow({ mode: action, row });
    if (["Retry synchronization", "Request archive review", "Request deletion review", "Request download", "Download preview", "Confirm import", "Create incident"].includes(action)) addAudit(action, row?.id ?? section);
  }

  function finishWorkflow() {
    const action = workflow?.mode ?? "Update";
    const row = workflow?.row;
    if (action === "Retry synchronization" && row) updateRecord("Data Synchronization", row.id, { Status: "Queued", Retry: "Queued for review" });
    if (action === "Revoke session" && row) updateRecord("Authentication & Sessions", row.id, { Status: "Revoked", Event: "Session revoked · simulated" });
    if (action === "Change status" && row) updateRecord("Security Incidents", row.id, { Status: incidentStatus });
    if (action === "Confirm import" && row) updateRecord("Import Management", row.id, { Status: "Importing" });
    if (action === "Upload import file") prependRecord("Import Management", { id: "IMP-1043", File: "contacts_upload.csv", Module: "Contacts", Records: "248", Errors: "0", Duplicates: "12 to review", "Uploaded by": profile, "Updated at": "Just now", Status: "Importing" });
    if (action === "Create export" || action === "Export selected records") prependRecord("Export Management", { id: "EXP-2092", Scope: action === "Create export" ? "Contacts · filtered records" : `${selected.length} selected records`, Format: "CSV", Filters: "Current filters · permission scoped", Fields: "Permitted fields only", "Requested by": profile, "Created at": "Just now", Status: "Ready for review" });
    if ((action === "Create incident" || action === "Record incident") && !row) prependRecord("Security Incidents", { id: "INC-2026-015", Type: "Access review", Severity: "Medium", Description: requestText || "Administrator review", Detected: "Just now", Owner: profile, Resource: "Review workspace", Notes: "Created in the preview", Status: "Under Investigation" });
    if (action === "Revoke selected sessions") selected.forEach(id => updateRecord("Authentication & Sessions", id, { Status: "Revoked", Event: "Session revoked · simulated" }));
    if ((action === "Review merge" || action === "Confirm merge preview") && row) prependRecord("Data Merge & Corrections", { id: `MRG-${3010 + records["Data Merge & Corrections"].length}`, Contact: row.Contact || "Reviewed contact pair", Primary: "CON-18420", Merged: row["Potential match"] || "CON-20183", "Linked enquiries": "All preserved", "Activity history": "All events preserved", "Performed by": profile, "Updated at": "Just now", Status: "Completed" });
    addAudit(action, row?.id ?? section);
    setNotice(`${action} recorded in this preview. No production data or services were changed.`);
    setWorkflow(null);
    setRequestText("");
  }

  function updateRecord(target: keyof typeof securitySeeds, id: string, changes: Partial<SecurityRecord>) {
    setRecords(current => ({ ...current, [target]: current[target].map(row => row.id === id ? { ...row, ...changes } : row) }));
  }

  function prependRecord(target: keyof typeof securitySeeds, record: SecurityRecord) {
    setRecords(current => ({ ...current, [target]: [record, ...current[target]] }));
  }

  function selectAll(keys: "all" | Set<Key>) {
    setSelected(keys === "all" ? filteredRows.map(row => row.id) : Array.from(keys).map(String));
  }

  function handleMetric(name: string, target: SecuritySection, filter?: string) {
    if ((target === "Import Management" || target === "Export Management") && !canBulkTransfer) {
      setNotice("Bulk import and export controls are available to CEO / Super Admin only.");
      return;
    }
    setSectionAndReset(target);
    if (filter && filterField) setStatusFilter(filter);
    setNotice(`${name} · showing the related records.`);
  }

  const navigation = <nav className="review-navigation sec-navigation" aria-label="Data management and security navigation">
    <Link className="review-overview-link" href="/library/modules/security" aria-current={section === "Overview" ? "page" : undefined} onClick={event => { event.preventDefault(); setSectionAndReset("Overview"); }}><RiDatabaseLine aria-hidden="true" />Overview</Link>
    {visibleGroups.map(group => <div className="sec-nav-group" key={group.title}><p>{group.title}</p>{group.sections.map(item => { const SectionIcon = sectionIcons[item]; return <Link key={item} className="review-overview-link" href={`/library/modules/security?view=${encodeURIComponent(item)}`} aria-current={section === item ? "page" : undefined} onClick={event => { event.preventDefault(); setSectionAndReset(item); }}><SectionIcon aria-hidden="true" /><span>{item}</span></Link>; })}</div>)}
  </nav>;

  const toolbar = <div className="sec-toolbar-controls"><span className="text-caption-1-regular text-text-tertiary">Review profile</span><Select aria-label="Review profile" selectedKey={profile} onSelectionChange={key => { setProfile(String(key) as SecurityProfile); setSelected([]); }} className="w-52" triggerClassName="h-9"><SelectItem id="CEO / Super Admin">CEO / Super Admin</SelectItem><SelectItem id="Reporting Manager">Reporting Manager</SelectItem><SelectItem id="BDA / Sales Employee">BDA / Sales Employee</SelectItem><SelectItem id="Marketing">Marketing</SelectItem><SelectItem id="Finance">Finance</SelectItem><SelectItem id="MIS / Operations">MIS / Operations</SelectItem><SelectItem id="Brand Administrator">Brand Administrator</SelectItem><SelectItem id="Brand Representative">Brand Representative</SelectItem><SelectItem id="HR">HR</SelectItem><SelectItem id="IT Administrator">IT Administrator</SelectItem></Select></div>;

  return <DirectionProvider locale="en-US"><ReviewShell className="security-shell" moduleName="Data Management & Security" icon="database" subtitle="Data governance & protection" overviewHref="/library/modules/security" title={section} navigation={navigation} moduleDropdown controls={toolbar}>
    <div className="sec-board flex h-full min-h-0 flex-col gap-5 overflow-hidden p-5 text-text-primary sm:p-6">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-title-2-medium">{section}</h2><p className="mt-1 text-body-regular text-text-secondary">{sectionDescriptions[section]}</p></div><div className="flex flex-wrap items-center gap-2"><Chip variant="caption" color="neutral">Preview data</Chip>{section !== "Overview" && <Button leadingIcon={section === "Import Management" ? RiUpload2Line : section === "Export Management" ? RiDownload2Line : RiAddLine} onClick={() => section === "Audit Logs" ? (addAudit("Audit report exported", "Filtered audit history"), setNotice("Audit report prepared in this preview.")) : applyAction(section === "Import Management" ? "Upload import file" : section === "Export Management" ? "Create export" : section === "Security Incidents" ? "Create incident" : section === "Data Merge & Corrections" ? "Start correction" : section === "Data Retention & Deletion" ? "Request archive review" : "Add review record")}>{section === "Import Management" ? "Upload file" : section === "Export Management" ? "Create export" : section === "Security Incidents" ? "Record incident" : section === "Data Merge & Corrections" ? "Start correction" : section === "Data Retention & Deletion" ? "Request archive" : section === "Audit Logs" ? "Export audit report" : "Add record"}</Button>}</div></header>
      <div className="sec-preview-banner"><RiLock2Line className="size-4 shrink-0" /><span>Prototype preview · sensitive actions are simulated and recorded here. Backend authorization, secure storage and production operations still require server-side implementation.</span></div>
      {notice && <div className="sec-notice" role="status"><RiCheckLine className="size-4 shrink-0" />{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}>Dismiss</button></div>}
      {section === "Overview" ? <Overview onMetric={handleMetric} auditEvents={auditEvents} onNavigate={setSectionAndReset} /> : <>
        {section === "Role-Based Access" && <div className="sec-permission-strip"><div><span className="text-caption-1-semibold text-text-tertiary">Action-level controls</span><div className="mt-2 flex flex-wrap gap-1.5">{actionPermissions.map(permission => <Chip key={permission} variant="caption" color="neutral">{permission}</Chip>)}</div></div><Button variant="secondary" size="small" onClick={() => applyAction("Preview effective access")}>Preview effective access</Button></div>}
        {section === "Record-Level Restrictions" && <div className="sec-access-preview"><span className="text-body-2-medium text-text-primary">Effective access preview</span><Select aria-label="Choose profile to preview" selectedKey={profile} onSelectionChange={key => setProfile(String(key) as SecurityProfile)} className="w-64" triggerClassName="h-9">{securityProfiles.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><p className="text-caption-1-regular text-text-secondary">Showing expected record boundaries for {profile}. Backend and database policies must enforce every protected operation.</p></div>}
        {section === "Authentication & Sessions" && <div className="sec-safety-note"><RiShieldCheckLine className="size-4" /><span>MFA status is shown only where configured. Passwords, authentication tokens and secrets are never displayed.</span></div>}
        {section === "Sensitive Data Protection" && <div className="sec-safety-note"><RiLock2Line className="size-4" /><span>PAN is not used for duplicate detection. Sensitive values are masked in this review dataset.</span></div>}
        {section === "Privacy & Compliance" && <div className="sec-safety-note"><RiFileList3Line className="size-4" /><span>Configured controls are shown for review. This prototype does not certify legal or regulatory compliance.</span></div>}
        <section className="sec-data-panel flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="sec-filters"><Input aria-label={`Search ${section.toLowerCase()}`} placeholder={`Search ${section.toLowerCase()}`} leadingIcon={RiSearchLine} value={query} onChange={value => { setQuery(value); setPage(1); }} className="min-w-48 flex-1" /><Select aria-label={`Filter by ${filterField || "status"}`} selectedKey={statusFilter} onSelectionChange={key => { setStatusFilter(String(key)); setPage(1); }} className="w-48"><SelectItem id="__all">{filterAllLabel}</SelectItem>{filterValues.map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select>{section === "Import Management" && <Button variant="secondary" leadingIcon={RiDownload2Line} onClick={() => { addAudit("Import template downloaded", "Contacts template"); setNotice("Import template prepared in this preview."); }}>Template</Button>}{section === "Export Management" && <Select aria-label="Export format" selectedKey="CSV" onSelectionChange={key => setNotice(`${String(key)} selected for the preview request.`)} className="w-32"><SelectItem id="Excel">Excel</SelectItem><SelectItem id="CSV">CSV</SelectItem><SelectItem id="PDF">PDF</SelectItem></Select>}</div>
          {selected.length > 0 && <div className="sec-bulk-bar"><strong>{selected.length} selected</strong><span>{section === "Data Directory" ? "Review selected entities" : "Available actions for this selection"}</span>{section === "Export Management" && canBulkTransfer && <Button size="small" onClick={() => applyAction("Export selected records")}>Export selected</Button>}{section === "Authentication & Sessions" && isAdmin && <Button variant="secondary" size="small" onClick={() => applyAction("Revoke selected sessions")}>Revoke sessions</Button>}<Button variant="ghost" size="small" onClick={() => setSelected([])}>Clear selection</Button></div>}
          <div className="sec-table-scroll min-h-0 flex-1 overflow-auto"><Table aria-label={section} size="sm" selectionMode="multiple" selectedKeys={new Set(selected)} onSelectionChange={selectAll} className="sec-table"><TableHeader columns={[{ id: "__select", name: "Select" }, ...columns, { id: "__actions", name: "Actions" }]}>{column => <TableColumn id={column.id} isRowHeader={column.isRowHeader} onClick={column.id.startsWith("__") ? undefined : () => { setAscending(sortKey === column.id ? !ascending : true); setSortKey(column.id); }} className={cx(column.id === "__select" && "w-12", column.id === "__actions" && "w-16 text-end", !column.id.startsWith("__") && "cursor-pointer")}>{column.id === "__select" ? <Checkbox slot="selection" aria-label="Select all visible records" isSelected={filteredRows.length > 0 && filteredRows.every(row => selected.includes(row.id))} isDisabled={filteredRows.length === 0} /> : <>{column.name}{sortKey === column.id ? ascending ? " ↑" : " ↓" : ""}</>}</TableColumn>}</TableHeader><TableBody items={pageRows} renderEmptyState={() => <div className="p-10 text-center text-body-regular text-text-secondary">No records match these filters.</div>}>{row => <TableRow id={row.id} columns={[{ id: "__select", name: "Select" }, ...columns, { id: "__actions", name: "Actions" }]} className="sec-table-row">{column => column.id === "__select" ? <TableCell><Checkbox slot="selection" aria-label={`Select ${row.id}`} /></TableCell> : column.id === "__actions" ? <TableCell><RowActions section={section} row={row} profile={profile} onAction={applyAction} /></TableCell> : <TableCell><CellValue id={column.id} value={row[column.id] || "—"} /></TableCell>}</TableRow>}</TableBody></Table></div>
          <footer className="sec-table-footer"><span>{filteredRows.length} records · Preview data</span><div className="flex items-center gap-2"><Button variant="secondary" size="small" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button variant="secondary" size="small" disabled={page >= pageCount} onClick={() => setPage(value => value + 1)}>Next</Button></div></footer>
        </section>
      </>}
    </div>
    {workflow && <WorkflowModal workflow={workflow} section={section} profile={profile} selectedCount={selected.length} requestText={requestText} setRequestText={setRequestText} incidentStatus={incidentStatus} setIncidentStatus={setIncidentStatus} onClose={() => setWorkflow(null)} onNext={() => setWorkflow(current => current ? current.mode === "Compare records" ? { ...current, mode: "Review merge" } : { ...current, step: (current.step ?? 0) + 1 } : null)} onConfirm={finishWorkflow} />}
  </ReviewShell></DirectionProvider>;
}

function CellValue({ id, value }: { id: string; value: string }) {
  if (isStatusColumn(id)) return <Chip variant="caption" color={statusColor(value)}>{value}</Chip>;
  return <span className={cx(id === "id" && "font-medium", "sec-cell-value")} title={value}>{value}</span>;
}

function Overview({ onMetric, auditEvents, onNavigate }: { onMetric: (name: string, target: SecuritySection, filter?: string) => void; auditEvents: SecurityRecord[]; onNavigate: (section: SecuritySection) => void }) {
  const metrics: { name: string; value: string; note: string; section: SecuritySection; filter?: string }[] = [
    { name: "Total CRM records", value: "96,420", note: "Across 21 connected entities", section: "Data Directory" },
    { name: "Potential duplicates", value: "3", note: "Awaiting contact review", section: "Duplicate Management", filter: "Review" },
    { name: "Pending import jobs", value: "2", note: "1 validation issue · 1 ready", section: "Import Management" },
    { name: "Recent data exports", value: "4", note: "Last 7 days · scope recorded", section: "Export Management" },
  ];
  return <div className="min-h-0 flex-1 overflow-y-auto"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">{metrics.map(item => <button type="button" key={item.name} className="sec-metric text-start" onClick={() => onMetric(item.name, item.section, item.filter)}><span className="text-body-2-regular text-text-secondary">{item.name}</span><strong className="text-title-2-medium text-text-primary">{item.value}</strong><span className="text-caption-1-regular text-text-tertiary">{item.note}</span><span className="mt-1 inline-flex items-center gap-1 text-caption-1-medium text-accent-700">Open section <RiArrowRightSLine className="size-4" /></span></button>)}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      <section className="sec-panel"><div className="sec-panel-heading"><div><h3>Access & reliability</h3><p>Current review signals across the CRM</p></div><Button variant="secondary" size="small" onClick={() => onNavigate("Security Monitoring")}>Review controls</Button></div><div className="sec-status-list">{[["Active users", "118", "Authentication & Sessions"], ["Failed login attempts", "3 · review", "Authentication & Sessions"], ["Security incidents", "1 open · 2 in progress", "Security Incidents"], ["Backup status", "Verified · 21 Nov, 2:08 am", "Backup & Recovery"], ["Synchronization failures", "1 failed · 1 conflict review", "Data Synchronization"]].map(([label, value, target]) => <button key={label} type="button" onClick={() => onNavigate(target as SecuritySection)}><span><strong>{label}</strong><small>{value}</small></span><RiArrowRightSLine className="size-4 text-text-tertiary" /></button>)}</div></section>
      <section className="sec-panel"><div className="sec-panel-heading"><div><h3>Data quality</h3><p>Contact integrity and import checks</p></div><Button variant="secondary" size="small" onClick={() => onNavigate("Duplicate Management")}>Review matches</Button></div><div className="sec-quality"><div><span>Duplicate candidates</span><strong>3 <Chip variant="caption" color="yellow">Review needed</Chip></strong></div><div><span>Imports with validation errors</span><strong>1 <Chip variant="caption" color="rose">8 invalid rows</Chip></strong></div><div><span>Linked history protected</span><strong>100% <Chip variant="caption" color="lime">Relationships retained</Chip></strong></div><p>Matching phone or email details never triggers an automatic merge. Enquiries and opportunities remain independently traceable.</p></div></section>
      <section className="sec-panel"><div className="sec-panel-heading"><div><h3>Recent security activity</h3><p>Administrative actions recorded in the preview</p></div><Button variant="secondary" size="small" onClick={() => onNavigate("Audit Logs")}>View audit log</Button></div><div className="sec-status-list">{auditEvents.slice(0, 4).map(row => <div key={row.id}><span><strong>{row.Action}</strong><small>{row.User} · {row.Record}</small></span><Chip variant="caption" color={statusColor(row.Result)}>{row.Result}</Chip></div>)}</div></section>
      <section className="sec-panel"><div className="sec-panel-heading"><div><h3>Pending reviews</h3><p>Actions that need an authorized owner</p></div><Button variant="secondary" size="small" onClick={() => onNavigate("Security Incidents")}>Review queue</Button></div><div className="sec-status-list">{[["3 contact matches", "Duplicate Management"], ["2 import jobs need review", "Import Management"], ["1 security incident detected", "Security Incidents"], ["42 recordings approaching retention", "Data Retention & Deletion"]].map(([label, target]) => <button key={label} type="button" onClick={() => onNavigate(target as SecuritySection)}><span><strong>{label}</strong><small>Open review queue</small></span><RiArrowRightSLine className="size-4 text-text-tertiary" /></button>)}</div></section>
      <div className="sec-compliance-note xl:col-span-2"><RiLock2Line className="size-4 shrink-0" /> Controls shown here are review data. Production authorization must be enforced by backend and database policies; this screen is not a compliance certification.</div>
    </div></div>;
}

function WorkflowModal({ workflow, section, profile, selectedCount, requestText, setRequestText, incidentStatus, setIncidentStatus, onClose, onNext, onConfirm }: { workflow: Workflow; section: SecuritySection; profile: SecurityProfile; selectedCount: number; requestText: string; setRequestText: (value: string) => void; incidentStatus: string; setIncidentStatus: (value: string) => void; onClose: () => void; onNext: () => void; onConfirm: () => void }) {
  const row = workflow.row;
  const mode = workflow.mode;
  const detailMode = /view|preview protected file|compare records|preview effective access/i.test(mode);
  const dangerMode = /revoke session|deletion|recovery|confirm import|retry synchronization/i.test(mode);
  const title = mode === "Upload import file" ? "Upload and validate import" : mode === "Create export" ? "Configure data export" : mode === "Review merge" || mode === "Compare records" ? "Compare contact records" : mode === "Preview effective access" ? "Effective access preview" : mode === "Change status" || mode === "Update investigation" ? "Update security incident" : mode === "Request recovery test" ? "Request recovery test" : mode;
  const description = mode === "Create export" || mode.includes("export") ? `${profile} · exports are restricted to CEO / Super Admin in this prototype.` : "Changes in this review are simulated and will be recorded in the preview history.";
  return <Modal isOpen onOpenChange={open => { if (!open) onClose(); }} size={mode === "Compare records" || mode === "Review merge" || mode === "Preview effective access" ? "xl" : "lg"} className="sec-modal"><ModalHeader title={title} description={description} icon={sectionIcons[section]} /><ModalBody>
    {detailMode && row && mode !== "Compare records" && <div className="sec-detail-grid">{Object.entries(row).filter(([key]) => key !== "id").map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div>}
    {(mode === "Compare records" || mode === "Review merge") && <div className="sec-compare"><div className="sec-compare-note"><RiAlertLine className="size-4" />Matching contact details do not prove that two enquiries or opportunities are duplicates. Choose a primary contact only after review.</div><div className="sec-compare-columns"><article><span>Primary candidate</span><h3>{row?.Contact ?? "CON-18420 · Ananya Rao"}</h3><p>Mobile · +91 98••• 10234</p><p>Email · an•••@mail.com</p><p>3 enquiries · 2 opportunities · 14 activities</p></article><article><span>Possible match</span><h3>{row?.["Potential match"] ?? "CON-20183 · Ananya R."}</h3><p>Mobile · +91 98••• 10234</p><p>Email · an•••@mail.com</p><p>2 enquiries · 1 opportunity · 6 activities</p></article></div><label className="sec-field"><span>Contact to keep as primary</span><Select aria-label="Primary contact" selectedKey="CON-18420"><SelectItem id="CON-18420">CON-18420 · Ananya Rao</SelectItem><SelectItem id="CON-20183">CON-20183 · Ananya R.</SelectItem></Select></label><div className="sec-preserve-note"><RiCheckLine className="size-4" />All enquiries, opportunities, activity history, assignments and source attribution are preserved in this merge preview.</div></div>}
    {(mode === "Upload import file" || mode === "Download import template") && ((workflow.step ?? 0) === 0 ? <div className="sec-form-grid"><Input label="Import file · CSV or Excel" type="file" aria-label="Choose CSV or Excel file" /><Select label="Destination module" selectedKey="Contacts"><SelectItem id="Contacts">Contacts</SelectItem><SelectItem id="Enquiries">Enquiries</SelectItem><SelectItem id="Candidates">Candidates</SelectItem><SelectItem id="Payments">Payments</SelectItem></Select><div className="sec-inline-note"><RiFileList3Line className="size-4" />Templates include required identifiers and approved fields. Validation checks mandatory data, formats and possible duplicates.</div><p className="sec-preview-caption">Allowed statuses: Uploaded → Validating → Validation Failed / Ready for Import → Importing → Completed / Partially Completed / Failed.</p></div> : <div className="sec-import-preview"><Chip variant="caption" color="lime">Ready for Import</Chip><h3>Validation preview</h3><p>248 rows checked · 0 required-field errors · 12 possible contact matches.</p><div><span>Valid rows</span><strong>236</strong></div><div><span>Potential duplicates to review</span><strong>12 · no automatic merge</strong></div><div><span>Relationships retained</span><strong>Enquiries · opportunities · source attribution</strong></div></div>)}
    {mode === "Create export" && <div className="sec-form-grid"><Select label="CRM module" selectedKey="Contacts"><SelectItem id="Contacts">Contacts</SelectItem><SelectItem id="Enquiries">Enquiries</SelectItem><SelectItem id="Opportunities">Opportunities</SelectItem><SelectItem id="Payments">Payments</SelectItem><SelectItem id="Audit Logs">Audit Logs</SelectItem></Select><Select label="File format" selectedKey="CSV"><SelectItem id="Excel">Excel</SelectItem><SelectItem id="CSV">CSV</SelectItem><SelectItem id="PDF">PDF report</SelectItem></Select><Input label="Filters / scope" placeholder="e.g. assigned region · active · date range" /><div className="sec-inline-note"><RiLock2Line className="size-4" />Only permitted records and fields are included. Sensitive fields are restricted; bulk export requires CEO / Super Admin authorization.</div></div>}
    {(mode === "Create incident" || mode === "Record incident") && <div className="sec-form-grid"><Input label="Incident type" placeholder="e.g. suspicious access" /><Select label="Severity" selectedKey="Medium"><SelectItem id="Low">Low</SelectItem><SelectItem id="Medium">Medium</SelectItem><SelectItem id="High">High</SelectItem><SelectItem id="Critical">Critical</SelectItem></Select><Input label="Related user or resource" placeholder="User ID, record or system" /><Input label="Assigned owner" placeholder="Choose an administrator" /><Input label="Investigation notes" placeholder="Initial context and containment steps" /><div className="sec-inline-note"><RiHistoryLine className="size-4" />Incident statuses: Detected · Under Investigation · Contained · Resolved · Closed. Each update is kept in the incident history.</div></div>}
    {(mode === "Change status" || mode === "Update investigation" || mode === "Update request" || mode === "Edit permissions" || mode === "Configure field" || mode === "Start correction" || mode === "Add review record" || mode === "Request archive review" || mode === "Request deletion review" || mode === "Request recovery test" || mode === "Request download" || mode === "Update" || mode === "Preview effective access") && <div className="sec-form-grid">{(mode === "Change status" || mode === "Update investigation") && <Select label="Incident status" selectedKey={incidentStatus} onSelectionChange={key => setIncidentStatus(String(key))}><SelectItem id="Detected">Detected</SelectItem><SelectItem id="Under Investigation">Under Investigation</SelectItem><SelectItem id="Contained">Contained</SelectItem><SelectItem id="Resolved">Resolved</SelectItem><SelectItem id="Closed">Closed</SelectItem></Select>}<Input label="Owner or review reference" placeholder="Name or ticket reference" value={requestText} onChange={setRequestText} /><label className="sec-field"><span>Notes</span><textarea className="sec-textarea" placeholder="Add a short reason or investigation note" value={requestText} onChange={event => setRequestText(event.target.value)} /></label><div className="sec-inline-note"><RiLock2Line className="size-4" />Confirmation is recorded in preview history. Backend permission checks are required before production use.</div></div>}
    {mode === "Revoke session" && <div className="sec-confirm-copy"><strong>Revoke the selected session?</strong><p>The preview will mark this session as revoked. Production access revocation requires server-side identity controls.</p><div className="sec-detail-grid">{row && Object.entries(row).slice(0, 5).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div></div>}
    {mode === "Revoke selected sessions" && <div className="sec-confirm-copy"><strong>Revoke {selectedCount} selected session{selectedCount === 1 ? "" : "s"}?</strong><p>All selected sessions will be marked revoked in this preview. Production access revocation requires server-side identity controls.</p></div>}
    {mode === "Retry synchronization" && <div className="sec-confirm-copy"><strong>Queue a safe retry?</strong><p>This preview queues the event for review. Conflicts with a newer web record must be resolved before retrying.</p>{row && <div className="sec-inline-note">{row.Record} · {row.Conflict}</div>}</div>}
    {mode === "Confirm import" && <div className="sec-confirm-copy"><strong>Confirm import preview for {row?.File}?</strong><p>{row?.Records} records · {row?.Errors} validation errors · {row?.Duplicates} potential duplicates. This action changes only the local preview status.</p></div>}
    {mode === "Export selected records" && <div className="sec-confirm-copy"><strong>Review the export scope</strong><p>{selectedCount} selected records will use the current filters and permission scope. The file is not generated by this prototype.</p></div>}
    {detailMode && !row && <div className="sec-inline-note">Choose an employee profile to see the effective record and field boundaries. Frontend visibility is not a security boundary.</div>}
    <p className="sec-preview-caption">Prototype only · No production records, credentials, files, backups or connected services are changed.</p>
  </ModalBody><ModalFooter><Button variant="secondary" onClick={onClose}>Cancel</Button>{detailMode && mode === "Compare records" ? <Button onClick={onNext}>Review merge</Button> : mode === "Review merge" ? <Button onClick={onConfirm}>Confirm merge preview</Button> : mode === "Upload import file" && (workflow.step ?? 0) === 0 ? <Button leadingIcon={RiCheckLine} onClick={onNext}>Validate file</Button> : mode === "Upload import file" ? <Button onClick={onConfirm}>Confirm import preview</Button> : <Button variant={dangerMode || mode === "Revoke selected sessions" ? "danger" : "primary"} onClick={onConfirm}>{mode === "Revoke session" ? "Revoke session" : mode === "Revoke selected sessions" ? "Revoke sessions" : mode === "Retry synchronization" ? "Queue retry" : mode === "Request deletion review" ? "Submit review request" : mode === "Request recovery test" ? "Request test" : mode === "Confirm import" ? "Confirm import" : mode === "Export selected records" ? "Confirm export scope" : mode === "Preview protected file" ? "Request authorized preview" : mode.startsWith("Request") ? "Submit request" : "Save preview"}</Button>}</ModalFooter></Modal>;
}
