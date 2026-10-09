(() => {
  if (customElements.get('promotion-engine')) return;
  const pending = new Map();
  const queue = [];
  let active = 0;
  const drain = () => {
    while (active < 4 && queue.length) {
      const { url, resolve, reject } = queue.shift();
      active++;
      fetch(url, { credentials: 'same-origin', cache: 'no-store' })
        .then(response => { if (!response.ok) throw new Error('Promotion request failed'); return response.json(); })
        .then(resolve, reject).finally(() => { active--; drain(); });
    }
  };
  const request = url => new Promise((resolve, reject) => { queue.push({ url, resolve, reject }); drain(); });
  class PromotionEngine extends HTMLElement {
    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      const native = this.dataset.serverRendered === 'true';
      this.hidden = !native;
      this.renderedVariantId = this.dataset.variantId;
      // Declarative shadow DOM renders before this script. Theme editor section
      // replacements use innerHTML, so hydrate their unprocessed template too.
      this.hydrate = () => {
        const template = this.querySelector('template[shadowrootmode]');
        if (template && !this.shadowRoot.childNodes.length) {
          this.shadowRoot.append(template.content.cloneNode(true));
          template.remove();
        }
        this.uiReady?.();
        this.layoutCollection?.();
      };
      this.layoutCollection = () => {
        if (this.dataset.placement !== 'collection' || !this.dataset.widthMode || this.hidden) return;
        // Reset to normal section flow before measuring: theme wrappers can use
        // flex/grid alignment, so percentages and negative margins are unreliable.
        this.style.setProperty('left', '0px');
        this.style.removeProperty('width');
        if (this.dataset.widthMode !== 'full') return;
        const pageWidth = document.documentElement.clientWidth;
        if (!pageWidth) return;
        this.style.setProperty('width', `${pageWidth}px`, 'important');
        const left = this.getBoundingClientRect().left + window.scrollX;
        this.style.setProperty('left', `${-left}px`);
      };
      if (this.dataset.widthMode) window.addEventListener('resize', this.layoutCollection);
      if (window.ResizeObserver && this.dataset.widthMode) {
        this.layoutObserver = new ResizeObserver(this.layoutCollection);
        if (this.parentElement) this.layoutObserver.observe(this.parentElement);
        this.layoutObserver.observe(document.documentElement);
      }
      this.uiReady = () => { this.cleanupUI?.(); this.cleanupUI = window.SmiffysPromotionUI?.mount(this.shadowRoot); };
      window.addEventListener('promotion-ui:ready', this.uiReady);
      this.media = matchMedia('(max-width:600px)');
      this.refresh = () => this.load();
      this.visible = () => { if (!document.hidden) this.load(); };
      window.addEventListener('focus', this.refresh);
      document.addEventListener('visibilitychange', this.visible);
      this.variantChanged = event => {
        if (this.dataset.placement !== 'product' || !this.ownsEvent(event)) return;
        const id = event.detail?.variant?.id ?? event.detail?.variantId;
        if (id) { this.dataset.variantId = String(id); this.load(); }
      };
      this.media.addEventListener('change', this.refresh);
      document.addEventListener('variant:change', this.variantChanged);
      document.addEventListener('variant-change', this.variantChanged);
      this.formChanged = event => {
        if (this.dataset.placement !== 'product' || !this.ownsEvent(event)) return;
        const form = event.target.closest?.('form');
        if (!form?.querySelector('[name="id"]')) return;
        clearTimeout(this.formTimer);
        this.formTimer = setTimeout(() => {
          const input = form.querySelector('[name="id"]');
          if (this.isConnected && input?.value) { this.dataset.variantId = input.value; this.load(); }
        }, 150);
      };
      document.addEventListener('change', this.formChanged);
      this.hydrate();
      this.hydrateTimer = setTimeout(this.hydrate, 0);
      this.scheduleExpiry(this.dataset.endsAt ? Number(this.dataset.endsAt) * 1000 : 0);
      this.timer = setInterval(this.refresh, 60000);
      this.load();
    }
    ownsEvent(event) {
      const productId = event.detail?.productId ?? event.detail?.product?.id;
      if (productId) return String(productId) === this.dataset.productId;
      const card = event.target.closest?.('product-card, .product-card-wrapper, .card-wrapper');
      if (card && !card.contains(this)) return false;
      const section = this.closest('.shopify-section');
      return Boolean(section && event.target instanceof Element && section.contains(event.target));
    }
    disconnectedCallback() {
      this.cleanupUI?.();
      window.removeEventListener('promotion-ui:ready', this.uiReady);
      window.removeEventListener('focus', this.refresh);
      window.removeEventListener('resize', this.layoutCollection);
      this.layoutObserver?.disconnect();
      document.removeEventListener('visibilitychange', this.visible);
      clearInterval(this.timer);
      clearTimeout(this.formTimer);
      clearTimeout(this.expiryTimer);
      clearTimeout(this.hydrateTimer);
      this.media?.removeEventListener('change', this.refresh);
      document.removeEventListener('variant:change', this.variantChanged);
      document.removeEventListener('variant-change', this.variantChanged);
      document.removeEventListener('change', this.formChanged);
      this.requestVersion = (this.requestVersion || 0) + 1;
    }
    scheduleExpiry(end) {
      clearTimeout(this.expiryTimer);
      const expire = () => { this.hidden = true; this.cleanupUI?.(); this.shadowRoot.replaceChildren(); delete this.dataset.serverRendered; };
      const delay = end - Date.now();
      if (end && delay <= 0) expire();
      else if (delay > 0) this.expiryTimer = setTimeout(() => delay > 2147483647 ? this.scheduleExpiry(end) : expire(), Math.min(delay, 2147483647));
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
      // Fresh URLs also avoid intermediary caches, while cards loaded together
      // can still share an in-flight request.
      url.searchParams.set('_refresh', String(Math.floor(Date.now() / 1000)));
      const key = url.toString();
      try {
        if (!pending.has(key)) pending.set(key, request(key).finally(() => pending.delete(key)));
        const result = await pending.get(key);
        if (!this.isConnected || version !== this.requestVersion) return;
        // Preserve the initial HTML when Shopify and the live renderer agree.
        // This avoids rebuilding the banner and reloading its image on startup.
        if (this.dataset.serverRendered === 'true' && result.html &&
            result.renderKey && result.renderKey === this.dataset.renderKey &&
            result.promotionId === this.dataset.promotionId && result.revision === this.dataset.revision &&
            (this.dataset.placement !== 'product' || this.dataset.variantId === this.renderedVariantId)) {
          this.scheduleExpiry(result.endsAt ? Date.parse(result.endsAt) : 0);
          return;
        }
        delete this.dataset.serverRendered;
        this.dataset.promotionId = result.promotionId || '';
        this.dataset.priority = result.priority === undefined ? '' : String(result.priority);
        this.dataset.revision = result.revision || '';
        const style = document.createElement('style');
        style.textContent = ':host{display:block;font-family:inherit;position:relative;min-width:0}:host([hidden]){display:none}' + result.css;
        const content = document.createElement('div');
        content.innerHTML = result.html || '';
        // Badge positioning belongs to the product card, not the shadow DOM.
        if (this.dataset.placement === 'badge') { style.textContent += '.pe-badge{position:static;display:inline-block}'; }
        this.cleanupUI?.();
        this.shadowRoot.replaceChildren(style, content);
        this.cleanupUI = window.SmiffysPromotionUI?.mount(content);
        this.hidden = !result.html;
        this.layoutCollection();
        this.scheduleExpiry(result.endsAt ? Date.parse(result.endsAt) : 0);
      } catch { if (this.isConnected && version === this.requestVersion && this.dataset.serverRendered !== 'true') { this.cleanupUI?.(); this.shadowRoot.replaceChildren(); this.hidden = true; } }
    }
  }
  customElements.define('promotion-engine', PromotionEngine);
})();
