import type { MeetingPlatform } from "../types";

export function MeetingPlatformLogo({ platform, className = "" }: { platform: MeetingPlatform; className?: string }) {
  if (platform === "Google Meet") return <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
    <path fill="#FBBC04" d="M3 6.5A3.5 3.5 0 0 1 6.5 3h8A3.5 3.5 0 0 1 18 6.5v11a3.5 3.5 0 0 1-3.5 3.5h-8A3.5 3.5 0 0 1 3 17.5z" />
    <path fill="#F9AB00" d="m16 9 5.2-3.7c.8-.6 1.8 0 1.8 1v11.4c0 1-1 1.6-1.8 1L16 15z" />
    <path fill="#EA4335" d="m16 9 4.3-3.1v12.2L16 15z" opacity=".78" />
    <path fill="#FFF" d="M8.2 9.1h2.4a2.3 2.3 0 0 1 0 4.6H8.2z" opacity=".9" />
  </svg>;
  if (platform === "Zoom") return <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
    <rect x="1" y="4" width="22" height="16" rx="5" fill="#0b5cff" />
    <path d="M6 8.5h6.1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z" fill="#fff" />
    <path d="m14.3 10.5 4.2-2.8a1 1 0 0 1 1.5.8v7a1 1 0 0 1-1.5.8l-4.2-2.8z" fill="#fff" />
  </svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
    <path fill="#5059c9" d="M12.2 2h7.1a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-7.1z" />
    <path fill="#7b83eb" d="M2 5a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
    <circle cx="7.1" cy="8" r="1.8" fill="#fff" />
    <path fill="#fff" d="M3.8 16.2c0-2 1.4-3.4 3.3-3.4s3.4 1.4 3.4 3.4v.8H3.8z" />
    <path fill="#fff" d="M11.8 8.6h2.6v1.8h-2.6zm.7 2.7h1.2v5.6h-1.2z" />
  </svg>;
}

export function platformColor(platform: MeetingPlatform) {
  return platform === "Google Meet" ? "mf-platform-google" : platform === "Zoom" ? "mf-platform-zoom" : "mf-platform-teams";
}
