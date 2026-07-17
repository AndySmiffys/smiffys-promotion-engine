export default function PromotionsPage() {
  return (
    <s-page heading="Promotions">

      <s-stack direction="block" gap="large">

        <s-section heading="Promotion Dashboard">

          <s-text>
            This module will synchronise Shopify discounts to product metafields.
          </s-text>

        </s-section>

        <s-box
          borderWidth="base"
          borderRadius="base"
          padding="base"
        >

          <s-text variant="headingLg">
            Promotion Sync
          </s-text>

          <br />

          <s-button
            variant="primary"
            disabled
          >
            Sync Promotions
          </s-button>

        </s-box>

      </s-stack>

    </s-page>
  );
}
