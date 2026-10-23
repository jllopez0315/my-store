/* ============================================================
   THE STORE KIT · cart.js
   Everything the storefront shares between pages:
   - the cart (saved in the browser until checkout)
   - the cart button in the nav, with its count
   - the slide-in cart drawer and the "Added" toast
   - the product card builder used by the shop grid and the home page
   - the reveal-on-scroll animation
   - the brand text fill: wordmarks, email links, footer, page titles,
     all read from settings.js (see applyBrandText near the bottom)
   Loaded on every page right after data.js. Nothing here needs editing
   for day-to-day changes; prices and stock live in data.js, the brand
   lives in settings.js.
   ============================================================ */

/* ---------- The cart itself ---------- */
const CART_KEY = "store_cart_v1";

function cartLoad() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
}
function cartSave(c) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) { /* private mode: cart lives for this page only */ }
  cartRender();
}
// The most of one item a buyer can add. An item with a "left" count and
// nothing on order beyond that stops at what's on hand.
function cartMaxQty(item) {
  if (item && item.left && !item.moreToOrder) return item.left;
  return 99;
}
function cartAdd(id, qty) {
  const item = findCatalogItem(id);
  // awaitingReport: the lab-report rule in settings.js is on and this
  // item has no current lab report, so it cannot be bought yet.
  if (!item || item.soldOut || item.awaitingReport) return;
  const c = cartLoad();
  c[id] = Math.min(cartMaxQty(item), (c[id] || 0) + (qty || 1));
  cartSave(c);
  cartAnnounce(item);
}
function cartSetQty(id, qty) {
  const item = findCatalogItem(id);
  const c = cartLoad();
  qty = Math.max(0, Math.min(cartMaxQty(item), qty));
  if (qty === 0) delete c[id]; else c[id] = qty;
  cartSave(c);
}
function cartRemove(id) { cartSetQty(id, 0); }
function cartClear() { cartSave({}); }
function cartQty(id) { return cartLoad()[id] || 0; }

// Cart contents as [{ item, qty }], in catalog order. Items held back
// by the lab-report rule are left out, even if they were added before
// the rule was switched on.
function cartLines() {
  const c = cartLoad();
  return CATALOG.filter(it => c[it.id] > 0 && !it.awaitingReport).map(it => ({ item: it, qty: c[it.id] }));
}
function cartCount() { return cartLines().reduce((n, l) => n + l.qty, 0); }
function cartSubtotal() { return cartLines().reduce((s, l) => s + l.item.price * l.qty, 0); }

// How a line ships: all now, all in 4 weeks, or split
function lineShipNote(item, qty) {
  if (!item.stock) return "Ships in 4 weeks";
  if (item.left && qty > item.left) {
    return item.left + " ship" + (item.left === 1 ? "s" : "") + " now, " + (qty - item.left) + " in 4 weeks";
  }
  return "";
}

/* ---------- Small helpers ---------- */
function esc(s) { return String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])); }
function itemLabel(item) { return item.isStack ? item.name : item.name + " " + item.size; }
function stockBadgeHTML(item) {
  if (item.comingSoon) return '<span class="stock-badge soon">Coming soon</span>';
  if (item.soldOut) return '<span class="stock-badge soon">Out of stock</span>';
  if (item.awaitingReport) return '<span class="stock-badge soon">Awaiting lab report</span>';
  if (item.stock) {
    const text = item.left ? "In stock, only " + item.left + " left" : "In stock";
    return '<span class="stock-badge in">' + text + "</span>";
  }
  return '<span class="stock-badge soon">Ships in 4 weeks</span>';
}

/* Cart-line thumbnail: sets show a mini fan of their first three
   vials; everything else shows its own vial. The pictures are drawn
   by vialSVG() in data.js, so there are no image files to load. */
function lineThumbHTML(it) {
  if (it.isStack) {
    return '<span class="mini-fan">' + setVials(it).map(v => vialSVG(v)).join("") + "</span>";
  }
  return vialSVG(it);
}

