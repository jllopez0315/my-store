/* ============================================================
   THE STORE KIT · settings.js
   THE ONE FILE YOU EDIT TO MAKE THIS STORE YOURS.

   Every page reads from here: the name in the header, the look,
   the gate wording, shipping rates, payment handles, and the rules.
   Change a value, save, reload. No other file needs to change.

   Once the database is connected (the SYNC block below), the brand
   text, the look, and the three facts can also be changed from the
   admin's "Look & layout" screen. Those choices win over the values
   here; the values here are what the store shows until then, and
   whenever the database cannot be reached.

   RULES OF THE ROAD
   - Keep the quotation marks. Text goes inside them.
   - Numbers (shipping rates) have no quotation marks.
   - Every line inside the braces ends with a comma. The last one
     before a closing brace may skip it, but a trailing comma is fine.
   - true / false are written in lowercase with no quotation marks.

   Products, kits, sets, and lab report rows live in data.js.
   Page copy (the FAQ answers, the home page paragraphs) is plain
   text inside each .html file.
   ============================================================ */

const SETTINGS = {

  /* ---------- BRAND ----------
     name  = the big word in the header ("Your Brand")
     sub   = the small word beneath it between two thin rules ("Labs").
             Leave it as "" to show the name alone.
     tagline      = the home page headline.
     contactEmail = the address shown on the FAQ, Contact, Checkout,
                    and legal pages. Every "email us" link uses it.
     location     = optional, shown beside the name in the hero
                    eyebrow and the footer ("Shipped from the USA",
                    "Austin, Texas"). Leave "" to show nothing.
     THE HEADER LOGO. Leave both as "" and the header shows your name
     in letters (the wordmark). Give logo a picture and the header
     shows that instead, on every page.
     logo         = a PNG, SVG, or WebP with a transparent background,
                    either a path in store/img/ ("img/logo.png") or a
                    full web address ("https://..."). It is shown about
                    54 pixels tall, so a wide shape (around 600 by 160
                    pixels) works best. Make it light-colored: the dark
                    look's header band is your brand color.
     logoLight    = optional: a dark-colored version for the light
                    look, whose header band is ivory. Leave "" and the
                    light look uses logo too.
     THE VIAL LABEL. Every product picture is a vial photo, and the
     store prints the label onto it. Leave all of these as "" for the
     stock label: your store name in a black band, the atom mark under
     it, the product name and size below. Once the database is
     connected, the admin's Look & layout screen (Vial label section)
     changes these too, with uploads, and its choices win over the
     values here.
     labelName    = the name printed in the band. Leave "" to print
                    SETTINGS.brand.name.
     labelLogo    = a picture that replaces the atom mark: a PNG or SVG
                    with a transparent background, either a path in
                    store/img/ ("img/label-logo.png") or a full web
                    address ("https://..."). Leave "" for the atom.
     labelImage   = a complete label design (PNG or SVG) that replaces
                    the whole printed label: band, mark, everything.
                    Same kind of path or address as labelLogo. The
                    compound name and size still print on it unless
                    labelPrintsNameSize is false.
     labelBand    = the band's background color, a hex code like
                    "#1d1d1f". Leave "" for black.
     labelText    = the name's color in the band. Leave "" for white.
     labelTint    = a hex color that tints the silver label (the
                    shading shows through). Leave "" for no tint.
     labelPrintsNameSize = true prints the compound name and size on
                    top of a full label design; false leaves the
                    design alone. Only used when labelImage is set. */
  brand: {
    name: "Elite Research Labs",
    sub: "",
    tagline: "Research compounds, documented.",
    contactEmail: "info@eliteresearchlabss.com",
    location: "",
    logo: "img/logo.png",
    logoLight: "",
    labelName: "",
    labelLogo: "",
    labelImage: "",
    labelBand: "",
    labelText: "",
    labelTint: "",
    labelPrintsNameSize: true
  },

  /* ---------- LOOK ----------
     theme     = "dark" (navy and brass) or "light" (ivory and rose).
                 This is the look a new visitor sees first. The small
                 switch in the bottom corner still lets them change it.
     layout    = where the home page headline sits:
                 "left"   (words left, vials right)
                 "center" (words centered, vials beneath)
                 "right"  (vials left, words right)
     fontPair  = "classic"   (Marcellus headings, Jost text)
                 "modern"    (Jost for everything)
                 "editorial" (Cormorant Garamond headings, Jost text)
                 "custom"    (your own two Google Fonts, named below)
                 Prices and numbers always stay in Jost.
     headingFont, bodyFont = used only when fontPair is "custom".
                 Type the family name exactly as Google Fonts shows it
                 ("Playfair Display", "Inter"). Letters, digits, and
                 spaces only, 40 characters at most. The store loads
                 the two families from Google Fonts on its own. If a
                 name is left empty or misspelled, the store falls
                 back to the "classic" pair.
     THE HOME PAGE BACKGROUND. The hero (the top of the home page)
     has a moving background drawn in code: soft pools of light and a
     turning ring of fine lines. Leave both of these as "" to keep it.
     heroImage   = a still picture instead: a JPG, PNG, or WebP, a path
                   in store/img/ ("img/hero.jpg") or an https address.
                   1920 by 1080 pixels, under 400 KB, is the sweet spot
                   (WebP keeps it small).
     heroVideo   = a short silent video loop instead: an MP4 (H.264),
                   same kind of path or address. 1280 by 720 or 1920 by
                   1080, 8 to 15 seconds, no sound track, under 4 MB.
                   When both are set, heroImage is the still frame shown
                   while the video loads and on phones that save power.
                   A file inside store/img/ is served by your host for
                   free. An admin upload is served from your database's
                   storage, which has a monthly traffic allowance, so
                   keep uploaded videos small.
     restocksPage = true adds a "Restocks" page to the menu: every item
                   that is available to order (stock: false in data.js)
                   listed in one place, with the date you expect it
                   back if you give one (expected: "YYYY-MM-DD" on the
                   product row). false hides the page and its link.
     brandColor  = the main color: header band, buttons, links.
     accentColor = the thin rules, underlines, and the gold button.
                 Both are hex codes like "#1B2A41". The values below
                 are the stock colors; leave them as they are and both
                 looks keep their built-in palettes. Change either one
                 and your colors apply to BOTH looks (darker shades for
                 hovers and the footer are worked out automatically). */
  look: {
    theme: "dark",
    layout: "left",
    fontPair: "classic",
    headingFont: "",
    bodyFont: "",
    brandColor: "#1B2A41",
    accentColor: "#B08D57",
    heroImage: "",
    heroVideo: "",
    restocksPage: false
  },

  /* ---------- THREE FACTS ----------
     Three short plain statements shown in a strip under the home
     page hero, for example "Ships from Texas", "Every batch tested",
     "Orders answered by a person". Fill in all three or leave them
     all as "" to hide the strip. Nothing is added to your words. */
  facts: ["", "", ""],

  /* ---------- SYNC (filled in during Session 3) ----------
     Once your database exists, the admin gets a "Look & layout" screen
     where you change the brand text, the logo, the look, the home page
     background, the Restocks page switch, and the three facts without
     opening this file. For the store to read those choices,
     paste two values from Supabase here (Project Settings > API):
       supabaseUrl = the Project URL, like "https://abcd1234.supabase.co"
       anonKey     = the "anon public" key (safe to publish; it can
                     only read the one settings row)
     Leave both as "" and the store uses the values in this file only.
     With both filled in, the values in this file are the fallback:
     they show until the database answers, and whenever it cannot.
     localOnly = true means: read the look saved by an admin on this
     same web address, never call a database; used by the demo. Leave
     it false for a real store. */
  sync: {
    supabaseUrl: "",
    anonKey: "",
    localOnly: false
  },

  /* ---------- GATE ----------
     The research-use notice every visitor accepts once per device
     before the store opens. ageLine and termsLine are the two boxes
     they tick. In termsLine, the phrases "Terms and Conditions",
     "Research Use Only Disclaimer", and "Privacy Policy" turn into
     links to the legal page automatically. */
  gate: {
    heading: "Dedicated to Research",
    intro: "We supply research-grade compounds for lawful laboratory research. Products offered through this site are not intended for human or animal consumption, clinical use, or diagnostic purposes.",
    ageLine: "I confirm that I am 21 or older and will use these products only for lawful in-vitro laboratory research, not for human or animal consumption, clinical use, or diagnostic purposes.",
    termsLine: "I have read and accept the Terms and Conditions, the Research Use Only Disclaimer, and the Privacy Policy.",
    buttonText: "Enter the Catalog"
  },

  /* ---------- SHIPPING (US dollars, whole numbers) ----------
     flat      = standard shipping
     freeOver  = standard shipping is free once the subtotal reaches this
     expedited = 3 to 5 day option (always charged)
     overnight = next business day option (always charged)
     pickupEnabled = true shows a "local pickup" box at checkout that
                     drops shipping to $0. pickupNote is the short line
                     shown beside it ("Pickup in Austin by appointment"). */
  shipping: {
    flat: 10,
    freeOver: 250,
    expedited: 28,
    overnight: 60,
    pickupEnabled: false,
    pickupNote: ""
  },

  /* ---------- PAYMENT ----------
     methods = the ways a buyer can pay, shown on the confirmation
               screen and in the receipt email. A method with an empty
               handle is hidden, so fill in only the ones you use.
               Add more rows in the same shape if you need them.
     note    = the instruction above the handles.
     hostedCheckoutUrl = optional. If you have a hosted payment page
               (a payment link from your processor), put its full
               https:// address here and a "Pay now" button appears
               above the manual methods. The store itself never asks
               for card numbers. */
  payment: {
    methods: [
      { method: "Zelle",    handle: "559-827-7044" },
      { method: "Venmo",    handle: "" },
      { method: "Cash App", handle: "" }
    ],
    note: "In the payment note, write only your name.",
    hostedCheckoutUrl: "https://square.link/u/Pr8kIP2H"
  },

  /* ---------- RULES ----------
     requireLabReportToSell = true means a product can be added to the
     cart only when a current (non-archived) row in the COAS list in
     data.js has the same compound name. Products without one show
     "Awaiting lab report" instead of a buy button. Supplies such as
     bacteriostatic water are exempt.
     requireSignInToOrder = true means a buyer must sign in with a
     six-digit code sent to their email before the checkout form
     appears. Browsing and the cart stay open to everyone. The order
     code (_worker.js) enforces it whenever AUTH_SECRET is set in
     Cloudflare, so this switch only decides what the buyer sees. Set
     it to false only on a store that deliberately runs without
     AUTH_SECRET, to hide the sign-in step there.
     demoSignIn = true means the sign-in step accepts any six digits
     and says so on screen, with no email sent. For the demo store
     only. Never true on a real store. */
  rules: {
    requireLabReportToSell: false,
    requireSignInToOrder: true,
    demoSignIn: false
  },

  /* ---------- RESTOCKS (the Restocks page, when look.restocksPage is on) ----------
     The page lists every item that is out of stock and where its next
     batch is: reorder pending, ordered and on the way, or arrived and
     in testing. The phase and date are set on the admin's Inventory
     screen, on any row at 0. Shoppers can leave their email on the
     page and get one message when the item is back.
     shippingDays = your usual days from the order date until it lands
                    with you, as a low and a high. Shown as a range.
     testingDays  = your usual days from the day it goes to the lab
                    until the results are back.
     coming       = brand-new products that are not in the shop yet,
                    listed at the bottom of the page. One row each:
                    { name: "Example 10mg", phase: 2, date: "2026-11-01" }
                    phase 2 = ordered and on the way (date = order date)
                    phase 3 = arrived and in testing (date = lab date)
                    Remove the row the day the product goes live.
                    Leave the list empty ([]) to hide the section. */
  restock: {
    shippingDays: [10, 18],
    testingDays: [7, 10],
    coming: []
  },

  /* ---------- TERMS VERSION ----------
     The date of the Terms visitors accept at the gate and at checkout.
     Change it whenever legal.html changes. Changing it also asks
     every visitor to accept the gate again, and the legal page shows
     it as the "Last updated" date. Format: YYYY-MM-DD. */
  termsVersion: "2026-10-05"
};
