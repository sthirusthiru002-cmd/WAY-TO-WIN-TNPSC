# TNPSC Notes — Full Setup & Deployment Guide

A website (installable as an app on Android & iOS) for uploading and organizing TNPSC study PDFs by category. Files are stored on **your own Google Drive**. You are the only admin — visitors can only browse and download.

**Stack (all free tiers):**
- Frontend: plain HTML/CSS/JS, installable as a PWA → hosted on **Netlify**
- Backend: Node.js/Express API → hosted on **Render**
- Database (categories + note info): **Firebase Firestore**
- File storage: **your Google Drive**

Total monthly cost: **$0**. A custom domain (optional) is the only thing that costs money (~$8–12/year).

---

## Part 1 — Google Drive setup (file storage)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (e.g. "TNPSC Notes").
2. In the search bar, find **Google Drive API** and click **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → Service Account**. Name it `tnpsc-drive-bot`, click through, and finish.
4. Click on the new service account → **Keys** tab → **Add Key → Create new key → JSON**. This downloads a `.json` file. **Keep it private, never share it.**
5. Open that JSON file, note the `client_email` field (looks like `tnpsc-drive-bot@yourproject.iam.gserviceaccount.com`).
6. Go to your normal [Google Drive](https://drive.google.com), create a folder called `TNPSC Notes Storage`.
7. Right-click the folder → **Share** → paste the service account's `client_email` → give it **Editor** access.
8. Open the folder and copy the ID from the URL: `https://drive.google.com/drive/folders/`**`THIS_PART_IS_THE_ID`**

You'll paste the whole JSON file content and this folder ID into the backend's `.env` file in Part 3.

---

## Part 2 — Firebase setup (database)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → same name is fine.
2. In the left menu, go to **Build → Firestore Database → Create database** → choose any region close to India → start in **production mode**.
3. Go to **Project settings (gear icon) → Service accounts → Generate new private key**. This downloads another JSON file.

You'll paste this JSON content into the backend `.env` too.

---

## Part 3 — Run the backend locally (test before deploying)

1. Install [Node.js](https://nodejs.org) (LTS version) if you don't have it.
2. Open a terminal in the `backend` folder:
   ```
   cd backend
   npm install
   ```
3. Copy `.env.example` to a new file named `.env`.
4. Fill in `.env`:
   - `GDRIVE_ROOT_FOLDER_ID` → the folder ID from Part 1, step 8
   - `GOOGLE_SERVICE_ACCOUNT_JSON` → open the Drive service-account JSON file, copy **all of it**, paste as one line
   - `FIREBASE_SERVICE_ACCOUNT_JSON` → same, but with the Firebase JSON file
   - `JWT_SECRET` → type any long random sentence, e.g. `tnpsc-super-secret-key-2026-change-me`
   - `ADMIN_USERNAME` → pick your admin username

### Create your admin password
Run this once to generate a secure password hash (replace `MyPassword123` with your real password):
```
node -e "console.log(require('bcryptjs').hashSync('MyPassword123', 10))"
```
Copy the output (starts with `$2a$...`) into `ADMIN_PASSWORD_HASH` in `.env`.

5. Start the server:
   ```
   npm start
   ```
   You should see `TNPSC Notes API running on port 5000`. Visit `http://localhost:5000` in a browser — you should see a small JSON message confirming it's running.

---

## Part 4 — Run the frontend locally

1. Open `frontend/js/config.js` — leave it pointing at `http://localhost:5000/api` for now.
2. Easiest way to preview: install the **Live Server** extension in VS Code, open the `frontend` folder, right-click `index.html` → **Open with Live Server**.
   (Or any local static server works.)
3. You should see the homepage. Go to `admin/login.html`, log in with the username/password you set, and try adding a category and uploading a test PDF.

---

## Part 5 — Deploy the backend (Render, free)

1. Push the whole project to a **GitHub** repository (create a free GitHub account if needed, create a new repo, upload the folder).
2. Go to [render.com](https://render.com) → sign up free → **New → Web Service** → connect your GitHub repo.
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Under **Environment**, add every variable from your `.env` file (same names and values).
5. Deploy. Render gives you a URL like `https://tnpsc-notes-api.onrender.com`.

> Free Render services "sleep" after 15 minutes of no traffic and take ~30 seconds to wake up on the next request — normal for free hosting.

---

## Part 6 — Deploy the frontend (Netlify, free)

1. In `frontend/js/config.js`, change the URL to your live Render URL:
   ```js
   const API_BASE_URL = "https://tnpsc-notes-api.onrender.com/api";
   ```
   Push this change to GitHub.
2. Go to [netlify.com](https://netlify.com) → sign up free → **Add new site → Import from GitHub** → pick your repo.
3. Settings: **Base directory:** `frontend`, **Publish directory:** `frontend` (no build command needed — it's plain HTML).
4. Deploy. Netlify gives you a free URL like `https://tnpsc-notes.netlify.app`.
5. Go back to Render → your backend's environment variables → update `CORS_ORIGIN` to include this new Netlify URL, so the backend accepts requests from it. Redeploy the backend.

Your site is now live and installable on phones (see Part 8).

---

## Part 7 — Custom domain (optional, ~$8–12/year)

1. Buy a domain (e.g. `tnpscnotes.in` or `.com`) from **Namecheap**, **GoDaddy**, or **Hostinger**.
2. In Netlify: **Site settings → Domain management → Add custom domain**, follow the DNS instructions shown (usually adding a CNAME or A record at your domain registrar).
3. Netlify auto-issues a free HTTPS certificate — no extra steps.
4. Update `CORS_ORIGIN` on Render to include your new domain too.

If you want to stay fully free, just use the Netlify subdomain — it works exactly the same.

---

## Part 8 — Installing as an app (Android & iOS)

No app store needed — this is a PWA (Progressive Web App):

- **Android (Chrome):** open the site → tap ⋮ menu → **Add to Home screen**.
- **iPhone (Safari):** open the site → tap the Share icon → **Add to Home Screen**.

It then opens full-screen with its own icon, like a native app.

---

## Day-to-day use (uploading notes going forward)

1. Go to `yoursite.com/admin/login.html` and log in.
2. **Add a category** once per subject (e.g. "Tamil Nadu History", "Indian Polity", "Aptitude").
3. **Upload a PDF**: fill title, optional description, pick category, choose the file, click Upload. It goes straight to your Google Drive and appears on the public site instantly.
4. Delete or rename anything anytime from the same dashboard.

---

## Notes on ownership & security

- Everything — code, Drive files, Firestore data — is 100% yours. Nothing is tied to Anthropic or any third party besides the free Google/Render/Netlify accounts you create.
- Never share your `.env` file, service-account JSON files, or admin password.
- Only you can add/edit/delete content — visitors only get read access.
- Back up by simply keeping your Google Drive and GitHub repo — both already act as backups.

---

## If something breaks

- **Categories/notes not loading:** check `frontend/js/config.js` has the correct live backend URL, and that `CORS_ORIGIN` on Render includes your frontend URL exactly.
- **Upload fails:** double check the Drive folder is shared with the service account email with Editor access.
- **Login fails:** regenerate the password hash (Part 3) and make sure there are no extra spaces in `.env`.
