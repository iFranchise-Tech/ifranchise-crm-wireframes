import type { IconName } from "@/modules/auth/components/icon";

export type AuthScreen = { id: string; title: string; href: string; description: string; kind: "screen" | "state" };
export type ScreenGroup = { id: string; title: string; icon: IconName; description: string; screens: AuthScreen[] };

export const authScreenGroups: ScreenGroup[] = [
  { id: "entry", title: "Welcome & sign in", icon: "key", description: "A considered first impression. A focused way back in.", screens: [
    { id: "welcome", title: "Welcome", href: "/welcome", description: "The front door to the iFranchise workspace.", kind: "screen" },
    { id: "sign-in", title: "Work email", href: "/sign-in", description: "Start with your work email.", kind: "screen" },
    { id: "password", title: "Password", href: "/sign-in/password", description: "Enter a password with the account in context.", kind: "screen" },
    { id: "email-validation", title: "Email validation", href: "/sign-in/email-validation", description: "Clear, inline guidance for an invalid email.", kind: "state" },
    { id: "password-validation", title: "Password validation", href: "/sign-in/password-validation", description: "An empty password with field-level feedback.", kind: "state" },
    { id: "password-visibility", title: "Password visibility", href: "/sign-in/password-visibility", description: "Accessible show and hide password controls.", kind: "state" },
    { id: "loading", title: "Signing in", href: "/sign-in/loading", description: "A stable busy state that prevents repeat submissions.", kind: "state" },
    { id: "invalid-credentials", title: "Invalid credentials", href: "/status/invalid-credentials", description: "A generic response that does not reveal account details.", kind: "state" },
  ] },
  { id: "recovery", title: "Password recovery", icon: "mail", description: "A reassuring path from a forgotten password to a fresh start.", screens: [
    { id: "forgot-password", title: "Forgot password", href: "/forgot-password", description: "Request recovery instructions using a work email.", kind: "screen" },
    { id: "check-email", title: "Check your email", href: "/forgot-password/check-email", description: "A neutral recovery confirmation and next steps.", kind: "screen" },
    { id: "reset-password", title: "New password", href: "/reset-password", description: "Choose and confirm a new password.", kind: "screen" },
    { id: "reset-validation", title: "Passwords don’t match", href: "/reset-password/validation", description: "Keep input in place while correcting the confirmation.", kind: "state" },
    { id: "reset-success", title: "Password reset success", href: "/reset-password/success", description: "The completed recovery state, ready for sign-in.", kind: "state" },
    { id: "reset-link-expired", title: "Reset link expired", href: "/status/reset-link-expired", description: "Recover gracefully when a link is no longer usable.", kind: "state" },
  ] },
  { id: "invitation", title: "Invitation & setup", icon: "users", description: "An intentional welcome for every new team member.", screens: [
    { id: "invitation", title: "Accept invitation", href: "/invitation", description: "Confirm the email associated with a team invitation.", kind: "screen" },
    { id: "invitation-review", title: "Invitation review", href: "/invitation/review", description: "Review the invitation before setting up an account.", kind: "screen" },
    { id: "account-setup", title: "First-time setup", href: "/invitation/setup", description: "Add a name and create account credentials.", kind: "screen" },
    { id: "setup-success", title: "Setup complete", href: "/invitation/success", description: "A clear end to the first-time setup journey.", kind: "state" },
    { id: "invitation-expired", title: "Invitation unavailable", href: "/status/invitation-expired", description: "Help when an invitation has expired or was revoked.", kind: "state" },
  ] },
  { id: "verification", title: "Verification", icon: "shield", description: "An additional identity check, when enabled by the organization.", screens: [
    { id: "verify", title: "Verification code", href: "/verify", description: "A six-digit code with paste, autofill and keyboard support.", kind: "screen" },
    { id: "invalid-code", title: "Incorrect code", href: "/verify/invalid", description: "Inline feedback with a simple retry path.", kind: "state" },
    { id: "expired-code", title: "Expired challenge", href: "/status/verification-expired", description: "Restart verification when the challenge has ended.", kind: "state" },
    { id: "verify-success", title: "Verification success", href: "/verify/success", description: "Confirmation after the additional verification step.", kind: "state" },
  ] },
  { id: "access", title: "Account & access", icon: "lock", description: "Distinct outcomes, with a useful next step for each one.", screens: [
    { id: "authenticated", title: "Authentication success", href: "/demo/authenticated", description: "The final state of the authentication preview.", kind: "state" },
    { id: "locked", title: "Account locked", href: "/status/locked", description: "Sign-in is locked pending the configured recovery process.", kind: "state" },
    { id: "suspended", title: "Temporarily suspended", href: "/status/temporarily-suspended", description: "Access has been paused by the organization.", kind: "state" },
    { id: "deactivated", title: "Account deactivated", href: "/status/deactivated", description: "The account is inactive; business history is retained.", kind: "state" },
    { id: "restricted", title: "Access restricted", href: "/status/access-restricted", description: "The current role does not allow access to this area.", kind: "state" },
  ] },
  { id: "session", title: "Session & service", icon: "clock", description: "Calm, actionable responses when something interrupts the journey.", screens: [
    { id: "session-expired", title: "Session expired", href: "/status/session-expired", description: "Sign in again after a session ends.", kind: "state" },
    { id: "service-unavailable", title: "Service unavailable", href: "/status/service-unavailable", description: "The authentication service is temporarily unreachable.", kind: "state" },
    { id: "connection-error", title: "Connection error", href: "/status/connection-error", description: "A recoverable network interruption.", kind: "state" },
  ] },
];
export const authScreens = authScreenGroups.flatMap(group => group.screens);
export function getAuthScreen(id: string) { return authScreens.find(screen => screen.id === id); }
export function getScreenGroup(id: string) { return authScreenGroups.find(group => group.screens.some(screen => screen.id === id)); }
export function reviewHref(id: string, mode: "desktop" | "mobile" = "desktop") { return `/library/authentication/${id}${mode === "mobile" ? "?mode=mobile" : ""}`; }
