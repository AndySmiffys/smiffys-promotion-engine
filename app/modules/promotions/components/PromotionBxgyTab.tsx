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
        products.collections.length === 1
          ? "collection"
          : "collections"
      }`,
    );
  }

  if (products.products.length > 0) {
    parts.push(
      `${products.products.length} ${
        products.products.length === 1
          ? "product"
          : "products"
      }`,
    );
  }

  if (products.variants.length > 0) {
    parts.push(
      `${products.variants.length} ${
        products.variants.length === 1
          ? "variant"
          : "variants"
      }`,
    );
  }

  return parts.length > 0
    ? parts.join(" · ")
    : products.appliesTo;
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
        flex: "1 1 360px",
        border: "1px solid #dedede",
        borderRadius: "14px",
        background: "#ffffff",
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

        {products.collections.length > 0 && (
          <div>
            <s-text fontWeight="semibold">Collections</s-text>
            {products.collections.map((collection, index) => (
              <ReferenceRow
                key={collection.id}
                title={collection.title}
                typeLabel="Collection"
                isLast={index === products.collections.length - 1}
              />
            ))}
          </div>
        )}

        {products.products.length > 0 && (
          <div>
            <s-text fontWeight="semibold">Products</s-text>
            {products.products.map((product, index) => (
              <ReferenceRow
                key={product.id}
                title={product.title}
                typeLabel="Product"
                isLast={index === products.products.length - 1}
              />
            ))}
          </div>
        )}

        {products.variants.length > 0 && (
          <div>
            <s-text fontWeight="semibold">Variants</s-text>
            {products.variants.map((variant, index) => (
              <ReferenceRow
                key={variant.id}
                title={variant.title}
                typeLabel="Variant"
                isLast={index === products.variants.length - 1}
              />
            ))}
          </div>
        )}

        {products.allProducts && (
          <s-paragraph>
            Every product in the catalogue is included.
          </s-paragraph>
        )}
      </s-stack>
    </section>
  );
}

export function PromotionBxgyTab({
  promotion,
}: PromotionBxgyTabProps) {
  const bxgy = promotion.shopify.bxgy;

  if (!bxgy) {
    return (
      <s-banner tone="warning">
        Buy and Get configuration was not returned for this promotion.
      </s-banner>
    );
  }

  const buyHasTargets =
    bxgy.buy.products.allProducts ||
    getScopeCount(bxgy.buy.products) > 0;
  const getHasTargets =
    bxgy.get.products.allProducts ||
    getScopeCount(bxgy.get.products) > 0;
  const hasOfferValues =
    (bxgy.buy.quantity !== null ||
      bxgy.buy.purchaseAmount !== null) &&
    bxgy.get.quantity !== null &&
    bxgy.get.rewardType !== "UNKNOWN";
  const isHealthy = buyHasTargets && getHasTargets && hasOfferValues;

  return (
    <s-stack direction="block" gap="large">
      <s-section heading="Offer summary">
        <s-stack direction="block" gap="large">
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
            />
          </div>
        </s-stack>
      </s-section>

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
              {getHasTargets
                ? "Reward scope available"
                : "Reward scope missing"}
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
