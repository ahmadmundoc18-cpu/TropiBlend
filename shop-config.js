/* ==========================================================================
   TropiBlend shop settings
   Fill in the prices and GCash details below, then upload the site.
   Until every price and the GCash number/name are filled in, the cart stays
   hidden and the site works exactly as before (orders by message/email).
   ========================================================================== */
window.TROPIBLEND_SHOP = {
  // PREVIEW MODE: the prices are real (from the TropiBlend price list), but the GCash details below
  // are still PLACEHOLDERS. While this is true, every page shows a "preview" banner and
  // checkout does NOT send orders. Put in your real GCash name/number and QR, then change this to false.
  demo: true,

  // Every product comes in two sizes. Prices in pesos, numbers only (e.g. 250 or 249.50).
  // price: null = not set yet (the shop stays closed until every size has a price).
  // The first size listed is the one selected by default.
  products: [
    { id: "pineapple-salsa", name: "Pineapple Salsa", notes: "Sweet, tangy, fresh", sizes: [
      { ml: 500, label: "500 ml jar", price: 385, image: "images/products/pineapple-salsa-500.webp" },
      { ml: 350, label: "350 ml jar", price: 295, image: "images/products/pineapple-salsa-350.webp" } ] },
    { id: "mango-salsa", name: "Mango Salsa", notes: "Fruity, vibrant, delicious", sizes: [
      { ml: 500, label: "500 ml jar", price: 485, image: "images/products/mango-salsa-500.webp" },
      { ml: 350, label: "350 ml jar", price: 385, image: "images/products/mango-salsa-350.webp" } ] },
    { id: "pickled-cucumber", name: "Pickled Cucumber", notes: "Crisp, refreshing, flavorful", sizes: [
      { ml: 500, label: "500 ml jar", price: 355, image: "images/products/pickled-cucumber-500.webp" },
      { ml: 350, label: "350 ml jar", price: 255, image: "images/products/pickled-cucumber-350.webp" } ] },
    { id: "pickled-onion", name: "Pickled Onion", notes: "Zesty, crunchy, addictive", sizes: [
      { ml: 350, label: "350 ml jar", price: 295, image: "images/products/pickled-onion-350.webp" },
      { ml: 200, label: "200 ml jar", price: 225, image: "images/products/pickled-onion-200.webp" } ] },
    { id: "pesto", name: "Pesto", notes: "Aromatic, rich, versatile", sizes: [
      { ml: 350, label: "350 ml jar", price: 605, image: "images/products/pesto-350.webp" },
      { ml: 200, label: "200 ml jar", price: 375, image: "images/products/pesto-200.webp" } ] },
    { id: "mango-salad-dressing", name: "Mango Salad Dressing", notes: "Light, fruity, refreshing", sizes: [
      { ml: 350, label: "350 ml bottle", price: 495, image: "images/products/mango-salad-dressing-350.webp" },
      { ml: 150, label: "150 ml bottle", price: 325, image: "images/products/mango-salad-dressing-150.webp" } ] }
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