/* ---------- Product card (shop grid + home) ---------- */
function cardMediaHTML(item) {
  const href = "product.html?p=" + item.slug;
  if (item.isStack) {
    // Three of the set's vials, fanned. They sit in one .fan-stack
    // wrapper so the glow is cast once by the whole trio, never
    // tinting one vial through another's glass.
    return '<a class="card-media plate fan" href="' + href + '" aria-label="' + esc(item.name) + '">' +
      '<span class="tag">Research set</span>' +
      '<span class="fan-stack">' + setVials(item).map(v => vialSVG(v)).join("") + "</span>" +
      "</a>";
  }
  // Kits show the vial they contain with a small "10 vials" tag;
  // supplies get a "Supply" tag. The vial itself is drawn by vialSVG().
  const tag = item.isKit ? '<span class="tag">10 vials</span>'
    : item.category === "supply" ? '<span class="tag">Supply</span>' : "";
  return '<a class="card-media plate' + (item.isKit ? ' kit' : '') + '" href="' + href + '">' + tag +
    (item.isKit ? kitSVG(item, itemLabel(item) + ", ten research vials in a case") : vialSVG(item, itemLabel(item) + " research vial")) + "</a>";
}
// The card's button: normally Add to cart; greyed out when it can't be bought
function cardButtonHTML(item) {
  if (item.comingSoon) return '<button type="button" class="btn add" disabled>Coming soon</button>';
  if (item.soldOut) return restocksOn() ? '<a class="btn add ghost" href="restock.html#' + item.id + '">Restock status</a>' : '<button type="button" class="btn add" disabled>Out of stock</button>';
  if (item.awaitingReport) return '<button type="button" class="btn add" disabled>Awaiting lab report</button>';
  return '<button type="button" class="btn add" data-add="' + item.id + '">Add to cart</button>';
}
function buildCard(item) {
  const el = document.createElement("article");
  el.className = "card reveal";
  el.dataset.id = item.id;
  const sizeText = item.isStack ? item.stack.contents.length + " compounds · " + setFreeText(item.stack) : item.size;
  el.innerHTML =
    cardMediaHTML(item) +
    '<div class="card-body">' +
      '<div class="card-title"><a href="product.html?p=' + item.slug + '">' + esc(item.name) + '</a><span class="size">' + esc(sizeText) + "</span></div>" +
      '<div class="card-meta"><span class="price">$' + item.price + (item.isStack ? ' <s class="value">$' + setValue(item.stack) + "</s>" : "") + "</span>" + stockBadgeHTML(item) + "</div>" +
      cardButtonHTML(item) +
    "</div>";
  return el;
}

/* ---------- Nav cart button, drawer, toast (injected on every page) ---------- */
const CART_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 8.5H7.5z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>';

function injectCartUI() {
  const nav = document.querySelector(".site-nav");
  if (nav && !document.getElementById("nav-cart")) {
    const a = document.createElement("a");
    a.href = "#cart";
    a.id = "nav-cart";
    a.className = "nav-cart";
    a.innerHTML = CART_ICON + "<span class=\"label\">Cart</span> <span class=\"count\" id=\"nav-cart-count\"></span>";
    a.addEventListener("click", e => { e.preventDefault(); cartOpen(); });
    nav.appendChild(a);
  }
  if (!document.getElementById("cart-drawer")) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="cart-backdrop" id="cart-backdrop"></div>' +
      '<aside class="cart-drawer" id="cart-drawer" aria-label="Your cart">' +
        '<div class="cart-head"><h2>Your cart</h2><button type="button" class="cart-close" id="cart-close" aria-label="Close cart">&times;</button></div>' +
        '<div class="cart-body" id="cart-body"></div>' +
        '<div class="cart-foot" id="cart-foot"></div>' +
      "</aside>" +
      '<div class="toast" id="toast"></div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    document.getElementById("cart-backdrop").addEventListener("click", cartClose);
    document.getElementById("cart-close").addEventListener("click", cartClose);
    document.addEventListener("keydown", e => { if (e.key === "Escape") cartClose(); });
    // Quantity and remove buttons inside the drawer
    document.getElementById("cart-body").addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.d) cartSetQty(id, cartQty(id) + Number(btn.dataset.d));
      if (btn.dataset.remove) cartRemove(id);
    });
  }
  // Any "Add to cart" button anywhere on the page
  document.body.addEventListener("click", e => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const qtyEl = btn.dataset.qtyFrom ? document.getElementById(btn.dataset.qtyFrom) : null;
    cartAdd(btn.dataset.add, qtyEl ? Number(qtyEl.textContent) || 1 : 1);
    btn.classList.add("added");
    const was = btn.textContent;
    btn.textContent = "Added";
    setTimeout(() => { btn.classList.remove("added"); btn.textContent = was; }, 1400);
  });
}

function cartOpen() { document.body.classList.add("cart-open"); }
function cartClose() { document.body.classList.remove("cart-open"); }

