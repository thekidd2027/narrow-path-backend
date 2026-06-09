# Narrow Path Camp — Connected App Build Kit

This kit turns your camp app into a **cloud-connected, multi-device, always-saved** app
backed by your Softr database. When it's done:

- The app opens on any phone or browser at one web address.
- Everyone sees the same live data.
- Edits (rosters, check-ins, wording, anything) save to the cloud for everyone.
- Your custom features (auto-session, shuffle, where-am-I, add/change player) stay.

There are **three pieces** to stand up, in order. None require you to be a programmer —
just to follow steps and copy/paste a couple of values. Budget ~45–60 minutes.

```
   [ Camp App in browser ]  →  [ Backend broker ]  →  [ Softr database ]
        (Netlify)                 (Render)              (already built)
   public, no secrets        holds the secret token      your data
```

The **backend broker** exists for one reason: your Softr token must never sit in the
public app code (anyone could read it and edit your data). The broker holds the token
privately and is the only thing that talks to Softr.

---

## PIECE 1 — Generate a fresh Softr token

1. Log into Softr → your account settings → the API / Personal Access Tokens area.
2. Create a **new token with write access** to your workspace.
3. Copy it somewhere safe for the next step. **Do not paste it into any chat.**
   (If you ever paste it somewhere public, revoke it and make a new one.)

---

## PIECE 2 — Deploy the backend broker (Render, free tier)

The `np-backend` folder in this kit is the broker. We'll host it on **Render**
(free, simple, no credit card for the free tier).

1. Put the `np-backend` folder in a **GitHub repo**:
   - Create a free GitHub account if needed.
   - Make a new repository (e.g. `narrow-path-backend`), and upload the four files
     from `np-backend`: `server.js`, `package.json`, `.gitignore`, `.env.example`.
     (You can drag-and-drop them in GitHub's "Add file → Upload files".)
   - Do **not** upload a real `.env` file. The token goes in Render's settings instead.

2. Create the service on Render:
   - Sign up at render.com → **New → Web Service** → connect your GitHub repo.
   - Settings:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Instance type:** Free
   - Under **Environment** add these variables:
     - `SOFTR_API_KEY` = your fresh write token from Piece 1
     - `SOFTR_DATABASE_ID` = `a868e883-c095-487b-9673-8839e60266ba`
     - `ALLOWED_ORIGIN` = `*`  (we'll tighten this in Piece 3)
   - Click **Create Web Service** and wait for it to deploy.

3. Render gives you a URL like `https://narrow-path-backend.onrender.com`.
   Open it in a browser — you should see **"Narrow Path backend is running."**
   Then try `https://narrow-path-backend.onrender.com/api/table/campers` —
   you should see your 60 campers as JSON. If you do, the broker works. 🎉

   > Note: Render's free tier "sleeps" after inactivity, so the first request after a
   > quiet period can take ~30 seconds to wake up. Fine for camp use; if you want it
   > always-on, Render's cheapest paid tier removes the sleep.

---

## PIECE 3 — Point the app at the backend and host it

1. In the app file (`narrow-path-camp.html`), near the very top of the script there is
   a line that reads:

   ```js
   const BACKEND_URL = ""; // <-- set this to your Render URL
   ```

   Set it to your Render URL from Piece 2, for example:

   ```js
   const BACKEND_URL = "https://narrow-path-backend.onrender.com";
   ```

   (If you leave it blank, the app simply runs in its old local-save mode — so it always
   works even before the backend exists.)

2. Host the app on **Netlify** (same as you've done before):
   - Rename the file to `index.html`.
   - Drag it onto Netlify's deploy area.
   - You get a public URL, e.g. `https://narrow-path-camp.netlify.app`.

3. **Tighten security:** go back to Render → your service → Environment, and change
   `ALLOWED_ORIGIN` from `*` to your Netlify URL
   (e.g. `https://narrow-path-camp.netlify.app`). Save; Render redeploys.
   Now only your app can use the broker.

That's it. Open the Netlify URL on any device — it reads and writes the same cloud data.

---

## What saves to the cloud now

- Camper check-ins **and check-outs** (with pickup time + who picked them up)
- Team rosters, add/change-player moves, and whole-week moves
- Skills-station notes (the daily log) and promoted drills/games
- New campers and staff you add from the rosters
- Timer presets
- Settings: camp name, labels, session times, active days
- Any text you edit with the Edit button (names, notes, drills, titles, etc.)

All of it rides on one shared state snapshot, so every device sees the same data.

## Features in this build

- **Live Portal** — auto session detect, team shuffle, where-am-I, add/change player
- **Timer** — countdown up to 60 min, presets, alarm, keeps screen awake
- **Three-state check-in/out** — Not here / Checked in / Picked up (time + by whom)
- **Skills notes + master library** — tap-to-tag daily notes that graduate into a
  permanent, cross-year library of drills and games
- **Add Camper / Add Staffer** — buttons by each roster (name, grade, session,
  gender, email, phone)
- **Team management** — tap-to-move (phone) + drag-and-drop (desktop), per-day or
  whole-week moves, live team sizes
- **Settings page** — active days (Mon–Thu vs Mon–Fri), session times, and editable
  wording/labels throughout
- **2025 archive** — full read-only look-back
- **Add a year** — rolls campers/teams fresh while carrying the library forward

## What stays the same after you're gone

Everything is editable in the app (Edit button) or directly in Softr, so a future
director never needs Claude to run or change the camp.

---

## Troubleshooting

- **App shows old data / won't save:** confirm `BACKEND_URL` is set correctly and the
  Render URL loads "Narrow Path backend is running."
- **Browser console shows a CORS error:** `ALLOWED_ORIGIN` on Render must exactly match
  your Netlify URL (including `https://`, no trailing slash).
- **First action is slow:** Render free tier waking up; subsequent actions are fast.
- **401/403 from the backend:** the `SOFTR_API_KEY` on Render is wrong or lacks write
  access — generate a fresh write token and update the Render env variable.

---

## Files in this kit

- `np-backend/server.js` — the broker (already tested)
- `np-backend/package.json` — its dependency list
- `np-backend/.env.example` — template for local testing (optional)
- `np-backend/.gitignore` — keeps secrets/junk out of GitHub
- `narrow-path-camp.html` — the app, now backend-aware (works with or without a backend)
- `SETUP.md` — this guide
