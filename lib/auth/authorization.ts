export type Capability = string;
export type AuthorizationResult = { allowed: true } | { allowed: false; reason: "no-session" | "capability-not-granted" };

/** Default-deny boundary. Resolve membership, role and record scope on the server when integrated. */
export async function authorizeCapability(
  _capability: Capability,
  hasVerifiedSession: boolean,
): Promise<AuthorizationResult> {
  if (!hasVerifiedSession) return { allowed: false, reason: "no-session" };
  return { allowed: false, reason: "capability-not-granted" };
}
