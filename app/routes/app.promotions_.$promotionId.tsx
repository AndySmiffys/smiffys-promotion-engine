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

function getOptionalString(
  formData: FormData,
  name: string,
): string | null {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : null;
}

function getPriority(formData: FormData): number {
  const value = formData.get("priority");

  if (typeof value !== "string") {
    return 0;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(0, parsedValue);
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

        headline:
          getOptionalString(formData, "headline"),

        body:
          getOptionalString(formData, "body"),

        badgeText:
          getOptionalString(formData, "badgeText"),

        countdownText:
          getOptionalString(
            formData,
            "countdownText",
          ),

        buttonText:
          getOptionalString(formData, "buttonText"),

        buttonUrl:
          getOptionalString(formData, "buttonUrl"),

        backgroundColour:
          getOptionalString(
            formData,
            "backgroundColour",
          ),

        textColour:
          getOptionalString(formData, "textColour"),

        badgeColour:
          getOptionalString(formData, "badgeColour"),

        priority: getPriority(formData),
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

              <s-section heading="Messages">
                <s-stack direction="block" gap="base">
                  <s-text-field
                    name="headline"
                    label="Headline"
                    details="Main promotion message displayed to customers."
                    placeholder="Save 20% today"
                    defaultValue={
                      promotion.settings.headline ?? ""
                    }
                    maxLength={120}
                  />

                  <s-text-area
                    name="body"
                    label="Body"
                    details="Supporting promotion text."
                    placeholder="Promotion applies to selected products while stocks last."
                    defaultValue={
                      promotion.settings.body ?? ""
                    }
                    maxLength={500}
                    rows={4}
                  />

                  <s-text-field
                    name="badgeText"
                    label="Badge text"
                    placeholder="20% OFF"
                    defaultValue={
                      promotion.settings.badgeText ?? ""
                    }
                    maxLength={40}
                  />

                  <s-text-field
                    name="countdownText"
                    label="Countdown text"
                    placeholder="Offer ends in"
                    defaultValue={
                      promotion.settings.countdownText ?? ""
                    }
                    maxLength={80}
                  />

                  <s-text-field
                    name="buttonText"
                    label="Button text"
                    placeholder="Shop now"
                    defaultValue={
                      promotion.settings.buttonText ?? ""
                    }
                    maxLength={60}
                  />

                  <s-url-field
                    name="buttonUrl"
                    label="Button URL"
                    placeholder="https://www.example.com/collections/sale"
                    defaultValue={
                      promotion.settings.buttonUrl ?? ""
                    }
                  />

                  <s-number-field
                    name="priority"
                    label="Priority"
                    details="Higher-priority promotions can be shown before lower-priority promotions."
                    min={0}
                    step={1}
                    inputMode="numeric"
                    defaultValue={String(
                      promotion.settings.priority,
                    )}
                  />

                  <s-color-field
                    name="backgroundColour"
                    label="Background colour"
                    defaultValue={
                      promotion.settings.backgroundColour ??
                      "#ffffff"
                    }
                  />

                  <s-color-field
                    name="textColour"
                    label="Text colour"
                    defaultValue={
                      promotion.settings.textColour ??
                      "#000000"
                    }
                  />

                  <s-color-field
                    name="badgeColour"
                    label="Badge colour"
                    defaultValue={
                      promotion.settings.badgeColour ??
                      "#d72c0d"
                    }
                  />
                </s-stack>
              </s-section>

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

    
      </s-stack>
    </s-page>
  );
}
