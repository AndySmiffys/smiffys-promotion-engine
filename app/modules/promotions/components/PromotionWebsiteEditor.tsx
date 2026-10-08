import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { PromotionImageField } from "./PromotionImageField";
import { contrastRatio, copyLimits, placements, presetDesign, validateWebsite, type Placement, type PromotionDesign, type WebsiteDraft } from "../design/design";

const sectionStyle = { border: "1px solid #dedede", borderRadius: 12, background: "#fff", padding: 16, display: "grid", gap: 14 };
const helpStyle = { color: "#616161", fontSize: 12, lineHeight: 1.5 };
function ControlGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const id = useId();
  return <section aria-labelledby={id} style={{ display: "grid", gap: 12, borderTop: "1px solid #ebebeb", paddingTop: 16, minWidth: 0 }}>
    <div style={{ display: "grid", gap: 4 }}><h3 id={id} style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</h3><p style={{ ...helpStyle, margin: 0 }}>{description}</p></div>
    {children}
  </section>;
}
function ColourField({ label, value, onChange, details }: { label: string; value: string; onChange: (value: string) => void; details: string }) {
  const id = useId();
  return <div style={{ display: "grid", gap: 5 }}>
    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: "1px solid #8a8a8a", borderRadius: 8, padding: "8px 12px", background: "#fff", cursor: "pointer", minWidth: 0 }}>
      <span style={{ display: "grid", gap: 3 }}><span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span><span style={{ fontSize: 13, color: "#616161", fontVariantNumeric: "tabular-nums" }}>{value.toUpperCase()}</span></span>
      <input type="color" aria-label={label} aria-describedby={id} value={value} onChange={event => onChange(event.currentTarget.value)} style={{ width: 28, height: 28, flexShrink: 0, padding: 0, border: 0, background: "transparent", cursor: "pointer" }} />
    </label>
    <small id={id} style={helpStyle}>{details}</small>
  </div>;
}
function TextField({ label, value, onChange, maxLength, multiline = false, details }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; multiline?: boolean; details?: string }) {
  return <div style={{ display: "grid", gap: 5 }}>{multiline ? <s-text-area label={label} rows={3} value={value} maxLength={maxLength} details={details} onInput={event => onChange(event.currentTarget.value)} /> : <s-text-field label={label} value={value} maxLength={maxLength} details={details} onInput={event => onChange(event.currentTarget.value)} />}{maxLength && <small style={{ ...helpStyle, textAlign: "right" }}>{value.length}/{maxLength}</small>}</div>;
}
const numberSettings = {
  headingSize: { label: "Headline size (px)", min: 18, max: 48, details: "Main banner headline size. Header and product-panel headlines use smaller sizes to fit their placements." },
  bodySize: { label: "Body size (px)", min: 12, max: 24, details: "Size of the description and offer message. The header uses compact text." },
  bannerHeight: { label: "Banner height (px)", min: 160, max: 600, details: "Minimum height of the collection banner. Mobile layouts adjust the height to fit the screen." },
  spacing: { label: "Content padding (px)", min: 12, max: 60, details: "Space between the edges and content of the banner and product panel." },
  radius: { label: "Corner radius (px)", min: 0, max: 32, details: "Rounds the corners of promotion panels, buttons and badges. Use 0 for square corners." },
};
export function PromotionWebsiteEditor({ value, onChange, endsAt, onBusyChange }: { value: WebsiteDraft; onChange: (value: WebsiteDraft) => void; endsAt?: string | null; onBusyChange: (busy: boolean) => void }) {
  const shopify = useAppBridge();
  const [placement, setPlacement] = useState<Placement>("header");
  const [busySlots, setBusySlots] = useState({ desktop: false, mobile: false });
  const busyRef = useRef(onBusyChange); busyRef.current = onBusyChange;
  useEffect(() => { busyRef.current(busySlots.desktop || busySlots.mobile); }, [busySlots]);
  const [linkType, setLinkType] = useState<"product" | "collection">("collection");
  const [linkError, setLinkError] = useState("");
  const latestValue = useRef(value); latestValue.current = value;
  function set<K extends keyof WebsiteDraft>(name: K, next: WebsiteDraft[K]) { latestValue.current = { ...latestValue.current, [name]: next }; onChange(latestValue.current); }
  function design<K extends keyof PromotionDesign>(name: K, next: PromotionDesign[K]) { set("design", { ...value.design, [name]: next }); }
  async function chooseLink() {
    try {
      const selected = await shopify.resourcePicker({ type: linkType, multiple: false, action: "select" });
      if (selected?.[0]) set("buttonUrl", `/${linkType === "product" ? "products" : "collections"}/${selected[0].handle}`);
      setLinkError("");
    } catch { setLinkError("The selector could not be opened. Enter the button link below."); }
  }
  const errors = validateWebsite(value, endsAt);
  const contrastIssues = [["Promotion text", value.textColour, value.backgroundColour], ["Button text", value.design.buttonColour, value.design.buttonBackground], ["Badge text", value.design.badgeTextColour, value.badgeColour]].filter(([,a,b]) => contrastRatio(a,b) < 4.5);
  function numberField(name: keyof typeof numberSettings) {
    const setting = numberSettings[name];
    return <s-number-field label={setting.label} details={setting.details} min={setting.min} max={setting.max} value={String(value.design[name])} onInput={event => { const next = Number(event.currentTarget.value); if (event.currentTarget.value && Number.isFinite(next)) design(name,next); }} />;
  }
  return <div style={{ display: "grid", gap: 20 }}>
    <section aria-label="Website promotion" style={sectionStyle}>
      <h2 style={{ fontSize: 16, margin: 0 }}>Website promotion</h2>
      <s-select label="Website promotion status" details="Enabled allows eligible offers to appear on the storefront. Draft saves the design while keeping it hidden." value={value.websiteEnabled ? "enabled" : "draft"} onChange={event => set("websiteEnabled", event.currentTarget.value === "enabled")}><s-option value="enabled">Enabled</s-option><s-option value="draft">Draft</s-option></s-select>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(["simple", "campaign", "compact"] as const).map(preset => <s-button key={preset} type="button" variant={value.design.preset === preset ? "primary" : "secondary"} aria-pressed={value.design.preset === preset} onClick={() => set("design", presetDesign(preset, value.design))}>{preset === "simple" ? "Simple offer" : preset === "campaign" ? "Image campaign" : "Compact offer"}</s-button>)}</div>
      <small style={helpStyle}>Presets adjust the design and keep your messages, images and placements.</small>
      <s-checkbox label="Include in promotion sync" details="Required for storefront display, alongside Enabled status." checked={value.included} onChange={event => set("included", event.currentTarget.checked)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
        {placements.map(p => <div key={p.id} style={{ border: "1px solid #dedede", borderRadius: 8, padding: 10, display: "grid", gap: 6 }}><s-checkbox label={p.title} checked={Boolean(value[p.flag])} onChange={event => set(p.flag, event.currentTarget.checked)} /><small style={helpStyle}>{p.description}</small></div>)}
      </div>
      <s-checkbox label="Show countdown to the promotion end date" details="Requires an end date in Schedule. The timer appears in the header, collection banner and product panel." checked={value.showCountdown} onChange={event => set("showCountdown", event.currentTarget.checked)} />
      <ControlGroup title="Banner images" description="Images appear in the collection banner. Choose a layout, then adjust the crop and readability together.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          <PromotionImageField label="Desktop banner image" url={value.design.desktopImage} fileId={value.design.desktopImageId} onBusy={busy => setBusySlots(current => ({ ...current, desktop: busy }))} onChange={image => set("design", { ...latestValue.current.design, desktopImage: image?.url ?? "", desktopImageId: image?.id ?? "" })} />
          <PromotionImageField label="Mobile banner image" url={value.design.mobileImage} fileId={value.design.mobileImageId} onBusy={busy => setBusySlots(current => ({ ...current, mobile: busy }))} onChange={image => set("design", { ...latestValue.current.design, mobileImage: image?.url ?? "", mobileImageId: image?.id ?? "" })} />
        </div>
        <small style={helpStyle}>Suggested starting sizes: 1600 × 600 px desktop; 800 × 1000 px mobile. JPG, PNG or WebP, up to 20 MB. Mobile uses the desktop image if left blank. Choose an existing image or upload through Shopify Files. You can also drag an image into either image area.</small>
        <TextField label="Image description (alt text)" value={value.design.imageAlt} maxLength={250} details="Describe the image for shoppers using screen readers." onChange={next => design("imageAlt", next)} />
        <s-select label="Banner image layout" details="Full background puts the message over the image. Image left or right places the message beside it; mobile stacks the two." value={value.design.imageLayout} onChange={event => design("imageLayout", event.currentTarget.value as PromotionDesign["imageLayout"])}><s-option value="full">Full background</s-option><s-option value="half-left">Image left</s-option><s-option value="half-right">Image right</s-option></s-select>
        {(value.design.desktopImage || value.design.mobileImage) && <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 5 }}>Image focal point — horizontal ({value.design.focalX}%)<input aria-label="Horizontal focal point" style={{ width: "100%", accentColor: "#303030" }} type="range" min={0} max={100} value={value.design.focalX} onChange={event => design("focalX", Number(event.currentTarget.value))} /><small style={helpStyle}>Choose which part of the image stays visible when cropped: 0% left, 50% centre, 100% right.</small></label>
          <label style={{ display: "grid", gap: 5 }}>Image focal point — vertical ({value.design.focalY}%)<input aria-label="Vertical focal point" style={{ width: "100%", accentColor: "#303030" }} type="range" min={0} max={100} value={value.design.focalY} onChange={event => design("focalY", Number(event.currentTarget.value))} /><small style={helpStyle}>Choose the vertical crop position: 0% top, 50% centre, 100% bottom.</small></label>
          <label style={{ display: "grid", gap: 5 }}>Dark image overlay ({value.design.overlay}%)<input aria-label="Image overlay" style={{ width: "100%", accentColor: "#303030" }} type="range" min={0} max={90} value={value.design.overlay} onChange={event => design("overlay", Number(event.currentTarget.value))} /><small style={helpStyle}>Darkens full background images to improve text contrast. Split image layouts do not use the overlay.</small></label>
        </div>}
      </ControlGroup>
    </section>
    <section aria-label="Messages and styling" style={sectionStyle}>
      <h2 style={{ fontSize: 16, margin: 0 }}>Messages and styling</h2>
      <small style={helpStyle}>Each group keeps its wording and appearance together. Shared messages apply everywhere unless a placement override is filled in.</small>
      <ControlGroup title="Promotion text" description="Set the main message, its colours and typography for banners and product panels.">
        <TextField label="Headline" value={value.headline} maxLength={copyLimits.headline} onChange={next => set("headline", next)} />
        <TextField label="Body" value={value.body} maxLength={copyLimits.body} multiline onChange={next => set("body", next)} />
        <TextField label="Countdown label" value={value.countdownText} maxLength={copyLimits.countdownText} details="Text before the timer, such as ‘Offer ends in’. Visible when the countdown is enabled." onChange={next => set("countdownText", next)} />
        <ColourField label="Text colour" value={value.textColour} onChange={next => set("textColour", next)} details="Colour of the headline, body, offer message and countdown. Button and badge text have separate colours below." />
        <ColourField label="Background colour" value={value.backgroundColour} onChange={next => set("backgroundColour", next)} details="Background of the header, banner and product panel. A full background image covers this colour." />
        <s-select label="Text alignment" details="Positions the text within the promotion content area." value={value.design.alignment} onChange={event => design("alignment",event.currentTarget.value as PromotionDesign["alignment"])}><s-option value="left">Left</s-option><s-option value="center">Centre</s-option><s-option value="right">Right</s-option></s-select>
        {numberField("headingSize")}
        {numberField("bodySize")}
      </ControlGroup>
      <ControlGroup title="Button" description="Set the call to action and its destination, then choose contrasting button colours.">
        <TextField label="Button text" value={value.buttonText} maxLength={copyLimits.buttonText} details="Leave blank to hide the button. Each visible button needs a link." onChange={next => set("buttonText", next)} />
        <TextField label="Button link" value={value.buttonUrl} details="Enter a shop path or full web address, or select a product or collection below." onChange={next => set("buttonUrl",next)} />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 8 }}><div style={{ flex: "1 1 160px" }}><s-select label="Link destination" value={linkType} onChange={event => setLinkType(event.currentTarget.value as typeof linkType)}><s-option value="collection">Collection</s-option><s-option value="product">Product</s-option></s-select></div><s-button type="button" variant="secondary" onClick={chooseLink}>{linkType === "collection" ? "Select collection" : "Select product"}</s-button></div>
        {linkError && <small role="alert">{linkError}</small>}
        <ColourField label="Button background colour" value={value.design.buttonBackground} onChange={next => design("buttonBackground", next)} details="Fill colour behind the button label." />
        <ColourField label="Button text colour" value={value.design.buttonColour} onChange={next => design("buttonColour", next)} details="Colour of the button label. Choose a colour that is easy to read against the button background." />
      </ControlGroup>
      <ControlGroup title="Product badge" description="A short label on eligible product cards. The badge has its own text and colour settings.">
        <TextField label="Badge text" value={value.badgeText} maxLength={copyLimits.badgeText} details="Keep it short, for example ‘20% OFF’ or ‘MULTIBUY’." onChange={next => set("badgeText", next)} />
        <ColourField label="Badge background colour" value={value.badgeColour} onChange={next => set("badgeColour", next)} details="Fill colour of the label on the product card." />
        <ColourField label="Badge text colour" value={value.design.badgeTextColour} onChange={next => design("badgeTextColour", next)} details="Colour of the badge wording. This does not change the product title or price." />
      </ControlGroup>
      <ControlGroup title="Layout and spacing" description="Adjust the size and shape of the promotion. Check desktop and mobile previews after changing these settings.">
        {numberField("bannerHeight")}
        {numberField("spacing")}
        {numberField("radius")}
      </ControlGroup>
      <ControlGroup title="Placement wording" description="Use a shorter message for the header or product panel, or a different badge label.">
        <details><summary style={{ cursor: "pointer", fontWeight: 600 }}>Text overrides by placement</summary><div style={{ display: "grid", gap: 12, marginTop: 12 }}><s-select label="Placement to customise" value={placement} onChange={event => setPlacement(event.currentTarget.value as Placement)}>{placements.map(p => <s-option key={p.id} value={p.id}>{p.title}</s-option>)}</s-select>{(["headline", "body", "buttonText"] as const).filter(name => placement !== "badge" || name === "headline").map(name => <TextField key={placement + name} label={placement === "badge" ? "Badge text override" : `${name === "headline" ? "Headline" : name === "body" ? "Body" : "Button text"} override`} value={value.design.overrides[placement][name]} maxLength={placement === "badge" ? 40 : copyLimits[name]} multiline={name === "body"} onChange={next => design("overrides", { ...value.design.overrides, [placement]: { ...value.design.overrides[placement], [name]: next } })} />)}<small style={helpStyle}>Leave blank to use the shared message. Links and colours stay the same across placements.</small></div></details>
      </ControlGroup>
      <ControlGroup title="Display priority" description="Choose which offer appears when more than one promotion qualifies for the same placement.">
        <s-number-field label="Promotion priority" details="Higher numbers are shown first. Use 0 for normal priority and a larger number for an offer you want to take precedence." min={0} max={9999} step={1} value={String(value.priority)} onInput={event => set("priority",Math.max(0,Number(event.currentTarget.value) || 0))} />
      </ControlGroup>
      {contrastIssues.length > 0 && <div role="status" style={{ padding: 10, background: "#fff8e6", borderRadius: 8 }}>Improve readability: {contrastIssues.map(([label]) => label).join(", ")} has low contrast. Text over images should also be checked in the preview.</div>}
      {errors.length > 0 && <ul style={{ margin: 0, paddingLeft: 18, color: "#b42318", fontSize: 12 }}>{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    </section>
  </div>;
}
