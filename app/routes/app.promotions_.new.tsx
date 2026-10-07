import { useMemo, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";

import { authenticate } from "../shopify.server";

type LinkResource = {
  id: string;
  title: string;
  handle: string;
};

type LinkResourcesResponse = {
  data?: {
    products?: { nodes: LinkResource[] };
    collections?: { nodes: LinkResource[] };
  };
  errors?: Array<{ message: string }>;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query PromotionLinkResources {
      products(first: 50, sortKey: TITLE) {
        nodes {
          id
          title
          handle
        }
      }
      collections(first: 50, sortKey: TITLE) {
        nodes {
          id
          title
          handle
        }
      }
    }
  `);

  const result = (await response.json()) as LinkResourcesResponse;

  if (result.errors?.length) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  return {
    products: result.data?.products?.nodes ?? [],
    collections: result.data?.collections?.nodes ?? [],
  };
}

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
  const { products, collections } = useLoaderData<typeof loader>();
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
  const [valueType, setValueType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [appliesTo, setAppliesTo] = useState<"products" | "collections">("collections");
  const [buyRequirement, setBuyRequirement] = useState<"quantity" | "amount">("quantity");
  const [buyQuantity, setBuyQuantity] = useState("1");
  const [buyAmount, setBuyAmount] = useState("");
  const [buyAppliesTo, setBuyAppliesTo] = useState<"products" | "collections">("products");
  const [getQuantity, setGetQuantity] = useState("1");
  const [getAppliesTo, setGetAppliesTo] = useState<"products" | "collections">("products");
  const [rewardType, setRewardType] = useState<"percentage" | "amount" | "free">("percentage");
  const [rewardValue, setRewardValue] = useState("");
  const [maxUsesPerOrder, setMaxUsesPerOrder] = useState(false);
  const [eligibility, setEligibility] = useState<"all" | "segments" | "customers">("all");
  const [eligibilitySearch, setEligibilitySearch] = useState("");
  const [included, setIncluded] = useState(true);
  const [websiteEnabled, setWebsiteEnabled] = useState(false);
  const [showProductPage, setShowProductPage] = useState(false);
  const [showCollectionPage, setShowCollectionPage] = useState(false);
  const [showProductBadge, setShowProductBadge] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showHeaderBanner, setShowHeaderBanner] = useState(false);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [countdownText, setCountdownText] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [backgroundColour, setBackgroundColour] = useState("#ffffff");
  const [textColour, setTextColour] = useState("#000000");
  const [badgeColour, setBadgeColour] = useState("#d72c0d");
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const [linkType, setLinkType] = useState<"collections" | "products" | "custom">("collections");
  const [linkSearch, setLinkSearch] = useState("");
  const [buttonLinkLabel, setButtonLinkLabel] = useState("");

  function generateDiscountCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 10 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");

    setDiscountCode(code);
  }

  const details = useMemo(() => {
    const eligibilityDetail =
      eligibility === "all"
        ? "All customers"
        : eligibility === "segments"
          ? "Specific customer segments"
          : "Specific customers";

    const base = [
      eligibilityDetail,
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
  }, [discountType, eligibility]);

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
                      <div
                        className="discount-value-row"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) 170px",
                          gap: "8px",
                          alignItems: "end",
                        }}
                      >
                        <s-select
                          label="Discount type"
                          value={valueType}
                          onChange={(event) =>
                            setValueType(
                              event.currentTarget.value as "percentage" | "fixed",
                            )
                          }
                        >
                          <s-option value="percentage">Percentage</s-option>
                          <s-option value="fixed">Fixed amount</s-option>
                        </s-select>

                        <s-number-field
                          label="Value"
                          labelAccessibilityVisibility="exclusive"
                          min={0}
                          step={0.01}
                          value={discountValue}
                          prefix={valueType === "fixed" ? "£" : undefined}
                          suffix={valueType === "percentage" ? "%" : undefined}
                          onInput={(event) =>
                            setDiscountValue(event.currentTarget.value)
                          }
                        />
                      </div>

                      <s-select
                        label="Applies to"
                        value={appliesTo}
                        onChange={(event) =>
                          setAppliesTo(
                            event.currentTarget.value as "products" | "collections",
                          )
                        }
                      >
                        <s-option value="collections">Specific collections</s-option>
                        <s-option value="products">Specific products</s-option>
                      </s-select>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          gap: "8px",
                          alignItems: "end",
                        }}
                      >
                        <s-text-field
                          label={appliesTo === "collections" ? "Search collections" : "Search products"}
                          labelAccessibilityVisibility="exclusive"
                          placeholder={appliesTo === "collections" ? "Search collections" : "Search products"}
                        />
                        <s-button type="button" variant="secondary">
                          Browse
                        </s-button>
                      </div>
                    </s-stack>
                  </FormSection>
                )}

                {discountType === "order" && (
                  <FormSection title="Discount value">
                    <div
                      className="discount-value-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) 170px",
                        gap: "8px",
                        alignItems: "end",
                      }}
                    >
                      <s-select
                        label="Discount type"
                        value={valueType}
                        onChange={(event) =>
                          setValueType(
                            event.currentTarget.value as "percentage" | "fixed",
                          )
                        }
                      >
                        <s-option value="percentage">Percentage</s-option>
                        <s-option value="fixed">Fixed amount</s-option>
                      </s-select>

                      <s-number-field
                        label="Value"
                        labelAccessibilityVisibility="exclusive"
                        min={0}
                        step={0.01}
                        value={discountValue}
                        prefix={valueType === "fixed" ? "£" : undefined}
                        suffix={valueType === "percentage" ? "%" : undefined}
                        onInput={(event) =>
                          setDiscountValue(event.currentTarget.value)
                        }
                      />
                    </div>
                  </FormSection>
                )}

                {discountType === "bxgy" && (
                  <FormSection title="Discount value">
                    <s-stack direction="block" gap="large">
                      <div>
                        <div
                          style={{
                            marginBottom: "10px",
                            fontSize: "13px",
                            fontWeight: 650,
                          }}
                        >
                          Customer buys
                        </div>

                        <s-stack direction="block" gap="base">
                          <s-radio-button
                            name="buyRequirement"
                            value="quantity"
                            label="Minimum quantity of items"
                            checked={buyRequirement === "quantity"}
                            onChange={() => setBuyRequirement("quantity")}
                          />
                          <s-radio-button
                            name="buyRequirement"
                            value="amount"
                            label="Minimum purchase amount"
                            checked={buyRequirement === "amount"}
                            onChange={() => setBuyRequirement("amount")}
                          />

                          <div
                            className="bxgy-pair-row"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "120px minmax(0, 1fr)",
                              gap: "8px",
                            }}
                          >
                            {buyRequirement === "quantity" ? (
                              <s-number-field
                                label="Quantity"
                                min={1}
                                step={1}
                                value={buyQuantity}
                                onInput={(event) =>
                                  setBuyQuantity(event.currentTarget.value)
                                }
                              />
                            ) : (
                              <s-number-field
                                label="Amount"
                                min={0}
                                step={0.01}
                                prefix="£"
                                value={buyAmount}
                                onInput={(event) =>
                                  setBuyAmount(event.currentTarget.value)
                                }
                              />
                            )}

                            <s-select
                              label="Any items from"
                              value={buyAppliesTo}
                              onChange={(event) =>
                                setBuyAppliesTo(
                                  event.currentTarget.value as "products" | "collections",
                                )
                              }
                            >
                              <s-option value="products">Specific products</s-option>
                              <s-option value="collections">Specific collections</s-option>
                            </s-select>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(0, 1fr) auto",
                              gap: "8px",
                              alignItems: "end",
                            }}
                          >
                            <s-text-field
                              label={buyAppliesTo === "products" ? "Search products" : "Search collections"}
                              labelAccessibilityVisibility="exclusive"
                              placeholder={buyAppliesTo === "products" ? "Search products" : "Search collections"}
                            />
                            <s-button type="button" variant="secondary">
                              Browse
                            </s-button>
                          </div>
                        </s-stack>
                      </div>

                      <div
                        style={{
                          paddingTop: "16px",
                          borderTop: "1px solid #eeeeee",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 650,
                          }}
                        >
                          Customer gets
                        </div>
                        <div
                          style={{
                            marginBottom: "12px",
                            color: "#616161",
                            fontSize: "12px",
                            lineHeight: 1.45,
                          }}
                        >
                          Customers must add the quantity of items specified below to their cart.
                        </div>

                        <s-stack direction="block" gap="base">
                          <div
                            className="bxgy-pair-row"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "120px minmax(0, 1fr)",
                              gap: "8px",
                            }}
                          >
                            <s-number-field
                              label="Quantity"
                              min={1}
                              step={1}
                              value={getQuantity}
                              onInput={(event) =>
                                setGetQuantity(event.currentTarget.value)
                              }
                            />

                            <s-select
                              label="Any items from"
                              value={getAppliesTo}
                              onChange={(event) =>
                                setGetAppliesTo(
                                  event.currentTarget.value as "products" | "collections",
                                )
                              }
                            >
                              <s-option value="products">Specific products</s-option>
                              <s-option value="collections">Specific collections</s-option>
                            </s-select>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(0, 1fr) auto",
                              gap: "8px",
                              alignItems: "end",
                            }}
                          >
                            <s-text-field
                              label={getAppliesTo === "products" ? "Search products" : "Search collections"}
                              labelAccessibilityVisibility="exclusive"
                              placeholder={getAppliesTo === "products" ? "Search products" : "Search collections"}
                            />
                            <s-button type="button" variant="secondary">
                              Browse
                            </s-button>
                          </div>

                          <div
                            style={{
                              paddingTop: "4px",
                            }}
                          >
                            <div
                              style={{
                                marginBottom: "8px",
                                color: "#303030",
                                fontSize: "12px",
                                fontWeight: 650,
                              }}
                            >
                              At a discounted value
                            </div>

                            <s-stack direction="block" gap="small">
                              <s-radio-button
                                name="rewardType"
                                value="percentage"
                                label="Percentage"
                                checked={rewardType === "percentage"}
                                onChange={() => setRewardType("percentage")}
                              />
                              {rewardType === "percentage" && (
                                <div style={{ maxWidth: "150px", marginLeft: "26px" }}>
                                  <s-number-field
                                    label="Percentage"
                                    labelAccessibilityVisibility="exclusive"
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    suffix="%"
                                    value={rewardValue}
                                    onInput={(event) =>
                                      setRewardValue(event.currentTarget.value)
                                    }
                                  />
                                </div>
                              )}

                              <s-radio-button
                                name="rewardType"
                                value="amount"
                                label="Amount off each"
                                checked={rewardType === "amount"}
                                onChange={() => setRewardType("amount")}
                              />
                              {rewardType === "amount" && (
                                <div style={{ maxWidth: "150px", marginLeft: "26px" }}>
                                  <s-number-field
                                    label="Amount"
                                    labelAccessibilityVisibility="exclusive"
                                    min={0}
                                    step={0.01}
                                    prefix="£"
                                    value={rewardValue}
                                    onInput={(event) =>
                                      setRewardValue(event.currentTarget.value)
                                    }
                                  />
                                </div>
                              )}

                              <s-radio-button
                                name="rewardType"
                                value="free"
                                label="Free"
                                checked={rewardType === "free"}
                                onChange={() => setRewardType("free")}
                              />
                            </s-stack>
                          </div>

                          <div
                            style={{
                              paddingTop: "14px",
                              borderTop: "1px solid #eeeeee",
                            }}
                          >
                            <s-checkbox
                              label="Set a maximum number of uses per order"
                              checked={maxUsesPerOrder}
                              onChange={(event) =>
                                setMaxUsesPerOrder(event.currentTarget.checked)
                              }
                            />
                          </div>
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
                  <s-stack direction="block" gap="base">
                    <s-select
                      label="Eligibility"
                      value={eligibility}
                      onChange={(event) => {
                        setEligibility(
                          event.currentTarget.value as
                            | "all"
                            | "segments"
                            | "customers",
                        );
                        setEligibilitySearch("");
                      }}
                    >
                      <s-option value="all">All customers</s-option>
                      <s-option value="segments">
                        Specific customer segments
                      </s-option>
                      <s-option value="customers">
                        Specific customers
                      </s-option>
                    </s-select>

                    {eligibility !== "all" && (
                      <div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr) auto",
                            gap: "8px",
                            alignItems: "end",
                          }}
                        >
                          <s-text-field
                            label={
                              eligibility === "segments"
                                ? "Search customer segments"
                                : "Search customers"
                            }
                            labelAccessibilityVisibility="exclusive"
                            placeholder={
                              eligibility === "segments"
                                ? "Search customer segments"
                                : "Search customers"
                            }
                            value={eligibilitySearch}
                            onInput={(event) =>
                              setEligibilitySearch(event.currentTarget.value)
                            }
                          />

                          <s-button type="button" variant="secondary">
                            Browse
                          </s-button>
                        </div>

                        <div
                          style={{
                            marginTop: "8px",
                            color: "#616161",
                            fontSize: "12px",
                            lineHeight: 1.45,
                          }}
                        >
                          {eligibility === "segments"
                            ? "Select the customer segments that can use this discount."
                            : "Select the individual customers that can use this discount."}
                        </div>
                      </div>
                    )}
                  </s-stack>
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
                    <s-checkbox
                      label="Include in promotion sync"
                      checked={included}
                      onChange={(event) => setIncluded(event.currentTarget.checked)}
                    />
                    <s-checkbox
                      label="Enable website promotion"
                      checked={websiteEnabled}
                      onChange={(event) => setWebsiteEnabled(event.currentTarget.checked)}
                    />
                    <s-checkbox
                      label="Show on product pages"
                      checked={showProductPage}
                      onChange={(event) => setShowProductPage(event.currentTarget.checked)}
                    />
                    <s-checkbox
                      label="Show on collection pages"
                      checked={showCollectionPage}
                      onChange={(event) => setShowCollectionPage(event.currentTarget.checked)}
                    />
                    <s-checkbox
                      label="Show product badge"
                      checked={showProductBadge}
                      onChange={(event) => setShowProductBadge(event.currentTarget.checked)}
                    />
                    <s-checkbox
                      label="Show countdown"
                      checked={showCountdown}
                      onChange={(event) => setShowCountdown(event.currentTarget.checked)}
                    />
                    <s-checkbox
                      label="Show header banner"
                      checked={showHeaderBanner}
                      onChange={(event) => setShowHeaderBanner(event.currentTarget.checked)}
                    />
                  </s-stack>
                </FormSection>

                <FormSection title="Messages and styling">
                  <s-stack direction="block" gap="base">
                    <s-text-field
                      label="Headline"
                      value={headline}
                      onInput={(event) => setHeadline(event.currentTarget.value)}
                    />
                    <s-text-area
                      label="Body"
                      rows={4}
                      value={body}
                      onInput={(event) => setBody(event.currentTarget.value)}
                    />
                    <s-text-field
                      label="Badge text"
                      value={badgeText}
                      onInput={(event) => setBadgeText(event.currentTarget.value)}
                    />
                    <s-text-field
                      label="Countdown text"
                      value={countdownText}
                      onInput={(event) => setCountdownText(event.currentTarget.value)}
                    />
                    <s-text-field
                      label="Button text"
                      value={buttonText}
                      onInput={(event) => setButtonText(event.currentTarget.value)}
                    />
                    <div>
                      <div
                        style={{
                          marginBottom: "6px",
                          color: "#303030",
                          fontSize: "12px",
                          fontWeight: 650,
                        }}
                      >
                        Button link
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            minHeight: "34px",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 10px",
                            border: "1px solid #c9c9c9",
                            borderRadius: "8px",
                            background: "#ffffff",
                            color: buttonUrl ? "#202223" : "#8c8c8c",
                            fontSize: "13px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {buttonLinkLabel || buttonUrl || "No link selected"}
                        </div>

                        <s-button
                          type="button"
                          variant="secondary"
                          onClick={() => setShowLinkSelector(true)}
                        >
                          {buttonUrl ? "Change" : "Select"}
                        </s-button>
                      </div>

                      {buttonUrl && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            marginTop: "6px",
                          }}
                        >
                          <div
                            style={{
                              minWidth: 0,
                              color: "#616161",
                              fontSize: "11px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {buttonUrl}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setButtonUrl("");
                              setButtonLinkLabel("");
                            }}
                            style={{
                              border: 0,
                              padding: 0,
                              background: "transparent",
                              color: "#8a1f11",
                              font: "inherit",
                              fontSize: "11px",
                              cursor: "pointer",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    <s-color-field
                      label="Background colour"
                      value={backgroundColour}
                      onInput={(event) => setBackgroundColour(event.currentTarget.value)}
                    />
                    <s-color-field
                      label="Text colour"
                      value={textColour}
                      onInput={(event) => setTextColour(event.currentTarget.value)}
                    />
                    <s-color-field
                      label="Badge colour"
                      value={badgeColour}
                      onInput={(event) => setBadgeColour(event.currentTarget.value)}
                    />
                  </s-stack>
                </FormSection>

                <FormSection title="Website preview">
                  <div
                    style={{
                      overflow: "hidden",
                      border: "1px solid #d9d9d9",
                      borderRadius: "12px",
                      background: "#f6f6f7",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        padding: "10px 12px",
                        borderBottom: "1px solid #e4e4e4",
                        background: "#ffffff",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 650 }}>
                          Live website preview
                        </div>
                        <div style={{ marginTop: "2px", color: "#616161", fontSize: "11px" }}>
                          Preview only — nothing is published until the promotion is saved.
                        </div>
                      </div>
                      <s-badge tone={websiteEnabled && included ? "success" : "neutral"}>
                        {websiteEnabled && included ? "Enabled" : "Not enabled"}
                      </s-badge>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        background: "#f4f4f4",
                      }}
                    >
                      {showHeaderBanner && (
                        <div
                          style={{
                            marginBottom: "14px",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            background: backgroundColour,
                            color: textColour,
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: 650,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                          }}
                        >
                          {headline || "Promotion headline"}
                          {showCountdown && (
                            <span style={{ marginLeft: "8px", fontWeight: 500 }}>
                              {countdownText || "Offer ends soon"}
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(180px, 0.8fr) minmax(0, 1.2fr)",
                          gap: "14px",
                        }}
                        className="website-preview-grid"
                      >
                        <div
                          style={{
                            position: "relative",
                            minHeight: "250px",
                            overflow: "hidden",
                            border: "1px solid #dddddd",
                            borderRadius: "10px",
                            background: "#ffffff",
                          }}
                        >
                          <div
                            style={{
                              height: "150px",
                              background: "linear-gradient(135deg, #eeeeee, #dddddd)",
                            }}
                          />
                          {showProductBadge && (
                            <div
                              style={{
                                position: "absolute",
                                top: "12px",
                                left: "12px",
                                padding: "4px 8px",
                                borderRadius: "999px",
                                background: badgeColour,
                                color: "#ffffff",
                                fontSize: "10px",
                                fontWeight: 700,
                              }}
                            >
                              {badgeText || "PROMOTION"}
                            </div>
                          )}
                          <div style={{ padding: "12px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 650 }}>
                              Example product
                            </div>
                            <div style={{ marginTop: "4px", color: "#616161", fontSize: "11px" }}>
                              £29.99
                            </div>
                            {showCollectionPage && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  padding: "8px",
                                  borderRadius: "6px",
                                  background: backgroundColour,
                                  color: textColour,
                                  fontSize: "10px",
                                }}
                              >
                                {headline || "Promotion headline"}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            minHeight: "250px",
                            padding: "18px",
                            border: "1px solid #dddddd",
                            borderRadius: "10px",
                            background: "#ffffff",
                          }}
                        >
                          <div
                            style={{
                              display: "inline-block",
                              padding: "3px 7px",
                              borderRadius: "999px",
                              background: "#f1f1f1",
                              color: "#616161",
                              fontSize: "10px",
                            }}
                          >
                            Product page
                          </div>

                          <div style={{ marginTop: "16px", fontSize: "18px", fontWeight: 700 }}>
                            Example product
                          </div>
                          <div style={{ marginTop: "6px", fontSize: "14px" }}>£29.99</div>

                          {showProductPage && (
                            <div
                              style={{
                                marginTop: "18px",
                                padding: "14px",
                                borderRadius: "8px",
                                background: backgroundColour,
                                color: textColour,
                              }}
                            >
                              <div style={{ fontSize: "13px", fontWeight: 700 }}>
                                {headline || "Promotion headline"}
                              </div>
                              {body && (
                                <div style={{ marginTop: "5px", fontSize: "11px", lineHeight: 1.45 }}>
                                  {body}
                                </div>
                              )}
                              {showCountdown && (
                                <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 650 }}>
                                  {countdownText || "Offer ends soon"}
                                </div>
                              )}
                              {buttonText && (
                                <span
                                  style={{
                                    display: "inline-block",
                                    marginTop: "10px",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    background: textColour,
                                    color: backgroundColour,
                                    fontSize: "10px",
                                    fontWeight: 650,
                                  }}
                                >
                                  {buttonText}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {!showHeaderBanner &&
                        !showProductPage &&
                        !showCollectionPage &&
                        !showProductBadge && (
                          <div
                            style={{
                              marginTop: "14px",
                              padding: "12px",
                              border: "1px dashed #c9c9c9",
                              borderRadius: "8px",
                              background: "#ffffff",
                              color: "#616161",
                              fontSize: "12px",
                              textAlign: "center",
                            }}
                          >
                            Select one or more website placements above to preview the promotion.
                          </div>
                        )}
                    </div>
                  </div>
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


          {showLinkSelector && (
            <div
              role="presentation"
              onClick={() => setShowLinkSelector(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: "rgba(0, 0, 0, 0.45)",
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="link-selector-title"
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(100%, 560px)",
                  maxHeight: "78vh",
                  overflow: "hidden",
                  borderRadius: "14px",
                  background: "#ffffff",
                  boxShadow: "0 18px 48px rgba(0,0,0,0.24)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "16px 18px",
                    borderBottom: "1px solid #eeeeee",
                  }}
                >
                  <div id="link-selector-title" style={{ fontSize: "16px", fontWeight: 700 }}>
                    Select link
                  </div>

                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setShowLinkSelector(false)}
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "1px solid #dedede",
                      borderRadius: "8px",
                      background: "#ffffff",
                      fontSize: "18px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "150px minmax(0, 1fr)",
                    minHeight: "360px",
                  }}
                  className="link-selector-layout"
                >
                  <div
                    style={{
                      padding: "10px",
                      borderRight: "1px solid #eeeeee",
                      background: "#fafafa",
                    }}
                  >
                    {[
                      ["collections", "Collections"],
                      ["products", "Products"],
                      ["custom", "Custom URL"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setLinkType(value as "collections" | "products" | "custom");
                          setLinkSearch("");
                        }}
                        style={{
                          width: "100%",
                          marginBottom: "4px",
                          padding: "9px 10px",
                          border: 0,
                          borderRadius: "8px",
                          background: linkType === value ? "#e8e8e8" : "transparent",
                          color: "#202223",
                          textAlign: "left",
                          font: "inherit",
                          fontSize: "12px",
                          fontWeight: linkType === value ? 650 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {linkType === "custom" ? (
                      <div style={{ padding: "16px" }}>
                        <s-url-field
                          label="URL"
                          placeholder="https://example.com or /pages/example"
                          value={buttonUrl}
                          onInput={(event) => setButtonUrl(event.currentTarget.value)}
                        />
                        <div style={{ marginTop: "12px", textAlign: "right" }}>
                          <s-button
                            type="button"
                            variant="primary"
                            onClick={() => {
                              setButtonLinkLabel(buttonUrl);
                              setShowLinkSelector(false);
                            }}
                          >
                            Select
                          </s-button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ padding: "12px", borderBottom: "1px solid #eeeeee" }}>
                          <s-text-field
                            label={linkType === "collections" ? "Search collections" : "Search products"}
                            labelAccessibilityVisibility="exclusive"
                            placeholder={linkType === "collections" ? "Search collections" : "Search products"}
                            value={linkSearch}
                            onInput={(event) => setLinkSearch(event.currentTarget.value)}
                          />
                        </div>

                        <div
                          style={{
                            overflowY: "auto",
                            padding: "6px",
                          }}
                        >
                          {(linkType === "collections" ? collections : products)
                            .filter((item) =>
                              item.title.toLowerCase().includes(linkSearch.trim().toLowerCase()),
                            )
                            .map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  const url =
                                    linkType === "collections"
                                      ? `/collections/${item.handle}`
                                      : `/products/${item.handle}`;

                                  setButtonUrl(url);
                                  setButtonLinkLabel(item.title);
                                  setShowLinkSelector(false);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "12px",
                                  width: "100%",
                                  padding: "10px 12px",
                                  border: 0,
                                  borderBottom: "1px solid #f1f1f1",
                                  background: "#ffffff",
                                  color: "#202223",
                                  textAlign: "left",
                                  font: "inherit",
                                  cursor: "pointer",
                                }}
                              >
                                <span
                                  style={{
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontSize: "12px",
                                  }}
                                >
                                  {item.title}
                                </span>
                                <span style={{ color: "#8c8c8c" }}>›</span>
                              </button>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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

              .discount-value-row,
              .bxgy-pair-row,
              .website-preview-grid,
              .link-selector-layout {
                grid-template-columns: 1fr !important;
              }

              .link-selector-layout > div:first-child {
                border-right: 0 !important;
                border-bottom: 1px solid #eeeeee;
              }
            }
          `}</style>
        </s-stack>
      </div>
    </s-page>
  );
}
