# Deploying Quizzy to Render (free, permanent public URL)

This gives you one public URL that anyone can open to host or join a game —
no need for your computer to be on, and no LAN/Wi-Fi requirement for players.

## How it works

The server (`server/`) serves the built client (`client/dist`) directly, so
both the host screen and player screens are served from the same origin.
Render builds and runs this as a single free "Web Service".

**Free tier caveat:** Render's free web services "spin down" after 15 minutes
of no traffic, and take 30-60 seconds to wake up on the next request. The
first person to open the link after a quiet period will see a slow load —
after that it's fast for everyone until it goes idle again. This is fine for
occasional/scheduled games; if you need it always-instant, Render's paid
tier ($7/mo Starter plan) removes the spin-down.

## Step 1 — Push the code to GitHub

From the `kahoot-clone` folder:

```
git add -A
git commit -m "Initial commit"
```

Then create a new repository on GitHub (via https://github.com/new — pick any
name, e.g. `quizzy`, and leave it empty, no README/license). GitHub will show
you a remote URL like `https://github.com/YOUR_USERNAME/quizzy.git`. Run:

```
git remote add origin https://github.com/YOUR_USERNAME/quizzy.git
git branch -M main
git push -u origin main
```

## Step 2 — Deploy on Render

1. Go to https://render.com and sign up / log in (GitHub login is easiest).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub account if prompted, then select the `quizzy` repo
   you just pushed. Render will detect the `render.yaml` file in the repo
   root automatically and pre-fill everything (build command, start command,
   free plan).
4. Click **Apply** / **Create**. Render will run `npm install && npm run build`
   then `npm start`. The first deploy takes a few minutes.
5. Once deployed, Render gives you a URL like
   `https://quizzy-XXXX.onrender.com` — that's your permanent link.

If you'd rather not use the Blueprint auto-detect, you can configure the
same thing by hand under **New +** → **Web Service**:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node
- **Plan**: Free

## Step 3 — Play

Open the Render URL to host a game. The QR code and join link shown in the
lobby will automatically use that same public URL — no extra configuration
needed, since the app detects it's running in production and points itself
at its own origin.

## Updating the deployed app later

Whenever you want to ship changes, just commit and push to `main` — Render
auto-deploys on every push to the connected branch:

```
git add -A
git commit -m "Describe the change"
git push
```
