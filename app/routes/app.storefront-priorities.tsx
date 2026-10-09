import { syncStorefrontSnapshot } from "../modules/promotions/services/storefrontSnapshot.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import { authenticate } from "../shopify.server";
import { loadPromotionPriorities, savePromotionPriorities } from "../modules/promotions/services/promotionPriorities.server";
import { PromotionPriorityManager } from "../modules/promotions/components/PromotionPriorityManager";
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  return loadPromotionPriorities(admin, session.shop);
}
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  let prioritiesSaved = false;
  try {
    const data = await request.formData();
    await savePromotionPriorities(session.shop, JSON.parse(String(data.get("changes") ?? "null")));
    prioritiesSaved = true;
    await syncStorefrontSnapshot(admin, session.shop);
    return { success: true, error: null };
  } catch (error) { return { success: false, error: (prioritiesSaved ? "Priorities were saved, but storefront sync failed. Open Promotions to retry the sync. " : "") + (error instanceof Error ? error.message : "The priorities could not be saved.") }; }
}
export default function StorefrontPriorities() {
  const { sections, errors } = useLoaderData<typeof loader>();
  const refresh = useRevalidator();
  return <PromotionPriorityManager sections={sections} errors={errors} refreshing={refresh.state !== "idle"} onRefresh={() => refresh.revalidate()} />;
}
