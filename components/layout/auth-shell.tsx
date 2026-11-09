import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
import { EmbeddedRouteNotifier } from "@/components/layout/embedded-route-notifier";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-viewport">
      <EmbeddedRouteNotifier />
      <AuthBrandPanel />
      <section className="auth-column" aria-label="Authentication">
        <header className="auth-column-header">
          <BrandMark />
        </header>
        <div className="auth-content">{children}</div>
        <footer className="auth-footnote">UI preview · No live authentication or account changes.</footer>
      </section>
    </main>
  );
}
