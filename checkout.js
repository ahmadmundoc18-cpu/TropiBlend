/* TropiBlend checkout: order summary, GCash payment details, screenshot upload,
   and submission to FormSubmit, which emails the order + screenshot to TropiBlend. */
(function () {
  "use strict";

  var cart = window.TropiCart;
  var cfg = cart.config;
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var form = $("#checkout-form");
  var MAX_UPLOAD = 4.5 * 1024 * 1024; // stay safely under the email service's attachment limit

  if (!cart.ready) {
    $("#checkout-closed").hidden = false;
    return;
  }

  function showState() {
    var hasItems = cart.count() > 0;
    $("#checkout-empty").hidden = hasItems;
    form.hidden = !hasItems;
  }

  /* ---------- Totals ---------- */
  function isDelivery() {
    var picked = form.querySelector('input[name="Pickup or delivery"]:checked');
    return picked && picked.value === "Delivery";
  }
  function deliveryFee() { return isDelivery() && cfg.deliveryFee > 0 ? cfg.deliveryFee : 0; }
  function total() { return cart.subtotal() + deliveryFee(); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderSummary() {
    showState();
    $("[data-summary-items]").innerHTML = cart.items().map(function (i) {
      return '<li class="summary-item" data-id="' + esc(i.id) + '">' +
        '<img src="' + esc(i.image) + '" alt="" width="56" height="56">' +
        '<div><p class="summary-name">' + esc(i.name) + '</p><p class="summary-meta">' + esc(i.size) + "</p>" +
        '<div class="qty qty-sm" role="group" aria-label="Quantity for ' + esc(i.name) + '">' +
        '<button type="button" data-qty="-1" aria-label="Remove one">−</button>' +
        '<input type="number" min="0" max="50" value="' + i.qty + '" inputmode="numeric" aria-label="Quantity">' +
        '<button type="button" data-qty="1" aria-label="Add one">+</button></div></div>' +
        '<p class="summary-price">' + esc(cart.money(i.total)) + "</p></li>";
    }).join("");
    $("[data-subtotal]").textContent = cart.money(cart.subtotal());
    var fee = deliveryFee();
    $("[data-delivery-row]").hidden = !fee;
    $("[data-delivery]").textContent = cart.money(fee);
    $("[data-delivery-note]").hidden = !(isDelivery() && !(cfg.deliveryFee > 0));
    $$("[data-total]").forEach(function (el) { el.textContent = cart.money(total()); });
  }

  $("[data-summary-items]").addEventListener("click", function (e) {
    var row = e.target.closest(".summary-item");
    var step = e.target.closest("[data-qty]");
    if (!row || !step) return;
    var current = cart.items().filter(function (i) { return i.id === row.dataset.id; })[0];
    cart.set(row.dataset.id, (current ? current.qty : 0) + Number(step.dataset.qty));
  });
  $("[data-summary-items]").addEventListener("change", function (e) {
    var row = e.target.closest(".summary-item");
    if (row && e.target.matches("input")) cart.set(row.dataset.id, e.target.value);
  });
  cart.onChange(renderSummary);

  /* ---------- Pickup / delivery ---------- */
  if (cfg.deliveryFee > 0) {
    $("[data-delivery-label]").textContent = "Flat delivery fee: " + cart.money(cfg.deliveryFee) + ".";
  }
  $$('input[name="Pickup or delivery"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      $("#delivery-fields").hidden = !isDelivery();
      renderSummary();
    });
  });

  /* ---------- GCash details ---------- */
  var qr = $("#gcash-qr");
  qr.src = cfg.gcash.qrImage;
  $("#gcash-download").href = cfg.gcash.qrImage;
  qr.addEventListener("error", function () {
    qr.hidden = true;
    $("#gcash-download").hidden = true;
    $("#gcash-qr-missing").hidden = false;
  });
  $("[data-gcash-name]").textContent = cfg.gcash.accountName;
  $("[data-gcash-number]").textContent = cfg.gcash.number;
  $("[data-copy-number]").addEventListener("click", function () {
    var btn = this;
    var digits = cfg.gcash.number.replace(/\s+/g, "");
    var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(digits).then(done, function () {});
  });

  /* ---------- Screenshot upload ---------- */
  var proof = $("#c-proof");
  var preparing = null; // promise while a large image is being resized

  function setPreview(file) {
    var box = $("#upload-box");
    if (!file) {
      box.classList.remove("has-file");
      box.querySelector(".upload-empty").hidden = false;
      box.querySelector(".upload-preview").hidden = true;
      return;
    }
    box.classList.add("has-file");
    box.querySelector(".upload-empty").hidden = true;
    box.querySelector(".upload-preview").hidden = false;
    $("#proof-preview").src = URL.createObjectURL(file);
    $("#proof-name").textContent = file.name;
  }

  // Shrink big phone photos so the email attachment goes through
  function shrink(file) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, 1800 / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file);
        }, "image/jpeg", 0.85);
      };
      img.onerror = function () { resolve(file); };
      img.src = URL.createObjectURL(file);
    });
  }

  proof.addEventListener("change", function () {
    var file = proof.files[0];
    $("#proof-error").hidden = true;
    if (!file) { setPreview(null); return; }
    if (!/^image\//.test(file.type)) {
      proof.value = "";
      setPreview(null);
      $("#proof-error").textContent = "Please upload an image (a screenshot or photo of your GCash receipt).";
      $("#proof-error").hidden = false;
      return;
    }
    setPreview(file);
    if (file.size > 2 * 1024 * 1024 && typeof DataTransfer === "function") {
      preparing = shrink(file).then(function (small) {
        if (small.size < file.size) {
          var dt = new DataTransfer();
          dt.items.add(small);
          proof.files = dt.files;
        }
        preparing = null;
      });
    }
  });

  /* ---------- Validation ---------- */
  function fieldError(input, show, message) {
    var err = input.closest(".field").querySelector(".field-error");
    if (message) err.textContent = message;
    err.hidden = !show;
    input.setAttribute("aria-invalid", String(show));
    return !show;
  }

  function validate() {
    var ok = true;
    var first = null;
    function check(input, valid) {
      var good = fieldError(input, !valid);
      if (!good && !first) first = input;
      ok = ok && good;
    }
    var name = $("#c-name"), mobile = $("#c-mobile"), email = $("#c-email");
    check(name, name.value.trim().length > 1);
    check(mobile, /^(\+?63|0)9\d{9}$/.test(mobile.value.replace(/[\s-]/g, "")));
    check(email, !email.value.trim() || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()));
    if (isDelivery()) {
      check($("#c-address"), $("#c-address").value.trim().length > 5);
      check($("#c-barangay"), $("#c-barangay").value.trim().length > 1);
    }
    var hasProof = proof.files && proof.files[0];
    if (!hasProof) {
      $("#proof-error").textContent = "Please upload a screenshot of your GCash payment.";
    } else if (proof.files[0].size > MAX_UPLOAD) {
      $("#proof-error").textContent = "That image is too large. Please upload a smaller screenshot.";
      hasProof = false;
    }
    $("#proof-error").hidden = !!hasProof;
    if (!hasProof) { ok = false; if (!first) first = proof; }
    if (first) first.focus();
    return ok;
  }

  ["#c-name", "#c-mobile", "#c-email", "#c-address", "#c-barangay"].forEach(function (sel) {
    $(sel).addEventListener("input", function () {
      if (this.getAttribute("aria-invalid") === "true") fieldError(this, false);
    });
  });

  /* ---------- Submit ---------- */
  function orderId() {
    var d = new Date();
    var ymd = String(d.getFullYear()).slice(2) + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
    return "TB-" + ymd + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (cart.count() === 0) { showState(); return; }
    if (!validate()) return;

    var button = $("#place-order");
    button.disabled = true;
    button.textContent = "Sending your order…";

    Promise.resolve(preparing).then(function () {
      var id = orderId();
      var items = cart.items();
      var lines = items.map(function (i) {
        return i.qty + " × " + i.name + " (" + i.size + ") @ " + cart.money(i.price) + " = " + cart.money(i.total);
      });
      var fee = deliveryFee();
      var feeText = isDelivery() ? (fee ? cart.money(fee) : "To be confirmed by message") : "Pickup (none)";

      $("#f-order-id").value = id;
      $("#f-items").value = lines.join("\n");
      $("#f-subtotal").value = cart.money(cart.subtotal());
      $("#f-delivery").value = feeText;
      $("#f-total").value = cart.money(total());
      $("#f-subject").value = "New TropiBlend order " + id + " · " + cart.money(total()) + " · " + $("#c-name").value.trim();
      $("#f-next").value = cfg.siteUrl.replace(/\/?$/, "/") + "order-received.html?order=" + encodeURIComponent(id);
      $("#f-autoresponse").value =
        "Hi " + $("#c-name").value.trim().split(" ")[0] + ", thank you for ordering from TropiBlend! " +
        "We received your order " + id + " (" + cart.money(total()) + ") and your GCash payment screenshot. " +
        "We'll message you at " + $("#c-mobile").value.trim() + " once your payment is confirmed.\n\n" +
        lines.join("\n") + "\n\nTropiBlend · Cagayan de Oro · 0956 447 9961";

      try {
        sessionStorage.setItem("tropiblend-last-order", JSON.stringify({
          id: id, items: items, total: total(), fee: feeText,
          method: isDelivery() ? "Delivery" : "Pickup", mobile: $("#c-mobile").value.trim()
        }));
      } catch (err) { /* thank-you page falls back to the order ID in the URL */ }

      form.action = cfg.formEndpoint;
      HTMLFormElement.prototype.submit.call(form); // native submit: sends fields + the screenshot
    });
  });

  renderSummary();
})();
