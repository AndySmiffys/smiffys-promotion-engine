import type { PromotionCapabilities } from "../../../models/shopify";
import {
  getDiscountType,
  type ShopifyDiscountNode,
} from "../../../types/discount";
import type {
  PromotionTypeData,
  ShopifyPromotionProvider,
} from "../types";
import { mapEmptyProducts, mapShipping } from "./shared";

/**
 * Owns shipping-promotion mapping and capabilities.
 * Does not own Shopify queries, UI rendering, or common promotion mapping.
 */
export class ShippingProvider implements ShopifyPromotionProvider {
  readonly type = "Shipping" as const;

  readonly capabilities: PromotionCapabilities = {
    supportsProducts: false,
    supportsShipping: true,
    supportsCustomers: true,
    supportsConditions: true,
    supportsCombinations: true,
    supportsWebsiteBadge: false,
    supportsCountdown: true,
    supportsLandingPage: true,
    supportsAnalytics: true,
    supportsHealthChecks: true,
  };

  supports(node: ShopifyDiscountNode): boolean {
    return getDiscountType(node) === this.type;
  }

  mapTypeData(node: ShopifyDiscountNode): PromotionTypeData {
    return {
      products: mapEmptyProducts(),
      shipping: mapShipping(node),
    };
  }
}

export const shippingProvider = new ShippingProvider();
