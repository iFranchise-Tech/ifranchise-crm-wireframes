import type { IconName } from "@/modules/auth/components/icon";

type AccessState = { title: string; description: string; note: string; tone: "info" | "error" | "warning"; icon: IconName; action: string; href: string };
export const accessStates = {
  "invalid-credentials": { title: "Unable to sign in", description: "The email or password is incorrect.", note: "Check your details and try again.", tone: "error", icon: "key", action: "Try again", href: "/sign-in" },
  locked: { title: "Account locked", description: "Sign-in is temporarily locked for this account.", note: "Contact your administrator to restore access.", tone: "warning", icon: "lock", action: "Back to sign in", href: "/sign-in" },
  "temporarily-suspended": { title: "Account suspended", description: "Your organization has temporarily suspended this account.", note: "Contact your administrator to review your access.", tone: "warning", icon: "clock", action: "Use a different account", href: "/sign-in" },
  deactivated: { title: "Account deactivated", description: "This account no longer has workspace access.", note: "Contact your administrator if you believe this is a mistake.", tone: "error", icon: "user", action: "Back to sign in", href: "/sign-in" },
  "access-restricted": { title: "Access restricted", description: "Your role doesn’t have permission to open this area.", note: "Ask your administrator to review your permissions.", tone: "info", icon: "shield", action: "Use a different account", href: "/sign-in" },
  "session-expired": { title: "Session expired", description: "Sign in again to continue.", note: "Your previous session is no longer active.", tone: "info", icon: "clock", action: "Sign in again", href: "/sign-in" },
  "service-unavailable": { title: "Sign-in unavailable", description: "The sign-in service is temporarily unavailable.", note: "Try again shortly. Contact your administrator if this continues.", tone: "warning", icon: "settings", action: "Try again", href: "/sign-in" },
  "connection-error": { title: "Connection interrupted", description: "We couldn’t complete your request.", note: "Check your internet connection and try again.", tone: "warning", icon: "wifi", action: "Retry sign in", href: "/sign-in" },
  "reset-link-expired": { title: "Reset link expired", description: "This password reset link is no longer valid.", note: "Request a new link to reset your password.", tone: "warning", icon: "key", action: "Request a new link", href: "/forgot-password" },
  "invitation-expired": { title: "Invitation unavailable", description: "This invitation has expired or been withdrawn.", note: "Ask your administrator for a new invitation.", tone: "warning", icon: "mail", action: "Back to invitations", href: "/invitation" },
  "verification-expired": { title: "Verification expired", description: "This verification challenge has ended.", note: "Sign in again to start a new verification.", tone: "warning", icon: "shield", action: "Restart sign in", href: "/sign-in" },
} as const satisfies Record<string, AccessState>;
