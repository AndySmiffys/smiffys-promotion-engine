import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

type PromotionTab =
  | "general"
  | "website"
  | "messages";

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

  const [messages, setMessages] = useState({
    headline: promotion.settings.headline ?? "",
    body: promotion.settings.body ?? "",
    badgeText: promotion.settings.badgeText ?? "",
    countdownText:
      promotion.settings.countdownText ?? "",
    buttonText:
      promotion.settings.buttonText ?? "",
    buttonUrl:
      promotion.settings.buttonUrl ?? "",
    backgroundColour:
      promotion.settings.backgroundColour ??
      "#ffffff",
    textColour:
      promotion.settings.textColour ??
      "#000000",
    badgeColour:
      promotion.settings.badgeColour ??
      "#d72c0d",
    priority: String(
      promotion.settings.priority ?? 0,
    ),
  });

  const [activeTab, setActiveTab] =
    useState<PromotionTab>("general");

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

    setMessages({
      headline: promotion.settings.headline ?? "",
      body: promotion.settings.body ?? "",
      badgeText: promotion.settings.badgeText ?? "",
      countdownText:
        promotion.settings.countdownText ?? "",
      buttonText:
        promotion.settings.buttonText ?? "",
      buttonUrl:
        promotion.settings.buttonUrl ?? "",
      backgroundColour:
        promotion.settings.backgroundColour ??
        "#ffffff",
      textColour:
        promotion.settings.textColour ??
        "#000000",
      badgeColour:
        promotion.settings.badgeColour ??
        "#d72c0d",
      priority: String(
        promotion.settings.priority ?? 0,
      ),
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
    promotion.settings.headline,
    promotion.settings.body,
    promotion.settings.badgeText,
    promotion.settings.countdownText,
    promotion.settings.buttonText,
    promotion.settings.buttonUrl,
    promotion.settings.backgroundColour,
    promotion.settings.textColour,
    promotion.settings.badgeColour,
    promotion.settings.priority,
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

  function updateMessage(
    name: keyof typeof messages,
    value: string,
  ) {
    setMessages((current) => ({
      ...current,
      [name]: value,
    }));
  }

  const hasUnsavedChanges = useMemo(() => {
    const savedSettings = {
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
    };

    const savedMessages = {
      headline:
        promotion.settings.headline ?? "",
      body:
        promotion.settings.body ?? "",
      badgeText:
        promotion.settings.badgeText ?? "",
      countdownText:
        promotion.settings.countdownText ?? "",
      buttonText:
        promotion.settings.buttonText ?? "",
      buttonUrl:
        promotion.settings.buttonUrl ?? "",
      backgroundColour:
        promotion.settings.backgroundColour ??
        "#ffffff",
      textColour:
        promotion.settings.textColour ??
        "#000000",
      badgeColour:
        promotion.settings.badgeColour ??
        "#d72c0d",
      priority: String(
        promotion.settings.priority ?? 0,
      ),
    };

    return (
      JSON.stringify(settings) !==
      JSON.stringify(savedSettings) ||
      JSON.stringify(messages) !==
      JSON.stringify(savedMessages)
    );
  }, [
    settings,
    messages,
    promotion.settings,
  ]);

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

        <s-section>
          <s-stack direction="inline" gap="base">
            <s-button
              type="button"
              variant={
                activeTab === "general"
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setActiveTab("general")}
            >
              General
            </s-button>

            <s-button
              type="button"
              variant={
                activeTab === "website"
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setActiveTab("website")}
            >
              Website
            </s-button>

            <s-button
              type="button"
              variant={
                activeTab === "messages"
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setActiveTab("messages")}
            >
              Messages
            </s-button>
          </s-stack>
        </s-section>

        <Form method="post">
          <input
            type="hidden"
            name="shopifyDiscountId"
            value={promotion.id}
          />

          {/* General tab */}
          <div
            style={{
              display:
                activeTab === "general"
                  ? "block"
                  : "none",
            }}
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
                    Ends: {formatDate(promotion.endsAt)}
                  </s-paragraph>
                </s-stack>
              </s-section>
            </s-stack>
          </div>

          {/* Website tab */}
          <div
            style={{
              display:
                activeTab === "website"
                  ? "block"
                  : "none",
            }}
          >
            <s-section heading="Website settings">
              <s-stack direction="block" gap="base">
                <s-checkbox
                  name="included"
                  value="true"
                  label="Include in promotion sync"
                  details="Allow this promotion to be processed by the website promotion sync."
                  checked={
                    settings.included
                      ? true
                      : undefined
                  }
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
                  checked={
                    settings.websiteEnabled
                      ? true
                      : undefined
                  }
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
                  checked={
                    settings.showProductPage
                      ? true
                      : undefined
                  }
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
                  checked={
                    settings.showCollectionPage
                      ? true
                      : undefined
                  }
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
                  checked={
                    settings.showProductBadge
                      ? true
                      : undefined
                  }
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
                  checked={
                    settings.showCountdown
                      ? true
                      : undefined
                  }
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
                  checked={
                    settings.showHeaderBanner
                      ? true
                      : undefined
                  }
                  onChange={(event) =>
                    updateSetting(
                      "showHeaderBanner",
                      event.currentTarget.checked,
                    )
                  }
                />
              </s-stack>
            </s-section>
          </div>

          {/* Messages tab */}
          <div
            style={{
              display:
                activeTab === "messages"
                  ? "block"
                  : "none",
            }}
          >
            <s-section heading="Promotion messages">
              <s-stack direction="block" gap="base">
                <s-text-field
                  name="headline"
                  label="Headline"
                  details="Main promotion message displayed to customers."
                  placeholder="Save 20% today"
                  value={messages.headline}
                  maxLength={120}
                  onInput={(event) =>
                    updateMessage(
                      "headline",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-text-area
                  name="body"
                  label="Body"
                  details="Supporting promotion text."
                  placeholder="Promotion applies to selected products while stocks last."
                  value={messages.body}
                  maxLength={500}
                  rows={4}
                  onInput={(event) =>
                    updateMessage(
                      "body",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-text-field
                  name="badgeText"
                  label="Badge text"
                  placeholder="20% OFF"
                  value={messages.badgeText}
                  maxLength={40}
                  onInput={(event) =>
                    updateMessage(
                      "badgeText",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-text-field
                  name="countdownText"
                  label="Countdown text"
                  placeholder="Offer ends in"
                  value={messages.countdownText}
                  maxLength={80}
                  onInput={(event) =>
                    updateMessage(
                      "countdownText",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-text-field
                  name="buttonText"
                  label="Button text"
                  placeholder="Shop now"
                  value={messages.buttonText}
                  maxLength={60}
                  onInput={(event) =>
                    updateMessage(
                      "buttonText",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-url-field
                  name="buttonUrl"
                  label="Button URL"
                  placeholder="https://www.example.com/collections/sale"
                  value={messages.buttonUrl}
                  onInput={(event) =>
                    updateMessage(
                      "buttonUrl",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-number-field
                  name="priority"
                  label="Priority"
                  details="Higher-priority promotions can be displayed before lower-priority promotions."
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={messages.priority}
                  onInput={(event) =>
                    updateMessage(
                      "priority",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-color-field
                  name="backgroundColour"
                  label="Background colour"
                  value={messages.backgroundColour}
                  onInput={(event) =>
                    updateMessage(
                      "backgroundColour",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-color-field
                  name="textColour"
                  label="Text colour"
                  value={messages.textColour}
                  onInput={(event) =>
                    updateMessage(
                      "textColour",
                      event.currentTarget.value,
                    )
                  }
                />

                <s-color-field
                  name="badgeColour"
                  label="Badge colour"
                  value={messages.badgeColour}
                  onInput={(event) =>
                    updateMessage(
                      "badgeColour",
                      event.currentTarget.value,
                    )
                  }
                />
              </s-stack>
            </s-section>
          </div>

          {/* Sticky save area */}
          <div
            style={{
              position: "sticky",
              bottom: "16px",
              zIndex: 20,
              marginTop: "24px",
              paddingBottom: "8px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #d9d9d9",
                borderRadius: "12px",
                boxShadow:
                  "0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)",
                padding: "16px",
              }}
            >
              <s-stack direction="block" gap="base">
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

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <s-paragraph>
                    {hasUnsavedChanges
                      ? "You have unsaved changes."
                      : "All changes saved."}
                  </s-paragraph>

                  <s-button
                    type="submit"
                    variant="primary"
                    loading={isSaving}
                    disabled={isSaving || !hasUnsavedChanges}
                  >
                    {isSaving ? "Saving..." : "Save promotion"}
                  </s-button>
                </div>
              </s-stack>
            </div>
          </div>
        </Form>

    
      </s-stack>
    </s-page>
  );
}
