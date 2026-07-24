import type { PromotionRecord } from "../models/promotion";

import { PromotionBxgyTab } from "./PromotionBxgyTab";

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

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getScopeSummary(promotion: PromotionRecord): string {
  const products = promotion.shopify.products;

  if (products.allProducts) {
    return "All products";
  }

  const scopeParts: string[] = [];

  if (products.collections.length > 0) {
    scopeParts.push(
      `${products.collections.length} ${
        products.collections.length === 1
          ? "collection"
          : "collections"
      }`,
    );
  }

  if (products.products.length > 0) {
    scopeParts.push(
      `${products.products.length} ${
        products.products.length === 1
          ? "product"
          : "products"
      }`,
    );
  }

  if (products.variants.length > 0) {
    scopeParts.push(
      `${products.variants.length} ${
        products.variants.length === 1
          ? "variant"
          : "variants"
      }`,
    );
  }

  return scopeParts.length > 0
    ? scopeParts.join(" · ")
    : products.appliesTo;
}

export function PromotionGeneralTab({
  promotion,
}: PromotionGeneralTabProps) {
  const general = promotion.shopify.general;
  const schedule = promotion.shopify.schedule;
  const editInShopifyUrl =
    `shopify:admin/discounts/${promotion.routeId}`;

  return (
    <s-stack direction="block" gap="large">
      <section
        aria-label="Promotion quick summary"
        style={{
          border: "1px solid #dedede",
          borderRadius: "14px",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          padding: "20px",
        }}
      >
        <s-stack direction="block" gap="large">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <s-stack direction="block" gap="small">
              <s-text fontWeight="semibold">
                {general.title}
              </s-text>

              <s-text tone="subdued">
                {general.summary}
              </s-text>
            </s-stack>

            <s-button
              href={editInShopifyUrl}
              target="_blank"
              variant="secondary"
            >
              Edit in Shopify ↗
            </s-button>
          </div>

          <s-stack direction="inline" gap="base">
            <s-badge tone={getStatusTone(general.status)}>
              {general.status}
            </s-badge>

            <s-badge>{general.type}</s-badge>

            <s-badge>{general.method}</s-badge>

            <s-badge>{general.value}</s-badge>

            <s-badge>
              {promotion.settings.websiteEnabled
                ? "Website enabled"
                : "Website disabled"}
            </s-badge>
          </s-stack>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              paddingTop: "16px",
              borderTop: "1px solid #ebebeb",
            }}
          >
            <SummaryItem
              label="Scope"
              value={getScopeSummary(promotion)}
            />

            <SummaryItem
              label="Starts"
              value={formatDate(schedule.startsAt)}
            />

            <SummaryItem
              label="Ends"
              value={formatDate(schedule.endsAt)}
            />

            <SummaryItem
              label="Created by"
              value={general.createdBy}
            />
          </div>
        </s-stack>
      </section>

      {promotion.shopify.bxgy && (
        <PromotionBxgyTab promotion={promotion} />
      )}

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
            Applies to: {promotion.shopify.products.appliesTo}
          </s-paragraph>

          <s-paragraph>
            Minimum requirement:{" "}
            {
              promotion.shopify.conditions
                .minimumRequirement
            }
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-stack>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({
  label,
  value,
}: SummaryItemProps) {
  return (
    <s-stack direction="block" gap="small">
      <s-text tone="subdued">{label}</s-text>
      <s-text fontWeight="semibold">{value}</s-text>
    </s-stack>
  );
}
