"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { OtpField } from "@/modules/auth/components/otp-field";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";
import { Icon } from "@/modules/auth/components/icon";
import { completePreviewStep } from "@/modules/auth/services/preview-journey";

export function VerificationForm({ showInvalid = false }: { showInvalid?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState(showInvalid ? "123456" : "");
  const [error, setError] = useState(showInvalid ? "That code wasn’t recognized. Check your current code and try again." : "");
  const [notice, setNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    if (!/^\d{6}$/.test(code)) { setError("Enter all six digits to continue."); return; }
    setError(""); setNotice(false); setLoading(true); await completePreviewStep(); setCode(""); router.push("/verify/success");
  }
  return <><DemoBanner>MFA preview · Any six digits continue the preview. No code is verified.</DemoBanner><div className="status-icon"><Icon name="shield" /></div>
    <AuthCard eyebrow="ONE MORE CHECK" title="A little extra reassurance." description="Enter the six-digit code from your authenticator to verify it’s you.">
      <form className="auth-form" onSubmit={submit} noValidate aria-busy={loading}>
        <OtpField value={code} onChange={value => { setCode(value); setError(""); setNotice(false); }} error={error} disabled={loading} />
        <p className="otp-help">Open your authenticator and use the current code for your work account.</p>
        <PrimaryButton type="submit" loading={loading} loadingLabel="Checking code…">Verify & continue <Icon name="arrow" /></PrimaryButton>
        <button className="text-action center-note" type="button" onClick={() => setNotice(true)}>Can’t access your authenticator?</button>
        {notice ? <StatusMessage title="Contact your administrator">Your organization can help restore your verification method. No recovery request is sent from this preview.</StatusMessage> : null}
      </form><Link className="auth-back-link" href="/sign-in">← Back to sign in</Link>
    </AuthCard></>;
}
