# iFranchise CRM — Authentication experience

A high fidelity, interactive authentication UI prototype built as a new standalone repository. It has no runtime dependencies and does not connect to an identity provider, email service, CRM API, or database.

## Run locally

Requires Node.js 20 or newer.

```sh
npm run dev
```

Open <http://127.0.0.1:4173>. Individual states can be opened directly with URL hashes, for example `/#mfa`, `/#reset`, and `/#deactivated`.

## Screen inventory

The persistent directory contains 33 distinct authentication states plus Overview:

- **Welcome and login:** Welcome, work email, password, signing in, incorrect details.
- **Email and password:** Email entry, password entry, loading state.
- **Password recovery:** Forgot password, instructions sent, recovery link issue.
- **Password reset:** Choose a new password, password updated.
- **First-time account setup:** Invitation received, accept invitation, invitation expired, invitation unavailable, account setup, account activated.
- **MFA / OTP verification:** Verification code, incorrect code, expired code, verification limit.
- **Authentication success:** Access verification, role-based entry, successful sign-in.
- **Authentication errors:** Network issue, service error, authentication unavailable.
- **Account restrictions:** Account on hold, account deactivated, role not assigned, device approval needed, access denied.
- **Session management:** Session expired, session ending.

Desktop and mobile preview modes are available for every screen. On narrow viewports, the directory becomes an accessible slide-in drawer.

## PRD alignment

The 195-page product requirements document defines secure login, credential validation, approved password policies, MFA where implemented, server-side authorization, session expiry and revocation, failed-login monitoring, account suspension, and the account states Pending Activation, Active, Temporarily Suspended, and Deactivated. It also requires role, team, record, department, brand, field, and action-level authorization, with default denial and immediate access revocation on deactivation.

The PRD does not define an authentication vendor, password composition rules, MFA enrollment or backup factors, OTP lifetime or resend limits, recovery token lifecycle, lockout threshold or duration, “remember me,” or a specific invitation delivery protocol. The preview labels these flows as simulated and does not introduce those values as production policy.

## Interactions

- Work email and password validation, password reveal, and password strength feedback.
- Sign-in → access verification → role-aware entry → success (all simulated).
- Recovery request and reset with matching-password confirmation (simulated).
- Invitation acceptance and initial password setup (simulated).
- Six-digit OTP entry, automatic focus movement, and a 30-second demo resend cooldown.
- Direct state navigation, expandable directory groups, preview size switch, and state restart.

No passwords, recovery tokens, verification codes, invitations, or session credentials are sent or stored. A real authentication service, email delivery, server-side session controls, audit events, device registration, and production authorization checks remain to be integrated and reviewed.
