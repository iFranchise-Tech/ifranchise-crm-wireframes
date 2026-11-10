export function BrandMark({ variant = "wordmark" }: { variant?: "wordmark" | "symbol" }) {
  return <span className={`brand-${variant}`}>
    {variant === "symbol"
      ? <img src="/brand/ifranchise-logo.png" width="56" height="54" alt="iFranchise" />
      : <img src="/brand/ifranchise-wordmark.svg" width="162" height="27" alt="iFranchise" />}
  </span>;
}
