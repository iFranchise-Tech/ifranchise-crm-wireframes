"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/modules/auth/components/icon";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  icon?: IconName;
};

export function TextField({ label, error, icon = "mail", id, className, ...inputProps }: TextFieldProps) {
  const inputId = id ?? inputProps.name;
  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <div className={`field-control${error ? " has-error" : ""}`}>
        <Icon name={icon} />
        <input id={inputId} className={className} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} {...inputProps} />
      </div>
      <p id={`${inputId}-error`} className="field-error" aria-live="polite">{error}</p>
    </div>
  );
}

export function PasswordField({ label, error, success, id, initiallyVisible = false, labelAction, ...inputProps }: TextFieldProps & { initiallyVisible?: boolean; labelAction?: ReactNode; success?: string }) {
  const [visible, setVisible] = useState(initiallyVisible);
  const inputId = id ?? inputProps.name;
  const isValid = Boolean(success) && !error;
  return (
    <div className="field">
      <div className="field-heading">
        <label className="field-label" htmlFor={inputId}>{label}</label>
        {labelAction}
      </div>
      <div className={`field-control${error ? " has-error" : ""}${isValid ? " is-valid" : ""}`}>
        <Icon name={isValid ? "check" : "lock"} className={isValid ? "field-valid-icon" : undefined} />
        <input id={inputId} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={error || success ? `${inputId}-feedback` : undefined} {...inputProps} />
        <button className="field-action" type="button" disabled={inputProps.disabled} onClick={() => setVisible(value => !value)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>
          <Icon name={visible ? "eyeOff" : "eye"} />
        </button>
      </div>
      <p id={`${inputId}-feedback`} className={`field-error${isValid ? " field-success" : ""}`} aria-live="polite">{error || success}</p>
    </div>
  );
}
