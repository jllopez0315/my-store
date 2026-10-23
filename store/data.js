/* ============================================================
   THE STORE KIT · data.js
   ONE file, all the catalog data. Every page reads from here.

   WHAT LIVES IN THIS FILE
   1. SHORT NAMES - the settings this file borrows from settings.js
   2. PRODUCTS    - single vials and supplies (edit stock/prices here)
   3. KITS        - 10-vial kits
   4. STACKS      - research sets (bundles with free product)
   5. COAS        - lab report rows (one per published certificate)
   6. VIAL ART    - the product picture, drawn in code (no photo files)

   HOW TO EDIT (the three usual jobs)
   - Mark something in/out of stock: flip "stock: true" or "stock: false"
   - Change a price: edit the "price:" number
   - Add a lab report row: add to the COAS list in section 5

   The prices below are placeholders. Replace them with your own.
   The sample catalog uses neutral research codes (GLP-RT3, SMX-7) in
   place of compound names; name your own products however you choose.
   Brand name, shipping rates, payment handles, and the terms version
   live in settings.js, not here.
   ============================================================ */

/* ---------- 1. SHORT NAMES (read from settings.js) ----------
   settings.js loads before this file on every page. The lines below
   give the older short names other files still use. Nothing to edit
   here: change the values in settings.js. */
const BRAND_NAME = SETTINGS.brand.name;
const BRAND_SUB = SETTINGS.brand.sub;
const CONTACT_EMAIL = SETTINGS.brand.contactEmail;
const SHIPPING_FLAT = SETTINGS.shipping.flat;
const FREE_SHIPPING_OVER = SETTINGS.shipping.freeOver;
const EXPEDITED_COST = SETTINGS.shipping.expedited;
const OVERNIGHT_COST = SETTINGS.shipping.overnight;
const TERMS_VERSION = SETTINGS.termsVersion;

/* ---------- 2. PRODUCTS · single vials and supplies ----------
   stock: true  = in stock, ships same day before 1pm EST
   stock: false = available to order, ships in 4 weeks

   OPTIONAL: left: N marks an in-stock item as low ("only N left")
   and stops the + button at N.

   Once the database is connected, the counts on the admin's Inventory
   screen win over these flags (section 7 at the bottom of this file).

   slug: the product page address (product.html?p=slug).

   When one compound comes in several sizes, the FIRST size listed
   is the one the research sets use.
   ---------------------------------------------------------------- */
const PRODUCTS = [
  { name: "RT30",                        size: "30mg",   price: 150, stock: true,  slug: "rt30" },
  { name: "Tesamorelin",                 size: "10mg",   price: 60,  stock: true,  slug: "tesamorelin" },
  { name: "MOTS-C",                      size: "10mg",   price: 60,  stock: true,  slug: "mots-c" },
  { name: "Wolverine (BPC-157/TB-500)",  size: "20mg",   price: 80,  stock: true,  slug: "wolverine", sortAs: "BPC-157/TB-500" },
  { name: "GHK-Cu",                      size: "100mg",  price: 60,  stock: true,  slug: "ghk-cu" },
  { name: "KLOW",                        size: "80mg",   price: 80,  stock: false, slug: "klow" },
  { name: "NAD+",                        size: "1000mg", price: 80,  stock: true,  slug: "nad" },
  { name: "GLOW",                        size: "70mg",   price: 80,  stock: false, slug: "glow" },
  { name: "PT-141",                      size: "10mg",   price: 60,  stock: true,  slug: "pt-141" },
  { name: "SS-31",                       size: "50mg",   price: 100, stock: false, slug: "ss-31" },
  { name: "Semax",                       size: "10mg",   price: 60,  stock: true,  slug: "semax" },
  { name: "Selank",                      size: "10mg",   price: 60,  stock: false, slug: "selank" },
  { name: "CJC-1295 + Ipamorelin",       size: "10mg",   price: 80,  stock: true,  slug: "cjc-1295-ipamorelin" },
  { name: "Kisspeptin",                  size: "10mg",   price: 60,  stock: true,  slug: "kisspeptin" },
  { name: "KPV",                         size: "10mg",   price: 60,  stock: true,  slug: "kpv" },
  { name: "Ipamorelin",                  size: "10mg",   price: 60,  stock: true,  slug: "ipamorelin" },
  { name: "5-Amino-1MQ",                 size: "50mg",   price: 80,  stock: true,  slug: "5-amino-1mq" },
  { name: "Cagrilintide",                size: "10mg",   price: 90,  stock: true,  slug: "cagrilintide" },
  { name: "Glutathione",                 size: "1500mg", price: 100, stock: true,  slug: "glutathione" },
  { name: "Lipo-C + B12",                size: "216mg",  price: 60,  stock: false, slug: "lipo-c-b12" },
  // HIDDEN: Bacteriostatic Water. Remove the // marks on the lines below to show it again.
  // // supply: true files it under the Supplies filter.
  // // liquid: true draws the vial filled with liquid instead of powder.
  // { name: "Bacteriostatic Water", size: "10mL",   price: 15,  stock: true,  slug: "bac-water", supply: true, liquid: true,
  //   // storage: shows as a Storage row on the product page (supplies only)
  //   storage: "Store at room temperature (15–25°C). Do not freeze." },
];

/* ---------- 3. KITS · 10 vials of one compound, priced at 8 ----------
   RULE: kit price = 8 x the single vial price. Change both together. */
