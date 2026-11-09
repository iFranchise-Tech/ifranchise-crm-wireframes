"use client";
import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";
import { Icon } from "@/modules/auth/components/icon";

export function CheckEmailScreen() {
  const [notice, setNotice] = useState(false);
  return <><DemoBanner>Recovery preview · Email delivery is not connected. Nothing was sent.</DemoBanner><div className="status-icon"><Icon name="mail" /></div><AuthCard eyebrow="YOUR NEXT STEP" title="Check your inbox." description="If an account matches that email, you’ll receive a link to reset your password.">
    <StatusMessage title="A little help finding it">Check your spam or junk folder, and make sure you used the email associated with your work account.</StatusMessage>
    <div className="status-actions"><PrimaryLink href="/sign-in">Back to sign in <Icon name="arrow" /></PrimaryLink><div className="form-between"><span className="form-note">No email yet?</span><button className="text-action" onClick={() => setNotice(true)}>Resend instructions</button></div>{notice ? <StatusMessage tone="warning">Email delivery isn’t connected in this preview. No message was sent.</StatusMessage> : null}</div>
    <Link className="auth-back-link" href="/forgot-password">← Try a different email</Link>
  </AuthCard></>;
}
