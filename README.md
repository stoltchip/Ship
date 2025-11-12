
# Stolt‑Nielsen | Werkkleding (GitHub Pages + Supabase)

Een lichte webapp (statish) voor **werknemers** en **beheerder** (PIN: `2468`) om PBM te bestellen en voorraad te beheren.  
Front‑end: HTML/CSS/JS. Back‑end: [Supabase](https://supabase.com/).

## Demo features
- Wit thema met oranje accenten.
- Producten + maatkeuze (verplicht) en **maximaal één stuk per product**.
- Winkelwagen en bestelformulier (naam, e‑mail, afdeling, opmerkingen).
- Bestelling -> wordt opgeslagen in Supabase, **voorraad wordt verlaagd** via een stored function, en er opent een **mailto** naar je magazijn e‑mail als fallback.
- Beheerder‑tab met PIN `2468`: aantallen per product/maat invullen en **Opslaan** (Upsert naar Supabase).
- Werknemer ziet realtime voorraad (alleen lezen).

> Let op: PIN‑beveiliging is client‑side (toereikend voor interne tool). Voor echte beveiliging gebruik Supabase Auth en RLS policies met logins.

---

## 1) Supabase aanmaken
1. Maak een nieuw Supabase project aan.
2. Kopieer `Project URL` en `anon public` key.

### Tabellen & Policies
Open SQL editor en voer uit:

```sql
-- Product-agnostische stock tabel (per maat)
create table if not exists public.stock (
  slug text not null,
  size text not null,
  quantity integer not null default 0,
  primary key (slug, size)
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  name text,
  email text,
  department text,
  notes text,
  items jsonb not null
);

-- RPC: voorraad verlagen
create or replace function public.decrement_stock(p_slug text, p_size text, p_qty int)
returns void
language plpgsql
as $$
begin
  update public.stock
  set quantity = greatest(0, quantity - p_qty)
  where slug = p_slug and size = p_size;
end; $$;

-- ================= RLS =================
alter table public.stock enable row level security;
alter table public.orders enable row level security;

-- Voor een eenvoudige interne tool: iedereen (anon) mag lezen.
create policy "read stock" on public.stock for select using (true);
create policy "upsert stock" on public.stock for insert with check (true);
create policy "update stock" on public.stock for update using (true);

create policy "insert orders" on public.orders for insert with check (true);
create policy "read orders" on public.orders for select using (true);
```

> **Producten** zelf zitten in de front‑end. Je hoeft dus geen `products`‑tabel te maken. Voeg/wiizig producten via `app.js`.

### (Optioneel) E‑mail notificaties
Automatisch e‑mailen kan via een **Edge Function** + je mailprovider.  
In deze repo staat voorbeeldcode: `edge-functions/send-order-email` (niet noodzakelijk voor basiswerking).

---

## 2) GitHub Pages (frontend)
1. Zet alle bestanden uit deze map in een repository.
2. Activeer **GitHub Pages** (branch `main`, folder `/root`).
3. De site werkt direct, maar geef je Supabase credentials op in de browser (eenmalig):
   - Open de developer console of gebruik een bookmarklet en voer uit:
     ```js
     localStorage.setItem('SUPABASE_URL','https://<JOUW-PROJECT>.supabase.co');
     localStorage.setItem('SUPABASE_ANON_KEY','<JOUW-ANON-KEY>');
     localStorage.setItem('EMAIL_ONTVANGER','magazijn@jouwdomein.com');
     location.reload();
     ```
   - Of vervang de placeholders direct in `app.js` vóór je commit.

---

## 3) Beheerder gebruiken
1. Ga naar tab **Beheerder** → voer PIN `2468` in.
2. Klik **Initieer demo-data** om snel te starten (10 stuks per maat).
3. Pas aantallen aan en klik **Opslaan**. Dit schrijft naar `public.stock` en ververst de werknemer‑weergave.

---

## 4) Bestelproces (Werknemer)
1. Kies product → kies **maat** → **Toevoegen** (max. 1 per product).
2. Open **Winkelwagen**, vul naam/e‑mail/afdeling (e‑mail is verplicht).
3. **Bestelling plaatsen**:
   - App maakt een record in `orders`.
   - Voorraad wordt per item via `decrement_stock` verlaagd.
   - Fallback: er opent een mail (mailto) naar `EMAIL_ONTVANGER` met het overzicht.

> Wil je de e‑mail volledig automatisch? Gebruik de Edge Function/webhook oplossing in Supabase.

---

## 5) Producten
- Bodywarmer Hi‑Vis — maten: S, M, L, XL, 2XL, 3XL
- Werkjas Hi‑Vis — maten: S, M, L, XL, 2XL, 3XL
- Chemiepak Groen — maten: S, M, L, XL, 2XL
- Dunlop Laarzen (hoog) — EU 39–47
- Atlas Laarzen (hoog) — EU 39–47
- Atlas Schoenen (laag) — EU 39–47

Beschrijvingsteksten staan in `app.js`. Pas ze daar aan indien nodig.

---

## 6) Belangrijke notities
- Dit is een **statish** front‑end. De PIN is geen echte beveiliging.
- Wil je echte gebruikersrechten? Configureer Supabase Auth, maak service roles en schrijf strengere RLS policies.
- Als je andere producten/maatvoeringen wilt, update `PRODUCTS` in `app.js` en voer eventueel een seed uit in de beheerder.

---

## 7) Troubleshooting
- Zie je geen voorraad? → Maak tabellen via SQL hierboven en klik **Initieer demo-data**.
- `Plaatsen mislukt` → Controleer `SUPABASE_URL` en `ANON_KEY` in `localStorage` of `app.js`.
- CORS/Netwerk fout → Controleer of je project public network toelaat (Supabase policies).

Veel succes!
