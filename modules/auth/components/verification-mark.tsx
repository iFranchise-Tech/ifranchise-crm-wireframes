import { Icon } from "./icon";

export function VerificationMark({ state }: { state: "ready" | "checking" | "complete" }) {
  return <div className="verification-mark" data-state={state} aria-hidden="true">
    <svg className="verification-ring" viewBox="0 0 72 72"><circle cx="36" cy="36" r="33" /></svg>
    {state === "complete" ? <svg className="verification-check" viewBox="0 0 32 32"><path d="m8 16 5.5 5.5L24 11" pathLength="1" /></svg> : <Icon name="shield" />}
  </div>;
}