let toastTimer = null;
function cartAnnounce(item) {
  const nav = document.getElementById("nav-cart");
  if (nav) { nav.classList.remove("bump"); void nav.offsetWidth; nav.classList.add("bump"); }
  // Wide screens: slide the drawer in. Phones: a toast, so the page stays put.
  if (window.matchMedia("(min-width: 760px)").matches) {
    cartOpen();
  } else {
    const t = document.getElementById("toast");
    t.innerHTML = "Added " + esc(itemLabel(item)) + ' <a href="#cart" id="toast-view">View cart</a>';
    document.getElementById("toast-view").addEventListener("click", e => { e.preventDefault(); cartOpen(); t.classList.remove("show"); });
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }
}

// Redraw the nav count and the drawer contents
function cartRender() {
  const countEl = document.getElementById("nav-cart-count");
  const n = cartCount();
  if (countEl) countEl.textContent = n > 0 ? n : "";

  const body = document.getElementById("cart-body");
  const foot = document.getElementById("cart-foot");
  if (!body) return;
  const lines = cartLines();
  if (lines.length === 0) {
    body.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    foot.innerHTML = '<a class="btn ghost" href="shop.html">Browse the collection</a>';
    return;
  }
  body.innerHTML = lines.map(l => {
    const it = l.item;
    const thumb = lineThumbHTML(it);
    const note = lineShipNote(it, l.qty);
    return '<div class="cart-line">' +
      '<div class="thumb">' + thumb + "</div>" +
      '<div class="info"><div class="name">' + esc(it.name) + "</div>" +
        '<div class="sub">' + (it.isStack ? "Research set" : esc(it.size)) + " · $" + it.price + " each</div>" +
        (note ? '<div class="note">' + note + "</div>" : "") +
        '<div class="qty" style="margin-top:8px;">' +
          '<button type="button" data-id="' + it.id + '" data-d="-1" aria-label="Remove one">&minus;</button>' +
          '<span class="count">' + l.qty + "</span>" +
          '<button type="button" data-id="' + it.id + '" data-d="1" aria-label="Add one">+</button>' +
        "</div>" +
      "</div>" +
      '<div class="right"><span class="line-price">$' + (it.price * l.qty) + "</span>" +
        '<button type="button" class="remove" data-id="' + it.id + '" data-remove="1">Remove</button></div>' +
    "</div>";
  }).join("");

  const sub = cartSubtotal();
  const away = FREE_SHIPPING_OVER - sub;
  const pct = Math.min(100, Math.round(sub / FREE_SHIPPING_OVER * 100));
  foot.innerHTML =
    '<div class="row"><span>Subtotal</span><strong>$' + sub + "</strong></div>" +
    '<div class="ship-progress">' + (away > 0 ? "Add $" + away + " more for free standard shipping." : "You have free standard shipping.") +
      '<div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
    '<a class="btn" href="checkout.html">Checkout</a>' +
    '<a class="continue" href="shop.html">Continue browsing</a>';
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal:not(.in)");
  if (!("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("in")); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach(el => io.observe(el));
}
// Stagger: give each child of a container a growing delay
function staggerChildren(container, stepMs) {
  Array.from(container.children).forEach((el, i) => el.style.setProperty("--d", (i % 8) * (stepMs || 70) + "ms"));
}

/* ---------- Brand text fill (from settings.js) ----------
   The HTML pages hold no brand name, email address, or payment
   names of their own. On every page load this fills them in from
   SETTINGS, so settings.js is the only place they are ever typed.

   What it looks for:
   .wm-name / .wm-sub b   the wordmark in the header
   .js-brand              the full brand name ("Your Brand Labs")
   .js-brand-place        brand name plus the location, if one is set
   a.js-email             an email link (text and mailto: address)
   .js-pay-methods        "Zelle, Venmo, and Cash App" (methods with a handle)
   .js-free-over          the free-shipping threshold, "$250"
   .js-ship-flat          the standard shipping rate, "$12"
   .js-site-host          this site's address, for the legal page
   .js-terms-date         the terms version date, written out
   <title>                the page name, prefixed with the brand

   It runs once as soon as this file loads, and again whenever
   theme.js fetches a newer copy of the admin's "Look & layout"
   choices (see the SYNC block in settings.js), so it is written to be
   safe to run more than once. */
const PAGE_TITLE = document.title.trim();   // the page name as written in the HTML ("Shop"), kept so the brand is added only once
function brandFull() {
  return (SETTINGS.brand.name + " " + (SETTINGS.brand.sub || "")).trim();
}
// "Zelle, Venmo, and Cash App" from the payment methods that have a handle
function payMethodsText() {
  const names = (SETTINGS.payment.methods || []).filter(m => m.handle && String(m.handle).trim()).map(m => m.method);
  if (names.length === 0) return "the payment methods shown at checkout";
  if (names.length === 1) return names[0];
  if (names.length === 2) return names[0] + " and " + names[1];
  return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
}
// "2026-10-05" -> "October 5, 2026"
function longDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return String(iso || "");
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[Number(m[2]) - 1] + " " + Number(m[3]) + ", " + m[1];
}
function applyBrandText() {
  const b = SETTINGS.brand;
  const full = brandFull();
  const place = full + (b.location ? " · " + b.location : "");
  const setAll = (sel, fn) => document.querySelectorAll(sel).forEach(fn);
  setAll(".wm-name", el => { el.textContent = b.name.toUpperCase(); });
  setAll(".wm-sub", el => {
    const word = el.querySelector("b");
    if (word) word.textContent = (b.sub || "").toUpperCase();
    el.style.display = b.sub ? "" : "none";
  });
  setAll(".wordmark[aria-label]", el => el.setAttribute("aria-label", full + ", home"));
  applyHeaderLogo(full);
  applyRestocksLink();
  setAll(".js-brand", el => { el.textContent = full; });
  setAll(".js-brand-place", el => { el.textContent = place; });
  setAll("a.js-email", el => { el.textContent = b.contactEmail; el.href = "mailto:" + b.contactEmail; });
  setAll(".js-pay-methods", el => { el.textContent = payMethodsText(); });
  setAll(".js-free-over", el => { el.textContent = "$" + SETTINGS.shipping.freeOver; });
  setAll(".js-ship-flat", el => { el.textContent = "$" + SETTINGS.shipping.flat; });
  setAll(".js-site-host", el => { el.textContent = location.hostname || "this website"; });
  setAll(".js-terms-date", el => { el.textContent = longDate(SETTINGS.termsVersion); });
  // Page title: "<Brand> · Shop". The home page is just the brand.
  document.title = (PAGE_TITLE && PAGE_TITLE !== "Home") ? full + " · " + PAGE_TITLE : full;
  // Link-preview tags, for browsers that read them after load
  setAll('meta[property="og:site_name"], meta[property="og:title"]', el => el.setAttribute("content", full));
}

/* ---------- Restocks: the page switch, the "email me when it's back" form ----------
   look.restocksPage (settings.js or the admin) turns the Restocks page
   on. Out-of-stock cards then link to it. The form below sits on the
   product page and on the Restocks page; it calls restock_subscribe in
   your database (SYNC block in settings.js) and the admin shows how
   many are waiting. The demo keeps the list in this browser instead. */
function restocksOn() { return !!(SETTINGS.look && SETTINGS.look.restocksPage); }
function notifyFormHTML(item, prompt) {
  return '<div class="notify">' +
    '<label for="notify-' + item.id + '">' + (prompt || "Want an email when it's back?") + "</label>" +
    '<form class="notify-form" data-item="' + item.id + '">' +
      '<input type="email" id="notify-' + item.id + '" name="email" placeholder="your@email.com" required autocomplete="email">' +
      '<button type="submit" class="btn">Notify me</button>' +
    "</form></div>";
}
async function restockSubscribe(itemId, email) {
  const sync = SETTINGS.sync || {};
  if (sync.localOnly === true) {
    // The demo: remembered in this browser, where the demo admin reads it
    try {
      const list = JSON.parse(localStorage.getItem("store_demo_waiting") || "{}");
      list[itemId] = Array.from(new Set((list[itemId] || []).concat([email.toLowerCase()])));
      localStorage.setItem("store_demo_waiting", JSON.stringify(list));
    } catch (e) {}
    return true;
  }
  if (!(sync.supabaseUrl && sync.anonKey)) return false;
  const res = await fetch(String(sync.supabaseUrl).replace(/\/+$/, "") + "/rest/v1/rpc/restock_subscribe", {
    method: "POST",
    headers: { apikey: sync.anonKey, Authorization: "Bearer " + sync.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ p_item_key: itemId, p_email: email })
  });
  return res.ok && (await res.json()) === true;
}
document.addEventListener("submit", async e => {
  const form = e.target.closest("form.notify-form");
  if (!form) return;
  e.preventDefault();
  const email = form.email.value.trim();
  if (!email) return;
  const btn = form.querySelector("button");
  btn.disabled = true; btn.textContent = "Saving";
  try {
    if (!(await restockSubscribe(form.dataset.item, email))) throw new Error("declined");
    form.outerHTML = '<p class="notify-thanks">You\'re on the list. One email when it\'s back, nothing else.</p>';
  } catch (err) {
    btn.disabled = false; btn.textContent = "Notify me";
    form.insertAdjacentHTML("afterend", '<p class="notify-thanks error">That didn\'t go through. Check the email and try again.</p>');
    setTimeout(() => form.parentNode && form.parentNode.querySelectorAll(".notify-thanks.error").forEach(n => n.remove()), 4000);
  }
});

