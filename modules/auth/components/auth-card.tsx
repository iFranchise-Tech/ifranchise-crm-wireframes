import type { ReactNode } from "react";

export function AuthCard({ title, description, children, headingAlign = "center" }: {
  title: string;
  description?: string;
  children: ReactNode;
  headingAlign?: "left" | "center";
}) {
  return (
    <div className="auth-card" data-heading-align={headingAlign}>
      <div className="auth-card-heading">
        <h1 className="auth-title" tabIndex={-1}>{title}</h1>
        {description ? <p className="auth-description">{description}</p> : null}
      </div>
      <div className="auth-card-body">{children}</div>
    </div>
  );
}
