import { useEffect, useMemo, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useSearchParams } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";

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
const { admin } = await authenticate.admin(request);
const formData = await request.formData();
const intent = formData.get("intent");

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
return "£29.99";
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
const { products, collections } = useLoaderData<typeof loader>();
const shopify = useAppBridge();
const fileFetcher = useFetcher<PromotionActionData>();
const resourceFetcher = useFetcher<PromotionActionData>();
const eligibilityFetcher = useFetcher<PromotionActionData>();
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
const previewProducts = products.filter((product) => product.featuredImage).slice(0, 3);
const primaryPreviewProduct = previewProducts[0] ?? products[0];
const [method, setMethod] = useState<"code" | "automatic">("code");
const [discountCode, setDiscountCode] = useState("");
const [automaticTitle, setAutomaticTitle] = useState("");
const [valueType, setValueType] = useState<"percentage" | "fixed">("percentage");
const [discountValue, setDiscountValue] = useState("");
const [appliesTo, setAppliesTo] = useState<"products" | "collections">("collections");
const [resourceSearch, setResourceSearch] = useState("");
const [selectedProducts, setSelectedProducts] = useState<ResourceSearchItem[]>([]);
const [selectedCollections, setSelectedCollections] = useState<ResourceSearchItem[]>([]);
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
const [showLinkSelector, setShowLinkSelector] = useState(false);
const [linkType, setLinkType] = useState<"collections" | "products" | "custom">("collections");
const [linkSearch, setLinkSearch] = useState("");
const [buttonLinkLabel, setButtonLinkLabel] = useState("");
const [bannerImagePreview, setBannerImagePreview] = useState("");
const [bannerImageName, setBannerImageName] = useState("");
const [bannerShopifyFileId, setBannerShopifyFileId] = useState("");
const [isBannerDragActive, setIsBannerDragActive] = useState(false);
const [bannerImageLayout, setBannerImageLayout] = useState<
"full" | "half-left" | "half-right"
>("half-right");
const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);

function generateDiscountCode() {
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code = Array.from({ length: 10 }, () =>
alphabet[Math.floor(Math.random() * alphabet.length)],
).join("");

setDiscountCode(code);
}


useEffect(() => {
const selectedImage = fileFetcher.data?.image;

if (fileFetcher.data?.success && selectedImage) {
setBannerShopifyFileId(selectedImage.id);
setBannerImagePreview(selectedImage.url);
setBannerImageName(selectedImage.alt || "Shopify image");
}
}, [fileFetcher.data]);

async function openShopifyImagePicker() {
const appBridge = (
window as Window & {
shopify?: {
intents?: {
invoke: (
intent: string,
options?: {
data?: {
mediaTypes?: string[];
multiSelect?: boolean;
selectedFiles?: string[];
};
},
) => Promise<{
complete: Promise<{
code: string;
data?: {
ids?: string[];
};
}>;
}>;
};
};
}
).shopify;

if (!appBridge?.intents) {
return;
}

const activity = await appBridge.intents.invoke(
"pick:shopify/File",
{
data: {
mediaTypes: ["MediaImage"],
multiSelect: false,
selectedFiles: bannerShopifyFileId
? [bannerShopifyFileId]
: [],
},
},
);

const response = await activity.complete;
const selectedId = response.data?.ids?.[0];

if (response.code !== "ok" || !selectedId) {
return;
}

fileFetcher.submit(
{
intent: "resolveFile",
fileId: selectedId,
},
{
method: "post",
},
);
}

function useDroppedBannerImage(file: File | undefined) {
if (!file || !file.type.startsWith("image/")) {
return;
}

setBannerShopifyFileId("");
setBannerImageName(file.name);
setBannerImagePreview(URL.createObjectURL(file));
}


