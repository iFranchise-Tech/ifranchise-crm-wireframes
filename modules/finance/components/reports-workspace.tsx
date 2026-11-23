"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { initialEnquiries } from "@/modules/leads/data";
import { initialOpportunities, initialStages } from "@/modules/pipeline/data";
import { readActiveCrmRole } from "@/modules/screen-library/lib/table-columns";
import { createAudit, createInitialFinanceState, formatMoney, invoiceBalance, paymentTotals, readFinanceState, writeFinanceState } from "../store";
import type { FinancialState } from "../types";
import { DataTable, MetricCards, ModuleFrame, PageHeading, StatusLabel } from "./shared";

const views = ["Overview", "Lead generation", "Lead assignment", "Sales pipeline", "Sales performance", "Meetings", "Calling", "Marketing & campaigns", "Meta conversions", "Finance", "Brand performance", "Lost opportunities", "Employee productivity"];
const dateRanges = ["All time", "Today", "Yesterday", "This week", "Last week", "This month", "Last month", "This quarter", "Custom range"];
const isDateInRange = (value: string, range: string, from: string, to: string) => {
  if (range === "All time" || !value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  if (range === "Today") return date.toDateString() === today.toDateString();
  if (range === "Yesterday") { start.setDate(start.getDate() - 1); return date.toDateString() === start.toDateString(); }
  if (range === "Custom range") { const fromDate = from ? new Date(`${from}T00:00:00`) : null; const toDate = to ? new Date(`${to}T23:59:59`) : null; return (!fromDate || date >= fromDate) && (!toDate || date <= toDate); }
  if (range === "This week") { start.setDate(today.getDate() - ((today.getDay() + 6) % 7)); return date >= start && date <= today; }
  if (range === "Last week") { start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7); const end = new Date(start); end.setDate(end.getDate() + 6); return date >= start && date <= end; }
  if (range === "This month") { start.setDate(1); return date >= start && date <= today; }
  if (range === "Last month") { start.setDate(1); start.setMonth(start.getMonth() - 1); const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59); return date >= start && date <= end; }
  start.setMonth(Math.floor(today.getMonth() / 3) * 3, 1); return date >= start && date <= today;
};
type ReportRecord = { id: string; label: string; brand: string; employee: string; source: string; stage: string; status: string; date: string; value: number; notes?: string };

