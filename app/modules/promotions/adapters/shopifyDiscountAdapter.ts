import {
  getDiscountCode,
  getDiscountCreator,
  getDiscountMethod,
  getDiscountValue,
  getMinimumRequirement,
  shouldSyncDiscount,
  type ShopifyDiscountNode,
} from "../types/discount";

import type {
  PromotionConditions,
  PromotionCustomers,
  PromotionGeneral,
  PromotionSchedule,
  PromotionStatus,
  PromotionCombinations,
  ShopifyPromotion,
} from "../models/shopify";
import { resolveShopifyPromotionProvider } from "./shopify/registry";
import type { ShopifyPromotionProvider } from "./shopify/types";

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
  provider: ShopifyPromotionProvider,
): PromotionGeneral {
  return {
    title: node.discount.title ?? "Untitled promotion",
    summary: node.discount.summary ?? "No summary available",
    method: getDiscountMethod(node),
    type: provider.type,
    status: mapPromotionStatus(node.discount.status),
    value: getDiscountValue(node),
    code: getDiscountCode(node),
    createdBy: getDiscountCreator(node),
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
  const provider = resolveShopifyPromotionProvider(node);
  const typeData = provider.mapTypeData(node);

  return {
    shopify: {
      general: adaptGeneral(node, provider),
      capabilities: provider.capabilities,
      products: typeData.products,
      shipping: typeData.shipping,
      customers: adaptCustomers(),
      conditions: adaptConditions(node),
      schedule: adaptSchedule(node),
      combinations: adaptCombinations(),
    },
    includedInSync: shouldSyncDiscount(node),
  };
}
