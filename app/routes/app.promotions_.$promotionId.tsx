import { useEffect, useState } from "react";

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";

import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { authenticate } from "../shopify.server";

import { getDiscounts } from "../modules/promotions/services/discounts.server";

import { mapDiscountsToPromotions } from "../modules/promotions/services/promotionMapper";

import {
  attachPromotionSettings,
  updatePromotionWebsiteSettings,
} from "../modules/promotions/services/promotionSettings.server";

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

export async function action({
  request,
  params,
}: ActionFunctionArgs) {
  const { session } =
    await authenticate.admin(request);

  const promotionId = params.promotionId;

  if (!promotionId) {
    return {
      success: false,
      error: "Promotion ID is required.",
    };
  }

  const formData = await request.formData();

  const shopifyDiscountId =
    formData.get("shopifyDiscountId");

  if (
    typeof shopifyDiscountId !== "string" ||
    !shopifyDiscountId.startsWith("gid://shopify/")
  ) {
    return {
      success: false,
      error: "The Shopify discount ID is invalid.",
    };
  }

  try {
    await updatePromotionWebsiteSettings(
      session.shop,
      shopifyDiscountId,
      {
        included: formData.has("included"),

        websiteEnabled:
          formData.has("websiteEnabled"),

        showProductPage:
          formData.has("showProductPage"),

        showCollectionPage:
          formData.has("showCollectionPage"),

        showProductBadge:
          formData.has("showProductBadge"),

        showCountdown:
          formData.has("showCountdown"),

        showHeaderBanner:
          formData.has("showHeaderBanner"),
      },
    );

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(
      "Failed to save promotion settings:",
      error,
    );

    return {
      success: false,
      error:
        "The promotion settings could not be saved.",
    };
  }
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type WebsiteSettingsState = {
  included: boolean;
  websiteEnabled: boolean;
  showProductPage: boolean;
  showCollectionPage: boolean;
  showProductBadge: boolean;
  showCountdown: boolean;
  showHeaderBanner: boolean;
};

export default function PromotionDetailsPage() {
  const { promotion } =
    useLoaderData<typeof loader>();

  const actionData =
    useActionData<typeof action>();

  const navigation = useNavigation();

  const isSaving =
    navigation.state === "submitting";

  const [settings, setSettings] =
    useState<WebsiteSettingsState>({
      included:
        promotion.settings.included,

      websiteEnabled:
        promotion.settings.websiteEnabled,

      showProductPage:
        promotion.settings.showProductPage,

      showCollectionPage:
        promotion.settings.showCollectionPage,

      showProductBadge:
        promotion.settings.showProductBadge,

      showCountdown:
        promotion.settings.showCountdown,

      showHeaderBanner:
        promotion.settings.showHeaderBanner,
    });

  useEffect(() => {
    setSettings({
      included:
        promotion.settings.included,

      websiteEnabled:
        promotion.settings.websiteEnabled,

      showProductPage:
        promotion.settings.showProductPage,

      showCollectionPage:
        promotion.settings.showCollectionPage,

      showProductBadge:
        promotion.settings.showProductBadge,

      showCountdown:
        promotion.settings.showCountdown,

      showHeaderBanner:
        promotion.settings.showHeaderBanner,
    });
  }, [
    promotion.id,
    promotion.settings.included,
    promotion.settings.websiteEnabled,
    promotion.settings.showProductPage,
    promotion.settings.showCollectionPage,
    promotion.settings.showProductBadge,
    promotion.settings.showCountdown,
    promotion.settings.showHeaderBanner,
  ]);

  function updateSetting(
    name: keyof WebsiteSettingsState,
    checked: boolean,
  ) {
    setSettings((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  return (
    <s-page
      heading={promotion.title}
      backAction="/app/promotions"
    >
      <s-stack direction="block" gap="large">
        {actionData?.success && (
          <s-banner tone="success">
            Promotion settings saved.
          </s-banner>
        )}

        {actionData?.error && (
          <s-banner tone="critical">
            {actionData.error}
          </s-banner>
        )}

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
                    : promotion.status ===
                      "SCHEDULED"
                      ? "info"
                      : promotion.status ===
                        "EXPIRED"
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
              Starts:{" "}
              {formatDate(promotion.startsAt)}
            </s-paragraph>

            <s-paragraph>
              Ends:{" "}
              {formatDate(promotion.endsAt)}
            </s-paragraph>
          </s-stack>
        </s-section>

        <Form method="post">
          <input
            type="hidden"
            name="shopifyDiscountId"
            value={promotion.id}
          />

          <s-section heading="Website settings">
            <s-stack direction="block" gap="base">
              <s-checkbox
                name="included"
                value="true"
                label="Include in promotion sync"
                details="Allow this promotion to be processed by the website promotion sync."
                checked={settings.included ? true : undefined}
                onChange={(event) =>
                  updateSetting(
                    "included",
                    event.currentTarget.checked,
                  )
                }
              />

              <s-checkbox
                name="websiteEnabled"
                value="true"
                label="Enable website promotion"
                details="Allow promotional messaging for this promotion to appear on the website."
                checked={settings.websiteEnabled ? true : undefined}
                onChange={(event) =>
                  updateSetting(
                    "websiteEnabled",
                    event.currentTarget.checked,
                  )
                }
              />

              <s-checkbox
                name="showProductPage"
                value="true"
                label="Show on product pages"
                checked={settings.showProductPage ? true : undefined}
                onChange={(event) =>
                  updateSetting(
                    "showProductPage",
                    event.currentTarget.checked,
                  )
                }
              />

              <s-checkbox
                name="showCollectionPage"
                value="true"
                label="Show on collection pages"
                checked={settings.showCollectionPage ? true : undefined}
                onChange={(event) =>
                  updateSetting(
                    "showCollectionPage",
                    event.currentTarget.checked,
                  )
                }
              />

              <s-checkbox
                name="showProductBadge"
                value="true"
                label="Show product badge"
                checked={settings.showProductBadge ? true : undefined}
                onChange={(event) =>
                  updateSetting(
                    "showProductBadge",
                    event.currentTarget.checked,
                  )
                }
              />

              <s-checkbox
                name="showCountdown"
                value="true"
                label="Show countdown"
                checked={settings.showCountdown ? true : undefined}
                onChange={(event) =>
                  updateSetting(
                    "showCountdown",
                    event.currentTarget.checked,
                  )
                }
              />

              <s-checkbox
                name="showHeaderBanner"
                value="true"
                label="Show header banner"
                checked={settings.showHeaderBanner ? true : undefined}
                onChange={(event) =>
                  updateSetting(
                    "showHeaderBanner",
                    event.currentTarget.checked,
                  )
                }
              />

              <s-stack
                direction="inline"
                gap="base"
              >
                <s-button
                  type="submit"
                  variant="primary"
                  loading={isSaving}
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving"
                    : "Save settings"}
                </s-button>
              </s-stack>
            </s-stack>
          </s-section>
        </Form>

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
