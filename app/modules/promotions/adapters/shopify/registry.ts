import type { ShopifyDiscountNode } from "../../types/discount";
import type { ShopifyPromotionProvider } from "./types";
import { bxgyProvider } from "./providers/bxgyProvider";
import { orderProvider } from "./providers/orderProvider";
import { productProvider } from "./providers/productProvider";
import { shippingProvider } from "./providers/shippingProvider";
import { unknownProvider } from "./providers/unknownProvider";

const providers: ShopifyPromotionProvider[] = [
  productProvider,
  orderProvider,
  shippingProvider,
  bxgyProvider,
  unknownProvider,
];

export function resolveShopifyPromotionProvider(
  node: ShopifyDiscountNode,
): ShopifyPromotionProvider {
  return (
    providers.find((provider) => provider.supports(node)) ??
    unknownProvider
  );
}

export function getShopifyPromotionProviders(): readonly ShopifyPromotionProvider[] {
  return providers;
}
