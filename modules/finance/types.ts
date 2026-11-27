export type PaymentState = "Pending Verification" | "Verified" | "Rejected" | "Additional Information Required";
export type InvoiceState = "Draft" | "Pending Approval" | "Approved" | "Issued" | "Sent" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled";

export type PaymentRecord = {
  id: string;
  opportunityId: string;
  amount: number;
  date: string;
  mode: string;
  reference: string;
  payer: string;
  payerType: string;
  relationship: string;
  proofName: string;
  submittedBy: string;
  submittedAt: string;
  status: PaymentState;
  remarks: string;
};

export type PricingRecord = { id: string; brand: string; model: string; component: string; amount: number; gstRate: number; version: number; active: boolean; updatedAt: string };
export type InvoiceLine = { description: string; details?: string; quantity: number; unitPrice: number; gstRate: number };
export type BillingParty = { name: string; address: string; email: string; phone: string; gstin: string; allocation: number };
export type InvoiceRecord = {
  id: string;
  number: string;
  opportunityId: string;
  brand: string;
  model: string;
  billingType: "Individual" | "Company" | "Multiple parties";
  parties: BillingParty[];
  recipients: string[];
  lines: InvoiceLine[];
  currency?: "INR" | "AED" | "USD";
  title?: string;
  documentNumber?: string;
  issuerName?: string;
  issuerDetails?: string;
  issuerTaxId?: string;
  paymentDetails?: string;
  notes?: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceState;
  paymentMethod?: string;
  approvalBy: string;
  issuedAt: string;
  delivery: "Not Sent" | "Delivery Status Unknown" | "Delivery Failed";
  deliveryAttempts: { at: string; by: string; to: string[]; status: string }[];
  reconciliations: { paymentId: string; amount: number; at: string; method?: string }[];
  cancelledReason: string;
  creditNotes: { id: string; amount: number; reason: string; at: string }[];
};
export type FinanceAudit = { id: string; recordId: string; opportunityId: string; action: string; previous: string; next: string; by: string; at: string; remarks: string };
export type FinancialState = { payments: PaymentRecord[]; pricing: PricingRecord[]; invoices: InvoiceRecord[]; audit: FinanceAudit[]; invoiceSequence: number; demoInvoicesSeeded?: boolean };

