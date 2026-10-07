import { useMemo, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";

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

function getSummaryLines(summary: string): string[] {
  return summary
    .split(/\s*•\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function PromotionsPage() {
  const { promotions } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);

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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <s-button
                type="button"
                variant="primary"
                onClick={() => setShowCreateDiscount(true)}
              >
                Create discount
              </s-button>

              <s-button href="shopify:admin/discounts" target="_blank">
                Open Shopify discounts
              </s-button>
            </div>
          </div>

          <style>{`
            .promotion-filters {
              display: grid;
              grid-template-columns: minmax(0, 1fr) 180px;
              gap: 12px;
              padding: 12px;
              border-bottom: 1px solid #ebebeb;
              background: #fafafa;
            }

            .promotion-list-header,
            .promotion-list-row {
              display: grid;
              grid-template-columns:
                minmax(220px, 2.4fr)
                minmax(84px, 0.75fr)
                minmax(70px, 0.65fr)
                minmax(110px, 1fr)
                minmax(92px, 0.9fr)
                minmax(92px, 0.85fr)
                minmax(72px, 0.7fr)
                64px;
              column-gap: 12px;
              align-items: center;
            }

            .promotion-list-header {
              padding: 11px 14px;
              border-bottom: 1px solid #ebebeb;
              background: #fafafa;
              color: #616161;
              font-size: 12px;
              font-weight: 650;
            }

            .promotion-list-row {
              padding: 14px;
              border-bottom: 1px solid #eeeeee;
            }

            .promotion-list-row:last-child {
              border-bottom: 0;
            }

            .promotion-list-cell {
              min-width: 0;
              overflow-wrap: anywhere;
              font-size: 13px;
            }

            .promotion-mobile-label {
              display: none;
              margin-bottom: 4px;
              color: #616161;
              font-size: 11px;
              font-weight: 650;
            }

            .promotion-summary-lines {
              display: grid;
              gap: 2px;
              margin-top: 4px;
              color: #616161;
              font-size: 12px;
              line-height: 1.4;
            }

            .promotion-summary-line {
              display: block;
            }

            @media (max-width: 980px) {
              .promotion-list-header,
              .promotion-list-row {
                grid-template-columns:
                  minmax(200px, 2fr)
                  minmax(78px, 0.7fr)
                  minmax(72px, 0.65fr)
                  minmax(110px, 1fr)
                  minmax(90px, 0.85fr)
                  minmax(86px, 0.8fr)
                  minmax(68px, 0.65fr)
                  58px;
                column-gap: 8px;
              }

              .promotion-list-row {
                padding: 12px;
              }

              .promotion-list-header {
                padding: 10px 12px;
              }
            }

            @media (max-width: 760px) {
              .promotion-filters {
                grid-template-columns: 1fr;
              }

              .promotion-list-header {
                display: none;
              }

              .promotion-list-row {
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 14px 18px;
                align-items: start;
                padding: 16px;
              }

              .promotion-list-title {
                grid-column: 1 / -1;
              }

              .promotion-list-action {
                grid-column: 1 / -1;
                text-align: left !important;
              }

              .promotion-mobile-label {
                display: block;
              }
            }

            @media (max-width: 480px) {
              .promotion-list-row {
                grid-template-columns: 1fr;
              }

              .promotion-list-title,
              .promotion-list-action {
                grid-column: 1;
              }
            }
          `}</style>

          <section
            style={{
              overflow: "hidden",
              border: "1px solid #dedede",
              borderRadius: "12px",
              background: "#ffffff",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="promotion-filters">
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
              <div>
                <div className="promotion-list-header" aria-hidden="true">
                  <div>Title</div>
                  <div>Status</div>
                  <div>Method</div>
                  <div>Eligibility</div>
                  <div>Type</div>
                  <div>Website</div>
                  <div>Value</div>
                  <div />
                </div>

                {filteredPromotions.map((promotion) => {
                  const general = promotion.shopify.general;
                  const summaryLines = getSummaryLines(general.summary);

                  return (
                    <div
                      key={promotion.id}
                      className="promotion-list-row"
                    >
                      <div className="promotion-list-cell promotion-list-title">
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

                        {summaryLines.length > 0 && (
                          <div className="promotion-summary-lines">
                            {summaryLines.map((line, index) => (
                              <span
                                key={`${promotion.id}-summary-${index}`}
                                className="promotion-summary-line"
                              >
                                {line}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="promotion-list-cell">
                        <span className="promotion-mobile-label">Status</span>
                        <s-badge tone={getStatusTone(general.status)}>
                          {general.status}
                        </s-badge>
                      </div>

                      <div className="promotion-list-cell">
                        <span className="promotion-mobile-label">Method</span>
                        {general.method}
                      </div>

                      <div className="promotion-list-cell">
                        <span className="promotion-mobile-label">Eligibility</span>
                        {getEligibility(promotion)}
                      </div>

                      <div className="promotion-list-cell">
                        <span className="promotion-mobile-label">Type</span>
                        {general.type}
                      </div>

                      <div className="promotion-list-cell">
                        <span className="promotion-mobile-label">Website</span>
                        <s-badge
                          tone={promotion.settings.included ? "success" : "neutral"}
                        >
                          {promotion.settings.included ? "Included" : "Excluded"}
                        </s-badge>
                      </div>

                      <div className="promotion-list-cell">
                        <span className="promotion-mobile-label">Value</span>
                        {getPromotionValue(promotion)}
                      </div>

                      <div
                        className="promotion-list-cell promotion-list-action"
                        style={{ textAlign: "right" }}
                      >
                        <s-button
                          href={`/app/promotions/${promotion.routeId}`}
                          variant="secondary"
                        >
                          View
                        </s-button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </s-stack>
      </div>

      {showCreateDiscount && (
        <div
          role="presentation"
          onClick={() => setShowCreateDiscount(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(0, 0, 0, 0.48)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-discount-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(100%, 560px)",
              overflow: "hidden",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow: "0 18px 48px rgba(0, 0, 0, 0.24)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "18px 20px 14px",
              }}
            >
              <div
                id="create-discount-title"
                style={{
                  color: "#202223",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                Select discount type
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowCreateDiscount(false)}
                style={{
                  width: "34px",
                  height: "34px",
                  border: "1px solid #dedede",
                  borderRadius: "10px",
                  background: "#ffffff",
                  color: "#202223",
                  fontSize: "20px",
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {[
              {
                type: "product",
                title: "Amount off products",
                description: "Discount specific products or collections of products",
                icon: "◇",
              },
              {
                type: "bxgy",
                title: "Buy X get Y",
                description: "Discount specific products or collections of products",
                icon: "◇",
              },
              {
                type: "order",
                title: "Amount off order",
                description: "Discount the total order amount",
                icon: "▭",
              },
              {
                type: "shipping",
                title: "Free shipping",
                description: "Offer free shipping on an order",
                icon: "♧",
              },
            ].map((discountType) => (
              <button
                key={discountType.type}
                type="button"
                onClick={() => {
                  setShowCreateDiscount(false);
                  navigate(`/app/promotions/new?type=${discountType.type}`);
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px minmax(0, 1fr) 20px",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "15px 20px",
                  border: "0",
                  borderTop: "1px solid #eeeeee",
                  background: "#ffffff",
                  color: "#202223",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: "18px",
                    textAlign: "center",
                  }}
                >
                  {discountType.icon}
                </span>

                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 650,
                    }}
                  >
                    {discountType.title}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: "3px",
                      color: "#616161",
                      fontSize: "12px",
                      lineHeight: 1.4,
                    }}
                  >
                    {discountType.description}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  style={{
                    color: "#616161",
                    fontSize: "20px",
                    textAlign: "right",
                  }}
                >
                  ›
                </span>
              </button>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "14px 20px 18px",
                borderTop: "1px solid #eeeeee",
              }}
            >
              <s-button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateDiscount(false)}
              >
                Cancel
              </s-button>
            </div>
          </div>
        </div>
      )}
    </s-page>
  );
}
