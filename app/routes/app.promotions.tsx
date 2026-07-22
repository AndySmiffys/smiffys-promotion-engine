import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";
import { getDiscounts } from "../modules/promotions/services/discounts.server";
import { mapDiscountsToPromotions } from "../modules/promotions/services/promotionMapper";
import { attachPromotionSettings } from "../modules/promotions/services/promotionSettings.server";

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);

  const discountNodes = await getDiscounts(admin);

  const mappedPromotions =
    mapDiscountsToPromotions(discountNodes);

  const promotions = await attachPromotionSettings(
    session.shop,
    mappedPromotions,
  );

  return { promotions };
}

export default function PromotionsPage() {
  const { promotions } = useLoaderData<typeof loader>();

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
                  {promotions.map((promotion) => (
                    <s-table-row key={promotion.id}>
                      <s-table-cell>
                        <s-stack direction="block" gap="small">
                          <s-text fontWeight="semibold">
                            {promotion.title}
                          </s-text>

                          <s-text tone="subdued">
                            {promotion.summary}
                          </s-text>

                          {promotion.code && (
                            <s-text tone="subdued">
                              Code: {promotion.code}
                            </s-text>
                          )}
                        </s-stack>
                      </s-table-cell>

                      <s-table-cell>
                        <s-badge
                          tone={
                            promotion.status === "ACTIVE"
                              ? "success"
                              : promotion.status === "SCHEDULED"
                                ? "info"
                                : promotion.status === "EXPIRED"
                                  ? "critical"
                                  : "neutral"
                          }
                        >
                          {promotion.status}
                        </s-badge>
                      </s-table-cell>

                      <s-table-cell>
                        {promotion.method}
                      </s-table-cell>

                      <s-table-cell>
                        {promotion.type}
                      </s-table-cell>

                      <s-table-cell>
                        {promotion.value}
                      </s-table-cell>

                      <s-table-cell>
                        <s-stack direction="block" gap="small">
                          <s-text>{promotion.appliesTo}</s-text>

                          {promotion.minimumRequirement !== "None" && (
                            <s-text tone="subdued">
                              Minimum: {promotion.minimumRequirement}
                            </s-text>
                          )}
                        </s-stack>
                      </s-table-cell>

                      <s-table-cell>
                        {promotion.createdBy}
                      </s-table-cell>

                      <s-table-cell>
                        <s-badge
                          tone={
                            promotion.includedInSync
                              ? "success"
                              : "warning"
                          }
                        >
                          {promotion.includedInSync
                            ? "Included"
                            : "Excluded"}
                        </s-badge>
                      </s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            </s-section>
        )}
      </s-stack>
    </s-page>
  );
}
