"use client";
import { AuthLink as Link } from "./auth-navigation-context";
import { useAuthNavigation } from "./auth-navigation-context";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton, PrimaryLink } from "@/modules/auth/components/button";
import { TextField } from "@/modules/auth/components/fields";
import { NewPasswordFields } from "./new-password-fields";
import { Icon } from "@/modules/auth/components/icon";
import { validateNewPassword } from "@/modules/auth/schemas/auth";
import { completePreviewStep } from "@/modules/auth/services/preview-journey";

export function InvitationReview() {
  return <><div className="status-icon"><Icon name="mail" /></div>
    <AuthCard title="Review invitation" description="Confirm your workspace before setting up your account.">
      <div className="invite-details"><div className="invite-avatar"><Icon name="building" /></div><div><strong>iFranchise CRM</strong><span>Organization workspace</span><small>Access is assigned by your administrator.</small></div></div>
      <div className="status-actions"><PrimaryLink href="/invitation/setup">Accept & set up account <Icon name="arrow" /></PrimaryLink></div><Link className="auth-back-link" href="/sign-in">Back to sign in</Link>
    </AuthCard></>;
}

export function InvitationSetupForm() {
  const router = useAuthNavigation();
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
    setErrors({}); setLoading(true); await completePreviewStep(); setPassword(""); setConfirmation(""); router.push("/demo/workspace");
  }
  return <>
    <AuthCard title="Set up your account" description="Add your name and create a password.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <TextField label="Full name" name="name" icon="user" autoComplete="name" placeholder="Your full name" value={name} onChange={event => { setName(event.target.value); setErrors({}); }} error={errors.name} disabled={loading} required />
        <NewPasswordFields password={password} confirmation={confirmation} errors={errors} disabled={loading}
          passwordLabel="Create password" confirmationLabel="Confirm password"
          onPasswordChange={value => { setPassword(value); setErrors({}); }}
          onConfirmationChange={value => { setConfirmation(value); setErrors({}); }} />
        <PrimaryButton type="submit" loading={loading} loadingLabel="Completing setup…">Open workspace <Icon name="arrow" /></PrimaryButton>
      </form><Link className="auth-back-link" href="/invitation/review">← Back to invitation</Link>
    </AuthCard></>;
}
