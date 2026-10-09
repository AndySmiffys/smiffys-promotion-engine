import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { syncStorefrontSnapshot } from "../modules/promotions/services/storefrontSnapshot.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, shop } = await authenticate.webhook(request);
  if (admin) await syncStorefrontSnapshot(admin, shop);
  // Throw on sync failure so Shopify retries. Dates are also checked by Liquid,
  // since reaching a scheduled start/end need not emit an update webhook.
  return new Response(null, { status: 200 });
}
