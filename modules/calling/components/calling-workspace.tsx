"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RiAddLine, RiDownloadLine, RiEyeLine, RiFilter3Line, RiPhoneLine, RiSearchLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Icon } from "@/modules/auth/components/icon";
import { initialEnquiries } from "@/modules/leads/data";
import { initialUsers } from "@/modules/users-roles/data";
import { addPreviewNotification } from "@/modules/notifications/store";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { DataTable, MetricCards, PageHeading, StatusLabel } from "@/modules/finance/components/shared";
import { detectCallingFlags, makeCallAudit, newCallId, useCallingStore } from "../store";
import type { CallDirection, CallRecord, CallStatus, CallingFlag, CallingFlagStatus, CallingSettings, CallingState } from "../types";
import "./calling-workspace.css";

const views = [
  ["Workspace", ["Overview", "Call History", "Call Activity"]],
  ["Call operations", ["Incoming Calls", "Outgoing Calls", "Unknown Numbers"]],
  ["Monitoring", ["Call Recordings", "Suspicious Activity", "Voicemail & Automated Calls"]],
  ["Insights & setup", ["Team Calling", "Call Reports", "Calling Settings"]],
] as const;
const allViews = views.flatMap(([, names]) => names);
const callListHeaders = ["Call ID", "Contact / customer", "Phone number", "Employee", "Opportunity", "Direction", "Date & time", "Connected duration", "Status", "Recording"];
const profiles = ["CEO / Super Admin", "Reporting Manager", "BDA / Sales Executive", "MIS / Operations Executive", "IT Administrator"];
const salesUsers = initialUsers.filter(user => user.status === "Active" && user.department === "Sales");
const displayDate = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
const durationText = (seconds: number) => `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
const connected = (call: CallRecord) => call.status === "Connected" || call.status === "Completed";
const fmtNumber = (value: number) => new Intl.NumberFormat("en-IN").format(value);

function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }
function downloadCalls(rows: CallRecord[]) {
  const data = [
    ["Call ID", "Contact", "Phone", "Employee", "Team", "Direction", "Opportunity", "Started", "Connected seconds", "Status", "Recording", "Sync status"],
    ...rows.map(call => [call.id, call.contactName ?? "Unknown", call.phone, call.employeeName, call.team, call.direction, call.opportunityId ?? "", call.startedAt, connected(call) ? call.durationSeconds : 0, call.status, call.recording, call.syncStatus]),
  ].map(row => row.map(csvCell).join(",")).join("\n");
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8" }));
  anchor.download = `calling-report-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click(); URL.revokeObjectURL(anchor.href);
}

function navHref(view: string) { return view === "Overview" ? "/library/modules/calling" : `/library/modules/calling?view=${encodeURIComponent(view)}`; }

