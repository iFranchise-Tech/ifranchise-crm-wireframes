import { initialOpportunities } from "@/modules/pipeline/data";
import type { FinancialState, InvoiceLine, InvoiceRecord, PaymentRecord } from "./types";

export const FINANCE_STORAGE_KEY = "ifranchise-finance-preview-v1";
export const PIPELINE_STORAGE_KEY = "ifranchise-sales-pipeline-v1";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const now = () => new Date().toISOString();

export function createInitialFinanceState(): FinancialState {
  const payments: PaymentRecord[] = initialOpportunities.flatMap(opportunity => (opportunity.payments ?? []).map((payment, index) => ({
    id: payment.id.startsWith("PAY-") ? `PAY-${opportunity.id.slice(-4)}-${index + 1}` : payment.id,
    opportunityId: opportunity.id, amount: payment.amount, date: payment.date, mode: "Bank Transfer", reference: payment.reference,
    payer: opportunity.name, payerType: "Individual", relationship: "Applicant", proofName: "", submittedBy: opportunity.owner,
    submittedAt: payment.date, status: payment.verified ? "Verified" as const : "Pending Verification" as const, remarks: "Imported from the opportunity preview record",
  })));
  return { payments, pricing: [], invoices: [], audit: [], invoiceSequence: 1 };
}

export function readFinanceState(): FinancialState {
  if (typeof window === "undefined") return createInitialFinanceState();
  try {
    const value = window.localStorage.getItem(FINANCE_STORAGE_KEY);
    if (!value) return createInitialFinanceState();
    const saved = JSON.parse(value) as Partial<FinancialState>;
    const defaults = createInitialFinanceState();
    return { ...defaults, ...saved, payments: saved.payments ?? defaults.payments, pricing: saved.pricing ?? [], invoices: saved.invoices ?? [], audit: saved.audit ?? [] };
  } catch { return createInitialFinanceState(); }
}

export function writeFinanceState(state: FinancialState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(state));
  syncPipelineVerifiedAmounts(state.payments);
  window.dispatchEvent(new CustomEvent("ifranchise:finance-updated"));
}

export function applyFinancePaymentSnapshot<T extends { id: string; payments?: unknown[]; verifiedAmount?: number }>(items: T[], payments: PaymentRecord[]): T[] {
  return items.map(item => {
    const related = payments.filter(payment => payment.opportunityId === item.id);
    return { ...item, verifiedAmount: related.filter(payment => payment.status === "Verified").reduce((sum, payment) => sum + payment.amount, 0), payments: related.map(payment => ({ id: payment.id, amount: payment.amount, date: payment.date, reference: payment.reference, verified: payment.status === "Verified" })) };
  });
}

function syncPipelineVerifiedAmounts(payments: PaymentRecord[]) {
  try {
    const raw = window.localStorage.getItem(PIPELINE_STORAGE_KEY);
    if (!raw) return;
    const pipeline = JSON.parse(raw) as { opportunities?: Array<Record<string, unknown> & { id: string; payments?: unknown[] }> };
    if (!pipeline.opportunities) return;
    pipeline.opportunities = pipeline.opportunities.map(opportunity => {
      const related = payments.filter(payment => payment.opportunityId === opportunity.id);
      return { ...opportunity, verifiedAmount: related.filter(payment => payment.status === "Verified").reduce((sum, payment) => sum + payment.amount, 0), payments: related.map(payment => ({ id: payment.id, amount: payment.amount, date: payment.date, reference: payment.reference, verified: payment.status === "Verified" })) };
    });
    window.localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(pipeline));
  } catch { /* The finance record remains the source of truth if an old pipeline draft is unreadable. */ }
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

export function verifiedTotal(state: FinancialState, opportunityId: string) {
  return state.payments.filter(payment => payment.opportunityId === opportunityId && payment.status === "Verified").reduce((sum, payment) => sum + payment.amount, 0);
}

export function paymentTotals(state: FinancialState, opportunityId: string) {
  const payments = state.payments.filter(payment => payment.opportunityId === opportunityId);
  return {
    submitted: payments.reduce((sum, payment) => sum + payment.amount, 0),
    verified: payments.filter(payment => payment.status === "Verified").reduce((sum, payment) => sum + payment.amount, 0),
    rejected: payments.filter(payment => payment.status === "Rejected").reduce((sum, payment) => sum + payment.amount, 0),
    pending: payments.filter(payment => ["Pending Verification", "Additional Information Required"].includes(payment.status)).reduce((sum, payment) => sum + payment.amount, 0),
  };
}

export function dealPaymentStatus(state: FinancialState, opportunityId: string, dealValue: number) {
  const payments = state.payments.filter(payment => payment.opportunityId === opportunityId);
  const totals = paymentTotals(state, opportunityId);
  if (!payments.length) return "Not Initiated";
  if (totals.verified >= dealValue) return "Fully Paid";
  if (payments.some(payment => payment.status === "Rejected")) return "Payment Discrepancy";
  if (totals.verified > 0 && totals.pending > 0) return "Partially Verified";
  if (totals.pending > 0 && totals.verified === 0) return "Pending Finance Verification";
  if (totals.verified > 0) return "Partially Paid";
  return "Payment Pending";
}

export function totalInvoice(lineItems: InvoiceLine[]) {
  return lineItems.reduce((total, line) => {
    const taxable = Math.max(0, line.quantity) * Math.max(0, line.unitPrice);
    return total + taxable + taxable * Math.max(0, line.gstRate) / 100;
  }, 0);
}

export function invoicePaid(invoice: InvoiceRecord) {
  return invoice.reconciliations.reduce((sum, entry) => sum + entry.amount, 0);
}

export function invoiceBalance(invoice: InvoiceRecord) { return Math.max(0, totalInvoice(invoice.lines) - invoicePaid(invoice)); }

export function financialYear(date = new Date()) {
  const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `FY${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
}

export function createAudit(recordId: string, opportunityId: string, action: string, previous: string, next: string, by: string, remarks = "") {
  return { id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, recordId, opportunityId, action, previous, next, by, at: now(), remarks };
}

export function dateKey() { return today(); }
