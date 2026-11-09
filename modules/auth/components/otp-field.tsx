"use client";

import { useRef, useState } from "react";

export function OtpField({ onChange, error }: { onChange: (value: string) => void; error?: string }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const values = [...digits];
    values[index] = digit;
    setDigits(values);
    onChange(values.join(""));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };
  return (
    <div>
      <div className="otp-row" role="group" aria-label="Six-digit verification code">
        {Array.from({ length: 6 }, (_, index) => (
          <input
            key={index}
            ref={node => { refs.current[index] = node; }}
            className="otp-cell"
            aria-label={`Digit ${index + 1}`}
            aria-invalid={Boolean(error)}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            inputMode="numeric"
            maxLength={1}
            value={digits[index]}
            onChange={event => setDigit(index, event.target.value)}
            onKeyDown={event => {
              if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
              if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
              if (event.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
            }}
            onPaste={event => {
              const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
              if (!pasted) return;
              event.preventDefault();
              const values = Array(6).fill("");
              pasted.split("").forEach((digit, digitIndex) => { values[digitIndex] = digit; });
              setDigits(values);
              onChange(pasted);
              refs.current[Math.min(pasted.length, 5)]?.focus();
            }}
          />
        ))}
      </div>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </div>
  );
}
