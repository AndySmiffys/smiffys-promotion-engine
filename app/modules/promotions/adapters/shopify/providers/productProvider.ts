import type {
  PromotionProducts,
} from "../../../models/shopify";
import {
  getDiscountType,
  type ShopifyDiscountNode,
} from "../../../types/discount";
import type { ShopifyPromotionProvider } from "../types";

function getProductAppliesTo(
  node: ShopifyDiscountNode,
): string {
  const items = node.discount.customerGets?.items;

  if (!items) {
    return "Not yet supported";
  }

  if (items.__typename === "AllDiscountItems") {
    return "All products";
  }

  if (items.__typename === "DiscountCollections") {
    const count = items.collections?.nodes.length ?? 0;

    return `${count} selected ${count === 1 ? "collection" : "collections"}`;
  }

  if (items.__typename === "DiscountProducts") {
    const productCount = items.products?.nodes.length ?? 0;
    const variantCount = items.productVariants?.nodes.length ?? 0;

    if (variantCount > 0) {
      return `${productCount} products and ${variantCount} variants`;
    }

    return `${productCount} selected ${productCount === 1 ? "product" : "products"}`;
  }

  return "Unknown";
}

function mapProducts(
  node: ShopifyDiscountNode,
): PromotionProducts {
  const items = node.discount.customerGets?.items;

  if (!items) {
    return {
      appliesTo: getProductAppliesTo(node),
      allProducts: false,
      products: [],
      variants: [],
      collections: [],
    };
  }

  return {
    appliesTo: getProductAppliesTo(node),
    allProducts:
      items.__typename === "AllDiscountItems" &&
      items.allItems === true,
    products:
      items.products?.nodes.map((product) => ({
        id: product.id,
        title: product.title,
      })) ?? [],
    variants:
      items.productVariants?.nodes.map((variant) => ({
        id: variant.id,
        title: variant.title,
      })) ?? [],
    collections:
      items.collections?.nodes.map((collection) => ({
        id: collection.id,
        title: collection.title,
      })) ?? [],
  };
}

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
      products: mapProducts(node),
      shipping: null,
    };
  },
};
