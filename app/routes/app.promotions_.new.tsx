import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useSearchParams, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import { createShopifyPromotion, type CreateDiscountDraft } from "../modules/promotions/services/createPromotion.server";
import { getDiscount } from "../modules/promotions/services/discount.server";
import { updatePromotionWebsiteSettings } from "../modules/promotions/services/promotionSettings.server";
import { defaultDesign, readWebsite, websiteStorage, validateWebsite, type WebsiteDraft } from "../modules/promotions/design/design";
import { PromotionWebsiteEditor } from "../modules/promotions/components/PromotionWebsiteEditor";
import { PromotionPreview, type PreviewProduct } from "../modules/promotions/components/PromotionPreview";
import type { action as previewAction } from "./app.promotion-preview";


function ScheduleDateTimeField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [month, setMonth] = useState({ year: 2000, month: 0 });
  const fieldRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !fieldRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    const initial = value || min || "";
    const date = initial ? new Date(initial) : new Date();
    setDraft(initial);
    setMonth({ year: date.getFullYear(), month: date.getMonth() });
    setOpen(true);
  }

  const datePart = draft.slice(0, 10);
  const hour = draft.slice(11, 13) || "00";
  const minute = draft.slice(14, 16) || "00";
  const valid = Boolean(datePart) && (!min || draft >= min);
  const firstDay = (new Date(month.year, month.month, 1).getDay() + 6) % 7;
  const days = new Date(month.year, month.month + 1, 0).getDate();
  const monthTitle = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" })
    .format(new Date(month.year, month.month, 1));
  const summary = value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Select date and time";
  const controlStyle = { padding: "8px", border: "1px solid #c9c9c9", borderRadius: "8px", background: "#fff", color: "#202223", font: "inherit", cursor: "pointer" };

  function moveMonth(offset: number) {
    const date = new Date(month.year, month.month + offset, 1);
    setMonth({ year: date.getFullYear(), month: date.getMonth() });
  }

  return (
    <div style={{ display: "grid", gap: "5px", fontSize: "12px", color: "#303030" }}>
      <span id={id + "-label"}>{label}</span>
      <div ref={fieldRef} style={{ position: "relative" }}>
        {open && (
          <div ref={dialogRef} id={id + "-editor"} role="dialog" aria-labelledby={id + "-title"} tabIndex={-1}
            style={{ position: "absolute", zIndex: 50, bottom: "calc(100% + 8px)", left: 0, width: "min(340px, 100%)", maxHeight: "60vh", overflowY: "auto", boxSizing: "border-box", padding: "16px", border: "1px solid #c9c9c9", borderRadius: "12px", background: "#fff", boxShadow: "0 10px 28px rgba(0,0,0,.16)" }}>
            <div id={id + "-title"} style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>{label}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
              <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} style={controlStyle}>‹</button>
              <span aria-live="polite" style={{ fontWeight: 600 }}>{monthTitle}</span>
              <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} style={controlStyle}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "3px" }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day} style={{ textAlign: "center", fontSize: "10px", color: "#616161", padding: "5px 0" }}>{day}</span>)}
              {Array.from({ length: firstDay }, (_, index) => <span key={"blank-" + index} />)}
              {Array.from({ length: days }, (_, index) => {
                const day = index + 1;
                const dayValue = String(month.year).padStart(4, "0") + "-" + String(month.month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
                const disabled = Boolean(min && dayValue < min.slice(0, 10));
                const selected = dayValue === datePart;
                return <button key={dayValue} type="button" disabled={disabled} aria-pressed={selected}
                  aria-label={new Intl.DateTimeFormat("en-GB", { dateStyle: "full" }).format(new Date(month.year, month.month, day))}
                  onClick={() => setDraft(dayValue + "T" + hour + ":" + minute)}
                  style={{ ...controlStyle, padding: "7px 0", borderColor: selected ? "#202223" : "transparent", background: selected ? "#202223" : "#fff", color: selected ? "#fff" : disabled ? "#b5b5b5" : "#202223", cursor: disabled ? "default" : "pointer" }}>{day}</button>;
              })}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "end", marginTop: "14px" }}>
              <label htmlFor={id + "-hour"} style={{ display: "grid", gap: "5px", flex: 1 }}>Hour
                <select id={id + "-hour"} disabled={!datePart} value={hour} onChange={event => setDraft(datePart + "T" + event.currentTarget.value + ":" + minute)} style={controlStyle}>
                  {Array.from({ length: 24 }, (_, index) => { const option = String(index).padStart(2, "0"); return <option key={option} value={option}>{option}</option>; })}
                </select>
              </label>
              <label htmlFor={id + "-minute"} style={{ display: "grid", gap: "5px", flex: 1 }}>Minute
                <select id={id + "-minute"} disabled={!datePart} value={minute} onChange={event => setDraft(datePart + "T" + hour + ":" + event.currentTarget.value)} style={controlStyle}>
                  {Array.from({ length: 60 }, (_, index) => { const option = String(index).padStart(2, "0"); return <option key={option} value={option}>{option}</option>; })}
                </select>
              </label>
              <span style={{ color: "#616161", paddingBottom: "9px", fontSize: "11px" }}>Local time</span>
            </div>
            {datePart && !valid && <p role="alert" style={{ color: "#b42318", margin: "10px 0 0" }}>End date and time must be on or after the start.</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button type="button" onClick={close} style={controlStyle}>Cancel</button>
              <button type="button" disabled={!valid} onClick={() => { onChange(draft); close(); }}
                style={{ ...controlStyle, background: valid ? "#202223" : "#eee", color: valid ? "#fff" : "#999", cursor: valid ? "pointer" : "default" }}>Done</button>
            </div>
          </div>
        )}
        <button ref={triggerRef} type="button" aria-labelledby={id + "-label"} aria-haspopup="dialog" aria-expanded={open}
          aria-controls={open ? id + "-editor" : undefined} onClick={toggle}
          style={{ ...controlStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%", minHeight: "42px", padding: "8px 10px", fontSize: "13px", textAlign: "left", boxSizing: "border-box" }}>
          <span>{summary}</span><span style={{ color: "#616161", fontSize: "11px" }}>Local time</span>
        </button>
      </div>
    </div>
  );
}

type LinkResource = {
id: string;
title: string;
handle: string;
featuredImage?: {
url: string;
altText: string | null;
} | null;
priceRangeV2?: {
minVariantPrice: {
amount: string;
currencyCode: string;
};
} | null;
};

type LinkResourcesResponse = {
data?: {
products?: { nodes: LinkResource[] };
collections?: { nodes: LinkResource[] };
};
errors?: Array<{ message: string }>;
};

type ResourceVariant = {
id: string;
title: string;
};

type ResourceSearchItem = {
id: string;
title: string;
handle: string;
imageUrl?: string | null;
variants?: ResourceVariant[];
selectedVariantIds?: string[];
};

type EligibilityResource = {
id: string;
name: string;
secondary?: string | null;
};

type PromotionActionData = {
success: boolean;
savedId?: string;
redirectId?: string;
image?: {
id: string;
url: string;
alt: string | null;
};
resources?: ResourceSearchItem[];
eligibilityResources?: EligibilityResource[];
error?: string;
};