export function CallingWorkspace({ view = "Overview" }: { view?: string }) {
  const current = allViews.includes(view as never) ? view : "Overview";
  const { state, update, error, ready } = useCallingStore();
  const [profile, setProfile] = useState("CEO / Super Admin");
  const [search, setSearch] = useState("");
  const [hiddenCallColumns, setHiddenCallColumns] = useState<number[]>([]);
  const [directionFilter, setDirectionFilter] = useState("All directions");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [employeeFilter, setEmployeeFilter] = useState("All employees");
  const [teamFilter, setTeamFilter] = useState("All teams");
  const [knownFilter, setKnownFilter] = useState("All numbers");
  const [recordingFilter, setRecordingFilter] = useState("All recordings");
  const [sortOrder, setSortOrder] = useState("Newest first");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [callModal, setCallModal] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [associationPhone, setAssociationPhone] = useState<string | null>(null);
  const [flagDetail, setFlagDetail] = useState<CallingFlag | null>(null);

  const roleUser = salesUsers.find(user => user.name === profile) ?? salesUsers[0];
  const canSeeAll = profile === "CEO / Super Admin" || profile === "MIS / Operations Executive";
  const canManageTeam = profile === "Reporting Manager";
  const canConfigure = profile === "CEO / Super Admin" || profile === "IT Administrator";
  const canReview = profile === "CEO / Super Admin" || profile === "Reporting Manager";
  const canExport = profile === "CEO / Super Admin" || profile === "MIS / Operations Executive" || profile === "Reporting Manager";
  const visibleCalls = useMemo(() => (state?.calls ?? []).filter(call => {
    if (canSeeAll) return true;
    if (canManageTeam) return call.team === (roleUser?.team || "Sales");
    return call.employeeId === roleUser?.id;
  }), [state?.calls, canSeeAll, canManageTeam, roleUser]);
  const visibleFlags = useMemo(() => (state?.flags ?? []).filter(flag => canSeeAll || (canManageTeam ? flag.employeeName === roleUser?.name || flag.employeeId === roleUser?.id : flag.employeeId === roleUser?.id)), [state?.flags, canSeeAll, canManageTeam, roleUser]);
  const callsInView = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleCalls.filter(call => {
      const inDate = (!fromDate || call.startedAt.slice(0, 10) >= fromDate) && (!toDate || call.startedAt.slice(0, 10) <= toDate);
      const matchesQuery = !query || Object.values(call).some(value => String(value ?? "").toLowerCase().includes(query));
      return inDate && matchesQuery
        && (directionFilter === "All directions" || call.direction === directionFilter)
        && (statusFilter === "All statuses" || call.status === statusFilter)
        && (employeeFilter === "All employees" || call.employeeName === employeeFilter)
        && (teamFilter === "All teams" || call.team === teamFilter)
        && (knownFilter === "All numbers" || (knownFilter === "Registered" ? !!call.contactId : !call.contactId))
        && (recordingFilter === "All recordings" || (recordingFilter === "Unavailable" ? call.recording === "Unavailable" || call.recording === "Not captured" : call.recording === recordingFilter));
    }).sort((a, b) => sortOrder === "Newest first" ? b.startedAt.localeCompare(a.startedAt) : a.startedAt.localeCompare(b.startedAt));
  }, [visibleCalls, search, fromDate, toDate, directionFilter, statusFilter, employeeFilter, teamFilter, knownFilter, recordingFilter, sortOrder]);
  const detailCall = visibleCalls.find(call => call.id === detailId) ?? null;
  const totalTalkSeconds = visibleCalls.filter(connected).reduce((sum, call) => sum + call.durationSeconds, 0);
  const incoming = visibleCalls.filter(call => call.direction === "Incoming");
  const outgoing = visibleCalls.filter(call => call.direction === "Outgoing");
  const missed = visibleCalls.filter(call => call.status === "Missed");
  const connectedCalls = visibleCalls.filter(connected);

  function saveCall(data: { contactId: string; direction: CallDirection; status: CallStatus; durationMinutes: string; employeeId: string }) {
    if (!state) return;
    const contact = initialEnquiries.find(item => item.id === data.contactId);
    const employee = initialUsers.find(item => item.id === data.employeeId) ?? roleUser;
    const createdAt = new Date().toISOString();
    const duration = connected({ status: data.status } as CallRecord) ? Math.max(0, Number(data.durationMinutes) || 0) * 60 : 0;
    const newCall: CallRecord = {
      id: newCallId(state.calls), contactId: contact?.id, contactName: contact?.name,
      phone: contact ? `+91 ${contact.mobile.slice(0, 5)} ${contact.mobile.slice(5)}` : "+91 98990 12345",
      employeeId: employee?.id ?? "IF2026002", employeeName: employee?.name ?? "Himani Bhargava Tapadiya", team: employee?.team || "Sales",
      opportunityId: contact?.salesPipeline ? contact.id : undefined, direction: data.direction, startedAt: createdAt,
      connectedAt: duration ? new Date(Date.now() + 15_000).toISOString() : undefined,
      endedAt: duration ? new Date(Date.now() + 15_000 + duration * 1000).toISOString() : undefined,
      durationSeconds: duration, ringingSeconds: duration ? 15 : 24, status: data.status,
      recording: "Unavailable", sourceDevice: "Not connected · preview entry", syncStatus: "Not connected",
    };
    update(prev => {
      const calls = [newCall, ...prev.calls];
      const detected = detectCallingFlags(calls, prev.settings);
      const flags = detected.map(flag => prev.flags.find(old => old.id === flag.id) ? { ...flag, ...prev.flags.find(old => old.id === flag.id) } : flag);
      return { ...prev, calls, flags, audit: [makeCallAudit(newCall.id, "Preview call added", `${newCall.direction} ${newCall.status.toLowerCase()} sample record; no Android call was placed.`), ...prev.audit] };
    });
    if (data.status === "Missed" && state.settings.managerMissedCallAlerts) createCallingNotice("Missed incoming call", `${contact?.name ?? "Unknown number"} · callback follow-up is required.`, newCall.id, "Incoming Calls");
    const oldFlagIds = new Set(state.flags.map(flag => flag.id));
    const newFlag = detectCallingFlags([newCall, ...state.calls], state.settings).find(flag => !oldFlagIds.has(flag.id));
    if (newFlag) createCallingNotice("Unregistered number activity needs review", `${newFlag.employeeName} · ${newFlag.count} calls to ${newFlag.phone}. This is an indicator, not a finding.`, newFlag.id, "Suspicious Activity");
    setCallModal(false); setDetailId(newCall.id);
  }

  function saveDisposition(call: CallRecord, disposition: string, note: string, followUpAt: string) {
    if (!state) return;
    update(prev => ({ ...prev, calls: prev.calls.map(item => item.id === call.id ? { ...item, disposition: disposition.trim() || item.disposition, note: note.trim(), followUpAt: followUpAt || undefined } : item), audit: [makeCallAudit(call.id, followUpAt ? "Disposition and callback saved" : "Call note saved", "Post-call notes updated; original call metadata was preserved.", roleUser?.name), ...prev.audit] }));
    if (followUpAt) createCallingNotice("Customer callback required", `${call.contactName ?? call.phone} · due ${followUpAt}`, call.id, "Incoming Calls");
  }

  function associateNumber(phone: string, contactId: string) {
    if (!state) return;
    const contact = initialEnquiries.find(item => item.id === contactId) ?? state.localContacts.find(item => item.id === contactId);
    if (!contact) return;
    update(prev => {
      const calls = prev.calls.map(call => call.phone === phone && !call.contactId ? { ...call, contactId: contact.id, contactName: contact.name, associationReviewed: true } : call);
      const flags = prev.flags.map(flag => flag.phone === phone ? { ...flag, contactName: contact.name } : flag);
      return { ...prev, calls, flags, audit: [makeCallAudit(phone, "Unknown number associated", `Linked to ${contact.name} (${contact.id}); original number and call history retained.`, roleUser?.name), ...prev.audit] };
    });
    setAssociationPhone(null);
  }

  function createLocalContact(phone: string, name: string, email: string) {
    if (!state || !name.trim()) return;
    const id = `CALL-CON-${crypto.randomUUID().slice(0, 7).toUpperCase()}`;
    update(prev => ({ ...prev, localContacts: [{ id, name: name.trim(), phone, email: email.trim(), createdAt: new Date().toISOString() }, ...prev.localContacts], calls: prev.calls.map(call => call.phone === phone && !call.contactId ? { ...call, contactId: id, contactName: name.trim(), associationReviewed: true } : call), audit: [makeCallAudit(phone, "Preview contact created", `${name.trim()} is stored in Calling Management preview only; it was not added to the CRM contact directory.`, roleUser?.name), ...prev.audit] }));
    setAssociationPhone(null);
  }

  function reviewFlag(flag: CallingFlag, status: CallingFlagStatus, remarks: string) {
    update(prev => ({ ...prev, flags: prev.flags.map(item => item.id === flag.id ? { ...item, status, reviewer: roleUser?.name ?? profile, remarks: remarks.trim() } : item), audit: [makeCallAudit(flag.id, `Flag ${status.toLowerCase()}`, remarks.trim() || "Review status updated.", roleUser?.name), ...prev.audit] }));
    setFlagDetail(null);
  }

  function updateSettings(patch: Partial<CallingSettings>) {
    if (!state || !canConfigure) return;
    const bounds: Partial<Record<keyof CallingSettings, [number, number]>> = { unknownRepeatThreshold: [2, 20], unknownLongCallMinutes: [1, 120], highFrequencyThreshold: [5, 100], recordingRetentionDays: [1, 3650] };
    for (const key of Object.keys(patch) as (keyof CallingSettings)[]) {
      const range = bounds[key];
      const value = patch[key];
      if (range && typeof value === "number") patch[key] = Math.max(range[0], Math.min(range[1], Math.round(value))) as never;
    }
    update(prev => {
      const settings = { ...prev.settings, ...patch };
      const detected = detectCallingFlags(prev.calls, settings);
      const flags = detected.map(flag => prev.flags.find(old => old.id === flag.id) ? { ...flag, ...prev.flags.find(old => old.id === flag.id) } : flag);
      return { ...prev, settings, flags, audit: [makeCallAudit("SETTINGS", "Calling settings updated", Object.keys(patch).join(", ")), ...prev.audit] };
    });
  }

  const nav = <nav className="review-navigation call-nav" aria-label="Calling Management navigation">
    {views.map(([group, groupViews]) => <section className="call-nav-group" key={group}><span className="call-nav-label">{group}</span>{groupViews.filter(name => navAllowed(name, profile)).map(name => <Link key={name} className="review-overview-link" href={navHref(name)} aria-current={current === name ? "page" : undefined}>{name === "Overview" ? <Icon name="chart" /> : name.includes("Incoming") ? <Icon name="phone" /> : name.includes("Outgoing") ? <Icon name="arrow" /> : name.includes("Record") ? <Icon name="lock" /> : name.includes("Suspicious") ? <Icon name="alert" /> : name.includes("Settings") ? <Icon name="settings" /> : <Icon name="layers" />}{name}</Link>)}</section>)}
  </nav>;

  return <ReviewShell moduleName="Calling Management" icon="phone" subtitle="Calling activity and oversight" overviewHref="/library/modules/calling" title={current} moduleDropdown navigation={nav} controls={<div className="call-profile-control"><span>Preview as</span><Select aria-label="Preview role" selectedKey={profile} onSelectionChange={key => { setProfile(String(key)); setPage(0); }} className="call-role-select">{profiles.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select></div>} className="calling-shell">
    <div className="review-information call-page-content"><div className="fin-content-limit">
      {error ? <div className="fin-error" role="alert">{error}</div> : null}
      {!ready || !state ? <p className="call-loading">Loading calling workspace…</p> : <>
        {current === "Overview" && <Overview calls={visibleCalls} flags={visibleFlags} talkSeconds={totalTalkSeconds} updateView={name => { window.location.href = navHref(name); }} />}
        {(["Call History", "Incoming Calls", "Outgoing Calls"] as string[]).includes(current) && <CallListPage current={current} rows={callsInView} search={search} setSearch={value => { setSearch(value); setPage(0); }} hiddenColumns={hiddenCallColumns} setHiddenColumns={setHiddenCallColumns} direction={directionFilter} setDirection={setDirectionFilter} status={statusFilter} setStatus={setStatusFilter} employee={employeeFilter} setEmployee={setEmployeeFilter} team={teamFilter} setTeam={setTeamFilter} sort={sortOrder} setSort={setSortOrder} known={knownFilter} setKnown={setKnownFilter} recording={recordingFilter} setRecording={setRecordingFilter} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} page={page} setPage={setPage} onAdd={() => setCallModal(true)} onOpen={call => setDetailId(call.id)} canExport={canExport} onExport={() => downloadCalls(callsInView)} />}
        {current === "Call Activity" && <ActivityPage calls={visibleCalls} onOpen={call => setDetailId(call.id)} />}
        {current === "Call Recordings" && <RecordingPage calls={visibleCalls} onOpen={call => setDetailId(call.id)} />}
        {current === "Unknown Numbers" && <UnknownPage calls={visibleCalls} onAssociate={phone => setAssociationPhone(phone)} onOpen={call => setDetailId(call.id)} />}
        {current === "Suspicious Activity" && <FlagsPage flags={visibleFlags} canReview={canReview} onOpen={flag => setFlagDetail(flag)} />}
        {current === "Voicemail & Automated Calls" && <VoicemailPage calls={visibleCalls} onOpen={call => setDetailId(call.id)} />}
        {current === "Team Calling" && <TeamPage calls={visibleCalls} />}
        {current === "Call Reports" && <ReportsPage calls={visibleCalls} flags={visibleFlags} onExport={downloadCalls} canExport={canExport} />}
        {current === "Calling Settings" && <SettingsPage state={state} canConfigure={canConfigure} onChange={updateSettings} />}
      </>}
    </div></div>

    <CallFormModal isOpen={callModal} onOpenChange={setCallModal} onSave={saveCall} profile={profile} />
    {detailCall ? <CallDetailPanel call={detailCall} onClose={() => setDetailId(null)} onSave={(disposition, note, followUp) => saveDisposition(detailCall, disposition, note, followUp)} canEditNote={profile === "CEO / Super Admin" || profile === "Reporting Manager" || detailCall.employeeId === roleUser?.id} /> : null}
    {associationPhone && state ? <AssociationModal phone={associationPhone} state={state} isOpen onClose={() => setAssociationPhone(null)} onAssociate={associateNumber} onCreate={createLocalContact} /> : null}
    {flagDetail ? <FlagReviewModal flag={flagDetail} isOpen onClose={() => setFlagDetail(null)} onSave={(status, remarks) => reviewFlag(flagDetail, status, remarks)} canReview={canReview} /> : null}
  </ReviewShell>;
}

