import type { ReactNode } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { Icon, type IconName } from "@/modules/auth/components/icon";

export function ResultScreen({ title, description, action, href, icon = "check", children }: { title: string; description: string; action: string; href: string; icon?: IconName; children?: ReactNode }) {
  return <><div className="status-icon" data-tone="success"><Icon name={icon} /></div><AuthCard title={title} description={description}>{children}<div className="status-actions"><PrimaryLink href={href}>{action}<Icon name="arrow" /></PrimaryLink></div></AuthCard></>;
}
