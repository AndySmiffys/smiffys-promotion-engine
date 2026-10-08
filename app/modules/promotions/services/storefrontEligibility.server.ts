import type { PromotionRecord } from "../models/promotion";
import type { Placement } from "../design/design";
export type StorefrontContext = { placement: Placement; productId: string | null; variantId: string | null; collectionId: string | null; productCollectionIds: string[]; customerId: string | null; memberSegmentIds: string[]; now: number };
export function matchesStorefront(promotion: PromotionRecord, context: StorefrontContext): boolean {
  if (promotion.status !== "ACTIVE" || !promotion.settings.included || !promotion.settings.websiteEnabled) return false;
  if (promotion.startsAt && Date.parse(promotion.startsAt) > context.now) return false;
  if (promotion.endsAt && Date.parse(promotion.endsAt) <= context.now) return false;
  const customers = promotion.shopify.customers;
  if (!customers.appliesToAllCustomers && !customers.customers.some(c => c.id === context.customerId) && !customers.segments.some(s => context.memberSegmentIds.includes(s.id))) return false;
  const scope = promotion.shopify.bxgy?.get.products ?? promotion.shopify.products;
  if (context.placement === "header") return true;
  if (promotion.type === "Order" || promotion.type === "Shipping" || scope.allProducts) return true;
  if (context.placement === "collection") {
    // Explicit product-only discounts don't qualify an entire collection banner.
    return Boolean(context.collectionId && scope.collections.some(c => c.id === context.collectionId));
  }
  if (!context.productId) return false;
  if (scope.products.some(p => p.id === context.productId)) return true;
  if (scope.collections.some(c => context.productCollectionIds.includes(c.id))) return true;
  return scope.variants.some(v => v.productId === context.productId && (context.placement === "badge" || v.id === context.variantId));
}
