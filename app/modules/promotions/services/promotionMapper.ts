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
  Promotion,
  PromotionMethod,
  PromotionStatus,
  PromotionType,
} from "../types/promotion";

function mapPromotionMethod(
  value: string,
): PromotionMethod {
  return value === "Automatic" ? "Automatic" : "Code";
}

function mapPromotionType(
  value: string,
): PromotionType {
  switch (value) {
    case "Amount off product":
      return "Product";

    case "Amount off order":
      return "Order";

    case "Free shipping":
      return "Shipping";

    case "Buy X get Y":
      return "Buy X get Y";

    default:
      return "Unknown";
  }
}

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

export function mapDiscountToPromotion(
  node: ShopifyDiscountNode,
): Promotion {
  return {
    id: node.id,
    routeId: getRouteId(node.id),

    title: node.discount.title ?? "Untitled promotion",
    summary: node.discount.summary ?? "No summary available",

    method: mapPromotionMethod(getDiscountMethod(node)),
    type: mapPromotionType(getDiscountType(node)),
    status: mapPromotionStatus(node.discount.status),

    value: getDiscountValue(node),
    code: getDiscountCode(node),
    appliesTo: getDiscountAppliesTo(node),
    minimumRequirement: getMinimumRequirement(node),

    createdBy: getDiscountCreator(node),

    startsAt: node.discount.startsAt ?? null,
    endsAt: node.discount.endsAt ?? null,

    settings: {
      included: shouldSyncDiscount(node),
      websiteEnabled: false,

      showProductPage: false,
      showCollectionPage: false,
      showProductBadge: false,
      showCountdown: false,
      showHeaderBanner: false,

      headline: null,
      body: null,
      badgeText: null,
      countdownText: null,
      buttonText: null,
      buttonUrl: null,

      backgroundColour: null,
      textColour: null,
      badgeColour: null,

      priority: 0,

      lastSyncedAt: null,
      lastSyncError: null,
    },
  };
}

export function mapDiscountsToPromotions(
  nodes: ShopifyDiscountNode[],
): Promotion[] {
  return nodes.map(mapDiscountToPromotion);
}

function getRouteId(shopifyId: string): string {
  return shopifyId.split("/").pop() ?? shopifyId;
}
