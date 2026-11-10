import { passwordRequirements } from "../schemas/auth";
import { Icon } from "./icon";
export function PasswordRequirements({ password }: { password: string }) {
  const rules = passwordRequirements(password);
  return <ul className="password-requirements" aria-label="Password requirements">
    {rules.map(rule => <li key={rule.id} data-met={rule.met}><span className="requirement-check" aria-hidden="true"><Icon name="check" /></span><span>{rule.label}</span><span className="sr-only">{rule.met ? ": met" : ": not met"}</span></li>)}
  </ul>;
}
