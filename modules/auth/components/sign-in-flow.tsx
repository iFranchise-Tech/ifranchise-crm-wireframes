"use client";
import { AuthLink as Link } from "./auth-navigation-context";
import { useState, type FormEvent } from "react";
import { useAuthNavigation } from "./auth-navigation-context";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { PasswordField, TextField } from "@/modules/auth/components/fields";
import { StatusMessage } from "@/modules/auth/components/status-message";
import { Icon } from "@/modules/auth/components/icon";
import { SocialSignIn } from "@/modules/auth/components/social-sign-in";
import { validateIdentifier } from "@/modules/auth/schemas/auth";
import { completePreviewStep, localSignInPreviewEnabled } from "@/modules/auth/services/preview-journey";

export type SignInPreviewState = "email-validation" | "password-validation" | "password-visibility" | "loading";
export function SignInFlow({ initialStep = "email", initialEmail = "", previewState }: { initialStep?: "email" | "password"; initialEmail?: string; previewState?: SignInPreviewState }) {
  const router = useAuthNavigation();
  const [step, setStep] = useState<"email" | "password">(previewState && previewState !== "email-validation" ? "password" : initialStep);
  const [email, setEmail] = useState(previewState === "email-validation" ? "alex@company" : initialEmail || (previewState ? "alex@company.com" : ""));
  const [password, setPassword] = useState(previewState === "password-visibility" ? "A sample password" : previewState === "loading" ? "preview-only" : "");
  const [errors, setErrors] = useState<Record<string, string>>(previewState === "email-validation" ? { email: "Enter a valid email address, like you@company.com." } : previewState === "password-validation" ? { password: "Enter your password to continue." } : {});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isLoading = loading || previewState === "loading";
  function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entered = email.trim();
    const error = !entered ? "Enter your work email or employee ID." : !localSignInPreviewEnabled || previewState === "email-validation" ? validateIdentifier(entered) : undefined;
    if (error) { setErrors({ email: error }); return; }
    setErrors({}); setEmail(entered); setStep("password");
  }
  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    const emailError = !email.trim() ? "Enter your work email or employee ID." : !localSignInPreviewEnabled ? validateIdentifier(email.trim()) : undefined;
    const passwordError = !password ? "Enter your password to continue." : undefined;
    if (emailError || passwordError) { setErrors({ ...(emailError ? { email: emailError } : {}), ...(passwordError ? { password: passwordError } : {}) }); return; }
    setErrors({}); setLoading(true); setMessage("");
    await completePreviewStep();
    setPassword("");
    if (localSignInPreviewEnabled) { router.push("/demo/authenticated"); return; }
    setLoading(false);
    setMessage("The sign-in service isn’t connected yet. Please try again once your organization has enabled access.");
  }
  return <>

    {step === "email" ? <AuthCard title="Sign in" description="Use your work email or employee ID." headingAlign="center">
      <form className="auth-form" onSubmit={continueWithEmail} noValidate>
        <TextField label="Work email or employee ID" name="email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Email or employee ID" value={email} onChange={event => { setEmail(event.target.value); setErrors({}); }} error={errors.email} required />
        <PrimaryButton type="submit">Continue <Icon name="arrow" /></PrimaryButton>
      </form>
      <SocialSignIn />

    </AuthCard> : <AuthCard title={isLoading ? "Signing you in" : "Enter your password"} description={isLoading ? "Please wait while we sign you in." : "Sign in to your iFranchise account."} headingAlign="center">
      <form className="auth-form" onSubmit={submitPassword} noValidate aria-busy={isLoading}>
        <TextField label="Work email or employee ID" name="email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Email or employee ID" value={email} onChange={event => { setEmail(event.target.value); setErrors(current => ({ ...current, email: "" })); setMessage(""); }} error={errors.email} disabled={isLoading} required />
        <PasswordField label="Password" labelAction={<Link className="text-action" href="/forgot-password">Forgot password?</Link>} name="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => { setPassword(event.target.value); setErrors({}); setMessage(""); }} error={errors.password} initiallyVisible={previewState === "password-visibility"} autoFocus={initialStep === "email" && !previewState} disabled={isLoading} required />
        {message ? <StatusMessage tone="warning" title="Sign-in unavailable">{message}</StatusMessage> : null}
        <PrimaryButton type="submit" loading={isLoading} loadingLabel="Signing in…" loadingStyle="pulse">Sign in <Icon name="arrow" /></PrimaryButton>
      </form>
      <SocialSignIn disabled={isLoading} />
    </AuthCard>}
  </>;
}
