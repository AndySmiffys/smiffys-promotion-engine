export type Placement = "header" | "collection" | "product" | "badge";
export type PlacementCopy = { headline: string; body: string; buttonText: string };
export type PromotionDesign = {
  version: 1;
  preset: "simple" | "campaign" | "compact";
  desktopImage: string;
  desktopImageId: string;
  mobileImage: string;
  mobileImageId: string;
  imageAlt: string;
  imageLayout: "full" | "half-left" | "half-right";
  focalX: number;
  focalY: number;
  overlay: number;
  alignment: "left" | "center" | "right";
  bannerHeight: number;
  spacing: number;
  radius: number;
  headingSize: number;
  bodySize: number;
  buttonBackground: string;
  buttonColour: string;
  badgeTextColour: string;
  overrides: Record<Placement, PlacementCopy>;
};
export type WebsiteDraft = {
  included: boolean; websiteEnabled: boolean;
  showProductPage: boolean; showCollectionPage: boolean; showProductBadge: boolean;
  showCountdown: boolean; showHeaderBanner: boolean;
  headline: string; body: string; badgeText: string; countdownText: string;
  buttonText: string; buttonUrl: string;
  backgroundColour: string; textColour: string; badgeColour: string;
  priority: number; design: PromotionDesign;
};
const emptyCopy = (): PlacementCopy => ({ headline: "", body: "", buttonText: "" });
export function defaultDesign(): PromotionDesign {
  return { version: 1, preset: "simple", desktopImage: "", desktopImageId: "", mobileImage: "", mobileImageId: "", imageAlt: "", imageLayout: "half-right", focalX: 50, focalY: 50, overlay: 45, alignment: "left", bannerHeight: 280, spacing: 24, radius: 8, headingSize: 28, bodySize: 16, buttonBackground: "#202223", buttonColour: "#ffffff", badgeTextColour: "#ffffff", overrides: { header: emptyCopy(), collection: emptyCopy(), product: emptyCopy(), badge: emptyCopy() } };
}
export const placements: Array<{ id: Placement; title: string; flag: keyof WebsiteDraft; description: string }> = [
  { id: "header", title: "Header", flag: "showHeaderBanner", description: "A short announcement above the site content." },
  { id: "collection", title: "Collection", flag: "showCollectionPage", description: "A campaign banner on qualifying collection pages." },
  { id: "product", title: "Product", flag: "showProductPage", description: "An offer panel beside the details of an eligible product." },
  { id: "badge", title: "Product badge", flag: "showProductBadge", description: "A short label on eligible product cards." },
];
export const copyLimits = { headline: 120, body: 500, badgeText: 40, countdownText: 80, buttonText: 60 };
export function safeLink(value: string): boolean {
  return !value || /^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value);
}
export function safeImage(value: string): boolean { return !value || /^https:\/\//i.test(value); }
export function readDesign(value: unknown): PromotionDesign {
  const defaults = defaultDesign();
  const input = typeof value === "string" ? JSON.parse(value || "{}") : value;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("The promotion design is invalid.");
  const source = input as Record<string, unknown>;
  const design = { ...defaults };
  for (const name of ["desktopImage", "desktopImageId", "mobileImage", "mobileImageId", "imageAlt", "buttonBackground", "buttonColour", "badgeTextColour"] as const) {
    if (source[name] !== undefined) {
      if (typeof source[name] !== "string") throw new Error("Invalid design field: " + name);
      design[name] = (source[name] as string).trim();
    }
  }
  if (design.imageAlt.length > 250) throw new Error("Image description must be 250 characters or fewer.");
  for (const name of ["desktopImage", "mobileImage"] as const) if (!safeImage(design[name])) throw new Error("Images must use secure Shopify file URLs.");
  for (const name of ["buttonBackground", "buttonColour", "badgeTextColour"] as const) if (!/^#[\da-f]{6}$/i.test(design[name])) throw new Error("Use six-digit hex colours.");
  const ranges = { focalX: [0, 100], focalY: [0, 100], overlay: [0, 90], bannerHeight: [160, 600], spacing: [12, 60], radius: [0, 32], headingSize: [18, 48], bodySize: [12, 24] } as const;
  for (const name of Object.keys(ranges) as Array<keyof typeof ranges>) {
    if (source[name] !== undefined) {
      const number = Number(source[name]);
      if (!Number.isFinite(number) || number < ranges[name][0] || number > ranges[name][1]) throw new Error("Invalid design field: " + name);
      design[name] = number;
    }
  }
  for (const [name, options] of [["preset", ["simple", "campaign", "compact"]], ["imageLayout", ["full", "half-left", "half-right"]], ["alignment", ["left", "center", "right"]]] as const) {
    if (source[name] !== undefined) {
      if (!(options as readonly unknown[]).includes(source[name])) throw new Error("Invalid design field: " + name);
      Object.assign(design, { [name]: source[name] });
    }
  }
  design.overrides = { ...defaults.overrides };
  for (const placement of placements) {
    const item = (source.overrides as Record<string, unknown> | undefined)?.[placement.id];
    if (!item) continue;
    if (typeof item !== "object" || Array.isArray(item)) throw new Error("Invalid placement text.");
    const copy = emptyCopy();
    for (const name of ["headline", "body", "buttonText"] as const) {
      const text = (item as Record<string, unknown>)[name];
      if (text === undefined) continue;
      if (typeof text !== "string" || text.length > (placement.id === "badge" && name === "headline" ? 40 : copyLimits[name])) throw new Error("Placement text is too long.");
      copy[name] = text.trim();
    }
    design.overrides[placement.id] = copy;
  }
  return design;
}
export function presetDesign(preset: PromotionDesign["preset"], current: PromotionDesign): PromotionDesign {
  const styles = preset === "campaign" ? { imageLayout: "full" as const, bannerHeight: 360, headingSize: 36, spacing: 32, radius: 12, overlay: 55 } : preset === "compact" ? { imageLayout: "half-right" as const, bannerHeight: 180, headingSize: 22, spacing: 16, radius: 6, overlay: 45 } : { imageLayout: "half-right" as const, bannerHeight: 280, headingSize: 28, spacing: 24, radius: 8, overlay: 45 };
  return { ...current, ...styles, preset };
}
export function contrastRatio(a: string, b: string): number {
  function luminance(hex: string) {
    if (!/^#[\da-f]{6}$/i.test(hex)) return NaN;
    const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function countdown(endsAt: string | null | undefined, now: number): string {
  if (!endsAt) return "";
  const remaining = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(remaining)) return "";
  if (remaining <= 0) return "Offer ended";
  const minutes = Math.ceil(remaining / 60000);
  return `${Math.floor(minutes / 1440)}d ${Math.floor(minutes % 1440 / 60)}h ${minutes % 60}m`;
}
export function validateWebsite(value: WebsiteDraft, endsAt?: string | null): string[] {
  const errors: string[] = [];
  try { readDesign(value.design); } catch (error) { errors.push(error instanceof Error ? error.message : "Invalid design settings."); }
  for (const name of Object.keys(copyLimits) as Array<keyof typeof copyLimits>) if (value[name].length > copyLimits[name]) errors.push(`${name} is too long.`);
  if (value.buttonUrl.length > 2048) errors.push("The button link is too long.");
  if (!safeLink(value.buttonUrl)) errors.push("Use a relative shop link or an http/https button link.");
  if (value.websiteEnabled && !placements.some(p => value[p.flag])) errors.push("Choose at least one website placement.");
  if (value.websiteEnabled && !value.headline.trim() && !placements.filter(p => value[p.flag]).every(p => p.id === "badge" ? value.badgeText.trim() : value.design.overrides[p.id].headline.trim())) errors.push("Add a headline for the selected placements.");
  if (value.showCountdown && !endsAt) errors.push("Set an end date to show a countdown.");
  if ((value.buttonText.trim() || placements.some(p => value.design.overrides[p.id].buttonText.trim())) && !value.buttonUrl.trim()) errors.push("Select a link for the promotion button.");
  return errors;
}

export function readWebsite(value: unknown): WebsiteDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid website settings.");
  const source = value as Record<string, unknown>;
  const result = { design: readDesign(source.design ?? {}) } as WebsiteDraft;
  for (const name of ["included", "websiteEnabled", "showProductPage", "showCollectionPage", "showProductBadge", "showCountdown", "showHeaderBanner"] as const) {
    if (typeof source[name] !== "boolean") throw new Error("Invalid website setting: " + name);
    result[name] = source[name] as boolean;
  }
  for (const name of ["headline", "body", "badgeText", "countdownText", "buttonText", "buttonUrl", "backgroundColour", "textColour", "badgeColour"] as const) {
    if (typeof source[name] !== "string") throw new Error("Invalid website text: " + name);
    result[name] = (source[name] as string).trim();
  }
  for (const name of ["backgroundColour", "textColour", "badgeColour"] as const) if (!/^#[\da-f]{6}$/i.test(result[name])) throw new Error("Use six-digit hex colours.");
  result.priority = Number(source.priority);
  if (!Number.isInteger(result.priority) || result.priority < 0 || result.priority > 9999) throw new Error("Priority must be between 0 and 9999.");
  return result;
}
export function websiteFromSettings(settings: { [K in Exclude<keyof WebsiteDraft, "design">]: WebsiteDraft[K] extends string ? string | null : WebsiteDraft[K] } & { designJson?: string | null }): WebsiteDraft {
  return readWebsite({ ...settings, headline: settings.headline ?? "", body: settings.body ?? "", badgeText: settings.badgeText ?? "", countdownText: settings.countdownText ?? "", buttonText: settings.buttonText ?? "", buttonUrl: settings.buttonUrl ?? "", backgroundColour: settings.backgroundColour || "#ffffff", textColour: settings.textColour || "#000000", badgeColour: settings.badgeColour || "#d72c0d", design: readDesign(settings.designJson ?? "{}") });
}
export function websiteStorage(value: WebsiteDraft) {
  const { design, ...fields } = value;
  return { ...fields, designJson: JSON.stringify(design) };
}
