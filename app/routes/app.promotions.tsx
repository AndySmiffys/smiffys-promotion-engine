import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";

import { getDiscounts } from "../modules/promotions/services/discounts.server";

import { mapDiscountsToPromotions } from "../modules/promotions/mappers/promotionMapper";

import { attachPromotionSettings } from "../modules/promotions/services/promotionSettings.server";

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);

  const discountNodes =
    await getDiscounts(admin);

  const mappedPromotions =
    mapDiscountsToPromotions(discountNodes);

  const promotions =
    await attachPromotionSettings(
      session.shop,
      mappedPromotions,
    );

  return { promotions };
}

export default function PromotionsPage() {
  const { promotions } =
    useLoaderData<typeof loader>();

  return (
    <s-page heading="Promotions">
      <s-stack direction="block" gap="large">
        <s-section heading="Shopify discounts">
          <s-paragraph>
            Found {promotions.length} Shopify promotions.
          </s-paragraph>
        </s-section>

        {promotions.length === 0 ? (
          <s-section heading="No promotions found">
            <s-paragraph>
              Create a discount in Shopify and refresh this page.
            </s-paragraph>
          </s-section>
        ) : (
          <s-section padding="none">
            <s-table>
              <s-table-header-row>
                <s-table-header listSlot="primary">
                  Promotion
                </s-table-header>

                <s-table-header listSlot="inline">
                  Status
                </s-table-header>

                <s-table-header listSlot="labeled">
                  Method
                </s-table-header>

                <s-table-header listSlot="labeled">
                  Type
                </s-table-header>

                <s-table-header listSlot="labeled">
                  Value
                </s-table-header>

                <s-table-header listSlot="secondary">
                  Applies to
                </s-table-header>

                <s-table-header listSlot="labeled">
                  Created by
                </s-table-header>

                <s-table-header listSlot="inline">
                  Sync
                </s-table-header>
              </s-table-header-row>

              <s-table-body>
                {promotions.map((promotion) => {
                  const general =
                    promotion.shopify.general;

                  const products =
                    promotion.shopify.products;

                  const conditions =
                    promotion.shopify.conditions;

                  return (
                    <s-table-row key={promotion.id}>
                      <s-table-cell>
                        <s-stack
                          direction="block"
                          gap="small"
                        >
                          <s-link
                            href={`/app/promotions/${promotion.routeId}`}
                          >
                            <s-text>
                              <strong>{general.title}</strong>
                            </s-text>
                          </s-link>

                          <s-text tone="neutral">
                            {general.summary}
                          </s-text>

                          {general.code && (
                            <s-text tone="neutral">
                              Code: {general.code}
                            </s-text>
                          )}
                        </s-stack>
                      </s-table-cell>

                      <s-table-cell>
                        <s-badge
                          tone={
                            general.status === "ACTIVE"
                              ? "success"
                              : general.status ===
                                "SCHEDULED"
                                ? "info"
                                : general.status ===
                                  "EXPIRED"
                                  ? "critical"
                                  : "neutral"
                          }
                        >
                          {general.status}
                        </s-badge>
                      </s-table-cell>

                      <s-table-cell>
                        {general.method}
                      </s-table-cell>

                      <s-table-cell>
                        {general.type}
                      </s-table-cell>

                      <s-table-cell>
                        {general.value}
                      </s-table-cell>

                      <s-table-cell>
                        <s-stack
                          direction="block"
                          gap="small"
                        >
                          <s-text>
                            {products.appliesTo}
                          </s-text>

                          {conditions.minimumRequirement !==
                            "None" && (
                              <s-text tone="neutral">
                                Minimum:{" "}
                                {
                                  conditions.minimumRequirement
                                }
                              </s-text>
                            )}
                        </s-stack>
                      </s-table-cell>

                      <s-table-cell>
                        {general.createdBy}
                      </s-table-cell>

                      <s-table-cell>
                        <s-badge
                          tone={
                            promotion.settings.included
                              ? "success"
                              : "warning"
                          }
                        >
                          {promotion.settings.included
                            ? "Included"
                            : "Excluded"}
                        </s-badge>
                      </s-table-cell>
                    </s-table-row>
                  );
                })}
              </s-table-body>
            </s-table>
          </s-section>
        )}
      </s-stack>
    </s-page>
  );
}
