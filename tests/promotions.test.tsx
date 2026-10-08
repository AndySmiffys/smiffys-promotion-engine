import { PolarisSelect, PolarisCheckbox } from "../app/modules/promotions/components/PolarisControls";
import { discountToEditorDraft, toLocalDateTime } from "../app/modules/promotions/design/editorDraft";
import { buildUpdateDiscountMutation, updateShopifyPromotion } from "../app/modules/promotions/services/updatePromotion.server";
import { getEditableDiscount } from "../app/modules/promotions/services/editableDiscount.server";
import { embeddedAppUrl } from "../app/modules/navigation/embeddedAppUrl";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultDesign, readDesign, readWebsite, websiteStorage, websiteFromSettings, validateWebsite, countdownParts, countdown, contrastRatio, presetDesign, type WebsiteDraft } from "../app/modules/promotions/design/design";
import { buildDiscountMutation, createShopifyPromotion, type CreateDiscountDraft } from "../app/modules/promotions/services/createPromotion.server";
import { resolvePromotionImage, uploadPromotionImage } from "../app/modules/promotions/services/promotionAssets.server";
import { PromotionOffer, promotionCss } from "../app/modules/promotions/components/PromotionPreview";
import { matchesStorefront, type StorefrontContext } from "../app/modules/promotions/services/storefrontEligibility.server";
import { mapDiscountToPromotion } from "../app/modules/promotions/mappers/promotionMapper";
import type { ShopifyDiscountNode } from "../app/modules/promotions/types/discount";
const website = (): WebsiteDraft => ({ included: true, websiteEnabled: true, showProductPage: true, showCollectionPage: true, showProductBadge: true, showHeaderBanner: true, showCountdown: false, headline: "Save today", body: "Selected costumes", badgeText: "20% OFF", countdownText: "Ends in", buttonText: "Shop now", buttonUrl: "/collections/sale", backgroundColour: "#ffffff", textColour: "#202223", badgeColour: "#d72c0d", priority: 3, design: defaultDesign() });
const draft = (): CreateDiscountDraft => ({ discountType: "product", method: "code", discountCode: "SAVE20", automaticTitle: "Save 20%", valueType: "percentage", discountValue: "20", appliesTo: "collections", selectedProducts: [], selectedCollections: [{ id: "gid://shopify/Collection/1" }], buyRequirement: "quantity", buyQuantity: "2", buyAmount: "50", buyAppliesTo: "products", buySelection: [{ id: "gid://shopify/Product/1" }], getQuantity: "1", getAppliesTo: "products", getSelection: [{ id: "gid://shopify/Product/2" }], rewardType: "free", rewardValue: "20", maxUsesPerOrder: true, usesPerOrder: "2", minimumRequirement: "none", minimumPurchaseAmount: "", minimumQuantity: "", limitTotalUses: false, totalUsageLimit: "", limitOncePerCustomer: false, combineProductDiscounts: false, combineOrderDiscounts: false, combineShippingDiscounts: false, productCombinationMode: "best", selectedCombinationTags: [], startsAt: "2026-10-07T00:00:00Z", endsAt: "2026-10-31T23:59:00Z", eligibility: "all", selectedEligibility: [], countries: [], maximumShippingPrice: "" });

