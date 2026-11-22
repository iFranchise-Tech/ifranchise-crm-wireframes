import Link from "next/link";
import type { ReactNode } from "react";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import type { IconName } from "@/modules/auth/components/icon";
import "./workspaces.css";

export type ModuleView = { id: string; label: string };

export function ModuleFrame({ moduleId, moduleName, icon, current, views, children, controls }: {
  moduleId: string; moduleName: string; icon: IconName; current: string; views: ModuleView[]; children: ReactNode; controls?: ReactNode;
}) {
  const base = `/library/modules/${moduleId}`;
  const navigation = <nav className="review-navigation fin-module-nav" aria-label={`${moduleName} navigation`}>
    {views.map(view => <Link key={view.id} className="review-overview-link" href={view.id === "Overview" ? base : `${base}?view=${encodeURIComponent(view.id)}`} aria-current={current === view.id ? "page" : undefined}>{view.label}</Link>)}
  </nav>;
  return <ReviewShell moduleName={moduleName} icon={icon} subtitle="Connected CRM workspace" overviewHref={base} title={current} navigation={navigation} moduleDropdown controls={controls}>
    <div className="review-information fin-page-content">
      <div className="fin-content-limit">
        <div className="fin-preview-banner"><span aria-hidden="true">i</span><p>Preview data is stored in this browser. Secure server authorization, shared database storage, file storage and email delivery are not configured.</p></div>
        {children}
      </div>
    </div>
  </ReviewShell>;
}

export function PageHeading({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="fin-page-heading"><div><h2>{title}</h2><p>{description}</p></div>{actions ? <div className="fin-heading-actions">{actions}</div> : null}</div>;
}

export function MetricCards({ items }: { items: { label: string; value: string; note?: string }[] }) {
  return <div className="fin-metrics">{items.map(item => <article className="fin-metric-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong>{item.note ? <small>{item.note}</small> : null}</article>)}</div>;
}

export function DataTable({ headers, children, empty }: { headers: string[]; children: ReactNode; empty?: boolean }) {
  return <div className="fin-table-scroll"><table className="fin-table"><thead><tr>{headers.map((header, index) => <th key={`${header}-${index}`} scope="col">{header}</th>)}</tr></thead><tbody>{empty ? <tr><td className="fin-empty" colSpan={headers.length}>No matching records</td></tr> : children}</tbody></table></div>;
}

export function StatusLabel({ children }: { children: string }) {
  const value = children.toLowerCase();
  const tone = value.includes("verified") || value === "paid" || value === "issued" || value === "approved" ? "success" : value.includes("reject") || value.includes("cancel") || value.includes("failed") ? "danger" : value.includes("pending") || value.includes("partial") || value.includes("unknown") ? "warning" : "neutral";
  return <span className={`fin-status fin-status-${tone}`}>{children}</span>;
}

export function Money({ amount }: { amount: number }) {
  return <>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)}</>;
}

export function FormGrid({ children }: { children: ReactNode }) { return <div className="fin-form-grid">{children}</div>; }

export function TextAction({ children, onClick, disabled = false, danger = false, type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean; type?: "button" | "submit" }) {
  return <button className={`fin-text-action${danger ? " is-danger" : ""}`} type={type} onClick={onClick} disabled={disabled}>{children}</button>;
}

