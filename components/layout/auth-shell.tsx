import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { EarthScene } from "@/components/layout/earth-scene";
import { AuthInformation } from "@/modules/auth/components/auth-information";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-viewport">
      <EarthScene />
      <section className="auth-column" aria-label="Authentication">
        <header className="auth-column-header">
          <BrandMark />
        </header>
        <div className="auth-content">{children}</div>
      </section>
      <AuthInformation />
    </main>
  );
}
