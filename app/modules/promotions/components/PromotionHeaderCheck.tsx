import { useFetcher } from "react-router";
import { useEmbeddedAppUrl } from "../../navigation/embeddedAppUrl";
import type { SelectionCheck } from "../services/storefrontSelection.server";
type Result = { selected: { title: string; priority: number } | null; checks: SelectionCheck[]; connection: string | null; error: string | null };
export function PromotionHeaderCheck() {
  const fetcher = useFetcher<Result>();
  const appUrl = useEmbeddedAppUrl();
  const busy = fetcher.state !== "idle";
  const result = fetcher.data;
  return <div style={{ display: "grid", gap: 8 }}>
    <s-button type="button" variant="secondary" disabled={busy || undefined} onClick={() => fetcher.submit({}, { method: "post", action: appUrl("/app/promotion-diagnostics") })}>{busy ? "Checking header…" : "Check header selection"}</s-button>
    <small style={{ color: "#616161", lineHeight: 1.5 }}>Checks saved promotions for a visitor who is not logged in. Save any changes first.</small>
    {result && !busy && <div aria-live="polite" style={{ display: "grid", gap: 8 }}>
      {result.error ? <s-banner tone="critical">{result.error}</s-banner> : <>
        <p style={{ margin: 0 }}><strong>{result.selected ? `Selected header: ${result.selected.title} (priority ${result.selected.priority})` : "No eligible header promotion."}</strong></p>
        <p style={{ margin: 0, fontSize: 13 }}>{result.connection}</p>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr><th style={{ textAlign: "left", padding: 8 }}>Promotion</th><th style={{ textAlign: "left", padding: 8 }}>Priority</th><th style={{ textAlign: "left", padding: 8 }}>Result</th></tr></thead>
          <tbody>{result.checks.map(check => <tr key={check.id}><td style={{ padding: 8, borderTop: "1px solid #dedede" }}>{check.title}</td><td style={{ padding: 8, borderTop: "1px solid #dedede" }}>{check.priority}</td><td style={{ padding: 8, borderTop: "1px solid #dedede" }}>{check.reason}</td></tr>)}</tbody>
        </table></div>
      </>}
    </div>}
  </div>;
}