/* ---------- Live stock: redraw badges when fresh counts arrive ----------
   data.js fetches the counts and fires "store-stock". Cards already on
   the page get their badge and button swapped in place; the cart drawer
   redraws so its ship notes match. */
function refreshStockUI() {
  document.querySelectorAll(".card[data-id]").forEach(el => {
    const it = findCatalogItem(el.dataset.id);
    if (!it) return;
    const badge = el.querySelector(".stock-badge");
    if (badge) badge.outerHTML = stockBadgeHTML(it);
    const btn = el.querySelector(".btn.add");
    if (btn) btn.outerHTML = cardButtonHTML(it);
  });
  cartRender();
}
document.addEventListener("store-stock", refreshStockUI);

/* ---------- Header logo ----------
   brand.logo (settings.js, or the admin's Look & layout screen) is a
   picture that replaces the letters in the header. Two <img> tags go
   inside the wordmark: one for the dark look, one for the light look
   (brand.logoLight, or the same picture when there is none). styles.css
   shows whichever matches the look on screen, so the visitor's switch
   in the corner swaps them with no script. With no logo, the letters
   show as before. */
function applyHeaderLogo(full) {
  const b = SETTINGS.brand;
  const logo = String(b.logo || "").trim();
  const light = String(b.logoLight || "").trim() || logo;
  document.querySelectorAll(".wordmark").forEach(wm => {
    let dark = wm.querySelector(".wm-logo.for-dark"), lite = wm.querySelector(".wm-logo.for-light");
    if (!logo) {
      wm.classList.remove("has-logo");
      if (dark) dark.remove();
      if (lite) lite.remove();
      return;
    }
    if (!dark) { dark = document.createElement("img"); dark.className = "wm-logo for-dark"; wm.insertBefore(dark, wm.firstChild); }
    if (!lite) { lite = document.createElement("img"); lite.className = "wm-logo for-light"; wm.insertBefore(lite, dark.nextSibling); }
    if (dark.getAttribute("src") !== logo) dark.src = logo;
    if (lite.getAttribute("src") !== light) lite.src = light;
    dark.alt = lite.alt = full;
    wm.classList.add("has-logo");
  });
}

