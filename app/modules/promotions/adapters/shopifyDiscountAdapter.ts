import {
  getDiscountAppliesTo,
  getDiscountCode,
  getDiscountCreator,
  getDiscountMethod,
  getDiscountType,
  getDiscountValue,
  getMinimumRequirement,
  shouldSyncDiscount,
  type ShopifyDiscountNode,
} from "../types/discount";

import type {
  PromotionConditions,
  PromotionCustomers,
  PromotionGeneral,
  PromotionProducts,
  PromotionSchedule,
  PromotionStatus,
  PromotionCombinations,
  ShopifyPromotion,
} from "../models/shopify";

export type AdaptedShopifyDiscount = {
  shopify: ShopifyPromotion;
  includedInSync: boolean;
};

function mapPromotionStatus(
  value: string | undefined,
): PromotionStatus {
  switch (value) {
    case "ACTIVE":
      return "ACTIVE";
    case "SCHEDULED":
      return "SCHEDULED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return "UNKNOWN";
  }
}

function adaptGeneral(
  node: ShopifyDiscountNode,
): PromotionGeneral {
  return {
    title: node.discount.title ?? "Untitled promotion",
    summary: node.discount.summary ?? "No summary available",
    method: getDiscountMethod(node),
    type: getDiscountType(node),
    status: mapPromotionStatus(node.discount.status),
    value: getDiscountValue(node),
    code: getDiscountCode(node),
    createdBy: getDiscountCreator(node),
  };
}

function adaptProducts(
  node: ShopifyDiscountNode,
): PromotionProducts {
  const items = node.discount.customerGets?.items;

  if (!items) {
    return {
      appliesTo: getDiscountAppliesTo(node),
      allProducts: false,
      products: [],
      variants: [],
      collections: [],
    };
  }

  return {
    appliesTo: getDiscountAppliesTo(node),
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

function adaptCustomers(): PromotionCustomers {
  return {
    appliesToAllCustomers: true,
    customers: [],
    segments: [],
  };
}

function adaptConditions(
  node: ShopifyDiscountNode,
): PromotionConditions {
  const requirement = node.discount.minimumRequirement;

  const minimumSubtotal =
    requirement?.__typename === "DiscountMinimumSubtotal" &&
    requirement.greaterThanOrEqualToSubtotal
      ? {
          amount:
            requirement.greaterThanOrEqualToSubtotal.amount,
          currencyCode:
            requirement.greaterThanOrEqualToSubtotal.currencyCode,
        }
      : null;

  const rawMinimumQuantity =
    requirement?.__typename === "DiscountMinimumQuantity"
      ? requirement.greaterThanOrEqualToQuantity
      : undefined;

  const parsedMinimumQuantity =
    rawMinimumQuantity !== undefined
      ? Number(rawMinimumQuantity)
      : null;

  return {
    minimumRequirement: getMinimumRequirement(node),
    minimumSubtotal,
    minimumQuantity:
      parsedMinimumQuantity !== null &&
      Number.isFinite(parsedMinimumQuantity)
        ? parsedMinimumQuantity
        : null,
    usageLimit: null,
    appliesOncePerCustomer: false,
  };
}

function adaptSchedule(
  node: ShopifyDiscountNode,
): PromotionSchedule {
  return {
    startsAt: node.discount.startsAt ?? null,
    endsAt: node.discount.endsAt ?? null,
  };
}

function adaptCombinations(): PromotionCombinations {
  return {
    orderDiscounts: false,
    productDiscounts: false,
    shippingDiscounts: false,
  };
}

export function adaptShopifyDiscount(
  node: ShopifyDiscountNode,
): AdaptedShopifyDiscount {
  return {
    shopify: {
      general: adaptGeneral(node),
      products: adaptProducts(node),
      customers: adaptCustomers(),
      conditions: adaptConditions(node),
      schedule: adaptSchedule(node),
      combinations: adaptCombinations(),
    },
    includedInSync: shouldSyncDiscount(node),
  };
}
