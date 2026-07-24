import type {
  PromotionProducts,
  PromotionShipping,
} from "../../../models/shopify";
import {
  getDiscountAppliesTo,
  type ShopifyDiscountNode,
} from "../../../types/discount";

export function mapEmptyProducts(
  appliesTo = "Not applicable",
): PromotionProducts {
  return {
    appliesTo,
    allProducts: false,
    products: [],
    variants: [],
    collections: [],
  };
}

export function mapDiscountProducts(
  node: ShopifyDiscountNode,
): PromotionProducts {
  const items = node.discount.customerGets?.items;

  if (!items) {
    return mapEmptyProducts(getDiscountAppliesTo(node));
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

export function mapShipping(
  node: ShopifyDiscountNode,
): PromotionShipping {
  const destination = node.discount.destinationSelection;

  return {
    appliesTo: getDiscountAppliesTo(node),
    allCountries: destination?.allCountries === true,
    countries: destination?.countries ?? [],
    maximumShippingPrice:
      node.discount.maximumShippingPrice ?? null,
    appliesOnOneTimePurchase:
      node.discount.appliesOnOneTimePurchase ?? false,
    appliesOnSubscription:
      node.discount.appliesOnSubscription ?? false,
  };
}
