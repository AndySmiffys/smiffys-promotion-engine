import { useEffect, useRef, useState, type CSSProperties } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { countdown, placements, safeLink, type Placement, type WebsiteDraft } from "../design/design";
export type PreviewProduct = { id: string; title: string; image?: string | null; price?: string | null };
export const promotionCss = `
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#202223;background:#f5f5f5}button,a{font:inherit}.pe-shell{padding:20px}.pe-context{background:#fff;border:1px solid #e1e1e1;border-radius:12px;padding:20px}.pe-promo{position:relative;overflow:hidden;border-radius:var(--pe-radius);background:var(--pe-bg);color:var(--pe-fg);text-align:var(--pe-align)}.pe-copy{position:relative;padding:var(--pe-space);display:flex;flex-direction:column;justify-content:center;align-items:var(--pe-items);gap:12px;overflow-wrap:anywhere}.pe-heading{margin:0;font-size:var(--pe-heading);line-height:1.15;font-weight:700}.pe-body{margin:0;font-size:var(--pe-body);line-height:1.5;white-space:pre-wrap}.pe-button{display:inline-block;text-decoration:none;padding:11px 18px;border-radius:var(--pe-radius);background:var(--pe-button-bg);color:var(--pe-button-fg);font-size:14px;font-weight:700}.pe-countdown{font-size:13px;font-weight:600}.pe-banner{min-height:var(--pe-height)}.pe-banner .pe-copy{min-height:var(--pe-height)}.pe-split{display:grid;grid-template-columns:1fr 1fr}.pe-image{width:100%;height:100%;object-fit:cover;object-position:var(--pe-focus);min-height:var(--pe-height)}.pe-full-image{position:absolute;inset:0}.pe-overlay{position:absolute;inset:0;background:rgba(0,0,0,var(--pe-overlay))}.pe-full .pe-copy{max-width:72%}.pe-header .pe-copy{flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center;padding:12px 20px;gap:16px}.pe-header .pe-heading{font-size:16px}.pe-header .pe-body{font-size:13px}.pe-header .pe-button{padding:7px 12px;font-size:12px}.pe-product{display:grid;grid-template-columns:1fr 1fr;gap:24px}.pe-product-photo{width:100%;height:380px;object-fit:contain;background:#fafafa}.pe-product-title{font-size:24px;line-height:1.2}.pe-price{font-size:18px;font-weight:700}.pe-product .pe-promo{margin-top:20px}.pe-product .pe-heading{font-size:min(var(--pe-heading),26px)}.pe-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.pe-card{position:relative;border:1px solid #eee;background:#fff;min-width:0}.pe-card img{width:100%;aspect-ratio:4/5;object-fit:contain;background:#fafafa}.pe-card-info{padding:12px;font-size:14px}.pe-badge{position:absolute;top:10px;left:10px;max-width:calc(100% - 20px);padding:6px 9px;border-radius:var(--pe-radius);background:var(--pe-badge-bg);color:var(--pe-badge-fg);font-size:12px;font-weight:700;overflow-wrap:anywhere}.pe-placeholder{display:grid;place-items:center;min-height:200px;background:#eee;color:#666}.pe-note{font-size:12px;color:#616161;margin-bottom:14px}
@media(max-width:600px){.pe-shell{padding:12px}.pe-context{padding:12px}.pe-product{grid-template-columns:1fr;gap:12px}.pe-product-photo{height:230px}.pe-split{grid-template-columns:1fr}.pe-split .pe-image{max-height:240px;min-height:180px}.pe-full .pe-copy{max-width:100%}.pe-copy{padding:max(16px,calc(var(--pe-space)*.7))}.pe-heading{font-size:clamp(18px,6vw,var(--pe-heading))}.pe-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pe-header .pe-copy{flex-direction:column;gap:8px;text-align:center}.pe-banner,.pe-banner .pe-copy{min-height:min(var(--pe-height),360px)}}
`;
function PromoContent({ value, placement, endsAt, now, offerNote }: { value: WebsiteDraft; placement: Placement; endsAt?: string | null; now: number; offerNote?: string }) {
  const overrides = value.design.overrides[placement];
  const title = overrides.headline || (placement === "badge" ? value.badgeText : value.headline);
  const body = overrides.body || value.body;
  const button = overrides.buttonText || value.buttonText;
  const timer = value.showCountdown ? countdown(endsAt, now) : "";
  return <div className="pe-copy"><h2 className="pe-heading">{title || "Promotion headline"}</h2>{body && <p className="pe-body">{body}</p>}{offerNote && <p className="pe-body">{offerNote}</p>}{timer && <div className="pe-countdown">{value.countdownText || "Offer ends in"} {timer}</div>}{button && value.buttonUrl && safeLink(value.buttonUrl) && <a className="pe-button" href={value.buttonUrl}>{button}</a>}</div>;
}
export function PromotionOffer({ value, placement, endsAt, now, mobile = false, offerNote }: { value: WebsiteDraft; placement: Placement; endsAt?: string | null; now: number; mobile?: boolean; offerNote?: string }) {
  const d = value.design;
  const image = mobile ? d.mobileImage || d.desktopImage : d.desktopImage;
  const style = { "--pe-bg": value.backgroundColour, "--pe-fg": value.textColour, "--pe-button-bg": d.buttonBackground, "--pe-button-fg": d.buttonColour, "--pe-badge-bg": value.badgeColour, "--pe-badge-fg": d.badgeTextColour, "--pe-radius": `${d.radius}px`, "--pe-space": `${d.spacing}px`, "--pe-heading": `${d.headingSize}px`, "--pe-body": `${d.bodySize}px`, "--pe-height": `${d.bannerHeight}px`, "--pe-focus": `${d.focalX}% ${d.focalY}%`, "--pe-overlay": d.overlay / 100, "--pe-align": d.alignment, "--pe-items": d.alignment === "center" ? "center" : d.alignment === "right" ? "flex-end" : "flex-start" } as CSSProperties;

  if (placement === "badge") return <span style={style} className="pe-badge">{d.overrides.badge.headline || value.badgeText || "PROMOTION"}</span>;
  const photo = image ? <img className="pe-image" src={image} alt={d.imageAlt} /> : null;
  return <div style={style} className={`pe-promo ${placement === "header" ? "pe-header" : placement === "collection" ? `pe-banner ${image ? d.imageLayout === "full" ? "pe-full" : "pe-split" : ""}` : ""}`}>
    {placement === "collection" && image && (d.imageLayout === "full" ? <><div className="pe-full-image">{photo}</div><div className="pe-overlay" /></> : d.imageLayout === "half-left" ? photo : null)}
    <PromoContent value={value} placement={placement} endsAt={endsAt} now={now} offerNote={offerNote} />
    {placement === "collection" && image && d.imageLayout === "half-right" ? photo : null}
  </div>;
}
export function PromotionMarkup({ value, placement, products, endsAt, now, mobile = false, offerNote }: { value: WebsiteDraft; placement: Placement; products: PreviewProduct[]; endsAt?: string | null; now: number; mobile?: boolean; offerNote?: string }) {
  const product = products[0];
  const offer = <PromotionOffer value={value} placement={placement} endsAt={endsAt} now={now} mobile={mobile} offerNote={offerNote} />;
  return <div className="pe-shell">
    {placement === "header" && offer}
    {placement === "collection" && <div className="pe-context"><p className="pe-note">Collection page</p>{offer}</div>}
    {placement === "product" && <div className="pe-context pe-product"><div>{product?.image ? <img className="pe-product-photo" src={product.image} alt={product.title} /> : <div className="pe-placeholder">Choose a preview product</div>}</div><div><h1 className="pe-product-title">{product?.title || "Example product"}</h1><p className="pe-price">{product?.price || "Price unavailable"}</p>{offer}</div></div>}
    {placement === "badge" && <div className="pe-context pe-cards">{products.length ? products.slice(0,3).map(p => <div key={p.id} className="pe-card">{p.image ? <img src={p.image} alt={p.title} /> : <div className="pe-placeholder">No image</div>}{offer}<div className="pe-card-info"><strong>{p.title}</strong><p>{p.price || "Price unavailable"}</p></div></div>) : <div className="pe-placeholder">Choose a preview product</div>}</div>}
  </div>;
}
export function PromotionPreview({ value, products, endsAt, productOptions = [], onProductChange, selectedProductId = "", loading = false, sample = false, offerNote }: { value: WebsiteDraft; products: PreviewProduct[]; endsAt?: string | null; productOptions?: PreviewProduct[]; onProductChange?: (id: string) => void; selectedProductId?: string; loading?: boolean; sample?: boolean; offerNote?: string }) {
  const [placement, setPlacement] = useState<Placement>("collection");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [now, setNow] = useState(0);
  const [available, setAvailable] = useState(400);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setAvailable(entries[0].contentRect.width));
    if (ref.current) observer.observe(ref.current); return () => observer.disconnect();
  }, []);
  const enabled = placements.filter(p => value[p.flag]);
  const active = enabled.some(p => p.id === placement) ? placement : enabled[0]?.id;
  const width = device === "desktop" ? 1024 : device === "tablet" ? 768 : 390;
  const height = active === "product" ? device === "mobile" ? 830 : 650 : active === "collection" ? value.design.bannerHeight + (device === "mobile" && value.design.imageLayout !== "full" && value.design.desktopImage ? 280 : 160) : active === "badge" ? device === "mobile" ? 950 : 660 : 280;
  const scale = Math.min(1, available / width);
  const markup = active ? renderToStaticMarkup(<PromotionMarkup value={value} placement={active} products={products} endsAt={endsAt} now={now} mobile={device === "mobile"} offerNote={offerNote} />) : "";
  const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${promotionCss}</style></head><body>${markup}</body></html>`;
  return <section aria-label="Website preview" style={{ border: "1px solid #dedede", borderRadius: 12, padding: 12, background: "#fff", display: "grid", gap: 12, minWidth: 0 }}>
    <strong>Website preview</strong>
    <small style={{ color: "#616161" }}>{value.websiteEnabled && value.included ? "Website promotion enabled" : "Design preview — website promotion is disabled"}</small>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{enabled.map(p => <s-button type="button" variant={active === p.id ? "primary" : "secondary"} key={p.id} aria-pressed={active === p.id} onClick={() => setPlacement(p.id)}>{p.title}</s-button>)}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(["desktop", "tablet", "mobile"] as const).map(item => <s-button type="button" variant={device === item ? "primary" : "secondary"} key={item} aria-pressed={device === item} onClick={() => setDevice(item)}>{item[0].toUpperCase() + item.slice(1)}</s-button>)}</div>
    {onProductChange && <s-select label="Preview product" value={selectedProductId} onChange={event => onProductChange(event.currentTarget.value)}><s-option value="">Use eligible products</s-option>{productOptions.map(p => <s-option key={p.id} value={p.id}>{p.title}</s-option>)}</s-select>}
    {loading && <small role="status">Loading eligible products…</small>}
    {sample && <small>Example product — select qualifying products or collections to preview eligibility.</small>}
    <div ref={ref} style={{ overflow: "auto", minWidth: 0, maxHeight: 650 }}>
      {active ? <div style={{ width: "100%", height: height * scale, position: "relative" }}><iframe title={`${device} ${active} promotion preview`} sandbox="" srcDoc={document} style={{ position: "absolute", top: 0, left: 0, border: 0, width, height, transform: `scale(${scale})`, transformOrigin: "top left", background: "#f5f5f5" }} /></div> : <p>Select a website placement to preview the promotion.</p>}
    </div>
    <small style={{ color: "#616161" }}>{width}px storefront viewport. Theme fonts and surrounding page content may differ.</small>
  </section>;
}
