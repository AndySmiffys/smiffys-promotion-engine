import type { ShopifyPromotionProvider } from "../types";
import { getDiscountType } from "../../../types/discount";
import { mapDiscountProducts } from "./shared";

export const orderProvider: ShopifyPromotionProvider = {
  type: "Order",
  capabilities: {
    supportsProducts: false,
    supportsShipping: false,
    supportsCustomers: true,
    supportsConditions: true,
    supportsCombinations: true,
    supportsWebsiteBadge: false,
    supportsCountdown: true,
    supportsLandingPage: true,
    supportsAnalytics: true,
    supportsHealthChecks: true,
  },

  supports(node) {
    return getDiscountType(node) === "Order";
  },

  mapTypeData(node) {
    return {
      products: mapDiscountProducts(node),
      shipping: null,
    };
  },
};
