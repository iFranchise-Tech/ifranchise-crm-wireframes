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
    <AuthCard title="Review invitation" description="Your team has invited you to iFranchise.">
      <div className="invitation-summary"><div className="invitation-person"><span className="invite-avatar"><Icon name="user" /></span><div><strong>iFranchise Employee</strong><span>Invited by your administrator</span></div></div><dl><div><dt>Workspace</dt><dd>iFranchise CRM</dd></div><div><dt>Account</dt><dd>Employee</dd></div></dl></div>
      <div className="status-actions"><PrimaryLink href="/invitation/setup">Accept invitation <Icon name="arrow" /></PrimaryLink></div><Link className="auth-back-link" href="/sign-in">Back to sign in</Link>
    </AuthCard></>;
}

export function InvitationSetupForm() {
  const router = useAuthNavigation();
  const name = "iFranchise Employee";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    const result = validateNewPassword(password, confirmation);
    const next: Record<string, string> = result.success ? {} : result.errors;
    if (Object.keys(next).length) { setErrors(next); return; }
    setErrors({}); setLoading(true); await completePreviewStep(); setPassword(""); setConfirmation(""); router.push("/demo/workspace");
  }
  return <>
    <AuthCard title="Set up your account" description="Create a password to get started.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <TextField label="Full name" name="name" icon="user" autoComplete="name" value={name} readOnly aria-readonly="true" />
        <NewPasswordFields password={password} confirmation={confirmation} errors={errors} disabled={loading}
          passwordLabel="Create password" confirmationLabel="Confirm password"
          onPasswordChange={value => { setPassword(value); setErrors({}); }}
          onConfirmationChange={value => { setConfirmation(value); setErrors({}); }} />
        <PrimaryButton type="submit" loading={loading} loadingLabel="Completing setup…">Complete setup <Icon name="arrow" /></PrimaryButton>
      </form><Link className="auth-back-link" href="/invitation/review">← Back to invitation</Link>
    </AuthCard></>;
}
