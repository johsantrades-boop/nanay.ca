# Nanay — Higgsfield edit sheet

For running by hand in the Higgsfield app (higgsfield.ai). The connector in Claude can only read the catalog and your balance, not generate.
Balance on 2026-10-29: **110 credits** (Plus plan). Higgsfield shows the exact cost of each job before you press Generate. **Check the total before starting.**

**Goal:** take Nanay's real food photos and refine them slightly, as if the trays were being served on a table. **The food must stay their real food.** We change the setting and light, not the dish.

Save every result in this folder (`assets/generated/`) with the file name given below, then tell Claude. Claude will check each one against `copy/brand-kit.md` and the original photo.

---

## Settings for every photo edit

| Setting | Value |
|---|---|
| Tool | Image → **Nano Banana Pro** |
| Reference image | The original photo listed (from `assets/original-site/`). Upload the **full-size file**, not a screenshot. |
| Resolution | **2K** |
| Aspect ratio | **4:3** for menu photos, **16:9** for the hero |
| Count | Generate 2, keep the better one |

## Base prompt (paste first, then add the line for each photo)

```
Edit this exact photo. Keep the food exactly as it is: same dish, same portions, same garnishes, same aluminium tray or container, same arrangement and colours. Do not add, remove or restyle any food.

Change only the setting: the tray is now being served on a warm light-wood dining table at a Filipino family gathering, in soft natural daylight from a window. Around the tray, slightly out of focus: a cream linen runner, a fresh banana leaf, a small dish of halved calamansi, a small bowl of spiced vinegar, plain white plates and a few serving spoons. Overhead or 45-degree angle, true-to-life colour, bright and airy, gentle soft shadows.

No people, no faces, no hands, no text, no logos, no labels, no watermark. Photorealistic food photography, not illustration.
```

---

## Photo edits (10 + hero)

| # | Save as | Original to upload | Add this line to the base prompt | Aspect |
|---|---|---|---|---|
| 1 | `hero-feast-table-16x9.jpg` | `IMG-1808.png` (Party Feast). Add `2353A900-E97E-4625-87D2-2B395BEA4694.jpg` and `IMG-1806.png` as extra references. | "Wide hero shot: several of these exact trays (party feast, silog feast with fried eggs, grilled skewers) laid out together along the table as a generous spread. Leave calm empty space on the left third for a headline." | 16:9 |
| 2 | `table-silog-feast.jpg` | `2353A900-E97E-4625-87D2-2B395BEA4694.jpg` | "Breakfast setting: add a small cup of coffee and a jar of spiced vinegar at the edge." | 4:3 |
| 3 | `table-party-feast.jpg` | `IMG-1808.png` | "A birthday party table, festive but simple." | 4:3 |
| 4 | `table-inihaw-feast.jpg` | `IMG-1806.png` (4 trays of skewers, inasal and liempo) | "Replace the steel counter with the wooden table; the four trays sit side by side as a buffet." | 4:3 |
| 5 | `table-chicken-inasal.jpg` | `IMG-1803.png` | "Replace the steel counter with the wooden table." | 4:3 |
| 6 | `table-grilled-skewers.jpg` | `6E5E0921-3F33-4E08-9875-3A934C2234AA.jpg` | "Add a small bowl of spiced vinegar beside the skewers." | 4:3 |
| 7 | `table-palabok.jpg` | `image_ac40f320-1a7d-474b-8d54-026e19aa70b3.jpg` | "Show the edge of the tray and the table around it; the palabok stays exactly as is." | 4:3 |
| 8 | `table-filipino-spaghetti.jpg` | `image_f7d6cabd-c120-40d7-bdf4-bd53ccd1831c.png` | "Kids' birthday party mood: a few colourful paper plates." | 4:3 |
| 9 | `table-ube-halaya.jpg` | `86326010-7A57-44AA-B14A-AFD4D472FF41.png` | "Keep the same clear round deli container. Place it on the table with a dessert spoon; replace the concrete and grass background." | 4:3 |
| 10 | `table-leche-flan.jpg` | `IMG-7499.png` | "It is already on wood. Just brighten to daylight, lighten the table to light oak, and add a dessert spoon and linen." | 4:3 |
| 11 | `table-catering-spread.jpg` | `image_e0afbc15-d648-419a-82a6-dd6d07a70091.jpg`, plus `image_66cd5d43-07a2-4442-84cd-f50cf3b87e55.jpg` as an extra reference | "An event buffet table for a large party: these exact full-size trays in a row on a long table with a linen cloth, serving tongs in each tray, stacks of plates at the end." | 16:9 |

