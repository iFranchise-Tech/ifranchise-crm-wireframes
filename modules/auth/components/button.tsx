import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AuthLink as Link } from "./auth-navigation-context";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; loading?: boolean; loadingLabel?: string };

export function PrimaryButton({ children, loading = false, loadingLabel = "Working…", loadingStyle = "spinner", disabled, ...props }: Props & { loadingStyle?: "spinner" | "pulse" }) {
  return (
    <button className="button-primary" data-loading-style={loading ? loadingStyle : undefined} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading ? <>
        {loadingStyle === "pulse" ? <span className="loading-pulse" aria-hidden="true"><span /><span /><span /></span> : <span className="spinner" aria-hidden="true" />}
        <span role="status">{loadingLabel}</span>
      </> : children}
    </button>
  );
}

export function SecondaryButton({ children, loading = false, loadingLabel = "Working…", disabled, ...props }: Props) {
  return <button className="button-secondary" disabled={disabled || loading} aria-busy={loading} {...props}>{loading ? loadingLabel : children}</button>;
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="button-primary" href={href}>{children}</Link>;
}
