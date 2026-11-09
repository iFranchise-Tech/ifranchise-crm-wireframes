import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sora = localFont({ src: "./fonts/sora-latin-variable.woff2", variable: "--font-sora", weight: "100 800", display: "swap" });
const manrope = localFont({ src: "./fonts/manrope-latin-variable.woff2", variable: "--font-manrope", weight: "200 800", display: "swap" });

export const metadata: Metadata = {
  title: "iFranchise CRM · Secure access",
  description: "Sign in to your iFranchise CRM workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
