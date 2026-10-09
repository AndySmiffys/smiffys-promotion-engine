# Storefront promotions

The extension uses Shopify app blocks for product offers and collection banners,
and the **Promotion Engine loader** app embed for announcements and product-card
badges. Promotion content, visibility and styling come from the saved promotion.
Fonts inherit from the theme; promotion CSS is isolated in shadow DOM.

## Development setup

1. Pull `feature/free-shipping-support` and run
   `shopify app dev --use-localhost` as usual. Use the development theme preview
   associated with the CLI session.
2. Open that theme's editor, select **App embeds**, enable **Promotion Engine
   loader**, then save. Choose announcements, badges, and their positions.
3. Open the product template. Add the **Promotion Engine** app block to an app
   block-compatible product section, choose **Product offer**, and leave Product
   blank to use the current product. Set width and spacing as required.
4. Open the collection template. Add the same app block, choose **Collection
   banner**, and save. Repeat for any alternate templates in use.
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
