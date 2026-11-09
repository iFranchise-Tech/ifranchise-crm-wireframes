"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Reports navigation only when embedded in the same-origin review environment. */
export function EmbeddedRouteNotifier() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.parent !== window) window.parent.postMessage({ type: "ifranchise:preview-route", pathname }, window.location.origin);
  }, [pathname]);
  return null;
}
