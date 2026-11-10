"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Icon, type IconName } from "@/modules/auth/components/icon";

type ReviewShellProps = {
  moduleName: string;
  icon: IconName;
  subtitle: string;
  overviewHref: string;
  title: string;
  navigation: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
};

/** One workspace for screens, module information and future CRM experiences. */
export function ReviewShell({ moduleName, icon, subtitle, overviewHref, title, navigation, controls, children }: ReviewShellProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <div className="review-shell">
    <aside className="review-sidebar" aria-label="Screen library">
      <Link className="review-brand" href="/library" aria-label="Back to screen library"><BrandMark /><span>SCREEN LIBRARY</span></Link>
      <Link className="review-all-modules" href="/library">← All modules</Link>
      <div className="review-sidebar-heading"><span className="review-module-icon"><Icon name={icon} /></span><div><strong>{moduleName}</strong><span>{subtitle}</span></div></div>
      {navigation}
      <div className="review-sidebar-footer"><span className="status-dot" />Internal design review</div>
    </aside>
    <main className="review-workspace">
      <header className="review-toolbar">
        <button className="icon-button review-menu-button" aria-label="Browse module navigation" onClick={() => dialog.current?.showModal()}><Icon name="menu" /></button>
        <div className="review-breadcrumb"><Link href={overviewHref}>{moduleName}</Link><Icon name="chevron" /><h1>{title}</h1></div>
        {controls}
      </header>
      {children}
    </main>
    <dialog className="review-nav-dialog" ref={dialog} aria-labelledby="review-navigation-title">
      <div className="dialog-heading"><strong id="review-navigation-title">{moduleName}</strong><button className="icon-button" aria-label="Close module navigation" onClick={() => dialog.current?.close()}><Icon name="close" /></button></div>
      <div onClick={event => { if ((event.target as HTMLElement).closest("a")) dialog.current?.close(); }}>
        <Link className="review-all-modules" href="/library">← All modules</Link>
        {navigation}
      </div>
    </dialog>
  </div>;
}
