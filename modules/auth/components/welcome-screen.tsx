import { AuthCard } from "./auth-card";
import { PrimaryLink } from "./button";
import { Icon } from "./icon";

export function WelcomeScreen() {
  return <div className="welcome-screen"><AuthCard title="Welcome to iFranchise" description="Sign in to your workspace." headingAlign="center">
    <PrimaryLink href="/sign-in">Sign in <Icon name="arrow" /></PrimaryLink>
  </AuthCard></div>;
}