const KITS = [
  // also: "supply" lists the water kit under the Supplies filter too
  // HIDDEN: { name: "Bacteriostatic Water", size: "10mL kit · 10 vials", price: 120, stock: true, also: "supply", liquid: true },
  { name: "RT30",                        size: "30mg kit · 10 vials",    price: 1200, stock: true },
  { name: "Tesamorelin",                 size: "10mg kit · 10 vials",    price: 480,  stock: true },
  { name: "MOTS-C",                      size: "10mg kit · 10 vials",    price: 480,  stock: true },
  { name: "Wolverine (BPC-157/TB-500)",  size: "20mg kit · 10 vials",    price: 640,  stock: true, sortAs: "BPC-157/TB-500" },
  { name: "GHK-Cu",                      size: "100mg kit · 10 vials",   price: 480,  stock: true },
  { name: "KLOW",                        size: "80mg kit · 10 vials",    price: 640,  stock: false },
  { name: "NAD+",                        size: "1000mg kit · 10 vials",  price: 640,  stock: true },
  { name: "GLOW",                        size: "70mg kit · 10 vials",    price: 640,  stock: false },
  { name: "PT-141",                      size: "10mg kit · 10 vials",    price: 480,  stock: true },
  { name: "SS-31",                       size: "50mg kit · 10 vials",    price: 800,  stock: false },
  { name: "Semax",                       size: "10mg kit · 10 vials",    price: 480,  stock: true },
  { name: "Selank",                      size: "10mg kit · 10 vials",    price: 480,  stock: false },
  { name: "CJC-1295 + Ipamorelin",       size: "10mg kit · 10 vials",    price: 640,  stock: true },
  { name: "Kisspeptin",                  size: "10mg kit · 10 vials",    price: 480,  stock: true },
  { name: "KPV",                         size: "10mg kit · 10 vials",    price: 480,  stock: true },
  { name: "Ipamorelin",                  size: "10mg kit · 10 vials",    price: 480,  stock: true },
  { name: "5-Amino-1MQ",                 size: "50mg kit · 10 vials",    price: 640,  stock: true },
  { name: "Cagrilintide",                size: "10mg kit · 10 vials",    price: 720,  stock: true },
  { name: "Glutathione",                 size: "1500mg kit · 10 vials",  price: 800,  stock: true },
  { name: "Lipo-C + B12",                size: "216mg kit · 10 vials",   price: 480,  stock: false },
];

/* ---------- 3b. BLURBS · one-line descriptions ----------
   One short, claims-free line per product name. Shown under the size
   on product pages. Only add a line when it says MORE than the subtitle
   already does (supplies whose contents are already the subtitle have
   no line on purpose). Kits use the same line
   as their vial because the key is the product name. Describe what the
   item IS (class, length, form); never what it does. ---------- */
const BLURBS = {
  "Tesamorelin":                 "Synthetic 44-amino-acid analogue of growth hormone-releasing hormone. Lyophilized powder.",
  "MOTS-C":                      "Mitochondrial-derived 16-amino-acid peptide, synthetic. Lyophilized powder.",
  "Wolverine (BPC-157/TB-500)":  "Research blend of BPC-157 and TB-500 (a thymosin beta-4 fragment) in one vial. Lyophilized powder.",
  "GHK-Cu":                      "Copper complex of the tripeptide glycyl-L-histidyl-L-lysine. Lyophilized powder.",
  "KLOW":                        "Research blend of KPV, GHK-Cu, BPC-157, and TB-500 in one vial. Lyophilized powder.",
  "NAD+":                        "Nicotinamide adenine dinucleotide, the oxidized form of the coenzyme. Lyophilized powder.",
  "GLOW":                        "Research blend of GHK-Cu, BPC-157, and TB-500 in one vial. Lyophilized powder.",
  "SS-31":                       "Synthetic tetrapeptide (D-Arg-Dmt-Lys-Phe). Lyophilized powder.",
  "Semax":                       "Synthetic heptapeptide (7 amino acids) derived from an ACTH fragment. Lyophilized powder.",
  "Selank":                      "Synthetic heptapeptide (7 amino acids), an analogue of the tuftsin sequence. Lyophilized powder.",
  "Glutathione":                 "Reduced tripeptide of glutamate, cysteine, and glycine. Lyophilized powder.",
  "Cagrilintide":                "Synthetic long-acting amylin analogue, 37 amino acids with a lipidated side chain. Lyophilized powder.",
  "KPV":                         "Synthetic tripeptide (Lys-Pro-Val), the C-terminal fragment of alpha-MSH. Lyophilized powder.",
  "Bacteriostatic Water":        "Sterile water with 0.9% benzyl alcohol as a preservative, for reconstituting lyophilized research compounds.",
};
// Research sets share one line
// Sets build their line from what's actually free in that set:
// "3 free vials and two free 10mL vials of bacteriostatic water"
function setFreeText(stack) {
  const n = stack.free.length;
  return (n === 1 ? "1 free vial" : n + " free vials") + " and 2 free 10mL vials of bacteriostatic water";
}
// What everything in the set would cost bought separately: the listed
// vials, the free vials, and the two free BAC waters.
function setValue(stack) {
  const water = PRODUCTS.find(p => p.name === "Bacteriostatic Water" && p.size === "10mL");
  const freeVials = stack.free.reduce((sum, name) => { const p = findProduct(name); return sum + (p ? p.price : 0); }, 0);
  return stackPrice(stack) + freeVials + (water ? water.price * 2 : 0);
}
function setBlurb(stack) {
  return "A curated set of research compounds with " + setFreeText(stack) + " included. Total value: $" + setValue(stack) + ".";
}

/* ---------- 4. STACKS · research sets ----------
   Names describe the compound family inside the set, never an outcome
   (research-use wording). " Set" is added
   automatically, so "Copper Peptide" shows as "Copper Peptide Set".
   Price = the listed vials at single-vial prices (automatic).
   "free" names the vial(s) that ship free on top. Every set also
   includes two free 10mL BAC water vials automatically. Names must match a
   PRODUCTS name exactly. ---------- */
