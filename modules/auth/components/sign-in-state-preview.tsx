import Link from "next/link";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton, PrimaryLink } from "@/modules/auth/components/button";
import { PasswordField, TextField } from "@/modules/auth/components/fields";
import { DemoBanner } from "@/modules/auth/components/status-message";

type SignInState = "email-validation" | "password-validation" | "password-visibility" | "loading";

const descriptions: Record<SignInState, { eyebrow: string; title: string; description: string }> = {
  "email-validation": {
    eyebrow: "SECURE SIGN-IN · VALIDATION",
    title: "Check your work email.",
    description: "Email validation is shown inline, next to the field that needs attention.",
  },
  "password-validation": {
    eyebrow: "SECURE SIGN-IN · VALIDATION",
    title: "Enter your password.",
    description: "Password validation keeps the entered email in context and explains the next step.",
  },
  "password-visibility": {
    eyebrow: "SECURE SIGN-IN · PASSWORD VISIBILITY",
    title: "Review the password control.",
    description: "The reveal control can show or mask the entered value and stays keyboard accessible.",
  },
  loading: {
    eyebrow: "SECURE SIGN-IN · LOADING",
    title: "Signing you in…",
    description: "The primary action shows a clear busy state while a sign-in request is in progress.",
  },
};

export function SignInStatePreview({ state }: { state: SignInState }) {
  const copy = descriptions[state];

  return <>
    <DemoBanner>This is a direct preview of a sign-in state. The identity service is not called.</DemoBanner>
    <AuthCard eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
      {state === "email-validation" ? (
        <div className="auth-form">
          <TextField label="Work email" name="preview-email" type="email" autoComplete="off" placeholder="you@company.com" value="not-an-email" readOnly error="Enter a valid work email address." />
          <PrimaryLink href="/sign-in">Try the sign-in form</PrimaryLink>
        </div>
      ) : null}
      {state === "password-validation" ? (
        <div className="auth-form">
          <div className="form-between"><span className="form-note">preview.user@ifranchise.test</span><Link className="text-action" href="/sign-in">Change</Link></div>
          <PasswordField label="Password" name="preview-password" autoComplete="off" placeholder="Enter your password" value="" readOnly error="Enter your password." />
          <PrimaryLink href="/sign-in">Try the sign-in form</PrimaryLink>
        </div>
      ) : null}
      {state === "password-visibility" ? (
        <div className="auth-form">
          <PasswordField label="Password" name="preview-visible-password" autoComplete="off" value="preview-only" readOnly initiallyVisible />
          <p className="form-note">This sample value is only for visual review and is not a credential.</p>
          <PrimaryLink href="/sign-in/password">Open password entry</PrimaryLink>
        </div>
      ) : null}
      {state === "loading" ? (
        <div className="auth-form">
          <PrimaryButton type="button" loading>Sign in</PrimaryButton>
          <p className="form-note">This preview does not start a request or create a session.</p>
        </div>
      ) : null}
    </AuthCard>
  </>;
}
