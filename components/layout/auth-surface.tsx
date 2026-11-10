"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Compact layouts do most of the work; fit unusually short viewports as a fallback. */
export function AuthSurface({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = stage.current;
    const surface = card.current;
    if (!container || !surface) return;
    const fit = () => {
      const next = Math.min(1, container.clientHeight / Math.max(1, surface.offsetHeight));
      setScale(previous => Math.abs(previous - next) > 0.002 ? next : previous);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  return <div className="auth-fit-stage" ref={stage}>
    <section className="auth-column" ref={card} aria-label="Authentication" style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}>
      <div className="auth-content">{children}</div>
    </section>
  </div>;
}
