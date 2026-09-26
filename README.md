# Halcyon Isle, on your own website

This folder is the whole game plus a tiny leaderboard server, ready for Vercel.

- `index.html` is the game.
- `api/board.js` stores the shared leaderboard.
- `package.json` just tells Vercel which Node version to use.

It takes about 15 minutes, all in the browser, with no coding. Vercel's screens change from time to time, so a button may be named slightly differently from what's written here.

## 1. Put the files on GitHub

1. Make a free account at github.com.
2. Click **New repository**. Name it `halcyon-isle`, choose **Private**, and create it.
3. On the new repository's page, click **uploading an existing file**.
4. Drag in `index.html`, `package.json`, `README.md` and the whole `api` folder.
5. Click **Commit changes**.

## 2. Deploy it on Vercel

1. Sign up at vercel.com using **Continue with GitHub**.
2. Click **Add New → Project** and **Import** your `halcyon-isle` repository.
3. Leave every setting as it is and click **Deploy**.

After a minute you'll have a link like `halcyon-isle-yourname.vercel.app`. The game already works there. The leaderboard needs one more step.

## 3. Add the leaderboard storage

1. In your Vercel project, open the **Storage** tab (or **Marketplace**).
2. Choose **Upstash** → **Redis**, pick the free plan, and create the database.
3. When it asks which project to connect it to, pick `halcyon-isle`.

This adds the storage settings to your project automatically. You don't need to copy anything.

## 4. Redeploy once

Open **Deployments**, click the **⋯** next to the newest one, and choose **Redeploy**. The leaderboard picks up the storage settings on this deploy.

## 5. Optional: a crew code

If you'd like only people who know a code to be able to join:

1. Go to **Settings → Environment Variables** and add one named `BOARD_KEY` with any word as the value, for example `gulls`.
2. Redeploy again, as in step 4.

The game will ask for that code the first time someone opens the leaderboard.

## 6. Share it

Send your two friends the link. Each of you opens the game, then **Journal (J) → Friends**, picks a name, and joins.

## Good to know

- **Progress lives in each person's browser.** Clearing browser data, or playing in a different browser, starts a fresh save and a new leaderboard entry.
- **Player slots are private.** Your browser holds a private key, so nobody else can post scores under your name.
- **Size limit.** The board holds up to 50 players.
- **Updates.** To install a newer version of the game later, upload the new `index.html` to the same GitHub repository. Vercel redeploys on its own.
