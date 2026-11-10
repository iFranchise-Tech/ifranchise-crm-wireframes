"use client";
import { AuthLink as Link } from "./auth-navigation-context";
import { useState } from "react";
import { AuthCard } from "./auth-card";
import { Icon } from "./icon";

export function CheckEmailScreen() {
  const [notice, setNotice] = useState(false);
  return <><div className="status-icon"><Icon name="mail" /></div>
    <AuthCard title="Check your email" description="If your details match an account, you’ll receive a link to reset your password.">
      <div className="recovery-email-actions">
        <button className="text-action" type="button" onClick={() => setNotice(true)}>Resend reset link</button>
        <Link className="auth-back-link" href="/sign-in">Back to sign in</Link>
      </div>
      <p className="recovery-feedback" role="status">{notice ? "Email delivery isn’t connected in this review. No email was sent." : ""}</p>
    </AuthCard></>;
}
