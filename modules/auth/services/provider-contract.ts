import type { AuthenticatedIdentity, AuthProviderCapabilities, AuthActionResult } from "@/modules/auth/types";
import type { SignInInput } from "@/modules/auth/schemas/auth";

export interface AuthProvider {
  capabilities(): Promise<AuthProviderCapabilities>;
  signIn(input: SignInInput): Promise<{ result: AuthActionResult; identity?: AuthenticatedIdentity }>;
  requestPasswordRecovery(email: string): Promise<AuthActionResult>;
  acceptInvitation(invitationToken: string): Promise<AuthActionResult>;
  verifySecondFactor(challengeId: string, code: string): Promise<AuthActionResult>;
  revokeSession(sessionId: string): Promise<AuthActionResult>;
}

export class AuthProviderNotConfiguredError extends Error {
  constructor() {
    super("No authentication provider is configured for this application.");
    this.name = "AuthProviderNotConfiguredError";
  }
}