test("all eight code/automatic discount types build the correct mutations", () => {
  for (const method of ["code", "automatic"] as const) for (const discountType of ["product", "order", "bxgy", "shipping"] as const) {
    const result = buildDiscountMutation({ ...draft(), method, discountType });
    const input = result.variables.input as Record<string, unknown>;
    assert.equal(input.title, method === "code" ? "SAVE20" : "Save 20%");
    assert.deepEqual(input.context, { all: "ALL" });
    assert.equal("code" in input, method === "code");
    assert.match(result.query, new RegExp(method === "code" ? "discountCode" : "discountAutomatic"));
    if (discountType === "shipping") assert.deepEqual(input.destination, { all: true });
    if (discountType === "order") assert.deepEqual((input.customerGets as { items: unknown }).items, { all: true });
    if (discountType === "bxgy") assert.equal((input.customerGets as { value: { discountOnQuantity: { effect: { percentage: number } } } }).value.discountOnQuantity.effect.percentage, 1);
  }
});
test("variant targeting never expands a partial selection to the full product", () => {
  const result = buildDiscountMutation({ ...draft(), appliesTo: "products", selectedProducts: [{ id: "gid://shopify/Product/1", variants: [{ id: "gid://shopify/ProductVariant/3" }], selectedVariantIds: ["gid://shopify/ProductVariant/3"] }] });
  const input = result.variables.input as { customerGets: { items: { products: { productsToAdd: string[]; productVariantsToAdd: string[] } } } };
  assert.deepEqual(input.customerGets.items.products, { productsToAdd: [], productVariantsToAdd: ["gid://shopify/ProductVariant/3"] });
  assert.throws(() => buildDiscountMutation({ ...draft(), appliesTo: "products", selectedProducts: [{ id: "gid://shopify/Product/1", variants: [{ id: "gid://shopify/ProductVariant/3" }], selectedVariantIds: [] }] }));
});
test("invalid values, dates, targeting and usage limits are rejected before Shopify writes", () => {
  for (const change of [{ discountValue: "101" }, { discountValue: "NaN" }, { discountCode: "" }, { endsAt: "2020-01-01" }, { eligibility: "customers", selectedEligibility: [] }, { limitTotalUses: true, totalUsageLimit: "0" }, { combineProductDiscounts: true, productCombinationMode: "multiple", selectedCombinationTags: [] }]) assert.throws(() => buildDiscountMutation({ ...draft(), ...change } as CreateDiscountDraft));
});
test("Shopify user errors surface and IDs normalize for the detail route", async () => {
  await assert.rejects(() => createShopifyPromotion({ graphql: async () => Response.json({ data: { result: { userErrors: [{ message: "Code already exists" }] } } }) }, draft()), /Code already exists/);
  assert.equal(await createShopifyPromotion({ graphql: async () => Response.json({ data: { result: { codeDiscountNode: { id: "gid://shopify/DiscountCodeNode/123" }, userErrors: [] } } }) }, draft()), "gid://shopify/DiscountNode/123");
});
test("designs and desktop/mobile images round-trip through persisted settings", () => {
  const value = website(); value.design.desktopImage = "https://cdn.shopify.com/desktop.jpg"; value.design.mobileImage = "https://cdn.shopify.com/mobile.jpg"; value.design.overrides.header.headline = "Short header";
  assert.deepEqual(websiteFromSettings(websiteStorage(readWebsite(value))), value);
  assert.equal(presetDesign("campaign", value.design).overrides.header.headline, "Short header");
});
test("validation catches missing links/countdowns, unsafe URLs and oversized copy", () => {
  assert.match(validateWebsite({ ...website(), showCountdown: true })[0], /end date/);
  assert.ok(validateWebsite({ ...website(), buttonUrl: "" }).some(e => e.includes("link")));
  assert.ok(validateWebsite({ ...website(), buttonUrl: "javascript:alert(1)" }).length);
  assert.ok(validateWebsite({ ...website(), headline: "x".repeat(121) }).length);
  assert.throws(() => readDesign({ desktopImage: "data:image/svg+xml,unsafe" }));
  assert.throws(() => readDesign({ radius: 999 }));
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
});
test("countdown reflects real dates and expired dates", () => {
  assert.equal(countdown("2026-10-09T01:01:00Z", Date.parse("2026-10-08T00:00:00Z")), "1d 1h 1m");
  assert.equal(countdown("2026-10-07T00:00:00Z", Date.parse("2026-10-08T00:00:00Z")), "Offer ended");
  assert.equal(countdown(null, Date.now()), "");
});
test("shared renderer escapes copy, honours colours/overrides and switches mobile images", () => {
  const value = website(); value.headline = '<script>alert("x")</script>'; value.design.overrides.header.headline = "Short headline"; value.design.desktopImage = "https://cdn.shopify.com/desktop.jpg"; value.design.mobileImage = "https://cdn.shopify.com/mobile.jpg"; value.design.imageLayout = "full"; value.design.buttonColour = "#00ff00";
  const desktop = renderToStaticMarkup(<PromotionOffer value={value} placement="collection" now={Date.now()} />);
  assert.ok(desktop.includes("&lt;script&gt;")); assert.ok(!desktop.includes("<script>")); assert.ok(desktop.includes("desktop.jpg")); assert.ok(desktop.includes("--pe-button-fg:#00ff00"));
  const mobile = renderToStaticMarkup(<PromotionOffer value={value} placement="collection" now={Date.now()} mobile />);
  assert.ok(mobile.includes("mobile.jpg"));
  const header = renderToStaticMarkup(<PromotionOffer value={value} placement="header" now={Date.now()} />);
  assert.ok(header.includes("Short headline"));
});
const node = (): ShopifyDiscountNode => ({ id: "gid://shopify/DiscountNode/1", events: { nodes: [] }, discount: { __typename: "DiscountCodeBasic", codes: { nodes: [{ code: "SAVE20" }] }, title: "Save", status: "ACTIVE", startsAt: "2026-10-01", endsAt: "2026-10-31", discountClasses: ["PRODUCT"], context: { __typename: "DiscountBuyerSelectionAll", all: "ALL" }, customerGets: { value: { __typename: "DiscountPercentage", percentage: .2 }, items: { __typename: "DiscountCollections", collections: { nodes: [{ id: "gid://shopify/Collection/1", title: "Sale" }] } } } } });
const context = (): StorefrontContext => ({ placement: "product", productId: "gid://shopify/Product/1", variantId: "gid://shopify/ProductVariant/3", collectionId: null, productCollectionIds: ["gid://shopify/Collection/1"], customerId: null, memberSegmentIds: [], now: Date.parse("2026-10-08") });
test("storefront eligibility checks active dates, products and signed customer/segment membership", () => {
  const p = mapDiscountToPromotion(node()); Object.assign(p.settings, websiteStorage(website()));
  assert.equal(matchesStorefront(p, context()), true);
  assert.equal(matchesStorefront(p, { ...context(), productCollectionIds: [] }), false);
  assert.equal(matchesStorefront(p, { ...context(), now: Date.parse("2026-11-01") }), false);
  p.settings.websiteEnabled = false; assert.equal(matchesStorefront(p, context()), false); p.settings.websiteEnabled = true;
  p.shopify.customers = { appliesToAllCustomers: false, customers: [], segments: [{ id: "gid://shopify/Segment/2", name: "VIP" }] };
  assert.equal(matchesStorefront(p, context()), false);
  assert.equal(matchesStorefront(p, { ...context(), customerId: "gid://shopify/Customer/7", memberSegmentIds: ["gid://shopify/Segment/2"] }), true);
});
test("variant-only promotions require the selected variant on product pages", () => {
  const n = node(); n.discount.customerGets!.items = { __typename: "DiscountProducts", productVariants: { nodes: [{ id: "gid://shopify/ProductVariant/3", title: "Small", product: { id: "gid://shopify/Product/1", title: "Costume" } }] } };
  const p = mapDiscountToPromotion(n); Object.assign(p.settings, websiteStorage(website()));
  assert.equal(matchesStorefront(p, context()), true);
  assert.equal(matchesStorefront(p, { ...context(), variantId: "gid://shopify/ProductVariant/4" }), false);
  assert.equal(matchesStorefront(p, { ...context(), placement: "badge", variantId: null }), true);
});
test("invalid image uploads do not make Shopify requests", async () => {
  let calls = 0;
  await assert.rejects(() => uploadPromotionImage({ graphql: async () => { calls++; return Response.json({}); } }, new File(["bad"], "bad.svg", { type: "image/svg+xml" })), /JPG/);
  assert.equal(calls, 0);
  await assert.rejects(() => resolvePromotionImage({ graphql: async () => Response.json({ data: { node: { fileStatus: "PROCESSING" } } }) }, "gid://shopify/MediaImage/1"), /processing/);
});
test("theme blocks have valid schemas, default locales and proxy loader is declared", () => {
  assert.deepEqual(JSON.parse(readFileSync("extensions/promotion-engine/locales/en.default.json", "utf8")), {});
  for (const file of ["promotion", "promotion-loader"]) {
    const liquid = readFileSync(`extensions/promotion-engine/blocks/${file}.liquid`, "utf8");
    const schema = JSON.parse(liquid.split("{% schema %}")[1].split("{% endschema %}")[0]);
    assert.equal(schema.javascript, "promotion-engine.js");
  }
});

