-- ============================================================
-- STORE KIT · Store Admin database setup
--
-- Run this ONCE, in your own Supabase project.
--
-- Three steps, in order:
--
--   1. Create a Supabase project at supabase.com (free tier is fine).
--      Give it a strong database password and keep that somewhere safe.
--
--   2. Open the project > SQL Editor > New query. Paste this whole file.
--      Click Run. It creates the tables, the security rules, and the
--      functions the store and the admin page talk to.
--
--   3. Add yourself as the owner login:
--      Authentication > Users > Add user > "Create new user".
--      Enter your email and a password, leave "Auto Confirm User" on,
--      and save. That email and password are what you type into the
--      admin page.
--
-- Then open admin/index.html, fill in the ADMIN_CONFIG block at the
-- top of the script (your project URL and anon key from
-- Project Settings > API), and upload it wherever you host the admin.
--
-- Safe to run again: every statement checks for itself first.
-- ============================================================


-- ============================================================
-- 1. ENTRIES: one row per sale (order) and one row per expense
--    kind = 'sale' or 'expense'. Sales use the customer fields and
--    status. Expenses use category. Both use amount, description, notes.
-- ============================================================
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('sale', 'expense')),
  entry_date date not null default current_date,

  -- Sales: who bought and where it ships
  party text,                       -- customer name (or vendor name on an expense)
  customer_email text,
  phone text,
  street text,
  city text,
  state text,
  zip text,

  -- Money. amount is the order total (or the expense amount).
  amount numeric(12,2) not null default 0,
  subtotal numeric(12,2),           -- website orders: items before shipping
  shipping_choice text,             -- website orders: the shipping option chosen
  shipping_cost numeric(12,2),
  pickup boolean not null default false,

  -- Sales only. The admin page shows these four choices.
  status text check (status is null or status in ('Awaiting payment', 'Paid', 'Shipped', 'Cancelled')),
  payment_method text,

  description text,                 -- sales: items ordered. expenses: what was bought
  notes text,
  category text,                    -- expenses: Product, Shipping, Supplies, Other

  -- Inventory link.
  --   order_items: the full item list a website order arrived with (for the record)
  --   line_items:  [{"key": "<inventory item_key>", "qty": 2}, ...]
  --                only the lines that matched an inventory item
  --   stock_applied: true once those lines have been taken out of inventory
  --                (so cancelling the order can put them back)
  order_items jsonb,
  line_items jsonb,
  stock_applied boolean not null default false,

  -- Marketing permission. false = the buyer unticked "email me updates".
  email_ok boolean not null default true,

  -- Where the row came from: 'manual' (typed into the admin) or 'website'
  source text not null default 'manual',

  -- Website orders: the buyer's agreement to the store terms
  attested_at timestamptz,
  initials text,
  terms_version text
);

-- Website orders: true when the buyer signed in with the six-digit
-- email code before ordering, so the email on the order is known to
-- be theirs. Added after the first release, so it is an ALTER: a
-- database set up before this column existed gets it on the next run.
-- ALREADY RAN setup.sql BEFORE THIS VERSION? Run this one line, then
-- re-run section 6 (intake_order) below, in the SQL Editor. Nothing
-- else needs to change.
alter table public.entries add column if not exists verified_email boolean not null default false;

-- The admin lists newest first; this keeps that fast as the table grows.
create index if not exists entries_entry_date_idx on public.entries (entry_date desc, created_at desc);
create index if not exists entries_kind_status_idx on public.entries (kind, status);


-- ============================================================
-- 2. INVENTORY: one row per item the store sells
--    kind = 'vial' (a single unit), 'supply' (water, syringes, etc.)
--    or 'kit' (several vials of one item sold together).
--    A kit row has NO count of its own: it points at its vial row
--    (parent_key) and reads as "vial count divided by per_kit".
--    Sell one vial and the kit count follows on its own.
--    qty NULL means "not counted yet".
-- ============================================================
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,    -- short id, e.g. "example-peptide-10mg" (the admin makes it)
  name text not null,
  size text not null default '',
  kind text not null default 'vial' check (kind in ('vial', 'kit', 'supply')),
  qty integer,                      -- on hand. NULL = not counted yet
  low_at integer not null default 3, -- at or below this = "low stock"
  parent_key text,                  -- kit rows only: the vial row's item_key
  per_kit integer,                  -- kit rows only: vials in one kit
  sort_order integer not null default 0,
  restock_phase smallint check (restock_phase in (1, 2, 3)),   -- see section 9
  restock_date date,                                            -- see section 9
  updated_at timestamptz default now()
);


