(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var ORDER_EMAIL = "elsie@tropiblend.com";

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function setNav(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
    nav.classList.toggle("is-open", open);
  }
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

  /* ---------- Highlight current section in nav ---------- */
  // Only in-page links (#products...), not pages like blog/
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('ul a[href^="#"]'));
  if ("IntersectionObserver" in window) {
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

  /* ---------- "Order" buttons pre-select the product in the form ---------- */
  var form = document.getElementById("order-form");
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

  /* ---------- Order form → pre-filled email ---------- */
  function validate(input, errorId) {
    var ok = input.value.trim().length > 0;
    input.setAttribute("aria-invalid", String(!ok));
    var err = document.getElementById(errorId);
    err.hidden = ok;
    if (!ok) input.setAttribute("aria-describedby", errorId);
    else input.removeAttribute("aria-describedby");
    return ok;
  }

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

  /* ---------- Toast ---------- */
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 3200);
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
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

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll(
    ".section-head, .product-card, .lineup-figure, .recipe, .story-inner > *, .find-inner > *, .faq-list, .contact-grid > *"
  );
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach(function (el) {
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
    // Failsafe: never leave on-screen content hidden if the observer is slow to fire
    window.addEventListener("load", function () {
      setTimeout(function () {
        revealTargets.forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
        });
      }, 1200);
    });
  }

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
