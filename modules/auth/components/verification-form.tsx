"use client";

import { useState, type FormEvent } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { OtpField } from "@/modules/auth/components/otp-field";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";
import { VerificationSuccessPreview } from "@/modules/auth/components/verification-success-preview";

export function VerificationForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== 6) { setError("Enter all six digits."); return; }
    setError("");
    setNotice("");
    setSubmitted(true);
  }
  return <>
    <DemoBanner>MFA preview only. No code was sent, and no verification service is connected.</DemoBanner>
    {submitted ? <VerificationSuccessPreview /> : (
      <AuthCard eyebrow="ADDITIONAL VERIFICATION" title="Verify it’s you." description="Enter the six-digit code from your organization’s authenticator.">
        <form className="auth-form" onSubmit={submit} noValidate>
          <OtpField onChange={value => { setCode(value); setError(""); setNotice(""); }} error={error} />
          {notice ? <StatusMessage tone="warning">{notice}</StatusMessage> : null}
          <div className="otp-help"><span>Authenticator code</span><span>Code timing is provider-managed</span></div>
          <PrimaryButton type="submit">Continue</PrimaryButton>
          <button className="text-action" type="button" onClick={() => { setCode(""); setError(""); setNotice("A resend action requires a configured verification provider. No code was sent."); }}>Resend code</button>
        </form>
      </AuthCard>
    )}
  </>;
}
