import type { VisibilityNotice } from "../design/storefrontVisibility";
export function PromotionVisibilityNotice({ notices }: { notices: VisibilityNotice[] }) {
  if (!notices.length) return null;
  return <div aria-live="polite"><s-banner tone={notices.some(notice => notice.tone === "warning") ? "warning" : "info"}>
    <strong>Storefront visibility</strong>
    <ul style={{ margin: "8px 0 0", paddingLeft: 18, display: "grid", gap: 8 }}>
      {notices.map(notice => <li key={notice.id}>{notice.message}</li>)}
    </ul>
  </s-banner></div>;
}
