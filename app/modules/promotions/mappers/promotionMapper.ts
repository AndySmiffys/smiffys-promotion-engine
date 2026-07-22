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

import type { PromotionRecord } from "../models/promotion";

import type {
  PromotionConditions,
  PromotionCustomers,
  PromotionGeneral,
  PromotionMethod,
  PromotionProducts,
  PromotionSchedule,
  PromotionStatus,
  PromotionType,
  PromotionCombinations,
  ShopifyPromotion,
} from "../models/shopify";

import type { PromotionWebsiteSettings } from "../models/website";

function mapPromotionMethod(
  value: string,
): PromotionMethod {
  return value === "Automatic"
    ? "Automatic"
    : "Code";
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

function mapGeneral(
  node: ShopifyDiscountNode,
): PromotionGeneral {
  return {
    title:
      node.discount.title ??
      "Untitled promotion",

    summary:
      node.discount.summary ??
      "No summary available",

    method: mapPromotionMethod(
      getDiscountMethod(node),
    ),

    type: mapPromotionType(
      getDiscountType(node),
    ),

    status: mapPromotionStatus(
      node.discount.status,
    ),

    value: getDiscountValue(node),
    code: getDiscountCode(node),
    createdBy: getDiscountCreator(node),
  };
}

function mapProducts(
  node: ShopifyDiscountNode,
): PromotionProducts {
  const items =
    node.discount.customerGets?.items;

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
      items.productVariants?.nodes.map(
        (variant) => ({
          id: variant.id,
          title: variant.title,
        }),
      ) ?? [],

    collections:
      items.collections?.nodes.map(
        (collection) => ({
          id: collection.id,
          title: collection.title,
        }),
      ) ?? [],
  };
}

function mapCustomers(): PromotionCustomers {
  /*
   * Customer eligibility is not yet included in the
   * GraphQL query. These defaults will be replaced when
   * customerSelection is added.
   */
  return {
    appliesToAllCustomers: true,
    customers: [],
    segments: [],
  };
}

function mapConditions(
  node: ShopifyDiscountNode,
): PromotionConditions {
  const requirement =
    node.discount.minimumRequirement;

  const minimumSubtotal =
    requirement?.__typename ===
      "DiscountMinimumSubtotal" &&
      requirement.greaterThanOrEqualToSubtotal
      ? {
        amount:
          requirement
            .greaterThanOrEqualToSubtotal
            .amount,

        currencyCode:
          requirement
            .greaterThanOrEqualToSubtotal
            .currencyCode,
      }
      : null;

  const rawMinimumQuantity =
    requirement?.__typename ===
      "DiscountMinimumQuantity"
      ? requirement.greaterThanOrEqualToQuantity
      : undefined;

  const parsedMinimumQuantity =
    rawMinimumQuantity !== undefined
      ? Number(rawMinimumQuantity)
      : null;

  return {
    minimumRequirement:
      getMinimumRequirement(node),

    minimumSubtotal,

    minimumQuantity:
      parsedMinimumQuantity !== null &&
        Number.isFinite(parsedMinimumQuantity)
        ? parsedMinimumQuantity
        : null,

    /*
     * These fields are not yet included in the
     * GraphQL query.
     */
    usageLimit: null,
    appliesOncePerCustomer: false,
  };
}

function mapSchedule(
  node: ShopifyDiscountNode,
): PromotionSchedule {
  return {
    startsAt:
      node.discount.startsAt ?? null,

    endsAt:
      node.discount.endsAt ?? null,
  };
}

function mapCombinations(): PromotionCombinations {
  /*
   * Combination rules are not yet included in the
   * GraphQL query.
   */
  return {
    orderDiscounts: false,
    productDiscounts: false,
    shippingDiscounts: false,
  };
}

function mapShopifyPromotion(
  node: ShopifyDiscountNode,
): ShopifyPromotion {
  return {
    general: mapGeneral(node),
    products: mapProducts(node),
    customers: mapCustomers(),
    conditions: mapConditions(node),
    schedule: mapSchedule(node),
    combinations: mapCombinations(),
  };
}

function mapDefaultWebsiteSettings(
  included: boolean,
): PromotionWebsiteSettings {
  return {
    included,
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
  };
}

export function mapDiscountToPromotion(
  node: ShopifyDiscountNode,
): PromotionRecord {
  const shopify =
    mapShopifyPromotion(node);

  const includedInSync =
    shouldSyncDiscount(node);

  return {
    id: node.id,
    routeId: getRouteId(node.id),

    /*
    |--------------------------------------------------------------------------
    | Temporary compatibility properties
    |--------------------------------------------------------------------------
    */

    title: shopify.general.title,
    summary: shopify.general.summary,

    method: shopify.general.method,
    type: shopify.general.type,
    status: shopify.general.status,

    value: shopify.general.value,
    code: shopify.general.code,

    appliesTo:
      shopify.products.appliesTo,

    minimumRequirement:
      shopify.conditions.minimumRequirement,

    createdBy:
      shopify.general.createdBy,

    includedInSync,

    startsAt:
      shopify.schedule.startsAt,

    endsAt:
      shopify.schedule.endsAt,

    /*
    |--------------------------------------------------------------------------
    | New structured model
    |--------------------------------------------------------------------------
    */

    shopify,

    settings:
      mapDefaultWebsiteSettings(
        includedInSync,
      ),
  };
}

export function mapDiscountsToPromotions(
  nodes: ShopifyDiscountNode[],
): PromotionRecord[] {
  return nodes.map(
    mapDiscountToPromotion,
  );
}

function getRouteId(
  shopifyId: string,
): string {
  return (
    shopifyId.split("/").pop() ??
    shopifyId
  );
}
