import type { ReactNode } from "react";
import { BrandMark, BrandPanel } from "@/components/layout/brand-mark";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-viewport min-h-svh">
      <BrandPanel />
      <section className="auth-column" aria-label="Authentication">
        <header className="auth-column-header">
          <BrandMark compact />
          <span className="preview-label">Preview · sign-in service offline</span>
        </header>
        <div className="auth-content mx-auto w-full max-w-[430px]">{children}</div>
        <footer className="auth-footnote">
          <span>© {new Date().getFullYear()} iFranchise</span>
          <span>Organization-managed access</span>
        </footer>
      </section>
    </main>
  );
}
