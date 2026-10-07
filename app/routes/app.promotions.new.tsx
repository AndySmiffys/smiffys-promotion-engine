import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

type DiscountType = "product" | "bxgy" | "order" | "shipping";

const typeConfig: Record<
  DiscountType,
  {
    title: string;
    typeLabel: string;
    description: string;
  }
> = {
  product: {
    title: "Amount off products",
    typeLabel: "Product discount",
    description: "Discount specific products or collections of products",
  },
  bxgy: {
    title: "Buy X get Y",
    typeLabel: "Product discount",
    description: "Discount specific products or collections of products",
  },
  order: {
    title: "Amount off order",
    typeLabel: "Order discount",
    description: "Discount the total order amount",
  },
  shipping: {
    title: "Free shipping",
    typeLabel: "Shipping discount",
    description: "Offer free shipping on an order",
  },
};

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        style={{
          marginBottom: "8px",
          color: "#202223",
          fontSize: "14px",
          fontWeight: 650,
        }}
      >
        {title}
      </div>

      <div
        style={{
          border: "1px solid #dedede",
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
          padding: "16px",
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default function CreatePromotionPage() {
  const [searchParams] = useSearchParams();
  const rawType = searchParams.get("type");
  const discountType: DiscountType =
    rawType === "product" ||
    rawType === "bxgy" ||
    rawType === "order" ||
    rawType === "shipping"
      ? rawType
      : "product";

  const config = typeConfig[discountType];
  const [method, setMethod] = useState<"code" | "automatic">("code");
  const [discountCode, setDiscountCode] = useState("");
  const [automaticTitle, setAutomaticTitle] = useState("");

  function generateDiscountCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 10 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");

    setDiscountCode(code);
  }

  const details = useMemo(() => {
    const base = [
      "All customers",
      "For Online Store",
      "No usage limits",
      "Can't combine with other discounts",
      "Active from today",
    ];

    if (discountType !== "bxgy") {
      base.splice(2, 0, "No minimum purchase requirement");
    }

    if (discountType === "shipping") {
      base.splice(2, 0, "For all countries");
    }

    return base;
  }, [discountType]);

  return (
    <s-page heading="Create discount">
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
        }}
      >
        <s-stack direction="block" gap="large">
          <div>
            <s-button href="/app/promotions" variant="secondary">
              Back to promotions
            </s-button>
          </div>

          <div
            className="create-discount-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 260px",
              gap: "28px",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  marginBottom: "10px",
                  color: "#202223",
                  fontSize: "14px",
                  fontWeight: 650,
                }}
              >
                {config.title}
              </div>

              <s-stack direction="block" gap="large">
                <FormSection title="Method">
                  <s-stack direction="block" gap="base">
                    <div>
                      <div
                        style={{
                          marginBottom: "8px",
                          color: "#303030",
                          fontSize: "12px",
                          fontWeight: 650,
                        }}
                      >
                        Method
                      </div>

                      <div
                        role="group"
                        aria-label="Discount method"
                        style={{
                          display: "inline-flex",
                          padding: "2px",
                          borderRadius: "8px",
                          background: "#f1f1f1",
                        }}
                      >
                        <button
                          type="button"
                          aria-pressed={method === "code"}
                          onClick={() => setMethod("code")}
                          style={{
                            border: 0,
                            borderRadius: "7px",
                            padding: "7px 11px",
                            background: method === "code" ? "#ffffff" : "transparent",
                            boxShadow:
                              method === "code"
                                ? "0 1px 2px rgba(0, 0, 0, 0.12)"
                                : "none",
                            color: "#202223",
                            font: "inherit",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Discount code
                        </button>

                        <button
                          type="button"
                          aria-pressed={method === "automatic"}
                          onClick={() => setMethod("automatic")}
                          style={{
                            border: 0,
                            borderRadius: "7px",
                            padding: "7px 11px",
                            background:
                              method === "automatic" ? "#ffffff" : "transparent",
                            boxShadow:
                              method === "automatic"
                                ? "0 1px 2px rgba(0, 0, 0, 0.12)"
                                : "none",
                            color: "#202223",
                            font: "inherit",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Automatic discount
                        </button>
                      </div>
                    </div>

                    {method === "code" ? (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            marginBottom: "6px",
                          }}
                        >
                          <span
                            style={{
                              color: "#303030",
                              fontSize: "12px",
                              fontWeight: 650,
                            }}
                          >
                            Discount code
                          </span>

                          <button
                            type="button"
                            onClick={generateDiscountCode}
                            style={{
                              border: 0,
                              padding: 0,
                              background: "transparent",
                              color: "#005bd3",
                              font: "inherit",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Generate random code
                          </button>
                        </div>

                        <s-text-field
                          label="Discount code"
                          labelAccessibilityVisibility="exclusive"
                          placeholder="Enter discount code"
                          value={discountCode}
                          onInput={(event) =>
                            setDiscountCode(event.currentTarget.value)
                          }
                          details="Customers must enter this code at checkout."
                        />
                      </div>
                    ) : (
                      <s-text-field
                        label="Title"
                        placeholder="Enter discount title"
                        value={automaticTitle}
                        onInput={(event) =>
                          setAutomaticTitle(event.currentTarget.value)
                        }
                        details="Customers will see this title in their cart and at checkout."
                      />
                    )}
                  </s-stack>
                </FormSection>

                {discountType === "product" && (
                  <FormSection title="Discount value">
                    <s-stack direction="block" gap="base">
                      <s-select label="Discount type" value="percentage">
                        <s-option value="percentage">Percentage</s-option>
                        <s-option value="fixed">Fixed amount</s-option>
                      </s-select>
                      <s-number-field
                        label="Value"
                        min={0}
                        step={1}
                        suffix="%"
                      />
                      <s-select label="Applies to" value="collections">
                        <s-option value="collections">Specific collections</s-option>
                        <s-option value="products">Specific products</s-option>
                      </s-select>
                      <s-text-field
                        label="Search"
                        placeholder="Search products or collections"
                      />
                    </s-stack>
                  </FormSection>
                )}

                {discountType === "order" && (
                  <FormSection title="Discount value">
                    <s-stack direction="block" gap="base">
                      <s-select label="Discount type" value="percentage">
                        <s-option value="percentage">Percentage</s-option>
                        <s-option value="fixed">Fixed amount</s-option>
                      </s-select>
                      <s-number-field
                        label="Value"
                        min={0}
                        step={1}
                        suffix="%"
                      />
                    </s-stack>
                  </FormSection>
                )}

                {discountType === "bxgy" && (
                  <FormSection title="Discount value">
                    <s-stack direction="block" gap="large">
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 650, marginBottom: "10px" }}>
                          Customer buys
                        </div>
                        <s-stack direction="block" gap="base">
                          <s-number-field label="Quantity" min={1} step={1} />
                          <s-select label="Any items from" value="products">
                            <s-option value="products">Specific products</s-option>
                            <s-option value="collections">Specific collections</s-option>
                          </s-select>
                          <s-text-field label="Search products" placeholder="Search products" />
                        </s-stack>
                      </div>

                      <div
                        style={{
                          paddingTop: "16px",
                          borderTop: "1px solid #eeeeee",
                        }}
                      >
                        <div style={{ fontSize: "13px", fontWeight: 650, marginBottom: "4px" }}>
                          Customer gets
                        </div>
                        <div
                          style={{
                            marginBottom: "10px",
                            color: "#616161",
                            fontSize: "12px",
                          }}
                        >
                          Customers must add the quantity of items specified below to their cart.
                        </div>
                        <s-stack direction="block" gap="base">
                          <s-number-field label="Quantity" min={1} step={1} />
                          <s-select label="Any items from" value="products">
                            <s-option value="products">Specific products</s-option>
                            <s-option value="collections">Specific collections</s-option>
                          </s-select>
                          <s-text-field label="Search products" placeholder="Search products" />
                          <s-select label="At a discounted value" value="percentage">
                            <s-option value="percentage">Percentage</s-option>
                            <s-option value="amount">Amount off each</s-option>
                            <s-option value="free">Free</s-option>
                          </s-select>
                        </s-stack>
                      </div>
                    </s-stack>
                  </FormSection>
                )}

                {discountType === "shipping" && (
                  <FormSection title="Countries">
                    <s-stack direction="block" gap="base">
                      <s-select label="Countries" value="all">
                        <s-option value="all">All countries</s-option>
                        <s-option value="selected">Selected countries</s-option>
                      </s-select>
                      <s-checkbox
                        label="Exclude shipping rates over a certain amount"
                      />
                    </s-stack>
                  </FormSection>
                )}

                <FormSection title="Eligibility">
                  <s-select label="Eligibility" value="all">
                    <s-option value="all">All customers</s-option>
                    <s-option value="segments">Specific customer segments</s-option>
                    <s-option value="customers">Specific customers</s-option>
                  </s-select>
                </FormSection>

                {discountType !== "bxgy" && (
                  <FormSection title="Minimum purchase requirements">
                    <s-stack direction="block" gap="small">
                      <s-radio-button
                        name="minimumRequirement"
                        value="none"
                        label="No minimum requirements"
                        checked
                      />
                      <s-radio-button
                        name="minimumRequirement"
                        value="amount"
                        label="Minimum purchase amount"
                      />
                      <s-radio-button
                        name="minimumRequirement"
                        value="quantity"
                        label="Minimum quantity of items"
                      />
                    </s-stack>
                  </FormSection>
                )}

                <FormSection title="Maximum discount uses">
                  <s-stack direction="block" gap="small">
                    <s-checkbox label="Limit number of times this discount can be used in total" />
                    <s-checkbox label="Limit to one use per customer" />
                  </s-stack>
                </FormSection>

                <FormSection title="Combinations">
                  <div
                    style={{
                      color: "#616161",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    This discount won't combine with other product, order, or shipping discounts in the customer's cart.
                  </div>
                </FormSection>

                <FormSection title="Schedule">
                  <s-stack direction="block" gap="base">
                    <s-text-field label="Start date" type="date" />
                    <s-text-field label="Start time" type="time" />
                    <s-checkbox label="Set end date" />
                  </s-stack>
                </FormSection>

                <FormSection title="Website promotion">
                  <s-stack direction="block" gap="small">
                    <s-checkbox label="Include in promotion sync" checked />
                    <s-checkbox label="Enable website promotion" />
                    <s-checkbox label="Show on product pages" />
                    <s-checkbox label="Show on collection pages" />
                    <s-checkbox label="Show product badge" />
                    <s-checkbox label="Show countdown" />
                    <s-checkbox label="Show header banner" />
                  </s-stack>
                </FormSection>

                <FormSection title="Messages and styling">
                  <s-stack direction="block" gap="base">
                    <s-text-field label="Headline" />
                    <s-text-area label="Body" rows={4} />
                    <s-text-field label="Badge text" />
                    <s-text-field label="Countdown text" />
                    <s-text-field label="Button text" />
                    <s-url-field label="Button URL" />
                    <s-color-field label="Background colour" value="#ffffff" />
                    <s-color-field label="Text colour" value="#000000" />
                    <s-color-field label="Badge colour" value="#d72c0d" />
                  </s-stack>
                </FormSection>

                <s-banner tone="info">
                  The creation form layout is now in place. Shopify discount creation and Promotion Engine saving will be connected in the next implementation pass.
                </s-banner>
              </s-stack>
            </div>

            <aside
              style={{
                position: "sticky",
                top: "20px",
              }}
            >
              <div
                style={{
                  paddingBottom: "14px",
                  borderBottom: "1px solid #eeeeee",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 650 }}>
                  {method === "code"
                    ? discountCode || "No discount code yet"
                    : automaticTitle || "No title yet"}
                </div>
                <div style={{ marginTop: "2px", color: "#616161", fontSize: "12px" }}>
                  {method === "code" ? "Code" : "Automatic"}
                </div>
              </div>

              <div
                style={{
                  padding: "16px 0",
                  borderBottom: "1px solid #eeeeee",
                }}
              >
                <div style={{ color: "#616161", fontSize: "12px" }}>Type</div>
                <div style={{ marginTop: "8px", fontSize: "13px", fontWeight: 650 }}>
                  {config.title}
                </div>
                <div style={{ marginTop: "4px", fontSize: "12px" }}>
                  {config.typeLabel}
                </div>
              </div>

              <div style={{ padding: "16px 0" }}>
                <div style={{ color: "#616161", fontSize: "12px" }}>Details</div>
                <ul
                  style={{
                    margin: "8px 0 0",
                    paddingLeft: "18px",
                    color: "#202223",
                    fontSize: "12px",
                    lineHeight: 1.65,
                  }}
                >
                  {details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          <style>{`
            @media (max-width: 800px) {
              .create-discount-layout {
                grid-template-columns: 1fr !important;
              }

              .create-discount-layout aside {
                position: static !important;
                order: -1;
                padding: 16px;
                border: 1px solid #dedede;
                border-radius: 12px;
                background: #ffffff;
              }
            }
          `}</style>
        </s-stack>
      </div>
    </s-page>
  );
}