-- ============================================================
-- 3. SECURITY (Row Level Security)
--    The anon key is published inside the admin page, so these rules
--    are what keep the data private:
--      - a logged-in user (you, the owner) can read and change everything
--      - anyone who is NOT logged in gets nothing at all
--    The storefront never reads these tables with the anon key. It
--    writes orders through intake_order() with the service role key,
--    from a server-side function, never from the browser.
-- ============================================================
alter table public.entries enable row level security;
alter table public.inventory enable row level security;

drop policy if exists "owner full access" on public.entries;
create policy "owner full access" on public.entries
  for all to authenticated using (true) with check (true);

drop policy if exists "owner full access" on public.inventory;
create policy "owner full access" on public.inventory
  for all to authenticated using (true) with check (true);

-- No policy for anon on purpose: with RLS on and no policy, anon sees nothing.


-- ============================================================
-- 4. HELPERS: turn "Example Peptide 10mg" and "example-peptide-10mg"
--    into the same comparable text so order labels can find items.
-- ============================================================
create or replace function public.norm_text(x text)
returns text language sql immutable as $$
  select trim(regexp_replace(lower(coalesce(x, '')), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.slug_text(x text)
returns text language sql immutable as $$
  select replace(public.norm_text(x), ' ', '-');
$$;

-- Read a number out of JSON text without failing on junk.
create or replace function public.safe_num(x text)
returns numeric language plpgsql immutable as $$
begin
  return x::numeric;
exception when others then
  return null;
end;
$$;

-- Read a true/false out of JSON text without failing on junk.
create or replace function public.safe_bool(x text, fallback boolean)
returns boolean language plpgsql immutable as $$
begin
  if x is null or trim(x) = '' then return fallback; end if;
  return x::boolean;
exception when others then
  return fallback;
end;
$$;


-- ============================================================
-- 5. ADJUST STOCK: move an order's items out of (-1) or back into (+1)
--    inventory. lines = [{"key": "<item_key>", "qty": 2}, ...]
--    A kit line moves per_kit vials on its vial row. Rows that are
--    "not counted yet" are left alone. Counts never go below zero.
--    Called by the admin page (adding a sale, cancelling an order)
--    and by intake_order below.
-- ============================================================
create or replace function public.adjust_stock(lines jsonb, sign integer)
returns void
language plpgsql
set search_path = public
as $$
declare
  l jsonb;
  r public.inventory%rowtype;
  n integer;
  parent text;
begin
  if sign not in (-1, 1) then
    raise exception 'sign must be -1 or 1';
  end if;
  if lines is null or jsonb_typeof(lines) <> 'array' then
    return;
  end if;

  for l in select * from jsonb_array_elements(lines) loop
    n := floor(coalesce(public.safe_num(l->>'qty'), 0))::integer;
    if n <= 0 then continue; end if;

    select * into r from public.inventory where item_key = l->>'key';
    if not found then continue; end if;

    -- A kit line really means "per_kit vials of the parent item"
    if r.parent_key is not null then
      n := n * greatest(coalesce(r.per_kit, 10), 1);
      parent := r.parent_key;
      select * into r from public.inventory where item_key = parent;
      if not found then continue; end if;
    end if;

    if r.qty is null then continue; end if;   -- not counted yet: leave it

    update public.inventory
       set qty = greatest(0, qty + sign * n),
           updated_at = now()
     where id = r.id;
  end loop;
end;
$$;

revoke all on function public.adjust_stock(jsonb, integer) from public, anon;
grant execute on function public.adjust_stock(jsonb, integer) to authenticated, service_role;


-- ============================================================
-- 6. INTAKE ORDER: the storefront's server-side order function calls
--    this (with the service role key) each time a customer checks out.
--
--    Payload it expects:
--    {
--      "customer": { "name", "email", "phone", "street", "city", "state", "zip" },
--      "items": [ { "label": "Example Peptide 10mg", "qty": 2, "each": 45, "note": "" } ],
--      "subtotal": 90, "shippingChoice": "Standard", "shippingCost": 10,
--      "pickup": false, "total": 100, "request": "",
--      "attestedAt": "2026-01-01T12:00:00Z", "initials": "AB",
--      "termsVersion": "2026-01", "emailUpdates": true, "storeName": "...",
--      "verifiedEmail": true
--    }
--    verifiedEmail is true only when the order code checked the buyer's
--    sign-in cookie (AUTH_SECRET set in Cloudflare). Missing = false.
--
--    What it does:
--      - inserts ONE sale row with status 'Paid' (orders sync as paid;
--        the owner changes it only if the money never arrives)
--        (you click Paid in the admin when the money arrives)
--      - writes "2 x Example Peptide 10mg, 1 x ..." into description
--      - keeps the full item list in order_items
--      - matches each label to an inventory row by name + size
--        (same comparison as the admin page) and lowers that count;
--        a label that matches nothing is skipped and listed back as
--        "unmatched" so nothing fails
--      - returns { "ok": true, "id": "<uuid>", "stock_applied": bool,
--                  "unmatched": [ ...labels... ] }
--    Only the service role may call it.
-- ============================================================
create or replace function public.intake_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c jsonb := coalesce(payload->'customer', '{}'::jsonb);
  items jsonb := case when jsonb_typeof(payload->'items') = 'array' then payload->'items' else '[]'::jsonb end;
  it jsonb;
  label text;
  note text;
  q integer;
  inv public.inventory%rowtype;
  matched jsonb := '[]'::jsonb;
  unmatched text[] := '{}';
  desc_parts text[] := '{}';
  v_name text;
  v_email text;
  v_email_ok boolean;
  v_attested timestamptz;
  v_total numeric;
  new_id uuid;
  applied boolean := false;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'intake_order: payload must be a JSON object';
  end if;

  v_name := nullif(left(trim(coalesce(c->>'name', '')), 200), '');
  v_email := nullif(left(lower(trim(coalesce(c->>'email', ''))), 200), '');
  if v_email is not null and v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    v_email := null;
  end if;
  v_email_ok := public.safe_bool(payload->>'emailUpdates', true);
  v_total := coalesce(public.safe_num(payload->>'total'), 0);

  begin
    v_attested := (payload->>'attestedAt')::timestamptz;
  exception when others then
    v_attested := null;
  end;

  -- Walk the items: build the description and find inventory matches
  for it in select * from jsonb_array_elements(items) loop
    label := left(trim(coalesce(it->>'label', '')), 200);
    if label = '' then continue; end if;
    q := greatest(floor(coalesce(public.safe_num(it->>'qty'), 1))::integer, 1);
    note := nullif(left(trim(coalesce(it->>'note', '')), 300), '');

    desc_parts := desc_parts || (q || ' x ' || label || case when note is not null then ' (' || note || ')' else '' end);

    select * into inv
      from public.inventory i
     where (it->>'key' is not null and i.item_key = it->>'key')
        or public.norm_text(i.name || ' ' || i.size) = public.norm_text(label)
        or (i.size = '' and public.norm_text(i.name) = public.norm_text(label))
        or i.item_key = public.slug_text(label)
     order by (i.item_key = coalesce(it->>'key', '')) desc, i.sort_order
     limit 1;

    if found then
      matched := matched || jsonb_build_object('key', inv.item_key, 'qty', q);
    else
      unmatched := unmatched || label;
    end if;
  end loop;

  insert into public.entries (
    kind, entry_date, party, customer_email, phone, street, city, state, zip,
    amount, subtotal, shipping_choice, shipping_cost, pickup,
    status, payment_method, description, notes,
    order_items, line_items, stock_applied, email_ok, source,
    attested_at, initials, terms_version, verified_email
  ) values (
    'sale', current_date, coalesce(v_name, 'Website order'), v_email,
    nullif(left(trim(coalesce(c->>'phone', '')), 60), ''),
    nullif(left(trim(coalesce(c->>'street', '')), 200), ''),
    nullif(left(trim(coalesce(c->>'city', '')), 100), ''),
    nullif(left(trim(coalesce(c->>'state', '')), 60), ''),
    nullif(left(trim(coalesce(c->>'zip', '')), 20), ''),
    v_total,
    public.safe_num(payload->>'subtotal'),
    nullif(left(trim(coalesce(payload->>'shippingChoice', '')), 100), ''),
    public.safe_num(payload->>'shippingCost'),
    public.safe_bool(payload->>'pickup', false),
    'Paid', null,
    nullif(array_to_string(desc_parts, ', '), ''),
    nullif(left(trim(coalesce(payload->>'request', '')), 2000), ''),
    items,
    case when jsonb_array_length(matched) > 0 then matched else null end,
    false, v_email_ok, 'website',
    v_attested,
    nullif(left(trim(coalesce(payload->>'initials', '')), 10), ''),
    nullif(left(trim(coalesce(payload->>'termsVersion', '')), 40), ''),
    public.safe_bool(payload->>'verifiedEmail', false)
  )
  returning id into new_id;

  -- Take the matched lines out of inventory and remember that it happened
  if jsonb_array_length(matched) > 0 then
    perform public.adjust_stock(matched, -1);
    update public.entries set stock_applied = true where id = new_id;
    applied := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', new_id,
    'stock_applied', applied,
    'unmatched', to_jsonb(unmatched)
  );
end;
$$;

-- Only the server-side order function (service role) may call this.
revoke all on function public.intake_order(jsonb) from public, anon, authenticated;
grant execute on function public.intake_order(jsonb) to service_role;

-- The small helpers are harmless to call, but there is no reason for
-- the public to call them either.
revoke all on function public.norm_text(text) from public, anon;
revoke all on function public.slug_text(text) from public, anon;
revoke all on function public.safe_num(text) from public, anon;
revoke all on function public.safe_bool(text, boolean) from public, anon;
grant execute on function public.norm_text(text) to authenticated, service_role;
grant execute on function public.slug_text(text) to authenticated, service_role;
grant execute on function public.safe_num(text) to authenticated, service_role;
grant execute on function public.safe_bool(text, boolean) to authenticated, service_role;

-- ============================================================
-- 7. STORE SETTINGS: the look and brand text, saved from the admin
--    One row, always id = 1. The admin's "Look & layout" screen
--    writes it; the storefront reads it on every page load and
--    applies it over settings.js (name, sub word, tagline, location,
--    dark or light, layout, font pair, two colors, three facts).
--
--    settings holds JSON in this shape:
--    {
--      "brand": { "name", "sub", "tagline", "location",
--                 "labelName", "labelLogo", "labelImage", "labelBand",
--                 "labelText", "labelTint", "labelPrintsNameSize" },
--      "look":  { "theme", "layout", "fontPair", "brandColor", "accentColor" },
--      "facts": [ "", "", "" ]
--    }
--
--    ALREADY RAN setup.sql BEFORE THIS VERSION? You only need this
--    section. Copy from the line above down to the end of the section,
--    paste it into the SQL Editor, and run it. Nothing is altered or
--    dropped; it only adds the one table and its rules.
--
--    Who can do what:
--      - anyone (the store, with the anon key) may READ the row
--      - the logged-in owner may INSERT or UPDATE it
--      - nobody can delete it
-- ============================================================
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),   -- there is only ever row 1
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- The single row. Empty settings means "use settings.js as is".
insert into public.store_settings (id, settings) values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "store may read" on public.store_settings;
create policy "store may read" on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists "owner may insert" on public.store_settings;
create policy "owner may insert" on public.store_settings
  for insert to authenticated with check (id = 1);

