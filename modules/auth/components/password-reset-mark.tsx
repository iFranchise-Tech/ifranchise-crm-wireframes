export function PasswordResetMark() {
  return <div className="status-icon password-reset-mark" data-tone="success" aria-hidden="true">
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path className="reset-lock-shackle" d="M16 29V16a8 8 0 0 1 16 0v7" />
      <rect x="11" y="23" width="26" height="20" rx="4" fill="var(--success-tint)" />
      <circle cx="24" cy="31" r="2" fill="currentColor" stroke="none" />
      <path d="M24 33v3" />
    </svg>
  </div>;
}
