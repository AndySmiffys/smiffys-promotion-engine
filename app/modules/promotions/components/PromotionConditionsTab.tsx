import type { PromotionRecord } from "../models/promotion";

type PromotionConditionsTabProps = {
  promotion: PromotionRecord;
};

function formatMoney(
  amount: string,
  currencyCode: string,
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

export function PromotionConditionsTab({
  promotion,
}: PromotionConditionsTabProps) {
  const conditions = promotion.shopify.conditions;
  const combinations = promotion.shopify.combinations;

  return (
    <s-stack direction="block" gap="large">
      <s-section heading="Minimum requirements">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Requirement: {conditions.minimumRequirement}
          </s-paragraph>

          {conditions.minimumSubtotal && (
            <s-paragraph>
              Minimum subtotal:{" "}
              {formatMoney(
                conditions.minimumSubtotal.amount,
                conditions.minimumSubtotal.currencyCode,
              )}
            </s-paragraph>
          )}

          {conditions.minimumQuantity !== null && (
            <s-paragraph>
              Minimum quantity:{" "}
              {conditions.minimumQuantity}
            </s-paragraph>
          )}
        </s-stack>
      </s-section>

      <s-section heading="Usage limits">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Usage limit:{" "}
            {conditions.usageLimit === null
              ? "Not yet available"
              : conditions.usageLimit}
          </s-paragraph>

          <s-paragraph>
            Once per customer:{" "}
            {conditions.appliesOncePerCustomer
              ? "Yes"
              : "No or not yet available"}
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section heading="Discount combinations">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Order discounts:{" "}
            {combinations.orderDiscounts
              ? "Allowed"
              : "Not allowed or not yet available"}
          </s-paragraph>

          <s-paragraph>
            Product discounts:{" "}
            {combinations.productDiscounts
              ? "Allowed"
              : "Not allowed or not yet available"}
          </s-paragraph>

          <s-paragraph>
            Shipping discounts:{" "}
            {combinations.shippingDiscounts
              ? "Allowed"
              : "Not allowed or not yet available"}
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-stack>
  );
}
