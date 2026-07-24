import type {
  PromotionBxgy,
  PromotionProducts,
} from "../models/shopify";
import type { PromotionRecord } from "../models/promotion";

import { ReferenceRow } from "./ReferenceRow";
import { SummaryCard } from "./SummaryCard";

type PromotionBxgyTabProps = {
  promotion: PromotionRecord;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatMoney(
  value: number,
  currencyCode: string | null,
): string {
  if (!currencyCode) {
    return formatNumber(value);
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

function getScopeCount(products: PromotionProducts): number {
  return (
    products.collections.length +
    products.products.length +
    products.variants.length
  );
}

function getScopeSummary(products: PromotionProducts): string {
  if (products.allProducts) {
    return "All products";
  }

  const parts: string[] = [];

  if (products.collections.length > 0) {
    parts.push(
      `${products.collections.length} ${
        products.collections.length === 1 ? "collection" : "collections"
      }`,
    );
  }

  if (products.products.length > 0) {
    parts.push(
      `${products.products.length} ${
        products.products.length === 1 ? "product" : "products"
      }`,
    );
  }

  if (products.variants.length > 0) {
    parts.push(
      `${products.variants.length} ${
        products.variants.length === 1 ? "variant" : "variants"
      }`,
    );
  }

  return parts.length > 0 ? parts.join(" · ") : products.appliesTo;
}

function getBuyLabel(bxgy: PromotionBxgy): string {
  if (bxgy.buy.quantity !== null) {
    return `${formatNumber(bxgy.buy.quantity)} ${
      bxgy.buy.quantity === 1 ? "product" : "products"
    }`;
  }

  if (bxgy.buy.purchaseAmount !== null) {
    return `Spend ${bxgy.buy.purchaseAmount}`;
  }

  return "Requirement unavailable";
}

function getRewardLabel(bxgy: PromotionBxgy): string {
  const quantity = bxgy.get.quantity ?? 1;

  switch (bxgy.get.rewardType) {
    case "FREE":
      return `${formatNumber(quantity)} FREE`;
    case "PERCENTAGE":
      return `${formatNumber(quantity)} at ${formatNumber(
        bxgy.get.rewardValue ?? 0,
      )}% off`;
    case "FIXED_AMOUNT":
      return `${formatNumber(quantity)} with ${formatMoney(
        bxgy.get.rewardValue ?? 0,
        bxgy.get.rewardCurrencyCode,
      )} off`;
    default:
      return `${formatNumber(quantity)} reward ${
        quantity === 1 ? "item" : "items"
      }`;
  }
}

function ScopeGroup({
  title,
  emptyText,
  icon,
  accent,
  items,
  typeLabel,
}: {
  title: string;
  emptyText: string;
  icon: string;
  accent: "purple" | "amber" | "teal";
  items: Array<{ id: string; title: string }>;
  typeLabel: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 0",
          borderBottom: "1px solid #eeeeee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background:
                accent === "purple"
                  ? "#f2eafe"
                  : accent === "amber"
                    ? "#fff5df"
                    : "#e5f6f7",
              color:
                accent === "purple"
                  ? "#7c3aed"
                  : accent === "amber"
                    ? "#c77800"
                    : "#087f8c",
              fontWeight: 700,
            }}
          >
            {icon}
          </div>

          <div>
            <div style={{ fontWeight: 650 }}>{title}</div>
            {items.length === 0 && (
              <div style={{ color: "#616161", fontSize: "13px" }}>
                {emptyText}
              </div>
            )}
          </div>
        </div>

        <s-badge>{items.length}</s-badge>
      </div>

      {items.map((item, index) => (
        <ReferenceRow
          key={item.id}
          title={item.title}
          typeLabel={typeLabel}
          icon={icon}
          accent={accent}
          isLast={index === items.length - 1}
        />
      ))}
    </div>
  );
}

function ScopePanel({
  heading,
  description,
  products,
}: {
  heading: string;
  description: string;
  products: PromotionProducts;
}) {
  const hasTargets = products.allProducts || getScopeCount(products) > 0;

  return (
    <section
      aria-label={heading}
      style={{
        minWidth: 0,
        flex: "1 1 390px",
        border: "1px solid #dedede",
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
        padding: "20px",
      }}
    >
      <s-stack direction="block" gap="large">
        <s-stack direction="block" gap="small">
          <s-text fontWeight="semibold">{heading}</s-text>
          <s-text tone="subdued">{description}</s-text>
        </s-stack>

        <s-banner tone={hasTargets ? "info" : "warning"}>
          {hasTargets
            ? getScopeSummary(products)
            : "Shopify did not return any targeting information."}
        </s-banner>

        {products.allProducts ? (
          <s-paragraph>Every product in the catalogue is included.</s-paragraph>
        ) : (
          <div>
            <ScopeGroup
              title="Products"
              emptyText="No products"
              icon="◇"
              accent="purple"
              items={products.products}
              typeLabel="Product"
            />
            <ScopeGroup
              title="Collections"
              emptyText="No collections"
              icon="□"
              accent="amber"
              items={products.collections}
              typeLabel="Collection"
            />
            <ScopeGroup
              title="Variants"
              emptyText="No variants"
              icon="Ⅱ"
              accent="teal"
              items={products.variants}
              typeLabel="Variant"
            />
          </div>
        )}
      </s-stack>
    </section>
  );
}

export function PromotionBxgyTab({ promotion }: PromotionBxgyTabProps) {
  const bxgy = promotion.shopify.bxgy;

  if (!bxgy) {
    return (
      <s-banner tone="warning">
        Buy and Get configuration was not returned for this promotion.
      </s-banner>
    );
  }

  const buyHasTargets =
    bxgy.buy.products.allProducts || getScopeCount(bxgy.buy.products) > 0;
  const getHasTargets =
    bxgy.get.products.allProducts || getScopeCount(bxgy.get.products) > 0;
  const hasOfferValues =
    (bxgy.buy.quantity !== null || bxgy.buy.purchaseAmount !== null) &&
    bxgy.get.quantity !== null &&
    bxgy.get.rewardType !== "UNKNOWN";
  const isHealthy = buyHasTargets && getHasTargets && hasOfferValues;

  return (
    <s-stack direction="block" gap="large">
      <section
        aria-label="Offer summary"
        style={{
          border: "1px solid #dedede",
          borderRadius: "16px",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
          padding: "20px",
        }}
      >
        <s-stack direction="block" gap="large">
          <s-text fontWeight="semibold">Offer summary</s-text>

          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <SummaryCard
              label="BUY"
              value={getBuyLabel(bxgy)}
              description={getScopeSummary(bxgy.buy.products)}
              icon="🛒"
              accent="green"
            />

            <div
              aria-hidden="true"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "36px",
                fontSize: "24px",
              }}
            >
              →
            </div>

            <SummaryCard
              label="GET"
              value={getRewardLabel(bxgy)}
              description={getScopeSummary(bxgy.get.products)}
              icon="◇"
              accent="blue"
            />
          </div>
        </s-stack>
      </section>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <ScopePanel
          heading="Qualifying products"
          description="Products customers must buy to qualify for the reward."
          products={bxgy.buy.products}
        />

        <ScopePanel
          heading="Reward products"
          description="Products that receive the Buy and Get reward."
          products={bxgy.get.products}
        />
      </div>

      <s-section heading="Offer health">
        <s-stack direction="block" gap="base">
          <s-banner tone={isHealthy ? "success" : "warning"}>
            {isHealthy
              ? "The Buy and Get offer has qualifying products, reward products and complete offer values."
              : "Some Buy and Get configuration is missing or could not be read from Shopify."}
          </s-banner>

          <s-stack direction="inline" gap="base">
            <s-badge tone={buyHasTargets ? "success" : "warning"}>
              {buyHasTargets
                ? "Qualifying scope available"
                : "Qualifying scope missing"}
            </s-badge>
            <s-badge tone={getHasTargets ? "success" : "warning"}>
              {getHasTargets ? "Reward scope available" : "Reward scope missing"}
            </s-badge>
            <s-badge tone={hasOfferValues ? "success" : "warning"}>
              {hasOfferValues
                ? "Offer values available"
                : "Offer values incomplete"}
            </s-badge>
          </s-stack>
        </s-stack>
      </s-section>
    </s-stack>
  );
}