const STACKS = [];
/* Sample sets from the kit, hidden until you choose your own (they named
   sample products that are no longer in the catalog):
const STACKS = [
  {
    name: "GLP-1 & Amylin",
    free: ["NAD+"],
    contents: [
      ["GLP-RT3", 3],
      ["AMY-CG1", 2],
      ["MOTS-C", 2],
    ],
  },
  {
    name: "BPC-157 & TB-500",
    free: ["GHK-Cu"],
    contents: [
      ["Wolverine (BPC157+TB500)", 4],
      ["KPV", 2],
      ["GHK-Cu", 2],
    ],
  },
  {
    name: "Mitochondrial Peptide",
    free: ["MOTS-C"],
    contents: [
      ["NAD+", 4],
      ["MOTS-C", 3],
      ["EPI-4", 4],
    ],
  },
  {
    name: "Copper Peptide",
    free: ["GHK-Cu"],
    contents: [
      ["GHK-Cu", 3],
      ["GSH-15", 2],
      ["KPV", 3],
    ],
  },
  {
    name: "Neuropeptide",
    free: ["DSIP"],
    contents: [
      ["SLK-7", 4],
      ["SMX-7", 3],
      ["DSIP", 3],
    ],
  },
  {
    name: "Complete Research",
    free: ["DSIP", "EPI-4", "OXT-9"],
    contents: [
      ["GLP-RT3", 3],
      ["GLP-TZ2", 2],
      ["Wolverine (BPC157+TB500)", 3],
      ["NAD+", 3],
      ["GHK-Cu", 2],
      ["MOTS-C", 2],
      ["KPV", 1],
    ],
  },
];
*/

/* ---------- 5. COAS · lab report rows ----------
   Every row shown on the Lab Results page, the home page preview,
   and the "Verify a lot number" box. One row per published
   certificate of analysis.

   THE THREE ROWS BELOW ARE PLACEHOLDERS so the pages have something
   to show. Replace them with your own reports before you open.

   compound = the product name, spelled exactly as in PRODUCTS above
              (the lab-report rule in settings.js matches on it)
   size     = the vial size the report covers
   batch    = the batch or lot number printed on the report. This is
              what buyers type into the verify box on the lab page.
   analyzed = the date the lab analyzed the sample (YYYY-MM-DD)
   purity   = Batch Avg Purity (HPLC) from the report, as a number
   lab      = the laboratory that issued the report
   file     = where the saved report lives, for example
              "coa/glp-rt3-2026-08.pdf" (put PDFs in a coa folder
              next to this file). When a row has a file, the report
              name becomes a link to it. Rows without a file show
              plain text.
   archived: true moves a row to an "Earlier batches" section at
              the bottom of the Lab Results page.
   fullPanel: true adds a quiet "Full panel" note (sterility,
              endotoxin, heavy metals also tested).
   sample: true adds the word "(sample)" beside the purity. Remove
              it from your real rows. */
const COAS = [
  { report: "Supplier report (Real Peptides)", compound: "Wolverine (BPC-157/TB-500)", size: "20mg",
    batch: "KVR-2026-A0726C", analyzed: "2026-09-18", purity: "99.669",
    lab: "Kovera Labs", file: "coa/wolverine-bpc-157-tb-500-20mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "Semax", size: "10mg",
    batch: "KVR-2026-418F3C", analyzed: "2026-09-18", purity: "99.578",
    lab: "Kovera Labs", file: "coa/semax-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "Selank", size: "10mg",
    batch: "KVR-2026-4C7F48", analyzed: "2026-09-18", purity: "99.677",
    lab: "Kovera Labs", file: "coa/selank-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "SS-31", size: "50mg",
    batch: "KVR-2026-7E0BA9", analyzed: "2026-09-18", purity: "99.601",
    lab: "Kovera Labs", file: "coa/ss-31-50mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "PT-141", size: "10mg",
    batch: "KVR-2026-61624A", analyzed: "2026-09-18", purity: "99.814",
    lab: "Kovera Labs", file: "coa/pt-141-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "Kisspeptin", size: "10mg",
    batch: "KVR-2026-ED1C6E", analyzed: "2026-09-18", purity: "99.614",
    lab: "Kovera Labs", file: "coa/kisspeptin-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "KPV", size: "10mg",
    batch: "KVR-2026-72B870", analyzed: "2026-09-18", purity: "99.756",
    lab: "Kovera Labs", file: "coa/kpv-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "Glutathione", size: "1500mg",
    batch: "KVR-2026-0F2758", analyzed: "2026-09-18", purity: "99.424",
    lab: "Kovera Labs", file: "coa/glutathione-1500mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "Cagrilintide", size: "10mg",
    batch: "KVR-2026-436122", analyzed: "2026-09-18", purity: "99.806",
    lab: "Kovera Labs", file: "coa/cagrilintide-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "CJC-1295 + Ipamorelin", size: "10mg",
    batch: "KVR-2026-090628", analyzed: "2026-09-18", purity: "99.666",
    lab: "Kovera Labs", file: "coa/cjc-1295-ipamorelin-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "5-Amino-1MQ", size: "50mg",
    batch: "KVR-2026-33911D", analyzed: "2026-09-18", purity: "99.621",
    lab: "Kovera Labs", file: "coa/5-amino-1mq-50mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "Tesamorelin", size: "10mg",
    batch: "KVR-2026-363D24", analyzed: "2026-08-12", purity: "99.757",
    lab: "Kovera Labs", file: "coa/tesamorelin-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "NAD+", size: "1000mg",
    batch: "KVR-2026-1BACF7", analyzed: "2026-08-12", purity: "99.689",
    lab: "Kovera Labs", file: "coa/nad-1000mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "MOTS-C", size: "10mg",
    batch: "KVR-2026-C527B8", analyzed: "2026-08-12", purity: "99.613",
    lab: "Kovera Labs", file: "coa/mots-c-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "KLOW", size: "80mg",
    batch: "KVR-2026-12DC38", analyzed: "2026-08-12", purity: "99.365",
    lab: "Kovera Labs", file: "coa/klow-80mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "Ipamorelin", size: "10mg",
    batch: "KVR-2026-B36321", analyzed: "2026-08-12", purity: "99.516",
    lab: "Kovera Labs", file: "coa/ipamorelin-10mg.pdf", fullPanel: true },
  { report: "Supplier report (Real Peptides)", compound: "GLOW", size: "70mg",
    batch: "KVR-2026-515288", analyzed: "2026-08-12", purity: "99.787",
    lab: "Kovera Labs", file: "coa/glow-70mg.pdf" },
  { report: "Supplier report (Real Peptides)", compound: "GHK-Cu", size: "100mg",
    batch: "KVR-2026-BC8D16", analyzed: "2026-08-12", purity: "99.650",
    lab: "Kovera Labs", file: "coa/ghk-cu-100mg.pdf", fullPanel: true },
];

