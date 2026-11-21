"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { RiArrowDownSLine, RiSidebarFoldLine, RiSidebarUnfoldLine } from "@remixicon/react";
import { Breadcrumb, BreadcrumbItem } from "@/components/base/breadcrumb/breadcrumb";
import { IconButton } from "@/components/base/buttons/icon-button";
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
  sidebarAccount?: ReactNode;
  sidebarFooter?: ReactNode;
  moduleDropdown?: boolean;
  className?: string;
  children: ReactNode;
};

/** One workspace for screens, module information and future CRM experiences. */
export function ReviewShell({ moduleName, icon, subtitle, overviewHref, title, navigation, controls, sidebarAccount, sidebarFooter, moduleDropdown = false, className, children }: ReviewShellProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(true);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem("ifranchise-sidebar-collapsed") === "true");
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(current => {
      const next = !current;
      window.localStorage.setItem("ifranchise-sidebar-collapsed", String(next));
      return next;
    });
  };

  return <div className={className ? `review-shell ${className}` : "review-shell"} data-sidebar-collapsed={sidebarCollapsed} style={sidebarCollapsed ? { gridTemplateColumns: "64px minmax(0, 1fr)" } : undefined}>
    <aside className="review-sidebar" aria-label="Module sidebar" data-collapsed={sidebarCollapsed}>
      <div className="review-sidebar-top">
        <Link className="review-brand" href="/library" aria-label="iFranchise home"><BrandMark /></Link>
        <IconButton className="review-sidebar-toggle" icon={sidebarCollapsed ? RiSidebarUnfoldLine : RiSidebarFoldLine} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!sidebarCollapsed} onClick={toggleSidebar} />
      </div>
      <div className="review-sidebar-content">
        {moduleDropdown && <div className="mx-3 mt-3 flex items-stretch gap-0 rounded-xl bg-button-primary p-1 text-text-white">
          <Link className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-start text-caption-2-semibold tracking-tight text-text-white outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring" href={overviewHref}><span className="shrink-0"><Icon name={icon} /></span><span className="truncate whitespace-nowrap">{moduleName}</span></Link>
          <button type="button" className="flex w-7 shrink-0 items-center justify-center rounded-lg text-text-white hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring" aria-label={navigationOpen ? `Collapse ${moduleName} sections` : `Expand ${moduleName} sections`} aria-expanded={navigationOpen} aria-controls="review-module-navigation" onClick={() => setNavigationOpen(open => !open)}><RiArrowDownSLine className={`size-4 transition-transform ${navigationOpen ? "" : "-rotate-90"}`} /></button>
        </div>}
        {sidebarAccount ?? (!moduleDropdown && <div className="review-sidebar-heading"><span className="review-module-icon"><Icon name={icon} /></span><div><strong>{moduleName}</strong><span>{subtitle}</span></div></div>)}
        {moduleDropdown ? <div id="review-module-navigation" className="review-module-navigation min-h-0 flex-1" hidden={!navigationOpen}>{navigation}</div> : navigation}
        {sidebarFooter ?? <div className="review-sidebar-footer"><span className="status-dot" />Internal design review</div>}
        <Link className="review-all-modules-card" href="/library"><Icon name="grid" /><span>All modules</span><Icon name="arrow" /></Link>
      </div>
    </aside>
    <main className="review-workspace">
      <header className="review-toolbar">
        <button className="icon-button review-menu-button" aria-label="Browse module navigation" onClick={() => dialog.current?.showModal()}><Icon name="menu" /></button>
        <Breadcrumb className="review-breadcrumb" aria-label="Breadcrumb">
          <BreadcrumbItem href={overviewHref}>{moduleName}</BreadcrumbItem>
          <BreadcrumbItem current><h1 className="review-breadcrumb-title">{title}</h1></BreadcrumbItem>
        </Breadcrumb>
        {controls}
      </header>
      {children}
    </main>
    <dialog className="review-nav-dialog" ref={dialog} aria-labelledby="review-navigation-title">
      <div className="dialog-heading"><strong id="review-navigation-title">{moduleName}</strong><button className="icon-button" aria-label="Close module navigation" onClick={() => dialog.current?.close()}><Icon name="close" /></button></div>
      <div className="review-nav-dialog-content" onClick={event => { if ((event.target as HTMLElement).closest("a")) dialog.current?.close(); }}>
        {navigation}
        <Link className="review-all-modules-card" href="/library"><Icon name="grid" /><span>All modules</span><Icon name="arrow" /></Link>
      </div>
    </dialog>
  </div>;
}
