"use client";

import { useEffect, useRef } from "react";

/** Only the decorative canvas animates. It never measures or moves the form. */
export function EarthScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let disposed = false;
    let release: (() => void) | undefined;
    let restore: (() => void) | undefined;
    const element = canvas.current;
    import("@/lib/visual/earth-renderer").then(({ createEarthRenderer }) => {
      if (disposed || !element) return;
      restore = () => {
        release?.();
        release = createEarthRenderer(element);
      };
      restore();
      element.addEventListener("webglcontextrestored", restore);
    }).catch(() => { /* Keep the static scene if the renderer is unavailable. */ });
    return () => {
      disposed = true;
      if (restore) element?.removeEventListener("webglcontextrestored", restore);
      release?.();
    };
  }, []);

  return <div className="earth-scene" aria-hidden="true">
    <img className="earth-fallback" src="/images/earth/first-frame.webp" alt="" width="1600" height="1000" fetchPriority="high" loading="eager" />
    <canvas ref={canvas} className="earth-canvas" />
    <div className="earth-shade" />
  </div>;
}
