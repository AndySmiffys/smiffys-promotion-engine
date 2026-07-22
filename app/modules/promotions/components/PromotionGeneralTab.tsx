import type { PromotionRecord } from "../models/promotion";

type PromotionGeneralTabProps = {
  promotion: PromotionRecord;
};

function getStatusTone(
  status: PromotionRecord["shopify"]["general"]["status"],
) {
  switch (status) {
    case "ACTIVE":
      return "success";

    case "SCHEDULED":
      return "info";

    case "EXPIRED":
      return "critical";

    default:
      return "neutral";
  }
}

export function PromotionGeneralTab({
  promotion,
}: PromotionGeneralTabProps) {
  const general = promotion.shopify.general;

  return (
    <s-stack direction="block" gap="large">
      <s-section heading="Promotion overview">
        <s-stack direction="block" gap="base">
          <s-paragraph>{general.summary}</s-paragraph>

          <s-stack direction="inline" gap="base">
            <s-badge tone={getStatusTone(general.status)}>
              {general.status}
            </s-badge>

            <s-badge>{general.method}</s-badge>

            <s-badge>{general.type}</s-badge>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section heading="Shopify discount">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Value: {general.value}
          </s-paragraph>

          {general.code && (
            <s-paragraph>
              Code: {general.code}
            </s-paragraph>
          )}

          <s-paragraph>
            Applies to:{" "}
            {promotion.shopify.products.appliesTo}
          </s-paragraph>

          <s-paragraph>
            Minimum requirement:{" "}
            {
              promotion.shopify.conditions
                .minimumRequirement
            }
          </s-paragraph>

          <s-paragraph>
            Created by: {general.createdBy}
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-stack>
  );
}
