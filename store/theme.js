/* ============================================================
   THE LOOK · theme.js
   Runs in the <head> of every page, before anything paints, and
   applies the "look" section of settings.js:

   0. ADMIN CHOICES: if the SYNC block in settings.js is filled in,
      the brand text, look, and three facts saved on the admin's
      "Look & layout" screen are read and laid over settings.js.
      A copy kept on the visitor's device is used first (so there is
      no flash of the old look), then the database is asked for the
      newest copy. If the database cannot be reached, the store keeps
      whatever it has. Details in section 0 and 5 below.
      With sync.localOnly set to true, the copy on the device is read
      the same way but the database is never asked (the demo uses
      this: the admin and the store share one web address).
   0b. PREVIEW: an admin can open any store page with ?preview=...
      in the address to try a look without saving it. The preview is
      kept for this browser tab only (it follows the visitor from page
      to page) and a slim ribbon at the top says so. ?preview=off
      ends it. Details in section 0b below.
   1. DARK / LIGHT: the default look comes from SETTINGS.look.theme.
      A visitor can change it with the small switch in the bottom
      left corner; their choice is remembered on their device only.
   2. FONT PAIR: adds a class to <html> (font-classic, font-modern,
      font-editorial, font-custom). styles.css picks the heading and
      body fonts from it. For font-custom, the owner's two Google
      Fonts are loaded here and written onto the --font-heading and
      --font-body variables.
   3. LAYOUT: adds layout-left / layout-center / layout-right to
      <html>. Only the home page hero uses it.
   4. COLORS: if brandColor or accentColor differ from the stock
      values, they are written onto the CSS variables that color the
      whole store. Darker and lighter shades are worked out here so
      the owner only ever types two colors.

   TO SHIP ONE LOOK ONLY: set SHOW_SWITCH below to false. The look in
   settings.js (or the admin) is then the only look.
   Nothing else in this file needs editing.
   ============================================================ */