test("product styles and copy preference survive storage with safe legacy defaults", () => {
  assert.equal(readDesign({}).productOfferStyle, "solid");
  assert.equal(readDesign({}).copyCodeEnabled, false);
  for (const style of ["solid", "single", "double"] as const) {
    const value = website();
    value.design = { ...value.design, productOfferStyle: style, productBorderWidth: style === "double" ? 4 : 1, productBorderColour: "#123456", copyCodeEnabled: true };
    assert.deepEqual(websiteFromSettings(websiteStorage(value)), value);
    assert.match(renderToStaticMarkup(<PromotionOffer value={value} placement="product" now={0} />), new RegExp(`pe-offer-${style}`));
  }
  assert.throws(() => readDesign({ productOfferStyle: "invalid" }));
  assert.throws(() => readDesign({ productBorderColour: "red" }));
  assert.throws(() => readDesign({ copyCodeEnabled: "false" }));
});
test("product copy button is optional, code-only and escapes merchant content", () => {
  const value = website();
  const render = (code?: string) => renderToStaticMarkup(<PromotionOffer value={value} placement="product" now={0} discountCode={code} offerNote="Applied automatically at checkout." />);
  assert.doesNotMatch(render("SAVE20"), /data-pe-copy-code/);
  value.design.copyCodeEnabled = true;
  assert.match(render('SAVE<20"'), /data-pe-copy-code="SAVE&lt;20&quot;"/);
  assert.doesNotMatch(render(), /data-pe-copy-code/);
  assert.match(render(), /Applied automatically at checkout/);
  assert.doesNotMatch(render("SAVE20"), /Applied automatically/);
  assert.doesNotMatch(renderToStaticMarkup(<PromotionOffer value={value} placement="collection" now={0} discountCode="SAVE20" />), /data-pe-copy-code/);
});
test("segmented product countdown includes seconds and ends cleanly", () => {
  const end = "2026-10-10T00:00:00Z";
  const now = Date.parse(end) - 90061000;
  assert.deepEqual(countdownParts(end, now), { ended: false, days: 1, hours: 1, minutes: 1, seconds: 1 });
  assert.equal(countdownParts("invalid", now), null);
  assert.equal(countdownParts(null, now), null);
  assert.equal(countdownParts(end, Date.parse(end))?.ended, true);
  const value = website(); value.showCountdown = true;
  const html = renderToStaticMarkup(<PromotionOffer value={value} placement="product" now={now} endsAt={end} />);
  assert.match(html, /data-pe-value="seconds">01/);
  assert.match(html, /aria-live="off"/);
  assert.doesNotMatch(renderToStaticMarkup(<PromotionOffer value={value} placement="product" now={now} endsAt="invalid" />), /data-pe-countdown/);
});

