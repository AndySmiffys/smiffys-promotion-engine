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

import {
  getDiscount,
  getDiscountNodeId,
} from "../modules/promotions/services/discount.server";

import { mapDiscountToPromotion } from "../modules/promotions/mappers/promotionMapper";

import { getPromotionCoverage } from "../modules/promotions/coverage/coverage.server";

import {
  PromotionTabs,
  type PromotionTab,
} from "../modules/promotions/components/PromotionTabs";

import { PromotionGeneralTab } from "../modules/promotions/components/PromotionGeneralTab";

import { PromotionProductsTab } from "../modules/promotions/components/PromotionProductsTab";

import { PromotionCustomersTab } from "../modules/promotions/components/PromotionCustomersTab";

import { PromotionConditionsTab } from "../modules/promotions/components/PromotionConditionsTab";

import { PromotionScheduleTab } from "../modules/promotions/components/PromotionScheduleTab";

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
    throw new Response(
      "Promotion ID is required",
      {
        status: 400,
      },
    );
  }

  const discountNode = await getDiscount(
    admin,
    getDiscountNodeId(promotionId),
  );

  if (!discountNode) {
    throw new Response(
      "Promotion not found",
      {
        status: 404,
      },
    );
  }

  const mappedPromotion =
    mapDiscountToPromotion(discountNode);

  const [promotion] =
    await attachPromotionSettings(
      session.shop,
      [mappedPromotion],
    );

  if (!promotion) {
    throw new Response(
      "Promotion could not be loaded",
      {
        status: 500,
      },
    );
  }

  const selectedCollections =
    promotion.shopify.products.collections;

  const coverage =
    selectedCollections.length > 0
      ? await getPromotionCoverage(
        admin,
        selectedCollections,
      )
      : null;

  return {
    promotion,
    coverage,
  };
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
  const { promotion, coverage } =
    useLoaderData<typeof loader>();

  const general = promotion.shopify.general;

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

  function resetFormState() {
    setSettings({
      included: promotion.settings.included,
      websiteEnabled: promotion.settings.websiteEnabled,
      showProductPage: promotion.settings.showProductPage,
      showCollectionPage: promotion.settings.showCollectionPage,
      showProductBadge: promotion.settings.showProductBadge,
      showCountdown: promotion.settings.showCountdown,
      showHeaderBanner: promotion.settings.showHeaderBanner,
    });

    setMessages({
      headline: promotion.settings.headline ?? "",
      body: promotion.settings.body ?? "",
      badgeText: promotion.settings.badgeText ?? "",
      countdownText: promotion.settings.countdownText ?? "",
      buttonText: promotion.settings.buttonText ?? "",
      buttonUrl: promotion.settings.buttonUrl ?? "",
      backgroundColour:
        promotion.settings.backgroundColour ?? "#ffffff",
      textColour:
        promotion.settings.textColour ?? "#000000",
      badgeColour:
        promotion.settings.badgeColour ?? "#d72c0d",
      priority: String(promotion.settings.priority ?? 0),
    });
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
    <s-page heading={general.title}>
      <s-stack
        direction="block"
        gap="large"
      >
        <s-stack direction="inline">
          <s-button
            href="/app/promotions"
            variant="secondary"
          >
            Back to promotions
          </s-button>
        </s-stack>

        <PromotionTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

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
            <PromotionGeneralTab promotion={promotion} />
          </div>

          {/* Products tab */}
          <div
            style={{
              display:
                activeTab === "products"
                  ? "block"
                  : "none",
            }}
          >
            <PromotionProductsTab
              promotion={promotion}
              coverage={coverage}
            />
          </div>

          {/* Customers tab */}
          <div
            style={{
              display:
                activeTab === "customers"
                  ? "block"
                  : "none",
            }}
          >
            <PromotionCustomersTab promotion={promotion} />
          </div>

          {/* Conditions tab */}
          <div
            style={{
              display:
                activeTab === "conditions"
                  ? "block"
                  : "none",
            }}
          >
            <PromotionConditionsTab promotion={promotion} />
          </div>

          {/* Schedule tab */}
          <div
            style={{
              display:
                activeTab === "schedule"
                  ? "block"
                  : "none",
            }}
          >
            <PromotionScheduleTab promotion={promotion} />
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

          {(hasUnsavedChanges || isSaving || actionData?.error) && (
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
                  backgroundColor: "#202223",
                  border: "1px solid #303234",
                  borderRadius: "12px",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.22), 0 1px 3px rgba(0, 0, 0, 0.16)",
                  padding: "14px 16px",
                }}
              >
                <s-stack direction="block" gap="base">
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
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <span
                      style={{
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      You have unsaved changes.
                    </span>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <s-button
                        type="button"
                        variant="secondary"
                        disabled={isSaving}
                        onClick={resetFormState}
                      >
                        Discard
                      </s-button>

                      <s-button
                        type="submit"
                        variant="primary"
                        loading={isSaving}
                        disabled={isSaving || !hasUnsavedChanges}
                      >
                        {isSaving ? "Saving..." : "Save promotion"}
                      </s-button>
                    </div>
                  </div>
                </s-stack>
              </div>
            </div>
          )}
        </Form>
      </s-stack>
    </s-page>
  );
}
