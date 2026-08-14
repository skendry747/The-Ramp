# Upload The Ramp to GitHub

This guide assumes you have downloaded `the-ramp-mvp-source.zip` from the dashboard Files area. Nothing in this package is deployed automatically.

## Before you start

- Have a free GitHub account.
- Use a computer with a web browser.
- Keep the ZIP file handy in Downloads.

## 1. Create the GitHub repository

1. Sign in at [github.com](https://github.com).
2. Click the **+** button in the top-right, then choose **New repository**.
3. Name it `The-Ramp`.
4. Choose **Public** or **Private**—either works for the source upload.
5. Do **not** check “Add a README,” “Add .gitignore,” or “Choose a license.” The package already has these files.
6. Click **Create repository**.

## 2. Unzip the source package

1. Find `the-ramp-mvp-source.zip` in Downloads.
2. Double-click it to extract a folder named `the-ramp-mvp`.
3. Open that folder. You should see `app`, `package.json`, `README.md`, and `package-lock.json`.

## 3. Upload the files in GitHub

1. On your new empty repository page, click **uploading an existing file**.
2. Drag **the contents inside** the extracted `the-ramp-mvp` folder into the upload box. Do not upload the ZIP itself.
3. Wait for the file list to finish loading. It should include `app/page.tsx` and `package.json`.
4. In the “Commit changes” box, enter `Add The Ramp Phase 0 MVP`.
5. Click **Commit changes**.

## 4. Confirm the upload

On the repository’s main page, confirm these are visible:

- `app/`
- `package.json`
- `package-lock.json`
- `README.md`
- `next.config.ts`

The `node_modules` and `.next` folders are intentionally excluded; GitHub and hosting services install/build them automatically.

## 5. Optional local preview

If Node.js 20.9+ is installed, open a terminal in the folder and run:

```bash
npm install
npm run dev
```

Then visit `http://localhost:3000`.

## Important demo note

The package is a Phase 0, browser-only prototype. Fly-ins, join states, chat messages, and profile edits are temporary demo data. It includes no live authentication, payments, email, database, or flight-planning integrations.
