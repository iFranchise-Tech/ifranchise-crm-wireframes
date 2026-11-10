"use client";

import { useState } from "react";
import { passwordRequirements, passwordStrength } from "../schemas/auth";
import { PasswordField } from "./fields";
import { PasswordRequirements } from "./password-requirements";

type Props = {
  password: string;
  confirmation: string;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  passwordLabel?: string;
  confirmationLabel?: string;
};

/** The checklist and confirmation share a reserved space so the form stays still. */
export function NewPasswordFields({ password, confirmation, onPasswordChange, onConfirmationChange, errors, disabled, passwordLabel = "New password", confirmationLabel = "Confirm new password" }: Props) {
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const ready = passwordRequirements(password).every(rule => rule.met);
  const strength = passwordStrength(password);
  const matches = ready && confirmation === password;
  const mismatch = confirmation.length > 0 && !matches && (confirmationTouched || confirmation.length >= password.length);
  const confirmationError = matches ? undefined : errors.confirmation || (mismatch ? "Passwords don’t match yet." : undefined);

  return <>
    <PasswordField label={passwordLabel} name="new-password" autoComplete="new-password" minLength={8} maxLength={15}
      placeholder={passwordLabel} value={password} onChange={event => onPasswordChange(event.target.value)}
      onCopy={event => event.preventDefault()} onCut={event => event.preventDefault()} onDragStart={event => event.preventDefault()}
      error={errors.password} success={ready ? "All requirements met" : undefined} disabled={disabled} required />
    <div className="password-strength" data-score={strength.score}>
      <div className="password-strength-heading"><span>Strength</span><span aria-live="polite">{password ? strength.label : "—"}</span></div>
      <div className="password-strength-meter" role="meter" aria-label="Estimated password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={strength.score} aria-valuetext={strength.label}>
        {[1, 2, 3, 4].map(segment => <span key={segment} data-filled={segment <= strength.score} />)}
      </div>
    </div>
    <div className="password-next-stage" data-ready={ready}>
      <div className="password-stage password-rules-stage" aria-hidden={ready} inert={ready}>
        <PasswordRequirements password={password} />
      </div>
      <div className="password-stage password-confirm-stage" aria-hidden={!ready} inert={!ready}>
        <PasswordField label={confirmationLabel} name="confirm-password" autoComplete="new-password" minLength={8} maxLength={15}
          placeholder="Confirm password" value={confirmation} onChange={event => onConfirmationChange(event.target.value)}
          onBlur={() => setConfirmationTouched(true)} error={confirmationError} success={matches ? "Passwords match" : undefined}
          disabled={disabled || !ready} required />
      </div>
    </div>
  </>;
}
