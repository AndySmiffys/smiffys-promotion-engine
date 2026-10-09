/* eslint-env node */
/* global globalThis */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { buildSync } = require('esbuild');
const Module = require('node:module');
const React = require('react');
const dom = new JSDOM('<div id="root"></div>', { url: 'https://app.example/app' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = require('react-dom/client');
const { createMemoryRouter, RouterProvider, Outlet } = require('react-router');
const bundled = buildSync({ entryPoints: ['app/modules/promotions/components/PromotionHeaderCheck.tsx'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', write: false });
const component = new Module(__filename); component.paths = module.paths;
component._compile(bundled.outputFiles[0].text, __filename);
const { PromotionHeaderCheck } = component.exports;
test('Header selection button checks saved data and displays selection, skipped reasons and connection', async () => {
  let request;
  const router = createMemoryRouter([{ path: '/app', id: 'routes/app', loader: () => ({ shop: 'test.myshopify.com', host: 'admin-host' }), Component: Outlet, children: [
    { index: true, Component: PromotionHeaderCheck },
    { path: 'promotion-diagnostics', action: args => {
      request = args.request;
      return { selected: { title: 'Summer offer', priority: 100 }, checks: [{ id: '1', title: 'Summer offer', priority: 100, reason: 'Selected for the header.' }, { id: '2', title: 'Members offer', priority: 200, reason: 'Requires an eligible logged-in customer.' }], connection: 'The storefront and editor agree.', error: null };
    } },
  ] }], { initialEntries: ['/app'] });
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => { root.render(React.createElement(RouterProvider, { router })); await new Promise(resolve => setTimeout(resolve, 20)); });
    const button = document.querySelector('s-button');
    assert.equal(button.textContent, 'Check header selection');
    await React.act(async () => { button.click(); await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(request.method, 'POST');
    assert.equal(new URL(request.url).searchParams.get('shop'), 'test.myshopify.com');
    assert.match(document.body.textContent, /Selected header: Summer offer \(priority 100\)/);
    assert.match(document.body.textContent, /Requires an eligible logged-in customer/);
    assert.match(document.body.textContent, /storefront and editor agree/);
  } finally { await React.act(async () => root.unmount()); router.dispose(); window.close(); }
});
