# Nanay Shopify theme: install and admin guide

**Upload file:** `dist/nanay-shopify-theme.zip` (92 files, 3.8 MB; rebuild with `powershell -ExecutionPolicy Bypass -File tools/zip-theme.ps1`)
**Source:** `theme/`
**Checked with:** Shopify Theme Check (0 errors, 0 warnings), plus a local preview using the store's real products (`tools/preview/`).

The theme replaces only the *look* of nanay.ca. Products, prices, orders, customers, checkout and payments (Shop Pay, Visa, Mastercard, Interac) stay exactly as they are in Shopify.

---

## 1. Install (about 15 minutes, done by the store owner)

1. Shopify admin → **Online Store → Themes** → **Add theme → Upload zip file** → choose `nanay-shopify-theme.zip`.
   It arrives as an *unpublished* theme, so the live site isn't touched yet.
2. Create these pages in **Online Store → Pages**. For each one, set **Theme template** (right side) as listed:

   | Page title | URL handle | Template |
   |---|---|---|
   | Menu | `menu` | `page.menu` |
   | Catering & events | `catering` | `page.catering` |
   | How to order | `how-to-order` | `page.how-to-order` |
   | About | `about` (already exists) | `page.about` |
   | Contact | `contact` | `page.contact` |

   The page body can be left empty. The sections hold the content.
3. **Online Store → Navigation → Main menu**. Optional: add Catering, How to order, About, Contact.
   If the menu is left empty, the header shows those four pages automatically. The **Menu ▾** dropdown with the food categories is built in.
4. Click **Customize** on the new theme. Check each page, fill in **Theme settings → Business info** (pickup address, map link), then **Publish**.
5. Products with a text graphic as their first photo (Feast for 50, Fiesta Festival, Beef Tapa, the "Build your own" trays): in **Products**, drag a real food photo to the first position. Menu cards always use the first photo.

## 2. How the admin changes things (no code)

The "admin login" is the store's existing Shopify admin (nanay.ca/admin, or the Shopify app on a phone). It is the website's back end: every dish, photo, price and description on the site comes from it, so nothing needs a developer. Staff accounts can be added in **Settings → Users and permissions** with limited access (e.g. Products only).

### Add a new dish (about 2 minutes)

1. **Products → Add product.** Enter the title, description, price and photos (the first photo is the one on menu cards). For sizes or choices, add **Variants** (e.g. Mini / Half / Full).
2. Under **Product organization → Collections**, choose which menu category it belongs to (e.g. *Solo meals*, *Feasts to share*). It then appears on the Menu page, in the header **Menu ▾** dropdown and in any homepage section using that collection.
3. Optional: fill in the **extra info** fields at the bottom of the product page (see below), and add **tags** for badges.
4. **Save.** It's live straight away. To hide a dish without deleting it, set **Status → Draft**.

### One-time setup: extra info fields

**Settings → Custom data → Products → Add definition**, once per row (namespace and key must match):

| Name | Namespace and key | Type | Shows on the site as |
|---|---|---|---|
| Serves | `custom.serves` | Single line text | "Good for …" badge on cards and the product page |
| How to heat | `custom.heating` | Multi-line text | "Good to know → How to heat" on the product page |
| Contains | `custom.contains` | Single line text | "Good to know → Contains" (allergens, e.g. "shrimp, pork, egg") |
| Good to know | `custom.good_to_know` | Multi-line text | "Good to know → Also" (storage, spice level, anything else) |

Empty fields are simply hidden.

| To change… | Go to |
|---|---|
| A dish's name, price, photos, description, sold-out | **Products** |
| Which dishes appear in a menu category | **Products → Collections** (add/remove products). The Menu page and the header dropdown update automatically. |
| The categories on the Menu page, their order and notes | Theme editor → **Menu** page → *Full menu* section → Category blocks (drag to reorder) |
| The header **Menu ▾** dropdown | Theme editor → **Header** → *Menu category* blocks |
| Hours, phone, pickup place/address, delivery note, notice days, refund note | Theme editor → **Theme settings → Business info** (updates header, footer, product pages, cart, FAQ and Google data at once) |
| Feast planner packages ("serves" numbers, which products) | Theme editor → *Feast planner* section → Package blocks (on Home, Menu and Catering) |
| Dishes customers can add in the planner's "+ Add a dish or tray" list | Theme editor → *Feast planner* → **Extra dishes customers can add** (a collection; set to *Build your own party feast*). The packages and dessert are always in the list. |
| Solo meals on the homepage | Theme editor → *Solo meals* section → **Meals to show** (pick products), or **Or show a collection**. Text, the heating/storage note and the photo are in the same section. |
| Instagram strip | Theme editor → *Instagram strip* → Post blocks (up to 12). Upload a square photo and paste the post link. Instagram no longer offers a free automatic feed to themes, so tiles are chosen by hand; six recent posts are built in. |
| Homepage video | Theme editor → *Hero video* → **Video**. Upload a muted 6–15 s clip. The bundled skewers B-roll is used until one is chosen. |
| Reviews | Theme editor → *Reviews* → Review blocks |
| Colours | Theme settings → **Colors** (defaults are the approved brand kit) |
| "Good for X" badge on a dish | Comes from "(Good for X)" in the title, or a product metafield `custom.serves` (Settings → Custom data → Products → add *serves*, single-line text) |
| Vegan / Gluten-free / Bestseller / New / Frozen badge | Add that **tag** to the product |
| "How to heat", "Contains", "Good to know" | The product's extra info fields (see *One-time setup* above) |

