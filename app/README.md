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

Changes are live as soon as they're saved. Every save keeps a backup of the previous menu in `app/data/backups/` (last 30).

## Files

- `server.mjs`: the web server, admin API and page rendering.
- `views/index.html`: the website template (the original design).
- `views/admin.html`: the admin panel.
- `public/`: photos, video, fonts and icons.
- `seed/menu.json`: the starting menu (used only when `data/menu.json` doesn't exist yet).
- `data/`: the live menu, uploaded photos, backups and the password hash. **Back this folder up** and keep it out of public file sharing.

## Hosting

Any host that runs Node and keeps files between restarts works, for example Render (with a persistent disk), Railway (with a volume), Fly.io (with a volume) or a small VPS.

- Start command: `node app/server.mjs`
- Set `PORT` if the host requires it, and `NANAY_DATA_DIR` to the persistent disk's path.
- Optionally set `NANAY_ADMIN_PASSWORD` for the first start instead of using the generated file.
- Serve it over **HTTPS** (all of these hosts do by default); the login cookie is marked Secure automatically.
- Before launch, remove the `noindex` line near the top of `views/index.html` so Google can list the site.

Static-only hosts (Vercel or Netlify without a database) can't keep admin changes, because their file systems reset.

## Security notes

- Passwords are stored only as a salted scrypt hash.
- Logins use an HttpOnly, SameSite=Strict session cookie (12 hours). After 8 wrong passwords, logins from that address pause for 15 minutes.
- Admin changes must come from the admin page itself (same-origin check plus a custom header), so other sites can't submit them.
- Everything saved is cleaned on the server: unknown fields are dropped, text is length-limited, links must be https/sms/tel/mailto, and photos must be real JPG/PNG/WebP files (max 4 MB).
