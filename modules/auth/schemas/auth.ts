export type ValidationResult<T> = { success: true; value: T } | { success: false; errors: Record<string, string> };

export type SignInInput = { email: string; password: string };

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateWorkEmail(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (!email) return "Enter your work email.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return undefined;
}

export function validateSignIn(input: SignInInput): ValidationResult<SignInInput> {
  const errors: Record<string, string> = {};
  const emailError = validateWorkEmail(input.email);
  if (emailError) errors.email = emailError;
  if (!input.password) errors.password = "Enter your password.";
  return Object.keys(errors).length
    ? { success: false, errors }
    : { success: true, value: { email: normalizeEmail(input.email), password: input.password } };
}

export function validateNewPassword(password: string, confirmation: string): ValidationResult<{ password: string }> {
  const errors: Record<string, string> = {};
  if (!password) errors.password = "Enter a new password.";
  if (!confirmation) errors.confirmation = "Confirm your new password.";
  else if (password !== confirmation) errors.confirmation = "These passwords don’t match.";
  return Object.keys(errors).length ? { success: false, errors } : { success: true, value: { password } };
}
