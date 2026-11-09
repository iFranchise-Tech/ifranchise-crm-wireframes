export function BrandMark() {
  return <span className="brand-wordmark">
    {/* Original iFranchise wordmark. Explicit dimensions prevent layout shift. */}
    <img src="/brand/ifranchise-wordmark.svg" width="162" height="40" alt="iFranchise" />
  </span>;
}
