"use client";
import { useState } from "react";
import { AuthCard } from "./auth-card";
import { PrimaryLink } from "./button";
import { Icon } from "./icon";
import { Dialog } from "@/components/ui/dialog";
import { accessStates } from "../config/access-states";
import { AuthLink } from "./auth-navigation-context";
export function AccessStateScreen({ state }: { state: string }) {
  const [open, setOpen] = useState(false);
  const view = accessStates[state];
  if (!view) return null;
  return <><div className="status-icon" data-tone={view.tone}><Icon name={view.icon} /></div>
    <AuthCard title={view.title} description={view.description}>
      <div className="status-actions">
        {view.help ? <button type="button" className="button-primary" onClick={() => setOpen(true)}>{view.action}</button> : <PrimaryLink href={view.href!}>{view.action}<Icon name="arrow" /></PrimaryLink>}
        {view.help ? <AuthLink className="auth-back-link" href="/sign-in">Use another account</AuthLink> : null}
      </div>
    </AuthCard>
    <Dialog open={open} onClose={() => setOpen(false)} title="Contact your administrator">
      <p>Contact the person who manages iFranchise access for your organization. Share your work email or employee ID and the message shown on this screen.</p>
      <p className="dialog-detail">Never share your password or verification code.</p>
      <button className="button-primary" onClick={() => setOpen(false)}>Got it</button>
    </Dialog>
  </>;
}
