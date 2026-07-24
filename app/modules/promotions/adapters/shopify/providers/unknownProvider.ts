import type { PromotionCapabilities } from "../../../models/shopify";
import type { ShopifyDiscountNode } from "../../../types/discount";
import type { PromotionTypeData } from "../types";
import { PromotionProvider } from "./PromotionProvider";
import { mapEmptyProducts } from "./shared";

/**
 * Provides the safe fallback for unsupported promotion types.
 * Does not own Shopify queries, UI rendering, or supported promotion mapping.
 */
export class UnknownProvider extends PromotionProvider {
  readonly type = "Unknown" as const;

  readonly capabilities: PromotionCapabilities = {
    supportsProducts: false,
    supportsShipping: false,
    supportsCustomers: false,
    supportsConditions: false,
    supportsCombinations: false,
    supportsWebsiteBadge: false,
    supportsCountdown: false,
    supportsLandingPage: false,
    supportsAnalytics: false,
    supportsHealthChecks: false,
  };

  supports(_node: ShopifyDiscountNode): boolean {
    return true;
  }

  map(_node: ShopifyDiscountNode): PromotionTypeData {
    return {
      products: mapEmptyProducts("Not yet supported"),
      bxgy: null,
      shipping: null,
    };
  }
}

export const unknownProvider = new UnknownProvider();
