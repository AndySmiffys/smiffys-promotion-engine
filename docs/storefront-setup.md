# Storefront promotions

The extension uses Shopify app blocks for product offers and collection banners,
and the **Promotion Engine loader** app embed for announcements and product-card
badges. Promotion content, visibility and styling come from the saved promotion.
Fonts inherit from the theme; promotion CSS is isolated in shadow DOM.
The app proxy path is fixed in the extension and is not a merchant-editable theme setting.

## Development setup

1. Pull `feature/free-shipping-support` and run
   `shopify app dev` to start a publicly reachable development tunnel. Do not
   use `--use-localhost` for storefront testing: Shopify invokes the app proxy
   server-side and cannot reach your local-only server. Use the development
   theme preview associated with this CLI session.
2. Open that theme's editor, select **App embeds**, enable **Promotion Engine
   loader**, then save. Choose announcements, badges, and their positions.
3. Open the product template. Add **Product promotion** to the product details
   section. This block is offered only on product templates and uses the current
   product and selected variant automatically.
4. Open the collection template. Use **Add section → Apps → Collection promotion**
   and place the section above the product grid. Choose **Banner width**:
   - **Content width** fills the theme section, including the theme's page gutters.
   - **Full page width** extends to both screen edges, excluding the scrollbar.
   The collection block is offered only on collection templates. Add it as its own
   section rather than inside a product-card or narrow nested group. Theme wrappers
   that clip overflow must use their full-width setting for full-page banners.
   Remove the old generic Collection placement when replacing it, then save.
   Repeat for alternate templates in use. Existing generic Promotion Engine blocks
   remain supported; their collection wrappers now span the row.
5. In the app, enable a promotion and its required website blocks. Verify active
   dates and product/collection/customer eligibility. A block with no eligible
   promotion is hidden; the theme editor does not bypass these rules.

For an installed production store, deploy the extension with `shopify app deploy`
and repeat theme activation/placement on that store. Git updates do not activate
an embed or modify a live theme. Theme configuration is separate for each theme.
An announcement or badge added explicitly as an app block takes precedence over
its automatic counterpart.

## Theme compatibility

Automatic placement recognizes Dawn header/card wrappers and Horizon's
`#header-group`, `product-card`, and `.card-gallery` markup. Product IDs are read
from card data when available; otherwise a product link is resolved through
Shopify's localized product Ajax endpoint. Cards load near the viewport and are
rescanned after collection filtering, section replacement and card insertion.
Concurrent promotion requests are limited to four and share in-flight responses
only. Customer-specific promotion responses are not persistently cached.

For other themes, the embed includes advanced CSS selector settings:

| Setting | Selects |
| --- | --- |
| Header CSS selector | The element to place the announcement above or below |
| Product card CSS selector | Each individual product card containing a product link |
| Badge container CSS selector | An image/container inside each card; falls back to the card |

Leave selectors blank to use automatic detection. An invalid or unmatched header
selector does not insert an announcement. Choose another badge corner if the
promotion overlaps a theme's sale or sold-out badge. Product links must point to
this store. Product and collection app blocks require a section that supports
Shopify app blocks; automatic selectors cannot guarantee compatibility with every
third-party theme.

## Verification

The automated suite uses representative Dawn and Horizon DOM fixtures, not live
stores. Before publishing, check desktop/mobile product and collection templates,
variant changes, sold-out/sale badges, filtering, quick-add, customer targeting,
expired promotions and theme-editor reloads in each supported live theme.


## Visibility guidance in the editor

The Eligibility selector warns when selected customers or segments restrict
website display to eligible logged-in customers. The design preview also shows live visibility
guidance for Draft status, disabled sync, empty
placement/audience selections, code lists, future or expired schedules and product
versus collection targeting. These messages describe the current form choices;
save to apply changes. They do not block saving a restricted promotion.

The preview shows the design even when the promotion is hidden. Priority only
chooses between promotions eligible for the current visitor and placement.

