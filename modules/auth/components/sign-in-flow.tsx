"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { PasswordField, TextField } from "@/modules/auth/components/fields";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";
import { useRouter } from "next/navigation";
import { validateWorkEmail } from "@/modules/auth/schemas/auth";

const DEMO_SIGN_IN_ENABLED = process.env.NODE_ENV !== "production";

export function SignInFlow({ initialStep = "email", initialEmail = "" }: { initialStep?: "email" | "password"; initialEmail?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "password">(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const enteredEmail = email.trim();
    if (!enteredEmail) { setErrors({ email: "Enter your work email." }); return; }
    if (!DEMO_SIGN_IN_ENABLED) {
      const error = validateWorkEmail(enteredEmail);
      if (error) { setErrors({ email: error }); return; }
    }
    setErrors({});
    setEmail(enteredEmail);
    setStep("password");
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) { setErrors({ password: "Enter your password." }); return; }
    setErrors({});
    setLoading(true);
    setMessage("");
    await new Promise(resolve => setTimeout(resolve, 350));
    setLoading(false);
    if (DEMO_SIGN_IN_ENABLED) {
      setPassword("");
      router.push("/demo/authenticated");
      return;
    }
    setMessage("Sign-in is unavailable because no identity provider is configured.");
  }

  return (
    <>
      <DemoBanner>
        {DEMO_SIGN_IN_ENABLED
          ? "Demo mode. Any non-empty email and password opens a local preview; credentials are not checked or saved."
          : "Sign-in is unavailable until an identity provider is connected."}
      </DemoBanner>
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
    </>
  );
}