/* ---------- The Restocks page link ----------
   look.restocksPage (settings.js, or the admin) adds "Restocks" to the
   menu on every page and to the footer links, pointing at restock.html.
   Off, the link is removed again. The page itself is always in the
   folder; with the switch off it sends visitors to the shop. */
function applyRestocksLink() {
  const on = !!(SETTINGS.look && SETTINGS.look.restocksPage);
  const here = (location.pathname.split("/").pop() || "index.html");
  const place = (box, afterHref) => {
    if (!box) return;
    let a = box.querySelector('a[href="restock.html"]');
    if (!on) { if (a) a.remove(); return; }
    if (!a) {
      a = document.createElement("a");
      a.href = "restock.html";
      a.textContent = "Restocks";
      const after = box.querySelector('a[href="' + afterHref + '"]');
      if (after) after.insertAdjacentElement("afterend", a); else box.insertBefore(a, box.firstChild);
    }
    a.classList.toggle("active", here === "restock.html");
  };
  place(document.querySelector(".site-nav"), "shop.html");
  place(document.querySelector(".site-footer .foot-links"), "lab.html");
}

/* ---------- Boot ---------- */
applyBrandText();
document.addEventListener("DOMContentLoaded", () => {
  injectCartUI();
  cartRender();
  initReveal();
});


/* ---------- Logo band: compact on scroll ----------
   Shrinks the wordmark after a short scroll so the sticky stack takes up
   less of the screen. The stacking itself is pure CSS now (see
   .sticky-stack in styles.css), so there are no heights to measure. */
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;
  // Two different thresholds on purpose. Shrinking the header makes the
  // page shorter, which nudges scrollY back down; a single threshold
  // would flip the header back and forth (a visible shake). Compact
  // after 120px, and only expand again once nearly back at the top.
  function onScroll() {
    var y = window.scrollY;
    if (y > 120) header.classList.add("compact");
    else if (y < 10) header.classList.remove("compact");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
