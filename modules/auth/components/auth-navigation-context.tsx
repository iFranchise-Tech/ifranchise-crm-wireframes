"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, type ComponentProps } from "react";

type AuthNavigation = { push: (href: string) => void; prefetch: (href: string) => void };
/** Review navigation changes visual screens only; it never authorizes access. */
export const AuthNavigationContext = createContext<AuthNavigation | null>(null);
export function useAuthNavigation() {
  const router = useRouter();
  const navigation = useContext(AuthNavigationContext);
  return navigation ?? router;
}
export function AuthLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const navigation = useContext(AuthNavigationContext);
  return <Link {...props} href={href} prefetch={navigation ? false : props.prefetch} onClick={event => {
    onClick?.(event);
    if (!navigation || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank" || typeof href !== "string") return;
    event.preventDefault(); navigation.push(href);
  }} />;
}
