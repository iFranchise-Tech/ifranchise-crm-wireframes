"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/layout/brand-mark";

const groups = [
  {
    id: "overview",
    label: "Start here",
    items: [
      ["Welcome", "/welcome"],
      ["Email sign-in", "/sign-in"],
    ],
  },
  {
    id: "sign-in-states",
    label: "Sign-in states",
    items: [
      ["Email validation", "/sign-in/email-validation"],
      ["Password entry", "/sign-in/password"],
      ["Password validation", "/sign-in/password-validation"],
      ["Password visibility", "/sign-in/password-visibility"],
      ["Loading", "/sign-in/loading"],
      ["Invalid credentials", "/status/invalid-credentials"],
    ],
  },
  {
    id: "recovery",
    label: "Password recovery",
    items: [
      ["Forgot password", "/forgot-password"],
      ["Check your email", "/forgot-password/check-email"],
      ["Reset password", "/reset-password"],
      ["Reset complete", "/reset-password/success"],
    ],
  },
  {
    id: "invitations",
    label: "Invitations",
    items: [
      ["Accept invitation", "/invitation"],
      ["First-time setup", "/invitation/setup"],
    ],
  },
  {
    id: "verification",
    label: "Verification",
    items: [
      ["MFA / OTP", "/verify"],
      ["Verification complete", "/verify/success"],
    ],
  },
  {
    id: "access",
    label: "Account & access",
    items: [
      ["Authentication success", "/demo/authenticated"],
      ["Account locked", "/status/locked"],
      ["Temporarily suspended", "/status/temporarily-suspended"],
      ["Deactivated", "/status/deactivated"],
      ["Access restricted", "/status/access-restricted"],
      ["Session expired", "/status/session-expired"],
    ],
  },
] as const;

const screenCount = groups.reduce((total, group) => total + group.items.length, 0);

function groupForPath(pathname: string) {
  const exact = groups.find(group => group.items.some(([, href]) => pathname === href));
  if (exact) return exact.id;
  return groups.find(group => group.items.some(([, href]) => pathname.startsWith(`${href}/`)))?.id ?? "overview";
}

function NavigationGroups({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => groupForPath(pathname));

  useEffect(() => {
    setExpandedGroup(groupForPath(pathname));
  }, [pathname]);

  return (
    <nav className="auth-nav-groups" aria-label="Authentication screens">
      {groups.map(group => {
        const expanded = expandedGroup === group.id;
        return (
          <section className="auth-nav-group" key={group.id}>
            <button
              className="auth-nav-group-toggle"
              type="button"
              aria-expanded={expanded}
              aria-controls={`auth-nav-${group.id}`}
              onClick={() => setExpandedGroup(expanded ? null : group.id)}
            >
              <span>{group.label}</span>
              <span className="auth-nav-chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
            </button>
            <ul className="auth-nav-items" id={`auth-nav-${group.id}`} hidden={!expanded}>
              {group.items.map(([label, href]) => {
                const active = pathname === href;
                return <li key={href}>
                  <Link className="auth-nav-link" href={href} aria-current={active ? "page" : undefined} onClick={onNavigate}>
                    <span className="auth-nav-dot" aria-hidden="true" />{label}
                  </Link>
                </li>;
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}

export function AuthQuickNav({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);

  if (mobile) {
    return (
      <div className="auth-mobile-navigation">
        <button className="auth-mobile-menu-button" type="button" aria-expanded={open} aria-controls="mobile-auth-navigation" onClick={() => setOpen(value => !value)}>
          <span className="auth-menu-icon" aria-hidden="true">{open ? "×" : "☰"}</span>
          Browse screens
        </button>
        {open ? <div className="auth-mobile-menu" id="mobile-auth-navigation"><NavigationGroups onNavigate={() => setOpen(false)} /></div> : null}
      </div>
    );
  }

  return (
    <aside className="auth-sidebar" aria-label="Authentication quick navigation">
      <div className="auth-sidebar-brand"><BrandMark /><span>AUTH MODULE</span></div>
      <div className="auth-sidebar-heading">
        <strong>Screen library</strong>
        <span>Browse all authentication states</span>
      </div>
      <NavigationGroups />
      <div className="auth-sidebar-footer"><span className="auth-sidebar-footer-dot" /> {screenCount} screens · Preview environment</div>
    </aside>
  );
}
