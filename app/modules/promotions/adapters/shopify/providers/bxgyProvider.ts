import type { PromotionCapabilities } from "../../../models/shopify";
import {
  getDiscountType,
  type ShopifyDiscountNode,
} from "../../../types/discount";
import type {
  PromotionTypeData,
  ShopifyPromotionProvider,
} from "../types";
import { mapDiscountProducts } from "./shared";

/**
 * Owns Buy X get Y promotion mapping and capabilities.
 * Does not own Shopify queries, UI rendering, or common promotion mapping.
 */
export class BxgyProvider implements ShopifyPromotionProvider {
  readonly type = "Buy X get Y" as const;

  readonly capabilities: PromotionCapabilities = {
    supportsProducts: true,
    supportsShipping: false,
    supportsCustomers: true,
    supportsConditions: true,
    supportsCombinations: true,
    supportsWebsiteBadge: true,
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
      products: mapDiscountProducts(node),
      shipping: null,
    };
  }
}

export const bxgyProvider = new BxgyProvider();
