"use client";

import { useEffect, useRef } from "react";

/** Only the decorative canvas animates. It never measures or moves the form. */
export function EarthScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let disposed = false;
    let release: (() => void) | undefined;
    import("@/lib/visual/earth-renderer").then(({ createEarthRenderer }) => {
      if (!disposed && canvas.current) release = createEarthRenderer(canvas.current);
    }).catch(() => { /* Keep the static scene if the renderer is unavailable. */ });
    return () => { disposed = true; release?.(); };
  }, []);

  return <div className="earth-scene" aria-hidden="true">
    <img className="earth-fallback" src="/images/orbital-earth.webp" alt="" width="1536" height="1024" fetchPriority="high" />
    <canvas ref={canvas} className="earth-canvas" />
    <div className="earth-shade" />
  </div>;
}
