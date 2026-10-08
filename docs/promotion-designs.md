# Promotion designs

Create and edit screens share the Website promotion and Messages and styling editor. The three presets change layout, spacing and typography without replacing your copy. Use the placement text overrides to shorten a header or badge while retaining a longer collection message.

Images upload to Shopify Files when selected. Uploads accept JPG, PNG and WebP up to 20 MB. Mobile images fall back to the desktop image. The preview offers fixed desktop (1024 px), tablet (768 px) and mobile (390 px) viewports, independent of the admin window size. Its product list defaults to selected products or sample products from selected collections. A product override is for testing the design and does not alter eligibility.

A countdown requires an end date. Buttons require a relative shop link or an HTTP/HTTPS URL. Text limits and validation are identical when creating and editing. Priority controls which eligible promotion is selected when placements overlap; higher values win, then the newest saved record wins.

## Deploying this update

1. Run `npm install` and `npx prisma migrate deploy`, then rebuild/restart the app.
2. Deploy the app configuration and theme extension with `shopify app deploy --config smiffys-promotion-engine`. Existing installations need to approve the added discount, file and app-proxy scopes. No discount is created by deployment; creation happens when a user presses Create promotion.
3. In the Shopify theme editor, add the **Promotion Engine** app block to a supported section on product and collection templates. Choose the matching placement. Use the Header placement in a section that supports app blocks, or the custom element below in a Custom Liquid section.
4. Enable the **Promotion Engine loader** app embed if using custom elements or product-card badges. The default app proxy path is `/apps/promotion-engine`; update block/custom-element paths if the merchant has customised that path.
5. Create a test promotion in a development store and verify save/reopen, both image versions, device previews, eligibility and expiry on the storefront before publishing the theme.

### Custom header placement

With the loader app embed enabled, add this to a Custom Liquid section at the desired header position:

```liquid
<promotion-engine data-placement="header" data-proxy-path="/apps/promotion-engine"></promotion-engine>
```

### Product-card badges

Product-card markup varies by theme. Add the following inside the card template, using that template's product variable (Dawn typically uses `card_product`). Enable the loader app embed. Position the custom element with the theme's badge container.

```liquid
<promotion-engine data-placement="badge" data-product-id="{{ card_product.id }}" data-proxy-path="/apps/promotion-engine"></promotion-engine>
```

The app block uses the current product and selected variant by default. For themes with custom variant events, dispatch `variant:change` with `{ variant: { id } }` after a selection change. The renderer also listens to standard product-form changes. Product badges may advertise an offer on selected variants; the product panel checks the currently selected variant.

## Storefront behaviour

The signed app proxy checks current Shopify discount status, dates, saved placement flags, inclusion, product/collection targeting, and signed customer identity/segment membership. Disabled, expired, deleted and ineligible promotions render nothing. Countdown data refreshes each minute and a promo is removed at its end time. Product-only scopes appear on eligible products/cards; a collection banner requires a qualifying collection scope. Order and shipping offers can appear across products and collections. Geographic and purchase minimums are still enforced by Shopify at checkout; promotional messaging does not claim a reduced product price.

The app uses the same offer markup/CSS in the preview and storefront. Surrounding theme layout and fonts can differ. Customer responses are not publicly cached. Uploaded files are not deleted on Discard because they remain reusable in Shopify Files.

The design is stored alongside the discount in the `PromotionSettings.designJson` column. Native Shopify discount creation and the local settings write are separate operations. If the settings write fails, the form retains the created discount ID and retries settings only, avoiding creation of another discount.
