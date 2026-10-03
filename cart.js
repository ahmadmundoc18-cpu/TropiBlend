/* TropiBlend cart: stored in the browser (localStorage), shared by every page.
   Needs shop-config.js loaded first. Exposes window.TropiCart.

   Two switches, both driven by shop-config.js:
   - shop open      (every product has a price)          -> prices, cart and "Add to cart" appear
   - checkout ready (shop open + GCash name/number set)  -> customers can pay and place orders */
(function () {
  "use strict";

  var cfg = window.TROPIBLEND_SHOP || { products: [] };
  var KEY = "tropiblend-cart-v1";
  var MAX_QTY = 50;
  var byId = {};
  cfg.products.forEach(function (p) { byId[p.id] = p; });

  /* ---------- What's configured? ---------- */
  function missingPrices() {
    return cfg.products.filter(function (p) { return !(p.price > 0); }).map(function (p) { return "price for " + p.name; });
  }
  function missingCheckout() {
    var m = [];
    if (!cfg.gcash || !cfg.gcash.number) m.push("GCash number");
    if (!cfg.gcash || !cfg.gcash.accountName) m.push("GCash account name");
    if (!cfg.formEndpoint) m.push("formEndpoint");
    return m;
  }
  var open = cfg.products.length > 0 && missingPrices().length === 0;
  var checkoutReady = open && missingCheckout().length === 0;

  /* ---------- State ---------- */
  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch (e) { return {}; }
  }
  var state = read();
  var listeners = [];

  function notify() { listeners.forEach(function (fn) { fn(); }); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: cart lasts this page only */ }
    notify();
  }
  function clampQty(n) { n = Math.floor(Number(n) || 0); return Math.max(0, Math.min(MAX_QTY, n)); }

  var peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  var api = {
    ready: open,              // shop is open (prices set)
    checkoutReady: checkoutReady,
    missing: function () { return missingPrices().concat(missingCheckout()); },
    config: cfg,
    money: function (n) { return peso.format(n); },
    product: function (id) { return byId[id]; },
    items: function () {
      return Object.keys(state).filter(function (id) { return byId[id] && state[id] > 0; }).map(function (id) {
        var p = byId[id];
        return { id: id, name: p.name, size: p.size, image: p.image, price: p.price, qty: state[id], total: p.price * state[id] };
      });
    },
    qty: function (id) { return state[id] || 0; },
    count: function () { return api.items().reduce(function (n, i) { return n + i.qty; }, 0); },
    subtotal: function () { return api.items().reduce(function (n, i) { return n + i.total; }, 0); },
    add: function (id, n) { if (byId[id]) { state[id] = clampQty((state[id] || 0) + (n || 1)); save(); } },
    set: function (id, qty) { if (byId[id]) { qty = clampQty(qty); if (qty) state[id] = qty; else delete state[id]; save(); } },
    remove: function (id) { delete state[id]; save(); },
    clear: function () { state = {}; save(); },
    onChange: function (fn) { listeners.push(fn); }
  };
  window.TropiCart = api;

  // Keep tabs in sync
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { state = read(); notify(); }
  });

  if (!open) return; // no prices yet: leave every page exactly as it was

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ---------- Preview mode banner (placeholder prices / GCash) ---------- */
  if (cfg.demo) {
    var banner = document.createElement("div");
    banner.className = "demo-banner";
    banner.setAttribute("role", "note");
    banner.innerHTML = "<strong>Preview mode:</strong> prices and GCash details are placeholders. Online orders aren't live yet.";
    document.body.insertBefore(banner, document.body.firstChild);
  }

  /* ---------- Show shop-only bits, hide the "message us" fallbacks ---------- */
  $$("[data-shop-on]").forEach(function (el) { el.hidden = false; });
  $$("[data-shop-off]").forEach(function (el) { el.hidden = true; });
  $$("[data-price-for]").forEach(function (el) {
    var p = byId[el.getAttribute("data-price-for")];
    if (p) { el.textContent = api.money(p.price); el.hidden = false; }
  });

  /* ---------- Header cart button(s) + mobile cart bar ---------- */
  var cartLinks = $$("[data-cart-link]");
  var bars = $$("[data-cart-bar]");
  function renderBadges() {
    var n = api.count();
    cartLinks.forEach(function (link) {
      link.hidden = false;
      var badge = link.querySelector("[data-cart-count]");
      badge.textContent = n;
      badge.hidden = n === 0;
      link.setAttribute("aria-label", "Cart, " + n + (n === 1 ? " item" : " items"));
    });
    bars.forEach(function (bar) {
      bar.hidden = n === 0;
      bar.querySelector("[data-bar-count]").textContent = n + (n === 1 ? " item" : " items");
      bar.querySelector("[data-bar-total]").textContent = api.money(api.subtotal());
    });
  }
  api.onChange(renderBadges);
  renderBadges();

  /* ---------- Homepage product cards: price + "Add to cart" ---------- */
  $$(".order-btn[data-id]").forEach(function (btn) {
    var p = byId[btn.dataset.id];
    if (!p) return;
    btn.textContent = "Add to cart";
    btn.classList.add("add-to-cart");
    var size = btn.closest(".product-body").querySelector(".product-size");
    if (size && !btn.closest(".product-body").querySelector(".product-price")) {
      size.insertAdjacentHTML("afterend", '<p class="product-price">' + esc(api.money(p.price)) + "</p>");
    }
  });

  /* ---------- Quantity pickers next to "Add to cart" (shop page) ---------- */
  document.addEventListener("click", function (e) {
    var step = e.target.closest("[data-buy] [data-step]");
    if (!step) return;
    var input = step.closest("[data-buy]").querySelector("[data-add-qty]");
    input.value = Math.max(1, Math.min(MAX_QTY, (Number(input.value) || 1) + Number(step.dataset.step)));
  });

  /* ---------- Cart drawer (pages that include #cart-drawer) ---------- */
  var drawer = document.getElementById("cart-drawer");
  var lastTrigger = null;

  function openDrawer(trigger) {
    if (!drawer) { location.href = "checkout.html"; return; }
    lastTrigger = trigger || null;
    if (typeof drawer.showModal === "function") drawer.showModal(); else drawer.setAttribute("open", "");
  }
  function closeDrawer() { drawer.close ? drawer.close() : drawer.removeAttribute("open"); }

  // Add to cart (capture phase so it wins over the homepage's old "order form" handler)
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".add-to-cart[data-id]");
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var buy = btn.closest("[data-buy]");
    var input = buy && buy.querySelector("[data-add-qty]");
    api.add(btn.dataset.id, input ? Number(input.value) || 1 : 1);
    if (input) input.value = 1;
    if (drawer) openDrawer(btn);
  }, true);

  bars.forEach(function (bar) {
    bar.addEventListener("click", function (e) { e.preventDefault(); openDrawer(bar); });
  });

  if (!drawer) return; // e.g. blog pages: the cart button just links to checkout

  var list = drawer.querySelector("[data-cart-items]");
  var empty = drawer.querySelector("[data-cart-empty]");
  var foot = drawer.querySelector("[data-cart-foot]");
  var subtotalEl = drawer.querySelector("[data-cart-subtotal]");

  function renderDrawer() {
    var items = api.items();
    empty.hidden = items.length > 0;
    foot.hidden = items.length === 0;
    list.innerHTML = items.map(function (i) {
      return '<li class="cart-item" data-id="' + esc(i.id) + '">' +
        '<img src="' + esc(i.image) + '" alt="" width="64" height="64">' +
        '<div class="cart-item-info"><p class="cart-item-name">' + esc(i.name) + "</p>" +
        '<p class="cart-item-meta">' + esc(i.size) + " · " + esc(api.money(i.price)) + "</p>" +
        '<div class="qty" role="group" aria-label="Quantity for ' + esc(i.name) + '">' +
        '<button type="button" data-qty="-1" aria-label="Remove one">−</button>' +
        '<input type="number" min="0" max="' + MAX_QTY + '" value="' + i.qty + '" inputmode="numeric" aria-label="Quantity">' +
        '<button type="button" data-qty="1" aria-label="Add one">+</button></div></div>' +
        '<div class="cart-item-end"><p class="cart-item-total">' + esc(api.money(i.total)) + "</p>" +
        '<button type="button" class="cart-remove" data-remove>Remove</button></div></li>';
    }).join("");
    subtotalEl.textContent = api.money(api.subtotal());
  }
  api.onChange(renderDrawer);
  renderDrawer();

  drawer.addEventListener("close", function () { if (lastTrigger) lastTrigger.focus(); });
  drawer.addEventListener("click", function (e) {
    if (e.target === drawer || e.target.closest("[data-cart-close]")) { closeDrawer(); return; }
    var row = e.target.closest(".cart-item");
    if (!row) return;
    var id = row.dataset.id;
    var step = e.target.closest("[data-qty]");
    if (step) api.set(id, api.qty(id) + Number(step.dataset.qty));
    if (e.target.closest("[data-remove]")) api.remove(id);
  });
  drawer.addEventListener("change", function (e) {
    var row = e.target.closest(".cart-item");
    if (row && e.target.matches("input")) api.set(row.dataset.id, e.target.value);
  });

  cartLinks.forEach(function (link) {
    link.addEventListener("click", function (e) { e.preventDefault(); openDrawer(link); });
  });
})();