// The Report cell for one row: a link when the row has a file,
// plain text when it does not.
function coaReportHTML(c) {
  if (c.file) return '<a href="' + c.file + '" target="_blank" rel="noopener">' + c.report + "</a>";
  return '<span class="mono">' + c.report + "</span>";
}
// The Purity cell text, with the "(sample)" marker when set
function coaPurityText(c) {
  return c.purity + "%" + (c.sample ? " (sample)" : "");
}

/* ---------- Home page featured order ----------
   The "In stock now" strip on the home page shows these products in
   this order (product page slugs). */
const FEATURED_SLUGS = [
  "rt30",
  "tesamorelin",
  "wolverine",
  "ghk-cu",
  "nad",
  "mots-c",
  "cagrilintide",
  "glutathione",
];

/* ---------- Supplies tab display order ----------
   The Supplies filter on the shop page shows its cards in this
   order (product page slugs, top to bottom). Anything not listed
   falls to the end. ---------- */
const SUPPLY_PAGE_ORDER = [
  "bac-water",
  "bacteriostatic-water-10ml-kit-10-vials",
];

/* ============================================================
   Shared helpers. No need to edit below this line.
   ============================================================ */

// Look up a product by name (names in PRODUCTS are unique)
function findProduct(name) {
  return PRODUCTS.find(p => p.name === name);
}

// Look up a product by its page slug
function findProductBySlug(slug) {
  return PRODUCTS.find(p => p.slug === slug);
}

// What the customer pays for a stack: listed vials at single-vial prices
function stackPrice(stack) {
  return stack.contents.reduce((sum, c) => {
    const p = findProduct(c[0]);
    return sum + (p ? p.price * c[1] : 0);
  }, 0);
}

// The free vial(s) named on the stack's "free" list
function stackFreeVials(stack) {
  return stack.free.map(findProduct);
}

// Full shipped contents as one readable line (shown at checkout)
function stackContentsText(stack) {
  const freeVials = stackFreeVials(stack);
  const parts = stack.contents.map(c => {
    const p = findProduct(c[0]);
    return c[1] + " x " + c[0] + (p ? " " + p.size : "");
  });
  freeVials.forEach(v => parts.push("1 x " + v.name + " " + v.size + " (FREE)"));
  parts.push("2 x Bacteriostatic Water 10mL (FREE)");
  return parts.join(", ");
}

// Each stack becomes a cart item like any product or kit
const STACK_ITEMS = STACKS.map(s => ({
  name: s.name + " Set",
  size: "stack",
  price: stackPrice(s),
  stock: true,
  isStack: true,
  detail: stackContentsText(s),
}));

// Products, kits, and stacks share one combined list for quantities and totals
const ALL_ITEMS = PRODUCTS.concat(KITS).concat(STACK_ITEMS);

/* ---------- 6. VIAL ART · the product picture ----------
   Every product picture is one of three real vial photos in the img
   folder (blue, black, or white cap). The label on each photo is
   blank silver apart from the thin rule and "FOR RESEARCH USE ONLY".
   The code below prints everything else onto it:
     - the store name, centered in a band at the top of the label
       (SETTINGS.brand.name, or SETTINGS.brand.labelName when that is
       filled in). The band is black with white text unless
       labelBand / labelText name other colors,
     - a mark under the band: the atom drawn in code by default, or
       the owner's logo when SETTINGS.brand.labelLogo names a picture,
     - an optional tint over the whole silver label (labelTint),
     - the product's name and size lower down.
   A complete label design of the owner's own (labelImage) replaces
   the band, the mark, and the tint: it is laid over the whole label
   rectangle, and the product name and size still print on top of it
   unless labelPrintsNameSize is false.
   All of those settings live under SETTINGS.brand in settings.js and,
   once the database is connected, in the admin under Look & layout,
   Vial label (uploads go to the "labels" storage bucket there).
   One set of photos covers the whole catalog, so adding a product or
   changing the store name never means making a new picture.
   The photos as they shipped before the label was blanked (with a
   "YOUR BRAND" box and an atom icon baked in) are kept for reference
   as img/_original-vial-blue.webp, _original-vial-black.webp, and
   _original-vial-white.webp. The store never loads those.

   WHICH CAP A PRODUCT GETS: single vials are blue, 10-vial kits are
   black, supplies are white. To override one product, add
   cap: "black" (or "blue" / "white") to its row in the lists above.

   THE LIGHT LOOK USES NO BLUE CAPS: LIGHT_CAP_SWAP below turns every
   blue cap white when the store is in its light look, so that look
   is white and black caps only. To keep blue in both looks, empty
   the list: const LIGHT_CAP_SWAP = {};

   TO USE YOUR OWN VIAL PHOTOS: replace the three files in img/ and
   keep the same names. The photos are 660 x 1100 with a transparent
   background. If your label's blank area sits somewhere else, adjust
   VIAL_PRINT just below (the label rectangle, the brand band, the
   mark area, and the two print lines are all measured in photo
   pixels). */