function navAllowed(name: string, profile: string) {
  if (name === "Calling Settings") return profile === "CEO / Super Admin" || profile === "IT Administrator";
  if (["Suspicious Activity", "Team Calling"].includes(name)) return profile !== "BDA / Sales Executive";
  if (name === "Call Reports") return true;
  return true;
}

function Overview({ calls, flags, talkSeconds, updateView }: { calls: CallRecord[]; flags: CallingFlag[]; talkSeconds: number; updateView: (view: string) => void }) {
  const incoming = calls.filter(call => call.direction === "Incoming");
  const outgoing = calls.filter(call => call.direction === "Outgoing");
  const connectedCount = calls.filter(connected).length;
  const cards = [
    { label: "Incoming calls", value: fmtNumber(incoming.length), note: "Open incoming activity" },
    { label: "Outgoing calls", value: fmtNumber(outgoing.length), note: "Open outgoing activity" },
    { label: "Connected calls", value: fmtNumber(connectedCount), note: "Connected duration only" },
    { label: "Missed calls", value: fmtNumber(calls.filter(call => call.status === "Missed").length), note: "Callback review" },
  ];
  return <>
    <PageHeading title="Calling overview" description="Call activity, callback workload and review indicators from local preview records." />
    <div className="call-metric-grid">{cards.map((item, index) => <button type="button" key={item.label} className="call-metric-button" onClick={() => updateView(index === 0 ? "Incoming Calls" : index === 1 ? "Outgoing Calls" : "Call History")}><MetricCards items={[item]} /></button>)}</div>
    <div className="call-overview-grid">
      <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Incoming and outgoing</h3><p>Captured call metadata by direction</p></div><Link href={navHref("Call History")}>Call history</Link></div><div className="call-distribution"><div><span>Incoming</span><strong>{incoming.length}</strong><i style={{ width: `${calls.length ? Math.max(4, incoming.length / calls.length * 100) : 0}%` }} /></div><div><span>Outgoing</span><strong>{outgoing.length}</strong><i style={{ width: `${calls.length ? Math.max(4, outgoing.length / calls.length * 100) : 0}%` }} /></div><div><span>Connected talk time</span><strong>{durationText(talkSeconds)}</strong><small>Voicemail-suspected, missed and ringing time is not counted as conversation.</small></div></div></section>
      <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Recording synchronization</h3><p>Availability depends on the supported Android calling service.</p></div><Link href={navHref("Call Recordings")}>Review</Link></div><div className="call-sync-status"><StatusLabel>Unavailable</StatusLabel><p>Android capture and cloud storage are not configured. The sample call rows contain metadata only, not audio.</p><strong>{calls.filter(call => call.syncStatus === "Upload failed").length} sample upload failure(s) · no retry request was sent</strong></div></section>
      <section className="fin-panel call-recent-panel"><div className="fin-panel-heading"><div><h3>Recent missed calls</h3><p>Callback follow-up queue</p></div><Link href={navHref("Incoming Calls")}>Open queue</Link></div><CallTable rows={calls.filter(call => call.status === "Missed").slice(0, 4)} onOpen={call => updateView("Call History")} /></section>
      <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Recent suspicious indicators</h3><p>Flags are signals for authorized human review.</p></div><Link href={navHref("Suspicious Activity")}>Review flags</Link></div>{flags.length ? <ul className="call-flag-list">{flags.slice(0, 3).map(flag => <li key={flag.id}><span className="call-flag-icon"><Icon name="alert" /></span><div><strong>{flag.reason}</strong><small>{flag.employeeName} · {flag.count} calls · {durationText(flag.connectedSeconds)}</small></div><StatusLabel>{flag.status}</StatusLabel></li>)}</ul> : <p className="fin-empty">No review indicators in this view.</p>}</section>
    </div>
  </>;
}

