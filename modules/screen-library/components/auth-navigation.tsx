"use client";
import Link from "next/link";
import { Icon } from "@/modules/auth/components/icon";
import { authScreenGroups, getScreenGroup, reviewHref } from "@/modules/screen-library/config/auth-screens";

export function AuthNavigation({ screenId, mode }: { screenId: string; mode: "desktop" | "mobile" }) {
  const activeGroup = getScreenGroup(screenId);
  return <nav className="review-navigation" aria-label="Authentication screens">
    <Link className="review-overview-link" href={reviewHref("overview", mode)} aria-current={screenId === "overview" ? "page" : undefined}><Icon name="grid" />Module overview</Link>
    {authScreenGroups.map(group => <details className="review-nav-group" key={`${group.id}-${activeGroup?.id}`} open={group.id === activeGroup?.id}>
      <summary><Icon name={group.icon} /><span>{group.title}</span><Icon name="chevron" /></summary>
      <ul>{group.screens.map(screen => <li key={screen.id}><Link href={reviewHref(screen.id, mode)} prefetch={false} onClick={event => {
        if (screenId === "overview" || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); window.history.pushState(null, "", reviewHref(screen.id, mode));
      }} aria-current={screenId === screen.id ? "page" : undefined}><span className="nav-screen-dot" />{screen.title}</Link></li>)}</ul>
    </details>)}
  </nav>;
}
