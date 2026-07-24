import type { ShopifyPromotionProvider } from "../types";
import { getDiscountType } from "../../../types/discount";
import { mapEmptyProducts, mapShipping } from "./shared";

export const shippingProvider: ShopifyPromotionProvider = {
  type: "Shipping",
  capabilities: {
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
  },

  supports(node) {
    return getDiscountType(node) === "Shipping";
  },

  mapTypeData(node) {
    return {
      products: mapEmptyProducts(),
      shipping: mapShipping(node),
    };
  },
};
