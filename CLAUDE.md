# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## ⚠️ CRITICAL RULE — Always commit and push

**Every time you finish a meaningful change, commit it and push it to `main` on GitHub. No exceptions.**

- Assume you are **never** explicitly told to commit or push. Do it anyway.
- Push directly to the `main` branch. Do **not** create feature branches, do **not** open PRs.
- We are intentionally working trunk-only right now — don't suggest a branching strategy, don't ask if a branch should be created.
- After any edit, addition, or deletion that leaves the repo in a working state, run:
  1. `git add <files>` (prefer naming files explicitly over `git add -A`)
  2. `git commit -m "<concise message>"` with the standard `Co-Authored-By: Claude...` trailer
  3. `git push origin main`
- If a commit or push fails, surface the error and fix the underlying issue — don't skip hooks or force-push.
- Never commit `.env`, credentials, or anything in `node_modules/`. The `.gitignore` should handle most of this; double-check before staging.

This rule overrides the default "only commit when asked" behavior for this project.

---

## Project overview

**Jifunze** — Solidaridad ECA Learning Hub. An interactive e-learning platform for Solidaridad East & Central Africa staff.

- **Stack:** React 18 + Vite 5 + Tailwind CSS 3
- **Deploy target:** Firebase Hosting (project `jifunze-7dbfe`), two sites — `main` auto-deploys to development, `production` deploys to the live production site. See the Deployment section below.
- **Remote:** `https://github.com/Rachel-Solidaridad/Jifunze.git`
- **Source layout:** all app code lives in `src/` (`App.jsx`, `main.jsx`, `index.css`)
- **Content:** 13 self-paced courses with lessons, interactive activities, quizzes, and certificates. See `README.md` for the full course list.

---

## Common commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server at http://localhost:5173
npm run build        # production build → dist/
npm run preview      # serve the production build locally
```

There is no lint or test script configured yet.

---

## Conventions

- **Auth** — Firebase Auth, Google Workspace SSO only (`signInWithPopup`). Provider in `src/firebase.js` sets `hd: solidaridadnetwork.org` + `prompt: select_account`; `LoginPage` does a post-sign-in domain check and shows an access-denied panel if the email doesn't match. Email/password is intentionally not offered.
- **User data** — per-user progress and display name live in **Firestore** (`users/{uid}` and `users/{uid}/progress/{courseId}`), not `localStorage`. Client uses `persistentLocalCache` for offline survival. Reads/writes happen inside `onAuthStateChanged`, scoped by `auth.currentUser.uid`. Rules in `firestore.rules`; deploy with `npx firebase deploy --only firestore:rules,firestore:indexes`.
- **Styling** is Tailwind utility classes; icons come from `lucide-react`.
- **Single-file app** — most UI currently lives in `src/App.jsx`. When it gets unwieldy, split by feature (one folder per course or per screen), not by file type.
- Keep commits small and focused so the `main` history stays readable.

---

## Verifying UI changes

If you change anything visible in the browser, start the dev server (`npm run dev`) and verify in the preview before reporting the task done. Don't ask the user to check manually.

---

## Deployment

- **Two Firebase Hosting sites, one per branch** (both in project `jifunze-7dbfe`, mapped via hosting targets in `.firebaserc`):
  - **Development** (`main`) → site `jifunze-7dbfe` → `https://jifunze-7dbfe.web.app`. Every push to `main` triggers `.github/workflows/firebase-hosting-development.yml` (`npm ci && npm run build`, deploy target `development`). This is where changes should be validated.
  - **Production** (`production`) → site `jifunze-production` → `https://jifunze-production.web.app`. Every push to `production` triggers `.github/workflows/firebase-hosting-production.yml` (deploy target `production`). **This is the live site for real users.**
- **Releasing to production:** don't push to `production` directly. `.github/workflows/sync-main-to-production.yml` automatically opens/updates a single `main → production` PR whenever `main` is ahead. A human reviews it and merges when ready; merging is what deploys to the live production site. (This automated release PR is the one exception to the "no PRs" rule above — it is not a feature branch.)
- **PRs get preview channels** via `.github/workflows/firebase-hosting-pull-request.yml` — the preview URL is posted as a PR comment (7-day expiry). Previews deploy to the `development` target.
- **Firebase project:** `jifunze-7dbfe`. Hosting config lives in `firebase.json` (an array with one entry per target) and `.firebaserc` (target→site mapping).
- **Auth for the deploy action:** GitHub repo secret `FIREBASE_SERVICE_ACCOUNT_JIFUNZE_7DBFE` (a Google service account JSON). See README.md for one-time setup.
- **`Dockerfile`, `nginx.conf`, `cloudbuild.yaml` are inactive fallback only** — they're kept for emergency Cloud Run rollback and are not part of normal work. Don't update them as part of feature changes.
- **Verifying a deploy:** after pushing to `main`, watch with `gh run watch --repo Rachel-Solidaridad/Jifunze`, then load `https://jifunze-7dbfe.web.app` (development) and confirm the change. The production site `https://jifunze-production.web.app` only updates when a `main → production` PR is merged.
