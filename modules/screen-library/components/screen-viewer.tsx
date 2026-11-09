"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Icon } from "@/modules/auth/components/icon";
import { authScreenGroups, authScreens, getScreenGroup, reviewHref, type AuthScreen } from "@/modules/screen-library/config/auth-screens";

type Mode = "desktop" | "mobile";

function ScreenNavigation({ screenId, mode, onNavigate }: { screenId: string; mode: Mode; onNavigate?: () => void }) {
  const activeGroup = getScreenGroup(screenId);
  return <nav className="review-navigation" aria-label="Authentication screens">
    <Link className="review-overview-link" href="/library/authentication" onClick={onNavigate}><Icon name="grid" />Module overview</Link>
    {authScreenGroups.map(group => <details className="review-nav-group" key={`${group.id}-${activeGroup?.id}`} open={group.id === activeGroup?.id}>
      <summary><Icon name={group.icon} /><span>{group.title}</span><Icon name="chevron" /></summary>
      <ul>{group.screens.map(screen => <li key={screen.id}><Link href={reviewHref(screen.id, mode)} aria-current={screenId === screen.id ? "page" : undefined} onClick={onNavigate}><span className="nav-screen-dot" />{screen.title}</Link></li>)}</ul>
    </details>)}
  </nav>;
}

export function ScreenViewer({ screen, initialMode }: { screen: AuthScreen; initialMode: Mode }) {
  const router = useRouter();
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [size, setSize] = useState({ width: 1100, height: 780 });
  const [mode, setMode] = useState<Mode>(initialMode);
  const [frameReady, setFrameReady] = useState(false);
  const index = authScreens.findIndex(item => item.id === screen.id);
  const previous = authScreens[index - 1];
  const next = authScreens[index + 1];
  const group = getScreenGroup(screen.id);

  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => { setFrameReady(false); }, [screen.id]);
  useEffect(() => {
    function followEmbeddedRoute(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data as { type?: string; pathname?: string } | null;
      if (!data || data.type !== "ifranchise:preview-route" || typeof data.pathname !== "string") return;
      const destination = authScreens.find(item => item.href === data.pathname);
      if (destination && destination.id !== screen.id) router.replace(reviewHref(destination.id, mode), { scroll: false });
    }
    window.addEventListener("message", followEmbeddedRoute);
    return () => window.removeEventListener("message", followEmbeddedRoute);
  }, [screen.id, mode, router]);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  const availableWidth = Math.max(280, size.width - (size.width < 500 ? 16 : 48));
  const availableHeight = Math.max(300, size.height - 36);
  const width = mode === "mobile" ? Math.min(390, availableWidth) : Math.max(1120, availableWidth);
  const height = mode === "mobile" ? availableHeight : Math.max(780, availableHeight);
  const scale = mode === "mobile" ? 1 : Math.min(1, availableWidth / width, availableHeight / height);

  function changeMode(value: Mode) {
    setMode(value);
    router.replace(reviewHref(screen.id, value), { scroll: false });
  }

  return <div className="review-shell">
    <aside className="review-sidebar">
      <Link className="review-brand" href="/library" aria-label="Back to screen library"><BrandMark /><span>SCREEN LIBRARY</span></Link>
      <Link className="review-all-modules" href="/library">← All modules</Link>
      <div className="review-sidebar-heading"><span className="review-module-icon"><Icon name="lock" /></span><div><strong>Authentication</strong><span>{authScreens.length} screens & states</span></div></div>
      <ScreenNavigation screenId={screen.id} mode={mode} />
      <div className="review-sidebar-footer"><span className="status-dot" />Internal design review</div>
    </aside>
    <div className="review-workspace">
      <header className="review-toolbar">
        <button className="icon-button review-menu-button" aria-label="Browse authentication screens" onClick={() => dialog.current?.showModal()}><Icon name="menu" /></button>
        <div className="review-breadcrumb"><Link href="/library/authentication">Authentication</Link><Icon name="chevron" /><span>{screen.title}</span></div>
        <div className="preview-mode-control" role="group" aria-label="Preview size"><button aria-pressed={mode === "desktop"} onClick={() => changeMode("desktop")}><Icon name="desktop" /><span>Desktop</span></button><button aria-pressed={mode === "mobile"} onClick={() => changeMode("mobile")}><Icon name="mobile" /><span>Mobile</span></button></div>
        <a className="icon-button" href={screen.href} target="_blank" rel="noopener" aria-label="Open clean screen in a new tab" title="Open clean screen"><Icon name="external" /></a>
      </header>
      <div className="review-screen-heading"><div><span>{group?.title}</span><h1>{screen.title}</h1></div><span className="review-route">{screen.href}</span></div>
      <div className="review-stage" ref={stage} data-mode={mode}>
        <div className="review-frame-wrap" style={{ width: width * scale, height: height * scale }}>
          <iframe key={screen.id} ref={frame} className="review-frame" title={`${screen.title} — ${mode} preview`} src={screen.href} style={{ width, height, transform: `scale(${scale})` }} onLoad={() => {
            setFrameReady(true);
            // Keep the review navigation in step when a form follows a clean auth route.
            const path = frame.current?.contentWindow?.location.pathname;
            const destination = authScreens.find(item => item.href === path);
            if (destination && destination.id !== screen.id) router.replace(reviewHref(destination.id, mode), { scroll: false });
          }} />
          {!frameReady ? <span className="frame-loading" role="status">Opening screen…</span> : null}
        </div>
      </div>
      <footer className="review-pager"><div className="pager-link">{previous ? <Link href={reviewHref(previous.id, mode)}><span aria-hidden="true">←</span><span><small>Previous</small>{previous.title}</span></Link> : <Link href="/library/authentication">← Overview</Link>}</div><span className="pager-count">{String(index + 1).padStart(2, "0")} <span>/ {authScreens.length}</span></span><div className="pager-link pager-next">{next ? <Link href={reviewHref(next.id, mode)}><span><small>Next screen</small>{next.title}</span><span aria-hidden="true">→</span></Link> : <Link href="/library/authentication">Back to overview →</Link>}</div></footer>
    </div>
    <dialog className="review-nav-dialog" ref={dialog} aria-labelledby="review-navigation-title"><div className="dialog-heading"><strong id="review-navigation-title">Authentication screens</strong><button className="icon-button" aria-label="Close screen navigation" onClick={() => dialog.current?.close()}><Icon name="close" /></button></div><ScreenNavigation screenId={screen.id} mode={mode} onNavigate={() => dialog.current?.close()} /></dialog>
  </div>;
}
