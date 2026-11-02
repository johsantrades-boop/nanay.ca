# Nanay — brand kit for the redesign

**Rule: keep the brand, replace the execution.** The name, the brown wordmark, the aqua from Instagram, the food and the voice all stay. What changes is the old Debut theme, the beige-on-beige layout, the single font, and the long product dump.

Sources: `copy/content.md` (all real copy), `assets/original-site/IMAGE-LIST.md` (photos), the live site and the @nanaykitchen Instagram (checked 2026-10-29). Motion and flow reference: buckssauce.com, but **bright, not dark**.

**Status: approved 2026-10-29.** Items marked **⚑ OWNER** still need checking with Nanay before launch.

---

## 1. Colour

### What the brand already uses (measured, not guessed)

| Colour | Hex | Where it comes from |
|---|---|---|
| Espresso brown | `#392618` | Logo wordmark (sampled from the PNG) and every text/button colour on nanay.ca |
| Beige | `#E6D9CD` | nanay.ca page background |
| Light aqua | `#B8E0E8` | Favicon badge and Instagram profile circle (sampled from the favicon file) |
| Black / greys | `#000`, `#949494` … | Theme defaults, not brand. Drop. |

The old site's problem is that everything is brown on beige: low energy, and nothing for a button to stand out against. The food photos bring the missing colours: annatto-orange grilled meat, egg yolk, banana-leaf green, ube purple and calamansi.

### New palette

| Role | Name | Hex | Use | Contrast (WCAG) |
|---|---|---|---|---|
| Background | Rice cream | `#FFF9F0` | Page background. Brighter, cleaner version of the old beige. | — |
| Surface | White | `#FFFFFF` | Cards, product tiles, forms, menus | — |
| Surface alt | Sand | `#F4E9DC` | Every other section band, so long pages have rhythm (the old beige, lifted) | — |
| Text | Espresso | `#392618` | All headings and body copy. **This is the logo colour, kept exactly.** | 13.7 on cream · 12.0 on sand ✅ |
| Muted text | Toasted | `#6B5444` | Captions, "Good for 6–8", helper text, footer | 6.7 on cream · 5.9 on sand ✅ |
| **Primary accent** | Inihaw | `#C2410C` | Main buttons (Order, Add to cart), links, price highlights. Annatto/grill-char orange from the food itself. | White text on it 5.2 ✅ · as text on cream 5.4 ✅ |
| Primary hover | Inihaw dark | `#9A3412` | Hover and pressed state | White text 7.3 ✅ |
| **Secondary accent** (optional) | Nanay aqua | `#BFE4EA` | Background blocks only: tags, the "How ordering works" band, review cards, the loader. **Never for text.** This is the Instagram/favicon aqua, slightly cleaned up, so the site and Instagram finally match. | Espresso text on it 10.6 ✅ |
| Secondary text | Deep aqua | `#1F5E6B` | Only if aqua is ever needed as text or an icon colour | 7.0 on cream ✅ |
| Border | Rice paper | `#E7D8C6` | Dividers, card outlines (decorative) | — |
| Control border | — | `#8F7966` | Input and select outlines, which must be visible | 3.9 on cream ✅ (needs ≥ 3:1) |
| Highlight (sparingly) | Yolk | `#F6B73C` | Small badges such as "Bestseller" or "Feeds 100" and illustration accents. Never a button. | Espresso text on it 8.0 ✅ |

```css
:root {
  --bg: #FFF9F0;  --surface: #FFFFFF;  --surface-alt: #F4E9DC;
  --text: #392618; --text-muted: #6B5444;
  --primary: #C2410C; --primary-hover: #9A3412; --on-primary: #FFFFFF;
  --secondary: #BFE4EA; --secondary-ink: #1F5E6B;
  --border: #E7D8C6; --border-control: #8F7966;
  --highlight: #F6B73C;
}
```

Rules:
- One orange button per screen. Everything else is an espresso outline or a text link.
- Use aqua and yolk as colour blocks, not as decoration on every element.
- Photos carry the colour, and the UI stays calm around them.
- Dark mode isn't needed for launch. This is a bright brand on purpose.

---

## 2. Typography

