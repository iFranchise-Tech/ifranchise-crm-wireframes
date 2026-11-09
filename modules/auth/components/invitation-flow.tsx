"use client";

import { useState, type FormEvent } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton, PrimaryLink } from "@/modules/auth/components/button";
import { PasswordField, TextField } from "@/modules/auth/components/fields";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";
import { validateWorkEmail } from "@/modules/auth/schemas/auth";

export function InvitationFlow() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateWorkEmail(email);
    if (problem) { setError(problem); return; }
    setError("");
    setReviewed(true);
  }
  return <>
    <DemoBanner />
    {!reviewed ? <>
      <AuthCard eyebrow="TEAM INVITATION" title="Accept your invitation." description="Confirm the work email that received your iFranchise invitation.">
        <form className="auth-form" onSubmit={submit} noValidate>
          <TextField label="Work email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} error={error} required />
          <PrimaryButton type="submit">Review invitation</PrimaryButton>
        </form>
        <p className="form-note" style={{ marginTop: 16 }}>An administrator assigns account status, role and access permissions.</p>
      </AuthCard>
    </> : <>
      <AuthCard eyebrow="INVITATION · PREVIEW" title="Invitation review is ready." description={`The invitation for ${email} would be verified by your organization before account setup.`}>
        <StatusMessage tone="warning" title="Invitation service not connected">No invitation was looked up or accepted. Continue only to review the first-time setup design.</StatusMessage>
        <div style={{ marginTop: 19 }}><PrimaryLink href="/invitation/setup">View account setup preview</PrimaryLink></div>
      </AuthCard>
    </>}
  </>;
}

export function InvitationSetupForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter your name.";
    if (!password) next.password = "Enter a password.";
    if (password !== confirmation) next.confirmation = "These passwords don’t match.";
    if (Object.keys(next).length) { setErrors(next); return; }
    setErrors({});
    setSubmitted(true);
  }
  return <>
    <DemoBanner>Setup preview only. Invitation status, password storage and account activation are not connected.</DemoBanner>
    <AuthCard eyebrow="FIRST-TIME SETUP · PREVIEW" title={submitted ? "Account setup preview complete." : "Set up your account."} description={submitted ? "This screen showed the activation step; it did not create or activate an account." : "Complete your details after an administrator has verified your invitation."}>
      {submitted ? <StatusMessage tone="warning" title="No account was activated">Connect invitation verification and credential services before using this step in production.</StatusMessage> : (
        <form className="auth-form" onSubmit={submit} noValidate>
          <TextField label="Your name" name="name" autoComplete="name" placeholder="Full name" value={name} onChange={event => { setName(event.target.value); setErrors({}); }} error={errors.name} required />
          <PasswordField label="Create password" name="new-password" autoComplete="new-password" placeholder="Enter a unique password" value={password} onChange={event => { setPassword(event.target.value); setErrors({}); }} error={errors.password} required />
          <PasswordField label="Confirm password" name="confirm-password" autoComplete="new-password" placeholder="Enter it once more" value={confirmation} onChange={event => { setConfirmation(event.target.value); setErrors({}); }} error={errors.confirmation} required />
          <PrimaryButton type="submit">Review activation</PrimaryButton>
        </form>
      )}
    </AuthCard>
  </>;
}
