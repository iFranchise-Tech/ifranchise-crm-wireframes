import type { ReactNode } from "react";
import { WaveScene } from "@/components/layout/wave-scene";
import { AuthInformation } from "@/modules/auth/components/auth-information";
import { AuthSurface } from "./auth-surface";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-viewport">
      <WaveScene />
      <AuthSurface>{children}</AuthSurface>
      <AuthInformation />
    </main>
  );
}
