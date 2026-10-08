import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { PromotionEditor } from "../modules/promotions/components/PromotionEditor";
import { promotionEditorAction } from "../modules/promotions/services/promotionEditorAction.server";
import { getPromotionEditorResources } from "../modules/promotions/services/promotionEditorResources.server";
export async function action(args: ActionFunctionArgs) { return promotionEditorAction(args); }
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  return getPromotionEditorResources(admin);
}
export default function CreatePromotionPage() {
  const { products } = useLoaderData<typeof loader>();
  return <PromotionEditor products={products} />;
}
