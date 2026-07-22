import { GET_DISCOUNTS } from "../graphql/discounts.graphql";
import type { ShopifyDiscountNode } from "../types/discount";

export type ShopifyAdminClient = {
  graphql: (query: string) => Promise<Response>;
};

type DiscountsResponse = {
  data?: {
    discountNodes?: {
      nodes: ShopifyDiscountNode[];
    };
  };
  errors?: Array<{
    message: string;
  }>;
};

export async function getDiscounts(
  admin: ShopifyAdminClient,
): Promise<ShopifyDiscountNode[]> {
  const response = await admin.graphql(GET_DISCOUNTS);
  const result = (await response.json()) as DiscountsResponse;

  if (result.errors?.length) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  return result.data?.discountNodes?.nodes ?? [];
}
