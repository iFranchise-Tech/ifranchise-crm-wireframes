import { ResultScreen } from "@/modules/auth/components/result-screen";
export function VerificationSuccessPreview() {
  return <ResultScreen eyebrow="VERIFICATION COMPLETE" title="All checked. All set." description="Your additional verification step is complete. Continue to the next step." note="Success state preview · No code was verified or session created." action="Continue" href="/demo/authenticated" icon="shield" />;
}
