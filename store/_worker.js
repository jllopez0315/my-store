/* Cloudflare Pages needs an ES module with "export default { fetch }".
   The kit shipped this file in CommonJS form (exports.default = ...),
   which Cloudflare rejects with "no registered event handlers". */
/* ============================================================
   THE STORE KIT · _worker.js
   The one piece of the store that runs on a server (Cloudflare's).
   It does exactly one job: when checkout.html POSTs an order to
   /api/order, this file checks it, emails the owner, emails the
   buyer a receipt, and (optionally) saves it to a database. Every
   other address is served as a plain file from this folder.

   WHY THIS FILE IS NAMED _worker.js
   Cloudflare Pages runs a file with this exact name at the root of
   the uploaded folder, whether the folder was dragged into the
   dashboard or pushed from GitHub. No build step, nothing to install.

   SET THESE IN CLOUDFLARE (Pages project > Settings > Variables and
   Secrets). Add them as Secrets, then redeploy once:
     RESEND_API_KEY   required for emails. From resend.com > API Keys.
     ORDER_TO         required. Your email address: where orders arrive.
     ORDER_FROM       optional. The sender line, for example
                      "Orders <orders@yourstore.com>". If left out,
                      "Orders <orders@YOUR-SITE-DOMAIN>" is used. Either
                      way THE DOMAIN MUST BE VERIFIED IN RESEND
                      (resend.com > Domains) or nothing sends.
     SUPABASE_URL     optional. Your Supabase project URL.
     SUPABASE_SERVICE_KEY  optional. The project's service_role key.
                      With both set, every order is also saved by
                      calling the intake_order function in that database.
     SUPABASE_ANON_KEY  optional. The project's anon (public) key, the
                      same one in settings.js. Used by /api/settings
                      (a safety copy of your look) and, together with
                      the two above, by /api/restock-notify (the
                      back-in-stock emails your admin asks for).
     AUTH_SECRET      recommended. Any 32 or more random characters
                      (a password manager's "generate password" with
                      the length set to 40 is the easy way). With it
                      set, a buyer must sign in with a six-digit email
                      code before an order is accepted (section 5).
                      Without it, orders are accepted without sign-in
                      and the checkout page hides the sign-in step.
                      Never put this value in a file.

   WHAT THE BROWSER SENDS (built in checkout.html, buildOrder):
     customer {name,email,phone,street,city,state,zip}
     items [{label,qty,each,note}], subtotal, shippingChoice,
     shippingCost, pickup, total, request, referral, note,
     attestedAt, initials, termsVersion, emailUpdates,
     storeName, contactEmail, payment {methods[],note,hostedCheckoutUrl}
   The store name and payment details ride along with the order
   because this file cannot read settings.js (that runs in the
   browser). Everything is checked and trimmed below before use.

   WHAT IT ANSWERS: always JSON, never an error page.
     { ok: true,  receipt: true|false, saved: true|false }
     { ok: false, error: "short reason" }
   ok is true when the order reached the owner by email or was saved
   to the database. receipt is true when the buyer's copy went out.

   ADDING A LOGO TO THE EMAILS: emails are plain HTML with no images,
   which keeps them out of spam folders. To add one, upload your logo
   somewhere public (your own site works) and put an
   <img src="https://.../logo.png" width="120" alt="Store name">
   line at the top of the html in ownerEmail() and buyerEmail().
   ============================================================ */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/order") {
      if (request.method === "POST") return handleOrder(request, env);
      return json({
        ok: false,
        error: "Use POST"
      }, 405);
    }
    if (url.pathname === "/api/settings") return handleSettings(request, env, ctx);
    // Back-in-stock emails, asked for by the admin (section 7)
    if (url.pathname === "/api/restock-notify") return handleRestockNotify(request, env, url.hostname);
    // Sign-in by email code (section 5)
    if (url.pathname.startsWith("/api/auth/")) return handleAuth(request, env, url.pathname.slice("/api/auth/".length));
    // Everything else: serve the files in this folder
    return env.ASSETS.fetch(request);
  }
};
/* ============================================================
   1. THE ORDER HANDLER
   ============================================================ */
async function handleOrder(request, env) {
  // Read the JSON body. A body that is not JSON gets a polite refusal.
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({
      ok: false,
      error: "The order was not readable."
    }, 400);
  }

  // Check and clean every field (section 2)
  const checked = cleanOrder(body);
  if (!checked.ok) return json({
    ok: false,
    error: checked.error
  }, 400);
  const order = checked.order;

  // Sign-in check (section 5). With AUTH_SECRET set, the order must
  // carry a valid sign-in cookie, and the email on the order is always
  // the signed-in one. If the form typed a different address, both are
  // kept so the owner's alert can show it.
  order.verifiedEmail = false;
  order.formEmail = "";
  if (env.AUTH_SECRET) {
    const signedIn = await signedInEmail(request, env.AUTH_SECRET);
    if (!signedIn) return json({
      ok: false,
      needSignIn: true,
      error: "Please sign in before you order."
    }, 401);
    if (signedIn !== order.customer.email) order.formEmail = order.customer.email;
    order.customer.email = signedIn;
    order.verifiedEmail = true;
  }

  // Stamp it with the time it arrived and a short reference for subject lines
  order.receivedAt = new Date().toISOString();
  order.ref = orderRef(order.receivedAt);

  // Email and database run side by side. One failing never stops the other.
  const host = new URL(request.url).host;
  const [emailed, saved] = await Promise.all([sendEmails(order, env, host).catch(err => {
    console.error("email step failed", err);
    return {
      owner: false,
      buyer: false
    };
  }), saveToDatabase(order, env).catch(err => {
    console.error("database step failed", err);
    return false;
  })]);
  const ok = emailed.owner || saved;
  if (!ok) console.error("Order " + order.ref + " reached nobody: check RESEND_API_KEY, ORDER_TO, and the Resend domain.");
  return json({
    ok: ok,
    receipt: !!emailed.buyer,
    saved: !!saved
  });
}

