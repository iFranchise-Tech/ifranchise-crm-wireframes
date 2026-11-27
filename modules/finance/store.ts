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
  return { payments, pricing: [], invoices: createDemoInvoices(), audit: [], invoiceSequence: 1, demoInvoicesSeeded: true };
}

function createDemoInvoices(): InvoiceRecord[] {
  const examples = [
    { status: "Overdue", amount: 420, number: "INV-00127", method: "" },
    { status: "Overdue", amount: 2130, number: "INV-00132", method: "" },
    { status: "Overdue", amount: 3760, number: "INV-00145", method: "" },
    { status: "Overdue", amount: 100, number: "INV-00157", method: "" },
    { status: "Paid", amount: 1560, number: "INV-00159", method: "ACH via Stripe" },
    { status: "Paid", amount: 11400, number: "INV-00183", method: "Visa ···· 7080" },
    { status: "Paid", amount: 200, number: "INV-00197", method: "Amazon Pay" },
    { status: "Paid", amount: 16320, number: "INV-00199", method: "PayPal" },
    { status: "Sent", amount: 2160, number: "INV-00200", method: "" },
    { status: "Issued", amount: 9840, number: "INV-00204", method: "" },
    { status: "Draft", amount: 2700, number: "DRAFT", method: "" },
    { status: "Partially Paid", amount: 12480, number: "INV-00212", method: "Wire via Wise" },
  ] as const;
  return examples.map((example, index) => {
    const opportunity = initialOpportunities[index % initialOpportunities.length];
    const paid = example.status === "Paid" ? example.amount : example.status === "Partially Paid" ? Math.round(example.amount * 0.45) : 0;
    const invoiceDate = index < 8 ? (index < 4 ? "2026-09-01" : "2026-08-01") : "2026-11-01";
    const dueDate = index < 4 ? "2026-10-01" : index < 8 ? "2026-08-31" : index === 8 ? "2026-11-30" : index === 9 ? "2026-12-05" : index === 10 ? "" : "2026-11-22";
    const billingName = opportunity?.name ?? `Sample customer ${index + 1}`;
    const reconciliation = paid ? [{ paymentId: `DEMO-PAY-${index + 1}`, amount: paid, at: `${index < 4 ? "2026-09" : "2026-11"}-${String(7 + index % 19).padStart(2, "0")}T10:00:00+05:30`, method: example.method }] : [];
    return {
      id: `DEMO-INV-${String(index + 1).padStart(4, "0")}`, number: example.number, opportunityId: opportunity?.id ?? `OPP-${1001 + index}`, brand: opportunity?.brand ?? "Sample brand", model: "Standard franchise model", billingType: "Company" as const,
      parties: [{ name: billingName, address: "12 Market Road, Bengaluru, Karnataka", email: opportunity?.email ?? `billing${index + 1}@example.com`, phone: opportunity?.phone ?? "", gstin: "", allocation: example.amount }], recipients: [opportunity?.email ?? `billing${index + 1}@example.com`],
      lines: [{ description: "Franchise services", quantity: 1, unitPrice: example.amount, gstRate: 0 }], invoiceDate, dueDate, status: example.status as InvoiceRecord["status"], approvalBy: "Finance team", issuedAt: invoiceDate ? `${invoiceDate}T09:00:00+05:30` : "", delivery: example.status === "Sent" ? "Delivery Status Unknown" as const : "Not Sent" as const, deliveryAttempts: [], reconciliations: reconciliation, cancelledReason: "", creditNotes: [],
      ...(example.method ? { paymentMethod: example.method } : {}),
    } as InvoiceRecord;
  });
}

export function readFinanceState(): FinancialState {
  if (typeof window === "undefined") return createInitialFinanceState();
  try {
    const value = window.localStorage.getItem(FINANCE_STORAGE_KEY);
    if (!value) return createInitialFinanceState();
    const saved = JSON.parse(value) as Partial<FinancialState>;
    const defaults = createInitialFinanceState();
    const seedDemo = !saved.demoInvoicesSeeded && !saved.invoices?.length;
    const demoById = new Map(defaults.invoices.map(invoice => [invoice.id, invoice]));
    const invoices = seedDemo ? defaults.invoices : (saved.invoices ?? defaults.invoices).map(invoice => {
      const demo = demoById.get(invoice.id);
      if (!demo) return invoice;
      return {
        ...invoice,
        paymentMethod: invoice.paymentMethod ?? demo.paymentMethod,
        reconciliations: invoice.reconciliations.map((entry, index) => ({
          ...entry,
          method: entry.method ?? demo.reconciliations[index]?.method,
          at: entry.paymentId.startsWith("DEMO-PAY-") ? demo.reconciliations[index]?.at ?? entry.at : entry.at,
        })),
      };
    });
    return { ...defaults, ...saved, payments: saved.payments ?? defaults.payments, pricing: saved.pricing ?? [], invoices, audit: saved.audit ?? [], demoInvoicesSeeded: true };
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
