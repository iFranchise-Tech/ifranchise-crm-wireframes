"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/modules/auth/components/icon";
import { localSignInPreviewEnabled } from "@/modules/auth/services/preview-journey";

type Information = "privacy" | "help" | "environment";
const titles = { privacy: "Privacy & data", help: "Help with account access", environment: "About this preview" };

export function AuthInformation({ variant = "footer" }: { variant?: "footer" | "badge" }) {
  const [topic, setTopic] = useState<Information>("environment");
  const [open, setOpen] = useState(false);
  function show(next: Information) { setTopic(next); setOpen(true); }

  return <>
    {variant === "badge" ? <button type="button" className="auth-environment" aria-label="About this preview" onClick={() => show("environment")}><span />Preview</button> : <footer className="auth-footer">
      <span>© {new Date().getFullYear()} iFranchise</span>
      <nav aria-label="Privacy and support"><button type="button" onClick={() => show("privacy")}>Privacy</button><span aria-hidden="true">·</span><button type="button" onClick={() => show("help")}>Help</button></nav>
    </footer>}
    <Dialog open={open} onClose={() => setOpen(false)} title={titles[topic]}>
      {topic === "privacy" ? <>
        <p>This review environment does not send your email, password or verification code to an identity provider. It does not create an authenticated account or session.</p>
        <p>Use sample details while reviewing. For your organization’s privacy policy, contact your workspace administrator.</p>
      </> : topic === "help" ? <>
        <p>Choose the option that matches what you need.</p>
        <div className="auth-help-links"><Link href="/forgot-password" onClick={() => setOpen(false)}><Icon name="key" /><span>Reset your password</span><Icon name="chevron" /></Link><Link href="/invitation" onClick={() => setOpen(false)}><Icon name="users" /><span>Accept an invitation</span><Icon name="chevron" /></Link></div>
        <p className="dialog-detail">For account restrictions or organization access, contact your workspace administrator. Recovery and invitations are preview journeys until services are connected.</p>
      </> : <>
        <p>You’re viewing the iFranchise authentication experience. Live sign-in, social providers and account services are not connected.</p>
        <p>{localSignInPreviewEnabled ? "Use any non-empty email and password to explore the local sign-in journey. " : "Sign-in is unavailable in this environment. "}Preview success screens do not grant access or create a session.</p>
      </>}
    </Dialog>
  </>;
}
