import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";
import { getDiscounts } from "../modules/promotions/services/discounts.server";
import { mapDiscountsToPromotions } from "../modules/promotions/services/promotionMapper";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  const discountNodes = await getDiscounts(admin);
  const promotions = mapDiscountsToPromotions(discountNodes);

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
          <s-stack direction="block" gap="base">
            {promotions.map((promotion) => (
              <s-box
                key={promotion.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="small">
                  <s-heading>{promotion.title}</s-heading>

                  <s-paragraph>
                    {promotion.summary}
                  </s-paragraph>

                  <s-paragraph>
                    Status: {promotion.status}
                  </s-paragraph>

                  <s-paragraph>
                    Method: {promotion.method}
                  </s-paragraph>

                  <s-paragraph>
                    Type: {promotion.type}
                  </s-paragraph>

                  <s-paragraph>
                    Value: {promotion.value}
                  </s-paragraph>

                  {promotion.code && (
                    <s-paragraph>
                      Code: {promotion.code}
                    </s-paragraph>
                  )}

                  <s-paragraph>
                    Applies to: {promotion.appliesTo}
                  </s-paragraph>

                  <s-paragraph>
                    Minimum requirement:{" "}
                    {promotion.minimumRequirement}
                  </s-paragraph>

                  <s-paragraph>
                    Created by: {promotion.createdBy}
                  </s-paragraph>

                  <s-paragraph>
                    Promotion sync:{" "}
                    {promotion.includedInSync
                      ? "Included"
                      : "Excluded"}
                  </s-paragraph>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-stack>
    </s-page>
  );
}