export async function action({ request }: ActionFunctionArgs): Promise<PromotionActionData> {
const { admin, session } = await authenticate.admin(request);
const formData = await request.formData();
const intent = formData.get("intent");
if (intent === "createPromotion") {
let savedId: string | undefined;
try {
const payload = JSON.parse(String(formData.get("payload") ?? "{}"));
const website = readWebsite(payload.website);
const errors = validateWebsite(website, payload.discount?.endsAt);
if (errors.length) throw new Error(errors.join(" "));
if (payload.savedId) {
if (!/^gid:\/\/shopify\/DiscountNode\/\d+$/.test(payload.savedId) || !(await getDiscount(admin, payload.savedId))) throw new Error("The saved discount could not be found.");
savedId = payload.savedId;
} else {
savedId = await createShopifyPromotion(admin, payload.discount as CreateDiscountDraft);
}
await updatePromotionWebsiteSettings(session.shop, savedId!, websiteStorage(website));
return { success: true, savedId, redirectId: savedId!.split("/").pop() };
} catch (error) {
return { success: false, savedId, error: (savedId ? "The Shopify discount was created, but the website settings were not saved. Retry saving to finish. " : "") + (error instanceof Error ? error.message : "The promotion could not be saved.") };
}
}


if (intent === "searchEligibility") {
const eligibilityType = formData.get("eligibilityType");
const query = formData.get("query");

if (
(eligibilityType !== "segments" && eligibilityType !== "customers") ||
typeof query !== "string"
) {
return {
success: false,
error: "The eligibility search request is invalid.",
};
}

const searchQuery = query.trim();

const response = await admin.graphql(
eligibilityType === "segments"
? `
#graphql
query SearchPromotionSegments($query: String) {
segments(first: 50, query: $query) {
nodes {
id
name
}
}
}
`
: `
#graphql
query SearchPromotionCustomers($query: String) {
customers(first: 50, query: $query) {
nodes {
id
displayName
email
}
}
}
`,
{
variables: {
query: searchQuery.length > 0 ? searchQuery : null,
},
},
);

const result = (await response.json()) as {
data?: {
segments?: {
nodes: Array<{
id: string;
name: string;
}>;
};
customers?: {
nodes: Array<{
id: string;
displayName: string;
email: string | null;
}>;
};
};
errors?: Array<{ message: string }>;
};

if (result.errors?.length) {
return {
success: false,
error: result.errors.map((error) => error.message).join(", "),
};
}

return {
success: true,
eligibilityResources:
eligibilityType === "segments"
? (result.data?.segments?.nodes ?? []).map((segment) => ({
id: segment.id,
name: segment.name,
}))
: (result.data?.customers?.nodes ?? []).map((customer) => ({
id: customer.id,
name: customer.displayName,
secondary: customer.email,
})),
};
}

if (intent === "searchResources") {
const resourceType = formData.get("resourceType");
const query = formData.get("query");

if (
(resourceType !== "product" && resourceType !== "collection") ||
typeof query !== "string"
) {
return {
success: false,
error: "The resource search request is invalid.",
};
}

const searchQuery = query.trim();
if (searchQuery.length < 2) {
return {
success: true,
resources: [],
};
}

const response = await admin.graphql(
resourceType === "product"
? `
#graphql
query SearchPromotionProducts($query: String!) {
products(first: 20, query: $query, sortKey: TITLE) {
nodes {
id
title
handle
featuredImage {
url
}
variants(first: 100) {
nodes {
id
title
}
}
}
}
}
`
: `
#graphql
query SearchPromotionCollections($query: String!) {
collections(first: 20, query: $query, sortKey: TITLE) {
nodes {
id
title
handle
}
}
}
`,
{
variables: {
query: `title:*${searchQuery.replace(/"/g, "")}*`,
},
},
);

const result = (await response.json()) as {
data?: {
products?: {
nodes: Array<{
id: string;
title: string;
handle: string;
featuredImage?: { url: string } | null;
variants?: {
nodes: Array<{
id: string;
title: string;
}>;
};
}>;
};
collections?: {
nodes: Array<{
id: string;
title: string;
handle: string;
}>;
};
};
errors?: Array<{ message: string }>;
};

if (result.errors?.length) {
return {
success: false,
error: result.errors.map((error) => error.message).join(", "),
};
}

const nodes =
resourceType === "product"
? result.data?.products?.nodes ?? []
: result.data?.collections?.nodes ?? [];

return {
success: true,
resources: nodes.map((item) => ({
id: item.id,
title: item.title,
handle: item.handle,
imageUrl:
"featuredImage" in item
? item.featuredImage?.url ?? null
: null,
variants:
"variants" in item
? item.variants?.nodes ?? []
: undefined,
selectedVariantIds:
"variants" in item
? (item.variants?.nodes ?? []).map((variant) => variant.id)
: undefined,
})),
};
}

if (intent !== "resolveFile") {
return {
success: false,
error: "Unsupported action.",
};
}

const fileId = formData.get("fileId");

if (
typeof fileId !== "string" ||
!fileId.startsWith("gid://shopify/MediaImage/")
) {
return {
success: false,
error: "The selected Shopify file is invalid.",
};
}

const response = await admin.graphql(
`
#graphql
query PromotionBannerFile($id: ID!) {
node(id: $id) {
... on MediaImage {
id
alt
image {
url
}
}
}
}
`,
{
variables: {
id: fileId,
},
},
);

const result = (await response.json()) as {
data?: {
node?: {
id: string;
alt: string | null;
image?: {
url: string;
} | null;
} | null;
};
errors?: Array<{ message: string }>;
};

if (result.errors?.length) {
return {
success: false,
error: result.errors.map((error) => error.message).join(", "),
};
}

const image = result.data?.node;

if (!image?.image?.url) {
return {
success: false,
error: "The selected image could not be loaded.",
};
}

return {
success: true,
image: {
id: image.id,
url: image.image.url,
alt: image.alt,
},
};
}

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
featuredImage {
url
altText
}
priceRangeV2 {
minVariantPrice {
amount
currencyCode
}
}
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

