"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthNavigation } from "./auth-navigation";
import { ReviewShell } from "./review-shell";
import { Icon } from "@/modules/auth/components/icon";
import { authScreens, getScreenGroup, reviewHref, type AuthScreen } from "@/modules/screen-library/config/auth-screens";

type Mode = "desktop" | "mobile";

export function ScreenViewer({ screen, initialMode }: { screen: AuthScreen; initialMode: Mode }) {
  const router = useRouter();
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
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

  return <ReviewShell moduleName="Authentication" icon="lock" subtitle={`${authScreens.length} screens & states`} overviewHref={reviewHref("overview", mode)} title={screen.title} section={group?.title ?? "Authentication"} route={screen.href} navigation={<AuthNavigation screenId={screen.id} mode={mode} />} controls={<>
    <div className="preview-mode-control" role="group" aria-label="Preview size"><button aria-pressed={mode === "desktop"} onClick={() => changeMode("desktop")}><Icon name="desktop" /><span>Desktop</span></button><button aria-pressed={mode === "mobile"} onClick={() => changeMode("mobile")}><Icon name="mobile" /><span>Mobile</span></button></div>
    <a className="icon-button" href={screen.href} target="_blank" rel="noopener" aria-label="Open clean screen in a new tab" title="Open clean screen"><Icon name="external" /></a>
  </>} footer={<footer className="review-pager"><div className="pager-link">{previous ? <Link href={reviewHref(previous.id, mode)}><span aria-hidden="true">←</span><span><small>Previous</small>{previous.title}</span></Link> : <Link href={reviewHref("overview", mode)}>← Overview</Link>}</div><span className="pager-count">{String(index + 1).padStart(2, "0")} <span>/ {authScreens.length}</span></span><div className="pager-link pager-next">{next ? <Link href={reviewHref(next.id, mode)}><span><small>Next screen</small>{next.title}</span><span aria-hidden="true">→</span></Link> : <Link href={reviewHref("overview", mode)}>Back to overview →</Link>}</div></footer>}>
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
  </ReviewShell>;
}
