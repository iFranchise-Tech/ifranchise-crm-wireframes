import type { ReactNode } from "react";

export function AuthCard({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-card">
      <p className="auth-eyebrow">{eyebrow}</p>
      <h1 className="auth-title" tabIndex={-1}>{title}</h1>
      {description ? <p className="auth-description">{description}</p> : null}
      {children}
    </div>
  );
}
