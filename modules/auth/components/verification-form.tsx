"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AuthLink, useAuthNavigation } from "./auth-navigation-context";
import { AuthCard } from "./auth-card";
import { PrimaryButton } from "./button";
import { OtpField } from "./otp-field";
import { VerificationMark } from "./verification-mark";
import { completeVerificationPreview } from "../services/preview-journey";

export function VerificationForm({ showInvalid = false }: { showInvalid?: boolean }) {
  const navigation = useAuthNavigation();
  const pending = useRef<AbortController | null>(null);
  const [code, setCode] = useState(showInvalid ? "123456" : "");
  const [error, setError] = useState(showInvalid ? "That code didn’t match. Use the current code in your authenticator app." : "");
  const [focusRequest, setFocusRequest] = useState(0);
  const [phase, setPhase] = useState<"ready" | "checking">("ready");
  useEffect(() => () => pending.current?.abort(), []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (!/^\d{6}$/.test(code)) { setError("Enter all six digits."); setFocusRequest(value => value + 1); return; }
    const controller = new AbortController(); pending.current = controller;
    setError(""); setPhase("checking");
    try {
      await completeVerificationPreview(controller.signal);
      if (controller.signal.aborted) return;
      // This fixed failure is limited to the explicit incorrect-code review fixture.
      if (showInvalid && code === "123456") { pending.current = null; setPhase("ready"); setError("That code didn’t match. Use the current code in your authenticator app."); setFocusRequest(value => value + 1); return; }
      navigation.push("/demo/authenticated");
    } catch { if (!controller.signal.aborted) { pending.current = null; setPhase("ready"); setError("We couldn’t finish checking. Please try again."); } }
  }
  return <div className="verification-scene" data-state={phase}>
    <VerificationMark state={phase} />
    <AuthCard title="Authenticator code" description="Open the authenticator app linked to your account and enter the current 6-digit code for iFranchise.">
        <form className="auth-form verification-form" onSubmit={submit} noValidate aria-busy={phase === "checking"}>
          <OtpField value={code} onChange={value => { setCode(value); setError(""); }} error={error} disabled={phase === "checking"} focusRequest={focusRequest} />
          <PrimaryButton type="submit" loading={phase === "checking"} loadingLabel="Verifying…">Verify code</PrimaryButton>
          <p className="verification-feedback" role="status">{phase === "checking" ? "Checking your code…" : ""}</p>
        </form>
        <AuthLink className="auth-back-link" href="/sign-in">Back to sign in</AuthLink>
      </AuthCard>
  </div>;
}
