import { useEffect, useRef } from "react";

/** Keep save errors visible at the top of the page beneath Shopify's save bar. */
export function PromotionSaveError({ error }: { error?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!error) return;
    ref.current?.focus({ preventScroll: true });
    ref.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [error]);
  if (!error) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" aria-label="Promotion save error"
      style={{ position: "sticky", top: 0, zIndex: 25, background: "#ffffff", padding: "12px 0" }}>
      <s-banner tone="critical">{error}</s-banner>
    </div>
  );
}
