"use client";

import { AuthLink as Link } from "./auth-navigation-context";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/modules/auth/components/icon";

type Information = "privacy" | "help";
const titles = { privacy: "Privacy & data", help: "Help with account access" };

export function AuthInformation() {
  const [topic, setTopic] = useState<Information>("privacy");
  const [open, setOpen] = useState(false);
  function show(next: Information) { setTopic(next); setOpen(true); }

  return <>
    <footer className="auth-footer">
      <span className="auth-copyright">© {new Date().getFullYear()} iFranchise Services Private Limited</span>
      <nav aria-label="Privacy and support"><button type="button" onClick={() => show("privacy")}>Privacy</button><span aria-hidden="true">·</span><button type="button" onClick={() => show("help")}>Help</button></nav>
    </footer>
    <Dialog open={open} onClose={() => setOpen(false)} title={titles[topic]}>
      {topic === "privacy" ? <>
        <p>This review environment does not send your email, password or verification code to an identity provider. It does not create an authenticated account or session.</p>
        <p>Use sample details while reviewing. For your organization’s privacy policy, contact your workspace administrator.</p>
      </> : <>
        <p>Choose the option that matches what you need.</p>
        <div className="auth-help-links"><Link href="/forgot-password" onClick={() => setOpen(false)}><Icon name="lockReset" /><span>Reset your password</span><Icon name="chevron" /></Link></div>
        <p className="dialog-detail">For account restrictions or organization access, contact your workspace administrator. Live sign-in and account services are not connected in this review environment.</p>
      </>}
    </Dialog>
  </>;
}