/* ============================================================
   2. CHECKING THE ORDER
   Every field is trimmed and cut to a sensible length. Numbers are
   checked to be numbers. The email address must look like one.
   Anything missing that must be present stops the order with a
   short reason the checkout page can show.
   ============================================================ */
const MAX = {
  name: 120,
  email: 200,
  phone: 40,
  street: 200,
  city: 100,
  state: 40,
  zip: 20,
  label: 160,
  itemNote: 300,
  request: 2000,
  note: 1000,
  referral: 120,
  initials: 4,
  storeName: 80,
  method: 40,
  handle: 160,
  payNote: 300,
  url: 500,
  items: 100,
  methods: 10
};
function str(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max);
}
function num(v, max) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= (max || 1000000) ? Math.round(n * 100) / 100 : null;
}
function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= MAX.email;
}
function cleanOrder(b) {
  if (!b || typeof b !== "object") return {
    ok: false,
    error: "Empty order."
  };
  const c = b.customer || {};
  const customer = {
    name: str(c.name, MAX.name),
    email: str(c.email, MAX.email).toLowerCase(),
    phone: str(c.phone, MAX.phone),
    street: str(c.street, MAX.street),
    city: str(c.city, MAX.city),
    state: str(c.state, MAX.state),
    zip: str(c.zip, MAX.zip)
  };
  if (!customer.name) return {
    ok: false,
    error: "Name is missing."
  };
  if (!isEmail(customer.email)) return {
    ok: false,
    error: "Email address does not look right."
  };
  const pickup = b.pickup === true;
  if (!pickup && !(customer.street && customer.city && customer.state && customer.zip)) {
    return {
      ok: false,
      error: "Shipping address is incomplete."
    };
  }

  // Items: up to 100 lines, each with a label, a whole-number quantity, and a price
  const rawItems = Array.isArray(b.items) ? b.items.slice(0, MAX.items) : [];
  const items = [];
  for (const it of rawItems) {
    const label = str(it && it.label, MAX.label);
    const qty = Math.round(Number(it && it.qty));
    const each = num(it && it.each);
    if (!label || !(qty >= 1 && qty <= 999) || each === null) return {
      ok: false,
      error: "An item line was not readable."
    };
    items.push({
      label,
      qty,
      each,
      note: str(it.note, MAX.itemNote)
    });
  }
  const request = str(b.request, MAX.request);
  if (items.length === 0 && !request) return {
    ok: false,
    error: "The cart is empty and there is no request."
  };
  const subtotal = num(b.subtotal),
    shippingCost = num(b.shippingCost),
    total = num(b.total);
  if (subtotal === null || shippingCost === null || total === null) return {
    ok: false,
    error: "The totals were not readable."
  };

  // Did the browser's totals add up? Not a reason to refuse (the owner
  // confirms every order by hand) but worth a flag in the owner's email.
  // A discount code comes off the items, never below $0
  const discount = Math.min(Math.max(num(b.discount) || 0, 0), subtotal);
  const discountCode = discount > 0 ? str(b.discountCode, 40).toUpperCase() : "";
  const itemsSum = items.reduce((s, it) => s + it.qty * it.each, 0);
  const totalsMatch = Math.abs(itemsSum - subtotal) < 0.01 && Math.abs(subtotal - discount + shippingCost - total) < 0.01;
  const initials = str(b.initials, MAX.initials).toUpperCase();
  if (!/^[A-Z]{1,4}$/.test(initials)) return {
    ok: false,
    error: "Initials are missing."
  };
  const attestedAt = str(b.attestedAt, 40);
  if (isNaN(Date.parse(attestedAt))) return {
    ok: false,
    error: "The attestation time was not readable."
  };

  // Payment details for the receipt, each one trimmed
  const p = b.payment && typeof b.payment === "object" ? b.payment : {};
  const methods = (Array.isArray(p.methods) ? p.methods.slice(0, MAX.methods) : []).map(m => ({
    method: str(m && m.method, MAX.method),
    handle: str(m && m.handle, MAX.handle)
  })).filter(m => m.method && m.handle);
  let hostedCheckoutUrl = str(p.hostedCheckoutUrl, MAX.url);
  if (!/^https:\/\/[^\s"'<>]+$/i.test(hostedCheckoutUrl)) hostedCheckoutUrl = "";
  const contactEmail = str(b.contactEmail, MAX.email).toLowerCase();
  return {
    ok: true,
    order: {
      customer,
      items,
      subtotal,
      discount,
      discountCode,
      shippingCost,
      total,
      totalsMatch,
      shippingChoice: str(b.shippingChoice, 80) || (pickup ? "Local pickup" : "Standard"),
      pickup,
      request,
      referral: str(b.referral, MAX.referral),
      note: str(b.note, MAX.note),
      attestedAt,
      initials,
      termsVersion: str(b.termsVersion, 20),
      emailUpdates: b.emailUpdates === true,
      storeName: str(b.storeName, MAX.storeName) || "The store",
      contactEmail: isEmail(contactEmail) ? contactEmail : "",
      payment: {
        methods,
        note: str(p.note, MAX.payNote),
        hostedCheckoutUrl
      }
    }
  };
}

/* ============================================================
   3. EMAILS (through Resend)
   Two emails: the owner's alert with every field and a small CSV
   of the shipping address for label tools, and the buyer's receipt.
   Both are sent as plain inline-styled HTML with a text version.
   ============================================================ */
async function sendEmails(order, env, host) {
  const result = {
    owner: false,
    buyer: false
  };
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set; no emails sent.");
    return result;
  }
  if (!env.ORDER_TO) {
    console.error("ORDER_TO is not set; no emails sent.");
    return result;
  }
  // The sender. The domain in it must be verified in Resend.
  const from = env.ORDER_FROM || "Orders <orders@" + host.replace(/^www\./, "") + ">";

  // Owner first. The buyer's receipt goes out whatever happened to the first.
  const [o, b] = await Promise.all([resendSend(env.RESEND_API_KEY, ownerEmail(order, from, env.ORDER_TO)).catch(err => {
    console.error("owner email failed", err);
    return false;
  }), resendSend(env.RESEND_API_KEY, buyerEmail(order, from, env.ORDER_TO)).catch(err => {
    console.error("buyer email failed", err);
    return false;
  })]);
  result.owner = o;
  result.buyer = b;
  return result;
}

// One call to Resend. Resolves true when Resend accepted the message.
async function resendSend(apiKey, message) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
  });
  if (!res.ok) {
    console.error("Resend refused a message", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

/* ---------- 3a. The owner's alert ---------- */
function ownerEmail(order, from, to) {
  const c = order.customer;
  const kind = order.items.length ? "Order" : "Request";
  const subject = kind + " " + order.ref + ": " + c.name + (order.items.length ? " · $" + money(order.total) : "");
  const address = order.pickup ? "Local pickup" : [c.street, c.city + ", " + c.state + " " + c.zip].join("\n");
  const rows = [["Reference", order.ref], ["Received", order.receivedAt], ["Name", c.name], ["Email", c.email], ["Buyer email", order.verifiedEmail ? "verified by sign-in code" : "not verified"], ["Phone", c.phone], ["Ship to", address], ["Shipping", order.shippingChoice + " · $" + money(order.shippingCost)], ["Referred by", order.referral || "(none)"], ["Note from buyer", order.note || "(none)"], ["Request", order.request || "(none)"], ["Attestation", "Initials " + order.initials + " at " + order.attestedAt + " · terms " + order.termsVersion], ["Email updates", order.emailUpdates ? "Yes" : "No, opted out"], ["Totals check", order.totalsMatch ? "Add up" : "DID NOT ADD UP: confirm the amount before shipping"]];
  // The form typed a different address than the one signed in with: show both
  if (order.formEmail) rows.splice(4, 0, ["Email typed in form", order.formEmail + " (differs from the signed-in email above)"]);
  const text = kind + " " + order.ref + "\n\n" + rows.map(r => r[0] + ": " + r[1]).join("\n") + "\n\n" + itemsText(order) + "\n" + totalsText(order);
  const html = wrap(h("h2", kind + " " + order.ref) + table(rows.map(r => [r[0], escapeHtml(r[1]).replace(/\n/g, "<br>")])) + h("h3", "Items") + itemsTable(order) + totalsTable(order));
  const message = {
    from,
    to: [to],
    reply_to: c.email,
    subject,
    html,
    text
  };
  // The CSV for label tools (one row). Skipped for pickup: nothing to ship.
  if (!order.pickup) {
    const csv = csvLine(["Name", "Street", "City", "State", "Zip", "Email", "Phone", "Order total"]) + csvLine([c.name, c.street, c.city, c.state, c.zip, c.email, c.phone, money(order.total)]);
    message.attachments = [{
      filename: "order-" + order.ref + ".csv",
      content: toBase64(csv)
    }];
  }
  return message;
}

/* ---------- 3b. The buyer's receipt ---------- */
function buyerEmail(order, from, ownerAddress) {
  const c = order.customer;
  const store = order.storeName;
  const isRequest = order.items.length === 0;
  const subject = isRequest ? store + ": your request" : store + ": your order " + order.ref;
  const pay = order.payment;
  const payLines = [];
  if (pay.hostedCheckoutUrl) payLines.push("Pay by card or Apple Pay: " + pay.hostedCheckoutUrl);
  if (pay.methods.length) {
    if (pay.note) payLines.push(pay.note);
    pay.methods.forEach(m => payLines.push(m.method + ": " + m.handle));
  }
  const ruo = "All items are for laboratory research use only. Not for human or veterinary use. All sales are final.";
  const text = isRequest ? "Thank you, " + c.name + ".\n\nWe received your request and will reply with availability and pricing.\n\nRequest:\n" + order.request + "\n\n" + ruo + "\n\n" + store : "Thank you for your order, " + c.name + ".\n\n" + "Amount due: $" + money(order.total) + "\n" + (payLines.length ? "\nHow to pay:\n" + payLines.join("\n") + "\n" : "\nWe will follow up with payment instructions.\n") + "\nYour order ships once payment is received.\n\n" + itemsText(order) + "\n" + totalsText(order) + "\n" + (order.pickup ? "Local pickup.\n" : "Ship to:\n" + c.street + "\n" + c.city + ", " + c.state + " " + c.zip + "\n") + "\nReference: " + order.ref + "\n\n" + ruo + "\n\n" + store;
  const payHtml = isRequest ? "" : h("p", "<strong style=\"font-size:22px;\">Amount due: $" + money(order.total) + "</strong>") + (pay.hostedCheckoutUrl ? "<p style=\"margin:0 0 16px;\"><a href=\"" + escapeHtml(pay.hostedCheckoutUrl) + "\" style=\"display:inline-block;background:#1B2A41;color:#EFEAE0;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;\">Pay by card or Apple Pay</a></p>" : "") + (pay.methods.length ? (pay.note ? h("p", "<strong>" + escapeHtml(pay.note) + "</strong>") : "") + table(pay.methods.map(m => [m.method, escapeHtml(m.handle)])) : pay.hostedCheckoutUrl ? "" : h("p", "We will follow up with payment instructions.")) + h("p", "Your order ships once payment is received.");
  const html = wrap(h("h2", isRequest ? "Thank you, " + escapeHtml(c.name) + "." : "Thank you for your order, " + escapeHtml(c.name) + ".") + (isRequest ? h("p", "We received your request and will reply with availability and pricing.") + h("p", "<em>" + escapeHtml(order.request).replace(/\n/g, "<br>") + "</em>") : payHtml + h("h3", "Your order") + itemsTable(order) + totalsTable(order) + h("p", order.pickup ? "Local pickup." : "Ship to:<br>" + escapeHtml(c.street) + "<br>" + escapeHtml(c.city + ", " + c.state + " " + c.zip)) + h("p", "Reference: " + order.ref)) + "<p style=\"margin:28px 0 0;padding-top:14px;border-top:1px solid #ddd;font-size:12px;color:#666;\">" + ruo + "</p>" + "<p style=\"font-size:12px;color:#666;\">" + escapeHtml(store) + (order.contactEmail ? " · " + escapeHtml(order.contactEmail) : "") + "</p>");
  // Replies go to the owner, so a buyer can answer the receipt directly
  return {
    from,
    to: [c.email],
    reply_to: ownerAddress,
    subject,
    html,
    text
  };
}

/* ---------- 3c. Small email building blocks ---------- */
function money(n) {
  return (Math.round(Number(n) * 100) / 100).toFixed(2).replace(/\.00$/, "");
}
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}
function h(tag, inner) {
  return "<" + tag + " style=\"margin:0 0 14px;\">" + inner + "</" + tag + ">";
}
function wrap(inner) {
  return "<div style=\"font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1A1F29;max-width:600px;margin:0 auto;padding:24px;\">" + inner + "</div>";
}
// Two-column table: label on the left, value on the right (value already HTML-safe)
function table(rows) {
  return "<table style=\"border-collapse:collapse;width:100%;margin:0 0 18px;\">" + rows.map(r => "<tr><td style=\"padding:6px 10px 6px 0;color:#666;vertical-align:top;white-space:nowrap;\">" + escapeHtml(r[0]) + "</td><td style=\"padding:6px 0;vertical-align:top;\">" + r[1] + "</td></tr>").join("") + "</table>";
}
function itemsTable(order) {
  if (!order.items.length) return "";
  return "<table style=\"border-collapse:collapse;width:100%;margin:0 0 10px;\">" + "<tr><th style=\"text-align:left;padding:6px 0;border-bottom:1px solid #ddd;\">Item</th><th style=\"text-align:right;padding:6px 0;border-bottom:1px solid #ddd;\">Qty</th><th style=\"text-align:right;padding:6px 0;border-bottom:1px solid #ddd;\">Each</th><th style=\"text-align:right;padding:6px 0;border-bottom:1px solid #ddd;\">Line</th></tr>" + order.items.map(it => "<tr><td style=\"padding:6px 0;border-bottom:1px solid #eee;\">" + escapeHtml(it.label) + (it.note ? "<br><span style=\"font-size:12px;color:#666;\">" + escapeHtml(it.note) + "</span>" : "") + "</td>" + "<td style=\"text-align:right;padding:6px 0;border-bottom:1px solid #eee;\">" + it.qty + "</td>" + "<td style=\"text-align:right;padding:6px 0;border-bottom:1px solid #eee;\">$" + money(it.each) + "</td>" + "<td style=\"text-align:right;padding:6px 0;border-bottom:1px solid #eee;\">$" + money(it.qty * it.each) + "</td></tr>").join("") + "</table>";
}
function totalsTable(order) {
  if (!order.items.length) return "";
  const row = (k, v, bold) => "<tr><td style=\"padding:4px 0;text-align:right;color:#666;\">" + k + "</td><td style=\"padding:4px 0 4px 16px;text-align:right;" + (bold ? "font-weight:bold;font-size:17px;" : "") + "\">" + v + "</td></tr>";
  return "<table style=\"border-collapse:collapse;margin:0 0 18px auto;\">" + row("Subtotal", "$" + money(order.subtotal)) + (order.discount > 0 ? row("Discount (" + escapeHtml(order.discountCode || "code") + ")", "-$" + money(order.discount)) : "") + row("Shipping (" + escapeHtml(order.shippingChoice) + ")", order.shippingCost === 0 ? "Free" : "$" + money(order.shippingCost)) + row("Total", "$" + money(order.total), true) + "</table>";
}
function itemsText(order) {
  if (!order.items.length) return "";
  return "Items:\n" + order.items.map(it => "  " + it.qty + " x " + it.label + " @ $" + money(it.each) + " = $" + money(it.qty * it.each) + (it.note ? "\n      (" + it.note + ")" : "")).join("\n") + "\n";
}
function totalsText(order) {
  if (!order.items.length) return "";
  return "Subtotal: $" + money(order.subtotal) + (order.discount > 0 ? "\nDiscount (" + (order.discountCode || "code") + "): -$" + money(order.discount) : "") + "\nShipping (" + order.shippingChoice + "): " + (order.shippingCost === 0 ? "Free" : "$" + money(order.shippingCost)) + "\nTotal: $" + money(order.total) + "\n";
}
// One CSV row, every cell quoted so commas in addresses are safe
function csvLine(cells) {
  return cells.map(c => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",") + "\r\n";
}
// Text to base64 (Resend wants attachments this way). Handles accents.
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach(b => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}
// A short reference such as 20261005-K7Q3: the date plus four random characters
function orderRef(iso) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  const rnd = new Uint8Array(4);
  crypto.getRandomValues(rnd);
  rnd.forEach(n => {
    tail += chars[n % chars.length];
  });
  return iso.slice(0, 10).replace(/-/g, "") + "-" + tail;
}

