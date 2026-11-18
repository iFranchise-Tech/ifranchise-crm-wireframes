import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import "./globals.css";
import "./auth-responsive.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "iFranchise CRM · Secure access",
  description: "Sign in to your iFranchise CRM workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body>{children}</body>
    </html>
  );
}
