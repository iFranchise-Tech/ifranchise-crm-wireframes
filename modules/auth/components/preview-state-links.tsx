import Link from "next/link";

const states = [
  ["Invalid details", "/status/invalid-credentials"],
  ["Account on hold", "/status/locked"],
  ["Temporarily suspended", "/status/temporarily-suspended"],
  ["Deactivated", "/status/deactivated"],
  ["Access restricted", "/status/access-restricted"],
  ["Session expired", "/status/session-expired"],
] as const;

export function PreviewStateLinks() {
  return (
    <>
      <div className="preview-divider" />
      <details className="preview-state-disclosure">
        <summary>Review other authentication states <span aria-hidden="true">＋</span></summary>
        <nav className="preview-state-links" aria-label="Authentication state previews">
          {states.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/demo/authenticated">Success screen</Link>
        </nav>
      </details>
    </>
  );
}