function CallListPage({ current, rows, search, setSearch, hiddenColumns, setHiddenColumns, direction, setDirection, status, setStatus, employee, setEmployee, team, setTeam, sort, setSort, known, setKnown, recording, setRecording, fromDate, setFromDate, toDate, setToDate, filtersOpen, setFiltersOpen, page, setPage, onAdd, onOpen, canExport, onExport }: {
  current: string; rows: CallRecord[]; search: string; setSearch: (value: string) => void; hiddenColumns: number[]; setHiddenColumns: (columns: number[]) => void; direction: string; setDirection: (value: string) => void; status: string; setStatus: (value: string) => void; employee: string; setEmployee: (value: string) => void; team: string; setTeam: (value: string) => void; sort: string; setSort: (value: string) => void; known: string; setKnown: (value: string) => void; recording: string; setRecording: (value: string) => void; fromDate: string; setFromDate: (value: string) => void; toDate: string; setToDate: (value: string) => void; filtersOpen: boolean; setFiltersOpen: (open: boolean) => void; page: number; setPage: (value: number) => void; onAdd: () => void; onOpen: (call: CallRecord) => void; canExport: boolean; onExport: () => void;
}) {
  const filteredRows = current === "Incoming Calls" ? rows.filter(call => call.direction === "Incoming") : current === "Outgoing Calls" ? rows.filter(call => call.direction === "Outgoing") : rows;
  const actualTotal = filteredRows.length;
  const rowsForPage = filteredRows.slice(page * 10, page * 10 + 10);
  const activeFilterCount = [direction !== "All directions", status !== "All statuses", employee !== "All employees", team !== "All teams", known !== "All numbers", recording !== "All recordings", sort !== "Newest first", Boolean(fromDate), Boolean(toDate)].filter(Boolean).length;
  const resetFilters = () => { setDirection("All directions"); setStatus("All statuses"); setEmployee("All employees"); setTeam("All teams"); setKnown("All numbers"); setRecording("All recordings"); setSort("Newest first"); setFromDate(""); setToDate(""); };
  const filterControl = <Dropdown isOpen={filtersOpen} onOpenChange={setFiltersOpen}><DropdownTrigger className="call-filter-trigger call-filter-icon-only" aria-label="Call filters" aria-expanded={filtersOpen}><RiFilter3Line aria-hidden="true" />{activeFilterCount ? <span className="call-filter-count">{activeFilterCount}</span> : null}</DropdownTrigger><DropdownPopover aria-label="Call filters" placement="bottom end" offset={6} className="call-filter-popover" dialogClassName="call-filter-popover-dialog"><div className="call-filter-grid"><Select aria-label="Direction" selectedKey={direction} onSelectionChange={key => setDirection(String(key))}>{["All directions", "Incoming", "Outgoing"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Status" selectedKey={status} onSelectionChange={key => setStatus(String(key))}>{["All statuses", "Connected", "Completed", "Missed", "Rejected", "Busy", "Failed", "Voicemail suspected", "Initiated", "Ringing"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Employee" selectedKey={employee} onSelectionChange={key => setEmployee(String(key))}>{["All employees", ...salesUsers.map(user => user.name)].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Team" selectedKey={team} onSelectionChange={key => setTeam(String(key))}>{["All teams", ...Array.from(new Set(salesUsers.map(user => user.team)))].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Number match" selectedKey={known} onSelectionChange={key => setKnown(String(key))}>{["All numbers", "Registered", "Unknown"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Recording" selectedKey={recording} onSelectionChange={key => setRecording(String(key))}>{["All recordings", "Metadata only", "Upload failed", "Unavailable"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Sort order" selectedKey={sort} onSelectionChange={key => setSort(String(key))}><SelectItem id="Newest first">Newest first</SelectItem><SelectItem id="Oldest first">Oldest first</SelectItem></Select><Input aria-label="Start date" type="date" className="call-filter-date" fieldClassName="bg-background-primary-default text-text-primary ring-1 ring-border-button-default" value={fromDate} onChange={setFromDate} /><Input aria-label="End date" type="date" className="call-filter-date" fieldClassName="bg-background-primary-default text-text-primary ring-1 ring-border-button-default" value={toDate} onChange={setToDate} /></div><div className="call-filter-popover-footer"><span>{activeFilterCount ? `${activeFilterCount} filters active` : "All calls"}</span><Button variant="secondary" size="small" onClick={resetFilters}>Clear filters</Button></div></DropdownPopover></Dropdown>;
  const hiddenColumnControl = hiddenColumns.length ? <Dropdown><DropdownTrigger className="call-filter-trigger call-filter-icon-only" aria-label="Show hidden columns"><RiEyeLine aria-hidden="true" /><span className="call-filter-count">{hiddenColumns.length}</span></DropdownTrigger><DropdownPopover aria-label="Show hidden columns" placement="bottom end" className="call-hidden-columns-menu">{hiddenColumns.map(index => <DropdownItem key={index} onSelect={() => setHiddenColumns(hiddenColumns.filter(column => column !== index))}><RiEyeLine aria-hidden="true" /><span>Show {callListHeaders[index]}</span></DropdownItem>)}</DropdownPopover></Dropdown> : null;
  return <div className="call-history-page">
    <PageHeading title={current} description="Find a captured call, review its CRM relationship and inspect its original metadata." actions={<><Input aria-label="Search calls" placeholder="Search this page" leadingIcon={RiSearchLine} fieldClassName="border border-border-button-default bg-background-primary-default text-text-primary" value={search} onChange={setSearch} className="call-page-search" />{filterControl}{hiddenColumnControl}<Button variant="secondary" leadingIcon={RiDownloadLine} onClick={onExport} disabled={!canExport}>Export CSV</Button><Button leadingIcon={RiAddLine} onClick={onAdd}>Add preview call</Button></>} />
    <section className="fin-panel call-list-panel">
      <DataTable headers={callListHeaders} initialFrozenColumns={[0, 1]} hiddenColumns={hiddenColumns} onHiddenColumnsChange={setHiddenColumns} empty={!rowsForPage.length}>{rowsForPage.map(call => <tr key={call.id} className="call-row-clickable" tabIndex={0} onClick={() => onOpen(call)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(call); } }}><td><span className="call-link">{call.id}</span></td><td><span className="call-name-button">{call.contactName ?? "Unknown number"}</span></td><td dir="ltr">{call.phone}</td><td>{call.employeeName}</td><td>{call.opportunityId ? <Link href={`/library/modules/leads?enquiry=${encodeURIComponent(call.opportunityId)}`} onClick={event => event.stopPropagation()}>{call.opportunityId}</Link> : "—"}</td><td>{call.direction}</td><td>{displayDate(call.startedAt)}</td><td>{connected(call) ? durationText(call.durationSeconds) : "—"}</td><td><StatusLabel>{call.status}</StatusLabel></td><td><StatusLabel>{call.recording}</StatusLabel></td></tr>)}</DataTable>
      <div className="call-table-footer"><span>{actualTotal} records · preview data</span><div><Button variant="secondary" size="small" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Previous</Button><span>Page {Math.min(page + 1, Math.max(1, Math.ceil(actualTotal / 10)))} of {Math.max(1, Math.ceil(actualTotal / 10))}</span><Button variant="secondary" size="small" onClick={() => setPage(page + 1)} disabled={(page + 1) * 10 >= actualTotal}>Next</Button></div></div>
    </section>
  </div>;
}

function CallTable({ rows, onOpen }: { rows: CallRecord[]; onOpen: (call: CallRecord) => void }) {
  return <DataTable headers={["Call", "Customer", "Employee", "Direction", "Date", "Status"]} empty={!rows.length}>{rows.map(call => <tr key={call.id}><td><button className="call-link" onClick={() => onOpen(call)}>{call.id}</button></td><td>{call.contactName ?? call.phone}</td><td>{call.employeeName}</td><td>{call.direction}</td><td>{displayDate(call.startedAt)}</td><td><StatusLabel>{call.status}</StatusLabel></td></tr>)}</DataTable>;
}

function ActivityPage({ calls, onOpen }: { calls: CallRecord[]; onOpen: (call: CallRecord) => void }) {
  return <>
    <PageHeading title="Call activity" description="Latest call events linked to CRM contacts and opportunities." />
    <div className="call-timeline">
      {[...calls].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map(call => <article className="call-timeline-item" key={call.id}>
        <div className="call-timeline-marker"><Icon name="phone" /></div>
        <div className="call-timeline-content">
          <div className="call-activity-summary">
            <div className="call-activity-main">
              <div className="call-timeline-top"><strong>{call.direction} call <span aria-hidden="true">·</span> {call.contactName ?? "Unknown number"}</strong><StatusLabel>{call.status}</StatusLabel></div>
              <div className="call-activity-meta"><span>{call.employeeName}</span><span>{call.opportunityId ?? "No linked opportunity"}</span><span>{connected(call) ? durationText(call.durationSeconds) : "No connected time"}</span><span>{call.id}</span></div>
            </div>
            <time className="call-activity-date" dateTime={call.startedAt}>{displayDate(call.startedAt)}</time>
            <div className="call-timeline-actions"><Button size="small" variant="secondary" onClick={() => onOpen(call)}>View call</Button>{call.opportunityId ? <Link href={`/library/modules/leads?enquiry=${encodeURIComponent(call.opportunityId)}`}>Open opportunity</Link> : null}</div>
          </div>
        </div>
      </article>)}
    </div>
    {!calls.length ? <p className="fin-empty">No call timeline entries in this view.</p> : null}
  </>;
}

function RecordingPage({ calls, onOpen }: { calls: CallRecord[]; onOpen: (call: CallRecord) => void }) {
  const recordingRows = calls.filter(call => call.recording !== "Unavailable" && call.recording !== "Not captured");
  return <><PageHeading title="Call recordings" description="Recording metadata and sync exceptions for calls in your authorized view." /><div className="call-recording-notice"><Icon name="lock" /><div><strong>Audio storage is not connected</strong><p>There is no playback or download source in this project. Android call metadata does not include call audio, and recording access is device, provider, consent and policy dependent.</p></div></div><section className="fin-panel"><DataTable headers={["Call ID", "Employee", "Customer / opportunity", "Direction", "Duration", "Recording status", "Storage sync", "Access"]} empty={!recordingRows.length}>{recordingRows.map(call => <tr key={call.id}><td><button className="call-link" onClick={() => onOpen(call)}>{call.id}</button></td><td>{call.employeeName}</td><td>{call.contactName ?? "Unknown"}{call.opportunityId ? <small className="call-subcell">{call.opportunityId}</small> : null}</td><td>{call.direction}</td><td>{connected(call) ? durationText(call.durationSeconds) : "—"}</td><td><StatusLabel>{call.recording}</StatusLabel></td><td><StatusLabel>{call.syncStatus}</StatusLabel></td><td><span className="call-no-audio">No audio source</span></td></tr>)}</DataTable><p className="call-table-note">{recordingRows.length} metadata rows · audio is not stored in this preview.</p></section></>;
}

function UnknownPage({ calls, onAssociate, onOpen }: { calls: CallRecord[]; onAssociate: (phone: string) => void; onOpen: (call: CallRecord) => void }) {
  const unknown = calls.filter(call => !call.contactId);
  const groups = [...new Set(unknown.map(call => call.phone))].map(phone => { const rows = unknown.filter(call => call.phone === phone); return { phone, rows, attempts: rows.length, seconds: rows.reduce((total, call) => total + (connected(call) ? call.durationSeconds : 0), 0), first: rows.reduce((a, b) => a.startedAt < b.startedAt ? a : b), latest: rows.reduce((a, b) => a.startedAt > b.startedAt ? a : b) }; });
  return <><PageHeading title="Unknown numbers" description="Unmatched numbers remain traceable and can be associated by an authorized reviewer." /><section className="fin-panel"><DataTable headers={["Number", "Attempts", "Direction", "Connected time", "First call", "Latest call", "Review", "Actions"]} empty={!groups.length}>{groups.map(group => <tr key={group.phone}><td dir="ltr">{group.phone}</td><td>{group.attempts}</td><td>{[...new Set(group.rows.map(call => call.direction))].join(" · ")}</td><td>{durationText(group.seconds)}</td><td>{displayDate(group.first.startedAt)}</td><td>{displayDate(group.latest.startedAt)}</td><td>{group.rows.every(call => call.associationReviewed) ? <StatusLabel>Reviewed</StatusLabel> : <StatusLabel>Unregistered</StatusLabel>}</td><td><div className="call-row-actions"><Button size="small" variant="secondary" onClick={() => onOpen(group.latest)}>View calls</Button><Button size="small" onClick={() => onAssociate(group.phone)}>Associate</Button></div></td></tr>)}</DataTable><p className="call-table-note">Unregistered does not mean suspicious. Flags are generated from configured patterns and require human review.</p></section></>;
}

function FlagsPage({ flags, canReview, onOpen }: { flags: CallingFlag[]; canReview: boolean; onOpen: (flag: CallingFlag) => void }) {
  return <><PageHeading title="Suspicious activity" description="System indicators support investigation; they are not proof of misconduct." /><section className="call-investigation-note"><Icon name="alert" /><p>Each flag keeps its original reason and linked calls. Only CEO / Super Admin and Reporting Manager preview roles can update review status; this frontend selection is not server authorization.</p></section><section className="fin-panel"><DataTable headers={["Flag ID", "Employee", "Number / contact", "Detection reason", "Calls", "Connected duration", "Latest", "Severity", "Status", "Actions"]} empty={!flags.length}>{flags.map(flag => <tr key={flag.id}><td>{flag.id}</td><td>{flag.employeeName}</td><td dir="ltr">{flag.contactName ?? flag.phone}</td><td className="call-reason-cell">{flag.reason}</td><td>{flag.count}</td><td>{durationText(flag.connectedSeconds)}</td><td>{displayDate(flag.latestAt)}</td><td><StatusLabel>{flag.severity}</StatusLabel></td><td><StatusLabel>{flag.status}</StatusLabel></td><td><Button size="small" variant="secondary" onClick={() => onOpen(flag)} disabled={!canReview}>Review</Button></td></tr>)}</DataTable></section></>;
}

function VoicemailPage({ calls, onOpen }: { calls: CallRecord[]; onOpen: (call: CallRecord) => void }) {
  const rows = calls.filter(call => call.status === "Voicemail suspected" || call.status === "Initiated" || call.status === "Ringing" || call.status === "Failed");
  return <><PageHeading title="Voicemail & automated calls" description="Uncertain outcomes from the available call metadata." /><div className="call-recording-notice"><Icon name="phone" /><div><strong>Voicemail detection is not connected</strong><p>No selected provider supplies verified human-versus-voicemail detection. “Voicemail suspected” is a sample indicator only and is excluded from connected conversation duration.</p></div></div><section className="fin-panel"><DataTable headers={["Call ID", "Contact", "Employee", "Status", "Started", "Captured duration", "Detection source", "Actions"]} empty={!rows.length}>{rows.map(call => <tr key={call.id}><td>{call.id}</td><td>{call.contactName ?? call.phone}</td><td>{call.employeeName}</td><td><StatusLabel>{call.status}</StatusLabel></td><td>{displayDate(call.startedAt)}</td><td>{call.durationSeconds ? durationText(call.durationSeconds) : "—"}</td><td>Sample metadata · not provider verified</td><td><Button variant="secondary" size="small" onClick={() => onOpen(call)}>Details</Button></td></tr>)}</DataTable></section></>;
}

function TeamPage({ calls }: { calls: CallRecord[] }) {
  const names = [...new Set(calls.map(call => call.employeeName))];
  return <><PageHeading title="Team calling" description="Authorized team activity from the selected role preview." /><section className="fin-panel"><DataTable headers={["Employee", "Team", "Incoming", "Outgoing", "Connected", "Missed", "Talk time", "Unknown calls", "Flags"]} empty={!names.length}>{names.map(name => { const rows = calls.filter(call => call.employeeName === name); return <tr key={name}><td>{name}</td><td>{rows[0]?.team ?? "—"}</td><td>{rows.filter(call => call.direction === "Incoming").length}</td><td>{rows.filter(call => call.direction === "Outgoing").length}</td><td>{rows.filter(connected).length}</td><td>{rows.filter(call => call.status === "Missed").length}</td><td>{durationText(rows.filter(connected).reduce((sum, call) => sum + call.durationSeconds, 0))}</td><td>{rows.filter(call => !call.contactId).length}</td><td>{rows.filter(call => !call.contactId && call.direction === "Outgoing").length >= 3 ? "Review" : "—"}</td></tr>; })}</DataTable></section><p className="call-table-note">Talk time excludes ringing, missed, rejected, failed and voicemail-suspected calls. It is not a productivity or conversation-quality score.</p></>;
}

function ReportsPage({ calls, flags, onExport, canExport }: { calls: CallRecord[]; flags: CallingFlag[]; onExport: (calls: CallRecord[]) => void; canExport: boolean }) {
  const [employee, setEmployee] = useState("All employees");
  const [team, setTeam] = useState("All teams");
  const [status, setStatus] = useState("All statuses");
  const [direction, setDirection] = useState("All directions");
  const [numberMatch, setNumberMatch] = useState("All numbers");
  const [recording, setRecording] = useState("All recordings");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("Any time");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const employees = ["All employees", ...new Set(calls.map(call => call.employeeName))];
  const teams = ["All teams", ...new Set(calls.map(call => call.team))];
  const toDateInputValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const updatePeriod = (value: string) => {
    setPeriod(value);
    if (value === "Any time") { setFromDate(""); setToDate(""); return; }
    if (value === "Custom range") return;
    const end = new Date();
    const start = new Date(end);
    if (value === "Last 7 days") start.setDate(start.getDate() - 6);
    if (value === "Last 30 days") start.setDate(start.getDate() - 29);
    if (value === "This month") start.setDate(1);
    const endValue = toDateInputValue(end);
    setFromDate(toDateInputValue(start));
    setToDate(endValue);
  };
  const reportCalls = calls.filter(call =>
    (!query.trim() || [call.id, call.phone, call.contactName, call.employeeName, call.opportunityId].some(value => value?.toLowerCase().includes(query.trim().toLowerCase()))) &&
    (employee === "All employees" || call.employeeName === employee) &&
    (team === "All teams" || call.team === team) &&
    (status === "All statuses" || call.status === status) &&
    (direction === "All directions" || call.direction === direction) &&
    (numberMatch === "All numbers" || (numberMatch === "Registered" ? Boolean(call.contactId) : !call.contactId)) &&
    (recording === "All recordings" || call.recording === recording) &&
    (!fromDate || call.startedAt.slice(0, 10) >= fromDate) &&
    (!toDate || call.startedAt.slice(0, 10) <= toDate)
  );
  const reportEmployees = [...new Set(reportCalls.map(call => call.employeeName))];
  const reportFlags = flags.filter(flag => reportEmployees.includes(flag.employeeName) && (!fromDate || flag.latestAt.slice(0, 10) >= fromDate) && (!toDate || flag.latestAt.slice(0, 10) <= toDate));
  const incomingSeconds = reportCalls.filter(call => call.direction === "Incoming" && connected(call)).reduce((sum, call) => sum + call.durationSeconds, 0);
  const outgoingSeconds = reportCalls.filter(call => call.direction === "Outgoing" && connected(call)).reduce((sum, call) => sum + call.durationSeconds, 0);
  const activeFilterCount = [Boolean(query.trim()), employee !== "All employees", team !== "All teams", status !== "All statuses", direction !== "All directions", numberMatch !== "All numbers", recording !== "All recordings", Boolean(fromDate || toDate)].filter(Boolean).length;
  const clearFilters = () => {
    setEmployee("All employees"); setTeam("All teams"); setStatus("All statuses"); setDirection("All directions");
    setNumberMatch("All numbers"); setRecording("All recordings"); setPeriod("Any time"); setFromDate(""); setToDate(""); setQuery("");
  };
  return <>
    <PageHeading title="Call reports" description="Employee and team call volumes with connected duration calculated from completed metadata." actions={<>
      <Dropdown isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
        <DropdownTrigger className="call-filter-trigger call-report-filter-trigger" aria-label="Report filters" aria-expanded={filtersOpen}><RiFilter3Line aria-hidden="true" /><span>Filters</span>{activeFilterCount ? <span className="call-filter-count">{activeFilterCount}</span> : null}</DropdownTrigger>
        <DropdownPopover aria-label="Report filters" placement="bottom end" offset={6} className="call-filter-popover" dialogClassName="call-filter-popover-dialog">
          <div className="call-filter-grid">
              <Input aria-label="Search calls" placeholder="Call ID, number, contact…" value={query} onChange={setQuery} />
              <Select aria-label="Time period" selectedKey={period} onSelectionChange={key => updatePeriod(String(key))}>{["Any time", "Today", "Last 7 days", "Last 30 days", "This month", "Custom range"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
              <Select aria-label="Direction" selectedKey={direction} onSelectionChange={key => setDirection(String(key))}>{["All directions", "Incoming", "Outgoing"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
              <Select aria-label="Status" selectedKey={status} onSelectionChange={key => setStatus(String(key))}>{["All statuses", "Connected", "Completed", "Missed", "Rejected", "Busy", "Failed", "Voicemail suspected", "Initiated", "Ringing"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
              <Select aria-label="Employee" selectedKey={employee} onSelectionChange={key => setEmployee(String(key))}>{employees.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
              <Select aria-label="Team" selectedKey={team} onSelectionChange={key => setTeam(String(key))}>{teams.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
              <Select aria-label="Number match" selectedKey={numberMatch} onSelectionChange={key => setNumberMatch(String(key))}>{["All numbers", "Registered", "Unknown"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
              <Select aria-label="Recording status" selectedKey={recording} onSelectionChange={key => setRecording(String(key))}>{["All recordings", "Metadata only", "Upload failed", "Unavailable", "Not captured"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
              <Input aria-label="Start date" type="date" className="call-filter-date" fieldClassName="bg-background-primary-default text-text-primary ring-1 ring-border-button-default" value={fromDate} onChange={value => { setPeriod("Custom range"); setFromDate(value); }} />
              <Input aria-label="End date" type="date" className="call-filter-date" fieldClassName="bg-background-primary-default text-text-primary ring-1 ring-border-button-default" value={toDate} onChange={value => { setPeriod("Custom range"); setToDate(value); }} />
          </div>
          <div className="call-filter-popover-footer"><span>{activeFilterCount ? `${activeFilterCount} filters active` : "All calls"}<span className="call-report-result-count"> · {reportCalls.length} calls</span></span><Button variant="secondary" size="small" disabled={!activeFilterCount} onClick={clearFilters}>Clear filters</Button></div>
        </DropdownPopover>
      </Dropdown>
      <Button variant="secondary" leadingIcon={RiDownloadLine} disabled={!canExport} onClick={() => onExport(reportCalls)}>Export CSV</Button>
    </>} />
    <div className="call-report-metrics"><MetricCards items={[
      { label: "Total calls", value: String(reportCalls.length) },
      { label: "Connected calls", value: String(reportCalls.filter(connected).length) },
      { label: "Missed / rejected / failed", value: String(reportCalls.filter(call => ["Missed", "Rejected", "Failed"].includes(call.status)).length) },
      { label: "Total talk time", value: durationText(incomingSeconds + outgoingSeconds) },
    ]} /></div>
    <section className="fin-panel call-report-summary-panel"><div className="fin-panel-heading"><div><h3>Employee summary</h3><p>{reportEmployees.length} employees in the current filters</p></div></div><DataTable headers={["Employee", "Team", "Incoming", "Outgoing", "Connected", "Missed", "Rejected", "Failed", "Incoming time", "Outgoing time", "Unknown", "Flags"]} empty={!reportEmployees.length}>{reportEmployees.map(name => { const rows = reportCalls.filter(call => call.employeeName === name); return <tr key={name}><td>{name}</td><td>{rows[0]?.team ?? "—"}</td><td>{rows.filter(call => call.direction === "Incoming").length}</td><td>{rows.filter(call => call.direction === "Outgoing").length}</td><td>{rows.filter(connected).length}</td><td>{rows.filter(call => call.status === "Missed").length}</td><td>{rows.filter(call => call.status === "Rejected").length}</td><td>{rows.filter(call => call.status === "Failed").length}</td><td>{durationText(rows.filter(call => call.direction === "Incoming" && connected(call)).reduce((sum, call) => sum + call.durationSeconds, 0))}</td><td>{durationText(rows.filter(call => call.direction === "Outgoing" && connected(call)).reduce((sum, call) => sum + call.durationSeconds, 0))}</td><td>{rows.filter(call => !call.contactId).length}</td><td>{flags.filter(flag => flag.employeeName === name && reportFlags.includes(flag)).length}</td></tr>; })}</DataTable></section>
    <p className="call-table-note call-report-note">Preview roles only filter browser data; production access enforcement and organization reports require server-side role and team scope.</p>
  </>;
}

function SettingsPage({ state, canConfigure, onChange }: { state: CallingState; canConfigure: boolean; onChange: (patch: Partial<CallingSettings>) => void }) {
  const config = state.settings;
  return <>
    <PageHeading title="Calling settings" description="Manage call review preferences and see which device and recording services are available." />
    <div className="call-setting-status">
      <span className="call-integration-dot" />
      <div><strong>Calling integration · Not connected</strong><p>Device permissions, call synchronization and provider support have not been verified in this web app.</p></div>
      <StatusLabel>Unavailable</StatusLabel>
    </div>
    <div className="call-settings-grid">
      <section className="fin-panel">
        <div className="fin-panel-heading"><div><h3>Call monitoring</h3><p>Thresholds create review indicators; they do not determine misconduct.</p></div></div>
        <div className="call-settings-form call-threshold-form">
          <Input label="Unknown calls before review" type="number" value={String(config.unknownRepeatThreshold)} isDisabled={!canConfigure} onChange={value => onChange({ unknownRepeatThreshold: Number(value) || 3 })} />
          <Input label="Long unknown call (minutes)" type="number" value={String(config.unknownLongCallMinutes)} isDisabled={!canConfigure} onChange={value => onChange({ unknownLongCallMinutes: Number(value) || 10 })} />
          <Input label="High call volume (calls/day)" type="number" value={String(config.highFrequencyThreshold)} isDisabled={!canConfigure} onChange={value => onChange({ highFrequencyThreshold: Number(value) || 18 })} />
        </div>
      </section>
      <section className="fin-panel">
        <div className="fin-panel-heading"><div><h3>Follow-up &amp; review</h3><p>Local preview preferences for call review workflows.</p></div></div>
        <div className="call-toggle-list">
          <ToggleRow label="Monitor repeated unknown numbers" checked={config.unknownMonitoring} disabled={!canConfigure} onChange={checked => onChange({ unknownMonitoring: checked })} />
          <ToggleRow label="Notify the responsible manager about missed calls" checked={config.managerMissedCallAlerts} disabled={!canConfigure} onChange={checked => onChange({ managerMissedCallAlerts: checked })} />
          <ToggleRow label="Review unknown calls before associating a contact" checked={config.reviewRequiredForUnknown} disabled={!canConfigure} onChange={checked => onChange({ reviewRequiredForUnknown: checked })} />
        </div>
      </section>
      <section className="fin-panel call-settings-wide">
        <div className="fin-panel-heading"><div><h3>Recording &amp; call data</h3><p>Retention applies to metadata in this preview; it does not store or delete audio.</p></div></div>
        <div className="call-data-settings">
          <Input label="Call metadata retention (days)" type="number" value={String(config.recordingRetentionDays)} isDisabled={!canConfigure} onChange={value => onChange({ recordingRetentionDays: Number(value) || 90 })} />
          <div className="call-data-status-list">
            <div className="call-readonly-setting"><strong>Recording consent and access</strong><span>Not configured · organization policy is required</span></div>
            <div className="call-readonly-setting"><strong>Audio storage and upload</strong><span>Not connected · playback, download and retry are unavailable</span></div>
          </div>
        </div>
      </section>
    </div>
    {!canConfigure ? <p className="call-table-note">This preview role can view settings but cannot change them. Production access must be enforced on the server.</p> : null}
    <section className="fin-panel call-audit-panel"><div className="fin-panel-heading"><div><h3>Configuration and review history</h3><p>Recent local preview changes</p></div></div><DataTable headers={["Time", "Actor", "Action", "Record", "Details"]} empty={!state.audit.length}>{state.audit.slice(0, 12).map(item => <tr key={item.id}><td>{displayDate(item.at)}</td><td>{item.actor}</td><td>{item.action}</td><td>{item.recordId}</td><td>{item.detail}</td></tr>)}</DataTable></section>
  </>;
}

function ToggleRow({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) { return <div className="call-toggle-row"><Checkbox isSelected={checked} isDisabled={disabled} onChange={onChange}>{label}</Checkbox></div>; }

function CallFormModal({ isOpen, onOpenChange, onSave, profile }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onSave: (data: { contactId: string; direction: CallDirection; status: CallStatus; durationMinutes: string; employeeId: string }) => void; profile: string }) {
  const own = salesUsers.find(user => user.name === profile) ?? salesUsers[0];
  const [contactId, setContactId] = useState(""); const [direction, setDirection] = useState<CallDirection>("Outgoing"); const [status, setStatus] = useState<CallStatus>("Connected"); const [duration, setDuration] = useState("3"); const [employeeId, setEmployeeId] = useState(own?.id ?? "");
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onOpenChange]);
  if (!isOpen) return null;
  return <div className="fin-invoice-sidepanel-shell call-detail-panel-shell"><section className="fin-invoice-sidepanel call-form-panel" role="dialog" aria-modal="false" aria-label="Add preview call"><form onSubmit={event => { event.preventDefault(); onSave({ contactId, direction, status, durationMinutes: duration, employeeId }); }}><header className="call-detail-panel-header"><div className="call-form-panel-title"><RiPhoneLine aria-hidden="true" /><span>Add preview call</span><p>Sample metadata only · no phone call or Android log access.</p></div><Button variant="secondary" size="small" type="button" onClick={() => onOpenChange(false)}>Close</Button></header><div className="call-detail-panel-body"><div className="call-form-grid call-form-grid-single"><Select label="CRM contact or opportunity" selectedKey={contactId || "unknown"} onSelectionChange={key => setContactId(String(key) === "unknown" ? "" : String(key))}><SelectItem id="unknown">Unknown number</SelectItem>{initialEnquiries.map(item => <SelectItem key={item.id} id={item.id}>{item.name} · {item.id}</SelectItem>)}</Select><Select label="Direction" selectedKey={direction} onSelectionChange={key => setDirection(String(key) as CallDirection)}><SelectItem id="Incoming">Incoming</SelectItem><SelectItem id="Outgoing">Outgoing</SelectItem></Select><Select label="Call status" selectedKey={status} onSelectionChange={key => setStatus(String(key) as CallStatus)}>{(["Connected", "Completed", "Missed", "Rejected", "Busy", "Failed", "Voicemail suspected"] as CallStatus[]).map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select label="Employee" selectedKey={employeeId} onSelectionChange={key => setEmployeeId(String(key))}>{salesUsers.map(item => <SelectItem key={item.id} id={item.id}>{item.name}</SelectItem>)}</Select><Input label="Connected duration (minutes)" type="number" value={duration} onChange={setDuration} className="call-panel-field" fieldClassName="bg-background-primary-default text-text-primary ring-1 ring-border-button-default" isDisabled={status !== "Connected" && status !== "Completed"} hint="Ringing, missed, rejected, failed and suspected voicemail time is not counted." /></div><div className="call-inline-note">Duration is editable only before this preview record is saved.</div></div><footer className="call-detail-panel-footer"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save preview record</Button></footer></form></section></div>;
}

function CallDetailPanel({ call, onClose, onSave, canEditNote }: { call: CallRecord; onClose: () => void; onSave: (disposition: string, note: string, followUpAt: string) => void; canEditNote: boolean }) {
  const [disposition, setDisposition] = useState(call.disposition ?? ""); const [note, setNote] = useState(call.note ?? ""); const [followUp, setFollowUp] = useState(call.followUpAt ?? "");
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="fin-invoice-sidepanel-shell call-detail-panel-shell"><section className="fin-invoice-sidepanel call-detail-panel" role="dialog" aria-modal="false" aria-label={`Call details ${call.id}`}><header className="call-detail-panel-header"><div><span>Call details</span><strong>{call.id}</strong></div><Button variant="secondary" size="small" onClick={onClose}>Close</Button></header><div className="call-detail-panel-body"><p className="call-detail-panel-intro">Captured metadata is read-only. Notes and callback follow-up are separate from the original call record.</p><div className="call-detail-summary"><div><span>Contact</span><strong>{call.contactName ?? "Unknown number"}</strong></div><div><span>Employee</span><strong>{call.employeeName}</strong></div><div><span>Direction</span><strong>{call.direction}</strong></div><div><span>Phone number</span><strong dir="ltr">{call.phone}</strong></div><div><span>Opportunity</span><strong>{call.opportunityId ?? "Not linked"}</strong></div><div><span>Started</span><strong>{displayDate(call.startedAt)}</strong></div><div><span>Connected duration</span><strong>{connected(call) ? durationText(call.durationSeconds) : "Not connected"}</strong></div><div><span>Status</span><strong><StatusLabel>{call.status}</StatusLabel></strong></div><div><span>Source device</span><strong>{call.sourceDevice}</strong></div><div><span>Sync status</span><strong><StatusLabel>{call.syncStatus}</StatusLabel></strong></div></div>{call.contactId && initialEnquiries.some(item => item.id === call.contactId) ? <div className="call-timeline-actions"><Link href={`/library/modules/leads?enquiry=${encodeURIComponent(call.contactId)}`}>Open contact record</Link>{call.opportunityId ? <Link href={`/library/modules/leads?enquiry=${encodeURIComponent(call.opportunityId)}`}>Open opportunity</Link> : null}</div> : null}<div className="call-recording-notice"><Icon name="lock" /><div><strong>{call.recording === "Upload failed" ? "Recording upload failed" : "Recording unavailable"}</strong><p>No audio file is stored in this preview. Playback and download are disabled until an approved calling and storage service is connected.</p></div></div><div className="call-form-grid call-form-grid-single"><Select label="Call disposition" selectedKey={disposition || "none"} onSelectionChange={key => setDisposition(String(key) === "none" ? "" : String(key))}><SelectItem id="none">Select a disposition</SelectItem>{["Interested", "Follow-up required", "Information shared", "Not interested", "Callback requested", "No response", "Other"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Textarea label="Call note" value={note} onChange={setNote} isDisabled={!canEditNote} rows={3} placeholder="Add a brief post-call note" /><Input label="Callback due date" type="date" value={followUp} onChange={setFollowUp} className="call-panel-field" fieldClassName="bg-background-primary-default text-text-primary ring-1 ring-border-button-default" isDisabled={!canEditNote} /></div>{!canEditNote ? <p className="call-table-note">This preview profile can view the call but cannot add notes to another employee’s record.</p> : null}</div><footer className="call-detail-panel-footer"><Button variant="secondary" onClick={onClose}>Close</Button><Button disabled={!canEditNote} onClick={() => { onSave(disposition, note, followUp); onClose(); }}>Save note & follow-up</Button></footer></section></div>;
}

function AssociationModal({ phone, state, isOpen, onClose, onAssociate, onCreate }: { phone: string; state: CallingState; isOpen: boolean; onClose: () => void; onAssociate: (phone: string, id: string) => void; onCreate: (phone: string, name: string, email: string) => void }) {
  const [contactId, setContactId] = useState(""); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [mode, setMode] = useState("existing");
  return <Modal isOpen={isOpen} onOpenChange={open => { if (!open) onClose(); }} size="md"><div><ModalHeader title="Associate unknown number" description="Keep the original call and number history; add a contact association for future review." icon={RiPhoneLine} /><ModalBody className="call-modal-body"><p className="call-associated-number" dir="ltr">{phone}</p><Select label="Association method" selectedKey={mode} onSelectionChange={key => setMode(String(key))}><SelectItem id="existing">Link existing CRM contact</SelectItem><SelectItem id="create">Create local preview contact</SelectItem></Select>{mode === "existing" ? <Select label="Contact" selectedKey={contactId} onSelectionChange={key => setContactId(String(key))}><SelectItem id="">Choose a contact</SelectItem>{initialEnquiries.map(item => <SelectItem key={item.id} id={item.id}>{item.name} · {item.id}</SelectItem>)}{state.localContacts.map(item => <SelectItem key={item.id} id={item.id}>{item.name} · preview contact</SelectItem>)}</Select> : <div className="call-form-grid call-form-grid-single"><Input label="Contact name" value={name} onChange={setName} isRequired /><Input label="Email" type="email" value={email} onChange={setEmail} /></div>}<div className="call-inline-note">A newly created contact is kept in Calling Management browser preview only; it will not appear in the CRM directory.</div></ModalBody><ModalFooter><Button variant="secondary" onClick={onClose}>Cancel</Button>{mode === "existing" ? <Button disabled={!contactId} onClick={() => onAssociate(phone, contactId)}>Link contact</Button> : <Button disabled={!name.trim()} onClick={() => onCreate(phone, name, email)}>Create preview contact</Button>}</ModalFooter></div></Modal>;
}

function FlagReviewModal({ flag, isOpen, onClose, onSave, canReview }: { flag: CallingFlag; isOpen: boolean; onClose: () => void; onSave: (status: CallingFlagStatus, remarks: string) => void; canReview: boolean }) {
  const [status, setStatus] = useState<CallingFlagStatus>(flag.status); const [remarks, setRemarks] = useState(flag.remarks ?? "");
  return <Modal isOpen={isOpen} onOpenChange={open => { if (!open) onClose(); }} size="md"><div><ModalHeader title={`Review flag · ${flag.id}`} description="Record the reviewer’s assessment. Original calls and detection reason are preserved." icon={RiPhoneLine} /><ModalBody className="call-modal-body"><div className="call-flag-summary"><strong>{flag.reason}</strong><span>{flag.employeeName} · {flag.phone}</span><span>{flag.count} calls · {durationText(flag.connectedSeconds)} connected</span></div><Select label="Review status" selectedKey={status} onSelectionChange={key => setStatus(String(key) as CallingFlagStatus)} isDisabled={!canReview}>{(["Detected", "Under Review", "Investigating", "Resolved", "Dismissed"] as CallingFlagStatus[]).map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Textarea label="Investigation remarks" value={remarks} onChange={setRemarks} rows={3} placeholder="Record evidence or review findings" isDisabled={!canReview} />{!canReview ? <p className="call-table-note">Only manager and administrator preview roles can update this review. Backend authorization is not configured.</p> : null}</ModalBody><ModalFooter><Button variant="secondary" onClick={onClose}>Close</Button><Button disabled={!canReview} onClick={() => onSave(status, remarks)}>Save review</Button></ModalFooter></div></Modal>;
}

function createCallingNotice(title: string, body: string, recordId: string, view: string) {
  addPreviewNotification({ id: `NT-CALL-${crypto.randomUUID().slice(0, 7).toUpperCase()}`, title, body, category: "System", at: new Date().toISOString(), unread: true, recipient: "Calling Management preview", recordId, href: navHref(view), priority: "High", module: "Calling Management", sourceEventId: `EV-${recordId}-${title.toLowerCase().replaceAll(" ", "-")}` });
}