test("embedded navigation preserves shop and host without replaying tokens or page filters", () => {
  const search = "?shop=dev.myshopify.com&host=YWRtaW4&embedded=1&id_token=secret&hmac=signature&timestamp=123&type=product";
  for (const target of ["/app/promotions", "/app/promotions/123", "/app/promotions/new?type=shipping"]) {
    const url = new URL(embeddedAppUrl(target, search), "https://app.example.com");
    assert.equal(url.searchParams.get("shop"), "dev.myshopify.com");
    assert.equal(url.searchParams.get("host"), "YWRtaW4");
    assert.equal(url.searchParams.get("embedded"), "1");
    for (const param of ["id_token", "hmac", "timestamp"]) assert.equal(url.searchParams.has(param), false);
    assert.equal(url.searchParams.get("type"), target.includes("new") ? "shipping" : null);
  }
  const fallback = new URL(embeddedAppUrl("/app/promotions#offers", "", { shop: "verified.myshopify.com", host: "saved-host" }), "https://app.example.com");
  assert.equal(fallback.searchParams.get("shop"), "verified.myshopify.com");
  assert.equal(fallback.searchParams.get("host"), "saved-host");
  assert.equal(fallback.hash, "#offers");
  assert.equal(new URL(embeddedAppUrl("/app", search, { shop: "verified.myshopify.com" }), "https://app.example.com").searchParams.get("shop"), "verified.myshopify.com");
  assert.equal(embeddedAppUrl("shopify:admin/discounts", search), "shopify:admin/discounts");
  assert.equal(embeddedAppUrl("https://example.com", search), "https://example.com");
});

