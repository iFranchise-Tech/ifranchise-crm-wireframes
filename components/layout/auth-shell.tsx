import type { ReactNode } from "react";
import { GlassScene } from "@/components/layout/glass-scene";
import { AuthInformation } from "@/modules/auth/components/auth-information";
import { AuthSurface } from "./auth-surface";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-viewport">
      <GlassScene />
      <AuthSurface>{children}</AuthSurface>
      <AuthInformation />
    </main>
  );
}
