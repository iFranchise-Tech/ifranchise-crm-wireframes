"use client";
import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { StatusMessage } from "@/modules/auth/components/status-message";
import { Icon } from "@/modules/auth/components/icon";

export function CheckEmailScreen() {
  const [notice, setNotice] = useState(false);
  return <><div className="status-icon"><Icon name="mail" /></div><AuthCard title="Check your email" description="If an account matches that email, you’ll receive a link to reset your password.">
    <p className="form-note">Can’t find it? Check your spam folder.</p>
    <div className="status-actions"><PrimaryLink href="/sign-in">Back to sign in <Icon name="arrow" /></PrimaryLink><div className="form-between"><span className="form-note">No email yet?</span><button className="text-action" onClick={() => setNotice(true)}>Resend instructions</button></div>{notice ? <StatusMessage tone="warning">Email delivery isn’t connected in this preview. No message was sent.</StatusMessage> : null}</div>
    <Link className="auth-back-link" href="/forgot-password">← Try a different email</Link>
  </AuthCard></>;
}