function formatPreviewPrice(product?: LinkResource): string {
const money = product?.priceRangeV2?.minVariantPrice;

if (!money) {
return "Price unavailable";
}

const amount = Number.parseFloat(money.amount);

if (!Number.isFinite(amount)) {
return money.amount;
}

return new Intl.NumberFormat("en-GB", {
style: "currency",
currency: money.currencyCode || "GBP",
}).format(amount);
}

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
const { products } = useLoaderData<typeof loader>();
const shopify = useAppBridge();
const createFetcher = useFetcher<PromotionActionData>();
const previewFetcher = useFetcher<typeof previewAction>();
const navigate = useNavigate();
const [assetsBusy, setAssetsBusy] = useState(false);
const [submissionError, setSubmissionError] = useState("");
const saveInFlight = useRef(false);
useEffect(() => { if (createFetcher.state === "idle") saveInFlight.current = false; }, [createFetcher.state]);
const [createdDiscountId, setCreatedDiscountId] = useState<string | undefined>();
useEffect(() => {
if (createFetcher.data?.savedId) setCreatedDiscountId(createFetcher.data.savedId);
if (createFetcher.data?.success && createFetcher.data.redirectId) navigate(`/app/promotions/${createFetcher.data.redirectId}`);
}, [createFetcher.data, navigate]);
const resourceFetcher = useFetcher<PromotionActionData>();
const eligibilityFetcher = useFetcher<PromotionActionData>();
const resourceSubmit = resourceFetcher.submit;
const eligibilitySubmit = eligibilityFetcher.submit;
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
const [resourceSearch, setResourceSearch] = useState("");
const [selectedProducts, setSelectedProducts] = useState<ResourceSearchItem[]>([]);
const [selectedCollections, setSelectedCollections] = useState<ResourceSearchItem[]>([]);
const [buySelection, setBuySelection] = useState<ResourceSearchItem[]>([]);
const [getSelection, setGetSelection] = useState<ResourceSearchItem[]>([]);
const [usesPerOrder, setUsesPerOrder] = useState("1");
const [countryMode, setCountryMode] = useState("all");
const [countryCodes, setCountryCodes] = useState("");
const [excludeShippingPrice, setExcludeShippingPrice] = useState(false);
const [maximumShippingPrice, setMaximumShippingPrice] = useState("");
const [buyRequirement, setBuyRequirement] = useState<"quantity" | "amount">("quantity");
const [buyQuantity, setBuyQuantity] = useState("1");
const [buyAmount, setBuyAmount] = useState("");
const [buyAppliesTo, setBuyAppliesTo] = useState<"products" | "collections">("products");
const [getQuantity, setGetQuantity] = useState("1");
const [getAppliesTo, setGetAppliesTo] = useState<"products" | "collections">("products");
const [rewardType, setRewardType] = useState<"percentage" | "amount" | "free">("percentage");
const [rewardValue, setRewardValue] = useState("");
const [maxUsesPerOrder, setMaxUsesPerOrder] = useState(false);
const [minimumRequirement, setMinimumRequirement] = useState<
"none" | "amount" | "quantity"
>("none");
const [minimumPurchaseAmount, setMinimumPurchaseAmount] = useState("");
const [minimumQuantity, setMinimumQuantity] = useState("");
const [limitTotalUses, setLimitTotalUses] = useState(false);
const [totalUsageLimit, setTotalUsageLimit] = useState("");
const [limitOncePerCustomer, setLimitOncePerCustomer] = useState(false);
const [showCombinationPicker, setShowCombinationPicker] = useState(false);
const combinationFieldRef = useRef<HTMLDivElement>(null);
const combinationTriggerRef = useRef<HTMLButtonElement>(null);
const combinationDialogRef = useRef<HTMLDivElement>(null);
useEffect(() => {
if (!showCombinationPicker) return;
combinationDialogRef.current?.focus();
function closeOnOutsideClick(event: PointerEvent) {
if (event.target instanceof Node && !combinationFieldRef.current?.contains(event.target)) {
setShowCombinationPicker(false);
setShowCombinationTags(false);
}
}
function closeOnEscape(event: KeyboardEvent) {
if (event.key === "Escape") {
setShowCombinationPicker(false);
setShowCombinationTags(false);
combinationTriggerRef.current?.focus();
}
}
document.addEventListener("pointerdown", closeOnOutsideClick);
document.addEventListener("keydown", closeOnEscape);
return () => {
document.removeEventListener("pointerdown", closeOnOutsideClick);
document.removeEventListener("keydown", closeOnEscape);
};
}, [showCombinationPicker]);

const [combineProductDiscounts, setCombineProductDiscounts] = useState(false);
const [combineOrderDiscounts, setCombineOrderDiscounts] = useState(false);
const [combineShippingDiscounts, setCombineShippingDiscounts] = useState(false);
const [productCombinationMode, setProductCombinationMode] = useState<"best" | "multiple">("best");
const [showCombinationTags, setShowCombinationTags] = useState(false);
const [combinationTagSearch, setCombinationTagSearch] = useState("");
const [selectedCombinationTags, setSelectedCombinationTags] = useState<string[]>([]);
const [startDateTime, setStartDateTime] = useState("");
const [hasEndDate, setHasEndDate] = useState(false);
const [endDateTime, setEndDateTime] = useState("");
const [eligibility, setEligibility] = useState<"all" | "segments" | "customers">("all");
const [eligibilitySearch, setEligibilitySearch] = useState("");
const [selectedEligibility, setSelectedEligibility] = useState<EligibilityResource[]>([]);
const [showEligibilityPicker, setShowEligibilityPicker] = useState(false);
const [eligibilityPickerSearch, setEligibilityPickerSearch] = useState("");
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
const [design, setDesign] = useState(defaultDesign);
const [priority, setPriority] = useState(0);
const [previewProductId, setPreviewProductId] = useState("");
const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);

function generateDiscountCode() {
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code = Array.from({ length: 10 }, () =>
alphabet[Math.floor(Math.random() * alphabet.length)],
).join("");

setDiscountCode(code);
}


useEffect(() => {
const query = resourceSearch.trim();

if (query.length < 2) {
return;
}

const timeout = window.setTimeout(() => {
resourceSubmit(
{
intent: "searchResources",
resourceType: appliesTo === "products" ? "product" : "collection",
query,
},
{
method: "post",
},
);
}, 250);

return () => window.clearTimeout(timeout);
}, [resourceSearch, appliesTo, resourceSubmit]);

async function browseDiscountResources() {
const type = appliesTo === "products" ? "product" : "collection";
const currentSelection =
appliesTo === "products" ? selectedProducts : selectedCollections;

const selected = await shopify.resourcePicker({
type,
action: "select",
multiple: true,
selectionIds: currentSelection.map((item) => ({
id: item.id,
...(type === "product" && item.selectedVariantIds?.length
? {
variants: item.selectedVariantIds.map((id) => ({ id })),
}
: {}),
})),
...(type === "product"
? {
filter: {
variants: true,
},
}
: {}),
});

if (!selected) {
return;
}

const mapped = selected.map((item) => {
const variants =
"variants" in item && Array.isArray(item.variants)
? item.variants.map((variant) => ({
id: variant.id,
title: variant.title,
}))
: undefined;

return {
id: item.id,
title: item.title,
handle: item.handle,
imageUrl:
"images" in item && Array.isArray(item.images)
? item.images[0]?.originalSrc ?? null
: null,
variants,
selectedVariantIds: variants?.map((variant) => variant.id),
};
});

if (appliesTo === "products") {
setSelectedProducts(mapped);
} else {
setSelectedCollections(mapped);
}

setResourceSearch("");
}

function addSearchedResource(resource: ResourceSearchItem) {
const selectedResource =
appliesTo === "products"
? {
...resource,
selectedVariantIds:
resource.selectedVariantIds ??
resource.variants?.map((variant) => variant.id) ??
[],
}
: resource;

if (appliesTo === "products") {
setSelectedProducts((current) =>
current.some((item) => item.id === resource.id)
? current
: [...current, selectedResource],
);
} else {
setSelectedCollections((current) =>
current.some((item) => item.id === resource.id)
? current
: [...current, selectedResource],
);
}

setResourceSearch("");
}

