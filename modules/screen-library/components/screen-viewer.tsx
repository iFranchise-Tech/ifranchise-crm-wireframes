"use client";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AuthNavigation } from "./auth-navigation";
import { ReviewShell } from "./review-shell";
import { Icon } from "@/modules/auth/components/icon";
import { authScreens, getAuthScreen, reviewHref, type AuthScreen } from "../config/auth-screens";
type Mode = "desktop" | "mobile";

export function ScreenViewer({ screen, initialMode }: { screen: AuthScreen; initialMode: Mode }) {
  const router = useRouter();
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const source = useRef(`/auth-preview/${screen.id}`);
  const selected = useRef(screen.id);
  selected.current = screen.id;
  const [size, setSize] = useState({ width: 1100, height: 780 });
  const [measured, setMeasured] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode);
  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => { document.title = `${screen.title} · iFranchise review`; }, [screen.title]);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "ifranchise:select-screen", screen: screen.id }, window.location.origin);
  }, [screen.id]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.type === "ifranchise:preview-ready") frame.current?.contentWindow?.postMessage({ type: "ifranchise:select-screen", screen: selected.current }, window.location.origin);
      if (data?.type === "ifranchise:screen-changed" && typeof data.screen === "string" && getAuthScreen(data.screen) && data.screen !== selected.current) window.history.pushState(null, "", reviewHref(data.screen, mode));
      if (data?.type === "ifranchise:open-library" && typeof data.href === "string" && /^\/library(?:\/modules\/[a-z-]+)?$/.test(data.href)) router.push(data.href);
      if (data?.type === "ifranchise:open-workspace") router.push(`/demo/workspace${mode === "mobile" ? "?mode=mobile" : ""}`);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [mode, router]);
  useLayoutEffect(() => {
    if (!stage.current) return;
    const measure = () => { const { width, height } = stage.current!.getBoundingClientRect(); setSize({ width, height }); setMeasured(true); };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const availableWidth = Math.max(320, size.width - (size.width < 352 ? 0 : size.width < 500 ? 16 : 48));
  const availableHeight = Math.max(300, size.height - 36);
  const width = mode === "mobile" ? Math.min(390, availableWidth) : availableWidth;
  const height = availableHeight;
  const scale = 1;
  function changeMode(next: Mode) { setMode(next); window.history.replaceState(null, "", reviewHref(screen.id, next)); }
  return <ReviewShell moduleName="Authentication" icon="lock" subtitle={`${authScreens.length} screens & states`} overviewHref={reviewHref("overview", mode)} title={screen.title} navigation={<AuthNavigation screenId={screen.id} mode={mode} />} controls={<div className="preview-mode-control" role="group" aria-label="Preview size">
    <button aria-label="Desktop" aria-pressed={mode === "desktop"} onClick={() => changeMode("desktop")}><Icon name="desktop" /><span>Desktop</span></button>
    <button aria-label="Mobile" aria-pressed={mode === "mobile"} onClick={() => changeMode("mobile")}><Icon name="mobile" /><span>Mobile</span></button>
  </div>}>
    <div className="review-stage" ref={stage} data-mode={mode}>
      <div className="review-frame-wrap" style={{ width: width * scale, height: height * scale, visibility: measured ? "visible" : "hidden" }}>
        <iframe ref={frame} className="review-frame" title={`${screen.title} — ${mode} preview`} src={source.current} style={{ width, height, transform: `scale(${scale})` }} />
      </div>
    </div>
  </ReviewShell>;
}