useEffect(() => {
const query = resourceSearch.trim();

if (query.length < 2) {
return;
}

const timeout = window.setTimeout(() => {
resourceFetcher.submit(
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
}, [resourceSearch, appliesTo]);

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
eligibilityFetcher.submit(
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
}, [eligibilitySearch, eligibility]);

function openEligibilityPicker() {
setEligibilityPickerSearch("");
setShowEligibilityPicker(true);

eligibilityFetcher.submit(
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

eligibilityFetcher.submit(
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

const websitePreview = (
<FormSection title="Website preview">
<div
style={{
overflow: "hidden",
border: "1px solid #d9d9d9",
borderRadius: "12px",
background: "#eef2f4",
}}
>
<div
style={{
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: "10px",
padding: "10px 12px",
borderBottom: "1px solid #dde3e6",
background: "#ffffff",
}}
>
<div>
<div style={{ fontSize: "12px", fontWeight: 650 }}>
Storefront preview
</div>
<div style={{ marginTop: "2px", color: "#616161", fontSize: "11px" }}>
Uses live products from this Shopify store. Only selected placements are shown.
</div>
</div>
<s-badge tone={websiteEnabled && included ? "success" : "neutral"}>
{websiteEnabled && included ? "Enabled" : "Not enabled"}
</s-badge>
</div>

<div style={{ padding: "14px" }}>
{showHeaderBanner && (
<section style={{ marginBottom: "12px" }}>
<div style={{ marginBottom: "6px", fontSize: "11px", fontWeight: 700 }}>
Header banner
</div>
<div
style={{
display: "grid",
gridTemplateColumns: "minmax(0, 1fr) auto auto",
gap: "12px",
alignItems: "center",
padding: "10px 14px",
borderRadius: "8px",
background: backgroundColour,
color: textColour,
boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
}}
>
<div style={{ fontSize: "12px", fontWeight: 700 }}>
{headline || "Promotion headline"}
</div>
{showCountdown && (
<div style={{ fontSize: "10px", fontWeight: 600 }}>
{countdownText || "Ends in 02D 14H 36M"}
</div>
)}
{buttonText && buttonUrl && (
<div
style={{
padding: "6px 10px",
borderRadius: "5px",
background: textColour,
color: backgroundColour,
fontSize: "10px",
fontWeight: 700,
}}
>
{buttonText}
</div>
)}
</div>
</section>
)}

{showCollectionPage && (
<section style={{ marginBottom: "12px" }}>
<div style={{ marginBottom: "6px", fontSize: "11px", fontWeight: 700 }}>
Collection page
</div>
<div
style={{
overflow: "hidden",
border: "1px solid #dde3e6",
borderRadius: "10px",
background: "#ffffff",
}}
>
<div
style={{
padding: "8px 12px",
borderBottom: "1px solid #eeeeee",
fontSize: "10px",
color: "#616161",
}}
>
Home / Costumes / Promotion
</div>

{bannerImageLayout === "full" ? (
<div
style={{
position: "relative",
minHeight: "160px",
display: "flex",
alignItems: "center",
padding: "22px",
backgroundImage: bannerImagePreview
? `linear-gradient(90deg, rgba(0,0,0,0.58), rgba(0,0,0,0.18)), url("${bannerImagePreview}")`
: primaryPreviewProduct?.featuredImage?.url
? `linear-gradient(90deg, rgba(0,0,0,0.58), rgba(0,0,0,0.18)), url("${primaryPreviewProduct.featuredImage.url}")`
: "linear-gradient(135deg, #444, #777)",
backgroundSize: "cover",
backgroundPosition: "center",
color: "#ffffff",
}}
>
<div style={{ maxWidth: "58%" }}>
<div style={{ fontSize: "17px", fontWeight: 750 }}>
{headline || "Promotion headline"}
</div>
<div style={{ marginTop: "5px", fontSize: "11px" }}>
{body || "Limited time only. Subject to availability."}
</div>
{buttonText && buttonUrl && (
<div
style={{
width: "fit-content",
marginTop: "12px",
padding: "6px 12px",
borderRadius: "5px",
background: backgroundColour,
color: textColour,
fontSize: "10px",
fontWeight: 700,
}}
>
{buttonText}
</div>
)}
</div>
</div>
) : (
<div
className="website-preview-collection-banner"
style={{
minHeight: "160px",
display: "grid",
gridTemplateColumns:
bannerImageLayout === "half-left"
? "minmax(180px, 42%) minmax(0, 1fr)"
: "minmax(0, 1fr) minmax(180px, 42%)",
background: "#f7f7f7",
}}
>
{bannerImageLayout === "half-left" && (
<div
style={{
minHeight: "160px",
backgroundImage: bannerImagePreview
? `url("${bannerImagePreview}")`
: primaryPreviewProduct?.featuredImage?.url
? `url("${primaryPreviewProduct.featuredImage.url}")`
: "linear-gradient(135deg, #dedede, #f0f0f0)",
backgroundSize: "cover",
backgroundPosition: "center",
}}
/>
)}

<div
style={{
padding: "22px",
display: "flex",
flexDirection: "column",
justifyContent: "center",
}}
>
<div style={{ fontSize: "17px", fontWeight: 750 }}>
{headline || "Promotion headline"}
</div>
<div style={{ marginTop: "5px", color: "#555", fontSize: "11px" }}>
{body || "Limited time only. Subject to availability."}
</div>
{buttonText && buttonUrl && (
<div
style={{
width: "fit-content",
marginTop: "12px",
padding: "6px 12px",
borderRadius: "5px",
background: backgroundColour,
color: textColour,
fontSize: "10px",
fontWeight: 700,
}}
>
{buttonText}
</div>
)}
</div>

{bannerImageLayout === "half-right" && (
<div
style={{
minHeight: "160px",
backgroundImage: bannerImagePreview
? `url("${bannerImagePreview}")`
: primaryPreviewProduct?.featuredImage?.url
? `url("${primaryPreviewProduct.featuredImage.url}")`
: "linear-gradient(135deg, #dedede, #f0f0f0)",
backgroundSize: "cover",
backgroundPosition: "center",
}}
/>
)}
</div>
)}
</div>
</section>
)}

{showProductBadge && (
<section style={{ marginBottom: "12px" }}>
<div style={{ marginBottom: "6px", fontSize: "11px", fontWeight: 700 }}>
Product cards
</div>
<div
style={{
padding: "12px",
border: "1px solid #dde3e6",
borderRadius: "10px",
background: "#ffffff",
}}
>
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
gap: "8px",
}}
>
{(previewProducts.length > 0 ? previewProducts : products.slice(0, 3)).map((product) => (
<div
key={product.id}
style={{
position: "relative",
overflow: "hidden",
border: "1px solid #eeeeee",
borderRadius: "8px",
background: "#ffffff",
}}
>
<div style={{ aspectRatio: "4 / 5", background: "#f5f5f5" }}>
{product.featuredImage?.url && (
<img
src={product.featuredImage.url}
alt={product.featuredImage.altText || product.title}
style={{
width: "100%",
height: "100%",
objectFit: "cover",
}}
/>
)}
</div>
<div
style={{
position: "absolute",
top: "7px",
left: "7px",
padding: "3px 6px",
borderRadius: "5px",
background: badgeColour,
color: "#ffffff",
fontSize: "8px",
fontWeight: 750,
}}
>
{badgeText || "PROMOTION"}
</div>
<div style={{ padding: "8px" }}>
<div style={{ fontSize: "9px", fontWeight: 650, lineHeight: 1.35 }}>
{product.title}
</div>
<div style={{ marginTop: "4px", fontSize: "10px", fontWeight: 700 }}>
{formatPreviewPrice(product)}
</div>
</div>
</div>
))}
</div>
</div>
</section>
)}

{showProductPage && (
<section>
<div style={{ marginBottom: "6px", fontSize: "11px", fontWeight: 700 }}>
Product page
</div>
<div
className="website-preview-product-page"
style={{
display: "grid",
gridTemplateColumns: "minmax(220px, 0.9fr) minmax(0, 1.1fr)",
gap: "16px",
padding: "12px",
border: "1px solid #dde3e6",
borderRadius: "10px",
background: "#ffffff",
}}
>
<div
style={{
overflow: "hidden",
borderRadius: "8px",
background: "#f5f5f5",
}}
>
{primaryPreviewProduct?.featuredImage?.url && (
<img
src={primaryPreviewProduct.featuredImage.url}
alt={primaryPreviewProduct.featuredImage.altText || primaryPreviewProduct.title}
style={{
width: "100%",
height: "100%",
minHeight: "260px",
objectFit: "cover",
}}
/>
)}
</div>

<div style={{ padding: "8px 4px" }}>
<div style={{ fontSize: "17px", fontWeight: 700 }}>
{primaryPreviewProduct?.title || "Example product"}
</div>
<div style={{ marginTop: "6px", fontSize: "13px", fontWeight: 700 }}>
{formatPreviewPrice(primaryPreviewProduct)}
</div>

<div
style={{
marginTop: "16px",
padding: "13px",
borderRadius: "8px",
background: backgroundColour,
color: textColour,
}}
>
<div style={{ fontSize: "12px", fontWeight: 750 }}>
{headline || "Promotion headline"}
</div>
{body && (
<div style={{ marginTop: "5px", fontSize: "10px", lineHeight: 1.45 }}>
{body}
</div>
)}
{showCountdown && (
<div style={{ marginTop: "8px", fontSize: "10px", fontWeight: 650 }}>
{countdownText || "Offer ends soon"}
</div>
)}
{buttonText && buttonUrl && (
<div
style={{
marginTop: "10px",
padding: "7px 9px",
borderRadius: "5px",
background: textColour,
color: backgroundColour,
textAlign: "center",
fontSize: "10px",
fontWeight: 750,
}}
>
{buttonText}
</div>
)}
</div>
</div>
</div>
</section>
)}

{!showHeaderBanner &&
!showProductPage &&
!showCollectionPage &&
!showProductBadge && (
<div
style={{
padding: "14px",
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
);

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
label="Limit to one use per customer"
checked={limitOncePerCustomer}
onChange={(event) =>
setLimitOncePerCustomer(event.currentTarget.checked)
}
/>
</div>
</FormSection>

<section>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",marginBottom:"8px"}}>
<div style={{color:"#202223",fontSize:"14px",fontWeight:650}}>Combinations</div>
<button type="button" aria-label="Edit combinations" title="Edit combinations" onClick={()=>setShowCombinationPicker(v=>!v)} style={{width:"30px",height:"30px",display:"flex",alignItems:"center",justifyContent:"center",border:0,borderRadius:"50%",background:"#e8e8e8",color:"#4a4a4a",fontSize:"22px",lineHeight:1,cursor:"pointer"}}>+</button>
</div>
<div style={{position:"relative",border:"1px solid #dedede",borderRadius:"12px",background:"#fff",boxShadow:"0 1px 2px rgba(0,0,0,.04)",padding:"16px"}}>
{showCombinationPicker&&(
<div style={{position:"absolute",zIndex:30,right:0,top:"-8px",transform:"translateY(-100%)",width:"min(390px, calc(100vw - 48px))",padding:"16px",border:"1px solid #dedede",borderRadius:"12px",background:"#fff",boxShadow:"0 10px 28px rgba(0,0,0,.16)"}}>
<div style={{marginBottom:"12px",fontSize:"13px",fontWeight:600}}>Allow this discount to combine with other discounts</div>
{[
["Product discounts","Multiple can apply per order",combineProductDiscounts,setCombineProductDiscounts],
["Order discounts","Multiple can apply per order",combineOrderDiscounts,setCombineOrderDiscounts],
["Shipping discounts","Only one can apply per order (best value wins)",combineShippingDiscounts,setCombineShippingDiscounts],
].map(([label,detail,checked,setChecked])=>(
<label key={String(label)} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",cursor:"pointer"}}>
<input type="checkbox" checked={Boolean(checked)} onChange={e=>(setChecked as React.Dispatch<React.SetStateAction<boolean>>)(e.currentTarget.checked)} style={{width:"18px",height:"18px",marginTop:"1px"}}/>
<span><span style={{display:"block",fontSize:"13px"}}>{String(label)}</span><span style={{display:"block",marginTop:"2px",color:"#616161",fontSize:"11px"}}>{String(detail)}</span></span>
</label>
))}
</div>
)}
{!combineProductDiscounts&&!combineOrderDiscounts&&!combineShippingDiscounts?(
<div style={{color:"#202223",fontSize:"13px",lineHeight:1.5}}>
<strong>{method==="code"?discountCode||"This discount":automaticTitle||"This discount"}</strong>{" "}won't combine with other product, order, or shipping discounts in the customer's cart.
</div>
):(
<div>
<div style={{marginBottom:"10px",color:"#202223",fontSize:"13px",lineHeight:1.45}}>
<strong>{method==="code"?discountCode||"This discount":automaticTitle||"This discount"}</strong>{" "}can be combined with the following discounts in the customer's cart:
</div>
<div style={{overflow:"visible",border:"1px solid #eee",borderRadius:"9px"}}>
{combineProductDiscounts&&(
<div style={{padding:"11px 12px",borderBottom:combineOrderDiscounts||combineShippingDiscounts?"1px solid #eee":0}}>
<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px"}}>
<div><div style={{fontSize:"13px",fontWeight:600}}>Product discounts</div><div style={{marginTop:"2px",color:"#616161",fontSize:"11px"}}>Multiple can apply per order • {productCombinationMode==="best"?"One per product (best value wins)":"Multiple per product"}</div></div>
<button type="button" aria-label="Remove product discounts" onClick={()=>{setCombineProductDiscounts(false);setShowCombinationTags(false);setSelectedCombinationTags([]);}} style={{border:0,background:"transparent",color:"#616161",fontSize:"17px",cursor:"pointer"}}>×</button>
</div>
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
<div style={{position:"absolute",zIndex:40,top:"calc(100% + 4px)",left:0,width:"min(360px, 100%)",overflow:"hidden",border:"1px solid #dedede",borderRadius:"10px",background:"#fff",boxShadow:"0 8px 24px rgba(0,0,0,.16)"}}>
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
</div>
)}
{combineOrderDiscounts&&(
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",padding:"11px 12px",borderBottom:combineShippingDiscounts?"1px solid #eee":0}}>
<div><div style={{fontSize:"13px",fontWeight:600}}>Order discounts</div><div style={{marginTop:"2px",color:"#616161",fontSize:"11px"}}>Multiple can apply per order</div></div>
<button type="button" aria-label="Remove order discounts" onClick={()=>setCombineOrderDiscounts(false)} style={{border:0,background:"transparent",color:"#616161",fontSize:"17px",cursor:"pointer"}}>×</button>
</div>
)}
{combineShippingDiscounts&&(
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",padding:"11px 12px"}}>
<div><div style={{fontSize:"13px",fontWeight:600}}>Shipping discounts</div><div style={{marginTop:"2px",color:"#616161",fontSize:"11px"}}>Only one can apply per order (best value wins)</div></div>
<button type="button" aria-label="Remove shipping discounts" onClick={()=>setCombineShippingDiscounts(false)} style={{border:0,background:"transparent",color:"#616161",fontSize:"17px",cursor:"pointer"}}>×</button>
</div>
)}
</div>
</div>
)}
</div>
</section>

<FormSection title="Schedule">
<div style={{display:"grid",gap:"12px"}}>
<label style={{display:"grid",gap:"5px",fontSize:"12px",color:"#303030"}}>
<span>Start date and time</span>
<div style={{position:"relative"}}>
<input
type="datetime-local"
step="60"
value={startDateTime}
onChange={(event)=>setStartDateTime(event.currentTarget.value)}
style={{width:"100%",minHeight:"42px",padding:"8px 78px 8px 10px",border:"1px solid #c9c9c9",borderRadius:"8px",background:"#fff",color:"#202223",font:"inherit",fontSize:"13px",boxSizing:"border-box"}}
/>
<span style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",color:"#616161",fontSize:"11px",pointerEvents:"none"}}>
Local time
</span>
</div>
</label>

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
<label style={{display:"grid",gap:"5px",fontSize:"12px",color:"#303030"}}>
<span>End date and time</span>
<div style={{position:"relative"}}>
<input
type="datetime-local"
step="60"
value={endDateTime}
min={startDateTime||undefined}
onChange={(event)=>setEndDateTime(event.currentTarget.value)}
style={{width:"100%",minHeight:"42px",padding:"8px 78px 8px 10px",border:"1px solid #c9c9c9",borderRadius:"8px",background:"#fff",color:"#202223",font:"inherit",fontSize:"13px",boxSizing:"border-box"}}
/>
<span style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",color:"#616161",fontSize:"11px",pointerEvents:"none"}}>
Local time
</span>
</div>
</label>
)}
</div>
</FormSection>

<FormSection title="Website promotion">
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
Promotion banner image
</div>

<div
style={{
display: "flex",
alignItems: "flex-start",
gap: "16px",
flexWrap: "wrap",
}}
>
<button
type="button"
onClick={openShopifyImagePicker}
onDragEnter={(event) => {
event.preventDefault();
setIsBannerDragActive(true);
}}
onDragOver={(event) => {
event.preventDefault();
setIsBannerDragActive(true);
}}
onDragLeave={(event) => {
event.preventDefault();
setIsBannerDragActive(false);
}}
onDrop={(event) => {
event.preventDefault();
setIsBannerDragActive(false);
useDroppedBannerImage(event.dataTransfer.files?.[0]);
}}
style={{
position: "relative",
width: "164px",
height: "164px",
flex: "0 0 auto",
overflow: "hidden",
border: `1px dashed ${isBannerDragActive ? "#005bd3" : "#8c8c8c"}`,
borderRadius: "18px",
background: isBannerDragActive ? "#f1f7ff" : "#ffffff",
color: "#303030",
cursor: "pointer",
padding: 0,
}}
aria-label="Select promotion banner image"
>
{bannerImagePreview ? (
<>
<img
src={bannerImagePreview}
alt={bannerImageName || "Selected promotion banner"}
style={{
width: "100%",
height: "100%",
objectFit: "cover",
}}
/>
<span
style={{
position: "absolute",
inset: "auto 8px 8px 8px",
padding: "5px 7px",
borderRadius: "6px",
background: "rgba(255,255,255,0.92)",
color: "#202223",
fontSize: "10px",
fontWeight: 650,
textAlign: "center",
}}
>
Change image
</span>
</>
) : (
<span
style={{
position: "absolute",
inset: 0,
display: "flex",
flexDirection: "column",
alignItems: "center",
justifyContent: "center",
gap: "8px",
}}
>
<svg
width="24"
height="24"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
strokeWidth="1.8"
strokeLinecap="round"
strokeLinejoin="round"
>
<path d="M12 16V4" />
<path d="m7 9 5-5 5 5" />
<path d="M5 20h14" />
</svg>
<span style={{ fontSize: "11px", fontWeight: 650 }}>
Add image
</span>
</span>
)}
</button>

<div
style={{
flex: "1 1 220px",
paddingTop: "6px",
}}
>
<div
style={{
color: "#303030",
fontSize: "12px",
fontWeight: 650,
}}
>
Drag an image here or click to select
</div>
<div
style={{
marginTop: "5px",
color: "#616161",
fontSize: "11px",
lineHeight: 1.5,
}}
>
Clicking opens Shopify’s standard file picker so you can search existing Content files or add a new image. Dragged local images are previewed immediately and will be uploaded to Shopify Files when the promotion is saved.
</div>

{bannerImageName && (
<div
style={{
marginTop: "8px",
color: "#303030",
fontSize: "11px",
}}
>
Selected: {bannerImageName}
</div>
)}

{fileFetcher.data?.error && (
<div
style={{
marginTop: "8px",
color: "#8a1f11",
fontSize: "11px",
}}
>
{fileFetcher.data.error}
</div>
)}

{bannerImagePreview && (
<button
type="button"
onClick={() => {
setBannerImagePreview("");
setBannerImageName("");
setBannerShopifyFileId("");
}}
style={{
marginTop: "8px",
border: 0,
padding: 0,
background: "transparent",
color: "#8a1f11",
font: "inherit",
fontSize: "11px",
cursor: "pointer",
}}
>
Remove image
</button>
)}
</div>
</div>

<div style={{ marginTop: "14px", maxWidth: "320px" }}>
<s-select
label="Banner image layout"
value={bannerImageLayout}
onChange={(event) =>
setBannerImageLayout(
event.currentTarget.value as
| "full"
| "half-left"
| "half-right",
)
}
>
<s-option value="full">Full background</s-option>
<s-option value="half-left">Half image — left</s-option>
<s-option value="half-right">Half image — right</s-option>
</s-select>
</div>
</div>
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
role="presentation"
onClick={() => setIsPreviewDrawerOpen(false)}
>
<aside
className="preview-drawer"
role="dialog"
aria-modal="true"
aria-label="Storefront preview"
onClick={(event) => event.stopPropagation()}
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
role="presentation"
onClick={() => setShowEligibilityPicker(false)}
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
aria-labelledby="eligibility-picker-title"
onClick={(event) => event.stopPropagation()}
style={{
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
