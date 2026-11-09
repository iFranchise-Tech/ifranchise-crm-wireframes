export type VerifiedSession = {
  subject: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
  sessionId: string;
};

/** Fail closed until a server-side session provider is deliberately configured. */
export async function getVerifiedSession(): Promise<VerifiedSession | null> {
  return null;
}
