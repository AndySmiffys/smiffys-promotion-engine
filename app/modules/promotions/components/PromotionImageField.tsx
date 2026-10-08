import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { action } from "../../../routes/app.promotion-assets";
import type { PromotionImage } from "../services/promotionAssets.server";
export function PromotionImageField({ label, url, fileId, onChange, onBusy }: { label: string; url: string; fileId: string; onChange: (image: PromotionImage | null) => void; onBusy: (busy: boolean) => void }) {
  const fetcher = useFetcher<typeof action>();
  const changeRef = useRef(onChange);
  const busyRef = useRef(onBusy);
  changeRef.current = onChange;
  busyRef.current = onBusy;
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const busy = pickerOpen || fetcher.state !== "idle";
  useEffect(() => { busyRef.current(busy); }, [busy]);
  useEffect(() => {
    if (fetcher.data?.success && fetcher.data.image) changeRef.current(fetcher.data.image);
    setError(fetcher.data?.error ?? "");
  }, [fetcher.data]);
  function upload(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 20 * 1024 * 1024) { setError("Choose a JPG, PNG or WebP image up to 20 MB."); return; }
    const data = new FormData(); data.set("intent", "upload"); data.set("file", file);
    fetcher.submit(data, { method: "post", encType: "multipart/form-data", action: "/app/promotion-assets" });
  }
  async function browse() {
    if (busy) return;
    setError("");
    setPickerOpen(true);
    try {
      const bridge = window.shopify as unknown as { intents?: { invoke: (name: string, options: unknown) => Promise<{ complete: Promise<{ code: string; data?: { ids?: string[] } }> }> } };
      if (!bridge?.intents) { setError("Shopify Files is unavailable here. Try again or drag an image into the image area."); return; }
      const picker = await bridge.intents.invoke("pick:shopify/File", { data: { mediaTypes: ["MediaImage"], multiSelect: false, selectedFiles: fileId ? [fileId] : [] } });
      const result = await picker.complete;
      if (result.code === "ok" && result.data?.ids?.[0]) fetcher.submit({ intent: "resolve", fileId: result.data.ids[0] }, { method: "post", action: "/app/promotion-assets" });
    } catch { setError("The file picker could not be opened. Try again or drag an image into the image area."); }
    finally { setPickerOpen(false); }
  }
  return <div style={{ display: "grid", gap: 8 }}>
    <strong style={{ fontSize: 12 }}>{label}</strong>
    <button type="button" aria-label={"Choose " + label.toLowerCase() + " from Shopify Files"} disabled={busy} onClick={browse} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy) upload(event.dataTransfer.files[0]); }} style={{ padding: 12, border: "1px dashed #a0a0a0", borderRadius: 10, background: "#fafafa", cursor: busy ? "wait" : "pointer", minHeight: 90, font: "inherit", color: "#303030", width: "100%" }}>
      {url ? <img src={url} alt={label} style={{ width: "100%", height: 100, objectFit: "contain" }} /> : <span>Drop an image or choose a file</span>}
    </button>
    {url && <div><s-button type="button" variant="tertiary" disabled={busy} onClick={() => { onChange(null); setError(""); }}>Remove image</s-button></div>}
    {busy && <span role="status">{pickerOpen ? "Choosing image…" : "Preparing image…"}</span>}
    {error && <span role="alert" style={{ color: "#b42318" }}>{error}</span>}
  </div>;
}