const VIAL_PHOTOS = { blue: "img/vial-blue.webp", black: "img/vial-black.webp", white: "img/vial-white.webp" };
const LIGHT_CAP_SWAP = { blue: "white" };
const VIAL_PRINT = {
  centerX: 334,     // middle of the label, in photo pixels (everything printed is centered on it)
  nameY: 752,       // baseline of the compound name
  sizeY: 812,       // baseline of the size line under it
  maxWidth: 318,    // widest the name may print before it shrinks
  ink: "#1d1d1f",   // print color: the compound name, the size, and the default atom mark
  band: "#1d1d1f",  // the brand band's color when labelBand is empty
  bandText: "#ffffff", // the name's color in the band when labelText is empty
  // The whole silver label, measured from the photo. A full label
  // design (labelImage) covers exactly this rectangle, and a tint
  // (labelTint) colors exactly this rectangle.
  labelBox: { x: 114, y: 415, w: 444, h: 518, radius: 4 },
  // The brand band: the box at the top of the label that carries the
  // store name. x, y, w, h are its edges; pad is the breathing room
  // each side of the name inside it. It is centered on centerX.
  brandBox: { x: 159, y: 464, w: 350, h: 95, radius: 6, pad: 14 },
  // The mark area under the band: the atom is drawn to fit it, or the
  // owner's logo is scaled to fit inside and centered.
  logoBox: { x: 267, y: 574, w: 134, h: 134 },
};

function vialCap(item) {
  if (item.cap && VIAL_PHOTOS[item.cap]) return item.cap;
  if (item.isKit || item.category === "kit") return "black";
  if (item.supply || item.category === "supply") return "white";
  return "blue";
}

// Splits a name into two lines at the space that leaves the halves
// closest in length ("Bacteriostatic Water", "Meridian Research Supply").
function splitTwoLines(name) {
  const words = name.split(" ");
  let best = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

// The compound name as printed on the label, split over two lines when
// it is long and has a space ("Bacteriostatic Water").
function vialLabelLines(item) {
  const name = String(item.sortAs || item.name);
  if (name.length <= 13 || name.indexOf(" ") === -1) return [name];
  return splitTwoLines(name);
}

// Turns text into something safe to drop inside SVG
function svgSafe(t) {
  return String(t).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// The label settings, read fresh on every draw so a row saved from the
// admin (laid over SETTINGS by theme.js) is picked up. Each value is
// checked here too: a color must be a 6-digit hex code, anything else
// falls back to the stock value.
function vialLabelSettings() {
  const S = (typeof SETTINGS !== "undefined" && SETTINGS && SETTINGS.brand) || {};
  const str = k => (typeof S[k] === "string" ? S[k].trim() : "");
  const hex = k => (/^#[0-9a-f]{6}$/i.test(str(k)) ? str(k) : "");
  return {
    name: (str("labelName") || str("name")).toUpperCase(),
    logo: str("labelLogo"),            // a picture that replaces the atom mark
    image: str("labelImage"),          // a complete label design that replaces band, mark, and tint
    band: hex("labelBand") || VIAL_PRINT.band,
    text: hex("labelText") || VIAL_PRINT.bandText,
    tint: hex("labelTint"),            // "" means no tint
    printsNameSize: S.labelPrintsNameSize !== false   // only read when a full label design is set
  };
}

// The default mark: an atom drawn in code (a nucleus, three orbits at
// 0, 60, and 120 degrees, and three electrons), sized to fit a box.
// Drawn in the print color whenever no logo is set.
function vialAtomSVG(box, ink) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) / 2;       // the orbits' long radius
  const ry = r * 0.38;                         // the orbits' short radius
  const stroke = Math.max(2, r * 0.065);
  let out = '<g fill="none" stroke="' + ink + '" stroke-width="' + stroke.toFixed(1) + '">';
  [0, 60, 120].forEach(deg => {
    out += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r.toFixed(1) + '" ry="' + ry.toFixed(1) + '" transform="rotate(' + deg + ' ' + cx + ' ' + cy + ')"/>';
  });
  out += "</g>";
  // The nucleus, then one electron on each orbit at a different spot
  out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.19).toFixed(1) + '" fill="' + ink + '"/>';
  [[0, 215], [60, 335], [120, 95]].forEach(([deg, t]) => {
    const a = deg * Math.PI / 180, b = t * Math.PI / 180;
    const px = r * Math.cos(b), py = ry * Math.sin(b);   // a point on the unrotated orbit
    const ex = cx + px * Math.cos(a) - py * Math.sin(a);
    const ey = cy + px * Math.sin(a) + py * Math.cos(a);
    out += '<circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="' + (r * 0.09).toFixed(1) + '" fill="' + ink + '"/>';
  });
  return out;
}

