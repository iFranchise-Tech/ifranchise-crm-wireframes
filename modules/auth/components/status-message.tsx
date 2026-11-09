import type { ReactNode } from "react";
import { Icon } from "@/modules/auth/components/icon";

export function StatusMessage({ title, children, tone = "info" }: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "error" | "warning" | "success";
}) {
  const icon = tone === "success" ? "check" : tone === "warning" ? "clock" : tone === "error" ? "alert" : "shield";
  return (
    <div className="status-message" data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      <Icon name={icon} />
      <div>{title ? <strong>{title}</strong> : null}<p>{children}</p></div>
    </div>
  );
}

export function DemoBanner({ children = "Preview only · No accounts or credentials are changed." }: { children?: ReactNode }) {
  return <aside className="demo-banner" role="note">{children}</aside>;
}