## A saved priority does not change the storefront

Open **Storefront priorities** from the app navigation. This page lists saved
promotions for Header, Collection, Product and Product badge in priority order,
with their audience and visibility. Edit a priority directly in a list and use
the top Save/Discard bar. A promotion shares one priority across its selected
blocks, and the lists reorder after saving. Saving here changes only priorities;
it does not change discount rules, messages, designs or visibility.

Saved records whose discounts Shopify no longer returns are omitted from these
lists without deleting their saved designs. Genuine API failures remain visible.
The temporary Header connection check has been removed from the page.

First reopen the promotion in the app and check the saved priority. If the number
is retained, check the connection before changing the ranking code:

1. Stop the current CLI session and start `shopify app dev`, without
   `--use-localhost`. Open the app using this session's preview link.
2. Confirm the CLI is using the same app configuration and development store as
   the theme embed. This repository has two app configuration files associated
   with different app IDs; do not switch configurations without checking which
   app is installed and being edited.
3. Refresh the storefront preview. With browser developer tools open, inspect
   the `/apps/promotion-engine?placement=header...` request in Network. Check its
   response and whether it reaches the current app server. Seeing old content
   does not prove it is coming from the same server/database as the editor.
4. Confirm the higher-priority promotion is included, website Enabled, has Header
   selected, is active within its schedule, and is eligible for the current
   customer. Priority orders eligible promotions; it does not bypass eligibility.

Shopify networking reference:
https://shopify.dev/docs/apps/build/cli-for-apps/networking-options

The default CLI tunnel is Cloudflare. If it is unavailable on your network,
use a publicly reachable custom tunnel with `shopify app dev --tunnel-url=...`
following Shopify's networking guide. Localhost alone cannot test app proxies.


## Initial rendering and layout stability

Open **Promotions** once after pulling this update. This publishes enabled public promotion designs into an app-installation metafield that Shopify Liquid can read. The create/edit Save action and priority Save also publish it. A sync failure is displayed in the app; opening Promotions retries it. Discount update/delete and redeem-code change webhooks refresh the same data when discounts are edited directly in Shopify. Restart `shopify app dev` to apply the updated webhook configuration; production needs the usual app deployment.

The Collection promotion, Product promotion and legacy explicit Promotion Engine blocks now select a public promotion in the initial Liquid render. They check priority order, scheduled start/end timestamps and placement targeting. No eligible promotion means a hidden element with no reserved banner height. Future schedules are stored so Liquid can activate them on subsequent page loads without an app visit. Restricted customer/segment content is excluded from the published snapshot and continues to use the authenticated live eligibility renderer. Scope connections that reach the API limit also fall back to the live renderer.

For the header, add **Header promotion** in the theme editor's header group if the theme supports app sections there. Otherwise add it as the first page section (or use the legacy explicit block with Header announcement selected). The automatic loader detects this explicit block and skips its own header. Leave the loader enabled for product badges. Add the header block to every template where it should appear when using page sections. Automatic DOM placement remains available for themes without an appropriate section, but still inserts the announcement after page load and can contribute to CLS.

Public offers use declarative shadow DOM to render immediately with their styles and images. Theme editor replacements are hydrated by the JavaScript runtime. Responsive Shopify CDN image sizes, mobile image sources and high fetch priority on collection images reduce unnecessary downloads. The runtime retains matching initial markup when the live renderer agrees on the promotion and saved revision. A failed validation request leaves an initial public offer visible until its known expiry; a successful empty response removes it.

This reduces initial insertion shifts; it does not guarantee a CLS score. Customer-specific offers, an offer expiring while the page remains open, live promotion changes, full-width sizing and theme font loading can still move content. Expired offers are removed rather than leaving blank space or an unusable code. Test desktop and mobile Lighthouse with offers enabled, all offers disabled, future schedules and restricted customers. Compare field data once deployed.