## 3. What customers get

- **Sticky top bar** on every page with a **Menu ▾** dropdown that jumps straight to each food category, plus Catering, How to order, About, Contact, search, account, cart and **Order now**. On phones, a menu drawer plus a sticky **Text us / Order now** bar.
- **Menu page:** every category on one page, with a sticky category bar that highlights where you are and a search box. Single-option dishes have a one-tap **Add** button.
- **Feast planner:** guests + style → the cheapest mix of real feasts, total and price per person. Customers can then change the quantity of any line (− / +, or × to remove it) and add more dishes from a list. The total, price per person and "feeds about X" update as they go, with a warning if the order feeds fewer people than the guest count. "Reset to suggestion" starts over. One button pre-fills a text to Nanay with the edited order; another adds it to the cart.
- **Solo meals** on the homepage and as a Menu category ("Solo meals available for work lunches", from Instagram).
- **Instagram strip** of recent @nanaykitchen posts, each linking to the post.
- **Product pages:** options as tap buttons instead of long dropdowns, "Good for" badge, pickup/delivery/notice info, "Questions? Text Nanay", and "Complete the feast" suggestions.
- **Cart drawer:** opens without leaving the page. Customers choose **Pickup or Delivery**, the **date** (earliest = today + notice days), a **preferred time** and **notes**. These show on the order in Shopify admin under *Additional details*. Checkout is blocked with a friendly message if the date is missing or a delivery order is under the minimum.
- **Catering page:** party packages 15–100 with what's included, the planner, reviews, an **enquiry form** (date, guests, pickup/delivery, event type, budget, dietary needs; emailed to the store) and an FAQ.
- **How to order, About, Contact, Search, 404**, customer **log in / sign up / order history**.
- Google-friendly: real page titles and descriptions, business details (hours, phone, city) and FAQ markup.
- Accessible: 4.5:1 text contrast, keyboard and screen-reader friendly menus and drawers, 44 px tap targets, and motion that respects "reduce motion" (the hero video has a pause button).

## 4. Check after installing (things the preview couldn't test)

- **Apps:** the current store uses Yotpo (reviews), a delivery-slot app (logbase) and an upsell app. Open a product and the cart on the new theme and confirm they still appear where wanted. If the slot app already asks for the date, turn off **Theme settings → Cart and ordering → Ask for the date in cart** so customers aren't asked twice.
- **Enquiry emails:** submit a test catering enquiry and confirm it reaches info@nanay.ca (Shopify sends contact-form emails to the store's sender email).
- **"Complete the feast" suggestions** come from Shopify and only appear on the real store; they can't be previewed locally.
- **Customer accounts:** the theme includes the classic account pages. If the store uses *new* customer accounts, Shopify hosts those pages itself, which is fine.

## 5. Still to confirm with the owner (shown on the site with current wording)

These come from `copy/brand-kit.md` §8 and are editable in Theme settings or the theme editor:
- **Pickup address**: now "Pureprep Commissary Kitchen, 301-20381 62 Ave", taken from the store's Instagram captions (Oct 2026), with a Google Maps search link. Confirm, or replace with an exact map link.
- **Solo meals**: the homepage section and the *Solo* Menu category are set up, but in Shopify the current Solo Silog ($20) and Solo Shrimp ($24) have **no photos and are in no collection**. Add photos, and add them to the **Solo** collection (it currently only holds an older sold-out "SOLO Silog"). If the meals are sold frozen, say so in the section's *Heating or storage note* and tag them **Frozen**.
- The nine hidden **"TMWANDER-…"** products (e.g. Chicken Inasal Rice $15, Beef Mechado $20) look like a wholesale or partner list, so the site doesn't show them. If they're actually the frozen solo meals, rename them, add photos and put them in the Solo collection.
- **Delivery** area and fee (the site says "Delivery available. Minimum $30 purchase for delivery.").
- **Notice days** (set to 3, based on the "modify up to 3 days before" policy).
- Pickup **time slots** in the cart (set to 10am–12pm, 12–2pm, 2–4pm, 4–6pm to match the 10am–6pm hours).
- Serving sizes used by the planner: Party Feast 15 (link says 12–13), Inihaw Feast 6 (description says 6–8).
- The FAQ answer "everything on the menu can go in one order" (from "Warehouse + Kitchen items can be combined").
- The homepage headline is "Nanay", set in Cormorant Garamond (hero title only; everything else keeps Lilita One). It can be changed in the theme editor under Hero video → Heading.

## 6. Local preview (for developers)

```bash
node tools/preview/server.mjs
```
Opens on http://localhost:4174 with the store's real products (`tools/preview/fetch-data.mjs` refreshes them). It imitates Shopify closely but not exactly; the real check is Shopify's own theme preview before publishing.

```bash
node tools/check.mjs
```
Runs Shopify Theme Check.
