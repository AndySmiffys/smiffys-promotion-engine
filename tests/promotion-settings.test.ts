import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PrismaClient } from "@prisma/client";
import { defaultDesign, readWebsite, websiteStorage, websiteFromSettings, type WebsiteDraft } from "../app/modules/promotions/design/design";
import { promotionDiscountId } from "../app/modules/promotions/design/discountIdentity";
import { createShopifyPromotion, type CreateDiscountDraft } from "../app/modules/promotions/services/createPromotion.server";
import { getDiscount } from "../app/modules/promotions/services/discount.server";
import { getDiscounts } from "../app/modules/promotions/services/discounts.server";
import { buildUpdateDiscountMutation } from "../app/modules/promotions/services/updatePromotion.server";
import { attachPromotionSettings, updatePromotionWebsiteSettings } from "../app/modules/promotions/services/promotionSettings.server";
import { mapDiscountToPromotion } from "../app/modules/promotions/mappers/promotionMapper";
import type { ShopifyDiscountNode } from "../app/modules/promotions/types/discount";

const shop = "design-test.myshopify.com";
function website(): WebsiteDraft {
  return {
    included: true, websiteEnabled: true, showProductPage: true, showCollectionPage: true, showProductBadge: true, showCountdown: true, showHeaderBanner: true,
    headline: "Halloween campaign", body: "Costumes for the whole family", badgeText: "20% OFF", countdownText: "Hurry, ends in", buttonText: "Shop costumes", buttonUrl: "/collections/halloween",
    backgroundColour: "#123456", textColour: "#fedcba", badgeColour: "#abcd12", priority: 17,
    design: {
      ...defaultDesign(), preset: "campaign", desktopImage: "https://cdn.shopify.com/desktop.jpg", desktopImageId: "gid://shopify/MediaImage/111", mobileImage: "https://cdn.shopify.com/mobile.jpg", mobileImageId: "gid://shopify/MediaImage/222", imageAlt: "Halloween costumes",
      imageLayout: "full", focalX: 33, focalY: 66, overlay: 60, alignment: "center", bannerHeight: 400, spacing: 36, radius: 14, headingSize: 38, bodySize: 19,
      productOfferStyle: "double", productBorderColour: "#789abc", productBorderWidth: 6, copyCodeEnabled: true, copyCodeBackground: "#321fed", copyCodeColour: "#fabcde", buttonBackground: "#987654", buttonColour: "#fefefe", badgeTextColour: "#345678",
      overrides: { header: { headline: "Header offer", body: "Header body", buttonText: "Header CTA" }, collection: { headline: "Collection offer", body: "Collection body", buttonText: "Collection CTA" }, product: { headline: "Product offer", body: "Product body", buttonText: "Product CTA" }, badge: { headline: "BADGE", body: "Badge body", buttonText: "Badge CTA" } },
    },
  };
}
function draft(): CreateDiscountDraft {
  return { discountType: "order", method: "code", discountCode: "TEST20", automaticTitle: "Test offer", valueType: "percentage", discountValue: "20", appliesTo: "products", selectedProducts: [{ id: "gid://shopify/Product/1" }], selectedCollections: [], buyRequirement: "quantity", buyQuantity: "2", buyAmount: "", buyAppliesTo: "products", buySelection: [{ id: "gid://shopify/Product/1" }], getQuantity: "1", getAppliesTo: "products", getSelection: [{ id: "gid://shopify/Product/2" }], rewardType: "free", rewardValue: "", maxUsesPerOrder: false, usesPerOrder: "1", minimumRequirement: "none", minimumPurchaseAmount: "", minimumQuantity: "", limitTotalUses: false, totalUsageLimit: "", limitOncePerCustomer: false, combineProductDiscounts: false, combineOrderDiscounts: false, combineShippingDiscounts: false, productCombinationMode: "best", selectedCombinationTags: [], startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-10-31T23:59:00Z", eligibility: "all", selectedEligibility: [], countryMode: "all", countries: [], excludeShippingPrice: false, maximumShippingPrice: "" };
}
function node(id: string, method: "code" | "automatic" = "code"): ShopifyDiscountNode {
  return { id, events: { nodes: [] }, discount: { __typename: method === "code" ? "DiscountCodeBasic" : "DiscountAutomaticBasic", title: "Test offer", status: "ACTIVE", startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-10-31T23:59:00Z", discountClasses: ["ORDER"], codes: method === "code" ? { nodes: [{ code: "TEST20" }] } : undefined, context: { __typename: "DiscountBuyerSelectionAll", all: "ALL" }, customerGets: { value: { __typename: "DiscountPercentage", percentage: .2 }, items: { __typename: "AllDiscountItems", allItems: true } } } };
}
async function withDatabase(run: (database: PrismaClient) => Promise<void>) {
  const directory = mkdtempSync(join(tmpdir(), "promotion-settings-"));
  const database = new PrismaClient({ datasources: { db: { url: `file:${join(directory, "settings.sqlite")}` } } });
  try {
    for (const path of ["prisma/migrations/20260722120204_add_promotion_settings/migration.sql", "prisma/migrations/20261008093000_promotion_design/migration.sql"]) {
      for (const statement of readFileSync(path, "utf8").split(";").filter(s => s.trim())) await database.$executeRawUnsafe(statement);
    }
    await run(database);
  } finally { await database.$disconnect(); rmSync(directory, { recursive: true, force: true }); }
}

test("all create discount types retain every website field when reopened and listed with Shopify typed IDs", async () => withDatabase(async database => {
  let sequence = 100;
  for (const method of ["code", "automatic"] as const) for (const discountType of ["product", "order", "bxgy", "shipping"] as const) {
    const rules = { ...draft(), method, discountType };
    const typedId = `gid://shopify/${method === "code" ? "DiscountCodeNode" : "DiscountAutomaticNode"}/${sequence++}`;
    const rawNode = node(typedId, method);
    const savedId = await createShopifyPromotion({ graphql: async () => Response.json({ data: { result: { [method === "code" ? "codeDiscountNode" : "automaticDiscountNode"]: { id: typedId }, userErrors: [] } } }) }, rules);
    const design = readWebsite(website());
    await updatePromotionWebsiteSettings(shop, savedId, websiteStorage(design), database);
    const loaded = await getDiscount({ graphql: async () => Response.json({ data: { discountNode: rawNode } }) }, savedId);
    assert.equal(loaded?.id, savedId);
    const [detail] = await attachPromotionSettings(shop, [mapDiscountToPromotion(loaded!)], database);
    assert.deepEqual(websiteFromSettings(detail.settings), design);
    const listed = await getDiscounts({ graphql: async () => Response.json({ data: { discountNodes: { nodes: [rawNode] } } }) });
    const [listPromotion] = await attachPromotionSettings(shop, listed.map(mapDiscountToPromotion), database);
    assert.deepEqual(websiteFromSettings(listPromotion.settings), design);
    // The mapper is safe even when fed a raw Shopify response directly.
    assert.equal(mapDiscountToPromotion(rawNode).id, savedId);
  }
}));

test("older typed-ID saves reload, edits use one key, and other shops or discounts never inherit them", async () => withDatabase(async database => {
  const typedId = "gid://shopify/DiscountCodeNode/42";
  const canonical = promotionDiscountId(typedId);
  const initial = website();
  await database.promotionSettings.create({ data: { shop, shopifyDiscountId: typedId, ...websiteStorage(initial), updatedAt: new Date("2026-10-01") } });
  const promotion = mapDiscountToPromotion(node(typedId));
  const [legacy] = await attachPromotionSettings(shop, [promotion], database);
  assert.deepEqual(websiteFromSettings(legacy.settings), initial);
  const changed = { ...initial, websiteEnabled: false, headline: "Edited offer", design: { ...initial.design, desktopImage: "", desktopImageId: "", radius: 0 } };
  await updatePromotionWebsiteSettings(shop, typedId, websiteStorage(changed), database);
  assert.ok(await database.promotionSettings.findUnique({ where: { shop_shopifyDiscountId: { shop, shopifyDiscountId: canonical } } }));
  const [edited] = await attachPromotionSettings(shop, [promotion], database);
  assert.deepEqual(websiteFromSettings(edited.settings), changed);
  await updatePromotionWebsiteSettings(shop, canonical, websiteStorage(initial), database);
  assert.equal(await database.promotionSettings.count({ where: { shopifyDiscountId: canonical } }), 1);
  const [foreign] = await attachPromotionSettings("another.myshopify.com", [promotion], database);
  assert.equal(foreign.settings.headline, null);
  const [different] = await attachPromotionSettings(shop, [mapDiscountToPromotion(node("gid://shopify/DiscountCodeNode/43"))], database);
  assert.equal(different.settings.designJson, undefined);
}));

test("reopened code and automatic discounts still build valid native updates", async () => {
  for (const method of ["code", "automatic"] as const) {
    const typedId = `gid://shopify/${method === "code" ? "DiscountCodeNode" : "DiscountAutomaticNode"}/42`;
    const loaded = await getDiscount({ graphql: async () => Response.json({ data: { discountNode: node(typedId, method) } }) }, typedId);
    assert.equal(buildUpdateDiscountMutation(loaded!, { ...draft(), method }).variables.id, typedId);
  }
  assert.throws(() => promotionDiscountId("gid://shopify/Product/42"), /Invalid discount ID/);
});
