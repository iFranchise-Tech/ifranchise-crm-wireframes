"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { RiAddLine, RiApps2Line, RiArrowDownSLine, RiArrowLeftLine, RiArrowLeftRightLine, RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine, RiArrowUpDownLine, RiArrowUpSLine, RiBankCardLine, RiBuildingLine, RiCalendarEventLine, RiCalendarLine, RiChat3Line, RiCheckLine, RiCheckboxCircleLine, RiCloseLine, RiDeleteBinLine, RiDownloadLine, RiEyeOffLine, RiFileEditLine, RiFilePdfLine, RiFilter3Line, RiFullscreenLine, RiHashtag, RiLayoutColumnLine, RiLayoutRowLine, RiLinkM, RiLockLine, RiMoneyDollarCircleLine, RiMore2Line, RiPictureInPictureLine, RiReceiptLine, RiRestartLine, RiSearchLine, RiSendPlaneLine, RiSidebarFoldLine, RiSidebarUnfoldLine, RiSubtractLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { Select, SelectItem } from "@/components/base/select/select";
import { TableSelectionCheckbox } from "@/components/base/table/table-selection-checkbox";
import { Textarea } from "@/components/base/textarea/textarea";
import { initialOpportunities } from "@/modules/pipeline/data";
import { readActiveCrmRole } from "@/modules/screen-library/lib/table-columns";
import { createAudit, financialYear, formatMoney, invoiceBalance, invoicePaid, readFinanceState, totalInvoice, writeFinanceState } from "../store";
import type { BillingParty, FinancialState, InvoiceLine, InvoiceRecord, InvoiceState } from "../types";
import { DataTable, FormGrid, MetricCards, ModuleFrame, PageHeading, StatusLabel, TextAction } from "./shared";

const views = ["Overview", "Invoice register", "Approvals", "Reconciliation", "Delivery", "Credit notes", "Audit history"];
const registerColumns = ["Customer", "Status", "Amount", "Issued", "Due", "Contract", "Paid", "Method", "Actions"] as const;
type RegisterColumn = typeof registerColumns[number];
const viewColumns = ["Customer", "Status", "Amount", "Issued", "Due", "Contract", "Paid", "Method"] as const;
type ViewColumn = typeof viewColumns[number];
const defaultColumns: ViewColumn[] = [...viewColumns];
const columnIcons = { Customer: RiBuildingLine, Status: RiCheckboxCircleLine, Amount: RiMoneyDollarCircleLine, Issued: RiCalendarLine, Due: RiCalendarEventLine, Contract: RiFileEditLine, Paid: RiCheckboxCircleLine, Method: RiBankCardLine };
type ViewSection = "main" | "rowHeight" | "columnWidth" | "columns" | "filter" | "sort";
const filterSources = ["Billed from a contract", "Written in Accordee", "Upcoming"];
const lateRanges = ["1–30 days late", "31–60 days late", "61–90 days late", "Over 90 days late"];
const baseParty = (): BillingParty => ({ name: "", address: "", email: "", phone: "", gstin: "", allocation: 0 });
const dateToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
type InvoiceDraft = { opportunityId: string; billingType: InvoiceRecord["billingType"]; parties: BillingParty[]; recipients: string; lines: InvoiceLine[]; invoiceDate: string; dueDate: string };
const draftFor = (opportunityId: string): InvoiceDraft => { const opportunity = initialOpportunities.find(item => item.id === opportunityId); return { opportunityId, billingType: "Individual", parties: [{ ...baseParty(), name: opportunity?.name ?? "", email: opportunity?.email ?? "" }], recipients: opportunity?.email ?? "", lines: [{ description: `${opportunity?.brand ?? "Franchise"} franchise opportunity`, quantity: 1, unitPrice: opportunity?.value ?? 0, gstRate: 0 }], invoiceDate: dateToday(), dueDate: "" }; };
type DialogKind = "create" | "cancel" | "credit" | "reconcile" | null;
function invoiceColumnText(invoice: InvoiceRecord, column: ViewColumn) {
  const opportunity = initialOpportunities.find(item => item.id === invoice.opportunityId);
  const method = invoice.paymentMethod ?? invoice.reconciliations.find(item => item.method)?.method ?? "";
  switch (column) {
    case "Customer": return invoice.parties[0]?.name || opportunity?.name || "—";
    case "Status": return invoice.status;
    case "Amount": return formatMoney(totalInvoice(invoice.lines));
    case "Issued": return invoice.invoiceDate;
    case "Due": return invoice.dueDate;
    case "Contract": return `${invoice.opportunityId} ${invoice.brand}`;
    case "Paid": return invoice.reconciliations.length ? invoice.reconciliations.reduce((latest, item) => item.at > latest ? item.at : latest, invoice.reconciliations[0].at).slice(0, 10) : "—";
    case "Method": return method;
  }
}

