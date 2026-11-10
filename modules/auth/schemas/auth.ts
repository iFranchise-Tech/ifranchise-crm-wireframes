export type ValidationResult<T> = { success: true; value: T } | { success: false; errors: Record<string, string> };
export type SignInInput = { email: string; password: string };
export function normalizeEmail(value: string): string { return value.trim().toLowerCase(); }
export function validateWorkEmail(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (!email) return "Enter your work email.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
}
/** Identifiers are resolved by the future identity provider, never by the UI. */
export function validateIdentifier(value: string): string | undefined {
  const identifier = value.trim();
  if (!identifier) return "Enter your work email or employee ID.";
  if (identifier.includes("@")) return validateWorkEmail(identifier);
  if (identifier.length > 64 || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(identifier)) return "Check your employee ID or enter your work email.";
}
export function validateSignIn(input: SignInInput): ValidationResult<SignInInput> {
  const errors: Record<string, string> = {};
  const emailError = validateIdentifier(input.email);
  if (emailError) errors.email = emailError;
  if (!input.password) errors.password = "Enter your password.";
  return Object.keys(errors).length ? { success: false, errors } : { success: true, value: { email: input.email.trim(), password: input.password } };
}
export function passwordRequirements(password: string) {
  return [
    { id: "uppercase", label: "Uppercase letters", met: /[A-Z]/.test(password) },
    { id: "lowercase", label: "Lowercase letters", met: /[a-z]/.test(password) },
    { id: "number", label: "A number", met: /[0-9]/.test(password) },
    { id: "symbol", label: "A special character", met: /[^A-Za-z0-9\s]/.test(password) },
    { id: "length", label: "8–15 characters", met: password.length >= 8 && password.length <= 15 },
  ];
}
/** A local composition estimate, not a breach check or security guarantee. */
export function passwordStrength(password: string) {
  if (!password) return { score: 0, label: "Password strength" };
  const met = passwordRequirements(password).filter(rule => rule.met).length;
  const repeated = /(.)\1{3}/.test(password);
  const score = password.length < 8 || repeated ? 1 : met < 5 ? 2 : password.length < 12 ? 3 : 4;
  return { score, label: ["", "Weak", "Fair", "Good", "Strong"][score] };
}
export function validateNewPassword(password: string, confirmation: string): ValidationResult<{ password: string }> {
  const errors: Record<string, string> = {};
  if (!password) errors.password = "Create your password.";
  else if (!passwordRequirements(password).every(rule => rule.met)) errors.password = "Meet all five password requirements.";
  if (!confirmation) errors.confirmation = "Confirm your password.";
  else if (password !== confirmation) errors.confirmation = "Passwords don’t match yet.";
  return Object.keys(errors).length ? { success: false, errors } : { success: true, value: { password } };
}