test("preview and theme share an identical runtime served from the app directory", () => {
  assert.equal(readFileSync("app/modules/promotions/design/promotion-ui.js", "utf8"), readFileSync("extensions/promotion-engine/assets/promotion-ui.js", "utf8"));
  assert.match(readFileSync("app/modules/promotions/components/PromotionPreview.tsx", "utf8"), /from "\.\.\/design\/promotion-ui\.js\?raw"/);
});

test("copy colours and border width persist independently with compatible legacy defaults", () => {
  const legacy = readDesign({ productOfferStyle: "double", buttonBackground: "#123456", buttonColour: "#fedcba" });
  assert.equal(legacy.productBorderWidth, 4);
  assert.equal(legacy.copyCodeBackground, "#123456");
  assert.equal(legacy.copyCodeColour, "#fedcba");
  assert.equal(readDesign({}).productBorderWidth, 1);
  const value = website();
  value.design = { ...value.design, productOfferStyle: "double", productBorderWidth: 6, copyCodeEnabled: true, copyCodeBackground: "#abcdef", copyCodeColour: "#123456" };
  assert.deepEqual(websiteFromSettings(websiteStorage(value)), value);
  const html = renderToStaticMarkup(<PromotionOffer value={value} placement="product" now={0} discountCode="SAVE20" />);
  assert.match(html, /--pe-border-width:6px/);
  assert.match(html, /--pe-copy-bg:#abcdef/);
  assert.match(html, /--pe-copy-fg:#123456/);
  assert.match(html, /--pe-button-bg:#202223/);
  assert.match(promotionCss, /border:var\(--pe-border-width\) double/);
  assert.match(promotionCss, /background:var\(--pe-copy-bg\);color:var\(--pe-copy-fg\)/);
  for (const width of [0, 13, NaN]) assert.throws(() => readDesign({ productBorderWidth: width }));
  assert.throws(() => readDesign({ productOfferStyle: "double", productBorderWidth: 2 }));
  assert.throws(() => readDesign({ copyCodeBackground: "red" }));
  assert.throws(() => readDesign({ copyCodeColour: "invalid" }));
});

test("all eight existing discount types map to prefilled drafts and update their original IDs", () => {
  for (const method of ["code", "automatic"] as const) for (const type of ["product", "order", "bxgy", "shipping"] as const) {
    const n = node();
    const suffix = type === "bxgy" ? "Bxgy" : type === "shipping" ? "FreeShipping" : "Basic";
    n.discount.__typename = `Discount${method === "code" ? "Code" : "Automatic"}${suffix}`;
    n.discount.codes = { nodes: [{ code: "SAVE20" }] };
    n.discount.discountClasses = [type === "order" ? "ORDER" : type === "shipping" ? "SHIPPING" : "PRODUCT"];
    n.discount.usageLimit = 12; n.discount.appliesOncePerCustomer = true;
    n.discount.combinesWith = { productDiscounts: true, orderDiscounts: false, shippingDiscounts: true, productDiscountsWithTagsOnSameCartLine: ["VIP"] };
    if (type === "order") n.discount.customerGets!.items = { __typename: "AllDiscountItems", allItems: true };
    if (type === "shipping") { n.discount.destinationSelection = { __typename: "DiscountCountries", countries: ["GB", "IE"] }; n.discount.maximumShippingPrice = { amount: "10.00", currencyCode: "GBP" }; }
    if (type === "bxgy") { n.discount.customerBuys = { value: { __typename: "DiscountQuantity", quantity: "2" }, items: n.discount.customerGets!.items }; n.discount.customerGets!.value = { __typename: "DiscountOnQuantity", quantity: { quantity: "1" }, effect: { __typename: "DiscountPercentage", percentage: 1 } }; n.discount.usesPerOrderLimit = "3"; }
    const d = discountToEditorDraft(n);
    assert.equal(d.discountType, type); assert.equal(d.method, method);
    assert.equal(d.limitTotalUses, true); assert.equal(d.totalUsageLimit, "12"); assert.equal(d.limitOncePerCustomer, true);
    assert.equal(d.combineShippingDiscounts, true); assert.deepEqual(d.selectedCombinationTags, ["VIP"]);
    const result = buildUpdateDiscountMutation(n, d);
    assert.match(result.query, new RegExp(`discount${method === "code" ? "Code" : "Automatic"}${suffix}Update\\(id: \\$id`));
    assert.equal(result.variables.id, `gid://shopify/${method === "code" ? "DiscountCodeNode" : "DiscountAutomaticNode"}/1`);
    const input = result.variables.input as Record<string, unknown>;
    assert.equal("tags" in input, false); assert.equal("code" in input, false);
    if (type === "bxgy") { assert.equal(d.buyQuantity, "2"); assert.equal(d.getQuantity, "1"); assert.equal(d.rewardType, "free"); assert.equal(d.usesPerOrder, "3"); }
    if (type === "shipping") { assert.equal(d.countryMode, "selected"); assert.equal(d.maximumShippingPrice, "10.00"); }
  }
});
test("editing removes old product, variant, buyer and combination selections and can clear limits", () => {
  const n = node(); n.discount.codes = { nodes: [{ code: "SAVE20" }] };
  n.discount.customerGets!.items = { __typename: "DiscountProducts", products: { nodes: [{ id: "gid://shopify/Product/1", title: "Old" }] }, productVariants: { nodes: [{ id: "gid://shopify/ProductVariant/3", title: "Small", product: { id: "gid://shopify/Product/2", title: "Partial" } }] } };
  n.discount.context = { __typename: "DiscountCustomers", customers: [{ id: "gid://shopify/Customer/1", displayName: "Old buyer" }] };
  n.discount.combinesWith = { productDiscounts: true, orderDiscounts: false, shippingDiscounts: false, productDiscountsWithTagsOnSameCartLine: ["OLD"] };
  const d = discountToEditorDraft(n);
  assert.deepEqual(d.selectedProducts[1].selectedVariantIds, ["gid://shopify/ProductVariant/3"]);
  d.selectedProducts = [{ id: "gid://shopify/Product/4", title: "New", handle: "new" }];
  d.selectedEligibility = [{ id: "gid://shopify/Customer/2", name: "New buyer" }]; d.productCombinationMode = "best";
  const input = buildUpdateDiscountMutation(n, d).variables.input as { customerGets: { items: { products: Record<string, string[]> } }; context: { customers: { add: string[]; remove: string[] } }; minimumRequirement: null; usageLimit: null; combinesWith: { productDiscountsWithTagsOnSameCartLine: { add: string[]; remove: string[] } } };
  assert.deepEqual(input.customerGets.items.products.productsToRemove, ["gid://shopify/Product/1"]);
  assert.deepEqual(input.customerGets.items.products.productVariantsToRemove, ["gid://shopify/ProductVariant/3"]);
  assert.deepEqual(input.customerGets.items.products.productsToAdd, ["gid://shopify/Product/4"]);
  assert.deepEqual(input.context.customers.remove, ["gid://shopify/Customer/1"]);
  assert.deepEqual(input.combinesWith.productDiscountsWithTagsOnSameCartLine, { add: [], remove: ["OLD"] });
  assert.equal(input.minimumRequirement, null); assert.equal(input.usageLimit, null);
});
test("editing preserves whole products, fixed-amount allocation and subscription settings", () => {
  const n = node(); n.discount.codes = { nodes: [{ code: "SAVE20" }] };
  n.discount.customerGets = { appliesOnOneTimePurchase: false, appliesOnSubscription: true, value: { __typename: "DiscountAmount", amount: { amount: "5.00", currencyCode: "GBP" }, appliesOnEachItem: false }, items: { __typename: "DiscountProducts", products: { nodes: [{ id: "gid://shopify/Product/1", title: "Whole" }] }, productVariants: { nodes: [{ id: "gid://shopify/ProductVariant/3", title: "Small", product: { id: "gid://shopify/Product/1", title: "Whole" } }] } } };
  const d = discountToEditorDraft(n); assert.equal(d.selectedProducts.length, 1); assert.equal(d.selectedProducts[0].selectedVariantIds, undefined);
  const input = buildUpdateDiscountMutation(n, d).variables.input as { customerGets: { appliesOnOneTimePurchase: boolean; appliesOnSubscription: boolean; value: { discountAmount: { appliesOnEachItem: boolean } } } };
  assert.equal(input.customerGets.appliesOnOneTimePurchase, false); assert.equal(input.customerGets.appliesOnSubscription, true); assert.equal(input.customerGets.value.discountAmount.appliesOnEachItem, false);
});
test("unsupported or incomplete selections cannot be silently replaced, and update errors surface", async () => {
  const n = node(); n.discount.codes = { nodes: [{ code: "SAVE20" }] };
  const d = discountToEditorDraft(n);
  assert.throws(() => buildUpdateDiscountMutation(n, { ...d, method: "automatic" }), /method cannot/);
  assert.throws(() => buildUpdateDiscountMutation(n, { ...d, discountCode: "CHANGED" }), /codes in Shopify/);
  assert.throws(() => discountToEditorDraft({ ...n, discount: { ...n.discount, __typename: "DiscountCodeApp" } }), /another app/);
  n.discount.customerGets!.items.collections!.pageInfo = { hasNextPage: true };
  assert.throws(() => discountToEditorDraft(n), /more selected items/);
  n.discount.customerGets!.items.collections!.pageInfo = { hasNextPage: false };
  await assert.rejects(() => updateShopifyPromotion({ graphql: async () => Response.json({ data: { result: { userErrors: [{ message: "Cannot update this discount" }] } } }) }, n, d), /Cannot update/);
  assert.equal(await updateShopifyPromotion({ graphql: async () => Response.json({ data: { result: { codeDiscountNode: { id: "gid://shopify/DiscountCodeNode/1" }, userErrors: [] } } }) }, n, d), n.id);
});
test("edit selection loading follows connection cursors before populating the form", async () => {
  const n = node(); n.discount.codes = { nodes: [{ code: "SAVE20" }] };
  n.discount.customerGets!.items.collections!.pageInfo = { hasNextPage: true, endCursor: "first" };
  let calls = 0;
  const loaded = await getEditableDiscount({ graphql: async (query, options) => {
    calls++;
    if (calls === 1) return Response.json({ data: { discountNode: n } });
    assert.match(query, /collections\(first: \$first, after: \$cursor\)/);
    assert.equal(options?.variables?.cursor, "first");
    return Response.json({ data: { discountNode: { discount: { customerGets: { items: { __typename: "DiscountCollections", collections: { nodes: [{ id: "gid://shopify/Collection/2", title: "Second" }], pageInfo: { hasNextPage: false, endCursor: "last" } } } } } } } });
  } }, n.id);
  assert.equal(calls, 2);
  assert.equal(discountToEditorDraft(loaded!).selectedCollections.length, 2);
});

test("saved dates retain their instant when opened in the local date/time editor", () => {
  const iso = "2026-10-10T13:24:59Z";
  assert.equal(new Date(toLocalDateTime(iso)).toISOString(), new Date(iso).toISOString());
  assert.equal(toLocalDateTime(null), "");
});

test("React 18 Polaris controls retain their markup without false boolean attributes", () => {
  const checkbox = renderToStaticMarkup(<PolarisCheckbox label="Optional limit" checked={false} disabled={false} />);
  assert.match(checkbox, /<s-checkbox/); assert.doesNotMatch(checkbox, /checked=|disabled=/);
  const select = renderToStaticMarkup(<PolarisSelect label="Code format" value="single" disabled={false}><s-option value="single">Shared</s-option></PolarisSelect>);
  assert.match(select, /value="single"/); assert.doesNotMatch(select, /disabled=/);
});