function removeSelectedResource(id: string) {
if (appliesTo === "products") {
setSelectedProducts((current) =>
current.filter((item) => item.id !== id),
);
} else {
setSelectedCollections((current) =>
current.filter((item) => item.id !== id),
);
}
}


useEffect(() => {
const query = eligibilitySearch.trim();

if (eligibility === "all" || query.length < 2) {
return;
}

const timeout = window.setTimeout(() => {
eligibilitySubmit(
{
intent: "searchEligibility",
eligibilityType: eligibility,
query,
},
{
method: "post",
},
);
}, 250);

return () => window.clearTimeout(timeout);
}, [eligibilitySearch, eligibility, eligibilitySubmit]);

function openEligibilityPicker() {
setEligibilityPickerSearch("");
setShowEligibilityPicker(true);

eligibilitySubmit(
{
intent: "searchEligibility",
eligibilityType: eligibility,
query: "",
},
{
method: "post",
},
);
}

function searchEligibilityPicker(value: string) {
setEligibilityPickerSearch(value);

eligibilitySubmit(
{
intent: "searchEligibility",
eligibilityType: eligibility,
query: value,
},
{
method: "post",
},
);
}

function toggleEligibilityResource(resource: EligibilityResource) {
setSelectedEligibility((current) =>
current.some((item) => item.id === resource.id)
? current.filter((item) => item.id !== resource.id)
: [...current, resource],
);
}

function removeEligibilityResource(id: string) {
setSelectedEligibility((current) =>
current.filter((item) => item.id !== id),
);
}

const details = useMemo(() => {
const combinations = [combineProductDiscounts && "product", combineOrderDiscounts && "order", combineShippingDiscounts && "shipping"].filter(Boolean);
return [eligibility === "all" ? "All customers" : `${selectedEligibility.length} selected ${eligibility === "segments" ? "customer segments" : "customers"}`, discountType === "product" ? `${(appliesTo === "products" ? selectedProducts : selectedCollections).length} selected ${appliesTo}` : config.typeLabel, discountType === "bxgy" ? `Buy ${buyRequirement === "amount" ? "£" + buyAmount : buyQuantity}, get ${getQuantity}` : minimumRequirement === "none" ? "No minimum purchase" : minimumRequirement === "amount" ? `Minimum spend £${minimumPurchaseAmount}` : `Minimum ${minimumQuantity} items`, method === "code" && limitTotalUses ? `${totalUsageLimit || "Not set"} total uses` : "No total usage limit", combinations.length ? `Combines with ${combinations.join(", ")} discounts` : "Cannot combine with other discounts", startDateTime ? `Starts ${new Date(startDateTime).toLocaleString("en-GB")}` : "Starts when saved", hasEndDate && endDateTime ? `Ends ${new Date(endDateTime).toLocaleString("en-GB")}` : "No end date"];
}, [eligibility, selectedEligibility.length, discountType, appliesTo, selectedProducts, selectedCollections, config.typeLabel, buyRequirement, buyAmount, buyQuantity, getQuantity, minimumRequirement, minimumPurchaseAmount, minimumQuantity, method, limitTotalUses, totalUsageLimit, combineProductDiscounts, combineOrderDiscounts, combineShippingDiscounts, startDateTime, hasEndDate, endDateTime]);

const websiteDraft: WebsiteDraft = { included, websiteEnabled, showProductPage, showCollectionPage, showProductBadge, showCountdown, showHeaderBanner, headline, body, badgeText, countdownText, buttonText, buttonUrl, backgroundColour, textColour, badgeColour, priority, design };
function updateWebsite(value: WebsiteDraft) {
setIncluded(value.included); setWebsiteEnabled(value.websiteEnabled); setShowProductPage(value.showProductPage); setShowCollectionPage(value.showCollectionPage); setShowProductBadge(value.showProductBadge); setShowCountdown(value.showCountdown); setShowHeaderBanner(value.showHeaderBanner);
setHeadline(value.headline); setBody(value.body); setBadgeText(value.badgeText); setCountdownText(value.countdownText); setButtonText(value.buttonText); setButtonUrl(value.buttonUrl); setBackgroundColour(value.backgroundColour); setTextColour(value.textColour); setBadgeColour(value.badgeColour); setPriority(value.priority); setDesign(value.design);
}
const eligibleSelection = JSON.stringify({ productIds: discountType === "product" && appliesTo === "products" ? selectedProducts.map(p=>p.id) : discountType === "bxgy" && getAppliesTo === "products" ? getSelection.map(p=>p.id) : [], collectionIds: discountType === "product" && appliesTo === "collections" ? selectedCollections.map(p=>p.id) : discountType === "bxgy" && getAppliesTo === "collections" ? getSelection.map(p=>p.id) : [] });
const previewSubmitRef = useRef(previewFetcher.submit); previewSubmitRef.current = previewFetcher.submit;
useEffect(() => { previewSubmitRef.current({ selection: eligibleSelection }, { method: "post", action: "/app/promotion-preview" }); }, [eligibleSelection]);
const productOptions: PreviewProduct[] = products.map(p=>({ id:p.id, title:p.title, image:p.featuredImage?.url, price:formatPreviewPrice(p) }));
const eligibleProducts = previewFetcher.data?.key === eligibleSelection ? previewFetcher.data.products : [];
const previewProducts = previewProductId ? productOptions.filter(p=>p.id===previewProductId) : eligibleProducts;
const websitePreview = <PromotionPreview offerNote={method === "code" ? discountCode ? `Use code: ${discountCode}` : "Add a discount code" : "Applied automatically at checkout."} value={websiteDraft} products={previewProducts} endsAt={hasEndDate ? endDateTime : null} productOptions={productOptions} onProductChange={setPreviewProductId} selectedProductId={previewProductId} loading={previewFetcher.state !== "idle"} sample={eligibleSelection === '{"productIds":[],"collectionIds":[]}' && discountType !== "order" && discountType !== "shipping"} />;
async function browseBxgy(scope: "buy" | "get") {
const type = (scope === "buy" ? buyAppliesTo : getAppliesTo) === "products" ? "product" : "collection";
const selected = await shopify.resourcePicker({ type, action: "select", multiple: true });
if (!selected) return;
const mapped: ResourceSearchItem[] = selected.map(item=>({ id:item.id, title:item.title, handle:item.handle, selectedVariantIds: "variants" in item && Array.isArray(item.variants) ? item.variants.flatMap(v=>v.id ? [v.id] : []) : undefined }));
(scope === "buy" ? setBuySelection : setGetSelection)(mapped);
}
function savePromotion() {
if (saveInFlight.current || createFetcher.state !== "idle" || assetsBusy) return;
if (hasEndDate && !endDateTime) { setSubmissionError("Choose an end date and time, or turn off the end date."); return; }
setSubmissionError("");
saveInFlight.current = true;
const discount: CreateDiscountDraft = { discountType, method, discountCode, automaticTitle, valueType, discountValue, appliesTo, selectedProducts, selectedCollections, buyRequirement, buyQuantity, buyAmount, buyAppliesTo, buySelection, getQuantity, getAppliesTo, getSelection, rewardType, rewardValue, maxUsesPerOrder, usesPerOrder, minimumRequirement, minimumPurchaseAmount, minimumQuantity, limitTotalUses, totalUsageLimit, limitOncePerCustomer, combineProductDiscounts, combineOrderDiscounts, combineShippingDiscounts, productCombinationMode, selectedCombinationTags, startsAt: startDateTime ? new Date(startDateTime).toISOString() : null, endsAt: hasEndDate && endDateTime ? new Date(endDateTime).toISOString() : null, eligibility, selectedEligibility, countryMode: countryMode as "all" | "selected", excludeShippingPrice, countries: countryMode === "selected" ? countryCodes.split(",").map(c=>c.trim().toUpperCase()).filter(Boolean) : [], maximumShippingPrice: excludeShippingPrice ? maximumShippingPrice : "" };
createFetcher.submit({ intent:"createPromotion", payload:JSON.stringify({ discount, website:websiteDraft, savedId:createdDiscountId }) }, { method:"post" });
}

