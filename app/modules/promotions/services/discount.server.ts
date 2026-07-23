import { GET_DISCOUNT } from "../graphql/discount.graphql";
import type { ShopifyDiscountNode } from "../types/discount";

export type ShopifyAdminClient = {
  graphql: (
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    },
  ) => Promise<Response>;
};

type DiscountResponse = {
  data?: {
    discountNode?: ShopifyDiscountNode | null;
  };

  errors?: Array<{
    message: string;
  }>;
};

export async function getDiscount(
  admin: ShopifyAdminClient,
  discountNodeId: string,
): Promise<ShopifyDiscountNode | null> {
  const response = await admin.graphql(
    GET_DISCOUNT,
    {
      variables: {
        id: discountNodeId,
      },
    },
  );

  const result =
    (await response.json()) as DiscountResponse;

  if (result.errors?.length) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", "),
    );
  }

  return result.data?.discountNode ?? null;
}

export function getDiscountNodeId(
  routeId: string,
): string {
  if (routeId.startsWith("gid://shopify/")) {
    return routeId;
  }

  return `gid://shopify/DiscountNode/${routeId}`;
}
