"use client";
import { AuthLink as Link } from "./auth-navigation-context";
import { useState, type FormEvent } from "react";
import { useAuthNavigation } from "./auth-navigation-context";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { TextField } from "@/modules/auth/components/fields";
import { Icon } from "@/modules/auth/components/icon";
import { validateIdentifier } from "@/modules/auth/schemas/auth";
import { completePreviewStep } from "@/modules/auth/services/preview-journey";

export function RecoveryForm() {
  const router = useAuthNavigation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    const problem = validateIdentifier(email);
    if (problem) { setError(problem); return; }
    setLoading(true); await completePreviewStep(); router.push("/forgot-password/check-email");
  }
  return <><div className="status-icon"><Icon name="lockReset" /></div>
    <AuthCard title="Forgot password?" description="We’ll send a reset link to your registered work email.">
      <form className="auth-form" onSubmit={submit} noValidate><TextField label="Work email / Employee ID" name="email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Email or employee ID" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} error={error} disabled={loading} required /><PrimaryButton type="submit" loading={loading} loadingLabel="Sending link…">Send reset link <Icon name="arrow" /></PrimaryButton></form>
      <Link className="auth-back-link" href="/sign-in">← Back to sign in</Link>
    </AuthCard></>;
}