| Role | Font (Google Fonts) | Why |
|---|---|---|
| **Headings / display** | **Lilita One** | Chunky, rounded and friendly, the closest Google font to the hand-drawn feel of the NANAY wordmark. At big uppercase sizes it gives the Bucks-style giant section words ("FEASTS", "REVIEWS") a warm home-cooking version instead of a hot-sauce-brand one. It's rare on AI-built sites. |
| **Body / UI** | **Hanken Grotesk** (400, 500, 700) | Clean and slightly warm, with good figures for prices ($1,080.00) and easy reading at 16px on phones. It isn't one of the overused defaults (Inter, Poppins, Montserrat, DM Sans). |

Avoid: Inter, Poppins, Montserrat, Playfair, Fraunces, DM Sans, Space Grotesk, Asap (the old site font).

| Style | Font | Size (mobile → desktop) | Notes |
|---|---|---|---|
| Display | Lilita One | 56 → 128px | Uppercase, line-height 0.95, for 1–3 word moments only |
| H1 | Lilita One | 40 → 72px | |
| H2 | Lilita One | 30 → 48px | |
| H3 / product name | Hanken Grotesk 700 | 20 → 24px | |
| Body | Hanken Grotesk 400 | 16 → 18px | line-height 1.6, max ~65 characters per line |
| Small / labels | Hanken Grotesk 500 | 14px | Serving sizes, tags. Never below 14px. |
| Price | Hanken Grotesk 700 | 18px | `font-variant-numeric: tabular-nums` |

Lilita One has only one weight, so all hierarchy comes from size and colour. Keep it for headings; never set body text in it.

---

## 3. Positioning

**Nanay is the Filipino kitchen you call when you're feeding people.** Party trays and feasts for 4 to 100 from a small Langley kitchen. Grilled over charcoal, cooked with local ingredients, and delivered on time, so the host gets the credit.

