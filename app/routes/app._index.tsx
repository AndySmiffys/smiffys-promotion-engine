export default function DashboardPage() {
  return (
    <s-page heading="Smiffys Toolkit">
      <s-stack direction="block" gap="large">

        <s-section heading="Welcome">
          <s-text>
            Welcome to the Smiffys internal toolkit.
          </s-text>
        </s-section>

        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(240px,1fr))"
          gap="base"
        >

          <s-box
            borderWidth="base"
            borderRadius="base"
            padding="base"
          >
            <s-text variant="headingLg">
              Promotions
            </s-text>

            <s-text>
              View and synchronise Shopify promotions.
            </s-text>

            <br />

            <s-button href="/app/promotions">
              Open
            </s-button>
          </s-box>

          <s-box
            borderWidth="base"
            borderRadius="base"
            padding="base"
          >
            <s-text variant="headingLg">
              Product Tools
            </s-text>

            <s-text>
              Coming soon
            </s-text>

          </s-box>

          <s-box
            borderWidth="base"
            borderRadius="base"
            padding="base"
          >
            <s-text variant="headingLg">
              Reports
            </s-text>

            <s-text>
              Coming soon
            </s-text>

          </s-box>

        </s-grid>

      </s-stack>
    </s-page>
  );
}
