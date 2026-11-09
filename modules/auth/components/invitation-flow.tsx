"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton, PrimaryLink } from "@/modules/auth/components/button";
import { PasswordField, TextField } from "@/modules/auth/components/fields";
import { Icon } from "@/modules/auth/components/icon";
import { validateWorkEmail, validateNewPassword } from "@/modules/auth/schemas/auth";
import { completePreviewStep } from "@/modules/auth/services/preview-journey";

export function InvitationFlow() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    const problem = validateWorkEmail(email);
    if (problem) { setError(problem); return; }
    setError(""); setLoading(true); await completePreviewStep(); router.push("/invitation/review");
  }
  return <><div className="status-icon"><Icon name="users" /></div>
    <AuthCard title="Accept your invitation" description="Enter the email address that received your invitation.">
      <form className="auth-form" onSubmit={submit} noValidate><TextField label="Invited work email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} error={error} disabled={loading} required /><PrimaryButton type="submit" loading={loading} loadingLabel="Opening invitation…">Review invitation <Icon name="arrow" /></PrimaryButton></form>
      <Link className="auth-back-link" href="/sign-in">Already part of the team? Sign in</Link>
    </AuthCard></>;
}

export function InvitationReview() {
  return <><div className="status-icon"><Icon name="mail" /></div>
    <AuthCard title="Review invitation" description="Confirm your workspace before setting up your account.">
      <div className="invite-details"><div className="invite-avatar"><Icon name="building" /></div><div><strong>iFranchise CRM</strong><span>Organization workspace</span><small>Access is assigned by your administrator.</small></div></div>
      <div className="status-actions"><PrimaryLink href="/invitation/setup">Accept & set up account <Icon name="arrow" /></PrimaryLink></div><Link className="auth-back-link" href="/invitation">← Use a different email</Link>
    </AuthCard></>;
}

export function InvitationSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    const result = validateNewPassword(password, confirmation);
    const next: Record<string, string> = result.success ? {} : result.errors;
    if (!name.trim()) next.name = "Enter your full name.";
    if (Object.keys(next).length) { setErrors(next); return; }
    setErrors({}); setLoading(true); await completePreviewStep(); setPassword(""); setConfirmation(""); router.push("/invitation/success");
  }
  return <>
    <AuthCard title="Set up your account" description="Add your name and create a password.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <TextField label="Full name" name="name" icon="user" autoComplete="name" placeholder="Your full name" value={name} onChange={event => { setName(event.target.value); setErrors({}); }} error={errors.name} disabled={loading} required />
        <PasswordField label="Create password" name="new-password" autoComplete="new-password" placeholder="Choose a unique password" value={password} onChange={event => { setPassword(event.target.value); setErrors({}); }} error={errors.password} disabled={loading} required />
        <PasswordField label="Confirm password" name="confirm-password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmation} onChange={event => { setConfirmation(event.target.value); setErrors({}); }} error={errors.confirmation} disabled={loading} required />
        <PrimaryButton type="submit" loading={loading} loadingLabel="Completing setup…">Complete account setup <Icon name="arrow" /></PrimaryButton>
      </form><Link className="auth-back-link" href="/invitation/review">← Back to invitation</Link>
    </AuthCard></>;
}