drop policy if exists "owner may update" on public.store_settings;
create policy "owner may update" on public.store_settings
  for update to authenticated using (true) with check (id = 1);

-- No delete policy on purpose: the row stays.

-- Belt and braces: make sure the roles can reach the table at all.
-- (Supabase grants these by default; a project with changed defaults
-- would otherwise return "permission denied" to the store.)
grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;


-- ============================================================
-- 8. PICTURES: a storage bucket for the Look & layout uploads
--    The admin's Look & layout screen uploads here: the vial label's
--    logo or full label design (logo.<ext>, label.<ext>), the header
--    logo (header-logo.<ext>, header-logo-light.<ext>), and the home
--    page background (hero.<ext>, hero-video.<ext>). The file's public
--    address is saved into the store_settings row. The bucket is named
--    "labels" and is public so the store can show the files.
--
--    Who can do what:
--      - anyone may READ a file in the bucket (the store shows it)
--      - the logged-in owner may ADD, REPLACE, or REMOVE files
--
--    Supabase always has the storage schema, so the check below always
--    passes there. It exists so this file also runs on a plain
--    PostgreSQL without Supabase Storage (used to test the script).
--
--    ALREADY RAN setup.sql BEFORE THIS VERSION? Copy this section
--    (from the "8." line to the end) into the SQL Editor and run it.
--    Nothing is altered or dropped.
-- ============================================================
do $$
begin
  if to_regclass('storage.buckets') is not null then
    execute $q$ insert into storage.buckets (id, name, public) values ('labels', 'labels', true) on conflict (id) do nothing $q$;
    execute $q$ drop policy if exists "labels are public" on storage.objects $q$;
    execute $q$ create policy "labels are public" on storage.objects
      for select to anon, authenticated using (bucket_id = 'labels') $q$;
    execute $q$ drop policy if exists "owner may add labels" on storage.objects $q$;
    execute $q$ create policy "owner may add labels" on storage.objects
      for insert to authenticated with check (bucket_id = 'labels') $q$;
    execute $q$ drop policy if exists "owner may replace labels" on storage.objects $q$;
    execute $q$ create policy "owner may replace labels" on storage.objects
      for update to authenticated using (bucket_id = 'labels') with check (bucket_id = 'labels') $q$;
    execute $q$ drop policy if exists "owner may remove labels" on storage.objects $q$;
    execute $q$ create policy "owner may remove labels" on storage.objects
      for delete to authenticated using (bucket_id = 'labels') $q$;
  end if;