export function InvoiceWorkspace({ view = "Overview" }: { view?: string }) {
  const current = views.includes(view) ? view : "Overview";
  const [state, setState] = useState<FinancialState>(() => readFinanceState());
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("All statuses");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedLateRanges, setSelectedLateRanges] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterFade = useScrollFade();
  const [statusTab, setStatusTab] = useState("All");
  const [visibleColumns, setVisibleColumns] = useState<ViewColumn[]>(defaultColumns);
  const [columnOrder, setColumnOrder] = useState<ViewColumn[]>(defaultColumns);
  const [columnSort, setColumnSort] = useState<{ column: ViewColumn; direction: "asc" | "desc" } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<ViewColumn, string>>>({});
  const [columnFilterTarget, setColumnFilterTarget] = useState<ViewColumn | null>(null);
  const [openColumnMenu, setOpenColumnMenu] = useState<ViewColumn | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [editColumnsOpen, setEditColumnsOpen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [rowHeight, setRowHeight] = useState("Default");
  const [columnWidth, setColumnWidth] = useState("Default");
  const [viewSection, setViewSection] = useState<ViewSection>("main");
  const [sortBy, setSortBy] = useState("Needs attention");
  const [sortDescending, setSortDescending] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [newInvoiceStep, setNewInvoiceStep] = useState<"customer" | "contract">("customer");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [newInvoiceCustomerId, setNewInvoiceCustomerId] = useState("");
  const [newInvoiceSearch, setNewInvoiceSearch] = useState("");
  const [composerInvoice, setComposerInvoice] = useState<InvoiceRecord | null>(null);
  const [composerDisplay, setComposerDisplay] = useState<"side" | "full" | "popup" | "minimized">("side");
  const [composerPosition, setComposerPosition] = useState({ left: 96, top: 72 });
  const [composerSize, setComposerSize] = useState<{ width: number; height: number } | null>(null);
  const [draft, setDraft] = useState<InvoiceDraft>(() => draftFor(initialOpportunities[0]?.id ?? ""));
  const [editingInvoiceId, setEditingInvoiceId] = useState("");
  const [activeInvoice, setActiveInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [invoiceZoom, setInvoiceZoom] = useState(0.9);
  const [reason, setReason] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [allocationAmount, setAllocationAmount] = useState("");
  const [formError, setFormError] = useState("");
  const actor = typeof window === "undefined" ? "Finance reviewer" : readActiveCrmRole().name;
  useEffect(() => { setState(readFinanceState()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) writeFinanceState(state); }, [hydrated, state]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 3600); return () => window.clearTimeout(timer); }, [notice]);

  const invoiceRows = useMemo(() => state.invoices.filter(invoice => {
    const opp = initialOpportunities.find(item => item.id === invoice.opportunityId);
    const matchesSearch = `${invoice.number} ${invoice.id} ${opp?.name ?? ""} ${invoice.parties.map(party => party.name).join(" ")} ${invoice.brand}`.toLowerCase().includes(search.toLowerCase());
    const withinNext30Days = Boolean(invoice.dueDate && invoice.dueDate >= dateToday() && invoice.dueDate <= new Date(new Date(`${dateToday()}T12:00:00+05:30`).getTime() + 30 * 86400000).toISOString().slice(0, 10));
    const matchesTab = statusTab === "All" || (statusTab === "Drafts" && invoice.status === "Draft") || (statusTab === "Sent" && invoice.status === "Sent") || (statusTab === "Overdue" && invoice.status === "Overdue") || (statusTab === "Paid" && invoice.status === "Paid") || (statusTab === "Upcoming" && withinNext30Days && !["Paid", "Cancelled", "Draft"].includes(invoice.status));
    const matchesStatus = (filter === "All statuses" || invoice.status === filter) && matchesTab;
    const customer = invoice.parties[0]?.name || opp?.name || "—";
    const overdueDays = invoice.status === "Overdue" && invoice.dueDate ? Math.max(1, Math.floor((Date.now() - new Date(`${invoice.dueDate}T12:00:00+05:30`).getTime()) / 86400000)) : 0;
    const lateRange = overdueDays <= 30 ? "1–30 days late" : overdueDays <= 60 ? "31–60 days late" : overdueDays <= 90 ? "61–90 days late" : "Over 90 days late";
    const matchesSource = selectedSources.length === 0 || selectedSources.some(source => source === "Billed from a contract" ? Boolean(invoice.opportunityId) && invoice.status !== "Draft" : source === "Written in Accordee" ? invoice.status === "Draft" || !invoice.opportunityId : withinNext30Days && !["Paid", "Cancelled", "Draft"].includes(invoice.status));
    const matchesLateRange = selectedLateRanges.length === 0 || selectedLateRanges.includes(lateRange) && overdueDays > 0;
    const matchesCustomer = selectedCustomers.length === 0 || selectedCustomers.includes(customer);
    if (current === "Approvals" && !["Draft", "Pending Approval", "Approved"].includes(invoice.status)) return false;
    if (current === "Reconciliation" && !["Issued", "Sent", "Partially Paid", "Overdue"].includes(invoice.status)) return false;
    if (current === "Delivery" && !["Issued", "Sent"].includes(invoice.status)) return false;
    if (current === "Credit notes" && !invoice.creditNotes.length) return false;
    return matchesSearch && matchesStatus && matchesSource && matchesLateRange && matchesCustomer;
  }), [state, search, filter, statusTab, current, selectedSources, selectedLateRanges, selectedCustomers]);
  const outstanding = state.invoices.filter(invoice => !["Draft", "Cancelled"].includes(invoice.status)).reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
  const monthKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(new Date());
  const collectedThisMonth = state.invoices.reduce((sum, invoice) => sum + invoice.reconciliations.filter(entry => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(new Date(entry.at)) === monthKey).reduce((amount, entry) => amount + entry.amount, 0), 0);
  const overdueTotal = state.invoices.filter(invoice => invoice.status === "Overdue").reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
  const next30DaysTotal = state.invoices.filter(invoice => invoice.dueDate && invoice.dueDate >= dateToday() && invoice.dueDate <= new Date(new Date(`${dateToday()}T12:00:00+05:30`).getTime() + 30 * 86400000).toISOString().slice(0, 10) && !["Paid", "Cancelled", "Draft"].includes(invoice.status)).reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
  const statusTabs = ["All", "Drafts", "Sent", "Overdue", "Paid", "Upcoming"];
  const customerFacets = Array.from(state.invoices.reduce((counts, invoice) => {
    const name = invoice.parties[0]?.name || initialOpportunities.find(item => item.id === invoice.opportunityId)?.name || "—";
    counts.set(name, (counts.get(name) ?? 0) + 1);
    return counts;
  }, new Map<string, number>())).sort(([a], [b]) => a.localeCompare(b));
  const activeFilterCount = selectedSources.length + selectedLateRanges.length + selectedCustomers.length;
  const statusCount = (tab: string) => state.invoices.filter(invoice => tab === "All" || (tab === "Drafts" && invoice.status === "Draft") || (tab === "Sent" && invoice.status === "Sent") || (tab === "Overdue" && invoice.status === "Overdue") || (tab === "Paid" && invoice.status === "Paid") || (tab === "Upcoming" && invoice.dueDate && invoice.dueDate >= dateToday() && invoice.dueDate <= new Date(new Date(`${dateToday()}T12:00:00+05:30`).getTime() + 30 * 86400000).toISOString().slice(0, 10) && !["Paid", "Cancelled", "Draft"].includes(invoice.status))).length;
  const selectedOpportunity = initialOpportunities.find(item => item.id === draft.opportunityId);
  const availablePayments = state.payments.filter(payment => payment.status === "Verified" && payment.opportunityId === activeInvoice?.opportunityId && payment.amount > state.invoices.reduce((sum, invoice) => sum + invoice.reconciliations.filter(entry => entry.paymentId === payment.id).reduce((v, entry) => v + entry.amount, 0), 0));

  function save(next: FinancialState, message: string) { setState(next); setNotice(message); }
  function patchInvoice(invoiceId: string, patch: Partial<InvoiceRecord>, action: string, remarks = "") {
    const old = state.invoices.find(invoice => invoice.id === invoiceId);
    if (!old) return;
    const next = { ...state, invoices: state.invoices.map(invoice => invoice.id === invoiceId ? { ...invoice, ...patch } : invoice), audit: [createAudit(invoiceId, old.opportunityId, action, old.status, patch.status ?? old.status, actor, remarks), ...state.audit] };
    save(next, `${old.number === "DRAFT" ? old.id : old.number}: ${action.toLowerCase()} recorded.`);
  }
  function updateParty(index: number, patch: Partial<BillingParty>) { setDraft(current => ({ ...current, parties: current.parties.map((party, i) => i === index ? { ...party, ...patch } : party) })); }
  function updateLine(index: number, patch: Partial<InvoiceLine>) { setDraft(current => ({ ...current, lines: current.lines.map((line, i) => i === index ? { ...line, ...patch } : line) })); }
  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const total = totalInvoice(draft.lines);
    if (!draft.opportunityId || !draft.parties.length || draft.parties.some(party => !party.name.trim() || !party.address.trim() || !party.email.trim())) { setFormError("Add a billing name, address and email for each invoice party."); return; }
    if (!draft.lines.length || draft.lines.some(line => !line.description.trim() || line.quantity <= 0 || line.unitPrice < 0 || line.gstRate < 0 || line.gstRate > 100)) { setFormError("Check the invoice description, quantity, price and tax rate."); return; }
    if (draft.billingType === "Multiple parties" && Math.abs(draft.parties.reduce((sum, party) => sum + Number(party.allocation || 0), 0) - total) > 0.01) { setFormError("Enter the Finance-approved allocation for every party. Allocations must add up to the invoice total."); return; }
    const opp = selectedOpportunity;
    if (!opp) { setFormError("Choose an opportunity."); return; }
    const id = `INV-${String(Date.now()).slice(-8)}`;
    const recipients = draft.recipients.split(/[;,]/).map(email => email.trim()).filter(Boolean);
    const invoice: InvoiceRecord = { id, number: "DRAFT", opportunityId: opp.id, brand: opp.brand, model: "Franchise model pending configuration", billingType: draft.billingType, parties: draft.parties, recipients, lines: draft.lines, invoiceDate: draft.invoiceDate, dueDate: draft.dueDate, status: "Draft", approvalBy: "", issuedAt: "", delivery: "Not Sent", deliveryAttempts: [], reconciliations: [], cancelledReason: "", creditNotes: [] };
    if (editingInvoiceId) {
      save({ ...state, invoices: state.invoices.map(item => item.id === editingInvoiceId ? { ...invoice, id: item.id, number: item.number, deliveryAttempts: item.deliveryAttempts, reconciliations: item.reconciliations, creditNotes: item.creditNotes, status: "Draft", approvalBy: "", issuedAt: "" } : item), audit: [createAudit(editingInvoiceId, opp.id, "Draft invoice edited", "Draft", "Draft", actor), ...state.audit] }, "Draft invoice updated. Its opportunity and billing data are still linked.");
    } else {
      save({ ...state, invoices: [invoice, ...state.invoices], audit: [createAudit(id, opp.id, "Draft invoice created", "—", "Draft", actor), ...state.audit] }, "Draft invoice created and linked to the opportunity.");
    }
    setDialog(null); setFormError(""); setEditingInvoiceId("");
  }
  function issue(invoice: InvoiceRecord) {
    if (invoice.status !== "Approved") return;
    const sequence = state.invoiceSequence;
    const number = `IF/${financialYear()}/${String(sequence).padStart(4, "0")}`;
    if (state.invoices.some(item => item.number === number && item.id !== invoice.id)) { setNotice("Invoice number conflict. Reload and try again."); return; }
    const next = { ...state, invoiceSequence: sequence + 1, invoices: state.invoices.map(item => item.id === invoice.id ? { ...item, number, status: "Issued" as const, issuedAt: new Date().toISOString() } : item), audit: [createAudit(invoice.id, invoice.opportunityId, "Invoice issued", "Approved", "Issued", actor, number), ...state.audit] };
    save(next, `Invoice ${number} issued. This issued document is locked against direct edits.`);
  }
  function recordCancel(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!activeInvoice || !reason.trim()) { setFormError("Record a cancellation reason."); return; } patchInvoice(activeInvoice.id, { status: "Cancelled", cancelledReason: reason.trim() }, "Invoice cancelled", reason.trim()); setDialog(null); setActiveInvoice(null); setReason(""); }
  function addCredit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const amount = Number(allocationAmount); if (!activeInvoice || !reason.trim() || !Number.isFinite(amount) || amount <= 0 || amount > totalInvoice(activeInvoice.lines)) { setFormError("Enter a valid credit note amount and reason."); return; } const entry = { id: `CN-${String(Date.now()).slice(-8)}`, amount, reason: reason.trim(), at: new Date().toISOString() }; patchInvoice(activeInvoice.id, { creditNotes: [...activeInvoice.creditNotes, entry] }, "Credit note recorded", `${entry.id} · ${formatMoney(amount)} · ${entry.reason}`); setDialog(null); setReason(""); setAllocationAmount(""); setActiveInvoice(null); }
  function reconcile(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const amount = Number(allocationAmount); const payment = state.payments.find(item => item.id === paymentId && item.status === "Verified" && item.opportunityId === activeInvoice?.opportunityId); if (!activeInvoice || !payment || amount <= 0 || amount > invoiceBalance(activeInvoice)) { setFormError("Choose a verified payment and an allocation within the invoice balance."); return; } const allocated = state.invoices.reduce((sum, invoice) => sum + invoice.reconciliations.filter(item => item.paymentId === payment.id).reduce((v, item) => v + item.amount, 0), 0); if (allocated + amount > payment.amount) { setFormError("This allocation exceeds the verified payment's remaining balance."); return; } const entry = { paymentId: payment.id, amount, at: new Date().toISOString() }; const paidAfter = invoicePaid(activeInvoice) + amount; const total = totalInvoice(activeInvoice.lines); const nextStatus: InvoiceState = paidAfter >= total ? "Paid" : "Partially Paid"; const next = { ...state, invoices: state.invoices.map(invoice => invoice.id === activeInvoice.id ? { ...invoice, reconciliations: [...invoice.reconciliations, entry], status: nextStatus } : invoice), audit: [createAudit(activeInvoice.id, activeInvoice.opportunityId, "Verified payment allocated", activeInvoice.status, nextStatus, actor, `${payment.id} · ${formatMoney(amount)}`), ...state.audit] }; save(next, `${formatMoney(amount)} allocated from verified payment ${payment.id}.`); setDialog(null); setAllocationAmount(""); setPaymentId(""); setActiveInvoice(null); setFormError(""); }
  function openPrint(invoice: InvoiceRecord) {
    const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
    const rows = invoice.lines.map(line => `<tr><td>${escape(line.description)}</td><td>${line.quantity}</td><td>${formatMoney(line.unitPrice)}</td><td>${line.gstRate}%</td><td>${formatMoney(line.quantity * line.unitPrice)}</td><td>${formatMoney(line.quantity * line.unitPrice * line.gstRate / 100)}</td></tr>`).join("");
    const party = invoice.parties[0];
    const output = window.open("", "_blank", "width=900,height=700");
    if (!output) { setNotice("Allow popups to print the invoice."); return; }
    output.document.write(`<!doctype html><html><head><title>${escape(invoice.number)}</title><style>body{font:14px Arial,sans-serif;color:#171717;margin:42px}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}th{background:#f5f5f5}.total{text-align:right;font-weight:700;margin-top:24px}.notice{margin-top:24px;color:#666;font-size:12px}@media print{button{display:none}}</style></head><body><h1>Invoice ${escape(invoice.number)}</h1><p>Date: ${escape(invoice.invoiceDate)} · Due: ${escape(invoice.dueDate || "Not specified")}</p><h2>Seller</h2><p>Issuing entity details must be configured before production use.</p><h2>Bill to</h2><p>${escape(party.name)}<br>${escape(party.address)}<br>${escape(party.email)}<br>${escape(party.phone)}<br>${escape(party.gstin || "GSTIN not supplied")}</p><p>Brand: ${escape(invoice.brand)} · Opportunity: ${escape(invoice.opportunityId)}</p><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>GST</th><th>Taxable</th><th>Tax</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total: ${formatMoney(totalInvoice(invoice.lines))}</p><p class="notice">Preview print copy. Configure verified seller, GST and payment details before issuing a legally compliant invoice.</p><button onclick="window.print()">Print / Save as PDF</button><script>setTimeout(()=>window.print(),250)</script></body></html>`);
    output.document.close();
    save({ ...state, audit: [createAudit(invoice.id, invoice.opportunityId, "Invoice print preview opened", invoice.status, invoice.status, actor), ...state.audit] }, "Print preview opened. Choose Save as PDF in the browser to download a local copy.");
  }

  const rowsForTable = useMemo(() => {
    const filtered = invoiceRows.filter(invoice => columnOrder.every(column => {
      const query = columnFilters[column]?.trim().toLowerCase();
      if (!query) return true;
      return invoiceColumnText(invoice, column).toLowerCase().includes(query);
    }));
    return filtered.sort((a, b) => {
    if (columnSort) {
      const left = invoiceColumnText(a, columnSort.column);
      const right = invoiceColumnText(b, columnSort.column);
      const compared = columnSort.column === "Amount" ? totalInvoice(a.lines) - totalInvoice(b.lines)
        : columnSort.column === "Paid" ? invoicePaid(a) - invoicePaid(b)
          : columnSort.column === "Issued" ? a.invoiceDate.localeCompare(b.invoiceDate)
            : columnSort.column === "Due" ? a.dueDate.localeCompare(b.dueDate)
              : left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
      return compared * (columnSort.direction === "desc" ? -1 : 1);
    }
    const priority: Record<InvoiceState, number> = { Overdue: 0, "Pending Approval": 1, Approved: 2, Sent: 3, Issued: 4, "Partially Paid": 5, Draft: 6, Paid: 7, Cancelled: 8 };
    const compared = sortBy === "Issue date" ? a.invoiceDate.localeCompare(b.invoiceDate)
      : sortBy === "Due date" ? a.dueDate.localeCompare(b.dueDate)
        : sortBy === "Amount" ? totalInvoice(a.lines) - totalInvoice(b.lines)
          : sortBy === "Customer" ? (a.parties[0]?.name || initialOpportunities.find(item => item.id === a.opportunityId)?.name || "").localeCompare(b.parties[0]?.name || initialOpportunities.find(item => item.id === b.opportunityId)?.name || "")
            : priority[a.status] - priority[b.status] || a.dueDate.localeCompare(b.dueDate);
    return compared * (sortDescending ? -1 : 1);
  });
  }, [invoiceRows, sortBy, sortDescending, columnSort, columnFilters, columnOrder]);
  const newInvoice = () => { setEditingInvoiceId(""); setNewInvoiceStep("customer"); setCustomerPickerOpen(false); setNewInvoiceCustomerId(""); setNewInvoiceSearch(""); setDraft(draftFor("")); setFormError(""); setDialog("create"); };
  const editDraft = (invoice: InvoiceRecord) => { setEditingInvoiceId(invoice.id); setDraft({ opportunityId: invoice.opportunityId, billingType: invoice.billingType, parties: invoice.parties.map(party => ({ ...party })), recipients: invoice.recipients.join(", "), lines: invoice.lines.map(line => ({ ...line })), invoiceDate: invoice.invoiceDate, dueDate: invoice.dueDate }); setFormError(""); setDialog("create"); };
  const chosenNewInvoiceCustomer = initialOpportunities.find(item => item.id === newInvoiceCustomerId);
  const matchingNewInvoiceCustomers = initialOpportunities.filter((item, index, list) => list.findIndex(candidate => candidate.name === item.name) === index && item.name.toLowerCase().includes(newInvoiceSearch.toLowerCase()));
  const beginInvoiceWriting = () => {
    if (!chosenNewInvoiceCustomer || newInvoiceCustomerId !== chosenNewInvoiceCustomer.id) return;
    const nextDraft = draftFor(chosenNewInvoiceCustomer.id);
    setDraft({ ...nextDraft, dueDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(Date.now() + 30 * 86400000)) });
    const invoice: InvoiceRecord = { id: `INV-${Date.now()}`, number: "DRAFT", opportunityId: chosenNewInvoiceCustomer.id, brand: chosenNewInvoiceCustomer.brand, model: "Franchise model", billingType: "Company", parties: [{ ...nextDraft.parties[0], address: "12 Market Road, Bengaluru, Karnataka", allocation: nextDraft.lines[0]?.unitPrice ?? 0 }], recipients: [chosenNewInvoiceCustomer.email], lines: nextDraft.lines.map(line => ({ ...line, details: `Billing for ${chosenNewInvoiceCustomer.brand} subscription` })), currency: "INR", title: "Invoice", documentNumber: "INV-DRAFT", issuerName: "iFranchise", issuerDetails: "Seller details", issuerTaxId: "", paymentDetails: "Payment instructions will appear here.", notes: "Thank you for your business.", invoiceDate: nextDraft.invoiceDate, dueDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(Date.now() + 30 * 86400000)), status: "Draft", approvalBy: "", issuedAt: "", delivery: "Not Sent", deliveryAttempts: [], reconciliations: [], cancelledReason: "", creditNotes: [] };
    setComposerInvoice(invoice);
    setComposerDisplay("side");
    setComposerSize(null);
    setDialog(null);
  };
  const saveComposerInvoice = (invoice: InvoiceRecord, submitForApproval = false) => {
    const existing = state.invoices.some(item => item.id === invoice.id);
    const savedInvoice = { ...invoice, status: submitForApproval ? "Pending Approval" as const : "Draft" as const };
    const next = { ...state, invoices: existing ? state.invoices.map(item => item.id === invoice.id ? savedInvoice : item) : [savedInvoice, ...state.invoices], audit: [createAudit(invoice.id, invoice.opportunityId, submitForApproval ? "Invoice submitted for approval" : "Draft invoice created", existing ? "Draft" : "—", savedInvoice.status, actor), ...state.audit] };
    save(next, submitForApproval ? "Invoice submitted for approval. It can be sent after approval and issue." : "Invoice draft saved.");
    setComposerInvoice(null);
  };
  const openOperation = (invoice: InvoiceRecord, kind: Exclude<DialogKind, "create" | null>) => { setActiveInvoice(invoice); setFormError(""); setReason(""); setAllocationAmount(""); setPaymentId(""); setDialog(kind); };
  const openDetails = (invoice: InvoiceRecord) => { setSelectedInvoice(invoice); setInvoiceZoom(0.9); };
  const openDetailsOnKey = (event: KeyboardEvent<HTMLTableRowElement>, invoice: InvoiceRecord) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDetails(invoice); } };
  const primaryAction = (text: string, fn: () => void) => <Button onClick={fn}>{text}</Button>;
  function exportInvoices() {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [["Invoice", "Customer", "Status", "Amount", "Issued", "Due", "Contract", "Paid", "Method"], ...rowsForTable.map(invoice => [invoice.number, invoice.parties[0]?.name || initialOpportunities.find(item => item.id === invoice.opportunityId)?.name, invoice.status, totalInvoice(invoice.lines), invoice.invoiceDate, invoice.dueDate, `${invoice.opportunityId} · ${invoice.brand}`, invoicePaid(invoice), invoice.reconciliations.length ? "Recorded payment" : ""])].map(row => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "invoices.csv"; link.click(); URL.revokeObjectURL(url);
  }
  function copyViewLink() {
    void navigator.clipboard.writeText(window.location.href).then(() => setNotice("View link copied."), () => setNotice("Could not copy the view link."));
  }
  function invoiceLink(invoice: InvoiceRecord) { return `${window.location.origin}${window.location.pathname}#invoice=${encodeURIComponent(invoice.id)}`; }
  function copyInvoiceLink(invoice: InvoiceRecord) {
    void navigator.clipboard.writeText(invoiceLink(invoice)).then(() => setNotice("Invoice link copied."), () => setNotice("Could not copy the invoice link."));
  }
  function sendInvoiceByMessage(invoice: InvoiceRecord) {
    const message = `Invoice ${invoice.number} · ${formatMoney(totalInvoice(invoice.lines))}\n${invoiceLink(invoice)}`;
    if (navigator.share) {
      void navigator.share({ title: `Invoice ${invoice.number}`, text: message }).then(() => setNotice("Invoice shared."), () => setNotice("Sharing was cancelled."));
      return;
    }
    void navigator.clipboard.writeText(message).then(() => setNotice("Invoice details copied. Paste them into your message."), () => setNotice("Could not prepare the invoice message."));
  }

  const invoiceColumnContent: Record<RegisterColumn, (invoice: InvoiceRecord) => ReactNode> = {
    Customer: invoice => <td key="customer"><span className="fin-invoice-customer"><span aria-hidden="true">{(invoice.parties[0]?.name || initialOpportunities.find(item => item.id === invoice.opportunityId)?.name || "I").slice(0, 1).toUpperCase()}</span>{invoice.parties[0]?.name || initialOpportunities.find(item => item.id === invoice.opportunityId)?.name || "—"}</span></td>,
    Status: invoice => <td key="status"><StatusLabel>{invoice.status}</StatusLabel></td>,
    Amount: invoice => <td key="amount">{formatMoney(totalInvoice(invoice.lines))}</td>,
    Issued: invoice => <td key="issued">{dateLabel(invoice.invoiceDate)}</td>,
    Due: invoice => <td key="due" className={invoice.status === "Overdue" ? "fin-invoice-due-overdue" : undefined}>{invoice.status === "Overdue" && invoice.dueDate ? `${Math.max(1, Math.floor((Date.now() - new Date(`${invoice.dueDate}T12:00:00+05:30`).getTime()) / 86400000))} days late` : dateLabel(invoice.dueDate)}</td>,
    Contract: invoice => <td key="contract">{invoice.opportunityId} · {invoice.brand}</td>,
    Paid: invoice => <td key="paid">{invoice.reconciliations.length ? dateLabel(invoice.reconciliations.reduce((latest, item) => item.at > latest ? item.at : latest, invoice.reconciliations[0].at).slice(0, 10)) : "—"}</td>,
    Method: invoice => { const method = invoice.paymentMethod ?? invoice.reconciliations.find(item => item.method)?.method; const badge = method?.includes("Stripe") ? "stripe" : method?.startsWith("Visa") ? "visa" : method?.includes("Amazon") ? "pay" : method?.includes("PayPal") ? "P" : method?.includes("Wise") ? "wise" : method?.includes("Revolut") ? "revolut" : "pay"; return <td key="method">{method ? <span className="fin-invoice-method"><span>{badge}</span>{method}</span> : "—"}</td>; },
    Actions: invoice => <td key="actions" onClick={event => event.stopPropagation()}><div className="fin-row-actions">{invoice.status === "Draft" ? <><TextAction onClick={() => editDraft(invoice)}>Edit</TextAction><TextAction onClick={() => patchInvoice(invoice.id, { status: "Pending Approval" }, "Submitted for approval")}>Submit</TextAction></> : null}{invoice.status === "Pending Approval" ? <TextAction onClick={() => patchInvoice(invoice.id, { status: "Approved", approvalBy: actor }, "Invoice approved")}>Approve</TextAction> : null}{invoice.status === "Approved" ? <TextAction onClick={() => issue(invoice)}>Issue</TextAction> : null}{!["Draft", "Cancelled"].includes(invoice.status) ? <TextAction onClick={() => openPrint(invoice)}>Preview PDF</TextAction> : null}{invoice.status !== "Cancelled" ? <TextAction danger onClick={() => openOperation(invoice, "cancel")}>Cancel</TextAction> : null}{!["Draft", "Cancelled"].includes(invoice.status) ? <TextAction onClick={() => openOperation(invoice, "credit")}>Credit note</TextAction> : null}</div></td>,
  };
  const dateLabel = (value: string) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T12:00:00+05:30`)) : "—";
  const orderedVisibleColumns = columnOrder.filter(column => visibleColumns.includes(column));
  const moveColumn = (column: ViewColumn, offset: number | "start" | "end") => setColumnOrder(current => {
    const from = current.indexOf(column);
    const to = offset === "start" ? 0 : offset === "end" ? current.length - 1 : Math.max(0, Math.min(current.length - 1, from + offset));
    if (from === to || from < 0) return current;
    const next = [...current];
    next.splice(from, 1);
    next.splice(to, 0, column);
    return next;
  });
  const columnHeader = (column: ViewColumn) => {
    const Icon = columnIcons[column];
    const position = columnOrder.indexOf(column);
    const sortIsActive = columnSort?.column === column;
    const closeColumnMenu = () => { setOpenColumnMenu(null); setColumnFilterTarget(null); };
    return <Dropdown key={column} isOpen={openColumnMenu === column} onOpenChange={open => setOpenColumnMenu(open ? column : null)}>
      <DropdownTrigger className="fin-invoice-column-trigger" aria-label={`${column} column options`} aria-expanded={openColumnMenu === column}>
        <Icon aria-hidden="true" /><span>{column}</span>{sortIsActive ? (columnSort.direction === "asc" ? <RiArrowUpSLine aria-label="Sorted ascending" /> : <RiArrowDownSLine aria-label="Sorted descending" />) : null}
      </DropdownTrigger>
      <DropdownPopover aria-label={`${column} column options`} placement="bottom start" className="fin-invoice-column-menu">
        <DropdownItem selected={sortIsActive && columnSort.direction === "asc"} onSelect={() => { setColumnSort({ column, direction: "asc" }); closeColumnMenu(); }}><RiArrowUpSLine aria-hidden="true" /><span>Ascending</span></DropdownItem>
        <DropdownItem selected={sortIsActive && columnSort.direction === "desc"} onSelect={() => { setColumnSort({ column, direction: "desc" }); closeColumnMenu(); }}><RiArrowDownSLine aria-hidden="true" /><span>Descending</span></DropdownItem>
        <DropdownItem selected={!sortIsActive && !columnSort} onSelect={() => { setColumnSort(null); closeColumnMenu(); }}><RiSubtractLine aria-hidden="true" /><span>No sorting</span>{!sortIsActive && !columnSort ? <RiCheckLine className="fin-invoice-column-check" aria-hidden="true" /> : null}</DropdownItem>
        <DropdownDivider />
        <DropdownItem onSelect={() => { setColumnFilterTarget(column); setViewSection("filter"); setOpenColumnMenu(null); setEditColumnsOpen(true); }}><RiFilter3Line aria-hidden="true" /><span>Filter column</span></DropdownItem>
        <DropdownDivider />
        <DropdownItem className={position >= columnOrder.length - 1 ? "is-disabled" : ""} onSelect={() => { if (position < columnOrder.length - 1) moveColumn(column, 1); closeColumnMenu(); }}><RiArrowRightLine aria-hidden="true" /><span>Move right</span></DropdownItem>
        <DropdownItem className={position <= 0 ? "is-disabled" : ""} onSelect={() => { if (position > 0) moveColumn(column, -1); closeColumnMenu(); }}><RiArrowLeftLine aria-hidden="true" /><span>Move left</span></DropdownItem>
        <DropdownItem className={position >= columnOrder.length - 1 ? "is-disabled" : ""} onSelect={() => { if (position < columnOrder.length - 1) moveColumn(column, "end"); closeColumnMenu(); }}><span className="fin-invoice-column-end-glyph" aria-hidden="true"><RiArrowRightLine /></span><span>Move to right end</span></DropdownItem>
        <DropdownItem className={position <= 0 ? "is-disabled" : ""} onSelect={() => { if (position > 0) moveColumn(column, "start"); closeColumnMenu(); }}><span className="fin-invoice-column-end-glyph is-left" aria-hidden="true"><RiArrowLeftLine /></span><span>Move to left end</span></DropdownItem>
        <DropdownDivider />
        <DropdownItem className="fin-invoice-hide-column" onSelect={() => { setVisibleColumns(current => current.filter(item => item !== column)); closeColumnMenu(); }}><RiEyeOffLine aria-hidden="true" /><span>Hide column</span></DropdownItem>
      </DropdownPopover>
    </Dropdown>;
  };

  const invoiceRegisterScreen = current === "Overview" || current === "Invoice register";
  return <ModuleFrame moduleId="invoices" moduleName="Invoices" icon="receipt" current={current === "Overview" ? "Overview" : current} views={[{ id: "Overview", label: "Invoices" }]} showPreviewNotice={false} className={`fin-invoice-shell${invoiceRegisterScreen ? " fin-invoice-register-screen" : ""}`} headerTitleOnly singleModuleSidebar>
    {notice ? <div className="fin-toast" role="status">{notice}</div> : null}
    {current === "Overview" || current === "Invoice register" ? <>
      <div className="fin-invoice-controls-row"><div className="fin-invoice-status-tabs" role="tablist" aria-label="Filter invoices by status">{statusTabs.map(tab => <button key={tab} type="button" role="tab" aria-selected={statusTab === tab} className={statusTab === tab ? "is-active" : ""} onClick={() => setStatusTab(tab)}>{tab}<span>{statusCount(tab)}</span></button>)}</div>
        <div className="fin-toolbar fin-invoice-toolbar"><Input className="fin-search" aria-label="Search invoices" placeholder="Search invoices" value={search} onChange={setSearch} fieldClassName="fin-input" />
          <Dropdown isOpen={filterOpen} onOpenChange={setFilterOpen}><DropdownTrigger className="fin-invoice-filter-trigger" aria-label="Filter invoices" aria-expanded={filterOpen}><span className="fin-invoice-filter-value"><RiFilter3Line aria-hidden="true" />Filter{activeFilterCount ? <span className="fin-invoice-filter-count">{activeFilterCount}</span> : null}</span></DropdownTrigger>
            <DropdownPopover aria-label="Invoice filters" placement="bottom end" offset={6} className="fin-invoice-filter-popover" dialogClassName="fin-invoice-filter-dialog">
              <div className="fin-invoice-filter-heading"><span>WHERE IT CAME FROM</span></div>
              <div className="fin-invoice-filter-section">{filterSources.map(source => <Checkbox key={source} size="md" className="fin-invoice-facet" isSelected={selectedSources.includes(source)} onChange={checked => setSelectedSources(current => checked ? [...current, source] : current.filter(item => item !== source))}>{source}</Checkbox>)}</div>
              <div className="fin-invoice-filter-heading"><span>HOW LATE</span></div>
              <div className="fin-invoice-filter-section">{lateRanges.map(range => <Checkbox key={range} size="md" className="fin-invoice-facet" isSelected={selectedLateRanges.includes(range)} onChange={checked => setSelectedLateRanges(current => checked ? [...current, range] : current.filter(item => item !== range))}>{range}</Checkbox>)}</div>
              <div className="fin-invoice-filter-heading"><span>CUSTOMER</span></div>
              <div className="fin-invoice-customer-scroll"><div className="fin-invoice-customer-facets" onScroll={filterFade.onScroll}>{customerFacets.map(([customer, count]) => <Checkbox key={customer} size="md" className="fin-invoice-facet fin-invoice-customer-facet" isSelected={selectedCustomers.includes(customer)} onChange={checked => setSelectedCustomers(current => checked ? [...current, customer] : current.filter(item => item !== customer))}><span className="fin-invoice-facet-customer"><span>{customer.slice(0, 1).toUpperCase()}</span><span>{customer}</span></span><span className="fin-invoice-facet-count">{count}</span></Checkbox>)}</div><ScrollFade progress={filterFade.progress} className="fin-invoice-filter-fade" /></div>
              <div className="fin-invoice-filter-footer"><span>{activeFilterCount ? `${activeFilterCount} filters selected` : "All invoices"}</span><Button variant="ghost" size="small" disabled={!activeFilterCount} onClick={() => { setSelectedSources([]); setSelectedLateRanges([]); setSelectedCustomers([]); }}>Clear filters</Button></div>
            </DropdownPopover>
          </Dropdown>
          <Button className="fin-invoice-toolbar-action fin-invoice-edit-view" variant="ghost" leadingIcon={RiLayoutColumnLine} aria-expanded={editColumnsOpen} onClick={() => setEditColumnsOpen(true)}>Edit View</Button><Button className="fin-invoice-toolbar-action fin-invoice-export" variant="ghost" leadingIcon={RiDownloadLine} onClick={exportInvoices}>Export</Button><Button className="fin-invoice-toolbar-action fin-invoice-new" leadingIcon={RiAddLine} onClick={newInvoice}>New invoice</Button></div></div>
      {showMetrics ? <div className="fin-invoice-metric-strip"><MetricCards items={[{ label: "Outstanding", value: formatMoney(outstanding), note: `${state.invoices.filter(invoice => invoiceBalance(invoice) > 0 && !["Draft", "Cancelled"].includes(invoice.status)).length} invoices waiting for payment` }, { label: "Overdue", value: formatMoney(overdueTotal), note: `${state.invoices.filter(invoice => invoice.status === "Overdue").length} invoices · oldest due first` }, { label: "Collected this month", value: formatMoney(collectedThisMonth), note: "Matched payments" }, { label: "Next 30 days", value: formatMoney(next30DaysTotal), note: `${statusCount("Upcoming")} invoices to go out` }]} /></div> : null}
      <section className="fin-invoice-register-panel" data-row-height={rowHeight.toLowerCase()} data-column-width={columnWidth.toLowerCase()}>
        <DataTable headers={[<TableSelectionCheckbox key="select-all" label="Select all invoices" isSelected={Boolean(rowsForTable.length) && rowsForTable.every(invoice => selectedInvoiceIds.includes(invoice.id))} isIndeterminate={rowsForTable.some(invoice => selectedInvoiceIds.includes(invoice.id)) && !rowsForTable.every(invoice => selectedInvoiceIds.includes(invoice.id))} onChange={checked => setSelectedInvoiceIds(checked ? [...new Set([...selectedInvoiceIds, ...rowsForTable.map(invoice => invoice.id)])] : selectedInvoiceIds.filter(id => !rowsForTable.some(invoice => invoice.id === id)))} />, "#", <span className="fin-invoice-static-column" key="invoice"><RiHashtag aria-hidden="true" />Invoice</span>, ...orderedVisibleColumns.map(columnHeader)]} empty={!rowsForTable.length}>
          {rowsForTable.map((invoice, index) => <tr key={invoice.id} onClick={() => openDetails(invoice)} onKeyDown={event => openDetailsOnKey(event, invoice)} tabIndex={0} className="fin-invoice-clickable-row"><td><TableSelectionCheckbox label={`Select invoice ${invoice.number}`} isSelected={selectedInvoiceIds.includes(invoice.id)} onChange={checked => setSelectedInvoiceIds(current => checked ? [...new Set([...current, invoice.id])] : current.filter(id => id !== invoice.id))} /></td><td>{index + 1}</td><td><strong>{invoice.number}</strong><small>{invoice.id}</small></td>{orderedVisibleColumns.map(column => invoiceColumnContent[column](invoice))}</tr>)}
        </DataTable></section>
    </> : null}
    {current !== "Overview" && current !== "Invoice register" ? <>
      <PageHeading title={current} description={current === "Reconciliation" ? "Allocate verified payments to the invoice they actually settle." : current === "Delivery" ? "Delivery is tracked separately from invoice issue and payment status." : current === "Credit notes" ? "Corrections preserve the issued invoice and record a separate adjustment." : current === "Approvals" ? "Approve a draft before assigning its sequential invoice number and issuing it." : "Search and manage invoices without deleting issued records."} actions={current === "Approvals" ? primaryAction("New invoice", newInvoice) : undefined} />
      {current === "Delivery" ? <p className="fin-config-callout">Email provider is not configured. The app will not claim that an invoice was sent or delivered. PDF print preview is available from the invoice register.</p> : null}
      <div className="fin-toolbar"><Input className="fin-search" aria-label="Search invoices" placeholder="Search invoice, customer or opportunity" value={search} onChange={setSearch} fieldClassName="fin-input" />{current !== "Credit notes" ? <Select aria-label="Filter invoice status" selectedKey={filter} onSelectionChange={key => setFilter(String(key))}><SelectItem id="All statuses">All statuses</SelectItem>{["Draft", "Pending Approval", "Approved", "Issued", "Sent", "Partially Paid", "Paid", "Overdue", "Cancelled"].map(status => <SelectItem key={status} id={status}>{status}</SelectItem>)}</Select> : null}<span className="fin-toolbar-note">{rowsForTable.length} records</span></div>
      <section className="fin-panel"><DataTable headers={current === "Reconciliation" ? ["Invoice", "Opportunity", "Invoice value", "Verified allocated", "Outstanding", "Payment history", "Actions"] : current === "Delivery" ? ["Invoice", "Recipients", "Invoice status", "Delivery status", "Attempts", "Actions"] : current === "Credit notes" ? ["Credit note", "Invoice", "Reason", "Amount", "Date"] : ["Invoice", "Opportunity / billing party", "Billing", "Date", "Invoice total", "Reconciled", "Outstanding", "Invoice status", "Actions"]} empty={!rowsForTable.length}>{rowsForTable.flatMap(invoice => current === "Credit notes" ? invoice.creditNotes.map(note => <tr key={note.id} onClick={() => openDetails(invoice)} onKeyDown={event => openDetailsOnKey(event, invoice)} tabIndex={0} className="fin-invoice-clickable-row"><td><strong>{note.id}</strong></td><td>{invoice.number}<small>{invoice.id}</small></td><td>{note.reason}</td><td>{formatMoney(note.amount)}</td><td>{new Date(note.at).toLocaleDateString("en-IN")}</td></tr>) : current === "Delivery" ? [<tr key={invoice.id} onClick={() => openDetails(invoice)} onKeyDown={event => openDetailsOnKey(event, invoice)} tabIndex={0} className="fin-invoice-clickable-row"><td><strong>{invoice.number}</strong><small>{invoice.id}</small></td><td>{invoice.recipients.join(", ") || "No recipient"}</td><td><StatusLabel>{invoice.status}</StatusLabel></td><td><StatusLabel>{invoice.delivery}</StatusLabel></td><td>{invoice.deliveryAttempts.length}</td><td onClick={event => event.stopPropagation()}><TextAction onClick={() => openPrint(invoice)}>Print / save PDF</TextAction></td></tr>] : current === "Reconciliation" ? [<tr key={invoice.id} onClick={() => openDetails(invoice)} onKeyDown={event => openDetailsOnKey(event, invoice)} tabIndex={0} className="fin-invoice-clickable-row"><td><strong>{invoice.number}</strong><small>{invoice.id}</small></td><td>{invoice.opportunityId}</td><td>{formatMoney(totalInvoice(invoice.lines))}</td><td>{formatMoney(invoicePaid(invoice))}</td><td><strong>{formatMoney(invoiceBalance(invoice))}</strong></td><td>{invoice.reconciliations.map(item => item.paymentId).join(", ") || "No allocations"}</td><td onClick={event => event.stopPropagation()}><TextAction disabled={invoiceBalance(invoice) <= 0 || ["Cancelled", "Draft"].includes(invoice.status)} onClick={() => openOperation(invoice, "reconcile")}>Allocate payment</TextAction></td></tr>] : [<tr key={invoice.id} onClick={() => openDetails(invoice)} onKeyDown={event => openDetailsOnKey(event, invoice)} tabIndex={0} className="fin-invoice-clickable-row"><td><strong>{invoice.number}</strong><small>{invoice.id}</small></td><td>{initialOpportunities.find(item => item.id === invoice.opportunityId)?.name}<small>{invoice.opportunityId} · {invoice.brand}</small></td><td>{invoice.parties.map(party => party.name).join(", ")}<small>{invoice.billingType}</small></td><td>{invoice.invoiceDate}</td><td>{formatMoney(totalInvoice(invoice.lines))}</td><td>{formatMoney(invoicePaid(invoice))}</td><td>{formatMoney(invoiceBalance(invoice))}</td><td><StatusLabel>{invoice.status}</StatusLabel></td><td onClick={event => event.stopPropagation()}><div className="fin-row-actions">{invoice.status === "Draft" ? <><TextAction onClick={() => editDraft(invoice)}>Edit</TextAction><TextAction onClick={() => patchInvoice(invoice.id, { status: "Pending Approval" }, "Submitted for approval")}>Submit</TextAction></> : null}{invoice.status === "Pending Approval" ? <TextAction onClick={() => patchInvoice(invoice.id, { status: "Approved", approvalBy: actor }, "Invoice approved")}>Approve</TextAction> : null}{invoice.status === "Approved" ? <TextAction onClick={() => issue(invoice)}>Issue</TextAction> : null}{!["Draft", "Cancelled"].includes(invoice.status) ? <TextAction onClick={() => openPrint(invoice)}>Preview PDF</TextAction> : null}{invoice.status !== "Cancelled" ? <TextAction danger onClick={() => openOperation(invoice, "cancel")}>Cancel</TextAction> : null}{!["Draft", "Cancelled"].includes(invoice.status) ? <TextAction onClick={() => openOperation(invoice, "credit")}>Credit note</TextAction> : null}</div></td></tr>])}</DataTable></section>
    </> : null}
    {current === "Audit history" ? <section className="fin-panel"><DataTable headers={["Record", "Opportunity", "Action", "From", "To", "Actor", "At", "Details"]} empty={!state.audit.length}>{state.audit.filter(item => item.recordId.startsWith("INV") || item.recordId.startsWith("CN")).map(item => <tr key={item.id}><td>{item.recordId}</td><td>{item.opportunityId || "—"}</td><td>{item.action}</td><td>{item.previous}</td><td>{item.next}</td><td>{item.by}</td><td>{new Date(item.at).toLocaleString("en-IN")}</td><td>{item.remarks}</td></tr>)}</DataTable></section> : null}
    <Modal isOpen={editColumnsOpen} onOpenChange={open => { setEditColumnsOpen(open); if (!open) setViewSection("main"); }} size="wide" overlayClassName="fin-invoice-view-overlay" className="fin-invoice-view-dialog" aria-label={viewSection === "main" ? "Manage invoice view" : `Edit ${viewSection}`}>
      {viewSection === "main" ? <ModalHeader title="Manage View:" className="fin-invoice-view-header" /> : <div className="fin-invoice-view-subheader"><button type="button" onClick={() => setViewSection("main")}><RiArrowLeftSLine aria-hidden="true" />Back</button><h2>{viewSection === "rowHeight" ? "Edit Row Height:" : viewSection === "columnWidth" ? "Edit Column Width:" : viewSection === "columns" ? "Edit Columns:" : viewSection === "filter" ? "Edit Filter:" : "Edit Sort:"}</h2><IconButton icon={RiCloseLine} size="small" aria-label="Close Manage View" title="Close" onClick={() => { setEditColumnsOpen(false); setViewSection("main"); }} /></div>}
      <ModalBody className="fin-invoice-view-body">
        {viewSection === "main" ? <div className="fin-invoice-view-content">
          <div className="fin-invoice-view-card">
            <button type="button" className="fin-invoice-view-row" onClick={copyViewLink}><RiLinkM aria-hidden="true" /><span className="fin-invoice-view-label">Copy Link</span><RiArrowRightSLine aria-hidden="true" /></button>
            <button type="button" className="fin-invoice-view-row" onClick={() => setShowMetrics(value => !value)}><RiApps2Line aria-hidden="true" /><span className="fin-invoice-view-label">Overview Cards</span><span className="fin-invoice-view-value">{showMetrics ? "Show" : "Hidden"}<RiArrowRightSLine aria-hidden="true" /></span></button>
          </div>
          <div className="fin-invoice-view-card">
            <button type="button" className="fin-invoice-view-row" onClick={() => setViewSection("rowHeight")}><RiLayoutRowLine aria-hidden="true" /><span className="fin-invoice-view-label">Row Height</span><span className="fin-invoice-view-value">{rowHeight}<RiArrowRightSLine aria-hidden="true" /></span></button>
            <button type="button" className="fin-invoice-view-row" onClick={() => setViewSection("columnWidth")}><RiArrowLeftRightLine aria-hidden="true" /><span className="fin-invoice-view-label">Column Width</span><span className="fin-invoice-view-value">{columnWidth}<RiArrowRightSLine aria-hidden="true" /></span></button>
            <button type="button" className="fin-invoice-view-row" disabled={columnWidth === "Default"} onClick={() => { setColumnWidth("Default"); setNotice("Column widths reset."); }}><RiRestartLine aria-hidden="true" /><span className="fin-invoice-view-label">Reset Column Width</span></button>
          </div>
          <div className="fin-invoice-view-card">
            <button type="button" className="fin-invoice-view-row" onClick={() => setViewSection("columns")}><RiLayoutColumnLine aria-hidden="true" /><span className="fin-invoice-view-label">Columns</span><span className="fin-invoice-view-value">{visibleColumns.length === viewColumns.length ? "Show All" : `${visibleColumns.length} shown`}<RiArrowRightSLine aria-hidden="true" /></span></button>
            <button type="button" className="fin-invoice-view-row" onClick={() => setViewSection("filter")}><RiFilter3Line aria-hidden="true" /><span className="fin-invoice-view-label">Filter</span><span className="fin-invoice-view-value">{statusTab}{activeFilterCount ? ` · ${activeFilterCount}` : ""}<RiArrowRightSLine aria-hidden="true" /></span></button>
            <button type="button" className="fin-invoice-view-row" onClick={() => setViewSection("sort")}><RiArrowUpDownLine aria-hidden="true" /><span className="fin-invoice-view-label">Sort</span><span className="fin-invoice-view-value">{sortBy} {sortDescending ? "↓" : "↑"}<RiArrowRightSLine aria-hidden="true" /></span></button>
          </div>
          <div className="fin-invoice-view-card"><button type="button" className="fin-invoice-view-row" onClick={exportInvoices}><RiDownloadLine aria-hidden="true" /><span className="fin-invoice-view-label">Export Table</span></button></div>
        </div> : null}
        {viewSection === "rowHeight" ? <div className="fin-invoice-view-content"><div className="fin-invoice-view-card">{[{ name: "Compact", note: "More rows on screen" }, { name: "Default", note: "Balanced for reading" }, { name: "Comfortable", note: "Extra room around each row" }].map(option => <button key={option.name} type="button" className="fin-invoice-view-choice" aria-pressed={rowHeight === option.name} onClick={() => setRowHeight(option.name)}><span><strong>{option.name}</strong><small>{option.note}</small></span>{rowHeight === option.name ? <RiCheckLine aria-hidden="true" /> : null}</button>)}</div></div> : null}
        {viewSection === "columnWidth" ? <div className="fin-invoice-view-content"><div className="fin-invoice-view-card">{[{ name: "Compact", note: "Narrower columns, fewer scrolls" }, { name: "Default", note: "Each column’s standard width" }, { name: "Wide", note: "Roomier columns for long values" }].map(option => <button key={option.name} type="button" className="fin-invoice-view-choice" aria-pressed={columnWidth === option.name} onClick={() => setColumnWidth(option.name)}><span><strong>{option.name}</strong><small>{option.note}</small></span>{columnWidth === option.name ? <RiCheckLine aria-hidden="true" /> : null}</button>)}</div></div> : null}
        {viewSection === "columns" ? <div className="fin-invoice-view-content"><div className="fin-invoice-view-selection-head"><span>{visibleColumns.length === viewColumns.length ? "All columns shown" : `${visibleColumns.length} of ${viewColumns.length} columns shown`}</span><button type="button" onClick={() => { const showAll = visibleColumns.length !== viewColumns.length; setVisibleColumns(showAll ? [...viewColumns] : []); if (showAll) setColumnOrder([...viewColumns]); }}>{visibleColumns.length === viewColumns.length ? "Deselect all" : "Show all"}</button></div><div className="fin-invoice-view-card fin-invoice-view-column-list"><Checkbox className="fin-invoice-column-row" size="md" isSelected isDisabled><RiHashtag aria-hidden="true" /><span>Invoice</span><RiLockLine aria-hidden="true" /></Checkbox>{viewColumns.map(column => { const Icon = columnIcons[column]; return <Checkbox key={column} className="fin-invoice-column-row" size="md" isSelected={visibleColumns.includes(column)} onChange={checked => setVisibleColumns(current => checked ? [...current, column] : current.filter(item => item !== column))}><Icon aria-hidden="true" /><span>{column}</span></Checkbox>; })}</div></div> : null}
        {viewSection === "filter" ? <div className="fin-invoice-view-content">
          {columnFilterTarget === "Status" || columnFilterTarget === null ? <div className="fin-invoice-view-card">{[{ name: "All", note: "Every invoice", count: statusCount("All") }, { name: "Drafts", note: "Written, not sent yet", count: statusCount("Drafts") }, { name: "Sent", note: "Waiting for payment, not due yet", count: statusCount("Sent") }, { name: "Overdue", note: "Past the due date", count: statusCount("Overdue") }, { name: "Paid", note: "Paid in full", count: statusCount("Paid") }, { name: "Upcoming", note: "The next bill of each live contract", count: statusCount("Upcoming") }].map(option => <button key={option.name} type="button" className="fin-invoice-view-filter-choice" aria-pressed={statusTab === option.name} onClick={() => { setStatusTab(option.name); if (columnFilterTarget === null) setViewSection("main"); }}><span className={`fin-invoice-filter-dot fin-invoice-filter-dot-${option.name.toLowerCase()}`} /><span><strong>{option.name}</strong><small>{option.count} · {option.note}</small></span>{statusTab === option.name ? <RiCheckLine aria-hidden="true" /> : null}</button>)}</div>
            : columnFilterTarget === "Customer" ? <><p className="fin-invoice-view-section-label">CUSTOMER</p><div className="fin-invoice-view-card fin-invoice-filter-customer-list">{customerFacets.map(([customer, count]) => <Checkbox key={customer} size="md" className="fin-invoice-facet fin-invoice-customer-facet" isSelected={selectedCustomers.includes(customer)} onChange={checked => setSelectedCustomers(current => checked ? [...current, customer] : current.filter(item => item !== customer))}><span className="fin-invoice-facet-customer"><span>{customer.slice(0, 1).toUpperCase()}</span><span>{customer}</span></span><span className="fin-invoice-facet-count">{count}</span></Checkbox>)}</div><Button variant="ghost" size="small" disabled={!selectedCustomers.length} onClick={() => setSelectedCustomers([])}>Clear customer filters</Button></>
              : <><p className="fin-invoice-view-section-label">{columnFilterTarget.toUpperCase()}</p><div className="fin-invoice-view-card fin-invoice-column-filter-editor"><Input aria-label={`Filter ${columnFilterTarget}`} placeholder={`Search ${columnFilterTarget.toLowerCase()}`} value={columnFilters[columnFilterTarget] ?? ""} onChange={value => setColumnFilters(current => ({ ...current, [columnFilterTarget]: value }))} fieldClassName="fin-input" /><Button variant="ghost" size="small" disabled={!columnFilters[columnFilterTarget]} onClick={() => setColumnFilters(current => ({ ...current, [columnFilterTarget]: "" }))}>Clear filter</Button></div></>}
+        </div> : null}
        {viewSection === "sort" ? <div className="fin-invoice-view-content"><p className="fin-invoice-view-section-label">SORT BY</p><div className="fin-invoice-view-card">{["Default", "Issue date", "Due date", "Amount", "Customer", "Needs attention"].map(option => <button key={option} type="button" className="fin-invoice-view-sort-choice" aria-pressed={sortBy === option || (option === "Default" && sortBy === "Needs attention")} onClick={() => setSortBy(option === "Default" ? "Needs attention" : option)}>{option}{(sortBy === option || (option === "Default" && sortBy === "Needs attention")) ? <RiCheckLine aria-hidden="true" /> : null}</button>)}</div><p className="fin-invoice-view-section-label">DIRECTION</p><div className="fin-invoice-view-card"><button type="button" className="fin-invoice-view-direction" role="switch" aria-checked={sortDescending} onClick={() => setSortDescending(value => !value)}><span><strong>{sortDescending ? "Descending" : "Ascending"}</strong><small>{sortDescending ? "Largest or latest first" : "Smallest or earliest first"}</small></span><span className={`fin-invoice-switch${sortDescending ? " is-on" : ""}`} /></button></div></div> : null}
      </ModalBody>
    </Modal>
    <InvoiceSidePanel isOpen={Boolean(selectedInvoice)} onClose={() => setSelectedInvoice(null)} className="fin-invoice-detail-dialog" label={selectedInvoice ? `Invoice ${selectedInvoice.number}` : "Invoice detail"}>
      {selectedInvoice ? <InvoiceDetailView invoice={state.invoices.find(item => item.id === selectedInvoice.id) ?? selectedInvoice} zoom={invoiceZoom} onZoom={setInvoiceZoom} onClose={() => setSelectedInvoice(null)} onPrint={openPrint} onEdit={invoice => { setSelectedInvoice(null); editDraft(invoice); }} /> : null}
    </InvoiceSidePanel>
    <InvoiceSidePanel isOpen={dialog === "create" && !editingInvoiceId} onClose={() => setDialog(null)} className="fin-invoice-new-dialog" label="New invoice">
      <div className="fin-invoice-new-header"><RiFileEditLine aria-hidden="true" /><h2>New invoice</h2><IconButton icon={RiCloseLine} size="small" aria-label="Close new invoice" title="Close" onClick={() => setDialog(null)} /></div>
      <ModalBody className="fin-invoice-new-body">
        {newInvoiceStep === "customer" ? <section className="fin-invoice-create-section"><label className="fin-invoice-create-label" htmlFor="invoice-customer-search">Customer</label>{customerPickerOpen ? <><Input id="invoice-customer-search" aria-label="Search customers" placeholder="Search customers" value={newInvoiceSearch} onChange={setNewInvoiceSearch} leadingIcon={RiSearchLine} fieldClassName="fin-input" /><div className="fin-invoice-create-customer-list"><p>Suggested</p>{matchingNewInvoiceCustomers.slice(0, 4).map(customer => <button type="button" key={customer.id} className="fin-invoice-create-customer" onClick={() => { setNewInvoiceCustomerId(customer.id); setDraft(draftFor(customer.id)); setNewInvoiceStep("contract"); }}><span className="fin-invoice-customer-mark">{customer.name.slice(0, 1).toUpperCase()}</span><span><strong>{customer.name}</strong><small>{customer.brand}</small></span><RiArrowRightSLine aria-hidden="true" /></button>)}<p>All customers</p>{matchingNewInvoiceCustomers.slice(4).map(customer => <button type="button" key={customer.id} className="fin-invoice-create-customer" onClick={() => { setNewInvoiceCustomerId(customer.id); setDraft(draftFor(customer.id)); setNewInvoiceStep("contract"); }}><span className="fin-invoice-customer-mark">{customer.name.slice(0, 1).toUpperCase()}</span><span><strong>{customer.name}</strong><small>{customer.email}</small></span><RiArrowRightSLine aria-hidden="true" /></button>)}</div></> : <button type="button" className="fin-invoice-customer-picker-trigger" onClick={() => setCustomerPickerOpen(true)}>Choose a customer<RiArrowRightSLine aria-hidden="true" /></button>}</section> : <section className="fin-invoice-create-section"><label className="fin-invoice-create-label">Customer</label><button type="button" className="fin-invoice-selected-customer" onClick={() => { setNewInvoiceStep("customer"); setCustomerPickerOpen(true); }}><span className="fin-invoice-customer-mark">{chosenNewInvoiceCustomer?.name.slice(0, 1).toUpperCase()}</span><strong>{chosenNewInvoiceCustomer?.name}</strong><RiArrowRightSLine aria-hidden="true" /></button><label className="fin-invoice-create-label">Contract</label><button type="button" className="fin-invoice-contract-card" aria-pressed={Boolean(newInvoiceCustomerId)}><span><RiFileEditLine aria-hidden="true" /><strong>CT-{chosenNewInvoiceCustomer?.id.slice(-4)} · {chosenNewInvoiceCustomer?.brand} subscription</strong><small><i />Active <span>·</span> {formatMoney(chosenNewInvoiceCustomer?.value ?? 0)} per quarter</small></span><RiCheckLine aria-hidden="true" /></button><p className="fin-invoice-create-note">The invoice starts with one line for the contract’s billing period. You can change it before sending.</p></section>}
      </ModalBody>
      <ModalFooter className="fin-invoice-new-footer"><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button leadingIcon={RiAddLine} disabled={!chosenNewInvoiceCustomer} onClick={beginInvoiceWriting}>Write invoice</Button></ModalFooter>
    </InvoiceSidePanel>
    <InvoiceSidePanel isOpen={Boolean(composerInvoice)} onClose={() => setComposerInvoice(null)} className={`fin-invoice-composer-dialog${composerDisplay === "full" ? " is-fullscreen" : ""}${composerDisplay === "popup" ? " is-popup" : ""}${composerDisplay === "minimized" ? " is-minimized" : ""}`} label="Write invoice" style={composerDisplay === "popup" ? { left: `${composerPosition.left}px`, top: `${composerPosition.top}px`, ...(composerSize ? { "--invoice-popup-width": `${composerSize.width}px`, "--invoice-popup-height": `${composerSize.height}px` } as CSSProperties : {}) } : undefined}>
      {composerInvoice ? <InvoiceComposer invoice={composerInvoice} displayMode={composerDisplay} popupSize={composerSize} onDisplayModeChange={mode => { if (mode === "popup") { const width = Math.min(window.innerWidth * 0.86, 1280); const height = Math.min(window.innerHeight * 0.84, 1000); setComposerSize({ width, height }); setComposerPosition({ left: Math.max(8, (window.innerWidth - width) / 2), top: Math.max(8, (window.innerHeight - height) / 2) }); } setComposerDisplay(mode); }} onPopupPositionChange={setComposerPosition} onPopupSizeChange={setComposerSize} onChange={setComposerInvoice} onSave={() => saveComposerInvoice(composerInvoice)} onSend={() => saveComposerInvoice(composerInvoice, true)} onSavePdf={() => openPrint(composerInvoice)} onSendMessage={() => sendInvoiceByMessage(composerInvoice)} onCopyLink={() => copyInvoiceLink(composerInvoice)} onDiscard={() => { if (window.confirm("Discard this unsaved invoice draft?")) setComposerInvoice(null); }} onClose={() => setComposerInvoice(null)} /> : null}
    </InvoiceSidePanel>
    <Modal isOpen={dialog === "create" && Boolean(editingInvoiceId)} onOpenChange={open => !open && setDialog(null)} size="wide" aria-label="Edit invoice draft"><ModalHeader title="Edit invoice draft" description="Billing parties and line items are reviewed before approval and issue." /><ModalBody><form id="invoice-draft-form" onSubmit={submitDraft} className="fin-form-grid">
      <Select className="fin-form-wide" label="Opportunity" aria-label="Opportunity" selectedKey={draft.opportunityId} onSelectionChange={key => { const next = draftFor(String(key)); setDraft(current => ({ ...next, billingType: current.billingType, parties: current.parties.map((party, index) => index === 0 ? { ...party, name: initialOpportunities.find(opp => opp.id === String(key))?.name ?? "", email: initialOpportunities.find(opp => opp.id === String(key))?.email ?? "" } : party), recipients: initialOpportunities.find(opp => opp.id === String(key))?.email ?? "" })); }}>{initialOpportunities.map(item => <SelectItem key={item.id} id={item.id}>{item.id} · {item.name} · {item.brand}</SelectItem>)}</Select>
      <Input label="Invoice date" type="date" value={draft.invoiceDate} onChange={value => setDraft(current => ({ ...current, invoiceDate: value }))} isRequired fieldClassName="fin-input" /><Input label="Due date" type="date" value={draft.dueDate} onChange={value => setDraft(current => ({ ...current, dueDate: value }))} fieldClassName="fin-input" />
      <Select label="Billing type" aria-label="Billing type" selectedKey={draft.billingType} onSelectionChange={key => setDraft(current => ({ ...current, billingType: String(key) as InvoiceRecord["billingType"] }))}>{["Individual", "Company", "Multiple parties"].map(type => <SelectItem key={type} id={type}>{type}</SelectItem>)}</Select>
      <Input label={draft.billingType === "Company" ? "Company legal name" : "Billing party name"} value={draft.parties[0]?.name ?? ""} onChange={value => updateParty(0, { name: value })} isRequired fieldClassName="fin-input" /><Input label="Billing email" type="email" value={draft.parties[0]?.email ?? ""} onChange={value => updateParty(0, { email: value })} isRequired fieldClassName="fin-input" /><Input label="Phone" type="tel" value={draft.parties[0]?.phone ?? ""} onChange={value => updateParty(0, { phone: value })} fieldClassName="fin-input" /><Input label="GSTIN" value={draft.parties[0]?.gstin ?? ""} onChange={value => updateParty(0, { gstin: value })} fieldClassName="fin-input" /><Textarea className="fin-form-wide" label="Billing address" value={draft.parties[0]?.address ?? ""} onChange={value => updateParty(0, { address: value })} rows={2} isRequired fieldClassName="fin-input" />
      {draft.billingType === "Multiple parties" ? <div className="fin-form-wide fin-lines"><p className="fin-config-callout">Enter the approved amount for each billing party. The application will not divide the invoice equally.</p><Input label="Primary party allocation" type="number" value={String(draft.parties[0]?.allocation ?? 0)} onChange={value => updateParty(0, { allocation: Number(value) })} isRequired fieldClassName="fin-input" />{draft.parties.slice(1).map((party, index) => <div className="fin-panel-body fin-detail-list" key={index + 1}><Input label={`Party ${index + 2} legal name`} value={party.name} onChange={value => updateParty(index + 1, { name: value })} isRequired fieldClassName="fin-input" /><Input label={`Party ${index + 2} email`} value={party.email} onChange={value => updateParty(index + 1, { email: value })} isRequired fieldClassName="fin-input" /><Input className="fin-form-wide" label={`Party ${index + 2} billing address`} value={party.address} onChange={value => updateParty(index + 1, { address: value })} isRequired fieldClassName="fin-input" /><Input label={`Party ${index + 2} allocation`} type="number" value={String(party.allocation)} onChange={value => updateParty(index + 1, { allocation: Number(value) })} isRequired fieldClassName="fin-input" /><TextAction danger onClick={() => setDraft(current => ({ ...current, parties: current.parties.filter((_, i) => i !== index + 1) }))}>Remove party</TextAction></div>)}<TextAction onClick={() => setDraft(current => ({ ...current, parties: [...current.parties, baseParty()] }))}>Add billing party</TextAction></div> : null}
      <Input className="fin-form-wide" label="Invoice recipients (comma separated)" value={draft.recipients} onChange={value => setDraft(current => ({ ...current, recipients: value }))} placeholder="Primary and authorized copy recipients" fieldClassName="fin-input" />
      <div className="fin-form-wide fin-lines"><div className="fin-panel-heading"><h3>Invoice line items</h3><TextAction onClick={() => setDraft(current => ({ ...current, lines: [...current.lines, { description: "", quantity: 1, unitPrice: 0, gstRate: 0 }] }))}>Add line item</TextAction></div>{draft.lines.map((line, index) => <div className="fin-line-card" key={index}><Input label="Description" value={line.description} onChange={value => updateLine(index, { description: value })} isRequired fieldClassName="fin-input" /><Input label="Quantity" type="number" value={String(line.quantity)} onChange={value => updateLine(index, { quantity: Number(value) })} isRequired fieldClassName="fin-input" /><Input label="Unit price (INR)" type="number" value={String(line.unitPrice)} onChange={value => updateLine(index, { unitPrice: Number(value) })} isRequired fieldClassName="fin-input" /><Input label="GST %" type="number" value={String(line.gstRate)} onChange={value => updateLine(index, { gstRate: Number(value) })} isRequired fieldClassName="fin-input" />{draft.lines.length > 1 ? <TextAction danger onClick={() => setDraft(current => ({ ...current, lines: current.lines.filter((_, i) => i !== index) }))}>Remove</TextAction> : null}</div>)}<p className="fin-toolbar-note">Tax inclusive total: {formatMoney(totalInvoice(draft.lines))} · GST must follow Finance-approved settings.</p></div>
      {formError ? <p className="fin-error fin-form-wide" role="alert">{formError}</p> : null}
    </form></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" form="invoice-draft-form">{editingInvoiceId ? "Save changes" : "Save draft"}</Button></ModalFooter></Modal>

    <Modal isOpen={dialog === "cancel"} onOpenChange={open => !open && setDialog(null)} size="md" aria-label="Cancel invoice"><ModalHeader title="Cancel invoice" description="The invoice record remains in history and will not be deleted." /><ModalBody><form id="invoice-cancel-form" onSubmit={recordCancel} className="fin-form-grid"><Textarea className="fin-form-wide" label="Cancellation reason" value={reason} onChange={setReason} rows={3} isRequired fieldClassName="fin-input" />{formError ? <p className="fin-error fin-form-wide" role="alert">{formError}</p> : null}</form></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setDialog(null)}>Keep invoice</Button><Button type="submit" form="invoice-cancel-form">Record cancellation</Button></ModalFooter></Modal>
    <Modal isOpen={dialog === "credit"} onOpenChange={open => !open && setDialog(null)} size="md" aria-label="Issue credit note"><ModalHeader title="Record credit note" description={`${activeInvoice?.number} · Original invoice will remain unchanged.`} /><ModalBody><form id="invoice-credit-form" onSubmit={addCredit} className="fin-form-grid"><Input label="Credit amount" type="number" value={allocationAmount} onChange={setAllocationAmount} isRequired fieldClassName="fin-input" /><Textarea className="fin-form-wide" label="Credit note reason" value={reason} onChange={setReason} rows={3} isRequired fieldClassName="fin-input" />{formError ? <p className="fin-error fin-form-wide" role="alert">{formError}</p> : null}</form></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" form="invoice-credit-form">Save credit note</Button></ModalFooter></Modal>
    <Modal isOpen={dialog === "reconcile"} onOpenChange={open => !open && setDialog(null)} size="md" aria-label="Allocate verified payment"><ModalHeader title="Allocate verified payment" description={`${activeInvoice?.number} · Outstanding ${formatMoney(activeInvoice ? invoiceBalance(activeInvoice) : 0)}`} /><ModalBody><form id="invoice-reconcile-form" onSubmit={reconcile} className="fin-form-grid"><Select className="fin-form-wide" label="Verified payment" aria-label="Verified payment" selectedKey={paymentId || "__none__"} onSelectionChange={key => setPaymentId(String(key) === "__none__" ? "" : String(key))}><SelectItem id="__none__">Choose verified payment</SelectItem>{availablePayments.map(payment => <SelectItem key={payment.id} id={payment.id}>{payment.id} · {payment.reference} · available {formatMoney(payment.amount - state.invoices.reduce((sum, invoice) => sum + invoice.reconciliations.filter(entry => entry.paymentId === payment.id).reduce((v, entry) => v + entry.amount, 0), 0))}</SelectItem>)}</Select><Input className="fin-form-wide" label="Amount to allocate" type="number" value={allocationAmount} onChange={setAllocationAmount} isRequired fieldClassName="fin-input" />{formError ? <p className="fin-error fin-form-wide" role="alert">{formError}</p> : null}</form></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" form="invoice-reconcile-form">Allocate payment</Button></ModalFooter></Modal>
  </ModuleFrame>;
}

function InvoiceSidePanel({ isOpen, onClose, className, label, children, style }: { isOpen: boolean; onClose: () => void; className: string; label: string; children: ReactNode; style?: CSSProperties }) {
  useEffect(() => {
    if (!isOpen) return;
    const dismissOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return <div className="fin-invoice-sidepanel-shell"><section role="dialog" aria-modal="false" aria-label={label} className={`fin-invoice-sidepanel ${className}`} style={style}>{children}</section></div>;
}

function InvoiceRow({ invoice, onOpen, onKeyOpen }: { invoice: InvoiceRecord; onOpen: (invoice: InvoiceRecord) => void; onKeyOpen: (event: KeyboardEvent<HTMLTableRowElement>, invoice: InvoiceRecord) => void }) {
  return <tr onClick={() => onOpen(invoice)} onKeyDown={event => onKeyOpen(event, invoice)} tabIndex={0} className="fin-invoice-clickable-row"><td><strong>{invoice.number}</strong><small>{invoice.id}</small></td><td>{initialOpportunities.find(item => item.id === invoice.opportunityId)?.name}<small>{invoice.opportunityId} · {invoice.brand}</small></td><td>{invoice.invoiceDate}</td><td>{formatMoney(totalInvoice(invoice.lines))}</td><td>{formatMoney(invoicePaid(invoice))}</td><td>{formatMoney(invoiceBalance(invoice))}</td><td><StatusLabel>{invoice.status}</StatusLabel></td></tr>;
}

function InvoiceEditInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <Input aria-label={label} value={value} type={type} placeholder={placeholder} onChange={onChange} className="fin-invoice-editable" fieldClassName="fin-invoice-editable-field" />;
}

function InvoiceComposer({ invoice, displayMode, popupSize, onDisplayModeChange, onPopupPositionChange, onPopupSizeChange, onChange, onSave, onSend, onSavePdf, onSendMessage, onCopyLink, onDiscard, onClose }: { invoice: InvoiceRecord; displayMode: "side" | "full" | "popup" | "minimized"; popupSize: { width: number; height: number } | null; onDisplayModeChange: (mode: "side" | "full" | "popup" | "minimized") => void; onPopupPositionChange: (position: { left: number; top: number }) => void; onPopupSizeChange: (size: { width: number; height: number }) => void; onChange: (invoice: InvoiceRecord) => void; onSave: () => void; onSend: () => void; onSavePdf: () => void; onSendMessage: () => void; onCopyLink: () => void; onDiscard: () => void; onClose: () => void }) {
  const settingsFade = useScrollFade();
  const canvasRef = useRef<HTMLElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const resizeRef = useRef<{ pointerId: number; startX: number; startY: number; width: number; height: number } | null>(null);
  const [layout, setLayout] = useState("Classic");
  const [accent, setAccent] = useState("ink");
  const [typeface, setTypeface] = useState("Sans");
  const [spacing, setSpacing] = useState("Roomy");
  const [show, setShow] = useState({ logo: true, lineDetails: true, discount: false, tax: false, notes: true, payment: true });
  const [zoom, setZoom] = useState(1);
  const [customizeOpen, setCustomizeOpen] = useState(true);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const total = totalInvoice(invoice.lines);
  const party = invoice.parties[0];
  const currency = invoice.currency ?? "INR";
  const formatComposerMoney = (amount: number) => new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
  const taxTotal = invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * line.gstRate / 100, 0);
  const invoiceTotal = total + (show.tax ? taxTotal : 0);
  const currentNetDays = invoice.dueDate ? Math.round((new Date(`${invoice.dueDate}T12:00:00+05:30`).getTime() - new Date(`${invoice.invoiceDate}T12:00:00+05:30`).getTime()) / 86400000) : -1;
  const formatInvoiceDate = (value: string) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T12:00:00+05:30`)) : "Not set";
  const updateParty = (patch: Partial<BillingParty>) => onChange({ ...invoice, parties: invoice.parties.map((item, index) => index === 0 ? { ...item, ...patch } : item) });
  const updateLine = (index: number, patch: Partial<InvoiceLine>) => onChange({ ...invoice, lines: invoice.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line) });
  const toggle = (key: keyof typeof show) => setShow(current => ({ ...current, [key]: !current[key] }));
  const addLine = () => onChange({ ...invoice, lines: [...invoice.lines, { description: "New line item", details: "Additional invoice item", quantity: 1, unitPrice: 0, gstRate: 0 }] });
  const fitToView = () => {
    const canvas = canvasRef.current;
    const paper = paperRef.current;
    if (!canvas || !paper) return;
    const availableWidth = Math.max(240, canvas.clientWidth - 48);
    const availableHeight = Math.max(320, canvas.clientHeight - 48);
    const widthZoom = availableWidth / paper.offsetWidth;
    const fitZoom = canvas.clientWidth <= 640 ? widthZoom : Math.min(widthZoom, availableHeight / paper.scrollHeight);
    setZoom(Math.max(0.45, Math.min(1, fitZoom)));
  };
  const startPopupDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (displayMode !== "popup" || (event.target as HTMLElement).closest("button")) return;
    const panel = event.currentTarget.closest(".fin-invoice-sidepanel") as HTMLElement | null;
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePopup = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const panel = event.currentTarget.closest(".fin-invoice-sidepanel") as HTMLElement | null;
    const bounds = panel?.getBoundingClientRect();
    const width = bounds?.width ?? Math.min(window.innerWidth * 0.86, 1280);
    const height = bounds?.height ?? Math.min(window.innerHeight * 0.84, 1000);
    onPopupPositionChange({ left: Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX - drag.offsetX)), top: Math.max(8, Math.min(window.innerHeight - height - 8, event.clientY - drag.offsetY)) });
  };
  const stopPopupDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };
  const startPopupResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (displayMode !== "popup") return;
    const panel = event.currentTarget.closest(".fin-invoice-sidepanel") as HTMLElement | null;
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    resizeRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, width: bounds.width, height: bounds.height };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const movePopupResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const panel = event.currentTarget.closest(".fin-invoice-sidepanel") as HTMLElement | null;
    const bounds = panel?.getBoundingClientRect();
    const left = bounds?.left ?? 8;
    const top = bounds?.top ?? 8;
    const minWidth = Math.min(440, window.innerWidth - 24);
    const minHeight = Math.min(360, window.innerHeight - 24);
    const maxWidth = Math.min(1280, window.innerWidth - left - 8);
    const maxHeight = Math.min(1000, window.innerHeight - top - 8);
    onPopupSizeChange({ width: Math.max(minWidth, Math.min(maxWidth, resize.width + event.clientX - resize.startX)), height: Math.max(minHeight, Math.min(maxHeight, resize.height + event.clientY - resize.startY)) });
  };
  const stopPopupResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (resizeRef.current?.pointerId === event.pointerId) resizeRef.current = null;
  };
  useEffect(() => {
    const frame = window.requestAnimationFrame(fitToView);
    const canvas = canvasRef.current;
    const panel = canvas?.closest(".fin-invoice-sidepanel") as HTMLElement | null;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === canvas) fitToView();
        if (displayMode === "popup" && entry.target === panel && panel) {
          const bounds = panel.getBoundingClientRect();
          const left = Math.max(8, Math.min(window.innerWidth - bounds.width - 8, bounds.left));
          const top = Math.max(8, Math.min(window.innerHeight - bounds.height - 8, bounds.top));
          if (Math.abs(left - bounds.left) > 1 || Math.abs(top - bounds.top) > 1) onPopupPositionChange({ left, top });
        }
      }
    });
    if (canvas) observer.observe(canvas);
    if (displayMode === "popup" && panel) observer.observe(panel);
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); };
  }, [displayMode, customizeOpen, onPopupPositionChange]);
  const changeDisplayMode = (mode: "side" | "full" | "popup" | "minimized") => { setLayoutMenuOpen(false); onDisplayModeChange(mode); };
  return <div className="fin-invoice-composer" data-accent={accent} data-layout={layout.toLowerCase()} data-typeface={typeface.toLowerCase()} data-spacing={spacing.toLowerCase()} data-display={displayMode} data-customize={customizeOpen ? "shown" : "hidden"}>
    <header className={`fin-invoice-composer-header${displayMode === "popup" ? " is-draggable" : ""}`} onPointerDown={startPopupDrag} onPointerMove={movePopup} onPointerUp={stopPopupDrag} onPointerCancel={stopPopupDrag}>
      <div className={`fin-invoice-composer-title${displayMode === "minimized" ? " is-minimized" : ""}`}><RiReceiptLine aria-hidden="true" /><strong>{invoice.number === "DRAFT" ? "INV-DRAFT" : invoice.number}</strong>{displayMode !== "minimized" ? <><span>Unsaved draft</span><span>{formatComposerMoney(total)}</span></> : <span>{formatComposerMoney(total)}</span>}</div>
      <div className="fin-invoice-composer-actions">
        {displayMode !== "minimized" ? <><Button variant="secondary" onClick={onSave}>Save draft</Button><Button className="fin-invoice-composer-send" leadingIcon={RiSendPlaneLine} onClick={onSend}>Send</Button>
          <Dropdown isOpen={moreMenuOpen} onOpenChange={setMoreMenuOpen}><DropdownTrigger className="fin-invoice-toolbar-icon" aria-label="More invoice actions"><RiMore2Line aria-hidden="true" /></DropdownTrigger><DropdownPopover aria-label="More invoice actions" placement="bottom end"><DropdownItem onSelect={() => { setMoreMenuOpen(false); onSavePdf(); }}><RiFilePdfLine aria-hidden="true" />Save as PDF</DropdownItem><DropdownItem onSelect={() => { setMoreMenuOpen(false); onSendMessage(); }}><RiChat3Line aria-hidden="true" />Send via message</DropdownItem><DropdownItem onSelect={() => { setMoreMenuOpen(false); onCopyLink(); }}><RiLinkM aria-hidden="true" />Copy link</DropdownItem><DropdownItem className="fin-invoice-delete-action" onSelect={() => { setMoreMenuOpen(false); onDiscard(); }}><RiDeleteBinLine aria-hidden="true" />Delete</DropdownItem></DropdownPopover></Dropdown>
          <IconButton icon={customizeOpen ? RiSidebarFoldLine : RiSidebarUnfoldLine} size="small" aria-label={customizeOpen ? "Hide customize sidebar" : "Open customize sidebar"} title={customizeOpen ? "Hide customize" : "Show customize"} aria-pressed={customizeOpen} onClick={() => setCustomizeOpen(value => !value)} />
          <Dropdown isOpen={layoutMenuOpen} onOpenChange={setLayoutMenuOpen}><DropdownTrigger className="fin-invoice-layout-trigger" aria-label="Editor display options"><RiLayoutColumnLine aria-hidden="true" /><RiArrowDownSLine aria-hidden="true" /></DropdownTrigger><DropdownPopover aria-label="Editor display options" placement="bottom end">
            <DropdownItem selected={displayMode === "side"} onSelect={() => changeDisplayMode("side")}><RiLayoutColumnLine aria-hidden="true" />Side drawer</DropdownItem>
            <DropdownItem selected={displayMode === "full"} onSelect={() => changeDisplayMode("full")}><RiFullscreenLine aria-hidden="true" />Full screen</DropdownItem>
            <DropdownItem selected={displayMode === "popup"} onSelect={() => changeDisplayMode("popup")}><RiPictureInPictureLine aria-hidden="true" />Pop-up</DropdownItem>
            <DropdownItem onSelect={() => changeDisplayMode("minimized")}><RiSubtractLine aria-hidden="true" />Minimize</DropdownItem>
          </DropdownPopover></Dropdown>
        </> : <IconButton className="fin-invoice-composer-restore" icon={RiArrowUpSLine} size="small" aria-label="Restore invoice editor" title="Restore" onClick={() => changeDisplayMode("side")} />}
        <IconButton className="fin-invoice-composer-close" icon={RiCloseLine} size="small" aria-label="Close invoice editor" title="Close" onClick={onClose} />
      </div>
    </header>
    {displayMode !== "minimized" ? <div className="fin-invoice-composer-layout"><main className="fin-invoice-composer-canvas" ref={canvasRef} aria-label="Invoice document editor"><div className="fin-invoice-composer-zoom"><IconButton icon={RiAddLine} size="small" aria-label="Zoom in" title="Zoom in" disabled={zoom >= 1.5} onClick={() => setZoom(value => Math.min(1.5, Number((value + 0.1).toFixed(2))))} /><IconButton icon={RiSubtractLine} size="small" aria-label="Zoom out" title="Zoom out" disabled={zoom <= 0.45} onClick={() => setZoom(value => Math.max(0.45, Number((value - 0.1).toFixed(2))))} /><IconButton icon={RiFullscreenLine} size="small" aria-label="Fit invoice to view" title="Fit to view" onClick={fitToView} /></div><div className="fin-invoice-composer-paper" ref={paperRef} style={{ transform: `scale(${zoom})` }}><div className="fin-invoice-paper-heading"><div className="fin-invoice-paper-title-fields"><InvoiceEditInput label="Invoice title" value={invoice.title ?? "Invoice"} onChange={title => onChange({ ...invoice, title })} /><div className="fin-invoice-paper-subtitle-fields"><InvoiceEditInput label="Invoice brand" value={invoice.brand} onChange={brand => onChange({ ...invoice, brand })} /><span>·</span><InvoiceEditInput label="Invoice description" value={invoice.model} onChange={model => onChange({ ...invoice, model })} /></div></div>{show.logo ? <div className="fin-invoice-brand-mark" aria-hidden="true">{invoice.brand.slice(0, 1).toUpperCase()}</div> : null}</div><dl className="fin-invoice-paper-meta"><div><dt>Invoice no.</dt><dd>{invoice.number === "DRAFT" ? <InvoiceEditInput label="Invoice number" value={invoice.documentNumber ?? "INV-DRAFT"} onChange={documentNumber => onChange({ ...invoice, documentNumber })} /> : invoice.number}</dd></div><div><dt>Issued</dt><dd><InvoiceEditInput label="Invoice issue date" type="date" value={invoice.invoiceDate} onChange={invoiceDate => onChange({ ...invoice, invoiceDate })} /></dd></div><div><dt>Due</dt><dd><InvoiceEditInput label="Invoice due date" type="date" value={invoice.dueDate} onChange={dueDate => onChange({ ...invoice, dueDate })} /></dd></div></dl><div className="fin-invoice-parties"><section><h3>From</h3><InvoiceEditInput label="Seller name" value={invoice.issuerName ?? "iFranchise"} onChange={issuerName => onChange({ ...invoice, issuerName })} /><InvoiceEditInput label="Seller details" value={invoice.issuerDetails ?? "Seller details"} onChange={issuerDetails => onChange({ ...invoice, issuerDetails })} /><InvoiceEditInput label="Seller tax ID" value={invoice.issuerTaxId ?? ""} placeholder="Tax ID (optional)" onChange={issuerTaxId => onChange({ ...invoice, issuerTaxId })} /></section><section><h3>Bill to</h3><InvoiceEditInput label="Customer name" value={party?.name ?? ""} onChange={name => updateParty({ name })} /><InvoiceEditInput label="Customer email" type="email" value={party?.email ?? ""} onChange={email => updateParty({ email })} /><InvoiceEditInput label="Customer address" value={party?.address ?? ""} onChange={address => updateParty({ address })} /><InvoiceEditInput label="Customer tax ID" value={party?.gstin ?? ""} placeholder="Tax ID (optional)" onChange={gstin => updateParty({ gstin })} /></section></div><p className="fin-invoice-due-line">{formatComposerMoney(invoiceTotal)} due {formatInvoiceDate(invoice.dueDate)}</p><table className="fin-invoice-lines-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{invoice.lines.map((line, index) => <tr key={`${index}-${line.description}`}><td><InvoiceEditInput label={`Line ${index + 1} description`} value={line.description} onChange={description => updateLine(index, { description })} /><InvoiceEditInput label={`Line ${index + 1} details`} value={line.details ?? `${invoice.brand} subscription`} onChange={details => updateLine(index, { details })} />{show.tax ? <InvoiceEditInput label={`Line ${index + 1} tax rate`} type="number" value={String(line.gstRate)} onChange={gst => updateLine(index, { gstRate: Math.max(0, Number(gst) || 0) })} /> : null}</td><td><InvoiceEditInput label={`Line ${index + 1} quantity`} type="number" value={String(line.quantity)} onChange={quantity => updateLine(index, { quantity: Math.max(0, Number(quantity) || 0) })} /></td><td><InvoiceEditInput label={`Line ${index + 1} rate`} type="number" value={String(line.unitPrice)} onChange={unitPrice => updateLine(index, { unitPrice: Math.max(0, Number(unitPrice) || 0) })} /></td><td>{formatComposerMoney(line.quantity * line.unitPrice)}<button type="button" className="fin-invoice-remove-line" aria-label={`Remove line ${index + 1}`} onClick={() => onChange({ ...invoice, lines: invoice.lines.filter((_, lineIndex) => lineIndex !== index) })}><RiCloseLine aria-hidden="true" /></button></td></tr>)}</tbody></table><button type="button" className="fin-invoice-composer-add-line" onClick={addLine}><RiAddLine aria-hidden="true" />Add line</button><div className="fin-invoice-totals"><div><span>Subtotal</span><strong>{formatComposerMoney(total)}</strong></div>{show.tax ? <div><span>Tax</span><strong>{formatComposerMoney(taxTotal)}</strong></div> : null}<div className="fin-invoice-grand-total"><span>Total</span><strong>{formatComposerMoney(invoiceTotal)}</strong></div></div>{show.payment || show.notes ? <div className="fin-invoice-paper-note">{show.payment ? <section><h3>Payment details</h3><InvoiceEditInput label="Payment details" value={invoice.paymentDetails ?? "Payment instructions will appear here."} onChange={paymentDetails => onChange({ ...invoice, paymentDetails })} /></section> : null}{show.notes ? <section><h3>Notes</h3><InvoiceEditInput label="Invoice notes" value={invoice.notes ?? "Thank you for your business."} onChange={notes => onChange({ ...invoice, notes })} /></section> : null}</div> : null}</div></main>
      {customizeOpen ? <aside className="fin-invoice-composer-settings-wrap"><div className="fin-invoice-composer-settings" onScroll={settingsFade.onScroll}><section><h3>Layout</h3><div className="fin-invoice-layout-options">{["Classic", "Split", "Ledger"].map(option => <button key={option} type="button" aria-pressed={layout === option} onClick={() => setLayout(option)}><span className={`fin-invoice-layout-swatch is-${option.toLowerCase()}`} aria-hidden="true">{[0, 1, 2, 3, 4].map(line => <i key={line} />)}</span><span>{option}</span></button>)}</div></section><section><h3>Accent</h3><div className="fin-invoice-accent-options">{["ink", "blue", "purple", "green", "orange"].map(option => <button key={option} type="button" className={`is-${option}`} aria-label={`${option} accent`} aria-pressed={accent === option} onClick={() => setAccent(option)}>{accent === option ? <RiCheckLine aria-hidden="true" /> : null}</button>)}</div></section><section><h3>Typeface</h3><div className="fin-invoice-segmented">{["Sans", "Mono"].map(option => <button key={option} type="button" aria-pressed={typeface === option} onClick={() => setTypeface(option)}>{option}</button>)}</div></section><section><h3>Spacing</h3><div className="fin-invoice-segmented">{["Roomy", "Compact"].map(option => <button key={option} type="button" aria-pressed={spacing === option} onClick={() => setSpacing(option)}>{option}</button>)}</div></section><section><h3>Show</h3>{([["logo", "Logo"], ["lineDetails", "Line details"], ["discount", "Discount"], ["tax", "Tax"], ["notes", "Notes"], ["payment", "Payment details"]] as const).map(([key, label]) => <button key={key} type="button" className="fin-invoice-composer-toggle" role="switch" aria-checked={show[key]} onClick={() => toggle(key)}><span>{label}</span><i className={show[key] ? "is-on" : ""} /></button>)}</section><section><h3>Currency</h3><Dropdown><DropdownTrigger className="fin-invoice-currency" aria-label="Invoice currency"><strong>{currency}</strong><span>{currency === "INR" ? "India · Indian rupee" : currency === "AED" ? "UAE · Dirham" : "USA · US dollar"}</span><RiArrowDownSLine aria-hidden="true" /></DropdownTrigger><DropdownPopover aria-label="Choose invoice currency" placement="bottom end"><DropdownItem selected={currency === "INR"} onSelect={() => onChange({ ...invoice, currency: "INR" })}>INR · India</DropdownItem><DropdownItem selected={currency === "AED"} onSelect={() => onChange({ ...invoice, currency: "AED" })}>AED · UAE</DropdownItem><DropdownItem selected={currency === "USD"} onSelect={() => onChange({ ...invoice, currency: "USD" })}>USD · USA</DropdownItem></DropdownPopover></Dropdown></section><section><h3>Payment terms</h3><div className="fin-invoice-terms">{[7, 14, 30, 45, 60].map(days => <button type="button" key={days} aria-pressed={currentNetDays === days} onClick={() => onChange({ ...invoice, dueDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(new Date(`${invoice.invoiceDate}T12:00:00+05:30`).getTime() + days * 86400000)) })}>Net {days}</button>)}</div></section></div><ScrollFade progress={settingsFade.progress} className="fin-invoice-composer-settings-fade" /></aside> : null}
    </div> : null}
    {displayMode === "popup" ? <button type="button" className="fin-invoice-popup-resize" aria-label="Resize invoice window" title="Resize window" onPointerDown={startPopupResize} onPointerMove={movePopupResize} onPointerUp={stopPopupResize} onPointerCancel={stopPopupResize}><span aria-hidden="true" /></button> : null}
  </div>;
}

