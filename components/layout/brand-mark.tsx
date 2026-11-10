export function BrandMark() {
  return <span className="brand-wordmark">
    {/* Tagline-free wordmark. Explicit dimensions prevent layout shift. */}
    <img src="/brand/ifranchise-wordmark.svg" width="162" height="27" alt="iFranchise" />
  </span>;
}
