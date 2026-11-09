"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getAuthScreen } from "../config/auth-screens";
import { ScreenViewer } from "./screen-viewer";

/** Keep the embedded app mounted while its journey updates the review URL. */
export function AuthenticationWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const query = useSearchParams();
  const screen = getAuthScreen(pathname.split("/").at(-1) ?? "");
  if (!screen) return children;
  return <ScreenViewer screen={screen} initialMode={query.get("mode") === "mobile" ? "mobile" : "desktop"} />;
}