The proof is already in the reviews: "Hindi ka mapapahiya sa bisita" (you won't be embarrassed in front of your guests), "plates were cleaned", "arrived ahead of schedule".

What makes it different from other Filipino caterers:
1. **Sized for the occasion.** Mini (4) → Feast (6–8) → Party (15) → Fiesta (30–35) → 50 → 100. Nobody has to work out quantities.
2. **Inihaw done properly.** Charcoal-grilled liempo, inasal and skewers, plus raw marinated buckets and frozen packs to grill yourself.
3. **Local and small-batch.** Ingredients come from BC small businesses and farmers, such as Coligny Creek eggs.

## 4. Target audience

| Who | What they need from the site | Products |
|---|---|---|
| **Filipino-Canadian hosts** (birthdays, handaan, family gatherings) in Langley, Surrey and Metro Vancouver. The core customer. | Feeds how many, what's included, price, how to get it there, order by date | Party/Fiesta Feasts, BYOF trays, desserts |
| **Non-Filipino hosts and office organisers** who want something different for a party | Plain-English dish explanations, "good for X", easy ordering, dietary info | Feasts, Half/Half trays, Inihaw Feast |
| **Families wanting a weeknight or weekend treat** | Quick order, pickup info | Silog Feast, Mini Inihaw Feast, Solo Silog |
| **Grillers and campers** | What's in the bucket, how to cook it | Inihaw Buckets, Frozen goods |
| **Couples planning weddings and big events** | Proof they can handle 100+, packages and an enquiry form | Fiesta Festival, Wedding Packages ⚑ |

Most visitors come from Instagram on a phone, so design mobile-first.

## 5. Brand personality

- **Warm like a nanay.** Generous, feeding you more than you asked for. "Cooked with love" is in their own mission.
- **Proudly Filipino, casually bilingual.** Tagalog words like handaan, ulam, inihaw and jowa are used naturally and explained lightly, never as a gimmick.
- **Confident about the food.** It doesn't need hype. Let the trays and the reviews talk.
- **Playful but not jokey.** "Sweets but not too sweet" and "PRO-TIP: ask us for crispy fried wok eggs" is the tone.
- **Inclusive.** The Instagram bio shows 🇵🇭🇨🇦🏳️‍🌈. ⚑ OWNER: do they want the pride flag on the site too?

Voice do: short sentences, specific numbers ("30 skewers", "good for 6–8"), sensory words (smoky, crispy, garlicky), the occasional "Maraming salamat".
Voice don't: corporate catering-speak, ALL-CAPS paragraphs, exclamation-mark stacks.

## 6. Visual mood

**"Sunday lunch at Nanay's, in daylight."** Bright, generous and abundant.

- **Light:** natural daylight, a cream background, food photographed from overhead.
- **Hero imagery:** the existing overhead tray shots on beige (Silog Feast `2353A900…`, Party Feast `IMG-1808.png`, Grilled Skewers `6E5E0921…`). They already match this mood and are high resolution.
- **Motion (borrowed from Bucks Sauce, brightened):**
  - Logo intro on aqua.
  - Big video hero (Instagram Reels or the Gemini clip).
  - A pinned section where the party sizes stack up 4 → 100.
  - Giant Lilita One words that scale in.
  - A sideways strip of vertical Reels for reviews.
  - Everything respects reduced-motion settings.
- **Graphic motifs:** banana-leaf green and calamansi slices as small floating cut-outs (like Bucks' peppers); foil-tray rectangles as card shapes; aqua blobs echoing the Instagram logo circle.
- **Photo rules:** overhead shots go large; phone shots on steel counters stay small (gallery only); text-on-green cards are retired and rebuilt as real UI.
- **Not this:** dark backgrounds, stock photos of generic Asian food, AI-looking illustrations.

---

## 7. Pages and sections, with the real copy for each

Copy references point to `copy/content.md`. "NEW" means copy has to be written and approved by the owner.

### 7.1 Home `/`

| # | Section | Real copy that goes here | New / owner |
|---|---|---|---|
| 1 | **Intro loader:** logo on aqua, about 1s | Logo: "NANAY / FILIPINO COMFORT FOOD" | ⚑ Vector logo file |
| 2 | **Announcement bar** | "Text (604) 652-1930 for any questions! 💗" (site-wide), shortened on mobile to "Text (604) 652-1930" | |
| 3 | **Hero:** video background (Reels/Gemini clip), giant headline, 2 buttons | Supporting line from the Kitchen collection: "Fresh off the wok, grill, and fire!" · Buttons: "Order a feast" / "Catering & events" | NEW headline, e.g. "FEEDING YOUR PEOPLE SINCE ⚑" |
| 4 | **What "Nanay" means:** scattered word reveal | About page: "*Nanay*: mother in Tagalog, or an affectionate or honorific term for an older woman" + first sentence of the mission | |
| 5 | **Feeds how many?** Pinned stacking cards, 4 → 100 (the Bucks "claims" section, reworked) | Names and prices: MINI Inihaw Feast (Good for 4) $80 · Silog Feast (Good for 6-8) $160 · INIHAW Feast (Good for 6) $140 · Party Feast (Good for 15 people) $350 · Fiesta Feast (Good for 30-35 people) $620 · Feast for 50 $1,080 · Fiesta Festival (Good for 100) $2,000 | ⚑ Serving-size conflicts (see §8) |
| 6 | **Silog spotlight** | Kitchen collection copy: "Silogs are the staple to Filipino breakfast. But better throughout the day. Very comforting, tastes nostalgic, and feels like home…" + "PRO-TIP: ask us for crispy fried wok eggs" | |
| 7 | **Inihaw: grilled over charcoal** | Kitchen collection Inihaw text: "'The Skewers' are tender pork marinated in a sweet and savoury Filipino bbq sauce. 'Chicken Inasal' is boneless chicken legs … grilled over charcoal…" + Toyomansi and Spiced Vinegar lines | ⚑ Vegan Shrooms Skewers still offered? |
| 8 | **Menu highlights:** horizontal cards linking to Menu | Section titles kept: "FOR PARTIES AND HANDAAN", "SWEETS BUT NOT TOO SWEET", "INIHAW BUCKETS FOR PICNICS AND CAMPING", "FROZEN GOODS" | |
| 9 | **Why Nanay:** 01 / 02 / 03 | 01 Local: "We source only high quality ingredients locally through other small businesses and farmers in BC" · 02 Free-range eggs from Coligny Creek Co. (from product copy) · 03 Grilled over charcoal | Short headings NEW |
| 10 | **Reviews:** big outlined "REVIEWS" + quote-card strip (Reels added later, see §9) | All 9 reviews verbatim (Joshua M., James M., Shawn G., Jackie T., Madelene T., Vero R., Eleanor C., Vivian H., Julian E.). Lead with Vero R. ("Hindi ka mapapahiya sa bisita") and Julian E. | ⚑ Permission to use customers' Reels |
| 11 | **How ordering works:** aqua band, 3 steps | Hours "Mon-Sun 10am-6pm" · Pickup "Pureprep Langley" (both Instagram only) · "Minimum $30 purchase for delivery." · "Orders can be modified up to 3 days before…" | ⚑ Address, delivery area/fee, lead time |
| 12 | **Catering call-out** | "For parties and handaan" + Fiesta Festival "Good for 100 Guests" | NEW short pitch |
| 13 | **Newsletter** | "SUBSCRIBE TO OUR NEWSLETTER / Sign up for exclusive discounts and the latest updates" | ⚑ Is a newsletter actually sent? |
| 14 | **Footer** | info@nanay.ca · (604) 652-1930 · Instagram · refund note · hours · pickup | Add Threads link |

### 7.2 Menu / Shop `/menu` (replaces the homepage product dump; Shopify collections behind it)

Filter tabs. Each card shows name, "Good for X", price "from $", and a tag (Vegan / Raw / Frozen).

| Tab | Products (names and prices from content.md) |
|---|---|
| Silogs & solo meals | SILOG FEAST · SOLO Silog ⚑ · Solo Shrimp ⚑ · Jowa Set (Good for 2 People) ⚑ |
| Feasts | INIHAW Feast · MINI Inihaw Feast · Half/Half Inihaw Tray · Party Feast · Fiesta Feast · Feast for 50 · Fiesta Festival · Feast for 20 ⚑ |
| Build your own feast (trays) | Inihaw na Liempo Tray · Chicken Inasal Tray · Beef Tapa Tray · Longganisa Tray · Skewers Tray · Palabok Tray · Filipino Style Spaghetti Tray · Steamed Jasmine Rice ⚑ · Tofu Sisig ⚑ · Veggie Pancit Canton ⚑ |
| Noodles | Palabok · Filipino Style Spaghetti (⚑ merge with the tray versions? They're the same item and price) |
| Inihaw buckets (ready to grill) | Chicken Inasal Bucket · Liempo Bucket · Skewers Bucket |
| Frozen | Frozen Chicken Inasal · Frozen Skewers · Frozen Liempo · Frozen Beef Tapa |
| Desserts | Ube Halaya · Leche Flan |
| Sauces & extras | Nanay Vinegar ⚑ · Dale's Chili Bomb Garlic Sauce ⚑ (sold out) |

Intro copy: "Fresh off the wok, grill, and fire!"

### 7.3 Product page template

| Section | Copy |
|---|---|
| Gallery | Product photos (A/B grade only; text-card images retired) |
| Name, "Good for X" badge, price | From the product |
| Options | Rebuilt as clear choice chips instead of 3 dropdowns. E.g. Party Feast: "Meat tray", "Half/half tray", "Noodles", using existing option names |
| What's included | Product description, verbatim |
| How to cook | Frozen/bucket items: the "GRILLING INSTRUCTIONS" verbatim |
| Pickup and delivery reminder | Same facts as Home §11 |
| You might also need | Rice, vinegar, desserts |

### 7.4 Catering & events `/catering`

| Section | Copy |
|---|---|
| Hero | NEW headline; Instagram bio line "Takeout/Delivery/Catering/Events" |
| Party sizes table (15 / 30–35 / 50 / 100) | Full "includes" lists of Party Feast, Fiesta Feast, Feast for 50, Fiesta Festival, verbatim |
| Weddings | Wedding Packages copy: Package 1 $65 / 2 $75 / 3 $95 per person, salads/carbs/mains/desserts, "Crispy Pata and Lechon Kawali Carving Station" ⚑ |
| Deposits and substitutions | "*Payment/deposit required to confirm order and reserve event's date and time" · "*Deposits are non-refundable" · "*Contact us for any substitutions at (604) 652-1930" |
| Proof | Reviews from Vero R. and Julian E. |
| **Enquiry form** | NEW: date, guest count, pickup/delivery, budget, dietary needs, message |

### 7.5 About `/about`

| Section | Copy |
|---|---|
| Name meaning | "*Nanay*: mother in Tagalog, or an affectionate or honorific term for an older woman" |
| Mission | "Our mission is to share the most comforting and nostalgic Filipino food. We source only high quality ingredients locally through other small businesses and farmers in BC to prepare and cook with love." |
| Our story | **NEW ⚑**: who started Nanay, who the nanay is, when, why. The current About is only two sentences. |
| Local partners | Coligny Creek Co. eggs, Pureprep Langley ⚑ (others?) |
| Team/kitchen photos | From Instagram Reels ⚑ |

### 7.6 How to order + FAQ `/how-to-order`

| Question | Real answer we have |
|---|---|
| How do I order? | "Text (604) 652-1930 to order" / "Order Online www.nanay.ca" |
| Where's pickup? | "Pickup: Pureprep Langley" ⚑ full address, entrance and parking |
| Hours? | "Mon-Sun 10am-6pm" |
| Do you deliver? Where? Cost? | "Minimum $30 purchase for delivery." ⚑ area and fee (reviews mention "free delivery" and delivery to Vancouver) |
| How far ahead? | ⚑ unknown |
| Changes and cancellations | Refund/Cancellation Policy, verbatim |
| How do I cook the frozen packs? | Grilling instructions, verbatim |
| Allergens / vegan / gluten-free? | ⚑ unknown. Palabok has dried shrimp and pork; spaghetti has SPAM; Tofu Sisig, Veggie Pancit Canton and mushroom skewers may be vegan. |
| Can I combine items? | "Warehouse + Kitchen items can be combined." (⚑ reword; "Warehouse" is internal jargon) |

### 7.7 Contact `/contact`

Phone/text, email, Instagram, Threads, hours, pickup map, a short form, and a link to the catering enquiry.

### 7.8 Policies (Shopify policy pages, currently all 404)

Refund & cancellation (existing text), plus Privacy, Terms and Shipping/Delivery. **⚑ All NEW.** Shopify can generate templates, but the owner must confirm them.

### Navigation

Header: **Menu · Catering · How to order · About** · Cart · primary button "Order now".
Mobile: logo, cart, menu button, and a sticky bottom "Order now" bar.

---

## 8. Check with the owner (outdated, conflicting or missing)

**Missing facts the site needs**
1. Full pickup address for "Pureprep Langley", plus parking and entrance details. (Lead: the Liempo Bucket label prints "…80 198 Street, Langley, BC", partly hidden by water drops. Confirm the exact number.)
2. Are the hours "Mon-Sun 10am-6pm" (Instagram) still right? Are they pickup hours or kitchen hours?
3. Delivery: area, fees, and is it really free? (Madelene T. says "free delivery"; Julian E. paid to add delivery to Vancouver; one collection says a "Minimum $30 purchase for delivery.")
4. How many days ahead to order, per product size. Is there a minimum notice for 50/100?
5. Allergens and dietary labels: vegan, gluten-free, contains shellfish/pork.
6. An About story: founder, who "Nanay" is, the year they started.
7. The logo as a vector (SVG/AI/PDF). Which logo is official: the brown wordmark or the aqua circle?
8. Privacy, terms and shipping policies, which are all missing.
9. Permission to use customers' Instagram Reels and photos in a reviews strip.
10. Is a newsletter actually being sent?

**Conflicting or outdated copy**
11. Party Feast: the title says "Good for 15 people" but the link says "good-for-12-13-people". Which is right?
12. INIHAW Feast: the title says "Good for 6" but the description says "Good for 6-8 people".
13. Silog Feast: the product says "Good for 6-8" but the Kitchen collection says "Share and enjoy Silogs with 6 of your loved ones".
14. Silog Feast is listed as "from $100.00", and its link is still "mother-s-day-weekend-silogs".
15. Filipino Style Spaghetti's link says "new-years-eve-only", and Frozen Skewers' link says "new-years-eve-feature".
16. Frozen Liempo's options are labelled "Skewers" (20 PCS $50 / 12 PCS $30). Should be "Pack size".
17. Kitchen collection mentions "Vegan Shrooms Skewers", but no such product exists.
18. Two Solo Silog products: one sold out at $22, one hidden at $20. Which is current? Is Solo Shrimp ($24) on the menu?
19. Tofu Sisig and Veggie Pancit Canton are hidden on the site but pinned on Instagram ("PANCIT CANTON / TOFU SISIG"). Should they be on the menu? They also need descriptions.
20. Hidden products: Feast for 20 ($470), Jowa Set, Steamed Jasmine Rice, Tapa Only, Liempo Only, Nanay Vinegar ($7). Which should be public?
21. Probably internal items to hide: 9 × "TMWANDER-…" products and "Kitchen Booking Fee". What are they?
22. Wedding Packages are sold out and say "Please contact us for menu options". Are weddings still offered, and at these prices?
23. Dale's Chili Bomb Garlic Sauce has all 5 flavours sold out. Keep it or drop it?
24. Seasonal leftovers: Christmas Feature ("Only Available between December 19-24", empty), NYE Feature (empty), Family Day Weekend. Is the Christmas menu coming back for 2026?
25. "Warehouse + Kitchen items can be combined." is internal jargon. Is it still true?
26. "PRO-TIP: ask us for crispy fried wok eggs". Still true for online orders?
27. Reviews have no dates or source. Are they from Google, Yotpo or texts? Can more recent ones (or Google reviews) be added?
28. ~~Public name~~: decided as "Nanay" (see §9). Julian E.'s review says "Nanay Kitchen"; that stays verbatim in the quote.

---

## 9. Decisions (confirmed by the user, 2026-10-29)

| Question | Decision |
|---|---|
| Platform | **Stay on Shopify.** Redesign the theme; products, cart and checkout keep working. |
| Main goal | **Catering leads.** The homepage hero, the "Feeds how many?" section and the main button all point to party feasts and catering. Everyday meals (silogs, solo) come second. |
| Public name | **"Nanay"**, not "Nanay Kitchen". The @nanaykitchen handle stays as the Instagram link only. |
| Instagram Reels export | **Not for now.** Launch video comes from the Gemini clip (`gemini_generated_video_7524c679.mp4`) and still photos. The Reels review strip becomes a quote-card strip, with Reels slotted in later. |
| Old `site/` build | **Start fresh** from this kit. Keep the **feast planner** idea from it (below). |
| Wordmark | Stays as is; only its surroundings change. |

## 10. Feature carried over: the feast planner

From the old `site/index.html` build, rebuilt in the new look.

**Where:** a short teaser on Home (right after "Feeds how many?") and the full version on the Catering page.

**How it works (keep):**
- Guest count with − / + buttons and a slider (2–150).
- Style choice: "Party spread" / "Inihaw" / "Silog".
- Optional "Add dessert (ube halaya or leche flan)".
- It suggests the cheapest mix of real menu feasts that covers the headcount, using the real prices and "good for" sizes from content.md. Party spread uses the party packages, topped up with small inihaw feasts.
- It shows a receipt-style list, the total, the price per person, and "Planned for X+ guests".
- **"Text this order"** opens a pre-filled text to (604) 652-1930: "Hi Nanay! I'd like to order for 20 guests: … (est. $…). What dates are available?" This matches how they already take orders. There's also an "Order online" link to the first product.
- Note under it: "Estimate from menu prices and serving sizes, before delivery and taxes. Your order is confirmed with Nanay by text."

**Change in the new version:**
- New palette and fonts: a receipt card on white, the total in Lilita One, and the orange "Text this order" as the one primary button.
- The guest count and total announce politely to screen readers; the − / + buttons are at least 44px.
- ⚑ OWNER: the planner is only as right as the serving sizes, so items 11–13 in §8 (Party Feast 15 vs 12–13, Inihaw 6 vs 6–8, Silog 6 vs 6–8) must be confirmed first. It currently plans from the low end of each range.
- ⚑ OWNER: should it add a delivery estimate once fees are known?
