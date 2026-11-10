"use client";
import { AuthLink as Link } from "./auth-navigation-context";
import { useState, type FormEvent } from "react";
import { useAuthNavigation } from "./auth-navigation-context";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { NewPasswordFields } from "./new-password-fields";
import { Icon } from "@/modules/auth/components/icon";
import { validateNewPassword } from "@/modules/auth/schemas/auth";
import { completePreviewStep } from "@/modules/auth/services/preview-journey";

export function ResetPasswordForm({ showMismatch = false }: { showMismatch?: boolean }) {
  const router = useAuthNavigation();
  const [password, setPassword] = useState(showMismatch ? "Franchise8!" : "");
  const [confirmation, setConfirmation] = useState(showMismatch ? "Different8!" : "");
  const [errors, setErrors] = useState<Record<string, string>>(showMismatch ? { confirmation: "These passwords don’t match. Try again." } : {});
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    const result = validateNewPassword(password, confirmation);
    if (!result.success) { setErrors(result.errors); return; }
    setErrors({}); setLoading(true); await completePreviewStep(); setPassword(""); setConfirmation(""); router.push("/reset-password/success");
  }
  return <>
    <AuthCard title="Reset password" description="Create a new password for your account.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <NewPasswordFields password={password} confirmation={confirmation} errors={errors} disabled={loading}
          onPasswordChange={value => { setPassword(value); setErrors({}); }}
          onConfirmationChange={value => { setConfirmation(value); setErrors({}); }} />
        <PrimaryButton type="submit" loading={loading} loadingLabel="Updating…">Reset password <Icon name="arrow" /></PrimaryButton>
      </form><Link className="auth-back-link" href="/sign-in">← Back to sign in</Link>
    </AuthCard></>;
}