// Everything printed on the label apart from the product's own name
// and size: the tint, the brand band with the store name centered in
// it, and the mark under the band (atom or logo). When a full label
// design is set, that picture is laid over the label rectangle
// instead and none of the rest is drawn. Long names drop to two lines
// and shrink to fit, the same way compound names do.
function vialBrandSVG() {
  const L = vialLabelSettings();
  const lb = VIAL_PRINT.labelBox, b = VIAL_PRINT.brandBox, mb = VIAL_PRINT.logoBox;
  if (L.image) {
    // A full label design: covers the label rectangle, cropped to fit,
    // never stretched (preserveAspectRatio "slice")
    return '<image href="' + svgSafe(L.image) + '" x="' + lb.x + '" y="' + lb.y + '" width="' + lb.w + '" height="' + lb.h + '" preserveAspectRatio="xMidYMid slice"/>';
  }
  let out = "";
  if (L.tint) {
    // The tint multiplies into the silver, so the label's shading shows through the color
    out += '<rect x="' + lb.x + '" y="' + lb.y + '" width="' + lb.w + '" height="' + lb.h + '" rx="' + lb.radius + '" fill="' + L.tint + '" opacity="0.85" style="mix-blend-mode:multiply"/>';
  }
  out += '<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="' + b.radius + '" fill="' + L.band + '"/>';
  if (L.name) {
    const spacing = 3;                    // letter-spacing, in photo pixels
    const room = b.w - 2 * b.pad;         // the width the name may fill
    // Widest the name can print on one line (bold capitals run about
    // 0.66 of the type size wide, plus the spacing between them),
    // capped at 50
    const fit = (txt, cap) => Math.min(cap, (room - (txt.length - 1) * spacing) / (0.66 * txt.length));
    let lines = [L.name];
    let size = fit(L.name, 50);
    if (size < 30 && L.name.indexOf(" ") !== -1) {   // too small on one line: use two
      lines = splitTwoLines(L.name);
      const longest = lines.reduce((n, l) => Math.max(n, l.length), 0);
      size = fit("x".repeat(longest), 32);
    }
    const centerY = b.y + b.h / 2;
    const gap = size * 1.12;              // baseline to baseline when there are two lines
    // Capitals sit about 0.35 of the type size above their baseline, so
    // this centers the block of text in the band
    const firstY = centerY + size * 0.35 - (lines.length - 1) * gap / 2;
    // Centered on the band. The browser adds letter-spacing after the
    // last letter too, which would nudge the word left by half a
    // space, so the anchor sits half a space to the right of center.
    const x = b.x + b.w / 2 + spacing / 2;
    const font = ' text-anchor="middle" font-family="Jost, \'Helvetica Neue\', sans-serif" font-weight="700" fill="' + L.text + '" letter-spacing="' + spacing + '"';
    out += lines.map((l, i) =>
      '<text x="' + x + '" y="' + (firstY + i * gap).toFixed(1) + '"' + font + ' font-size="' + size.toFixed(1) + '">' + svgSafe(l) + "</text>").join("");
  }
  if (L.logo) {
    out += '<image href="' + svgSafe(L.logo) + '" x="' + mb.x + '" y="' + mb.y + '" width="' + mb.w + '" height="' + mb.h + '" preserveAspectRatio="xMidYMid meet"/>';
  } else {
    out += vialAtomSVG(mb, VIAL_PRINT.ink);
  }
  return out;
}

// Every vial drawn on the page, so they can all be drawn again when
// theme.js fetches newer label settings from the database (see
// redrawVials at the end of this section).
const VIAL_DRAWN = [];

// Build one product picture. "item" is any product or kit (kits show
// the vial they contain). Returns a string of SVG to drop straight into
// the page: the photo, everything printed on the label (see
// vialBrandSVG), and the product's name and size.
function vialSVG(item, altText) {
  const p = VIAL_PRINT;
  const safe = svgSafe;
  const L = vialLabelSettings();
  const lines = vialLabelLines(item).map(l => l.toUpperCase());
  const longest = lines.reduce((n, l) => Math.max(n, l.length), 0);
  // Shrink the name to fit the label (capital letters run about 0.7 of the type size wide)
  const nameSize = Math.min(lines.length > 1 ? 27 : 46, p.maxWidth / (0.7 * longest));
  // Two-line names start a little higher, but stay clear of the mark above
  const firstY = lines.length > 1 ? p.nameY - 15 : p.nameY;
  const font = ' text-anchor="middle" font-family="Jost, \'Helvetica Neue\', sans-serif" fill="' + p.ink + '"';
  const nameText = lines.map((l, i) =>
    '<text x="' + p.centerX + '" y="' + (firstY + i * nameSize * 1.08).toFixed(1) + '"' + font + ' font-weight="600" font-size="' + nameSize.toFixed(1) + '">' + safe(l) + "</text>").join("");
  // The size keeps only its first part ("10mL kit · 10 vials" prints as "10 ML")
  const size = String(item.vialSize || item.size || "").split(" ")[0].replace(/(\d)([a-zA-Z])/, "$1 $2").toUpperCase();
  const sizeText = '<text x="' + p.centerX + '" y="' + p.sizeY + '"' + font + ' font-weight="700" font-size="44">' + safe(size) + "</text>";
  // With a full label design, the name and size print only when the setting says so
  const printNameSize = !L.image || L.printsNameSize;
  const a11y = altText
    ? ' role="img" aria-label="' + safe(altText) + '"'
    : ' aria-hidden="true" focusable="false"';
  // The photo. When the light look calls for a different cap, both photos
  // go in and styles.css shows whichever matches the current look.
  const cap = vialCap(item);
  const lightCap = (item.capLight && VIAL_PHOTOS[item.capLight]) ? item.capLight : (LIGHT_CAP_SWAP[cap] || cap);
  const img = (c, cls) => '<image' + (cls ? ' class="' + cls + '"' : "") + ' href="' + VIAL_PHOTOS[c] + '" x="0" y="0" width="660" height="1100"/>';
  const photo = cap === lightCap ? img(cap) : img(cap, "only-dark") + img(lightCap, "only-light");
  const n = VIAL_DRAWN.push({ item: item, alt: altText }) - 1;   // remembered for redrawVials
  return '<svg class="vial-art" data-vial="' + n + '" viewBox="0 0 660 1100" xmlns="http://www.w3.org/2000/svg"' + a11y + ">" +
    vialInnerSVG(item) +
  "</svg>";
}
// The vial itself (photo, brand band, name, size) in 660 x 1100 photo
// pixels, with no <svg> wrapper. vialSVG wraps one; kitSVG places ten.
function vialInnerSVG(item) {
  const p = VIAL_PRINT;
  const safe = svgSafe;
  const L = vialLabelSettings();
  const lines = vialLabelLines(item).map(l => l.toUpperCase());
  const longest = lines.reduce((n, l) => Math.max(n, l.length), 0);
  const nameSize = Math.min(lines.length > 1 ? 27 : 46, p.maxWidth / (0.7 * longest));
  const firstY = lines.length > 1 ? p.nameY - 15 : p.nameY;
  const font = ' text-anchor="middle" font-family="Jost, \'Helvetica Neue\', sans-serif" fill="' + p.ink + '"';
  const nameText = lines.map((l, i) =>
    '<text x="' + p.centerX + '" y="' + (firstY + i * nameSize * 1.08).toFixed(1) + '"' + font + ' font-weight="600" font-size="' + nameSize.toFixed(1) + '">' + safe(l) + "</text>").join("");
  const size = String(item.vialSize || item.size || "").split(" ")[0].replace(/(\d)([a-zA-Z])/, "$1 $2").toUpperCase();
  const sizeText = '<text x="' + p.centerX + '" y="' + p.sizeY + '"' + font + ' font-weight="700" font-size="44">' + safe(size) + "</text>";
  const printNameSize = !L.image || L.printsNameSize;
  const cap = vialCap(item);
  const lightCap = (item.capLight && VIAL_PHOTOS[item.capLight]) ? item.capLight : (LIGHT_CAP_SWAP[cap] || cap);
  const img = (c, cls) => '<image' + (cls ? ' class="' + cls + '"' : "") + ' href="' + VIAL_PHOTOS[c] + '" x="0" y="0" width="660" height="1100"/>';
  const photo = cap === lightCap ? img(cap) : img(cap, "only-dark") + img(lightCap, "only-light");
  return photo + vialBrandSVG() + (printNameSize ? nameText + sizeText : "");
}

