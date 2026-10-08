import { useEmbeddedAppUrl } from "../modules/navigation/embeddedAppUrl";
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
import { readWebsite, websiteFromSettings, websiteStorage, validateWebsite } from "../modules/promotions/design/design";
import { PromotionWebsiteEditor } from "../modules/promotions/components/PromotionWebsiteEditor";
import { PromotionPreview } from "../modules/promotions/components/PromotionPreview";
import { getPreviewProducts } from "../modules/promotions/services/previewProducts.server";

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

  const previewProducts = await getPreviewProducts(admin, [...promotion.shopify.products.products.map(p=>p.id), ...promotion.shopify.products.variants.flatMap(v=>v.productId ? [v.productId] : [])], selectedCollections.map(c=>c.id));
  return { promotion, coverage, previewProducts };
}
export async function action({
  request,
  params,
}: ActionFunctionArgs) {
  const { admin, session } =
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
    if (shopifyDiscountId.split("/").pop() !== promotionId.split("/").pop()) throw new Error("The discount does not match this page.");
    const discount = await getDiscount(admin, shopifyDiscountId);
    if (!discount) throw new Error("This discount no longer exists.");
    const website = readWebsite(JSON.parse(String(formData.get("website") ?? "{}")));
    const errors = validateWebsite(website, discount.discount.endsAt);
    if (errors.length) throw new Error(errors.join(" "));
    await updatePromotionWebsiteSettings(session.shop, shopifyDiscountId, websiteStorage(website));

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
        error instanceof Error ? error.message : "The promotion settings could not be saved.",
    };
  }
}

export default function PromotionDetailsPage() {
  const appUrl = useEmbeddedAppUrl();
  const { promotion, coverage, previewProducts } =
    useLoaderData<typeof loader>();

  const general = promotion.shopify.general;

  const actionData =
    useActionData<typeof action>();

  const navigation = useNavigation();

  const isSaving =
    navigation.state === "submitting";

  const savedWebsite = useMemo(() => websiteFromSettings(promotion.settings), [promotion.settings]);
  const [website, setWebsite] = useState(savedWebsite);
  const [assetsBusy, setAssetsBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<PromotionTab>("general");
  useEffect(() => { setWebsite(savedWebsite); }, [savedWebsite]);
  function resetFormState() { setWebsite(savedWebsite); }
  const hasUnsavedChanges = JSON.stringify(website) !== JSON.stringify(savedWebsite);

  return (
    <s-page heading={general.title}>
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <s-stack
          direction="block"
          gap="large"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <s-button
              href={appUrl("/app/promotions")}
              variant="secondary"
            >
              Back to promotions
            </s-button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <s-badge
                tone={
                  general.status === "ACTIVE"
                    ? "success"
                    : general.status === "SCHEDULED"
                      ? "info"
                      : general.status === "EXPIRED"
                        ? "critical"
                        : "neutral"
                }
              >
                {general.status}
              </s-badge>

              <s-button
                href={`shopify:admin/discounts/${promotion.routeId}`}
                target="_blank"
                variant="secondary"
              >
                Edit in Shopify
              </s-button>
            </div>
          </div>

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

          <input type="hidden" name="website" value={JSON.stringify(website)} />
          <div style={{ display: activeTab === "website" || activeTab === "messages" ? "grid" : "none", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: 20 }}>
            <PromotionWebsiteEditor value={website} onChange={setWebsite} endsAt={promotion.endsAt} onBusyChange={setAssetsBusy} />
            <div style={{ alignSelf: "start", position: "sticky", top: 20 }}><PromotionPreview discountCode={promotion.code} offerNote={promotion.code ? `Use code: ${promotion.code}` : "Applied automatically at checkout."} value={website} products={previewProducts} endsAt={promotion.endsAt} /></div>
          </div>

          {(hasUnsavedChanges || isSaving || actionData?.error) && (
            <div
              style={{
                position: "fixed",
                bottom: "16px",
                left: "16px",
                right: "16px",
                zIndex: 30,
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
                        disabled={isSaving || assetsBusy || !hasUnsavedChanges || validateWebsite(website, promotion.endsAt).length > 0}
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
      </div>
    </s-page>
  );
}
