import type { ReactNode } from "react";
import { BrandMark, BrandPanel } from "@/components/layout/brand-mark";
import { EmbeddedRouteNotifier } from "@/components/layout/embedded-route-notifier";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-viewport">
      <EmbeddedRouteNotifier />
      <BrandPanel />
      <section className="auth-column" aria-label="Authentication">
        <header className="auth-column-header">
          <BrandMark compact />
          <span className="preview-label"><span />Interactive preview</span>
        </header>
        <div className="auth-content">{children}</div>
        <footer className="auth-footnote">
          <span>© {new Date().getFullYear()} iFranchise</span>
          <span>Connect. Expand. Grow.</span>
        </footer>
      </section>
    </main>
  );
}