(function () {
  var SHOW_SWITCH = true;
  var KEY = "store_theme";                   // where the visitor's dark/light choice is saved on their device
  var CACHE_KEY = "store_settings_cache";    // where the last copy of the admin's choices is kept on their device
  var PREVIEW_KEY = "store_settings_preview"; // where a preview look is kept for this tab only
  var html = document.documentElement;
  var S = (typeof SETTINGS !== "undefined" && SETTINGS) || {};
  if (!S.brand) S.brand = {};
  if (!S.look) S.look = {};
  if (!S.facts) S.facts = ["", "", ""];

  /* ---------- 0. Admin choices, laid over settings.js ----------
     The database row (and a preview) holds
       { brand: {name, sub, tagline, location, logo, logoLight,
                 labelName, labelLogo, labelImage, labelBand,
                 labelText, labelTint, labelPrintsNameSize},
         look:  {theme, layout, fontPair, brandColor, accentColor,
                 headingFont, bodyFont, heroImage, heroVideo,
                 restocksPage},
         facts: ["", "", ""] }.
     Each value is checked before it is used, so a half-filled or odd
     row can never break the page: anything missing or malformed keeps
     the value already in place.

     THE CHECKS (the admin's screen uses the same ones)
       brand.name      text, not empty after trimming
       brand.sub       text (may be empty)
       brand.tagline   text, not empty after trimming
       brand.location  text (may be empty)
       brand.labelName text (may be empty: the label prints brand.name)
       brand.logo, brand.logoLight, brand.labelLogo, brand.labelImage,
       look.heroImage, look.heroVideo
                       a picture (or, for heroVideo, a video): a path
                       inside the store starting with "img/", or an
                       https:// address, 500 characters at most, no
                       spaces or quotes. "" means none. (The demo, with
                       sync.localOnly, also accepts the browser's own
                       blob: addresses, which is how its uploads work.)
       look.restocksPage
                       true or false
       brand.labelBand, brand.labelText, brand.labelTint
                       a 6-digit hex color, or "" for the stock value
       brand.labelPrintsNameSize
                       true or false
       look.theme      "dark" or "light"
       look.layout     "left", "center", or "right"
       look.fontPair   "classic", "modern", "editorial", or "custom"
       look.headingFont, look.bodyFont
                       Google Fonts family names: letters, digits, and
                       spaces only, 1 to 40 characters. Read only when
                       fontPair is "custom"; if either is missing or
                       invalid, the pair falls back to "classic".
       look.brandColor, look.accentColor
                       a 6-digit hex color like "#1B2A41"
       facts           a list; the first three text entries are kept,
                       anything else becomes "" */
  var HEX = /^#[0-9a-f]{6}$/i;
  var FONT_NAME = /^[A-Za-z0-9 ]{1,40}$/;
  function isStr(v) { return typeof v === "string"; }
  function cleanFont(v) {
    if (!isStr(v)) return "";
    var name = v.trim().replace(/\s+/g, " ");
    return FONT_NAME.test(name) ? name : "";
  }
  // A label picture: "" (none), an img/ path, or an https:// address.
  // Returns null when the value is not usable, so it is left alone.
  var localOnly = !!(S.sync && S.sync.localOnly === true);
  function cleanImage(v) {
    if (!isStr(v)) return null;
    var ref = v.trim();
    if (ref === "") return "";
    if (ref.length > 500 || /[\s"'<>]/.test(ref)) return null;
    if (/^img\//.test(ref) || /^https:\/\//.test(ref)) return ref;
    if (localOnly && /^blob:/.test(ref)) return ref;   // the demo's in-browser uploads
    return null;
  }
  // A label color: "" (stock) or a 6-digit hex code. null = not usable.
  function cleanColor(v) {
    if (!isStr(v)) return null;
    var c = v.trim();
    return c === "" || HEX.test(c) ? c : null;
  }
  // Checks one override object field by field and lays the valid
  // parts over S. Returns the cleaned copy (used to save a preview).
  function mergeSaved(saved) {
    if (!saved || typeof saved !== "object") return null;
    var b = saved.brand || {}, l = saved.look || {}, f = saved.facts;
    var clean = { brand: {}, look: {}, facts: [] };
    if (isStr(b.name) && b.name.trim()) clean.brand.name = S.brand.name = b.name.trim();   // an empty name is ignored
    if (isStr(b.sub)) clean.brand.sub = S.brand.sub = b.sub.trim();
    if (isStr(b.tagline) && b.tagline.trim()) clean.brand.tagline = S.brand.tagline = b.tagline.trim();
    if (isStr(b.location)) clean.brand.location = S.brand.location = b.location.trim();
    // The header logo (cart.js shows it in place of the wordmark)
    ["logo", "logoLight"].forEach(function (k) {
      var v = cleanImage(b[k]);
      if (v !== null) clean.brand[k] = S.brand[k] = v;
    });
    // The vial label (see data.js, section 6)
    if (isStr(b.labelName)) clean.brand.labelName = S.brand.labelName = b.labelName.trim();
    ["labelLogo", "labelImage"].forEach(function (k) {
      var v = cleanImage(b[k]);
      if (v !== null) clean.brand[k] = S.brand[k] = v;
    });
    ["labelBand", "labelText", "labelTint"].forEach(function (k) {
      var v = cleanColor(b[k]);
      if (v !== null) clean.brand[k] = S.brand[k] = v;
    });
    if (typeof b.labelPrintsNameSize === "boolean") clean.brand.labelPrintsNameSize = S.brand.labelPrintsNameSize = b.labelPrintsNameSize;
    if (l.theme === "dark" || l.theme === "light") clean.look.theme = S.look.theme = l.theme;
    if (["left", "center", "right"].indexOf(l.layout) !== -1) clean.look.layout = S.look.layout = l.layout;
    if (l.fontPair === "custom") {
      var hf = cleanFont(l.headingFont), bf = cleanFont(l.bodyFont);
      if (hf && bf) {
        clean.look.fontPair = S.look.fontPair = "custom";
        clean.look.headingFont = S.look.headingFont = hf;
        clean.look.bodyFont = S.look.bodyFont = bf;
      } else {
        clean.look.fontPair = S.look.fontPair = "classic";   // a bad font name: back to the stock pair
      }
    } else if (["classic", "modern", "editorial"].indexOf(l.fontPair) !== -1) {
      clean.look.fontPair = S.look.fontPair = l.fontPair;
    }
    if (isStr(l.brandColor) && HEX.test(l.brandColor.trim())) clean.look.brandColor = S.look.brandColor = l.brandColor.trim();
    if (isStr(l.accentColor) && HEX.test(l.accentColor.trim())) clean.look.accentColor = S.look.accentColor = l.accentColor.trim();
    // The home page background (index.html reads these) and the Restocks page switch (cart.js adds the link)
    ["heroImage", "heroVideo"].forEach(function (k) {
      var v = cleanImage(l[k]);
      if (v !== null) clean.look[k] = S.look[k] = v;
    });
    if (typeof l.restocksPage === "boolean") clean.look.restocksPage = S.look.restocksPage = l.restocksPage;
    if (Array.isArray(f)) clean.facts = S.facts = [0, 1, 2].map(function (i) { return isStr(f[i]) ? f[i].trim() : ""; });
    else delete clean.facts;
    return clean;
  }

  var sync = S.sync || {};
  var syncOn = !!(sync.supabaseUrl && sync.anonKey);   // a database is named: read the cache, then ask it
  var readCache = syncOn || sync.localOnly === true;   // localOnly: read the cache, never ask anything
  var cached = null;   // the exact text last saved on this device, for a quick "has it changed?" check
  if (readCache) {
    try { cached = localStorage.getItem(CACHE_KEY); } catch (e) {}
    if (cached) { try { mergeSaved(JSON.parse(cached)); } catch (e) { cached = null; } }
  }

  /* ---------- 0b. Preview ----------
     ?preview=off      forgets the preview and reloads the page clean.
     ?preview=<code>   the code is the override object above, written
                       as JSON and base64url-encoded (the admin's Look
                       & layout screen builds the link). It is checked
                       field by field, kept in sessionStorage for this
                       tab, and the address bar is tidied so a reload
                       or a shared link does not carry it.
     A preview is laid over everything else: settings.js, the cache,
     and whatever the database answers later. */
  var preview = null;   // the cleaned preview object, when one is active
  (function readPreview() {
    var params = null;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    var code = params.get("preview");
    if (code === "off") {
      try { sessionStorage.removeItem(PREVIEW_KEY); } catch (e) {}
      params.delete("preview");
      var q = params.toString();
      location.replace(location.pathname + (q ? "?" + q : "") + location.hash);
      return;
    }
    if (code) {
      try {
        // base64url -> JSON text (UTF-8 safe)
        var b64 = code.replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        var bytes = atob(b64);
        var text = decodeURIComponent(Array.prototype.map.call(bytes, function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(""));
        var clean = mergeSaved(JSON.parse(text));
        if (clean) {
          preview = clean;
          try { sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(clean)); } catch (e) {}
        }
      } catch (e) { /* not a preview code: ignore it */ }
      params.delete("preview");
      var rest = params.toString();
      try { history.replaceState(null, "", location.pathname + (rest ? "?" + rest : "") + location.hash); } catch (e) {}
      return;
    }
    // No code in the address: is a preview already running in this tab?
    var kept = null;
    try { kept = sessionStorage.getItem(PREVIEW_KEY); } catch (e) {}
    if (kept) { try { preview = mergeSaved(JSON.parse(kept)); } catch (e) { preview = null; } }
  })();
  if (preview) html.classList.add("preview-on");

  /* ---------- 1. Dark / light ---------- */
  var visitorChoice = null;   // "dark" or "light" if the visitor used the switch, else null
  try { visitorChoice = localStorage.getItem(KEY); } catch (e) {}
  if (visitorChoice !== "light" && visitorChoice !== "dark") visitorChoice = null;
  var theme = "dark";

  /* ---------- 2. Custom fonts: load from Google Fonts ----------
     One <link> per family, added once. The family name is already
     checked (letters, digits, spaces), so it is safe in a web address. */
  var loadedFonts = {};
  function loadGoogleFont(family) {
    if (!family || loadedFonts[family]) return;
    loadedFonts[family] = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=" + family.replace(/ /g, "+") + ":wght@400;500;600;700&display=swap";
    link.setAttribute("data-custom-font", family);
    (document.head || html).appendChild(link);
  }

  /* ---------- 4. Brand colors: helpers ----------
     The stock palette is left alone when the settings still hold the
     stock values, so the dark look stays navy and the light look stays
     plum. Once the owner types a different color, it is applied to
     both looks: --brand and --accent directly, and the related shades
     by mixing toward black (darken) or white (lighten). */
  var STOCK_BRAND = "#1b2a41", STOCK_ACCENT = "#b08d57";

  // "#1B2A41" -> [27, 42, 65]. Returns null for anything that is not a 6-digit hex color.
  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // Move each channel part of the way toward a target (0 = black, 255 = white).
  // amount 0.3 toward black = 30% darker.
  function mix(rgb, target, amount) {
    return "rgb(" + rgb.map(function (c) { return Math.round(c + (target - c) * amount); }).join(", ") + ")";
  }

  /* ---------- Apply the whole look (1 to 4) ----------
     Called once right now, before paint, and again if the database
     answers with a newer copy of the admin's choices. */
  // Tab icon: the first letter of the store name on the brand color, drawn on the fly,
  // so a renamed or recolored store never shows the stock icon.
  function applyFavicon() {
    var name = String(S.brand.name || "Store").trim() || "Store";
    var color = /^#[0-9a-f]{6}$/i.test(String(S.look.brandColor || "")) ? S.look.brandColor : "#1B2A41";
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='" + color + "'/><text x='16' y='22' text-anchor='middle' font-family='Georgia,serif' font-size='18' fill='#ffffff'>" + name[0].toUpperCase() + "</text></svg>";
    var link = document.querySelector("link[rel='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; (document.head || document.documentElement).appendChild(link); }
    link.setAttribute("type", "image/svg+xml");
    link.href = "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function applyLook() {
    var look = S.look;

    // 1. Dark / light. The visitor's own switch choice wins over the default,
    // except while a preview names a look: the preview is what the admin
    // wants to see, so it wins over the switch.
    var DEFAULT_THEME = look.theme === "light" ? "light" : "dark";
    theme = (preview && preview.look.theme) ? preview.look.theme : (visitorChoice || DEFAULT_THEME);
    html.setAttribute("data-theme", theme);
    var box = document.querySelector(".theme-switch");
    if (box) box.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.textContent === theme)); });

    // 2. Font pair and 3. layout: classes on <html>
    var pair = ["classic", "modern", "editorial", "custom"].indexOf(look.fontPair) !== -1 ? look.fontPair : "classic";
    var headingFont = cleanFont(look.headingFont), bodyFont = cleanFont(look.bodyFont);
    if (pair === "custom" && !(headingFont && bodyFont)) pair = "classic";   // settings.js named the custom pair but not two good fonts
    var layout = ["left", "center", "right"].indexOf(look.layout) !== -1 ? look.layout : "left";
    html.classList.remove("font-classic", "font-modern", "font-editorial", "font-custom", "layout-left", "layout-center", "layout-right");
    html.classList.add("font-" + pair, "layout-" + layout);
    if (pair === "custom") {
      loadGoogleFont(headingFont);
      loadGoogleFont(bodyFont);
      // The owner's fonts first, the stock fonts behind them while they load
      html.style.setProperty("--font-heading", '"' + headingFont + "\", 'Marcellus', serif");
      html.style.setProperty("--font-body", '"' + bodyFont + "\", 'Jost', -apple-system, sans-serif");
    } else {
      html.style.removeProperty("--font-heading");
      html.style.removeProperty("--font-body");
    }

    // 4. Colors
    var brand = hexToRgb(look.brandColor), accent = hexToRgb(look.accentColor);
    var customBrand = brand && String(look.brandColor).toLowerCase() !== STOCK_BRAND;
    var customAccent = accent && String(look.accentColor).toLowerCase() !== STOCK_ACCENT;
    if (customBrand) {
      html.style.setProperty("--brand", mix(brand, 0, 0));          // as typed
      html.style.setProperty("--brand-dark", mix(brand, 0, 0.3));   // hovers, headings
      html.style.setProperty("--brand-deep", mix(brand, 0, 0.5));   // footer
      html.style.setProperty("--plate", mix(brand, 0, 0.6));        // the surface behind the vial pictures
    } else {
      ["--brand", "--brand-dark", "--brand-deep", "--plate"].forEach(function (v) { html.style.removeProperty(v); });
    }
    if (customAccent) {
      html.style.setProperty("--accent", mix(accent, 0, 0));        // as typed
      html.style.setProperty("--accent-ink", mix(accent, 0, 0.35)); // readable as small text on light
      html.style.setProperty("--accent-light", mix(accent, 255, 0.2)); // gold button hover
    } else {
      ["--accent", "--accent-ink", "--accent-light"].forEach(function (v) { html.style.removeProperty(v); });
    }
    applyFavicon();
  }
  applyLook();   // before the page paints, so there is no flash of the other look

  /* ---------- 5. Ask the database for the newest copy ----------
     Only when the SYNC block is filled in (never with localOnly). The
     request is tiny and needs no login (the anon key may read this one
     row). If the answer differs from the copy on this device, it is
     saved, the look is applied again, and the words on the page are
     filled in again (cart.js and each page listen for the
     "store-settings" event, and data.js draws the vial pictures
     again so a label change shows without a reload). An active preview is laid back over the
     answer, so it keeps winning. Any error, including a paused
     database, is ignored. */
  function refillText() {
    function go() {
      try { if (typeof applyBrandText === "function") applyBrandText(); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent("store-settings")); } catch (e) {}
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
    else go();
  }
  if (syncOn && typeof fetch === "function") {
    var url = String(sync.supabaseUrl).replace(/\/+$/, "") + "/rest/v1/store_settings?id=eq.1&select=settings";
    // Ask the store's own /api/settings first (the worker keeps a safety
    // copy of the saved look at the edge, so it answers even when the
    // database is asleep). If that route is not there (local preview,
    // a host without the worker) it answers 204 or 404 and we ask the
    // database directly, exactly as before.
    function fromDatabase() {
      return fetch(url, { headers: { apikey: sync.anonKey, Authorization: "Bearer " + sync.anonKey, Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("store_settings " + r.status); return r.json(); })
        .then(function (rows) { var row = Array.isArray(rows) ? rows[0] : rows; return row && row.settings; });
    }
    function fromWorker() {
      return fetch("/api/settings", { headers: { Accept: "application/json" } })
        .then(function (r) {
          if (r.status === 204 || r.status === 404 || !r.ok) return fromDatabase();
          return r.json().then(function (data) { return data && data.settings; });
        }, function () { return fromDatabase(); });
    }
    try {
      fromWorker()
        .then(function (saved) {
          if (!saved || typeof saved !== "object") return;
          var text = JSON.stringify(saved);
          if (text === cached) return;   // same as the copy already applied: nothing to do
          try { localStorage.setItem(CACHE_KEY, text); } catch (e) {}
          cached = text;
          mergeSaved(saved);
          if (preview) mergeSaved(preview);   // the preview stays on top
          applyLook();
          refillText();
        })
        .catch(function () { /* keep what is already showing */ });
    } catch (e) { /* very old browser without fetch promises: keep what is showing */ }
  }

  /* ---------- The preview ribbon ----------
     A slim bar pinned to the top of the window while a preview is
     active. The page is pushed down by the same height (and the sticky
     header starts below it), so nothing is covered. */
  if (preview) {
    var RIBBON_H = 34;
    var ribbonStyle = document.createElement("style");
    ribbonStyle.textContent =
      "html.preview-on body{padding-top:" + RIBBON_H + "px}" +
      "html.preview-on .sticky-stack{top:" + RIBBON_H + "px}" +
      ".preview-ribbon{position:fixed;top:0;left:0;right:0;height:" + RIBBON_H + "px;z-index:1000;display:flex;align-items:center;justify-content:center;gap:14px;" +
      "padding:0 16px;box-sizing:border-box;background:var(--surface,#FCFBF8);color:var(--ink-soft,#474D59);border-bottom:1px solid var(--line,#E2DCCF);" +
      "font:500 12px/1 Jost,-apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}" +
      ".preview-ribbon a{color:var(--brand,#1B2A41);font-weight:700;text-decoration:underline;text-underline-offset:3px}" +
      ".preview-ribbon a:hover{color:var(--brand-dark,#121C2C)}" +
      "html[data-theme=light] .preview-ribbon{background:var(--surface,#FFFFFF);color:var(--ink-soft,#5C4D55);border-color:var(--line,#ECE0DC)}";
    (document.head || html).appendChild(ribbonStyle);
    document.addEventListener("DOMContentLoaded", function () {
      var bar = document.createElement("div");
      bar.className = "preview-ribbon";
      bar.setAttribute("role", "status");
      bar.innerHTML = "<span>Preview. Nothing is saved.</span><a href=\"?preview=off\">Exit preview</a>";
      document.body.insertBefore(bar, document.body.firstChild);
    });
  }

  /* ---------- The switch in the corner ---------- */
  if (!SHOW_SWITCH) return;
  document.addEventListener("DOMContentLoaded", function () {
    var style = document.createElement("style");
    style.textContent =
      ".theme-switch{position:fixed;left:16px;bottom:16px;z-index:900;display:flex;gap:2px;padding:3px;border-radius:999px;" +
      "background:rgba(20,20,26,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.25);font-family:Jost,sans-serif}" +
      ".theme-switch button{border:0;background:none;color:rgba(255,255,255,.72);font:600 11px/1 Jost,sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:8px 13px;border-radius:999px;cursor:pointer}" +
      ".theme-switch button[aria-pressed=true]{background:#fff;color:#1d1d22}";
    document.head.appendChild(style);

    var box = document.createElement("div");
    box.className = "theme-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "View the store in dark or light");
    ["dark", "light"].forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = name;
      b.setAttribute("aria-pressed", String(name === theme));
      b.addEventListener("click", function () {
        theme = name;
        visitorChoice = name;
        html.setAttribute("data-theme", name);
        try { localStorage.setItem(KEY, name); } catch (e) {}
        box.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.textContent === name)); });
      });
      box.appendChild(b);
    });
    document.body.appendChild(box);
  });
})();
