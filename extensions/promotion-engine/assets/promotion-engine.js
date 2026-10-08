(() => {
  if (customElements.get('promotion-engine')) return;
  const pending = new Map();
  class PromotionEngine extends HTMLElement {
    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.media = matchMedia('(max-width:600px)');
      this.refresh = () => this.load();
      this.variantChanged = event => {
        const id = event.detail?.variant?.id ?? event.detail?.variantId;
        if (id) { this.dataset.variantId = String(id); this.load(); }
      };
      this.media.addEventListener('change', this.refresh);
      document.addEventListener('variant:change', this.variantChanged);
      document.addEventListener('variant-change', this.variantChanged);
      this.formChanged = event => { const form = event.target.closest('form'); if (this.dataset.placement !== 'product' || !form?.querySelector('input[name="id"]')) return; setTimeout(() => { const input = form.querySelector('input[name="id"]'); if (input?.value) { this.dataset.variantId = input.value; this.load(); } }, 150); };
      document.addEventListener('change', this.formChanged);
      this.timer = setInterval(this.refresh, 60000);
      this.load();
    }
    disconnectedCallback() {
      clearInterval(this.timer);
      clearTimeout(this.expiryTimer);
      this.media?.removeEventListener('change', this.refresh);
      document.removeEventListener('variant:change', this.variantChanged);
      document.removeEventListener('variant-change', this.variantChanged);
      document.removeEventListener('change', this.formChanged);
      this.requestVersion = (this.requestVersion || 0) + 1;
    }
    async load() {
      const version = this.requestVersion = (this.requestVersion || 0) + 1;
      const path = this.dataset.proxyPath || '/apps/promotion-engine';
      if (!/^\/(?!\/)/.test(path)) return;
      const url = new URL(path, location.origin);
      url.searchParams.set('placement', this.dataset.placement || 'product');
      if (this.dataset.productId) url.searchParams.set('product_id', this.dataset.productId);
      if (this.dataset.collectionId) url.searchParams.set('collection_id', this.dataset.collectionId);
      if (this.dataset.variantId) url.searchParams.set('variant_id', this.dataset.variantId);
      url.searchParams.set('mobile', this.media.matches ? '1' : '0');
      const key = url.toString();
      try {
        if (!pending.has(key)) pending.set(key, fetch(key, { credentials: 'same-origin', cache: 'no-store' }).then(response => { if (!response.ok) throw new Error('Promotion request failed'); return response.json(); }).finally(() => pending.delete(key)));
        const result = await pending.get(key);
        if (!this.isConnected || version !== this.requestVersion) return;
        const style = document.createElement('style');
        style.textContent = ':host{display:block;font-family:inherit;position:relative}' + result.css;
        const content = document.createElement('div');
        content.innerHTML = result.html || '';
        // Badge positioning belongs to the product card, not the shadow DOM.
        if (this.dataset.placement === 'badge') { style.textContent += '.pe-badge{position:static;display:inline-block}'; }
        this.shadowRoot.replaceChildren(style, content);
        this.hidden = !result.html;
        clearTimeout(this.expiryTimer);
        const delay = result.endsAt ? Date.parse(result.endsAt) - Date.now() : 0;
        if (delay > 0 && delay <= 2147483647) this.expiryTimer = setTimeout(() => { this.hidden = true; this.shadowRoot.replaceChildren(); }, delay);
      } catch { if (version === this.requestVersion) { this.shadowRoot.replaceChildren(); this.hidden = true; } }
    }
  }
  customElements.define('promotion-engine', PromotionEngine);
})();
