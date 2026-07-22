import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";
import { getDiscounts } from "../modules/promotions/services/discounts.server";
import { mapDiscountsToPromotions } from "../modules/promotions/services/promotionMapper";
import { attachPromotionSettings } from "../modules/promotions/services/promotionSettings.server";

export async function loader({
  request,
  params,
}: LoaderFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);

  const promotionId = params.promotionId;

  if (!promotionId) {
    throw new Response("Promotion ID is required", {
      status: 400,
    });
  }

  const discountNodes = await getDiscounts(admin);

  const mappedPromotions =
    mapDiscountsToPromotions(discountNodes);

  const promotions = await attachPromotionSettings(
    session.shop,
    mappedPromotions,
  );

  const promotion = promotions.find(
    (item) => item.routeId === promotionId,
  );

  if (!promotion) {
    throw new Response("Promotion not found", {
      status: 404,
    });
  }

  return { promotion };
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PromotionDetailsPage() {
  const { promotion } =
    useLoaderData<typeof loader>();

  return (
    <s-page
      heading={promotion.title}
      backAction="/app/promotions"
    >
      <s-stack direction="block" gap="large">
        <s-section heading="Promotion overview">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              {promotion.summary}
            </s-paragraph>

            <s-stack
              direction="inline"
              gap="base"
            >
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

              <s-badge>
                {promotion.method}
              </s-badge>

              <s-badge>
                {promotion.type}
              </s-badge>
            </s-stack>
          </s-stack>
        </s-section>

        <s-section heading="Shopify discount">
          <s-stack direction="block" gap="base">
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
              Starts: {formatDate(promotion.startsAt)}
            </s-paragraph>

            <s-paragraph>
              Ends: {formatDate(promotion.endsAt)}
            </s-paragraph>
          </s-stack>
        </s-section>

        <s-section heading="Website settings">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Sync status:{" "}
              {promotion.settings.included
                ? "Included"
                : "Excluded"}
            </s-paragraph>

            <s-paragraph>
              Website enabled:{" "}
              {promotion.settings.websiteEnabled
                ? "Yes"
                : "No"}
            </s-paragraph>

            <s-paragraph>
              Product page:{" "}
              {promotion.settings.showProductPage
                ? "Enabled"
                : "Disabled"}
            </s-paragraph>

            <s-paragraph>
              Collection page:{" "}
              {promotion.settings.showCollectionPage
                ? "Enabled"
                : "Disabled"}
            </s-paragraph>

            <s-paragraph>
              Product badge:{" "}
              {promotion.settings.showProductBadge
                ? "Enabled"
                : "Disabled"}
            </s-paragraph>

            <s-paragraph>
              Countdown:{" "}
              {promotion.settings.showCountdown
                ? "Enabled"
                : "Disabled"}
            </s-paragraph>

            <s-paragraph>
              Header banner:{" "}
              {promotion.settings.showHeaderBanner
                ? "Enabled"
                : "Disabled"}
            </s-paragraph>
          </s-stack>
        </s-section>

        <s-section heading="Messages">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Headline:{" "}
              {promotion.settings.headline ??
                "Not set"}
            </s-paragraph>

            <s-paragraph>
              Body:{" "}
              {promotion.settings.body ??
                "Not set"}
            </s-paragraph>

            <s-paragraph>
              Badge text:{" "}
              {promotion.settings.badgeText ??
                "Not set"}
            </s-paragraph>

            <s-paragraph>
              Countdown text:{" "}
              {promotion.settings.countdownText ??
                "Not set"}
            </s-paragraph>

            <s-paragraph>
              Button text:{" "}
              {promotion.settings.buttonText ??
                "Not set"}
            </s-paragraph>

            <s-paragraph>
              Button URL:{" "}
              {promotion.settings.buttonUrl ??
                "Not set"}
            </s-paragraph>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
