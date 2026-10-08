import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { action } from "../../../routes/app.promotion-assets";
import type { PromotionImage } from "../services/promotionAssets.server";
export function PromotionImageField({ label, url, fileId, onChange, onBusy }: { label: string; url: string; fileId: string; onChange: (image: PromotionImage | null) => void; onBusy: (busy: boolean) => void }) {
  const fetcher = useFetcher<typeof action>();
  const inputRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef(onChange);
  const busyRef = useRef(onBusy);
  changeRef.current = onChange;
  busyRef.current = onBusy;
  const [error, setError] = useState("");
  const busy = fetcher.state !== "idle";
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
    try {
      const bridge = window.shopify as unknown as { intents?: { invoke: (name: string, options: unknown) => Promise<{ complete: Promise<{ code: string; data?: { ids?: string[] } }> }> } };
      if (!bridge?.intents) { setError("Shopify Files is unavailable here. Use Upload image."); return; }
      const picker = await bridge.intents.invoke("pick:shopify/File", { data: { mediaTypes: ["MediaImage"], multiSelect: false, selectedFiles: fileId ? [fileId] : [] } });
      const result = await picker.complete;
      if (result.code === "ok" && result.data?.ids?.[0]) fetcher.submit({ intent: "resolve", fileId: result.data.ids[0] }, { method: "post", action: "/app/promotion-assets" });
    } catch { setError("The file picker could not be opened. Use Upload image."); }
  }
  return <div style={{ display: "grid", gap: 8 }}>
    <strong style={{ fontSize: 12 }}>{label}</strong>
    <button type="button" aria-label={"Upload " + label.toLowerCase()} disabled={busy} onClick={() => inputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy) upload(event.dataTransfer.files[0]); }} style={{ padding: 12, border: "1px dashed #a0a0a0", borderRadius: 10, background: "#fafafa", cursor: "pointer", minHeight: 90 }}>
      {url ? <img src={url} alt={label} style={{ width: "100%", height: 100, objectFit: "contain" }} /> : <span>Drop an image or choose a file</span>}
    </button>
    <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { upload(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><button type="button" disabled={busy} onClick={browse}>Shopify Files</button>{url && <button type="button" disabled={busy} onClick={() => { onChange(null); setError(""); }}>Remove image</button>}</div>
    {busy && <span role="status">Uploading and preparing image…</span>}
    {error && <span role="alert" style={{ color: "#b42318" }}>{error}</span>}
  </div>;
}