end $$;


-- ============================================================
-- 9. RESTOCKS: where each reorder is, and who wants an email when it lands
--    Two columns on inventory, set on the admin's Inventory screen for
--    any row at 0 and shown on the store's Restocks page:
--      restock_phase  1 = reorder pending, 2 = ordered and on the way,
--                     3 = arrived and in testing. NULL = nothing set;
--                     the store shows "Reorder pending" for a row at 0.
--      restock_date   the order date (phase 2) or the date it went to
--                     the lab (phase 3). The store counts down from it.
--    restock_notify holds the shoppers who asked for one email when an
--    item is back. The store writes it through restock_subscribe(); the
--    admin reads the counts through restock_waiting(); the store's own
--    server code (/api/restock-notify in _worker.js) sends the emails
--    and stamps notified_at, so nobody is emailed twice.
--    public_stock() is the read-only lookup the store calls with the
--    anon key on every page: counts and restock status, kits worked
--    out from their vial row, rows never counted left out.
--
--    ALREADY RAN setup.sql BEFORE THIS VERSION? Copy this section
--    (from the "9." line down to "Done") into the SQL Editor and run
--    it once. Nothing is altered or dropped.
-- ============================================================
alter table public.inventory
  add column if not exists restock_phase smallint check (restock_phase in (1, 2, 3)),
  add column if not exists restock_date date;

