import { materialIconPaths } from "./material-icon-paths";

export type IconName = keyof typeof materialIconPaths;

/** Locally bundled Google Material Symbols; no icon font or external requests. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" focusable="false">
    {materialIconPaths[name].map((path, index) => <path key={index} d={path} />)}
  </svg>;
}
