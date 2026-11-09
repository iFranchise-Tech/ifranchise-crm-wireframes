"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "./auth-card";
import { PrimaryButton } from "./button";
import { OtpField } from "./otp-field";
import { VerificationMark } from "./verification-mark";
import { completeVerificationPreview } from "@/modules/auth/services/preview-journey";

export function VerificationForm({ showInvalid = false }: { showInvalid?: boolean }) {
  const router = useRouter();
  const pending = useRef<AbortController | null>(null);
  const [code, setCode] = useState(showInvalid ? "123456" : "");
  const [error, setError] = useState(showInvalid ? "That code didn’t match. Try again." : "");
  const [focusRequest, setFocusRequest] = useState(0);
  const [notice, setNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => { router.prefetch("/verify/success"); }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter all six digits.");
      setFocusRequest(value => value + 1);
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setError(""); setNotice(false); setLoading(true);
    try {
      await completeVerificationPreview(controller.signal);
      if (!controller.signal.aborted) router.push("/verify/success");
    } catch {
      if (!controller.signal.aborted) {
        pending.current = null; setLoading(false);
        setError("Couldn’t complete the preview. Try again.");
      }
    }
  }

  return <div className="verification-scene" data-state={loading ? "checking" : "ready"}>
    <VerificationMark state={loading ? "checking" : "ready"} />
    <AuthCard title="Verify your identity" description="Enter the six-digit code from your authenticator.">
      <form className="auth-form verification-form" onSubmit={submit} noValidate aria-busy={loading}>
        <OtpField value={code} onChange={value => { setCode(value); setError(""); setNotice(false); }} error={error} disabled={loading} focusRequest={focusRequest} />
        <PrimaryButton type="submit" loading={loading} loadingLabel="Verifying…">Verify code</PrimaryButton>
        <p className="verification-feedback" role="status">{loading ? "Checking your code…" : "Preview: use any six digits."}</p>
        <button className="text-action center-note" type="button" disabled={loading} onClick={() => setNotice(value => !value)} aria-expanded={notice}>Need help with your code?</button>
        {notice ? <p className="form-note center-note" role="status">Contact your administrator to restore access to your authenticator.</p> : null}
      </form>
      <Link className="auth-back-link" href="/sign-in">← Back to sign in</Link>
    </AuthCard>
  </div>;
}
