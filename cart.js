/* TropiBlend cart: stored in the browser (localStorage), shared by every page.
   Needs shop-config.js loaded first. Exposes window.TropiCart. */
(function () {
  "use strict";

  var cfg = window.TROPIBLEND_SHOP || { products: [] };
  var KEY = "tropiblend-cart-v1";
  var MAX_QTY = 50;
  var byId = {};
  cfg.products.forEach(function (p) { byId[p.id] = p; });

  /* ---------- Is the shop set up? ---------- */
  function missing() {
    var m = [];
    cfg.products.forEach(function (p) { if (!(p.price > 0)) m.push("price for " + p.name); });
    if (!cfg.gcash || !cfg.gcash.number) m.push("GCash number");
    if (!cfg.gcash || !cfg.gcash.accountName) m.push("GCash account name");
    if (!cfg.formEndpoint) m.push("formEndpoint");
    return m;
  }
  var ready = missing().length === 0;

  /* ---------- State ---------- */
  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch (e) { return {}; }
  }
  var state = read();
  var listeners = [];

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: cart lasts this page only */ }
    listeners.forEach(function (fn) { fn(); });
  }
  function clampQty(n) { n = Math.floor(Number(n) || 0); return Math.max(0, Math.min(MAX_QTY, n)); }

  var peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  var api = {
    ready: ready,
    missing: missing,
    config: cfg,
    money: function (n) { return peso.format(n); },
    product: function (id) { return byId[id]; },
    items: function () {
      return Object.keys(state).filter(function (id) { return byId[id] && state[id] > 0; }).map(function (id) {
        var p = byId[id];
        return { id: id, name: p.name, size: p.size, image: p.image, price: p.price, qty: state[id], total: p.price * state[id] };
      });
    },
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
    if (e.key === KEY) { state = read(); listeners.forEach(function (fn) { fn(); }); }
  });

  if (!ready) return; // shop not configured: leave the page exactly as it was

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Header cart button(s) ---------- */
  var cartLinks = document.querySelectorAll("[data-cart-link]");
  function renderBadges() {
    var n = api.count();
    cartLinks.forEach(function (link) {
      link.hidden = false;
      var badge = link.querySelector("[data-cart-count]");
      badge.textContent = n;
      badge.hidden = n === 0;
      link.setAttribute("aria-label", "Cart, " + n + (n === 1 ? " item" : " items"));
    });
  }
  api.onChange(renderBadges);
  renderBadges();

  /* ---------- Product cards: prices + add to cart ---------- */
  document.querySelectorAll(".order-btn[data-id]").forEach(function (btn) {
    var p = byId[btn.dataset.id];
    if (!p) return;
    btn.textContent = "Add to cart";
    btn.classList.add("add-to-cart");
    var size = btn.closest(".product-body").querySelector(".product-size");
    if (size && !size.querySelector(".product-price")) {
      size.insertAdjacentHTML("afterend", '<p class="product-price">' + esc(api.money(p.price)) + "</p>");
    }
  });

  /* ---------- Cart drawer (pages that include #cart-drawer) ---------- */
  var drawer = document.getElementById("cart-drawer");
  if (!drawer) return;
  var list = drawer.querySelector("[data-cart-items]");
  var empty = drawer.querySelector("[data-cart-empty]");
  var foot = drawer.querySelector("[data-cart-foot]");
  var subtotalEl = drawer.querySelector("[data-cart-subtotal]");
  var lastTrigger = null;

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

  function openDrawer(trigger) {
    lastTrigger = trigger || null;
    if (typeof drawer.showModal === "function") drawer.showModal(); else drawer.setAttribute("open", "");
  }
  function closeDrawer() { drawer.close ? drawer.close() : drawer.removeAttribute("open"); }

  drawer.addEventListener("close", function () { if (lastTrigger) lastTrigger.focus(); });
  drawer.addEventListener("click", function (e) {
    if (e.target === drawer || e.target.closest("[data-cart-close]")) { closeDrawer(); return; }
    var row = e.target.closest(".cart-item");
    if (!row) return;
    var id = row.dataset.id;
    var step = e.target.closest("[data-qty]");
    if (step) api.set(id, (api.items().filter(function (i) { return i.id === id; })[0] || { qty: 0 }).qty + Number(step.dataset.qty));
    if (e.target.closest("[data-remove]")) api.remove(id);
  });
  drawer.addEventListener("change", function (e) {
    var row = e.target.closest(".cart-item");
    if (row && e.target.matches("input")) api.set(row.dataset.id, e.target.value);
  });

  cartLinks.forEach(function (link) {
    link.addEventListener("click", function (e) { e.preventDefault(); openDrawer(link); });
  });

  // Add-to-cart buttons open the drawer so people see it worked
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".add-to-cart[data-id]");
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    api.add(btn.dataset.id, 1);
    openDrawer(btn);
  }, true);
})();