/* ============================================================
   4. DATABASE (optional, Supabase)
   With SUPABASE_URL and SUPABASE_SERVICE_KEY set, the cleaned order
   is handed to a database function named intake_order, which stores
   it. That function lives in the database half of the kit. A failure
   here is logged and never stops the emails.
   ============================================================ */
// The database keeps an order's "request" text as the admin's Notes. A
// discount code is added there ("Discount code DEANA15: -$15") so the admin
// shows it on the order and its reports can count it. Emails are unchanged.
function dbPayload(order) {
  if (!(order.discount > 0)) return order;
  const line = "Discount code " + (order.discountCode || "CODE") + ": -$" + money(order.discount);
  return Object.assign({}, order, { request: [order.request, line].filter(Boolean).join(" · ") });
}
async function saveToDatabase(order, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return false;
  const res = await fetch(String(env.SUPABASE_URL).replace(/\/$/, "") + "/rest/v1/rpc/intake_order", {
    method: "POST",
    headers: {
      "apikey": env.SUPABASE_SERVICE_KEY,
      "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      payload: dbPayload(order)
    })
  });
  if (!res.ok) {
    console.error("Database refused the order", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

/* ============================================================
   5. SIGN-IN BY EMAIL CODE
   Before the checkout form appears, a buyer types their email, gets a
   six-digit code by email, and types it back. No passwords, no user
   table, nothing stored anywhere: the code is worked out from the
   email address, the current ten-minute window, and AUTH_SECRET, so
   the same inputs give the same code and nothing has to be saved to
   check it later. A code is good for its own ten-minute window and
   the next one, so a code sent at :09 still works at :11.

   Routes (all answer JSON):
     POST /api/auth/send    {email}        emails the code. Always
                            answers {ok:true}; {ok:true, wait:true}
                            if the same address asked less than 45
                            seconds ago. It never says whether an
                            address is known, because none are.
     POST /api/auth/verify  {email, code}  checks the code and sets
                            two cookies for 30 days: sk_auth (the
                            signed proof, which the browser cannot
                            read) and sk_user (just the email, so the
                            page can say "Signed in as"). Answers
                            {ok:true, email} or 401 {ok:false, error}.
     POST /api/auth/logout                 clears both cookies.
     GET  /api/auth/me                     {ok:true, email} when the
                            cookie checks out, else {ok:false}. With no
                            AUTH_SECRET: {ok:false, available:false},
                            which tells the page to skip the step.

   The sk_auth cookie is: base64url(email) + "." + base64url(signature)
   where signature = HMAC-SHA256(AUTH_SECRET, email + "|v1"). Changing
   AUTH_SECRET signs every buyer out at once. Changing "v1" does too.

   The helper functions are exported at the bottom of this file so they
   can be tested with plain Node (see the kit's test notes). Cloudflare
   only uses the default export above.
   ============================================================ */
const AUTH_WINDOW_MS = 10 * 60 * 1000; // a code lives ten minutes
const AUTH_COOKIE_DAYS = 30; // how long a sign-in lasts
const AUTH_RESEND_SECONDS = 45; // one code email per address per 45 seconds

async function handleAuth(request, env, action) {
  if (action === "me") {
    if (request.method !== "GET") return json({
      ok: false,
      error: "Use GET"
    }, 405);
    if (!env.AUTH_SECRET) return json({
      ok: false,
      available: false
    });
    const email = await signedInEmail(request, env.AUTH_SECRET);
    return email ? json({
      ok: true,
      email
    }) : json({
      ok: false
    });
  }
  if (request.method !== "POST") return json({
    ok: false,
    error: "Use POST"
  }, 405);
  if (action === "logout") {
    return json({
      ok: true
    }, 200, [clearCookie("sk_auth", true), clearCookie("sk_user", false)]);
  }
  if (!env.AUTH_SECRET) return json({
    ok: false,
    error: "Sign-in is not set up on this store yet. You can order without it."
  }, 503);
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  const email = normalizeEmail(body && body.email);
  if (!isEmail(email)) return json({
    ok: false,
    error: "That email address does not look right."
  }, 400);
  if (action === "send") {
    // Light rate limit: one email per address per 45 seconds, remembered
    // in Cloudflare's cache. If the cache is unavailable, the send goes on.
    if (await recentlySent(request, email)) return json({
      ok: true,
      wait: true
    });
    const code = await codeFor(env.AUTH_SECRET, email, authWindow(Date.now()));
    const host = new URL(request.url).host;
    const from = env.ORDER_FROM || "Orders <orders@" + host.replace(/^www\./, "") + ">";
    if (!env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set; the sign-in code cannot be emailed.");
      return json({
        ok: false,
        error: "Email is not set up on this store yet."
      }, 503);
    }
    const sent = await resendSend(env.RESEND_API_KEY, codeEmail(email, code, from, body && body.storeName)).catch(err => {
      console.error("code email failed", err);
      return false;
    });
    if (!sent) return json({
      ok: false,
      error: "The code could not be emailed. Try again in a moment."
    }, 502);
    return json({
      ok: true
    });
  }
  if (action === "verify") {
    const typed = String(body && body.code == null ? "" : body.code).replace(/\D/g, "");
    const now = authWindow(Date.now());
    const current = await codeFor(env.AUTH_SECRET, email, now);
    const previous = await codeFor(env.AUTH_SECRET, email, now - 1);
    // Both comparisons always run, so a wrong code takes the same time as a right one
    const matchNow = sameString(typed, current);
    const matchPrev = sameString(typed, previous);
    if (!(matchNow || matchPrev)) {
      return json({
        ok: false,
        error: "That code did not match. Check the newest email, or send a new code."
      }, 401);
    }
    const token = await makeAuthToken(env.AUTH_SECRET, email);
    const maxAge = AUTH_COOKIE_DAYS * 24 * 60 * 60;
    return json({
      ok: true,
      email
    }, 200, ["sk_auth=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=" + maxAge, "sk_user=" + encodeURIComponent(email) + "; Secure; SameSite=Lax; Path=/; Max-Age=" + maxAge]);
  }
  return json({
    ok: false,
    error: "Unknown sign-in action."
  }, 404);
}

/* ---------- 5a. The code ----------
   codeFor(secret, email, window) is six digits: HMAC-SHA256 of
   "email|window" with the secret, first four bytes read as a number,
   kept to six digits. The window is the number of ten-minute blocks
   since 1970, so it changes every ten minutes. */
function authWindow(nowMs) {
  return Math.floor(nowMs / AUTH_WINDOW_MS);
}
function normalizeEmail(v) {
  return String(v == null ? "" : v).trim().toLowerCase().slice(0, MAX.email);
}
async function codeFor(secret, email, windowIndex) {
  const mac = await hmac(secret, normalizeEmail(email) + "|" + windowIndex);
  const n = (mac[0] << 24 | mac[1] << 16 | mac[2] << 8 | mac[3]) >>> 0;
  return String(n % 1000000).padStart(6, "0");
}

/* ---------- 5b. The cookie ---------- */
async function makeAuthToken(secret, email) {
  const e = normalizeEmail(email);
  const sig = await hmac(secret, e + "|v1");
  return b64url(new TextEncoder().encode(e)) + "." + b64url(sig);
}
// The email inside a token, or null when the token is missing, malformed, or tampered with
async function verifyAuthToken(secret, token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  let email;
  try {
    email = new TextDecoder().decode(b64urlDecode(parts[0]));
  } catch (e) {
    return null;
  }
  email = normalizeEmail(email);
  if (!isEmail(email)) return null;
  const expected = b64url(await hmac(secret, email + "|v1"));
  return sameString(parts[1], expected) ? email : null;
}
// The signed-in email on a request, read from its sk_auth cookie, or null
async function signedInEmail(request, secret) {
  const token = readCookie(request.headers.get("Cookie"), "sk_auth");
  if (!token) return null;
  return verifyAuthToken(secret, token);
}
function readCookie(header, name) {
  const pairs = String(header || "").split(";");
  for (const p of pairs) {
    const i = p.indexOf("=");
    if (i < 0) continue;
    if (p.slice(0, i).trim() === name) return p.slice(i + 1).trim();
  }
  return "";
}
function clearCookie(name, httpOnly) {
  return name + "=; " + (httpOnly ? "HttpOnly; " : "") + "Secure; SameSite=Lax; Path=/; Max-Age=0";
}

/* ---------- 5c. Rate limit through the cache ----------
   One tiny cached response per address, kept for 45 seconds. A second
   send inside that time finds it and is skipped. Any cache problem is
   ignored so a send is never blocked by the limiter itself. */
async function recentlySent(request, email) {
  try {
    const cache = caches.default;
    const mark = b64url(await sha256(email));
    const key = new Request(new URL("/api/auth/sent/" + mark, request.url).toString(), {
      method: "GET"
    });
    if (await cache.match(key)) return true;
    await cache.put(key, new Response("1", {
      headers: {
        "Cache-Control": "public, max-age=" + AUTH_RESEND_SECONDS
      }
    }));
  } catch (e) {/* no cache here (local preview): carry on */}
  return false;
}

/* ---------- 5d. The code email ---------- */
function codeEmail(email, code, from, storeName) {
  const store = str(storeName, MAX.storeName) || "The store";
  const subject = "Your sign-in code: " + code;
  const text = "Your sign-in code is " + code + "\n\nIt is valid for 10 minutes.\n\nIf you did not request this, ignore it.\n\n" + store;
  const html = wrap(h("p", "Your sign-in code is") + "<p style=\"margin:0 0 18px;font-size:34px;letter-spacing:0.18em;font-weight:bold;\">" + code + "</p>" + h("p", "It is valid for 10 minutes.") + h("p", "If you did not request this, ignore it.") + "<p style=\"font-size:12px;color:#666;\">" + escapeHtml(store) + "</p>");
  return {
    from,
    to: [email],
    subject,
    html,
    text
  };
}

/* ---------- 5e. Crypto and encoding helpers (Web Crypto, built in) ---------- */
async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(secret)), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(message)));
  return new Uint8Array(sig);
}
async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(text))));
}
function b64url(bytes) {
  let bin = "";
  bytes.forEach(b => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  const b64 = String(s).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s).length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Compare two strings without stopping at the first difference
function sameString(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length === b.length ? 0 : 1;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* ---------- A JSON reply (extra Set-Cookie headers optional) ---------- */
function json(obj, status, cookies) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  (cookies || []).forEach(c => headers.append("Set-Cookie", c));
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers
  });
}