create table if not exists public.restock_notify (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  email text not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz,            -- set once the back-in-stock email went out
  unique (item_key, email)
);
alter table public.restock_notify enable row level security;
drop policy if exists "owner full access" on public.restock_notify;
create policy "owner full access" on public.restock_notify
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.restock_notify to authenticated;

-- The store's stock lookup: anyone may call it, it only reads.
create or replace function public.public_stock()
returns table(item_key text, qty integer, low_at integer, restock_phase smallint, restock_date date)
language sql stable security definer set search_path = public
as $$
  select i.item_key,
         case when i.parent_key is null then i.qty
              else floor(p.qty::numeric / greatest(coalesce(i.per_kit, 10), 1))::int end as qty,
         i.low_at,
         case when i.parent_key is null then i.restock_phase else p.restock_phase end as restock_phase,
         case when i.parent_key is null then i.restock_date  else p.restock_date  end as restock_date
  from public.inventory i
  left join public.inventory p on p.item_key = i.parent_key
  where (case when i.parent_key is null then i.qty else p.qty end) is not null;
$$;
revoke all on function public.public_stock() from public;
grant execute on function public.public_stock() to anon, authenticated;

-- "Email me when it's back": the store calls this with the item and the
-- shopper's email. Anyone may call it, but it only keeps a valid email
-- for a real item, once per item. Asking again re-arms a sent one.
create or replace function public.restock_subscribe(p_item_key text, p_email text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if length(v_email) > 200 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return false;
  end if;
  if not exists (select 1 from public.inventory where item_key = p_item_key) then
    return false;
  end if;
  insert into public.restock_notify (item_key, email)
  values (p_item_key, v_email)
  on conflict (item_key, email) do update set notified_at = null, created_at = now();
  return true;
end;
$$;
revoke all on function public.restock_subscribe(text, text) from public;
grant execute on function public.restock_subscribe(text, text) to anon, authenticated;

-- How many people are waiting on each item (the admin's Inventory rows).
create or replace function public.restock_waiting()
returns table(item_key text, waiting integer)
language sql stable security definer set search_path = public
as $$
  select item_key, count(*)::int
  from public.restock_notify
  where notified_at is null
  group by item_key;
$$;
revoke all on function public.restock_waiting() from public;
grant execute on function public.restock_waiting() to authenticated;


-- Done. No products are seeded: add your items on the admin's Inventory screen,
-- and set your look on the Look & layout screen.
