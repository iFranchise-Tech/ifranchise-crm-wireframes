"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { BrandMark, BrandPanel } from "@/components/layout/brand-mark";
import { AuthQuickNav } from "@/components/layout/auth-quick-nav";

type PreviewMode = "desktop" | "mobile";

export function AuthShell({ children }: { children: ReactNode }) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const previewLabel = process.env.NODE_ENV === "production"
    ? "Preview · sign-in service offline"
    : "Preview · demo only";

  return (
    <div className="auth-preview-root" data-preview-mode={previewMode}>
      <AuthQuickNav />
      <div className="auth-preview-workspace">
        <header className="preview-toolbar">
          <div className="preview-toolbar-heading">
            <span>Authentication experience</span>
            <small>SCREEN REVIEW</small>
          </div>
          <AuthQuickNav mobile />
          <div className="preview-mode-control" role="group" aria-label="Preview size">
            <span className="preview-mode-label">Preview</span>
            <button type="button" aria-pressed={previewMode === "desktop"} onClick={() => setPreviewMode("desktop")}>Desktop</button>
            <button type="button" aria-pressed={previewMode === "mobile"} onClick={() => setPreviewMode("mobile")}>Mobile</button>
          </div>
        </header>
        <div className="auth-preview-frame">
          <main className="auth-viewport min-h-svh">
            <BrandPanel />
            <section className="auth-column" aria-label="Authentication">
              <header className="auth-column-header">
                <BrandMark compact />
                <span className="preview-label">{previewLabel}</span>
              </header>
              <div className="auth-content mx-auto w-full max-w-[430px]">{children}</div>
              <footer className="auth-footnote">
                <span>© {new Date().getFullYear()} iFranchise</span>
                <span>Organization-managed access</span>
              </footer>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
