"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { TextField } from "@/modules/auth/components/fields";
import { Icon } from "@/modules/auth/components/icon";
import { validateWorkEmail } from "@/modules/auth/schemas/auth";
import { completePreviewStep } from "@/modules/auth/services/preview-journey";

export function RecoveryForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    const problem = validateWorkEmail(email);
    if (problem) { setError(problem); return; }
    setLoading(true); await completePreviewStep(); router.push("/forgot-password/check-email");
  }
  return <><div className="status-icon"><Icon name="key" /></div>
    <AuthCard title="Forgot password?" description="Enter your work email for reset instructions.">
      <form className="auth-form" onSubmit={submit} noValidate><TextField label="Work email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} error={error} disabled={loading} required /><PrimaryButton type="submit" loading={loading} loadingLabel="Preparing recovery…">Send reset instructions <Icon name="arrow" /></PrimaryButton></form>
      <Link className="auth-back-link" href="/sign-in">← Back to sign in</Link>
    </AuthCard></>;
}