function InvoiceDetailView({ invoice, zoom, onZoom, onClose, onPrint, onEdit }: { invoice: InvoiceRecord; zoom: number; onZoom: (zoom: number) => void; onClose: () => void; onPrint: (invoice: InvoiceRecord) => void; onEdit: (invoice: InvoiceRecord) => void }) {
  const party = invoice.parties[0];
  const total = totalInvoice(invoice.lines);
  const tax = invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * line.gstRate / 100, 0);
  const subtotal = total - tax;
  const opportunity = initialOpportunities.find(item => item.id === invoice.opportunityId);
  const dueDate = invoice.dueDate ? new Date(`${invoice.dueDate}T12:00:00+05:30`) : null;
  const overdueDays = invoice.status === "Overdue" && dueDate ? Math.max(1, Math.floor((Date.now() - dueDate.getTime()) / 86400000)) : 0;
  const dateLabel = (value: string) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T12:00:00+05:30`)) : "Not set";
  const netDays = invoice.dueDate ? Math.max(0, Math.round((new Date(`${invoice.dueDate}T12:00:00+05:30`).getTime() - new Date(`${invoice.invoiceDate}T12:00:00+05:30`).getTime()) / 86400000)) : null;
  const activities = [
    ...(invoice.issuedAt ? [{ title: "Invoice issued", date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(invoice.issuedAt)) }] : [{ title: invoice.status === "Draft" ? "Draft created" : `Invoice ${invoice.status.toLowerCase()}`, date: dateLabel(invoice.invoiceDate) }]),
    ...invoice.deliveryAttempts.map(item => ({ title: item.status, date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(item.at)) })),
    ...invoice.reconciliations.map(item => ({ title: `Payment recorded · ${formatMoney(item.amount)}`, date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(item.at)) })),
    ...(overdueDays ? [{ title: `Overdue by ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`, date: `Due ${dateLabel(invoice.dueDate)}` }] : []),
  ];
  return <div className="fin-invoice-detail">
    <header className="fin-invoice-detail-header"><div className="fin-invoice-title"><span className="fin-invoice-header-icon" aria-hidden="true">₹</span><h2>{invoice.number}</h2><StatusLabel>{invoice.status}</StatusLabel><span className="fin-invoice-header-total">{formatMoney(total)}</span></div><div className="fin-invoice-header-actions">{invoice.status === "Draft" ? <Button size="small" variant="secondary" onClick={() => onEdit(invoice)}>Edit draft</Button> : null}{!["Draft", "Cancelled"].includes(invoice.status) ? <Button size="small" variant="secondary" onClick={() => onPrint(invoice)}>Print / save PDF</Button> : null}<IconButton size="small" icon={RiCloseLine} aria-label="Close invoice preview" title="Close" onClick={onClose} /></div></header>
    <div className="fin-invoice-detail-layout"><main className="fin-invoice-canvas" aria-label="Invoice document preview"><div className="fin-invoice-zoom"><IconButton size="small" icon={RiAddLine} aria-label="Zoom in" title="Zoom in" disabled={zoom >= 1.15} onClick={() => onZoom(Math.min(1.15, Number((zoom + 0.1).toFixed(2))))} /><IconButton size="small" icon={RiSubtractLine} aria-label="Zoom out" title="Zoom out" disabled={zoom <= 0.7} onClick={() => onZoom(Math.max(0.7, Number((zoom - 0.1).toFixed(2))))} /><IconButton size="small" icon={RiFullscreenLine} aria-label="Fit invoice to view" title="Fit to view" onClick={() => onZoom(0.9)} /></div>
      <article className="fin-invoice-paper" style={{ transform: `scale(${zoom})` }}><div className="fin-invoice-paper-heading"><div><h1>Invoice</h1><p>{invoice.brand} · {invoice.model}</p></div><div className="fin-invoice-brand-mark" aria-hidden="true">{invoice.brand.slice(0, 1).toUpperCase()}</div></div><dl className="fin-invoice-paper-meta"><div><dt>Invoice no.</dt><dd>{invoice.number}</dd></div><div><dt>Issued</dt><dd>{dateLabel(invoice.invoiceDate)}</dd></div><div><dt>Due</dt><dd>{netDays !== null ? `Net ${netDays} days · ${dateLabel(invoice.dueDate)}` : "On receipt"}</dd></div></dl><div className="fin-invoice-parties"><section><h3>From</h3><strong>iFranchise</strong><p>Seller and tax details are pending organization setup.</p></section><section><h3>Bill to</h3><strong>{party?.name || opportunity?.name || "Billing party"}</strong><p>{party?.email}</p><p>{party?.address}</p></section></div><p className="fin-invoice-due-line">{formatMoney(total)} due {dateLabel(invoice.dueDate)}</p><table className="fin-invoice-lines-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{invoice.lines.map((line, index) => <tr key={`${line.description}-${index}`}><td><strong>{line.description}</strong><small>{line.gstRate ? `Includes ${line.gstRate}% GST` : invoice.brand}</small></td><td>{line.quantity}</td><td>{formatMoney(line.unitPrice)}</td><td>{formatMoney(line.quantity * line.unitPrice)}</td></tr>)}</tbody></table><div className="fin-invoice-totals"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>{tax > 0 ? <div><span>Tax</span><strong>{formatMoney(tax)}</strong></div> : null}<div className="fin-invoice-grand-total"><span>Total</span><strong>{formatMoney(total)}</strong></div>{invoicePaid(invoice) > 0 ? <div><span>Paid</span><strong>{formatMoney(invoicePaid(invoice))}</strong></div> : null}</div><div className="fin-invoice-paper-note"><h3>Payment details</h3><p>Payment instructions will appear here when configured by Finance.</p></div><p className="fin-invoice-legal-note">Invoice preview. Seller identity, tax registration and payment instructions require organization configuration before issue.</p></article>
    </main><aside className="fin-invoice-detail-sidebar"><section className="fin-invoice-amount"><span>Amount due</span><strong>{formatMoney(invoiceBalance(invoice))}</strong><StatusLabel>{invoice.status}</StatusLabel></section><section className="fin-invoice-info"><h3>Details</h3><dl><div><dt>Status</dt><dd><StatusLabel>{invoice.status}</StatusLabel></dd></div><div><dt>Invoice no.</dt><dd>{invoice.number}</dd></div><div><dt>Issued</dt><dd>{dateLabel(invoice.invoiceDate)}</dd></div><div><dt>Due</dt><dd>{dateLabel(invoice.dueDate)}{netDays !== null ? ` · Net ${netDays}` : ""}</dd></div>{overdueDays ? <div><dt>Overdue</dt><dd>{overdueDays} {overdueDays === 1 ? "day" : "days"}</dd></div> : null}<div><dt>Billed to</dt><dd>{party?.name || opportunity?.name || "—"}</dd></div><div><dt>Contact</dt><dd>{party?.phone || "—"}</dd></div><div><dt>Email</dt><dd>{party?.email || "—"}</dd></div><div><dt>Contract</dt><dd>{invoice.opportunityId} · {invoice.brand}</dd></div><div><dt>Currency</dt><dd>INR</dd></div></dl></section><section className="fin-invoice-activity"><h3>Activity</h3><ol>{activities.map((item, index) => <li key={`${item.title}-${index}`}><span className="fin-invoice-activity-dot" aria-hidden="true" /><div><strong>{item.title}</strong><small>{item.date}</small></div></li>)}</ol></section></aside></div>
  </div>;
}
