import type { ShopifyPromotionProvider } from "../types";
import { getDiscountType } from "../../../types/discount";
import { mapDiscountProducts } from "./shared";

export const productProvider: ShopifyPromotionProvider = {
  type: "Product",
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
    return getDiscountType(node) === "Product";
  },

  mapTypeData(node) {
    return {
      products: mapDiscountProducts(node),
      shipping: null,
    };
  },
};