return (
<s-page heading="Create discount" inlineSize="large">
<div
style={{
width: "100%",
maxWidth: "none",
margin: 0,
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
gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) 260px",
gap: "24px",
alignItems: "start",
}}
>
<aside
className="desktop-preview-panel"
style={{
position: "sticky",
top: "20px",
maxHeight: "calc(100vh - 40px)",
overflowY: "auto",
alignSelf: "start",
}}
>
{websitePreview}
</aside>

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
max={valueType === "percentage" ? 100 : undefined}
step={valueType === "percentage" ? 1 : 0.01}
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
onChange={(event) => {
setAppliesTo(
event.currentTarget.value as "products" | "collections",
);
setResourceSearch("");
}}
>
<s-option value="collections">Specific collections</s-option>
<s-option value="products">Specific products</s-option>
</s-select>

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
label={appliesTo === "collections" ? "Search collections" : "Search products"}
labelAccessibilityVisibility="exclusive"
placeholder={appliesTo === "collections" ? "Search collections" : "Search products"}
value={resourceSearch}
onInput={(event) =>
setResourceSearch(event.currentTarget.value)
}
/>
<s-button
type="button"
variant="secondary"
onClick={browseDiscountResources}
>
Browse
</s-button>
</div>

{resourceSearch.trim().length >= 2 && (
<div
style={{
marginTop: "6px",
overflow: "hidden",
border: "1px solid #dedede",
borderRadius: "8px",
background: "#ffffff",
}}
>
{resourceFetcher.state !== "idle" && (
<div
style={{
padding: "10px 12px",
color: "#616161",
fontSize: "12px",
}}
>
Searching…
</div>
)}

{resourceFetcher.state === "idle" &&
resourceFetcher.data?.resources?.length === 0 && (
<div
style={{
padding: "10px 12px",
color: "#616161",
fontSize: "12px",
}}
>
No matching {appliesTo === "products" ? "products" : "collections"}.
</div>
)}

{resourceFetcher.data?.resources?.map((resource) => (
<button
key={resource.id}
type="button"
onClick={() => addSearchedResource(resource)}
style={{
display: "flex",
alignItems: "center",
gap: "10px",
width: "100%",
padding: "9px 12px",
border: 0,
borderTop: "1px solid #f1f1f1",
background: "#ffffff",
color: "#202223",
textAlign: "left",
font: "inherit",
cursor: "pointer",
}}
>
{resource.imageUrl && (
<img
src={resource.imageUrl}
alt=""
style={{
width: "34px",
height: "34px",
borderRadius: "6px",
objectFit: "cover",
flex: "0 0 auto",
}}
/>
)}
<span style={{ fontSize: "12px", fontWeight: 600 }}>
{resource.title}
</span>
</button>
))}
</div>
)}

{(appliesTo === "products"
? selectedProducts
: selectedCollections
).length > 0 && (
<div
style={{
display: "grid",
gap: "6px",
marginTop: "10px",
}}
>
{(appliesTo === "products"
? selectedProducts
: selectedCollections
).map((resource) => (
<div
key={resource.id}
style={{
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: "10px",
padding: "8px 10px",
border: "1px solid #e3e3e3",
borderRadius: "8px",
background: "#fafafa",
}}
>
<div
style={{
minWidth: 0,
overflow: "hidden",
}}
>
<div
style={{
overflow: "hidden",
textOverflow: "ellipsis",
whiteSpace: "nowrap",
fontSize: "12px",
fontWeight: 600,
}}
>
{resource.title}
</div>
{appliesTo === "products" && resource.variants && (
<div
style={{
marginTop: "2px",
color: "#616161",
fontSize: "11px",
}}
>
{resource.selectedVariantIds?.length ?? 0} of{" "}
{resource.variants.length} variants selected
</div>
)}
</div>
<div
style={{
display: "flex",
alignItems: "center",
gap: "10px",
flex: "0 0 auto",
}}
>
{appliesTo === "products" && (
<button
type="button"
onClick={browseDiscountResources}
style={{
border: 0,
background: "transparent",
color: "#005bd3",
font: "inherit",
fontSize: "11px",
cursor: "pointer",
}}
>
Edit variants
</button>
)}
<button
type="button"
onClick={() => removeSelectedResource(resource.id)}
style={{
border: 0,
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
</div>
))}
</div>
)}
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
(setBuySelection([]), setBuyAppliesTo(event.currentTarget.value as "products" | "collections"))
}
>
<s-option value="products">Specific products</s-option>
<s-option value="collections">Specific collections</s-option>
</s-select>
</div>

<div><s-button type="button" variant="secondary" onClick={()=>browseBxgy("buy")}>Select buy items</s-button><ul>{buySelection.map(item=><li key={item.id}>{item.title}</li>)}</ul></div>
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
(setGetSelection([]), setGetAppliesTo(event.currentTarget.value as "products" | "collections"))
}
>
<s-option value="products">Specific products</s-option>
<s-option value="collections">Specific collections</s-option>
</s-select>
</div>

<div><s-button type="button" variant="secondary" onClick={()=>browseBxgy("get")}>Select get items</s-button><ul>{getSelection.map(item=><li key={item.id}>{item.title}</li>)}</ul></div>

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
{maxUsesPerOrder && <s-number-field label="Maximum uses per order" min={1} step={1} value={usesPerOrder} onInput={event=>setUsesPerOrder(event.currentTarget.value)} />}
</div>
</s-stack>
</div>
</s-stack>
</FormSection>
)}

