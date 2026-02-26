# DRPY

Temporary file sharing with privacy-first controls.

## Tech Stack
- Next.js (App Router)
- NextAuth.js (credentials + Google)
- MongoDB
- Cloudflare R2 (single or multi-account)
- Tailwind CSS + DaisyUI

## Features
- Auth: email/password + Google
- Upload with quota checks and progress
- File manager: folders, search/sort/filter, bulk actions, preview
- Share links: expiry, password, max downloads, regenerate, revoke
- My Links page with QR codes
- Dashboard analytics (downloads, bandwidth, top links/files)
- Cleanup jobs for expired/orphan data

## Getting Started
1. Install dependencies:
```bash
npm install
```

2. Copy env file:
```bash
cp .env.example .env
```

3. Fill required values in `.env` (DB, auth, R2, SMTP).

4. Run dev server:
```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Scripts
```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment Notes
- `R2_ACCOUNTS_JSON` is optional. If set, it overrides single-account `R2_*` vars.
- Global storage cap is enforced using configured R2 account count.
- Contact form requires SMTP + `ADMIN_EMAIL`.

## Main Routes
- `/` home
- `/login`, `/signup`
- `/dashboard`
- `/upload`
- `/files`
- `/links`
- `/s/[code]` public share page
- `/about`, `/privacy`, `/tos`, `/contact`
