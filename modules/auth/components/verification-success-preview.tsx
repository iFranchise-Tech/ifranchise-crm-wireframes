"use client";
import { useEffect, useRef } from "react";
import { PrimaryLink } from "./button";
import { VerificationMark } from "./verification-mark";

export function VerificationSuccessPreview() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return <div className="verification-scene verification-complete" data-state="complete">
    <VerificationMark state="complete" />
    <h1 className="auth-title" ref={heading} tabIndex={-1}>Verification complete</h1>
    <p className="auth-description">Continue to finish signing in.</p>
    <PrimaryLink href="/demo/authenticated">Continue</PrimaryLink>
  </div>;
}
