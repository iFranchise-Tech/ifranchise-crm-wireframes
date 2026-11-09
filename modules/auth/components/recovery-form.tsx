"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton } from "@/modules/auth/components/button";
import { TextField } from "@/modules/auth/components/fields";
import { DemoBanner } from "@/modules/auth/components/status-message";
import { validateWorkEmail } from "@/modules/auth/schemas/auth";

export function RecoveryForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateWorkEmail(email);
    if (problem) { setError(problem); return; }
    router.push("/forgot-password/check-email");
  }
  return <>
    <DemoBanner />
    <AuthCard eyebrow="ACCOUNT RECOVERY" title="Reset your password." description="Enter your work email. If the address matches an account, recovery instructions will be available when email delivery is connected.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <TextField label="Work email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} error={error} required />
        <PrimaryButton type="submit">Continue</PrimaryButton>
      </form>
    </AuthCard>
  </>;
}
