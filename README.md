# iFranchise CRM Authentication

The first standalone authentication module for iFranchise CRM. This repository contains a responsive Next.js App Router application with TypeScript and Tailwind CSS. The interface is complete as a reviewable experience; the identity provider, email delivery, database, session store, MFA, and authorization services are intentionally not connected.

## Run locally

Use Node.js 24 or later.

```sh
npm install
npm run dev
```

Open <http://127.0.0.1:4173>. `npm run typecheck` checks the TypeScript source and `npm run build` creates a production build.

## Screens

- Welcome and sign in, including email and password validation, visibility control, and a loading response.
- Forgot password, check your email, reset password, and reset-form completion preview.
- Invitation acceptance and first-time account setup preview.
- MFA / OTP entry with six-digit keyboard, paste, and focus behavior.
- Invalid credentials, account locked, temporarily suspended, deactivated, access restricted, and session expired states.
- A separate authentication-success design preview at `/demo/authenticated`.

Account state previews are available under `/status/<state>`, such as `/status/temporarily-suspended`. They are visual states only and do not inspect or change an account.

## Structure

```text
app/                    App Router routes and layouts
components/layout/      Shared authentication shell and brand panel
modules/auth/actions/   Server action boundary
modules/auth/components Reusable auth UI
modules/auth/schemas/   Central email and form validation
modules/auth/services/  Auth provider contract and capability status
modules/auth/types/     Auth result, capability, and identity types
lib/auth/               Default-deny session and authorization boundaries
```

## Authentication boundary

The sign-in form validates input locally for this preview. Submitting a password does not send credentials to an identity provider, persist them, create a session, or grant access. Recovery and invitation flows do not send email or activate accounts. The OTP screen does not send or verify a code. The success page is isolated under `/demo` and explicitly does not represent a verified session.

The session reader currently returns no session, and the authorization boundary denies by default. Keep authentication and access checks on the server when adding the approved identity provider, database, APIs, Cloudflare services, notifications, and audit events. Never use a client-rendered role or route as an authorization decision.

The product requirements specify role, team, record, department, brand, field, and action-level access, default denial, account lifecycle states, session expiry/revocation, failed-attempt monitoring, and MFA where implemented. They do not define a password composition rule, MFA enrollment or recovery method, OTP lifetime, password recovery token design, or lockout threshold. This implementation avoids presenting those unknowns as production policy; the password meter is guidance only.
