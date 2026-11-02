# Nanay website + admin

The original one-page design (video hero, bilao menu, party planner), now driven by data that staff edit at **/admin**.

## Run it

```bash
node app/server.mjs
```

- Website: http://localhost:4180
- Admin: http://localhost:4180/admin

Needs Node 20 or newer. No packages to install.

**First login:** the first start creates a random password and saves it in `app/data/FIRST-LOGIN-PASSWORD.txt`. Log in with it, change it under **Password** (that also deletes the file). To set or reset a password from the command line:

```bash
node app/server.mjs set-password "a long new password"
```

## What the admin can do

| Screen | What it changes |
|---|---|
| **Menu** | Add, edit, hide, mark sold out, reorder or delete dishes. Each dish has a name, a short line, a description, a photo (cropped to a circle automatically), sizes with prices and "good for" counts (per-person prices are worked out for you), badges (Bestseller, New, Nanay's pick, Frozen, Solo meal, Vegan, Spicy, Dessert), a selling line, allergens ("Contains"), heating/storage instructions, an order link, and whether the per-person planner suggests it. |
| **Categories** | The menu tabs, their order and intro line, an optional photo banner (e.g. an Instagram post), and which category holds the party packages. |
| **Instagram** | The strip of up to 12 post tiles: upload a square photo, paste the post link. |
| **Business info** | Phone, email, hours, pickup place and address (feeds the Google Maps link), delivery note, refund policy, online store link. |
| **Password** | Change the admin password (signs out other devices). |

Locally, changes are live as soon as they're saved and each save keeps a backup in `app/data/backups/` (last 30). Online (Vercel), each save is a commit to GitHub, so the commit history is the backup, and the site shows the change after Vercel rebuilds (about a minute).

## Files

- `server.mjs`: the local web server and admin API.
- `lib/site.mjs`: shared code that cleans saved menus and renders the page.
- `build-static.mjs`: renders the site to `static-build/` for Vercel.
- `../api/admin/[action].mjs`: the admin API on Vercel, saving to GitHub.
- `content/`: the menu, photos and password hash saved by the online admin (created on first save).
- `views/index.html`: the website template (the original design).
- `views/admin.html`: the admin panel.
- `public/`: photos, video, fonts and icons.
- `seed/menu.json`: the starting menu (used only when `data/menu.json` doesn't exist yet).
- `data/`: the live menu, uploaded photos, backups and the password hash. **Back this folder up** and keep it out of public file sharing.

## Hosting (free: Vercel + GitHub)

The live site runs on Vercel's free plan. Vercel has no disk, so the online admin saves into this GitHub repo instead (`app/content/`), and every menu save triggers a rebuild. Photo uploads and password changes are committed with `[upload]` and don't rebuild on their own (`ignoreCommand` in `vercel.json`); the next menu save picks them up, and until then `/uploads/*` is served from the repo by the API.

One-time setup in Vercel (Project → Settings → Environment Variables), then redeploy:

- `GITHUB_TOKEN`: a fine-grained GitHub token with **Contents: Read and write** on this repo only.
- `NANAY_ADMIN_PASSWORD`: the first admin password (10+ characters). After the owner changes it in the admin, the hash in `app/content/auth.json` is used instead.

Admin: `https://<your-site>/admin`. Before launch, remove the `noindex` line near the top of `views/index.html` so Google can list the site.

To run the full server elsewhere instead (a VPS, or a host with a persistent disk): start `node app/server.mjs`, set `PORT`, `NANAY_DATA_DIR` to the disk's path, and `NANAY_TRUST_PROXY=1` behind a proxy.

## Security notes

- Passwords are stored only as a salted scrypt hash.
- Logins use an HttpOnly, SameSite=Strict session cookie (12 hours). After 8 wrong passwords, logins from that address pause for 15 minutes.
- Admin changes must come from the admin page itself (same-origin check plus a custom header), so other sites can't submit them.
- Everything saved is cleaned on the server: unknown fields are dropped, text is length-limited, links must be https/sms/tel/mailto, and photos must be real JPG/PNG/WebP files (max 4 MB locally, 3 MB online).
- Online, sessions are signed cookies (the signing key comes from `GITHUB_TOKEN`); changing the password signs out other devices. Keep the GitHub repo **private**: it holds the password hash.
