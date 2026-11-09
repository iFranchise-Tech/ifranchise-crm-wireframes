import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; loading?: boolean };

export function PrimaryButton({ children, loading = false, disabled, ...props }: Props) {
  return (
    <button className="button-primary" disabled={disabled || loading} {...props}>
      {loading ? <><span className="spinner" aria-hidden="true" />Working…</> : children}
    </button>
  );
}

export function SecondaryButton({ children, ...props }: Props) {
  return <button className="button-secondary" {...props}>{children}</button>;
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="button-primary" href={href}>{children}</Link>;
}
