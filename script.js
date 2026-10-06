(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var ORDER_EMAIL = "elsie@tropiblend.com";

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  if (header) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function setNav(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
    nav.classList.toggle("is-open", open);
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setNav(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Highlight current section in nav ---------- */
  // Only in-page links (#products...), not pages like blog/ or shop.html
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('ul a[href^="#"]')) : [];
  if (navLinks.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle("is-current", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (link) {
      var section = document.querySelector(link.getAttribute("href"));
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Product filters ---------- */
  var chips = document.querySelectorAll(".chip");
  var cards = document.querySelectorAll(".product-card");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var filter = chip.dataset.filter;
      chips.forEach(function (c) {
        var active = c === chip;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", String(active));
      });
      cards.forEach(function (card) {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  });

  /* ---------- Toast ---------- */
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 3200);
  }

  /* ---------- Contact form (homepage only) ---------- */
  var form = document.getElementById("order-form");
  if (form) {
    // "Order" buttons pre-select the product in the form (when the online shop is off)
    document.querySelectorAll(".order-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var product = btn.dataset.product;
        form.querySelectorAll('input[name="product"]').forEach(function (box) {
          if (box.value === product) box.checked = true;
        });
        document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
        showToast(product.replace(/\s*\(.*\)/, "") + " added to your order form");
        setTimeout(function () {
          document.getElementById("f-name").focus({ preventScroll: true });
        }, 600);
      });
    });

    var validate = function (input, errorId) {
      var ok = input.value.trim().length > 0;
      input.setAttribute("aria-invalid", String(!ok));
      var err = document.getElementById(errorId);
      err.hidden = ok;
      if (!ok) input.setAttribute("aria-describedby", errorId);
      else input.removeAttribute("aria-describedby");
      return ok;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var phone = form.elements.phone;
      var nameOk = validate(name, "f-name-error");
      var phoneOk = validate(phone, "f-phone-error");
      if (!nameOk || !phoneOk) {
        (nameOk ? phone : name).focus();
        return;
      }

      var products = Array.prototype.slice
        .call(form.querySelectorAll('input[name="product"]:checked'))
        .map(function (box) { return "- " + box.value; });

      var lines = [
        "Hi TropiBlend!",
        "",
        "I'd like to order / ask about:",
        products.length ? products.join("\n") : "- (not specified)",
        "",
        "Quantities & message:",
        form.elements.message.value.trim() || "-",
        "",
        "Name: " + name.value.trim(),
        "Mobile: " + phone.value.trim(),
        "Area in CDO: " + (form.elements.area.value.trim() || "-")
      ];

      var subject = "TropiBlend order inquiry from " + name.value.trim();
      window.location.href = "mailto:" + ORDER_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      showToast("Opening your email app…");
    });

    ["name", "phone"].forEach(function (field) {
      form.elements[field].addEventListener("input", function () {
        if (this.getAttribute("aria-invalid") === "true") {
          validate(this, "f-" + field + "-error");
        }
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lightboxImg = lightbox.querySelector("img");
    var lastTrigger = null;

    document.querySelectorAll("[data-lightbox]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        if (typeof lightbox.showModal !== "function") {
          window.open(trigger.dataset.lightbox, "_blank");
          return;
        }
        lastTrigger = trigger;
        lightboxImg.src = trigger.dataset.lightbox;
        lightboxImg.alt = trigger.dataset.alt || "";
        lightbox.showModal();
      });
    });
    lightbox.querySelector(".lightbox-close").addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("close", function () {
      if (lastTrigger) lastTrigger.focus();
    });
  }

  /* ---------- Swap an image with a quick out/in (src, size and alt) ---------- */
  function swapImage(img, src, alt, w, h) {
    if (img.getAttribute("src") === src) return;
    img.classList.add("is-out");
    var finished = false;
    var done = function () {
      if (finished) return;
      finished = true;
      setTimeout(function () {
        img.src = src;
        if (alt != null) img.alt = alt;
        if (w) { img.width = w; img.height = h; }
        requestAnimationFrame(function () { img.classList.remove("is-out"); });
      }, 160);
    };
    var next = new Image();
    next.onload = next.onerror = done;
    next.src = src;
    if (next.complete) done();
    setTimeout(done, 700); // never leave the old photo faded out on a slow connection
  }

  /* ---------- Hero flavor switcher ---------- */
  var hero = document.querySelector(".hero[data-flavor]");
  if (hero) {
    var heroImg = hero.querySelector("[data-hero-img]");
    var tabs = Array.prototype.slice.call(hero.querySelectorAll(".flavor-tab"));
    var cart = window.TropiCart;

    // Lowest price per product, straight from shop-config.js when it's loaded
    function fromPrice(tab) {
      var p = cart && cart.config.products.filter(function (x) { return x.id === tab.dataset.product; })[0];
      if (!p || !cart.ready) return tab.dataset.from;
      return cart.money(Math.min.apply(null, p.sizes.map(function (s) { return s.price; }))).replace(/\.00$/, "");
    }

    function showFlavor(tab) {
      tabs.forEach(function (t) { t.setAttribute("aria-pressed", String(t === tab)); });
      hero.dataset.flavor = tab.dataset.flavor;
      swapImage(heroImg, tab.dataset.img, tab.dataset.alt, tab.dataset.w, tab.dataset.h);
      hero.querySelector("[data-hero-name]").textContent = tab.dataset.name;
      hero.querySelector("[data-hero-notes]").textContent = tab.dataset.notes;
      hero.querySelector("[data-hero-price]").textContent = fromPrice(tab);
      hero.querySelector("[data-hero-link]").href = "shop.html#" + tab.dataset.product;
    }
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { showFlavor(tab); });
      // warm the cache so the swap is instant
      ["pointerenter", "focus"].forEach(function (ev) {
        tab.addEventListener(ev, function () { new Image().src = tab.dataset.img; }, { once: true });
      });
    });
    var current = tabs.filter(function (t) { return t.getAttribute("aria-pressed") === "true"; })[0];
    if (current) hero.querySelector("[data-hero-price]").textContent = fromPrice(current);
  }

  /* ---------- Product cards: picking a size swaps the jar photo ---------- */
  document.addEventListener("change", function (e) {
    var input = e.target.closest("input[data-size]");
    if (!input) return;
    var card = input.closest("[data-product]");
    var img = card.querySelector("[data-size-img]");
    if (img) swapImage(img, input.dataset.img, input.dataset.alt);
    var badge = card.querySelector("[data-size-badge]");
    if (badge) {
      badge.innerHTML = input.value + "<small>ml</small>";
      badge.classList.remove("is-bumped");
      void badge.offsetWidth;
      badge.classList.add("is-bumped");
    }
  });

  /* ---------- Ticker pause button ---------- */
  var tickerToggle = document.querySelector("[data-ticker-toggle]");
  if (tickerToggle) {
    tickerToggle.addEventListener("click", function () {
      var ticker = tickerToggle.closest(".ticker");
      var paused = ticker.classList.toggle("is-paused");
      tickerToggle.setAttribute("aria-pressed", String(paused));
      tickerToggle.querySelector(".sr-only").textContent = paused ? "Play scrolling text" : "Pause scrolling text";
    });
  }

  /* ---------- Guide rail arrows ---------- */
  var rail = document.querySelector("[data-rail]");
  if (rail) {
    var prev = document.querySelector("[data-rail-prev]");
    var next = document.querySelector("[data-rail-next]");
    var step = function () { var card = rail.querySelector(".guide"); return card ? card.offsetWidth + 24 : 400; };
    var smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: smooth }); });
    next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: smooth }); });
    var updateArrows = function () {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    };
    rail.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    updateArrows();
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