export function ReportsWorkspace({ view = "Overview" }: { view?: string }) {
  const current = views.includes(view) ? view : "Overview";
  const [finance, setFinance] = useState<FinancialState>(() => createInitialFinanceState());
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("All time");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [brand, setBrand] = useState("All brands");
  const [employee, setEmployee] = useState("All employees");
  const [stage, setStage] = useState("All stages");
  const [role, setRole] = useState("MIS / Operations");
  const [notice, setNotice] = useState("");
  const [meetings, setMeetings] = useState<{ id: string; title: string; assignedTo: string; status: string; startAt: string; opportunityId?: string; outcome?: string }[]>([]);
  const actor = typeof window === "undefined" ? "MIS preview" : readActiveCrmRole().name;
  useEffect(() => {
    setFinance(readFinanceState());
    try { const stored = JSON.parse(window.localStorage.getItem("ifranchise:meetings-followups:v1") || "null"); if (Array.isArray(stored?.meetings)) setMeetings(stored.meetings); } catch { /* Keep the report empty when there is no meeting record store. */ }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) writeFinanceState(finance); }, [hydrated, finance]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 3600); return () => window.clearTimeout(timer); }, [notice]);

  const brands = useMemo(() => Array.from(new Set(initialOpportunities.map(item => item.brand))).sort(), []);
  const employees = useMemo(() => Array.from(new Set(initialOpportunities.map(item => item.owner))).sort(), []);
  const reportRows = useMemo<ReportRecord[]>(() => {
    if (current === "Lead generation") return initialEnquiries.filter(item => item.category !== "Job").map(item => ({ id: item.id, label: item.name, brand: item.brand, employee: item.owner, source: item.originalSource, stage: item.stage ?? "New", status: item.status, date: item.received, value: Number(item.investment.replace(/[^\d]/g, "")) || 0, notes: item.category }));
    if (current === "Meetings") return meetings.map(item => ({ id: item.id, label: item.title, brand: initialOpportunities.find(opp => opp.id === item.opportunityId)?.brand ?? "", employee: item.assignedTo, source: "CRM meeting", stage: "Meeting", status: item.status, date: item.startAt, value: 0, notes: item.outcome ?? "" }));
    if (current === "Finance") return finance.payments.map(payment => { const opp = initialOpportunities.find(item => item.id === payment.opportunityId); return { id: payment.id, label: opp?.name ?? payment.opportunityId, brand: opp?.brand ?? "", employee: payment.submittedBy, source: payment.mode, stage: "Payment", status: payment.status, date: payment.date, value: payment.status === "Verified" ? payment.amount : 0, notes: payment.reference }; });
    if (current === "Invoice performance") return finance.invoices.map(invoice => ({ id: invoice.id, label: invoice.parties[0]?.name ?? invoice.id, brand: invoice.brand, employee: invoice.approvalBy, source: invoice.number, stage: "Invoice", status: invoice.status, date: invoice.invoiceDate, value: invoiceBalance(invoice), notes: invoice.opportunityId }));
    return initialOpportunities.map(item => ({ id: item.id, label: item.name, brand: item.brand, employee: item.owner, source: item.source, stage: initialStages.find(candidate => candidate.id === item.stageId)?.name ?? item.stageId, status: item.stageId === "lost" ? item.lostReason ?? "Lost" : item.stageId === "won" ? "Won" : "Active", date: item.createdAt, value: item.value, notes: item.nextAction }));
  }, [current, finance, meetings]);
  const filtered = reportRows.filter(item => {
    const searchable = `${item.id} ${item.label} ${item.brand} ${item.employee} ${item.source} ${item.stage} ${item.status} ${item.notes ?? ""}`.toLowerCase();
    return searchable.includes(search.toLowerCase()) && (brand === "All brands" || item.brand === brand) && (employee === "All employees" || item.employee === employee) && (stage === "All stages" || item.stage === stage || item.status === stage) && isDateInRange(item.date, range, from, to);
  });
  const allOpenOpps = initialOpportunities.filter(item => !["won", "lost"].includes(item.stageId));
  const fullDealValue = initialOpportunities.reduce((sum, item) => sum + item.value, 0);
  const verifiedCollections = finance.payments.filter(item => item.status === "Verified").reduce((sum, item) => sum + item.amount, 0);
  const outstanding = initialOpportunities.reduce((sum, item) => sum + Math.max(0, item.value - paymentTotals(finance, item.id).verified), 0);
  const selectedRows = filtered;
  const teamRollup = employees.map(name => ({ name, leads: initialOpportunities.filter(item => item.owner === name).length, active: initialOpportunities.filter(item => item.owner === name && !["won", "lost"].includes(item.stageId)).length, won: initialOpportunities.filter(item => item.owner === name && item.stageId === "won").length, value: initialOpportunities.filter(item => item.owner === name && item.stageId === "won").reduce((sum, item) => sum + item.value, 0) }));
  const countByStage = initialStages.map(item => ({ name: item.name, count: initialOpportunities.filter(opp => opp.stageId === item.id).length }));
  const metricItems = current === "Lead generation" ? [
    { label: "Enquiries", value: String(selectedRows.length), note: "Lead records in current filter" },
    { label: "Unique contacts", value: String(new Set(selectedRows.map(item => item.id)).size), note: "Unique enquiry references" },
    { label: "Converted to opportunity", value: String(initialOpportunities.length), note: "Linked opportunity records" },
    { label: "Duplicate attempts", value: "Not tracked", note: "No duplicate-submission event feed" },
  ] : current === "Lead assignment" ? [
    { label: "Current assigned leads", value: String(initialOpportunities.length), note: "Current opportunity owner" },
    { label: "Unassigned", value: "Not available", note: "Unassigned-lead history is not connected" },
    { label: "Reassigned", value: "Not tracked", note: "Assignment event history is not connected" },
    { label: "Assignment delays", value: "Not tracked", note: "Received and accepted timestamps are not connected" },
  ] : current === "Sales pipeline" ? [
    { label: "Active opportunities", value: String(allOpenOpps.length) },
    { label: "Won", value: String(initialOpportunities.filter(item => item.stageId === "won").length) },
    { label: "Lost", value: String(initialOpportunities.filter(item => item.stageId === "lost").length) },
    { label: "Pipeline value", value: formatMoney(allOpenOpps.reduce((sum, item) => sum + item.value, 0)) },
  ] : current === "Sales performance" ? [
    { label: "Employees with opportunity records", value: String(teamRollup.filter(item => item.leads > 0).length) },
    { label: "Total assigned opportunities", value: String(initialOpportunities.length) },
    { label: "Won deal value", value: formatMoney(fullDealValue) },
    { label: "Verified collections", value: formatMoney(verifiedCollections) },
  ] : current === "Meetings" ? [
    { label: "Meetings in report", value: String(selectedRows.length), note: meetings.length ? "Stored preview meeting records" : "No meeting records saved yet" },
    { label: "Completed", value: String(meetings.filter(item => /complete|conduct/i.test(item.status)).length) },
    { label: "Awaiting outcome", value: String(meetings.filter(item => /await|pending/i.test(item.status)).length) },
    { label: "Call reports", value: "Not applicable" },
  ] : current === "Calling" ? [
    { label: "Call records", value: "Not connected", note: "No call-provider event feed is configured" },
    { label: "Talk time", value: "Not available" },
    { label: "Call recordings", value: "Restricted", note: "No recording store is connected" },
    { label: "MIS access", value: "Summary only", note: "No private recordings exposed" },
  ] : current === "Marketing & campaigns" ? [
    { label: "Lead sources", value: String(new Set(initialEnquiries.map(item => item.originalSource)).size) },
    { label: "Attributed enquiries", value: String(initialEnquiries.filter(item => item.originalSource).length) },
    { label: "Campaign attribution", value: "Partial", note: "Original source available; campaign spend is not connected" },
    { label: "Cost per lead", value: "Not available", note: "Ad spend is not configured" },
  ] : current === "Meta conversions" ? [
    { label: "CRM events", value: "Not connected" },
    { label: "Delivered", value: "—" },
    { label: "Failed / delayed", value: "—" },
    { label: "Meta API", value: "Not configured", note: "No successful platform delivery is claimed" },
  ] : current === "Finance" ? [
    { label: "Deal value", value: formatMoney(fullDealValue) },
    { label: "Submitted", value: formatMoney(finance.payments.reduce((sum, item) => sum + item.amount, 0)) },
    { label: "Verified collections", value: formatMoney(verifiedCollections), note: "Verified records only" },
    { label: "Outstanding", value: formatMoney(outstanding) },
  ] : current === "Brand performance" ? [
    { label: "Brands", value: String(brands.length) },
    { label: "Active opportunities", value: String(allOpenOpps.length) },
    { label: "Won opportunities", value: String(initialOpportunities.filter(item => item.stageId === "won").length) },
    { label: "Verified collections", value: formatMoney(verifiedCollections) },
  ] : current === "Lost opportunities" ? [
    { label: "Lost opportunities", value: String(initialOpportunities.filter(item => item.stageId === "lost").length) },
    { label: "Lost with a reason", value: String(initialOpportunities.filter(item => item.stageId === "lost" && item.lostReason).length) },
    { label: "Reason values", value: String(new Set(initialOpportunities.filter(item => item.stageId === "lost").map(item => item.lostReason).filter(Boolean)).size) },
    { label: "Reopened", value: "History not available", note: "Reopen event history is not connected" },
  ] : current === "Employee productivity" ? [
    { label: "Employees", value: String(employees.length) },
    { label: "Opportunity records", value: String(initialOpportunities.length) },
    { label: "Recorded activity", value: "Limited", note: "Pipeline next actions only" },
    { label: "Login / call telemetry", value: "Not connected", note: "No inferred productivity score is shown" },
  ] : [
    { label: "Leads generated", value: String(initialEnquiries.filter(item => item.category !== "Job").length) },
    { label: "Active opportunities", value: String(allOpenOpps.length) },
    { label: "Assigned leads", value: String(initialOpportunities.length) },
    { label: "Unassigned leads", value: "Not tracked", note: "Assignment feed not connected" },
    { label: "Manager meetings", value: String(meetings.filter(item => /manager/i.test(item.title)).length) },
    { label: "Brand meetings", value: String(meetings.filter(item => /brand/i.test(item.title)).length) },
    { label: "Hot opportunities", value: String(initialOpportunities.filter(item => item.stageId === "hot").length) },
    { label: "Won opportunities", value: String(initialOpportunities.filter(item => item.stageId === "won").length) },
    { label: "Deal value", value: formatMoney(fullDealValue) },
    { label: "Verified payments", value: formatMoney(verifiedCollections) },
    { label: "Outstanding", value: formatMoney(outstanding) },
    { label: "Calls / talk time", value: "Not connected", note: "Call telemetry unavailable" },
  ];

  function downloadCsv() {
    const headings = ["Record ID", "Customer / item", "Brand", "Employee", "Source", "Stage", "Status", "Date", "Value", "Notes"];
    const csv = [headings.join(","), ...selectedRows.map(item => [item.id, item.label, item.brand, item.employee, item.source, item.stage, item.status, item.date, item.value, item.notes ?? ""].map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = `ifranchise-${current.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`; link.click(); URL.revokeObjectURL(link.href);
    const entry = createAudit("REPORT-EXPORT", "", "Filtered report CSV exported", "—", "Complete", actor, `${current} · ${selectedRows.length} rows · ${range}`);
    const next = { ...finance, audit: [entry, ...finance.audit] }; setFinance(next); writeFinanceState(next); setNotice("Filtered CSV downloaded. Export action recorded in the preview audit.");
  }

  const reportScope = role === "BDA / Sales Employee" ? initialOpportunities.filter(item => item.owner === (typeof window === "undefined" ? "" : readActiveCrmRole().name)).length : role === "Brand User" ? "Selected brand only" : role === "Finance" ? "Finance summaries enabled" : "Authorized report preview";
  const headings = current === "Finance" ? ["Payment", "Customer / opportunity", "Brand", "Submitted by", "Mode", "Status", "Date", "Verified amount", "Reference"] : current === "Meetings" ? ["Meeting", "Title", "Brand", "Employee", "Category", "Status", "Scheduled", "Outcome"] : ["Record", "Customer / opportunity", "Brand", "Employee", "Source", "Stage", "Status", "Date", "Value"];
  return <ModuleFrame moduleId="reports" moduleName="Reports & MIS" icon="chart" current={current} views={views.map(id => ({ id, label: id }))}>
    {notice ? <div className="fin-toast" role="status">{notice}</div> : null}
    <PageHeading title={current === "Overview" ? "Reports & MIS" : current} description={current === "Overview" ? "Operational performance from the CRM records available in this preview." : `${current} · filtered from the connected preview records.`} actions={<><Select aria-label="Preview report permissions" selectedKey={role} onSelectionChange={key => setRole(String(key))} className="fin-role-select"><SelectItem id="MIS / Operations">MIS / Operations</SelectItem><SelectItem id="CEO / Super Admin">CEO / Super Admin</SelectItem><SelectItem id="Finance">Finance</SelectItem><SelectItem id="Marketing">Marketing</SelectItem><SelectItem id="Reporting Manager">Reporting Manager</SelectItem><SelectItem id="BDA / Sales Employee">BDA / Sales Employee</SelectItem><SelectItem id="Brand User">Brand User</SelectItem></Select><Button variant="secondary" onClick={downloadCsv}>Export CSV</Button></>} />
    <div className="fin-toolbar-note">Preview role: {role} · {reportScope}. This role control is a UI preview and does not enforce server authorization.</div>
    {current === "Sales pipeline" ? <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Opportunities by stage</h3><p>Current stage snapshot · historical entry and exit events are not connected</p></div></div><div className="fin-panel-body fin-report-grid">{countByStage.map(item => <article className="fin-report-item" key={item.name}><h3>{item.name}</h3><strong>{item.count}</strong><p>Current opportunities</p></article>)}</div></section> : null}
    {current === "Sales performance" ? <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Employee performance</h3><p>Current opportunity ownership snapshot; prior handlers are not attributed</p></div></div><DataTable headers={["Employee", "Assigned opportunities", "Active", "Won", "Won deal value"]}>{teamRollup.filter(item => brand === "All brands" || initialOpportunities.some(opp => opp.owner === item.name && opp.brand === brand)).map(item => <tr key={item.name}><td><strong>{item.name}</strong></td><td>{item.leads}</td><td>{item.active}</td><td>{item.won}</td><td>{formatMoney(item.value)}</td></tr>)}</DataTable></section> : null}
    {current === "Lead assignment" ? <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Current opportunity owners</h3><p>Assignment transfers and acceptance events are not included in the local preview data</p></div></div><DataTable headers={["Owner", "Assigned", "Active", "Brands"]}>{employees.map(name => <tr key={name}><td><strong>{name}</strong></td><td>{initialOpportunities.filter(item => item.owner === name).length}</td><td>{initialOpportunities.filter(item => item.owner === name && !["won", "lost"].includes(item.stageId)).length}</td><td>{Array.from(new Set(initialOpportunities.filter(item => item.owner === name).map(item => item.brand))).join(", ")}</td></tr>)}</DataTable></section> : null}
    {current === "Brand performance" || current === "Marketing & campaigns" ? <section className="fin-panel"><div className="fin-panel-heading"><div><h3>{current === "Brand performance" ? "Brand results" : "Lead-source performance"}</h3><p>Computed from source enquiry and opportunity records; missing spend or campaign event data is called out</p></div></div><DataTable headers={current === "Brand performance" ? ["Brand", "Opportunities", "Hot", "Won", "Deal value", "Verified collections"] : ["Original source", "Enquiries", "Linked opportunities", "Won", "Verified collections"]}>{(current === "Brand performance" ? brands.map(name => ({ key: name, count: initialOpportunities.filter(item => item.brand === name).length, won: initialOpportunities.filter(item => item.brand === name && item.stageId === "won").length, hot: initialOpportunities.filter(item => item.brand === name && item.stageId === "hot").length, val: initialOpportunities.filter(item => item.brand === name).reduce((sum, item) => sum + item.value, 0), coll: finance.payments.filter(payment => payment.status === "Verified" && initialOpportunities.find(opp => opp.id === payment.opportunityId)?.brand === name).reduce((sum, item) => sum + item.amount, 0) })) : Array.from(new Set(initialEnquiries.map(item => item.originalSource))).map(name => ({ key: name, count: initialEnquiries.filter(item => item.originalSource === name).length, opps: initialOpportunities.filter(item => item.source === name).length, won: initialOpportunities.filter(item => item.source === name && item.stageId === "won").length, coll: finance.payments.filter(payment => payment.status === "Verified" && initialOpportunities.find(opp => opp.id === payment.opportunityId)?.source === name).reduce((sum, item) => sum + item.amount, 0) }))).map(row => current === "Brand performance" ? <tr key={row.key}><td><strong>{row.key}</strong></td><td>{row.count}</td><td>{"hot" in row ? row.hot : 0}</td><td>{row.won}</td><td>{formatMoney("val" in row ? row.val : 0)}</td><td>{formatMoney("coll" in row ? row.coll : 0)}</td></tr> : <tr key={row.key}><td><strong>{row.key}</strong></td><td>{row.count}</td><td>{"opps" in row ? row.opps : 0}</td><td>{row.won}</td><td>{formatMoney("coll" in row ? row.coll : 0)}</td></tr>)}</DataTable></section> : null}
    {current === "Meta conversions" || current === "Calling" || current === "Employee productivity" ? <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Data source status</h3><p>Unavailable external feeds are shown as unavailable rather than estimated.</p></div></div><div className="fin-panel-body"><div className="fin-detail-list"><div><dt>Connected CRM records</dt><dd>{current === "Calling" ? "No call telemetry integration" : current === "Meta conversions" ? "No Meta Conversions API integration" : "Preview opportunity records only"}</dd></div><div><dt>External integration state</dt><dd><StatusLabel>Not configured</StatusLabel></dd></div><div><dt>Reporting access</dt><dd>{current === "Calling" ? "No call recordings exposed" : "Read-only preview"}</dd></div></div></div></section> : null}
    <MetricCards items={metricItems} />
    <section className="fin-panel"><div className="fin-panel-heading"><div><h3>{current === "Overview" ? "CRM records" : `${current} records`}</h3><p>Multiple filters are combined with AND. CSV export uses the filtered rows.</p></div></div><div className="fin-filter-row"><Input className="fin-search" aria-label="Search report records" placeholder="Search records, brand, employee or source" value={search} onChange={setSearch} fieldClassName="fin-input" /><Select aria-label="Filter brand" selectedKey={brand} onSelectionChange={key => setBrand(String(key))}><SelectItem id="All brands">All brands</SelectItem>{brands.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Filter employee" selectedKey={employee} onSelectionChange={key => setEmployee(String(key))}><SelectItem id="All employees">All employees</SelectItem>{employees.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Date range" selectedKey={range} onSelectionChange={key => setRange(String(key))}>{dateRanges.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><Select aria-label="Filter pipeline stage" selectedKey={stage} onSelectionChange={key => setStage(String(key))}><SelectItem id="All stages">All stages</SelectItem>{[...initialStages.map(item => item.name), "New", "Qualified", "Converted", "Pending Verification", "Verified", "Rejected", "Paid", "Partially Paid"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>{range === "Custom range" ? <><Input label="From" aria-label="Report start date" type="date" value={from} onChange={setFrom} fieldClassName="fin-input" /><Input label="To" aria-label="Report end date" type="date" value={to} onChange={setTo} fieldClassName="fin-input" /></> : null}<span className="fin-toolbar-note">{selectedRows.length} rows</span></div><DataTable headers={headings} empty={!selectedRows.length}>{selectedRows.slice(0, 250).map(item => current === "Meetings" ? <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.label}</td><td>{item.brand}</td><td>{item.employee}</td><td>{item.source}</td><td><StatusLabel>{item.status}</StatusLabel></td><td>{new Date(item.date).toLocaleString("en-IN")}</td><td>{item.notes || "—"}</td></tr> : current === "Finance" ? <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.label}<small>{item.id}</small></td><td>{item.brand}</td><td>{item.employee}</td><td>{item.source}</td><td><StatusLabel>{item.status}</StatusLabel></td><td>{item.date}</td><td>{formatMoney(item.value)}</td><td>{item.notes}</td></tr> : <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.label}</td><td>{item.brand}</td><td>{item.employee}</td><td>{item.source}</td><td>{item.stage}</td><td><StatusLabel>{item.status}</StatusLabel></td><td>{new Date(item.date).toLocaleDateString("en-IN")}</td><td>{item.value ? formatMoney(item.value) : "—"}</td></tr>)}</DataTable></section>
  </ModuleFrame>;
}