{discountType === "shipping" && (
<FormSection title="Countries">
<s-stack direction="block" gap="base">
<s-select label="Countries" value={countryMode} onChange={event=>setCountryMode(event.currentTarget.value)}>
<s-option value="all">All countries</s-option>
<s-option value="selected">Selected countries</s-option>
</s-select>
{countryMode === "selected" && <s-text-field label="Country codes" details="Two-letter codes separated by commas, for example GB, IE." value={countryCodes} onInput={event=>setCountryCodes(event.currentTarget.value)} />}
<s-checkbox label="Exclude shipping rates over a certain amount" checked={excludeShippingPrice} onChange={event=>setExcludeShippingPrice(event.currentTarget.checked)} />
{excludeShippingPrice && <s-number-field label="Maximum shipping rate" min={0.01} prefix="£" value={maximumShippingPrice} onInput={event=>setMaximumShippingPrice(event.currentTarget.value)} />}
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
setSelectedEligibility([]);
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

<s-button
type="button"
variant="secondary"
onClick={openEligibilityPicker}
>
Browse
</s-button>
</div>

{eligibilitySearch.trim().length >= 2 && (
<div
style={{
marginTop: "6px",
overflow: "hidden",
border: "1px solid #dedede",
borderRadius: "8px",
background: "#ffffff",
}}
>
{eligibilityFetcher.state !== "idle" && (
<div
style={{
padding: "10px 12px",
color: "#616161",
fontSize: "12px",
}}
>
Searching…
</div>
)}

{eligibilityFetcher.state === "idle" &&
eligibilityFetcher.data?.eligibilityResources?.length === 0 && (
<div
style={{
padding: "10px 12px",
color: "#616161",
fontSize: "12px",
}}
>
No matching {eligibility === "segments" ? "segments" : "customers"}.
</div>
)}

{eligibilityFetcher.data?.eligibilityResources?.map((resource) => (
<button
key={resource.id}
type="button"
onClick={() => {
toggleEligibilityResource(resource);
setEligibilitySearch("");
}}
style={{
display: "block",
width: "100%",
padding: "9px 12px",
border: 0,
borderTop: "1px solid #f1f1f1",
background: "#ffffff",
color: "#202223",
textAlign: "left",
font: "inherit",
cursor: "pointer",
}}
>
<span style={{ display: "block", fontSize: "12px", fontWeight: 600 }}>
{resource.name}
</span>
{resource.secondary && (
<span
style={{
display: "block",
marginTop: "2px",
color: "#616161",
fontSize: "11px",
}}
>
{resource.secondary}
</span>
)}
</button>
))}
</div>
)}

{selectedEligibility.length > 0 && (
<div
style={{
display: "grid",
gap: "6px",
marginTop: "10px",
}}
>
{selectedEligibility.map((resource) => (
<div
key={resource.id}
style={{
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: "10px",
padding: "8px 10px",
border: "1px solid #e3e3e3",
borderRadius: "8px",
background: "#fafafa",
}}
>
<div style={{ minWidth: 0 }}>
<div
style={{
overflow: "hidden",
textOverflow: "ellipsis",
whiteSpace: "nowrap",
fontSize: "12px",
fontWeight: 600,
}}
>
{resource.name}
</div>
{resource.secondary && (
<div
style={{
marginTop: "2px",
overflow: "hidden",
textOverflow: "ellipsis",
whiteSpace: "nowrap",
color: "#616161",
fontSize: "11px",
}}
>
{resource.secondary}
</div>
)}
</div>

<button
type="button"
onClick={() => removeEligibilityResource(resource.id)}
style={{
border: 0,
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
))}
</div>
)}

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
<div
style={{
display: "grid",
gap: "10px",
}}
>
{[
{
value: "none",
label: "No minimum requirements",
},
{
value: "amount",
label: "Minimum purchase amount",
},
{
value: "quantity",
label: "Minimum quantity of items",
},
].map((option) => (
<div
key={option.value}
style={{
display: "grid",
gap: "8px",
}}
>
<label
style={{
display: "flex",
alignItems: "center",
gap: "8px",
color: "#202223",
fontSize: "13px",
cursor: "pointer",
}}
>
<input
type="radio"
name="minimumRequirement"
value={option.value}
checked={minimumRequirement === option.value}
onChange={() =>
setMinimumRequirement(
option.value as
| "none"
| "amount"
| "quantity",
)
}
style={{
width: "16px",
height: "16px",
margin: 0,
accentColor: "#202223",
cursor: "pointer",
}}
/>
<span>{option.label}</span>
</label>

{option.value === "amount" &&
minimumRequirement === "amount" && (
<div
style={{
maxWidth: "220px",
marginLeft: "24px",
}}
>
<s-number-field
label="Minimum purchase amount"
labelAccessibilityVisibility="exclusive"
min={0}
step={0.01}
prefix="£"
value={minimumPurchaseAmount}
onInput={(event) =>
setMinimumPurchaseAmount(
event.currentTarget.value,
)
}
details="Customers must spend at least this amount to use the discount."
/>
</div>
)}

{option.value === "quantity" &&
minimumRequirement === "quantity" && (
<div
style={{
maxWidth: "220px",
marginLeft: "24px",
}}
>
<s-number-field
label="Minimum quantity of items"
labelAccessibilityVisibility="exclusive"
min={1}
step={1}
value={minimumQuantity}
onInput={(event) =>
setMinimumQuantity(
event.currentTarget.value,
)
}
details="Customers must add at least this many eligible items to use the discount."
/>
</div>
)}
</div>
))}
</div>
</FormSection>
)}

{method === "code" && (
<FormSection title="Maximum discount uses">
<div
style={{
display: "grid",
gap: "10px",
}}
>
<div
style={{
display: "grid",
gap: "8px",
}}
>
<s-checkbox
label="Limit number of times this discount can be used in total"
checked={limitTotalUses}
onChange={(event) =>
setLimitTotalUses(event.currentTarget.checked)
}
/>

{limitTotalUses && (
<div
style={{
maxWidth: "220px",
marginLeft: "24px",
}}
>
<s-number-field
label="Maximum discount uses"
labelAccessibilityVisibility="exclusive"
min={1}
step={1}
value={totalUsageLimit}
onInput={(event) =>
setTotalUsageLimit(event.currentTarget.value)
}
details="Set the total number of times this discount can be used."
/>
</div>
)}
</div>

<s-checkbox
disabled={method !== "code"}
label="Limit to one use per customer"
checked={limitOncePerCustomer}
onChange={(event) =>
setLimitOncePerCustomer(event.currentTarget.checked)
}
/>
</div>
</FormSection>
)}

<section style={{padding:"16px",border:"1px solid #dedede",borderRadius:"12px",background:"#fff"}}>
<div id="combinations-label" style={{color:"#202223",fontSize:"14px",fontWeight:650,marginBottom:"8px"}}>Combinations</div>
<div ref={combinationFieldRef} style={{position:"relative"}}>
{showCombinationPicker&&(
<div ref={combinationDialogRef} id="combinations-editor" role="dialog" aria-labelledby="combinations-editor-title" tabIndex={-1} style={{position:"absolute",zIndex:30,left:0,bottom:"calc(100% + 8px)",width:"min(390px, 100%)",maxHeight:"min(520px, 60vh)",overflowY:"auto",boxSizing:"border-box",padding:"16px",border:"1px solid #dedede",borderRadius:"12px",background:"#fff",boxShadow:"0 10px 28px rgba(0,0,0,.16)"}}>
<div id="combinations-editor-title" style={{marginBottom:"12px",fontSize:"13px",fontWeight:600}}>Allow this discount to combine with other discounts</div>
{[
["Product discounts","Multiple can apply per order",combineProductDiscounts,setCombineProductDiscounts],
["Order discounts","Multiple can apply per order",combineOrderDiscounts,setCombineOrderDiscounts],
["Shipping discounts","Only one can apply per order (best value wins)",combineShippingDiscounts,setCombineShippingDiscounts],
].map(([label,detail,checked,setChecked])=>(
<label key={String(label)} aria-label={String(label)} htmlFor={`combination-${String(label).split(" ")[0].toLowerCase()}`} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",cursor:"pointer"}}>
<input id={`combination-${String(label).split(" ")[0].toLowerCase()}`} type="checkbox" checked={Boolean(checked)} onChange={e=>{(setChecked as React.Dispatch<React.SetStateAction<boolean>>)(e.currentTarget.checked);if(label==="Product discounts"&&!e.currentTarget.checked){setShowCombinationTags(false);setSelectedCombinationTags([]);}}} style={{width:"18px",height:"18px",marginTop:"1px"}}/>
<span><span style={{display:"block",fontSize:"13px"}}>{String(label)}</span><span style={{display:"block",marginTop:"2px",color:"#616161",fontSize:"11px"}}>{String(detail)}</span></span>
</label>
))}
{combineProductDiscounts&&(
<>
<div style={{marginTop:"8px",maxWidth:"310px"}}>
<s-select label="Product discount combination" labelAccessibilityVisibility="exclusive" value={productCombinationMode} onChange={e=>{const value=e.currentTarget.value as "best"|"multiple";setProductCombinationMode(value);if(value==="best"){setShowCombinationTags(false);setSelectedCombinationTags([]);}}}>
<s-option value="best">One per product (best value wins)</s-option>
<s-option value="multiple">Multiple per product</s-option>
</s-select>
</div>
{productCombinationMode==="multiple"&&(
<div style={{position:"relative",marginTop:"10px"}}>
<div style={{marginBottom:"5px",color:"#303030",fontSize:"12px"}}>Combine on same product with discounts tagged</div>
<button type="button" onClick={()=>setShowCombinationTags(v=>!v)} style={{width:"100%",minHeight:"36px",padding:"7px 10px",border:"1px solid #c9c9c9",borderRadius:"8px",background:"#fff",color:"#202223",textAlign:"left",font:"inherit",fontSize:"12px",cursor:"pointer"}}>+ Select tags{selectedCombinationTags.length?` (${selectedCombinationTags.length})`:""}</button>
{showCombinationTags&&(
<div style={{marginTop:"8px",width:"100%",overflow:"hidden",border:"1px solid #dedede",borderRadius:"10px",background:"#fff",boxShadow:"0 8px 24px rgba(0,0,0,.16)"}}>
<div style={{padding:"8px",borderBottom:"1px solid #eee"}}>
<input type="search" value={combinationTagSearch} onChange={e=>setCombinationTagSearch(e.currentTarget.value)} placeholder="Search discount tags" style={{width:"100%",minHeight:"34px",border:"1px solid #c9c9c9",borderRadius:"7px",padding:"6px 9px",font:"inherit",fontSize:"12px"}}/>
</div>
{["FREE SHIPPING","ORDER","PRODUCT","BXGY","CUSTOMER TARGET"].filter(tag=>tag.toLowerCase().includes(combinationTagSearch.trim().toLowerCase())).map(tag=>(
<label key={tag} style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",borderBottom:"1px solid #f3f3f3",fontSize:"12px",cursor:"pointer"}}>
<input type="checkbox" checked={selectedCombinationTags.includes(tag)} onChange={()=>setSelectedCombinationTags(v=>v.includes(tag)?v.filter(x=>x!==tag):[...v,tag])}/>
<span>{tag}</span>
</label>
))}
</div>
)}
</div>
)}
</>
)}
<div style={{display:"flex",justifyContent:"flex-end",marginTop:"12px"}}>
<button type="button" onClick={()=>{setShowCombinationPicker(false);setShowCombinationTags(false);combinationTriggerRef.current?.focus();}} style={{padding:"7px 14px",border:"1px solid #c9c9c9",borderRadius:"8px",background:"#fff",font:"inherit",fontSize:"12px",cursor:"pointer"}}>Done</button>
</div>
</div>
)}
<button ref={combinationTriggerRef} type="button" aria-labelledby="combinations-label" aria-haspopup="dialog" aria-expanded={showCombinationPicker} aria-controls={showCombinationPicker?"combinations-editor":undefined} onClick={()=>{setShowCombinationPicker(v=>!v);setShowCombinationTags(false);}} style={{display:"block",width:"100%",padding:"12px",border:"1px solid #c9c9c9",borderRadius:"8px",background:"#fff",color:"#202223",font:"inherit",textAlign:"left",cursor:"pointer",fontSize:"13px",lineHeight:1.5}}>
<span style={{display:"block"}}>
<strong>{method==="code"?discountCode||"This discount":automaticTitle||"This discount"}</strong>{" "}
{!combineProductDiscounts&&!combineOrderDiscounts&&!combineShippingDiscounts?"won't combine with other product, order, or shipping discounts in the customer's cart.":"can be combined with the following discounts in the customer's cart:"}
</span>
{combineProductDiscounts&&<span style={{display:"block",marginTop:"8px"}}><strong>Product discounts</strong><span style={{display:"block",color:"#616161",fontSize:"11px"}}>Multiple can apply per order • {productCombinationMode==="best"?"One per product (best value wins)":"Multiple per product"}</span>{productCombinationMode==="multiple"&&<span style={{display:"block",color:"#616161",fontSize:"11px"}}>Tags: {selectedCombinationTags.join(", ")||"None selected"}</span>}</span>}
{combineOrderDiscounts&&<span style={{display:"block",marginTop:"8px"}}><strong>Order discounts</strong><span style={{display:"block",color:"#616161",fontSize:"11px"}}>Multiple can apply per order</span></span>}
{combineShippingDiscounts&&<span style={{display:"block",marginTop:"8px"}}><strong>Shipping discounts</strong><span style={{display:"block",color:"#616161",fontSize:"11px"}}>Only one can apply per order (best value wins)</span></span>}
</button>
</div>
</section>

<FormSection title="Schedule">
<div style={{display:"grid",gap:"12px"}}>
<ScheduleDateTimeField label="Start date and time" value={startDateTime} onChange={setStartDateTime} />

<s-checkbox
label="Set end date"
checked={hasEndDate}
onChange={(event)=>{
setHasEndDate(event.currentTarget.checked);
if(!event.currentTarget.checked){
setEndDateTime("");
}
}}
/>

{hasEndDate&&(
<ScheduleDateTimeField label="End date and time" value={endDateTime} min={startDateTime||undefined} onChange={setEndDateTime} />
)}
</div>
</FormSection>

<PromotionWebsiteEditor value={websiteDraft} onChange={updateWebsite} endsAt={hasEndDate ? endDateTime : null} onBusyChange={setAssetsBusy} />
{previewFetcher.data?.error && <s-banner tone="warning">{previewFetcher.data.error}</s-banner>}
{submissionError && <s-banner tone="critical">{submissionError}</s-banner>}
{createFetcher.data?.error && <s-banner tone="critical">{createFetcher.data.error}</s-banner>}
<s-button type="button" variant="primary" loading={createFetcher.state !== "idle"} disabled={assetsBusy || createFetcher.state !== "idle" || validateWebsite(websiteDraft, hasEndDate ? endDateTime : null).length > 0} onClick={savePromotion}>{createdDiscountId ? "Retry saving website design" : "Create promotion"}</s-button>

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


<button
type="button"
className="preview-drawer-toggle"
onClick={() => setIsPreviewDrawerOpen(true)}
aria-label="Open storefront preview"
>
Preview
</button>

{isPreviewDrawerOpen && (
<div
className="preview-drawer-backdrop"
>
<button type="button" aria-label="Close preview backdrop" onClick={()=>setIsPreviewDrawerOpen(false)} style={{position:"absolute",inset:0,border:0,background:"transparent"}} />
<aside
className="preview-drawer"
role="dialog"
aria-modal="true"
aria-label="Storefront preview"
>
<div className="preview-drawer-header">
<div>
<div style={{ fontSize: "14px", fontWeight: 700 }}>
Storefront preview
</div>
<div style={{ marginTop: "2px", color: "#616161", fontSize: "11px" }}>
Updates live as you change the promotion.
</div>
</div>

<button
type="button"
aria-label="Close preview"
onClick={() => setIsPreviewDrawerOpen(false)}
style={{
width: "32px",
height: "32px",
border: "1px solid #dedede",
borderRadius: "8px",
background: "#ffffff",
color: "#202223",
fontSize: "18px",
cursor: "pointer",
}}
>
×
</button>
</div>

<div className="preview-drawer-body">
{websitePreview}
</div>
</aside>
</div>
)}

{showEligibilityPicker && (
<div

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
<button type="button" aria-label="Close customer selector backdrop" onClick={()=>setShowEligibilityPicker(false)} style={{position:"absolute",inset:0,border:0,background:"transparent"}} />
<div
role="dialog"
aria-modal="true"
aria-labelledby="eligibility-picker-title"
style={{
position: "relative",
width: "min(100%, 620px)",
maxHeight: "78vh",
display: "flex",
flexDirection: "column",
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
<div id="eligibility-picker-title" style={{ fontSize: "16px", fontWeight: 700 }}>
{eligibility === "segments"
? "Select customer segments"
: "Select customers"}
</div>

<button
type="button"
aria-label="Close"
onClick={() => setShowEligibilityPicker(false)}
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

<div style={{ padding: "12px", borderBottom: "1px solid #eeeeee" }}>
<s-text-field
label={eligibility === "segments" ? "Search segments" : "Search customers"}
labelAccessibilityVisibility="exclusive"
placeholder={eligibility === "segments" ? "Search segments" : "Search customers"}
value={eligibilityPickerSearch}
onInput={(event) => searchEligibilityPicker(event.currentTarget.value)}
/>
</div>

<div style={{ overflowY: "auto", padding: "6px" }}>
{eligibilityFetcher.state !== "idle" && (
<div style={{ padding: "18px", color: "#616161", fontSize: "12px" }}>
Loading…
</div>
)}

{eligibilityFetcher.state === "idle" &&
eligibilityFetcher.data?.eligibilityResources?.map((resource) => {
const selected = selectedEligibility.some(
(item) => item.id === resource.id,
);

return (
<button
key={resource.id}
type="button"
onClick={() => toggleEligibilityResource(resource)}
style={{
display: "flex",
alignItems: "center",
gap: "10px",
width: "100%",
padding: "10px 12px",
border: 0,
borderBottom: "1px solid #f1f1f1",
background: selected ? "#f3f8f4" : "#ffffff",
color: "#202223",
textAlign: "left",
font: "inherit",
cursor: "pointer",
}}
>
<span
aria-hidden="true"
style={{
display: "flex",
alignItems: "center",
justifyContent: "center",
width: "18px",
height: "18px",
flex: "0 0 auto",
border: selected
? "1px solid #202223"
: "1px solid #8c8c8c",
borderRadius: "4px",
background: selected ? "#202223" : "#ffffff",
color: "#ffffff",
fontSize: "11px",
}}
>
{selected ? "✓" : ""}
</span>

<span style={{ minWidth: 0 }}>
<span style={{ display: "block", fontSize: "12px", fontWeight: 600 }}>
{resource.name}
</span>
{resource.secondary && (
<span
style={{
display: "block",
marginTop: "2px",
color: "#616161",
fontSize: "11px",
}}
>
{resource.secondary}
</span>
)}
</span>
</button>
);
})}

{eligibilityFetcher.state === "idle" &&
eligibilityFetcher.data?.eligibilityResources?.length === 0 && (
<div style={{ padding: "18px", color: "#616161", fontSize: "12px" }}>
No {eligibility === "segments" ? "segments" : "customers"} found.
</div>
)}
</div>

<div
style={{
display: "flex",
justifyContent: "flex-end",
gap: "8px",
padding: "12px 16px",
borderTop: "1px solid #eeeeee",
}}
>
<s-button
type="button"
variant="secondary"
onClick={() => setShowEligibilityPicker(false)}
>
Cancel
</s-button>
<s-button
type="button"
variant="primary"
onClick={() => setShowEligibilityPicker(false)}
>
Done
</s-button>
</div>
</div>
</div>
)}


<style>{`
.preview-drawer-toggle {
display: none;
position: fixed;
left: 0;
top: 42%;
z-index: 90;
border: 1px solid #c9c9c9;
border-left: 0;
border-radius: 0 9px 9px 0;
padding: 12px 8px;
background: #dff5e5;
color: #174c2a;
box-shadow: 0 2px 8px rgba(0,0,0,0.12);
font: inherit;
font-size: 11px;
font-weight: 700;
writing-mode: vertical-rl;
cursor: pointer;
}

.preview-drawer-backdrop {
position: fixed;
inset: 0;
z-index: 110;
background: rgba(0,0,0,0.42);
}

.preview-drawer {
position: absolute;
inset: 0 auto 0 0;
width: min(92vw, 560px);
display: flex;
flex-direction: column;
background: #f6f6f7;
box-shadow: 12px 0 32px rgba(0,0,0,0.2);
}

.preview-drawer-header {
display: flex;
align-items: center;
justify-content: space-between;
gap: 12px;
padding: 14px 16px;
border-bottom: 1px solid #dedede;
background: #ffffff;
}

.preview-drawer-body {
overflow-y: auto;
padding: 14px;
}

@media (max-width: 1380px) {
.create-discount-layout {
grid-template-columns: minmax(0, 1fr) 260px !important;
}

.desktop-preview-panel {
display: none;
}

.preview-drawer-toggle {
display: block;
}
}

@media (max-width: 800px) {
.create-discount-layout {
grid-template-columns: 1fr !important;
}

.create-discount-layout > aside:last-of-type {
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
.website-preview-collection-banner,
.website-preview-product-page,
.link-selector-layout,
.schedule-date-time-row {
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
