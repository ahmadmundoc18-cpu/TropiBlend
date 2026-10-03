/* ==========================================================================
   TropiBlend shop settings
   Fill in the prices and GCash details below, then upload the site.
   Until every price and the GCash number/name are filled in, the cart stays
   hidden and the site works exactly as before (orders by message/email).
   ========================================================================== */
window.TROPIBLEND_SHOP = {
  // PREVIEW MODE: the prices and GCash details below are PLACEHOLDERS.
  // While this is true, every page shows a "preview" banner and checkout does NOT send orders.
  // Put in your real prices, GCash name/number and QR, then change this to false.
  demo: true,

  // Prices in pesos, numbers only (e.g. 250 or 249.50). null = not set yet.
  products: [
    { id: "pineapple-salsa",      name: "Pineapple Salsa",      size: "500 ml jar",    price: 180, image: "images/tropiblend-pineapple-salsa-cagayan-de-oro.jpg" },
    { id: "mango-salsa",          name: "Mango Salsa",          size: "500 ml jar",    price: 180, image: "images/tropiblend-mango-salsa-cagayan-de-oro.jpg" },
    { id: "pickled-cucumber",     name: "Pickled Cucumber",     size: "500 ml jar",    price: 160, image: "images/tropiblend-pickled-cucumber-cagayan-de-oro.jpg" },
    { id: "pickled-onion",        name: "Pickled Onion",        size: "350 ml jar",    price: 150, image: "images/tropiblend-pickled-onion-cagayan-de-oro.jpg" },
    { id: "pesto",                name: "Pesto",                size: "300 ml jar",    price: 280, image: "images/tropiblend-pesto-cagayan-de-oro.jpg" },
    { id: "mango-salad-dressing", name: "Mango Salad Dressing", size: "350 ml bottle", price: 170, image: "images/tropiblend-mango-salad-dressing-cagayan-de-oro.jpg" }
  ],

  gcash: {
    accountName: "PLACEHOLDER NAME",          // as shown in GCash, e.g. "EL***E T."
    number: "0900 000 0000",                 // e.g. "0956 447 9961"
    qrImage: "images/payments/gcash-qr.png"   // save your GCash QR screenshot here
  },

  // Flat delivery fee in pesos for delivery orders within CDO.
  // null = don't charge online; the fee is confirmed with the customer by message.
  deliveryFee: 60,

  // Where orders are sent. FormSubmit emails every order (with the payment
  // screenshot attached) to this address. See SHOP-SETUP.md for the one-time activation.
  formEndpoint: "https://formsubmit.co/elsie@tropiblend.com",

  // The live site address, used to send customers back after checkout.
  siteUrl: "https://tropiblend.com/"
};