/* ---------- The kit picture: ten labeled vials in a clear case ----------
   Drawn in code from the same vial photo and label as the single vial,
   so a kit never needs its own photo: ten of the compound's vials in two
   rows, inside a translucent case. Used wherever a kit is shown (shop
   cards, the product page). The case is drawn in off-white at low
   opacity so it reads as clear acrylic on the dark plate and on the
   light one. */
function kitSVG(item, altText) {
  const inner = vialInnerSVG(item);
  const a11y = altText
    ? ' role="img" aria-label="' + svgSafe(altText) + '"'
    : ' aria-hidden="true" focusable="false"';
  const n = VIAL_DRAWN.push({ item: item, alt: altText, kit: true }) - 1;
  // One vial, placed and scaled. The drawing is 660 x 1100 photo pixels.
  const vial = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + inner + "</g>";
  const back = [120, 356, 592, 828, 1064].map(x => vial(x, 120, 0.33)).join("");
  const front = [84, 334, 584, 834, 1084].map(x => vial(x, 290, 0.38)).join("");
  const glass = 'fill="rgba(239,234,224,0.10)" stroke="rgba(239,234,224,0.55)" stroke-width="4"';
  return '<svg class="vial-art kit-art" data-vial="' + n + '" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg"' + a11y + ">" +
    // the case: back wall and lid rim behind the vials
    '<rect x="70" y="70" width="1260" height="560" rx="20" ' + glass + "/>" +
    '<rect x="70" y="52" width="1260" height="34" rx="12" fill="rgba(239,234,224,0.16)"/>' +
    back + front +
    // the front wall sits over the lower half of the front row, like a real clear case
    '<rect x="46" y="560" width="1308" height="300" rx="22" fill="rgba(239,234,224,0.12)" stroke="rgba(239,234,224,0.6)" stroke-width="4"/>' +
    '<rect x="46" y="820" width="1308" height="40" rx="14" fill="rgba(239,234,224,0.10)"/>' +
  "</svg>";
}

// Draw every vial on the page again with the current label settings.
// theme.js fires "store-settings" when the database answers with a
// newer row than the copy on the visitor's device, so a label change
// saved in the admin shows without a reload.
function redrawVials() {
  document.querySelectorAll("svg.vial-art[data-vial]").forEach(svg => {
    const d = VIAL_DRAWN[Number(svg.getAttribute("data-vial"))];
    if (!d) return;
    const holder = document.createElement("div");
    holder.innerHTML = d.kit ? kitSVG(d.item, d.alt) : vialSVG(d.item, d.alt);
    svg.replaceWith(holder.firstChild);
  });
}
if (typeof document !== "undefined") document.addEventListener("store-settings", redrawVials);

// The first three vials of a research set, for its fanned picture
function setVials(setItem) {
  return setItem.stack.contents.slice(0, 3).map(c => findProduct(c[0])).filter(Boolean);
}

/* ---------- Storefront catalog ----------
   One clean list of everything for sale. The shop grid, product pages,
   cart, and checkout all read from CATALOG. It is built automatically
   from PRODUCTS, KITS, and STACKS above, so you never edit it directly.

   - Every item gets a stable id (what the cart stores) and a slug
     (its product page address, product.html?p=slug).
   - If the same vial is ever listed twice above (an in-stock row with
     a "left" count plus an available-to-order row) it becomes ONE card.
     Buyers can order more than what's on hand; the extra ships later.
   - category is "vial", "kit", "set", or "supply" (used by the filters). */
