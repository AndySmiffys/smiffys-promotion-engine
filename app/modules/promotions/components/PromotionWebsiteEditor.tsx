import { useEffect, useRef, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { PromotionImageField } from "./PromotionImageField";
import { contrastRatio, copyLimits, placements, presetDesign, validateWebsite, type Placement, type PromotionDesign, type WebsiteDraft } from "../design/design";

const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "9px 10px", border: "1px solid #c9c9c9", borderRadius: 8, background: "#fff", color: "#202223", font: "inherit" };
const sectionStyle = { border: "1px solid #dedede", borderRadius: 12, background: "#fff", padding: 16, display: "grid", gap: 14 };
function TextField({ label, value, onChange, maxLength, multiline = false }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; multiline?: boolean }) {
  return <label style={{ display: "grid", gap: 5, fontSize: 12 }}><span>{label}</span>{multiline ? <textarea rows={3} style={inputStyle} value={value} maxLength={maxLength} onChange={event => onChange(event.currentTarget.value)} /> : <input style={inputStyle} value={value} maxLength={maxLength} onChange={event => onChange(event.currentTarget.value)} />}{maxLength && <small style={{ color: "#616161", textAlign: "right" }}>{value.length}/{maxLength}</small>}</label>;
}
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
  return <div style={{ display: "grid", gap: 20 }}>
    <section aria-label="Website promotion" style={sectionStyle}>
      <h2 style={{ fontSize: 16, margin: 0 }}>Website promotion</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(["simple", "campaign", "compact"] as const).map(preset => <button key={preset} type="button" aria-pressed={value.design.preset === preset} onClick={() => set("design", presetDesign(preset, value.design))} style={{ padding: "9px 12px", border: "1px solid " + (value.design.preset === preset ? "#202223" : "#dedede"), borderRadius: 8, background: value.design.preset === preset ? "#f1f1f1" : "#fff", cursor: "pointer" }}>{preset === "simple" ? "Simple offer" : preset === "campaign" ? "Image campaign" : "Compact offer"}</button>)}</div>
      <small style={{ color: "#616161" }}>Presets adjust the design and keep your messages, images and placements.</small>
      <label><input type="checkbox" checked={value.included} onChange={event => set("included", event.currentTarget.checked)} /> Include in promotion sync</label>
      <label><input type="checkbox" checked={value.websiteEnabled} onChange={event => set("websiteEnabled", event.currentTarget.checked)} /> Enable website promotion</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
        {placements.map(p => <label key={p.id} style={{ border: "1px solid #dedede", borderRadius: 8, padding: 10, display: "grid", gap: 6 }}><span><input type="checkbox" checked={Boolean(value[p.flag])} onChange={event => set(p.flag, event.currentTarget.checked)} /> <strong>{p.title}</strong></span><small style={{ color: "#616161" }}>{p.description}</small></label>)}
      </div>
      <label><input type="checkbox" checked={value.showCountdown} onChange={event => set("showCountdown", event.currentTarget.checked)} /> Show countdown to the promotion end date</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <PromotionImageField label="Desktop banner image" url={value.design.desktopImage} fileId={value.design.desktopImageId} onBusy={busy => setBusySlots(current => ({ ...current, desktop: busy }))} onChange={image => set("design", { ...latestValue.current.design, desktopImage: image?.url ?? "", desktopImageId: image?.id ?? "" })} />
        <PromotionImageField label="Mobile banner image" url={value.design.mobileImage} fileId={value.design.mobileImageId} onBusy={busy => setBusySlots(current => ({ ...current, mobile: busy }))} onChange={image => set("design", { ...latestValue.current.design, mobileImage: image?.url ?? "", mobileImageId: image?.id ?? "" })} />
      </div>
      <small style={{ color: "#616161" }}>Suggested starting sizes: 1600 × 600 px desktop; 800 × 1000 px mobile. JPG, PNG or WebP, up to 20 MB. Mobile uses the desktop image if left blank. Images upload to Shopify Files when selected.</small>
      <TextField label="Image description (alt text)" value={value.design.imageAlt} maxLength={250} onChange={next => design("imageAlt", next)} />
      <label style={{ display: "grid", gap: 5 }}>Banner image layout<select style={inputStyle} value={value.design.imageLayout} onChange={event => design("imageLayout", event.currentTarget.value as PromotionDesign["imageLayout"])}><option value="full">Full background</option><option value="half-left">Image left</option><option value="half-right">Image right</option></select></label>
      {value.design.desktopImage && <div style={{ display: "grid", gap: 10 }}><label>Image focal point — horizontal ({value.design.focalX}%)<input aria-label="Horizontal focal point" style={{ width: "100%" }} type="range" min={0} max={100} value={value.design.focalX} onChange={event => design("focalX", Number(event.currentTarget.value))} /></label><label>Image focal point — vertical ({value.design.focalY}%)<input aria-label="Vertical focal point" style={{ width: "100%" }} type="range" min={0} max={100} value={value.design.focalY} onChange={event => design("focalY", Number(event.currentTarget.value))} /></label><label>Dark image overlay ({value.design.overlay}%)<input aria-label="Image overlay" style={{ width: "100%" }} type="range" min={0} max={90} value={value.design.overlay} onChange={event => design("overlay", Number(event.currentTarget.value))} /></label></div>}
    </section>
    <section aria-label="Messages and styling" style={sectionStyle}>
      <h2 style={{ fontSize: 16, margin: 0 }}>Messages and styling</h2>
      <small style={{ color: "#616161" }}>Shared messages apply everywhere unless a placement override is filled in.</small>
      {(["headline", "body", "badgeText", "countdownText", "buttonText"] as const).map(name => <TextField key={name} label={{ headline: "Headline", body: "Body", badgeText: "Badge text", countdownText: "Countdown label", buttonText: "Button text" }[name]} value={value[name]} maxLength={copyLimits[name]} multiline={name === "body"} onChange={next => set(name,next)} />)}
      <TextField label="Button link" value={value.buttonUrl} onChange={next => set("buttonUrl",next)} />
      <div style={{ display: "flex", gap: 8 }}><select aria-label="Button link resource" value={linkType} onChange={event => setLinkType(event.currentTarget.value as typeof linkType)}><option value="collection">Collection</option><option value="product">Product</option></select><button type="button" onClick={chooseLink}>Select from store</button></div>
      {linkError && <small role="alert">{linkError}</small>}
      <details><summary style={{ cursor: "pointer", fontWeight: 600 }}>Text overrides by placement</summary><div style={{ display: "grid", gap: 12, marginTop: 12 }}><select aria-label="Placement to customise" style={inputStyle} value={placement} onChange={event => setPlacement(event.currentTarget.value as Placement)}>{placements.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>{(["headline", "body", "buttonText"] as const).filter(name => placement !== "badge" || name === "headline").map(name => <TextField key={placement + name} label={placement === "badge" ? "Badge text override" : `${name === "headline" ? "Headline" : name === "body" ? "Body" : "Button text"} override`} value={value.design.overrides[placement][name]} maxLength={placement === "badge" ? 40 : copyLimits[name]} multiline={name === "body"} onChange={next => design("overrides", { ...value.design.overrides, [placement]: { ...value.design.overrides[placement], [name]: next } })} />)}<small>Leave blank to use the shared message.</small></div></details>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
        {(["backgroundColour", "textColour", "badgeColour"] as const).map(name => <label key={name} style={{ display: "grid", gap: 5 }}>{name === "backgroundColour" ? "Background colour" : name === "textColour" ? "Text colour" : "Badge colour"}<input aria-label={name} type="color" value={value[name]} onChange={event => set(name,event.currentTarget.value)} /></label>)}
        {(["buttonBackground", "buttonColour", "badgeTextColour"] as const).map(name => <label key={name} style={{ display: "grid", gap: 5 }}>{name === "buttonBackground" ? "Button background" : name === "buttonColour" ? "Button text colour" : "Badge text colour"}<input aria-label={name} type="color" value={value.design[name]} onChange={event => design(name,event.currentTarget.value)} /></label>)}
        <label style={{ display: "grid", gap: 5 }}>Text alignment<select style={inputStyle} value={value.design.alignment} onChange={event => design("alignment",event.currentTarget.value as PromotionDesign["alignment"])}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
        {(["bannerHeight", "spacing", "radius", "headingSize", "bodySize"] as const).map(name => <label key={name} style={{ display: "grid", gap: 5 }}>{ { bannerHeight: "Banner height (px)", spacing: "Padding (px)", radius: "Corner radius (px)", headingSize: "Headline size (px)", bodySize: "Body size (px)" }[name]}<input style={inputStyle} type="number" min={{ bannerHeight: 160, spacing: 12, radius: 0, headingSize: 18, bodySize: 12 }[name]} max={{ bannerHeight: 600, spacing: 60, radius: 32, headingSize: 48, bodySize: 24 }[name]} value={value.design[name]} onChange={event => { const next = event.currentTarget.valueAsNumber; if (Number.isFinite(next)) design(name,next); }} /></label>)}
        <label style={{ display: "grid", gap: 5 }}>Promotion priority<input style={inputStyle} type="number" min={0} max={9999} step={1} value={value.priority} onChange={event => set("priority",Math.max(0,event.currentTarget.valueAsNumber || 0))} /></label>
      </div>
      {contrastIssues.length > 0 && <div role="status" style={{ padding: 10, background: "#fff8e6", borderRadius: 8 }}>Improve readability: {contrastIssues.map(([label]) => label).join(", ")} has low contrast. Text over images should also be checked in the preview.</div>}
      {errors.length > 0 && <ul style={{ margin: 0, paddingLeft: 18, color: "#b42318", fontSize: 12 }}>{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    </section>
  </div>;
}
