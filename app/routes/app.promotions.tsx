import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";
import { getDiscounts } from "../modules/promotions/services/discounts.server";
import { mapDiscountsToPromotions } from "../modules/promotions/mappers/promotionMapper";
import { attachPromotionSettings } from "../modules/promotions/services/promotionSettings.server";
import type { PromotionRecord } from "../modules/promotions/models/promotion";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const discountNodes = await getDiscounts(admin);
  const mappedPromotions = mapDiscountsToPromotions(discountNodes);
  const promotions = await attachPromotionSettings(
    session.shop,
    mappedPromotions,
  );

  return { promotions };
}

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

function getPromotionValue(promotion: PromotionRecord): string {
  const bxgy = promotion.shopify.bxgy;

  if (!bxgy) {
    return promotion.shopify.general.value;
  }

  const quantity = bxgy.get.quantity ?? 1;

  if (bxgy.get.rewardType === "FREE") {
    return `${quantity} free`;
  }

  if (bxgy.get.rewardType === "PERCENTAGE") {
    return `${bxgy.get.rewardValue ?? 0}% off`;
  }

  if (bxgy.get.rewardType === "FIXED_AMOUNT") {
    const value = bxgy.get.rewardValue ?? 0;
    const currency = bxgy.get.rewardCurrencyCode;

    return currency
      ? new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency,
        }).format(value)
      : `${value} off`;
  }

  return promotion.shopify.general.value;
}

function StatCard({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: number;
  description: string;
  accent: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        flex: "1 1 210px",
        minWidth: "210px",
        overflow: "hidden",
        padding: "20px",
        border: "1px solid #e3e3e3",
        borderRadius: "16px",
        background: "linear-gradient(145deg, #ffffff 0%, #fafafa 100%)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "78px",
          height: "78px",
          borderRadius: "0 0 0 78px",
          backgroundColor: accent,
          opacity: 0.75,
        }}
      />

      <div style={{ position: "relative" }}>
        <div
          style={{
            color: "#616161",
            fontSize: "12px",
            fontWeight: 650,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: "8px",
            color: "#202223",
            fontSize: "30px",
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {new Intl.NumberFormat("en-GB").format(value)}
        </div>
        <div
          style={{
            marginTop: "8px",
            color: "#616161",
            fontSize: "13px",
            lineHeight: 1.45,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function PromotionCard({ promotion }: { promotion: PromotionRecord }) {
  const general = promotion.shopify.general;
  const products = promotion.shopify.products;
  const conditions = promotion.shopify.conditions;

  return (
    <article
      style={{
        border: "1px solid #dedede",
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.07)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "18px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            minWidth: 0,
            flex: "1 1 420px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 52px",
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#e8f7ed",
              color: "#14804a",
              fontSize: "25px",
            }}
          >
            ◇
          </div>

          <div style={{ minWidth: 0 }}>
            <s-link href={`/app/promotions/${promotion.routeId}`}>
              <span
                style={{
                  color: "#202223",
                  fontSize: "17px",
                  fontWeight: 700,
                  lineHeight: 1.35,
                }}
              >
                {general.title}
              </span>
            </s-link>

            <div
              style={{
                marginTop: "5px",
                color: "#616161",
                lineHeight: 1.45,
              }}
            >
              {general.summary}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "13px",
              }}
            >
              <s-badge tone={getStatusTone(general.status)}>
                {general.status}
              </s-badge>
              <s-badge>{general.type}</s-badge>
              <s-badge>{general.method}</s-badge>
              <s-badge tone="info">{getPromotionValue(promotion)}</s-badge>
              <s-badge
                tone={promotion.settings.included ? "success" : "warning"}
              >
                {promotion.settings.included ? "Included" : "Excluded"}
              </s-badge>
            </div>
          </div>
        </div>

        <s-button
          href={`/app/promotions/${promotion.routeId}`}
          variant="secondary"
        >
          View promotion →
        </s-button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
          borderTop: "1px solid #eeeeee",
          background: "#fcfcfc",
        }}
      >
        <CardDetail label="Scope" value={products.appliesTo} symbol="□" />
        <CardDetail label="Value" value={getPromotionValue(promotion)} symbol="%" />
        <CardDetail
          label="Minimum"
          value={conditions.minimumRequirement}
          symbol="↓"
        />
        <CardDetail label="Created by" value={general.createdBy} symbol="○" />
      </div>
    </article>
  );
}

function CardDetail({
  label,
  value,
  symbol,
}: {
  label: string;
  value: string;
  symbol: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: 0,
        padding: "16px 20px",
        borderRight: "1px solid #eeeeee",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 34px",
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          background: "#f0ecff",
          color: "#7047eb",
          fontWeight: 700,
        }}
      >
        {symbol}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#202223",
            fontSize: "13px",
            fontWeight: 650,
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: "3px",
            color: "#616161",
            fontSize: "13px",
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const { promotions } = useLoaderData<typeof loader>();

  const activeCount = promotions.filter(
    (promotion) => promotion.shopify.general.status === "ACTIVE",
  ).length;
  const scheduledCount = promotions.filter(
    (promotion) => promotion.shopify.general.status === "SCHEDULED",
  ).length;
  const includedCount = promotions.filter(
    (promotion) => promotion.settings.included,
  ).length;

  return (
    <s-page heading="Promotions">
      <s-stack direction="block" gap="large">
        <section
          style={{
            border: "1px solid #dedede",
            borderRadius: "16px",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.07)",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "18px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#202223",
                  fontSize: "22px",
                  fontWeight: 700,
                  lineHeight: 1.25,
                }}
              >
                Promotion Centre
              </div>
              <div
                style={{
                  maxWidth: "680px",
                  marginTop: "7px",
                  color: "#616161",
                  lineHeight: 1.5,
                }}
              >
                Review Shopify discounts, monitor website inclusion and open
                each promotion for detailed targeting, health and messaging.
              </div>
            </div>

            <s-button href="shopify:admin/discounts" target="_blank">
              Open Shopify discounts ↗
            </s-button>
          </div>
        </section>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <StatCard
            label="Total promotions"
            value={promotions.length}
            description="All promotions currently returned from Shopify."
            accent="#f0ecff"
          />
          <StatCard
            label="Active"
            value={activeCount}
            description="Promotions currently active for customers."
            accent="#e8f7ed"
          />
          <StatCard
            label="Scheduled"
            value={scheduledCount}
            description="Promotions waiting for their start date."
            accent="#eaf2ff"
          />
          <StatCard
            label="Included in sync"
            value={includedCount}
            description="Promotions enabled for website processing."
            accent="#fff3dc"
          />
        </div>

        {promotions.length === 0 ? (
          <section
            style={{
              border: "1px solid #dedede",
              borderRadius: "16px",
              background: "#ffffff",
              padding: "36px",
              textAlign: "center",
            }}
          >
            <s-stack direction="block" gap="base">
              <s-text fontWeight="semibold">No promotions found</s-text>
              <s-paragraph>
                Create a discount in Shopify and refresh this page.
              </s-paragraph>
            </s-stack>
          </section>
        ) : (
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "17px", fontWeight: 700 }}>
                  All promotions
                </div>
                <div
                  style={{
                    marginTop: "3px",
                    color: "#616161",
                    fontSize: "13px",
                  }}
                >
                  {promotions.length} Shopify promotion
                  {promotions.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: "14px",
              }}
            >
              {promotions.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
              ))}
            </div>
          </section>
        )}
      </s-stack>
    </s-page>
  );
}
