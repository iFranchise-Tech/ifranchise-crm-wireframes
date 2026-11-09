"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { PasswordField, TextField } from "@/modules/auth/components/fields";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";
import { PreviewStateLinks } from "@/modules/auth/components/preview-state-links";
import { validateSignIn, validateWorkEmail } from "@/modules/auth/schemas/auth";

export function SignInFlow() {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateWorkEmail(email);
    if (error) { setErrors({ email: error }); return; }
    setErrors({});
    setStep("password");
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateSignIn({ email, password });
    if (!result.success) { setErrors(result.errors); return; }
    setErrors({});
    setLoading(true);
    setMessage("");
    await new Promise(resolve => setTimeout(resolve, 420));
    setLoading(false);
    setMessage("Sign-in is not connected. No credentials were sent to an identity provider or saved.");
  }

  return (
    <>
      <DemoBanner />
      {step === "email" ? (
        <AuthCard eyebrow="SECURE SIGN-IN" title="Welcome back." description="Sign in with the work email associated with your iFranchise account.">
          <form className="auth-form" onSubmit={continueWithEmail} noValidate>
            <TextField label="Work email" name="email" type="email" autoComplete="username" inputMode="email" placeholder="you@company.com" value={email} onChange={event => { setEmail(event.target.value); setErrors({}); }} error={errors.email} required />
            <PrimaryButton type="submit">Continue <span aria-hidden="true">→</span></PrimaryButton>
          </form>
          <div className="form-between" style={{ marginTop: 18 }}>
            <span className="form-note">New to iFranchise?</span>
            <Link className="text-action" href="/invitation">Accept an invitation</Link>
          </div>
        </AuthCard>
      ) : (
        <AuthCard eyebrow="SECURE SIGN-IN" title="Enter your password." description="Use the password associated with this work account.">
          <div className="form-between" style={{ margin: "-9px 0 22px" }}>
            <span className="form-note">{email}</span>
            <button className="text-action" type="button" onClick={() => { setStep("email"); setErrors({}); setMessage(""); }}>Change</button>
          </div>
          <form className="auth-form" onSubmit={submitPassword} noValidate>
            <PasswordField label="Password" name="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => { setPassword(event.target.value); setErrors({}); }} error={errors.password} required />
            {message ? <StatusMessage tone="warning" title="Identity service not connected">{message}</StatusMessage> : null}
            <div className="form-between" style={{ marginTop: -2 }}>
              <span />
              <Link className="text-action" href="/forgot-password">Forgot password?</Link>
            </div>
            <PrimaryButton type="submit" loading={loading}>Sign in</PrimaryButton>
          </form>
        </AuthCard>
      )}
      <PreviewStateLinks />
    </>
  );
}
