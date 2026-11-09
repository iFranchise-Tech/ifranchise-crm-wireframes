import type { ReactNode } from "react";

export function AuthCard({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="auth-eyebrow">{eyebrow}</p>
      <h2 className="auth-title">{title}</h2>
      {description ? <p className="auth-description">{description}</p> : null}
      {children}
    </div>
  );
}
