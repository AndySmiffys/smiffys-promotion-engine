import { useMemo, useState } from "react";
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
    return bxgy.get.rewardValue !== null
      ? `${bxgy.get.rewardValue}%`
      : "Percentage reward";
  }

  if (bxgy.get.rewardType === "FIXED_AMOUNT") {
    const value = bxgy.get.rewardValue;
    const currency = bxgy.get.rewardCurrencyCode;

    if (value !== null && currency) {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
      }).format(value);
    }

    return "Fixed amount reward";
  }

  return "Buy X Get Y";
}

function getEligibility(promotion: PromotionRecord): string {
  const customers = promotion.shopify.customers;

  if (customers.appliesToAllCustomers) {
    return "All customers";
  }

  if (customers.segments.length > 0) {
    return customers.segments.length === 1
      ? customers.segments[0].name
      : `${customers.segments.length} customer segments`;
  }

  if (customers.customers.length > 0) {
    return `${customers.customers.length} selected ${customers.customers.length === 1 ? "customer" : "customers"}`;
  }

  return "Targeted customers";
}

export default function PromotionsPage() {
  const { promotions } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredPromotions = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const general = promotion.shopify.general;
      const matchesQuery =
        normalisedQuery.length === 0 ||
        general.title.toLowerCase().includes(normalisedQuery) ||
        general.summary.toLowerCase().includes(normalisedQuery) ||
        general.type.toLowerCase().includes(normalisedQuery) ||
        general.method.toLowerCase().includes(normalisedQuery);

      const matchesStatus =
        statusFilter === "ALL" || general.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [promotions, query, statusFilter]);

  return (
    <s-page heading="Promotions">
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <s-stack direction="block" gap="large">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: "#202223",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                Review Shopify discounts and manage their Promotion Engine settings.
              </div>
              <div
                style={{
                  marginTop: "4px",
                  color: "#616161",
                  fontSize: "13px",
                }}
              >
                {promotions.length} promotion{promotions.length === 1 ? "" : "s"}
              </div>
            </div>

            <s-button href="shopify:admin/discounts" target="_blank">
              Open Shopify discounts
            </s-button>
          </div>

          <section
            style={{
              overflow: "hidden",
              border: "1px solid #dedede",
              borderRadius: "12px",
              background: "#ffffff",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px, 1fr) 180px",
                gap: "12px",
                padding: "12px",
                borderBottom: "1px solid #ebebeb",
                background: "#fafafa",
              }}
            >
              <s-text-field
                label="Search promotions"
                labelAccessibilityVisibility="exclusive"
                placeholder="Search promotions"
                value={query}
                onInput={(event) => setQuery(event.currentTarget.value)}
              />

              <s-select
                label="Status"
                labelAccessibilityVisibility="exclusive"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.currentTarget.value)}
              >
                <s-option value="ALL">All statuses</s-option>
                <s-option value="ACTIVE">Active</s-option>
                <s-option value="SCHEDULED">Scheduled</s-option>
                <s-option value="EXPIRED">Expired</s-option>
                <s-option value="UNKNOWN">Unknown</s-option>
              </s-select>
            </div>

            {filteredPromotions.length === 0 ? (
              <div
                style={{
                  padding: "40px 24px",
                  textAlign: "center",
                }}
              >
                <s-text fontWeight="semibold">No promotions found</s-text>
                <div
                  style={{
                    marginTop: "6px",
                    color: "#616161",
                    fontSize: "13px",
                  }}
                >
                  Try changing the search or status filter.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: "980px",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#fafafa",
                        borderBottom: "1px solid #ebebeb",
                      }}
                    >
                      {["Title", "Status", "Method", "Eligibility", "Type", "Website", "Value", ""].map((label) => (
                        <th
                          key={label || "action"}
                          scope="col"
                          style={{
                            padding: "11px 14px",
                            color: "#616161",
                            fontSize: "12px",
                            fontWeight: 650,
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPromotions.map((promotion) => {
                      const general = promotion.shopify.general;

                      return (
                        <tr
                          key={promotion.id}
                          style={{
                            borderBottom: "1px solid #eeeeee",
                          }}
                        >
                          <td style={{ padding: "14px" }}>
                            <s-link href={`/app/promotions/${promotion.routeId}`}>
                              <span
                                style={{
                                  color: "#202223",
                                  fontSize: "14px",
                                  fontWeight: 650,
                                }}
                              >
                                {general.title}
                              </span>
                            </s-link>
                            <div
                              style={{
                                maxWidth: "390px",
                                marginTop: "3px",
                                color: "#616161",
                                fontSize: "12px",
                                lineHeight: 1.4,
                              }}
                            >
                              {general.summary}
                            </div>
                          </td>
                          <td style={{ padding: "14px" }}>
                            <s-badge tone={getStatusTone(general.status)}>
                              {general.status}
                            </s-badge>
                          </td>
                          <td style={{ padding: "14px", fontSize: "13px" }}>
                            {general.method}
                          </td>
                          <td style={{ padding: "14px", fontSize: "13px" }}>
                            {getEligibility(promotion)}
                          </td>
                          <td style={{ padding: "14px", fontSize: "13px" }}>
                            {general.type}
                          </td>
                          <td style={{ padding: "14px" }}>
                            <s-badge
                              tone={promotion.settings.included ? "success" : "neutral"}
                            >
                              {promotion.settings.included ? "Included" : "Excluded"}
                            </s-badge>
                          </td>
                          <td style={{ padding: "14px", fontSize: "13px" }}>
                            {getPromotionValue(promotion)}
                          </td>
                          <td
                            style={{
                              padding: "14px",
                              textAlign: "right",
                            }}
                          >
                            <s-button
                              href={`/app/promotions/${promotion.routeId}`}
                              variant="secondary"
                            >
                              View
                            </s-button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </s-stack>
      </div>
    </s-page>
  );
}
