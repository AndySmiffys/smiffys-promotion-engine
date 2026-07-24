import type { PromotionCapabilities } from "../../../models/shopify";
import type { ShopifyDiscountNode } from "../../../types/discount";
import type {
  PromotionTypeData,
  ShopifyPromotionProvider,
} from "../types";
import { mapEmptyProducts } from "./shared";

/**
 * Provides the safe fallback for unsupported promotion types.
 * Does not own Shopify queries, UI rendering, or supported promotion mapping.
 */
export class UnknownProvider implements ShopifyPromotionProvider {
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

  mapTypeData(_node: ShopifyDiscountNode): PromotionTypeData {
    return {
      products: mapEmptyProducts("Not yet supported"),
      shipping: null,
    };
  }
}

export const unknownProvider = new UnknownProvider();