// For the Node test harness only. Cloudflare ignores these.

/* ============================================================
   /api/settings  ·  the saved look, with a safety copy at the edge

   The admin's Look & layout screen saves the store's look into the
   owner's database (table store_settings). The store asks for it on
   every visit. This route sits in between so the look never goes
   missing:
     1. It asks the database for the saved look.
     2. When the database answers, it hands the look to the page AND
        keeps a copy in Cloudflare's cache for 30 days.
     3. When the database does not answer (a free project asleep after
        a quiet week, or any outage), it hands out the saved copy
        instead, so first-time visitors still see the chosen look.
   Needs two settings in Cloudflare Pages > Settings > Variables:
     SUPABASE_URL        the project URL (same one the order code uses)
     SUPABASE_ANON_KEY   the project's anon (public) key, the same
                         value that sits in settings.js under sync
   Without them this route answers 204 and the page falls back to
   asking the database directly, exactly as before.
   ============================================================ */
async function handleSettings(request, env, ctx) {
  const base = String(env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = String(env.SUPABASE_ANON_KEY || "");
  if (!base || !key) return new Response(null, {
    status: 204
  });
  const cache = caches.default;
  // One fixed cache address for this store's look (the request URL is already unique per store).
  const cacheKey = new Request(new URL("/api/settings", request.url).toString(), {
    method: "GET"
  });
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(base + "/rest/v1/store_settings?id=eq.1&select=settings", {
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        Accept: "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : rows;
      const settings = row && row.settings && typeof row.settings === "object" ? row.settings : {};
      const body = JSON.stringify({
        settings,
        from: "database"
      });
      // Keep a copy at the edge for 30 days; refreshed on every successful call.
      const copy = new Response(JSON.stringify({
        settings,
        from: "edge-copy"
      }), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=2592000"
        }
      });
      if (ctx && ctx.waitUntil) ctx.waitUntil(cache.put(cacheKey, copy));else await cache.put(cacheKey, copy);
      return new Response(body, {
        headers
      });
    }
    throw new Error("store_settings " + res.status);
  } catch (e) {
    // Database did not answer: serve the saved copy if there is one.
    const saved = await cache.match(cacheKey);
    if (saved) return new Response(await saved.text(), {
      headers
    });
    return new Response(null, {
      status: 204
    });
  }
}

