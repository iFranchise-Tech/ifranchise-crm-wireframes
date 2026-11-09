export type AuthActionStatus = "success" | "invalid" | "not-configured" | "temporarily-unavailable";

export type AuthActionResult = {
  status: AuthActionStatus;
  message?: string;
};

export type AuthProviderCapabilities = {
  signIn: boolean;
  passwordRecovery: boolean;
  invitations: boolean;
  multiFactor: boolean;
  sessions: boolean;
};

export type AuthenticatedIdentity = {
  userId: string;
  email: string;
  role: string;
};
