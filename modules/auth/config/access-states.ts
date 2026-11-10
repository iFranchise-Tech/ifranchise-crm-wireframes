import type { IconName } from "@/modules/auth/components/icon";
export type AccessState = { title: string; description: string; tone: "info" | "error" | "warning"; icon: IconName; action: string; href?: string; help?: boolean };
export const accessStates: Record<string, AccessState> = {
  "invalid-credentials": { title: "Check your sign-in details", description: "Your email, employee ID or password didn’t match. Please try again.", tone: "error", icon: "alert", action: "Try again", href: "/sign-in/password" },
  locked: { title: "Account locked", description: "Sign-in is locked after unsuccessful attempts. Your administrator can help restore access.", tone: "warning", icon: "lock", action: "Get account help", help: true },
  "temporarily-suspended": { title: "Access temporarily paused", description: "Your organization has paused access to this account. Contact your administrator to find out more.", tone: "warning", icon: "pauseCircle", action: "Get account help", help: true },
  deactivated: { title: "Account deactivated", description: "This account is no longer active. Your administrator can review whether access can be restored.", tone: "error", icon: "personOff", action: "Get account help", help: true },
  "access-restricted": { title: "You don’t have access", description: "Your current role can’t open this area. Ask your administrator for the access you need.", tone: "info", icon: "block", action: "Get account help", help: true },
  "session-expired": { title: "Please sign in again", description: "Your session has ended. Sign in to return to your workspace.", tone: "info", icon: "clock", action: "Sign in", href: "/sign-in" },
  "service-unavailable": { title: "We can’t sign you in right now", description: "Sign-in is temporarily unavailable. Please try again in a moment.", tone: "warning", icon: "cloudOff", action: "Try signing in again", href: "/sign-in" },
  "connection-error": { title: "Unable to connect", description: "Check your internet connection, then try signing in again.", tone: "warning", icon: "wifi", action: "Try again", href: "/sign-in" },
  "reset-link-expired": { title: "This reset link has expired", description: "Your password hasn’t changed. You can get a fresh link below.", tone: "warning", icon: "linkOff", action: "Get a new reset link", href: "/forgot-password" },
  "invitation-expired": { title: "Invitation no longer available", description: "This invitation has expired or been withdrawn. Ask your administrator to send a new one.", tone: "warning", icon: "mail", action: "Get account help", help: true },
  "verification-expired": { title: "Verification session expired", description: "Sign in again, then use the current iFranchise code from your authenticator app.", tone: "warning", icon: "timerOff", action: "Sign in again", href: "/sign-in" },
};
