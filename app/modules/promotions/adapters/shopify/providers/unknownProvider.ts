import type { ShopifyPromotionProvider } from "../types";
import { mapEmptyProducts } from "./shared";

export const unknownProvider: ShopifyPromotionProvider = {
  type: "Unknown",
  capabilities: {
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
  },

  supports() {
    return true;
  },

  mapTypeData() {
    return {
      products: mapEmptyProducts("Not yet supported"),
      shipping: null,
    };
  },
};