**Not edited:**
- **Inihaw Buckets and frozen packs:** they're raw products with printed labels, and the "no text" rule would remove the label. Keep the originals.
- **Text-card images** (the green 600×600 trays, "BEEF TAPA", "FIESTA FESTIVAL"): retired; the website rebuilds them as design.
- **Logo:** never AI-edit it. We need the vector file from the owner.

### Check each result before keeping it
- Same food as the original: count the eggs, skewers and calamansi roughly. Reject any image that invents dishes.
- No text, logo, faces or hands anywhere (look at plates and corners too).
- Daylight and cream/wood mood, matching the brand kit; not dark or moody.
- Trays still look like Nanay's real aluminium trays.

---

## Video edit: the landing-page hero

| Setting | Value |
|---|---|
| Tool | Video → **FLUX 3 Video Edit** |
| Input video | `gemini_generated_video_7524c679.mp4` (project root) |
| Cost | **1 credit per second**. The clip is 10.0 s (1280×720, 24 fps, has audio), so **about 10 credits** |
| Save as | `hero-video-edit.mp4` |

Prompt:
```
Keep the same food, camera movement and timing. Re-grade the whole clip to bright natural daylight: warm cream highlights, light wood, fresh green banana leaf, true-to-life food colour, soft shadows. Remove any dark or moody look. No people's faces, no text, no logos, no watermark.
```

**Current hero video (made locally with ffmpeg, 2026-10-29):** `hero-broll-1080.mp4` (3.7 MB), `hero-broll-720.mp4` (2.0 MB) and `hero-broll-poster.jpg`. It's a B-roll edit of the Gemini clip: prepared → grilled → served, with no faces.

| # | Shot (source time) | Treatment |
|---|---|---|
| 1 | Marinating in the bowl, calamansi (0.25–2.55 s) | Slow push-in |
| 2 | Threading skewers in the kitchen (2.70–3.92 s) | Push-in |
| 3 | Skewers over the flames (4.00–5.42 s) | Cropped tighter, 0.6× slow motion |
| 4 | Tongs turning a skewer (5.50–6.92 s) | Cropped tighter |
| 5 | Skewers on the banana-leaf board (7.00–7.95 s) | Cropped, 0.67× slow motion |
| 6 | Plated skewer with dipping sauce (9.32–9.99 s) | Cropped below the blurred guests, 0.5× slow motion |

- **Colour:** a daylight grade lifts shadows, lowers contrast, adds a warm cream tint and a soft glow. Average brightness went from 54–103 to 107–159 out of 255.
- **Cut out:** the family-table serving shot (8.3–9.3 s), because it shows faces.
- **Format:** 0.35 s dissolves between shots, no audio, and a seamless 8.0 s loop.

The build script is kept in Claude's scratchpad and can be re-run on the Higgsfield edit.

If you still run the Higgsfield daylight edit (optional now), the result can go through the same B-roll edit.

After it's saved, Claude will use ffmpeg (installed 2026-10-29) to make a seamless loop, strip the audio (the hero autoplays muted), and export small 720p and 1080p web versions plus a poster image. The source is 720p, so the 1080p version is an upscale; ask Higgsfield for 1080p output if offered.

---

## Rough credit budget (check in the app before running)

| Job | Count | Cost |
|---|---|---|
| Photo edits #1–11, 2 tries each | 22 images | Shown in app for Nano Banana Pro 2K; not available through the connector |
| Video edit | 1 clip, 10 s | about 10 credits |

If Nano Banana Pro 2K costs too much for 110 credits, run **one** try per photo, or switch to **Nano Banana 2** at 2K (cheaper, same prompts).

---

## For the owner list (found while choosing photos)

- The **Liempo Bucket** label (`image_59c55f89….png`) prints a Langley street address (looks like "…80 198 Street, Langley, BC", partly hidden by water drops) and "@nanaykitchen / www.nanay.ca". Is this the pickup address for Pureprep Langley? Confirm the exact number.
- The bucket label's cooking steps ("grill, bake, air-fry or pan-fry… turn every minute") differ from the website's frozen-liempo instructions ("4 minutes each side"). Which is current?
- The bucket label uses the same light aqua as the Instagram logo, which confirms aqua as a real brand colour.
