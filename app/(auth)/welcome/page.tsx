import Link from "next/link";
import Image from "next/image";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { Icon } from "@/modules/auth/components/icon";

export default function WelcomePage() {
  return <div className="welcome-screen">
    <figure className="franchise-art"><Image src="/illustrations/franchise-storefront.png" alt="A family of iFranchise storefronts" width={1280} height={1280} sizes="320px" preload /></figure>
    <AuthCard title="Welcome to iFranchise" description="Access your franchise workspace.">
    <PrimaryLink href="/sign-in">Sign in <Icon name="arrow" /></PrimaryLink>
    <Link className="button-secondary welcome-invitation" href="/invitation">Accept an invitation</Link>
    </AuthCard>
  </div>;
}
