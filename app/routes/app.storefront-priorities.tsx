import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator, Link } from "react-router";
import { authenticate } from "../shopify.server";
import { getLatestPromotionSettings } from "../modules/promotions/services/promotionSettings.server";
import { getDiscount } from "../modules/promotions/services/discount.server";
import { mapDiscountToPromotion } from "../modules/promotions/mappers/promotionMapper";
import { buildPriorityOverview } from "../modules/promotions/design/priorityOverview";
import type { PromotionRecord } from "../modules/promotions/models/promotion";
import { useEmbeddedAppUrl } from "../modules/navigation/embeddedAppUrl";
import { PromotionHeaderCheck } from "../modules/promotions/components/PromotionHeaderCheck";
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const settings = await getLatestPromotionSettings(session.shop);
  const promotions: PromotionRecord[] = [];
  const errors: string[] = [];
  for (const stored of settings) {
    try {
      const node = await getDiscount(admin, stored.shopifyDiscountId, 250);
      if (!node) { errors.push(`Discount ${stored.shopifyDiscountId.split("/").pop()} no longer exists in Shopify.`); continue; }
      const promotion = mapDiscountToPromotion(node);
      promotion.settings = { ...promotion.settings, ...stored, lastSyncedAt: null };
      promotions.push(promotion);
    } catch (error) { errors.push(`Could not load discount ${stored.shopifyDiscountId.split("/").pop()}: ${error instanceof Error ? error.message : "Please refresh."}`); }
  }
  return { sections: buildPriorityOverview(promotions, Date.now()), errors };
}
const cell = { padding: "12px 10px", textAlign: "left" as const, verticalAlign: "top", borderBottom: "1px solid #ebebeb" };
export default function StorefrontPriorities() {
  const { sections, errors } = useLoaderData<typeof loader>();
  const refresh = useRevalidator();
  const appUrl = useEmbeddedAppUrl();
  return <s-page heading="Storefront priorities">
    <div style={{ display: "grid", gap: 20, padding: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
        <p style={{ margin: 0, maxWidth: 760 }}>Review saved promotions for each storefront block, ordered by highest priority first. The first promotion eligible for the visitor and page appears. Equal priorities favour the most recently added promotion. A promotion uses the same priority across its selected blocks.</p>
        <s-button type="button" variant="secondary" disabled={refresh.state !== "idle" || undefined} onClick={() => refresh.revalidate()}>{refresh.state === "idle" ? "Refresh lists" : "Refreshing…"}</s-button>
      </div>
      <small style={{ color: "#616161" }}>Only promotions with a block selected are listed below. Draft and customer-restricted promotions remain visible here so you can review them. Change a promotion’s priority from its edit page.</small>
      {errors.length > 0 && <s-banner tone="warning"><ul style={{ margin: 0, paddingLeft: 18 }}>{errors.map(error => <li key={error}>{error}</li>)}</ul></s-banner>}
      {sections.map(section => <section key={section.id} aria-label={`${section.title} priorities`} style={{ border: "1px solid #dedede", borderRadius: 12, background: "#fff", padding: 20, display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>{section.title}</h2>
        {!section.rows.length ? <p style={{ margin: 0, color: "#616161" }}>No promotions have this block selected.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr><th scope="col" style={cell}>Priority</th><th scope="col" style={cell}>Promotion</th><th scope="col" style={cell}>Audience</th><th scope="col" style={cell}>Visibility</th></tr></thead>
          <tbody>{section.rows.map(row => <tr key={row.id}>
            <td style={cell}>{row.priority}</td>
            <td style={cell}><Link to={appUrl(`/app/promotions/${row.routeId}`)}>{row.title}</Link></td>
            <td style={cell}>{row.audience}</td>
            <td style={cell}><div style={{ display: "grid", gap: 6 }}><s-badge tone={row.status === "Available" ? "success" : row.status === "Customer restricted" ? "warning" : "neutral"}>{row.status}</s-badge><span>{row.detail}</span></div></td>
          </tr>)}</tbody>
        </table></div>}
      </section>)}
      <section aria-label="Header connection check" style={{ border: "1px solid #dedede", borderRadius: 12, background: "#fff", padding: 20 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Header connection check</h2>
        <PromotionHeaderCheck showList={false} />
      </section>
    </div>
  </s-page>;
}
