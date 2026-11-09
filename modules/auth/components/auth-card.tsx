import type { ReactNode } from "react";

export function AuthCard({ title, description, children }: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-card">
      <h1 className="auth-title" tabIndex={-1}>{title}</h1>
      {description ? <p className="auth-description">{description}</p> : null}
      {children}
    </div>
  );
}
