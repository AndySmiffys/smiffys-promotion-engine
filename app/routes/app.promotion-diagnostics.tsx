import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getLatestPromotionSettings } from "../modules/promotions/services/promotionSettings.server";
import { checkStorefrontConnection, selectStorefrontPromotion, storefrontRevision } from "../modules/promotions/services/storefrontSelection.server";
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  try {
    const rows = await getLatestPromotionSettings(session.shop);
    const { selected, checks } = await selectStorefrontPromotion(admin, rows, { placement: "header", productId: null, collectionId: null, variantId: null, productCollectionIds: [], customerId: null, memberSegmentIds: [], now: Date.now() }, true);
    const connection = await checkStorefrontConnection(session.shop, storefrontRevision(session.shop, rows), selected?.id ?? null);
    return Response.json({ selected: selected ? { title: selected.title, priority: selected.settings.priority } : null, checks, connection, error: null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ selected: null, checks: [], connection: null, error: error instanceof Error ? error.message : "The header could not be checked." }, { headers: { "Cache-Control": "private, no-store" } });
  }
}
