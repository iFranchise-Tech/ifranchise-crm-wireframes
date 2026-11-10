"use client";
import { useEffect, useId, useRef, type CSSProperties } from "react";

/** Controlled digits keep retry, paste, autofill and visual state in sync. */
export function OtpField({ value, onChange, error, disabled, focusRequest = 0 }: { value: string; onChange: (value: string) => void; error?: string; disabled?: boolean; focusRequest?: number }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const errorId = useId();
  const digits = Array.from({ length: 6 }, (_, index) => value[index] === " " ? "" : value[index] ?? "");
  useEffect(() => {
    if (focusRequest) (refs.current.find(input => input && !input.value) ?? refs.current[0])?.focus();
  }, [focusRequest]);
  function setDigits(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    const next = [...digits];
    if (clean.length > 1) {
      clean.slice(0, 6 - index).split("").forEach((digit, offset) => { next[index + offset] = digit; });
    } else next[index] = clean;
    onChange(next.map(digit => digit || " ").join("").trimEnd());
    if (clean) refs.current[Math.min(index + clean.length, 5)]?.focus();
  }
  return <div className="otp-field" data-invalid={Boolean(error)}><div className="otp-row" role="group" aria-label="Six-digit iFranchise code from your authenticator app" aria-describedby={error ? errorId : undefined}>
    {digits.map((digit, index) => <input key={index} ref={node => { refs.current[index] = node; }} className="otp-cell" data-filled={Boolean(digit)} style={{ "--digit-index": index } as CSSProperties} aria-label={`Digit ${index + 1}`} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} autoComplete={index === 0 ? "one-time-code" : "off"} inputMode="numeric" pattern="[0-9]*" value={digit} disabled={disabled} onFocus={event => event.target.select()} onChange={event => setDigits(index, event.target.value)} onKeyDown={event => {
      if (event.key === "Backspace" && !digit && index > 0) { event.preventDefault(); setDigits(index - 1, ""); refs.current[index - 1]?.focus(); }
      if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); refs.current[index - 1]?.focus(); }
      if (event.key === "ArrowRight" && index < 5) { event.preventDefault(); refs.current[index + 1]?.focus(); }
    }} onPaste={event => { const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (!pasted) return; event.preventDefault(); onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); }} />)}
  </div><p id={errorId} className="field-error otp-error" role="alert">{error || "\u00a0"}</p></div>;
}
