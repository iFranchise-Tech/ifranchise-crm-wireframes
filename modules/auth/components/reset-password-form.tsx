"use client";

import { useState, type FormEvent } from "react";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { PasswordField } from "@/modules/auth/components/fields";
import { DemoBanner } from "@/modules/auth/components/status-message";
import { RecoverySuccessPreview } from "@/modules/auth/components/recovery-success-preview";
import { validateNewPassword } from "@/modules/auth/schemas/auth";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 14 ? 2 : 3;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const result = validateNewPassword(password, confirmation);
    if (!result.success) { setErrors(result.errors); return; }
    setErrors({});
    setComplete(true);
  }
  return <>
    <DemoBanner>Preview only. The reset token is not verified and no password will be changed.</DemoBanner>
    {complete ? (
      <RecoverySuccessPreview onReviewForm={() => { setComplete(false); setSubmitted(false); setPassword(""); setConfirmation(""); }} />
    ) : (
      <AuthCard eyebrow="ACCOUNT RECOVERY" title="Choose a new password." description="Create a long, unique password for your work account.">
        <form className="auth-form" onSubmit={submit} noValidate>
          <PasswordField label="New password" name="new-password" autoComplete="new-password" placeholder="Enter a unique password" value={password} onChange={event => { setPassword(event.target.value); setErrors({}); }} error={errors.password} required />
          <div className="password-meter" aria-live="polite"><span className="password-meter-track"><span className="password-meter-fill" style={{ width: `${strength * 33.333}%` }} /></span><span>{strength === 0 ? "Password strength" : strength === 1 ? "Add more characters" : strength === 2 ? "Good length" : "Long and unique"}</span></div>
          <PasswordField label="Confirm new password" name="confirm-password" autoComplete="new-password" placeholder="Enter it once more" value={confirmation} onChange={event => { setConfirmation(event.target.value); setErrors({}); }} error={errors.confirmation} required />
          {submitted && !errors.password && !errors.confirmation ? <p className="form-note">Strength guidance is illustrative; the connected service will enforce the approved policy.</p> : null}
          <PrimaryButton type="submit">Update password</PrimaryButton>
        </form>
      </AuthCard>
    )}
  </>;
}
