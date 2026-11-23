"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { initialOpportunities } from "@/modules/pipeline/data";
import { readActiveCrmRole } from "@/modules/screen-library/lib/table-columns";
import { createAudit, createInitialFinanceState, dateKey, dealPaymentStatus, formatMoney, paymentTotals, readFinanceState, writeFinanceState } from "../store";
import type { FinancialState, PaymentRecord, PaymentState } from "../types";
import { DataTable, FormGrid, MetricCards, ModuleFrame, PageHeading, StatusLabel, TextAction } from "./shared";

const views = ["Overview", "Deal summaries", "Payment review", "Pricing", "Refunds", "Audit history"];
const opportunities = initialOpportunities;
const paymentModes = ["UPI", "Bank Transfer", "NEFT", "RTGS", "IMPS", "Cheque", "Other approved mode"];
type PaymentDraft = { opportunityId: string; amount: string; date: string; mode: string; reference: string; payer: string; payerType: string; relationship: string; proofName: string; remarks: string };
const emptyPayment = (): PaymentDraft => ({ opportunityId: opportunities[0]?.id ?? "", amount: "", date: dateKey(), mode: "UPI", reference: "", payer: "", payerType: "Individual", relationship: "Applicant", proofName: "", remarks: "" });

export function FinanceWorkspace({ view = "Overview" }: { view?: string }) {
  const current = views.includes(view) ? view : "Overview";
  const [state, setState] = useState<FinancialState>(() => createInitialFinanceState());
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [notice, setNotice] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(emptyPayment());
  const [paymentError, setPaymentError] = useState("");
  const [review, setReview] = useState<{ payment: PaymentRecord; status: PaymentState } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingDraft, setPricingDraft] = useState({ brand: "", model: "", component: "Franchise fee", amount: "", gstRate: "0" });
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundDraft, setRefundDraft] = useState({ opportunityId: opportunities[0]?.id ?? "", amount: "", reason: "", paymentReference: "" });
  const actor = typeof window === "undefined" ? "Finance reviewer" : readActiveCrmRole().name;

  useEffect(() => { setState(readFinanceState()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) writeFinanceState(state); }, [hydrated, state]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 3600); return () => window.clearTimeout(timer); }, [notice]);

  const totals = useMemo(() => {
    const submitted = state.payments.reduce((sum, item) => sum + item.amount, 0);
    const verified = state.payments.filter(item => item.status === "Verified").reduce((sum, item) => sum + item.amount, 0);
    const pending = state.payments.filter(item => item.status === "Pending Verification" || item.status === "Additional Information Required").length;
    const outstanding = opportunities.reduce((sum, item) => sum + Math.max(0, item.value - paymentTotals(state, item.id).verified), 0);
    return { submitted, verified, pending, outstanding };
  }, [state]);
  const payments = state.payments.filter(item => {
    const opportunity = opportunities.find(candidate => candidate.id === item.opportunityId);
    const haystack = `${item.id} ${item.reference} ${item.payer} ${opportunity?.name ?? ""} ${opportunity?.brand ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (statusFilter === "All statuses" || item.status === statusFilter);
  });
  const selectedOpportunity = opportunities.find(item => item.id === paymentDraft.opportunityId);
  const openPayments = state.payments.filter(item => item.status === "Pending Verification" || item.status === "Additional Information Required");

  function patchState(next: FinancialState, message: string) { setState(next); setNotice(message); }
  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(paymentDraft.amount);
    if (!selectedOpportunity || !Number.isFinite(amount) || amount <= 0) { setPaymentError("Enter a payment amount greater than zero and choose an opportunity."); return; }
    if (!paymentDraft.reference.trim()) { setPaymentError("Enter the bank or transaction reference."); return; }
    const duplicate = state.payments.some(item => item.opportunityId === paymentDraft.opportunityId && item.reference.trim().toLowerCase() === paymentDraft.reference.trim().toLowerCase());
    if (duplicate) { setPaymentError("This transaction reference is already recorded for the opportunity."); return; }
    const record: PaymentRecord = { id: `PAY-${String(Date.now()).slice(-8)}`, opportunityId: selectedOpportunity.id, amount, date: paymentDraft.date, mode: paymentDraft.mode, reference: paymentDraft.reference.trim(), payer: paymentDraft.payer.trim() || selectedOpportunity.name, payerType: paymentDraft.payerType, relationship: paymentDraft.relationship.trim() || "Applicant", proofName: paymentDraft.proofName, submittedBy: actor, submittedAt: new Date().toISOString(), status: "Pending Verification", remarks: paymentDraft.remarks.trim() };
    patchState({ ...state, payments: [record, ...state.payments], audit: [createAudit(record.id, record.opportunityId, "Payment submitted", "—", record.status, actor, record.remarks), ...state.audit] }, `Payment ${record.id} submitted for Finance verification.`);
    setAddingPayment(false); setPaymentDraft(emptyPayment()); setPaymentError("");
  }
  function applyReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review) return;
    if (review.status === "Rejected" && !reviewNote.trim()) { setPaymentError("A rejection reason is required."); return; }
    const next = { ...state, payments: state.payments.map(item => item.id === review.payment.id ? { ...item, status: review.status, remarks: reviewNote.trim() || item.remarks } : item), audit: [createAudit(review.payment.id, review.payment.opportunityId, "Finance review", review.payment.status, review.status, actor, reviewNote.trim()), ...state.audit] };
    patchState(next, `${review.payment.id} marked ${review.status.toLowerCase()}.`); setReview(null); setReviewNote(""); setPaymentError("");
  }
  function savePricing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(pricingDraft.amount), gstRate = Number(pricingDraft.gstRate);
    if (!pricingDraft.brand.trim() || !pricingDraft.model.trim() || !pricingDraft.component.trim() || amount <= 0 || gstRate < 0 || gstRate > 100) { setPaymentError("Complete the pricing fields with a valid amount and tax rate."); return; }
    const prev = state.pricing.filter(item => item.brand === pricingDraft.brand && item.model === pricingDraft.model && item.component === pricingDraft.component);
    const version = Math.max(0, ...prev.map(item => item.version)) + 1;
    const row = { id: `PRICE-${Date.now()}`, brand: pricingDraft.brand.trim(), model: pricingDraft.model.trim(), component: pricingDraft.component.trim(), amount, gstRate, version, active: true, updatedAt: new Date().toISOString() };
    const next = { ...state, pricing: [...state.pricing.map(item => prev.some(old => old.id === item.id) ? { ...item, active: false } : item), row], audit: [createAudit(row.id, "", "Pricing version created", "Previous version retained", `Version ${version}`, actor), ...state.audit] };
    patchState(next, `Pricing version ${version} saved. Existing deal snapshots were not changed.`); setPricingOpen(false); setPaymentError(""); setPricingDraft({ brand: "", model: "", component: "Franchise fee", amount: "", gstRate: "0" });
  }
  function requestRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(refundDraft.amount);
    if (amount <= 0 || !refundDraft.reason.trim()) { setPaymentError("Enter a refund amount and reason."); return; }
    const id = `REF-${String(Date.now()).slice(-8)}`;
    const audit = createAudit(id, refundDraft.opportunityId, "Refund requested", "—", "Pending approval", actor, `${formatMoney(amount)} · ${refundDraft.reason.trim()} · payment ${refundDraft.paymentReference || "not specified"}`);
    patchState({ ...state, audit: [audit, ...state.audit] }, "Refund request recorded in preview audit. No money was transferred."); setRefundOpen(false); setRefundDraft({ ...refundDraft, amount: "", reason: "", paymentReference: "" }); setPaymentError("");
  }
  function exportPayments() {
    const csv = ["Payment ID,Opportunity,Customer,Brand,Amount,Status,Date,Reference", ...payments.map(payment => { const opportunity = opportunities.find(item => item.id === payment.opportunityId); return [payment.id, payment.opportunityId, opportunity?.name ?? "", opportunity?.brand ?? "", payment.amount, payment.status, payment.date, payment.reference].map(value => `"${String(value).replaceAll('"', '""')}"`).join(","); })].join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "ifranchise-payment-report.csv"; link.click(); URL.revokeObjectURL(link.href);
    patchState({ ...state, audit: [createAudit("EXPORT", "", "Payment report CSV exported", "—", "Complete", actor, `${payments.length} filtered rows`), ...state.audit] }, "Filtered payment report downloaded as CSV.");
  }

  const nav = <Select aria-label="Preview role" selectedKey="Finance" onSelectionChange={() => undefined} className="fin-profile-select" triggerClassName="h-9"><SelectItem id="Finance">Finance preview</SelectItem></Select>;
  const actionButton = (label: string, action: () => void, primary = false) => <Button variant={primary ? "primary" : "secondary"} onClick={action}>{label}</Button>;
  const pendingRows = openPayments.slice(0, 5);

  return <ModuleFrame moduleId="finance" moduleName="Payments & Finance" icon="wallet" current={current} views={views.map(id => ({ id, label: id }))} controls={nav}>
    {notice ? <div className="fin-toast" role="status">{notice}</div> : null}
    {current === "Overview" ? <>
      <PageHeading title="Payments & Finance" description="Track deal value, submitted payments and verified collections." actions={actionButton("Record payment", () => { setPaymentError(""); setPaymentDraft(emptyPayment()); setAddingPayment(true); }, true)} />
      <MetricCards items={[{ label: "Total deal value", value: formatMoney(opportunities.reduce((sum, item) => sum + item.value, 0)), note: `${opportunities.length} CRM opportunities` }, { label: "Payments submitted", value: formatMoney(totals.submitted) }, { label: "Verified collections", value: formatMoney(totals.verified), note: "Verified transactions only" }, { label: "Outstanding balance", value: formatMoney(totals.outstanding), note: `${totals.pending} awaiting Finance review` }]} />
      <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Payments needing review</h3><p>Individual transactions awaiting Finance action</p></div><a className="fin-text-action" href="/library/modules/finance?view=Payment%20review">View all</a></div><DataTable headers={["Payment", "Opportunity", "Payer", "Amount", "Submitted", "Status", "Review"]} empty={!pendingRows.length}>{pendingRows.map(payment => { const opp = opportunities.find(item => item.id === payment.opportunityId); return <tr key={payment.id}><td><strong>{payment.id}</strong><small>{payment.mode} · {payment.reference}</small></td><td>{opp?.name}<small>{opp?.brand} · {payment.opportunityId}</small></td><td>{payment.payer}<small>{payment.relationship} · {payment.payerType}</small></td><td><strong>{formatMoney(payment.amount)}</strong></td><td>{new Date(payment.submittedAt).toLocaleDateString("en-IN")}</td><td><StatusLabel>{payment.status}</StatusLabel></td><td><TextAction onClick={() => { setReview({ payment, status: "Verified" }); setReviewNote(""); }}>Review</TextAction></td></tr>; })}</DataTable></section>
      <section className="fin-panel"><div className="fin-panel-heading"><div><h3>Deal collection status</h3><p>Outstanding uses Finance verified payments only</p></div><a className="fin-text-action" href="/library/modules/finance?view=Deal%20summaries">All deals</a></div><DataTable headers={["Opportunity", "Brand", "Deal value", "Submitted", "Verified", "Outstanding", "Payment status"]}>{opportunities.slice(0, 6).map(opp => { const t = paymentTotals(state, opp.id); return <tr key={opp.id}><td><strong>{opp.name}</strong><small>{opp.id}</small></td><td>{opp.brand}</td><td>{formatMoney(opp.value)}</td><td>{formatMoney(t.submitted)}</td><td>{formatMoney(t.verified)}</td><td><strong>{formatMoney(Math.max(0, opp.value - t.verified))}</strong></td><td><StatusLabel>{dealPaymentStatus(state, opp.id, opp.value)}</StatusLabel></td></tr>; })}</DataTable></section>
    </> : null}
    {current === "Deal summaries" ? <>
      <PageHeading title="Deal financial summaries" description="Opportunity amounts and balances are calculated from their linked transactions." />
      <div className="fin-toolbar"><Input className="fin-search" aria-label="Search deals" placeholder="Search opportunity, customer or brand" value={search} onChange={setSearch} fieldClassName="fin-input" /></div>
      <section className="fin-panel"><DataTable headers={["Opportunity / customer", "Brand / owner", "Total payable", "Submitted", "Verified", "Rejected", "Outstanding", "Payment status"]} empty={!opportunities.some(item => `${item.id} ${item.name} ${item.brand}`.toLowerCase().includes(search.toLowerCase()))}>{opportunities.filter(item => `${item.id} ${item.name} ${item.brand}`.toLowerCase().includes(search.toLowerCase())).map(opp => { const t = paymentTotals(state, opp.id); return <tr key={opp.id}><td><strong>{opp.name}</strong><small>{opp.id} · {opp.email}</small></td><td>{opp.brand}<small>{opp.owner}</small></td><td><strong>{formatMoney(opp.value)}</strong></td><td>{formatMoney(t.submitted)}</td><td>{formatMoney(t.verified)}</td><td>{formatMoney(t.rejected)}</td><td><strong>{formatMoney(Math.max(0, opp.value - t.verified))}</strong></td><td><StatusLabel>{dealPaymentStatus(state, opp.id, opp.value)}</StatusLabel></td></tr>; })}</DataTable></section>
    </> : null}
    {current === "Payment review" ? <>
      <PageHeading title="Payment transactions" description="Review each installment and contributor independently." actions={<>{actionButton("Download CSV", exportPayments)}{actionButton("Record payment", () => { setPaymentError(""); setPaymentDraft(emptyPayment()); setAddingPayment(true); }, true)}</>} />
      <div className="fin-filter-row"><Input className="fin-search" aria-label="Search payments" placeholder="Search payment, customer, contributor or reference" value={search} onChange={setSearch} fieldClassName="fin-input" /><Select aria-label="Filter payment status" selectedKey={statusFilter} onSelectionChange={key => setStatusFilter(String(key))}><SelectItem id="All statuses">All statuses</SelectItem>{["Pending Verification", "Verified", "Rejected", "Additional Information Required"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select><span className="fin-toolbar-note">{payments.length} transactions</span></div>
      <section className="fin-panel"><DataTable headers={["Payment / opportunity", "Payer", "Amount", "Mode / reference", "Date", "Proof", "Status", "Actions"]} empty={!payments.length}>{payments.map(payment => { const opp = opportunities.find(item => item.id === payment.opportunityId); return <tr key={payment.id}><td><strong>{payment.id}</strong><small>{opp?.name} · {payment.opportunityId}</small></td><td>{payment.payer}<small>{payment.payerType} · {payment.relationship}</small></td><td><strong>{formatMoney(payment.amount)}</strong></td><td>{payment.mode}<small>{payment.reference}</small></td><td>{payment.date}</td><td>{payment.proofName || "No proof attached"}</td><td><StatusLabel>{payment.status}</StatusLabel></td><td><div className="fin-row-actions">{payment.status !== "Verified" ? <TextAction onClick={() => { setReview({ payment, status: "Verified" }); setReviewNote(""); setPaymentError(""); }}>Verify</TextAction> : null}{payment.status !== "Rejected" && payment.status !== "Verified" ? <TextAction onClick={() => { setReview({ payment, status: "Rejected" }); setReviewNote(""); setPaymentError(""); }} danger>Reject</TextAction> : null}{payment.status === "Pending Verification" ? <TextAction onClick={() => { setReview({ payment, status: "Additional Information Required" }); setReviewNote(""); setPaymentError(""); }}>Request proof</TextAction> : null}</div></td></tr>; })}</DataTable></section>
    </> : null}
    {current === "Pricing" ? <>
      <PageHeading title="Brand & franchise pricing" description="Each price change creates a version. Existing opportunity snapshots remain unchanged." actions={actionButton("Add pricing version", () => { setPaymentError(""); setPricingDraft({ brand: "", model: "", component: "Franchise fee", amount: "", gstRate: "0" }); setPricingOpen(true); }, true)} />
      <p className="fin-config-callout">Tax rates are configured per component. The sample amounts in the product brief are not used as live prices.</p>
      <section className="fin-panel"><DataTable headers={["Brand", "Franchise model", "Pricing component", "Amount", "GST rate", "Version", "State"]} empty={!state.pricing.length}>{state.pricing.map(item => <tr key={item.id}><td>{item.brand}</td><td>{item.model}</td><td><strong>{item.component}</strong></td><td>{formatMoney(item.amount)}</td><td>{item.gstRate}%</td><td>v{item.version}</td><td><StatusLabel>{item.active ? "Active" : "Historical"}</StatusLabel></td></tr>)}</DataTable></section>
    </> : null}
    {current === "Refunds" ? <>
      <PageHeading title="Refunds & reversals" description="Refund requests are recorded separately; original payment records are retained." actions={actionButton("Request refund", () => { setPaymentError(""); setRefundOpen(true); }, true)} />
      <p className="fin-config-callout">Refund workflow records in this preview do not approve or transfer money. Connect a Finance approval service before production use.</p>
      <section className="fin-panel"><DataTable headers={["Reference", "Opportunity", "Action", "Amount / reason", "Recorded", "State"]} empty={!state.audit.some(item => item.action === "Refund requested")}>{state.audit.filter(item => item.action === "Refund requested").map(item => <tr key={item.id}><td><strong>{item.recordId}</strong></td><td>{opportunities.find(opp => opp.id === item.opportunityId)?.name ?? item.opportunityId}</td><td>{item.action}</td><td>{item.remarks}</td><td>{new Date(item.at).toLocaleString("en-IN")}</td><td><StatusLabel>{item.next}</StatusLabel></td></tr>)}</DataTable></section>
    </> : null}
    {current === "Audit history" ? <>
      <PageHeading title="Financial audit history" description="Recorded preview actions across payments, pricing and exports." />
      <section className="fin-panel"><DataTable headers={["Record", "Opportunity", "Action", "Previous", "New state", "Actor", "Date & time", "Remarks"]} empty={!state.audit.length}>{state.audit.map(item => <tr key={item.id}><td><strong>{item.recordId}</strong></td><td>{item.opportunityId}</td><td>{item.action}</td><td>{item.previous}</td><td>{item.next}</td><td>{item.by}</td><td>{new Date(item.at).toLocaleString("en-IN")}</td><td>{item.remarks || "—"}</td></tr>)}</DataTable></section>
    </> : null}

    <Modal isOpen={addingPayment} onOpenChange={open => !open && setAddingPayment(false)} size="wide" aria-label="Record payment"><ModalHeader title="Record payment" description="Add one transaction against an opportunity. Finance verification is a separate step." /><ModalBody><form id="finance-payment-form" onSubmit={submitPayment} className="fin-form-grid">
      <Select aria-label="Opportunity" label="Opportunity" selectedKey={paymentDraft.opportunityId} onSelectionChange={key => setPaymentDraft(current => ({ ...current, opportunityId: String(key) }))} className="fin-form-wide"><>{opportunities.map(item => <SelectItem key={item.id} id={item.id}>{item.id} · {item.name} · {item.brand}</SelectItem>)}</></Select>
      {selectedOpportunity ? <p className="fin-toolbar-note fin-form-wide">Deal amount {formatMoney(selectedOpportunity.value)} · verified so far {formatMoney(paymentTotals(state, selectedOpportunity.id).verified)}</p> : null}
      <Input label="Payment amount" type="number" value={paymentDraft.amount} onChange={value => setPaymentDraft(current => ({ ...current, amount: value }))} placeholder="Enter amount" isRequired fieldClassName="fin-input" />
      <Input label="Payment date" type="date" value={paymentDraft.date} onChange={value => setPaymentDraft(current => ({ ...current, date: value }))} isRequired fieldClassName="fin-input" />
      <Select label="Payment mode" aria-label="Payment mode" selectedKey={paymentDraft.mode} onSelectionChange={key => setPaymentDraft(current => ({ ...current, mode: String(key) }))}>{paymentModes.map(mode => <SelectItem key={mode} id={mode}>{mode}</SelectItem>)}</Select>
      <Input label="Transaction / bank reference" value={paymentDraft.reference} onChange={value => setPaymentDraft(current => ({ ...current, reference: value }))} placeholder="Enter unique reference" isRequired fieldClassName="fin-input" />
      <Input label="Payer name" value={paymentDraft.payer} onChange={value => setPaymentDraft(current => ({ ...current, payer: value }))} placeholder={selectedOpportunity?.name ?? "Enter payer name"} fieldClassName="fin-input" />
      <Select label="Payer type" aria-label="Payer type" selectedKey={paymentDraft.payerType} onSelectionChange={key => setPaymentDraft(current => ({ ...current, payerType: String(key) }))}>{["Individual", "Company", "Business partner", "Spouse", "Parent", "Other"].map(mode => <SelectItem key={mode} id={mode}>{mode}</SelectItem>)}</Select>
      <Input label="Relationship to applicant" value={paymentDraft.relationship} onChange={value => setPaymentDraft(current => ({ ...current, relationship: value }))} placeholder="Applicant, partner, company…" fieldClassName="fin-input" />
      <label className="fin-file-field">Payment proof <input type="file" accept="image/*,.pdf" onChange={event => setPaymentDraft(current => ({ ...current, proofName: event.target.files?.[0]?.name ?? "" }))} /><small>Only the file name is retained in this preview. No secure file is uploaded.</small></label>
      <Textarea className="fin-form-wide" label="Remarks" value={paymentDraft.remarks} onChange={value => setPaymentDraft(current => ({ ...current, remarks: value }))} rows={2} placeholder="Add context for Finance" fieldClassName="fin-input" />
      {paymentError ? <p className="fin-error fin-form-wide" role="alert">{paymentError}</p> : null}
    </form></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setAddingPayment(false)}>Cancel</Button><Button type="submit" form="finance-payment-form">Submit for verification</Button></ModalFooter></Modal>

    <Modal isOpen={Boolean(review)} onOpenChange={open => !open && setReview(null)} size="md" aria-label="Review payment"><ModalHeader title={review?.status === "Verified" ? "Verify payment" : review?.status === "Rejected" ? "Reject payment" : "Request additional proof"} description={review ? `${review.payment.id} · ${formatMoney(review.payment.amount)} · ${review.payment.reference}` : ""} /><ModalBody><form id="finance-review-form" onSubmit={applyReview} className="fin-form-grid"><Textarea className="fin-form-wide" label={review?.status === "Rejected" ? "Rejection reason" : "Finance review remarks"} value={reviewNote} onChange={setReviewNote} rows={3} isRequired={review?.status === "Rejected"} placeholder="Record the review outcome" fieldClassName="fin-input" />{paymentError ? <p className="fin-error fin-form-wide" role="alert">{paymentError}</p> : null}</form></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setReview(null)}>Cancel</Button><Button type="submit" form="finance-review-form">Save review</Button></ModalFooter></Modal>

    <Modal isOpen={pricingOpen} onOpenChange={open => !open && setPricingOpen(false)} size="lg" aria-label="Add pricing version"><ModalHeader title="Add pricing version" description="A new version is effective going forward; existing deals retain their snapshots." /><ModalBody><form id="finance-pricing-form" onSubmit={savePricing} className="fin-form-grid"><Input label="Brand" value={pricingDraft.brand} onChange={value => setPricingDraft(current => ({ ...current, brand: value }))} placeholder="Enter brand" isRequired fieldClassName="fin-input" /><Input label="Franchise model" value={pricingDraft.model} onChange={value => setPricingDraft(current => ({ ...current, model: value }))} placeholder="Enter model" isRequired fieldClassName="fin-input" /><Input label="Pricing component" value={pricingDraft.component} onChange={value => setPricingDraft(current => ({ ...current, component: value }))} placeholder="e.g. CAPEX" isRequired fieldClassName="fin-input" /><Input label="Amount (INR)" type="number" value={pricingDraft.amount} onChange={value => setPricingDraft(current => ({ ...current, amount: value }))} placeholder="Enter amount" isRequired fieldClassName="fin-input" /><Input label="GST rate (%)" type="number" value={pricingDraft.gstRate} onChange={value => setPricingDraft(current => ({ ...current, gstRate: value }))} isRequired fieldClassName="fin-input" />{paymentError ? <p className="fin-error fin-form-wide" role="alert">{paymentError}</p> : null}</form></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setPricingOpen(false)}>Cancel</Button><Button type="submit" form="finance-pricing-form">Save version</Button></ModalFooter></Modal>

    <Modal isOpen={refundOpen} onOpenChange={open => !open && setRefundOpen(false)} size="lg" aria-label="Request refund"><ModalHeader title="Request refund" description="Original payment records are retained. This request does not transfer funds." /><ModalBody><form id="finance-refund-form" onSubmit={requestRefund} className="fin-form-grid"><Select className="fin-form-wide" label="Opportunity" aria-label="Refund opportunity" selectedKey={refundDraft.opportunityId} onSelectionChange={key => setRefundDraft(current => ({ ...current, opportunityId: String(key) }))}>{opportunities.map(item => <SelectItem key={item.id} id={item.id}>{item.id} · {item.name}</SelectItem>)}</Select><Input label="Requested amount" type="number" value={refundDraft.amount} onChange={value => setRefundDraft(current => ({ ...current, amount: value }))} isRequired fieldClassName="fin-input" /><Input label="Original payment reference" value={refundDraft.paymentReference} onChange={value => setRefundDraft(current => ({ ...current, paymentReference: value }))} placeholder="Optional" fieldClassName="fin-input" /><Textarea className="fin-form-wide" label="Refund reason" value={refundDraft.reason} onChange={value => setRefundDraft(current => ({ ...current, reason: value }))} rows={3} isRequired fieldClassName="fin-input" />{paymentError ? <p className="fin-error fin-form-wide" role="alert">{paymentError}</p> : null}</form></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setRefundOpen(false)}>Cancel</Button><Button type="submit" form="finance-refund-form">Record request</Button></ModalFooter></Modal>
  </ModuleFrame>;
}
