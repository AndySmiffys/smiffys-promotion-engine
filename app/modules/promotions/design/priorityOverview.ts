import { placements } from "./design";
import type { PromotionRecord } from "../models/promotion";
import { storefrontIneligibility } from "../services/storefrontEligibility.server";
export function buildPriorityOverview(promotions: PromotionRecord[], now: number) {
  // Stable sorting preserves the saved creation-order tie break.
  const ranked = [...promotions].sort((a, b) => b.settings.priority - a.settings.priority);
  return placements.map(placement => ({
    id: placement.id,
    title: placement.title,
    rows: ranked.filter(promotion => promotion.settings[placement.flag]).map(promotion => {
      const customers = promotion.shopify.customers;
      const restricted = !customers.appliesToAllCustomers;
      const audience = !restricted ? "All customers" : customers.segments.length ? "Selected customer segments (login required)" : "Selected customers (login required)";
      const reason = storefrontIneligibility(promotion, { placement: "header", productId: null, collectionId: null, variantId: null, productCollectionIds: [], customerId: null, memberSegmentIds: [], now });
      let detail = reason && reason !== "Requires an eligible logged-in customer." ? reason : null;
      const scope = promotion.shopify.bxgy?.get.products ?? promotion.shopify.products;
      const allProducts = promotion.type === "Order" || promotion.type === "Shipping" || scope.allProducts;
      if (!detail && placement.id === "collection" && !allProducts && !scope.collections.length) detail = "Collection banners require a discount targeting qualifying collections.";
      const status = detail ? "Not shown" : restricted ? "Customer restricted" : "Available";
      if (!detail) detail = restricted ? "Visible only to eligible logged-in customers." : placement.id === "header" ? "Competes by priority with other eligible header promotions." : allProducts ? "Available across this placement when the promotion qualifies." : "Only qualifying collections, products or selected variants can display this promotion.";
      return { id: promotion.id, routeId: promotion.routeId, title: promotion.title, priority: promotion.settings.priority, audience, status, detail };
    }),
  }));
}
