import type { ReactNode } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { Icon, type IconName } from "@/modules/auth/components/icon";
import { DemoBanner } from "@/modules/auth/components/status-message";

export function ResultScreen({ eyebrow, title, description, note, action, href, icon = "check", children }: { eyebrow: string; title: string; description: string; note: string; action: string; href: string; icon?: IconName; children?: ReactNode }) {
  return <><DemoBanner>{note}</DemoBanner><div className="status-icon" data-tone="success"><Icon name={icon} /></div><AuthCard eyebrow={eyebrow} title={title} description={description}>{children}<div className="status-actions"><PrimaryLink href={href}>{action}<Icon name="arrow" /></PrimaryLink></div></AuthCard></>;
}