function slugify(s) {
  return String(s).toLowerCase().replace(/\+/g, "plus").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function itemId(p) {
  if (p.isStack) return "set-" + slugify(p.name);
  return slugify(p.name) + "-" + slugify(p.size);
}
const CATALOG = [];
(function buildCatalog() {
  const byId = {};
  PRODUCTS.forEach(p => {
    const id = itemId(p);
    const existing = byId[id];
    if (existing) {
      // Second listing of the same vial: keep one card, remember that
      // more can be ordered beyond what's on hand.
      if (p.stock && !existing.stock) {
        Object.assign(existing, { stock: true, left: p.left, slug: p.slug || existing.slug });
      }
      existing.moreToOrder = true;
      return;
    }
    const c = Object.assign({}, p, { id: id, slug: p.slug || id, category: p.supply ? "supply" : "vial" });
    byId[id] = c;
    CATALOG.push(c);
  });
  KITS.forEach(k => {
    const id = itemId(k);
    CATALOG.push(Object.assign({}, k, {
      id: id, slug: id, category: "kit", isKit: true,
      vialSize: k.size.split(" kit")[0],
    }));
  });
  STACKS.forEach(s => {
    const it = { name: s.name + " Set", size: "stack", price: stackPrice(s), stock: true,
      isStack: true, detail: stackContentsText(s), stack: s };
    it.id = itemId(it); it.slug = it.id; it.category = "set";
    CATALOG.push(it);
  });
  refreshSetStock();
  applyLabReportRule();
})();

/* ---------- The lab-report rule (SETTINGS.rules.requireLabReportToSell) ----------
   When the rule is on, a vial or kit can be sold only if a current
   (non-archived) COAS row carries the same compound name. Items
   without one are marked awaitingReport: the shop card, the product
   page, and the cart all refuse them. Supplies (bacteriostatic water)
   are exempt. A research set is held back when any vial inside it is.
   Runs once, when the catalog is built. */
function hasLabReport(name) {
  return COAS.some(c => !c.archived && c.compound === name);
}
function applyLabReportRule() {
  if (!SETTINGS.rules || !SETTINGS.rules.requireLabReportToSell) return;
  CATALOG.forEach(c => {
    if (c.isStack) return;
    if (c.category === "supply" || c.also === "supply") return;
    c.awaitingReport = !hasLabReport(c.name);
  });
  CATALOG.filter(c => c.isStack).forEach(set => {
    const names = set.stack.contents.map(c => c[0]).concat(set.stack.free);
    set.awaitingReport = names.some(n => !hasLabReport(n));
  });
}

// A set is in stock only when every vial in it (paid and free) and the
// BAC water are in stock. Otherwise it shows "Ships in 4 weeks".
// Runs once, when the catalog is built. Stock comes only from the
// stock: true / false flags above.
function refreshSetStock() {
  const water = PRODUCTS.find(p => p.name === "Bacteriostatic Water" && p.size === "10mL");
  CATALOG.filter(c => c.isStack).forEach(set => {
    const names = set.stack.contents.map(c => c[0]).concat(set.stack.free);
    const parts = names.map(findProduct).concat(water ? [water] : []).filter(Boolean)
      .map(p => CATALOG.find(c => c.id === itemId(p)));
    set.stock = parts.every(c => c && c.stock);
    // Which parts are holding it up
    set.missing = parts.filter(c => c && !c.stock).map(c => c.name + " " + c.size);
  });
}

// Look up one catalog item by its id or its page slug
function findCatalogItem(key) {
  return CATALOG.find(c => c.id === key || c.slug === key);
}

// Other sizes of the same compound (for the product page)
function siblingsOf(item) {
  return CATALOG.filter(c => c.category === "vial" && c.name === item.name && c.id !== item.id);
}

// The kit that matches a vial, if there is one
function kitFor(item) {
  return CATALOG.find(c => c.isKit && c.name === item.name && c.vialSize === item.size);
}

/* ---------- 7. LIVE STOCK (the counts on your admin's Inventory screen) ----------
   Once the SYNC block in settings.js is filled in (Session 3), every
   page asks your database for the counts you keep in the admin and
   lays them over the stock flags written above:
     0 on hand          -> "Out of stock": cannot be bought, and listed on
                           the Restocks page with the phase and date you
                           set in the admin
     1 up to "low at"   -> "In stock, only N left"
     more than that     -> "In stock"
   A row you never counted (left blank in the admin) keeps the flag
   written above, so nothing changes while counts are being typed in.
   Kits are counted in vials: 10 vials on hand = 1 kit. The last answer
   is kept on the visitor's device so the page draws right before the
   fresh one arrives; cart.js and the pages listen for "store-stock"
   and redraw. The demo store (sync.localOnly) reads the demo admin's
   counts from this same browser instead. Nothing here to edit. */
const STOCK_CACHE_KEY = "store_stock_cache";
function applyLiveStock(rows) {
  (rows || []).forEach(r => {
    const it = CATALOG.find(c => c.id === r.item_key);
    if (!it || it.isStack) return;
    const q = Number(r.qty);
    if (!isFinite(q)) return;
    it.liveQty = q;
    it.moreToOrder = false;
    it.restockPhase = r.restock_phase || null;
    it.restockDate = r.restock_date || null;
    if (q <= 0) { it.stock = false; it.left = undefined; it.soldOut = true; }
    else { it.stock = true; it.soldOut = false; it.left = q <= (Number(r.low_at) || 3) ? q : undefined; }
  });
  refreshSetStock();
}
(function liveStock() {
  if (typeof document === "undefined") return;
  const sync = SETTINGS.sync || {};
  const announce = () => { try { document.dispatchEvent(new CustomEvent("store-stock")); } catch (e) {} };
  if (sync.localOnly === true) {
    // The demo: the demo admin on this same web address keeps its counts in this browser
    try { const rows = JSON.parse(localStorage.getItem("store_demo_stock") || "null"); if (rows) applyLiveStock(rows); } catch (e) {}
    window.addEventListener("storage", e => {
      if (e.key !== "store_demo_stock") return;
      try { applyLiveStock(JSON.parse(e.newValue || "[]")); announce(); } catch (err) {}
    });
    return;
  }
  if (!(sync.supabaseUrl && sync.anonKey) || typeof fetch !== "function") return;
  try {
    const c = JSON.parse(localStorage.getItem(STOCK_CACHE_KEY));
    if (c && Date.now() - c.at < 86400000) applyLiveStock(c.rows);
  } catch (e) { /* no copy yet */ }
  const url = String(sync.supabaseUrl).replace(/\/+$/, "") + "/rest/v1/rpc/public_stock";
  fetch(url, { method: "POST", headers: { apikey: sync.anonKey, Authorization: "Bearer " + sync.anonKey, "Content-Type": "application/json" }, body: "{}" })
    .then(r => { if (!r.ok) throw new Error("public_stock " + r.status); return r.json(); })
    .then(rows => {
      if (!Array.isArray(rows)) return;
      applyLiveStock(rows);
      try { localStorage.setItem(STOCK_CACHE_KEY, JSON.stringify({ at: Date.now(), rows })); } catch (e) {}
      announce();
    })
    .catch(() => { /* keep what is showing */ });
})();

