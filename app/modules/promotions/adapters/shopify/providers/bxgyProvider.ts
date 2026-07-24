import type { ShopifyPromotionProvider } from "../types";
import { getDiscountType } from "../../../types/discount";
import { mapDiscountProducts } from "./shared";

export const bxgyProvider: ShopifyPromotionProvider = {
  type: "Buy X get Y",
  capabilities: {
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
  },

  supports(node) {
    return getDiscountType(node) === "Buy X get Y";
  },

  mapTypeData(node) {
    return {
      products: mapDiscountProducts(node),
      shipping: null,
    };
  },
};