/* ============================================================
   7. /api/restock-notify  ·  "it's back in stock" emails

   Shoppers leave their email on an out-of-stock item (the Restocks
   page, or the product page). When you type the new count into the
   admin, the admin calls this route. It:
     1. checks the caller is signed in to your admin (the admin sends
        its Supabase session token; this asks Supabase who it is)
     2. reads the waiting list (restock_notify) and the live counts
        (inventory) with the service key
     3. emails everyone whose item is back, one email per person
        listing every item of theirs that came back, through Resend
     4. stamps notified_at on those rows, so nobody is emailed twice
   Needs in Cloudflare: SUPABASE_URL, SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_KEY, RESEND_API_KEY (and ORDER_FROM / ORDER_TO as
   for order emails). Missing any, it answers with what is missing and
   the admin shows that message; the count itself is still saved.
   The admin lives on another web address, so this route answers the
   browser's CORS preflight; the session token is the only key in.
   ============================================================ */
const RESTOCK_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function restockReply(obj, status) {
  const headers = new Headers(Object.assign({
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  }, RESTOCK_CORS));
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers
  });
}
async function handleRestockNotify(request, env, host) {
  if (request.method === "OPTIONS") return new Response(null, {
    status: 204,
    headers: RESTOCK_CORS
  });
  if (request.method !== "POST") return restockReply({
    ok: false,
    error: "Use POST"
  }, 405);
  const missing = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY", "RESEND_API_KEY"].filter(k => !env[k]);
  if (missing.length) return restockReply({
    ok: false,
    error: "Not set in Cloudflare: " + missing.join(", ")
  }, 503);
  const base = String(env.SUPABASE_URL).replace(/\/+$/, "");

  // 1. Who is asking? The admin's session token must belong to a user of this project.
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return restockReply({
    ok: false,
    error: "Sign in to the admin first."
  }, 401);
  const who = await fetch(base + "/auth/v1/user", {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: auth
    }
  }).catch(() => null);
  if (!who || !who.ok) return restockReply({
    ok: false,
    error: "The admin session was not accepted."
  }, 403);
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  const storeName = String(body.storeName || "").trim().slice(0, 60) || host.replace(/^www\./, "");

  // 2. Live counts (kits read from their vial row) and the waiting list
  const service = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: "Bearer " + env.SUPABASE_SERVICE_KEY,
    "Content-Type": "application/json"
  };
  const invRes = await fetch(base + "/rest/v1/inventory?select=item_key,name,size,qty,parent_key,per_kit", {
    headers: service
  }).catch(() => null);
  if (!invRes || !invRes.ok) return restockReply({
    ok: false,
    error: "Could not read the inventory."
  }, 502);
  const inv = await invRes.json();
  const byKey = new Map(inv.map(r => [r.item_key, r]));
  const qtyOf = r => {
    if (!r.parent_key) return r.qty;
    const p = byKey.get(r.parent_key);
    return p && p.qty != null ? Math.floor(p.qty / (r.per_kit || 10)) : null;
  };
  const waitRes = await fetch(base + "/rest/v1/restock_notify?select=id,item_key,email&notified_at=is.null", {
    headers: service
  }).catch(() => null);
  if (!waitRes || !waitRes.ok) return restockReply({
    ok: false,
    error: "Could not read the waiting list."
  }, 502);
  const waiting = await waitRes.json();

  // Keep the rows whose item is back, grouped by email
  const due = waiting.filter(w => {
    const r = byKey.get(w.item_key);
    const q = r ? qtyOf(r) : null;
    return q != null && q > 0;
  });
  const byEmail = new Map();
  due.forEach(w => {
    const list = byEmail.get(w.email) || [];
    list.push(w);
    byEmail.set(w.email, list);
  });
  if (body.dry) return restockReply({
    ok: true,
    dry: true,
    emails: byEmail.size,
    rows: due.length
  });

  // 3. One email per person
  const from = env.ORDER_FROM || "Orders <orders@" + host.replace(/^www\./, "") + ">";
  const storeUrl = "https://" + host;
  let sent = 0,
    failed = 0;
  for (const [email, rows] of byEmail) {
    const items = rows.map(w => byKey.get(w.item_key)).filter(Boolean);
    const names = items.map(r => (r.name + " " + (r.size || "")).trim());
    const subject = names.length === 1 ? "Back in stock: " + names[0] : "Back in stock: " + names.length + " items you asked about";
    const list = items.map(r => '<li style="margin:0 0 8px;"><a href="' + storeUrl + "/product.html?p=" + encodeURIComponent(r.item_key) + '" style="color:#1B2A41;font-weight:600;">' + escapeHtml(r.name) + " " + escapeHtml(r.size || "") + "</a></li>").join("");
    const html = '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1A1F29;max-width:560px;">' + '<p style="margin:0 0 14px;">Good news. ' + (names.length === 1 ? "The item you asked about is" : "The items you asked about are") + " back in stock at " + escapeHtml(storeName) + ".</p>" + '<ul style="padding-left:20px;margin:0 0 18px;">' + list + "</ul>" + '<p style="margin:0 0 4px;"><a href="' + storeUrl + '/shop.html" style="color:#1B2A41;font-weight:600;">Open the shop</a></p>' + '<p style="margin:22px 0 0;font-size:12.5px;color:#6C727D;">You asked us to email you once when this came back. This is that one email. For research use only. Not for human or veterinary consumption.</p>' + "</div>";
    const text = "Good news. Back in stock at " + storeName + ":\n\n" + names.map(n => "- " + n).join("\n") + "\n\n" + storeUrl + "/shop.html\n\nYou asked us to email you once when this came back. For research use only.";
    const message = {
      from,
      to: [email],
      subject,
      html,
      text
    };
    if (env.ORDER_TO) message.reply_to = env.ORDER_TO;
    const ok = await resendSend(env.RESEND_API_KEY, message).catch(() => false);
    if (!ok) {
      failed++;
      continue;
    }
    sent++;
    // 4. Never twice
    const ids = rows.map(w => w.id).join(",");
    await fetch(base + "/rest/v1/restock_notify?id=in.(" + ids + ")", {
      method: "PATCH",
      headers: Object.assign({
        Prefer: "return=minimal"
      }, service),
      body: JSON.stringify({
        notified_at: new Date().toISOString()
      })
    }).catch(() => {});
  }
  return restockReply({
    ok: failed === 0,
    sent,
    failed
  });
}
export { authWindow, b64url, b64urlDecode, codeFor, isEmail, makeAuthToken, normalizeEmail, readCookie, sameString, verifyAuthToken };
