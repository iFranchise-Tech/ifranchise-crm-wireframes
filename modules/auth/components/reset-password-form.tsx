"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { PasswordField } from "@/modules/auth/components/fields";
import { DemoBanner } from "@/modules/auth/components/status-message";
import { Icon } from "@/modules/auth/components/icon";
import { validateNewPassword } from "@/modules/auth/schemas/auth";
import { completePreviewStep } from "@/modules/auth/services/preview-journey";

export function ResetPasswordForm({ showMismatch = false }: { showMismatch?: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState(showMismatch ? "sample-password" : "");
  const [confirmation, setConfirmation] = useState(showMismatch ? "different-password" : "");
  const [errors, setErrors] = useState<Record<string, string>>(showMismatch ? { confirmation: "These passwords don’t match. Try again." } : {});
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    const result = validateNewPassword(password, confirmation);
    if (!result.success) { setErrors(result.errors); return; }
    setErrors({}); setLoading(true); await completePreviewStep(); setPassword(""); setConfirmation(""); router.push("/reset-password/success");
  }
  return <><DemoBanner>Reset preview · No link is verified and no password is changed.</DemoBanner>
    <AuthCard eyebrow="A FRESH START" title="Create a new password." description="Choose a long, unique password that you don’t use for another account.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <PasswordField label="New password" name="new-password" autoComplete="new-password" placeholder="Create your new password" value={password} onChange={event => { setPassword(event.target.value); setErrors({}); }} error={errors.password} disabled={loading} required />
        <PasswordField label="Confirm new password" name="confirm-password" autoComplete="new-password" placeholder="Re-enter your new password" value={confirmation} onChange={event => { setConfirmation(event.target.value); setErrors({}); }} error={errors.confirmation} disabled={loading} required />
        <PrimaryButton type="submit" loading={loading} loadingLabel="Updating…">Reset password <Icon name="arrow" /></PrimaryButton>
      </form><Link className="auth-back-link" href="/sign-in">← Back to sign in</Link>
    </AuthCard></>;
}
