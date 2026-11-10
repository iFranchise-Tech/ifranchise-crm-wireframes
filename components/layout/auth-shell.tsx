import type { ReactNode } from "react";
import { EarthScene } from "@/components/layout/earth-scene";
import { AuthInformation } from "@/modules/auth/components/auth-information";
import { AuthSurface } from "./auth-surface";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-viewport">
      <EarthScene />
      <AuthSurface>{children}</AuthSurface>
      <AuthInformation />
    </main>
  );
}
