"use client";

import { useEffect } from "react";
import { useAuthNavigation } from "./auth-navigation-context";
import { VerificationMark } from "./verification-mark";

export function AuthenticatedScreen() {
  const navigation = useAuthNavigation();
  useEffect(() => {
    navigation.prefetch("/demo/workspace");
    // Give the success mark time to finish before the demonstration handoff.
    const timer = window.setTimeout(() => navigation.push("/demo/workspace"), 1600);
    return () => window.clearTimeout(timer);
  }, [navigation]);

  return <div className="authentication-success" role="status">
    <VerificationMark state="complete" />
    <h1 className="auth-title" tabIndex={-1}>Welcome back</h1>
    <p className="auth-description">Opening your workspace…</p>
    <span className="workspace-handoff-progress" aria-hidden="true" />
  </div>;
}
