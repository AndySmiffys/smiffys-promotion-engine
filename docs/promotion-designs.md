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

### Product offer appearance

In Messages and styling → Product offer, choose Solid background, Single line border or Double line border. Border styles have a transparent background and their own border colour. Text colour, padding and corner radius remain shared design settings. These settings are stored in design JSON; existing promotions keep their solid background and need no database migration.

Enable Show copy code button to place a copy action beside the product offer's actual discount code. Automatic discounts never display this button. Successful copying is announced, and browsers that block clipboard access show a manual-copy message instead of claiming success.

When Countdown is enabled and an end date is set, product offers display compact days, hours, minutes and seconds tiles. Preview and storefront use the same live timer and copying script. Header and collection countdowns retain their compact text format. Theme typography is inherited on the storefront.

Pull the branch and restart Shopify app dev to load the editor changes. Refresh the storefront preview so the updated extension assets load. Production storefronts require the app and theme extension release to be deployed.

### Local development networking

Run `shopify app dev` with the default public tunnel when testing this app. `--use-localhost` is incompatible with Shopify app proxies, so it fails with `app_proxy requires a public host`. The storefront calls the app proxy to load eligible offers; localhost cannot accept those Shopify requests. If a default tunnel is unavailable, configure a public HTTPS tunnel using Shopify CLI's `--tunnel-url` option.

The theme extension includes `locales/en.default.json` even though it currently has no Liquid translation keys. Keeping the file in Git ensures fresh clones contain the locales directory required by the CLI's theme checks.

The `OrphanedSnippet` warning for `product-card-badge.liquid` is expected: this snippet is provided for explicit integration into a merchant's custom product-card theme markup, rather than being rendered by the extension's standard app block. It does not prevent the extension from building.

### Embedded navigation and preview scripts

Internal app links preserve the authenticated shop and the Shopify host/embedded parameters while retaining the destination's own query, such as the chosen discount type. Authentication tokens and signatures from the previous page are not copied to new URLs.

The shared timer/copy script's source is `app/modules/promotions/design/promotion-ui.js`. The admin preview imports this file as raw text from the app directory: the Shopify development proxy routes `/extensions/` separately, so importing the extension asset directly caused a 404 and prevented create/detail route modules from loading. Run `npm run sync:promotion-ui` after editing the source to update the committed theme asset. Build, npm deployment and Shopify web predev also run this sync. Tests check that both copies match.

### Copy button colours and border thickness

Product offer controls include independent copy-button background and text/icon colour pickers when Show copy code button is enabled. Existing saved designs initially inherit their previous main-button colours. Changes to these copy colours do not affect the main call-to-action button.

Single borders support 1–12px thickness; double borders support 3–12px total thickness, including both lines and their gap. Switching to a double border raises a thinner value to 3px. Existing saved double borders retain their previous 4px width. Thickness is hidden for solid backgrounds and stored with the design for later use.

### Editing existing promotions

Supported native Shopify discounts open in the same shared editor as creation, with their saved rules and website design prefilled. The editor includes the responsive preview, grouped website controls and discount summary. Save promotion updates the existing Shopify discount rather than creating a replacement; Discard changes restores the latest loader values. Website-only changes skip the native discount update.

The discount type, code/automatic method and existing codes are retained. Use Edit in Shopify to manage discount codes. Product and variant targeting, customer eligibility, minimum requirements, limits, combinations, dates and shipping destinations are editable. Updates explicitly remove deselected resources and preserve purchase/subscription settings and fixed-amount allocation not exposed by the form. Dates preserve the existing instant when displayed and saved in local time.

The loader paginates selected products, variants and collections. Discounts with selections beyond the Shopify input limit, unsupported buyer contexts or app-managed rules retain the original detail view and website editor, with an explanation and Shopify editing link. Partial saves report when native rules succeeded but website settings need retrying.

### Shared codes and generated code lists

Code creation offers One shared code for all customers (the default) or Generate a list of individual codes. Shared codes are trimmed and uppercased, and Shopify receives the same value for the redeemable code and its title. No usage limit or once-per-customer restriction is added unless selected. Shopify can display its app-created-code panel even for one reusable code; the public native discount input has no setting for that admin label. The panel wording does not assign a different code to each customer. Existing shared code titles that differ only by case are aligned with the code when native rules are next saved.

Lists support 1–10,000 codes, a name, and optional prefix/suffix of up to 32 letters, numbers, hyphens or underscores each. Prefixes and suffixes are uppercased. Each code contains a cryptographically random 12-character core; confusing I/O and 0/1 characters are excluded. Selecting list mode defaults to one use per code. Usage and once-per-customer limits apply separately to each redeem code, rather than providing one aggregate cap across the list.

The app persists the planned codes and original request before creating the parent Shopify discount, and includes the initial code in the requested total. It then submits batches of up to 250 codes through Shopify's asynchronous code API. The promotion's progress panel confirms completed Shopify jobs, resumes when the promotion is reopened, and offers Retry for failed or uncertain imports. Keep the page open for generation; closing it pauses submission of further batches. Retries reconcile existing codes and reuse the original planned values. Simultaneous requests share a database lease. A lost creation response is recovered by the stored seed code without replacing the promotion. If a failed creation's rule settings are changed, restore the original settings to retry or open the saved promotion to edit them.

CSV download is available only when the complete list has been confirmed. The authenticated endpoint checks shop ownership and returns a private, uncached response. Bulk code lists stay in website Draft status; their individual codes are never displayed as a public shared code. Existing Shopify discounts with multiple codes are also excluded from public website offers.

The new PromotionCodeBatch migration is applied by Shopify web dev's existing prisma migrate deploy command. Production startup must run npm run setup before serving the new release. React 18 adapters preserve Polaris select/checkbox markup and styling, bind native change events, and synchronise controlled boolean/value properties after the custom elements are defined. The shared preview product picker uses the same adapter.
