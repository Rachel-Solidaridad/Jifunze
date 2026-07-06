# Jifunze — Solidaridad ECA Learning Hub

Interactive e-learning platform for Solidaridad East & Central Africa staff. Built with React + Vite + Tailwind, deployed to Firebase Hosting via GitHub Actions.

**Tagline:** *Change That Matters.*

---

## What's inside

13 self-paced courses, organised by category:

| # | Course | Category | Duration |
|---|--------|----------|----------|
| 1 | Welcome to Solidaridad ECA | Onboarding | 1 hr |
| 2 | MASP 2026-2030 | Strategy | 1 hr 15 min |
| 3 | Code of Conduct & Integrity | Compliance | 25 min |
| 4 | Ethical Dilemmas in the Field | Ethics | 30 min |
| 5 | Climate & Natural Resource Management | Climate & NRM | 30 min |
| 6 | EUDR: EU Deforestation Regulation | Climate & NRM | 1 hr |
| 7 | Access to Finance | Access to Finance | 20 min |
| 8 | True Pricing | True Pricing | 1 hr |
| 9 | Soy: Crop, Practice & Programme | Commodities | 1 hr 15 min |
| 10 | Gender, Equality & Inclusion | Gender | 1 hr 15 min |
| 11 | Brand & Communications | Communications | 20 min |
| 12 | Digital Tools at Solidaridad | Digital | 20 min |
| 13 | PMEL Fundamentals | PMEL | 25 min |

Each course has structured lessons, an interactive activity (matching games, spelling sorts, scenario decisions, country-commodity tasks), and a quiz. A certificate is issued on completion.

---

## Quick start (local)

**Prerequisites:** Node.js 20+ and npm.

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
# → opens at http://localhost:5173
```

Sign in is **Google Workspace SSO only**, restricted to `@solidaridadnetwork.org` accounts (Firebase Auth, `signInWithPopup` with the `hd` parameter). Non-Solidaridad Google accounts are signed out immediately on the client and shown an "access restricted" panel. Firebase Auth `localhost` is trusted by default, so the dev flow works out of the box.

To build for production:

```bash
npm run build
# Output goes to dist/
```

To preview the production build locally:

```bash
npm run preview
```

---

## Project structure

```
jifunze-learning-hub/
├── public/                 # Static assets (favicons, etc.)
├── src/
│   ├── App.jsx             # Main app — all 13 courses, components, routing
│   ├── main.jsx            # React entry point
│   └── index.css           # Tailwind base styles
├── index.html              # Vite entry HTML, Google Fonts links
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind theme — Solidaridad brand colours
├── postcss.config.js       # PostCSS for Tailwind
├── firebase.json           # Firebase Hosting + Firestore config (SPA rewrites, asset caching, rules/indexes paths)
├── .firebaserc             # Firebase project alias (default → jifunze-7dbfe)
├── firestore.rules         # Firestore security rules (users can only read/write their own data)
├── firestore.indexes.json  # Firestore composite indexes
├── .github/workflows/      # GitHub Actions for auto-deploy on merge + PR previews
├── src/firebase.js         # Firebase Auth + Firestore client init (project config, Google provider, IndexedDB-cached Firestore)
├── Dockerfile              # Fallback only — Cloud Run path, not actively maintained
├── nginx.conf              # Fallback only — used by the Docker/Cloud Run path
├── cloudbuild.yaml         # Fallback only — Cloud Build → Cloud Run pipeline
├── .gitignore
└── README.md
```

The entire app lives in `src/App.jsx` as a single file — about 4,400 lines. It's organised top-to-bottom as:

1. Imports (React, lucide-react icons)
2. Brand constants (colours, fonts)
3. Custom `JifunzeIcon` logo component
4. `COURSES` array — all course data (definitions, lessons, interactives, quizzes)
5. `CATEGORIES` array — filter chips for the catalog
6. Storage helpers (Firestore-backed, scoped by `auth.currentUser.uid`)
7. Login gate
8. Layout components (sidebar, top bar)
9. Dashboard, catalog, course detail, lesson view, interactive views, quiz, certificate
10. Forum
11. Main `App` component with routing

To split it into multiple files later, the course data (the `COURSES.push(...)` blocks) is the natural first extraction.

---

## Brand system

- **Yellow:** `#FFC800`
- **Black:** `#000000`
- **Warm Grey:** `#D9D9C3`
- **Typography:** Open Sans (loaded from Google Fonts in `index.html`)
- **Headings:** EXTRA BOLD UPPERCASE with yellow swoosh accents

These are wired into `tailwind.config.js` as `solidaridad-yellow`, `solidaridad-black`, and `solidaridad-grey`.

---

## Deployment

### Primary path: Firebase Hosting (auto-deploy from GitHub)

The site is deployed to Firebase Hosting from GitHub Actions. Firebase project: **`jifunze-7dbfe`**.

- **Live URLs:** `https://jifunze-7dbfe.web.app` and `https://jifunze-7dbfe.firebaseapp.com`
- **On push to `main`** → `.github/workflows/firebase-hosting-merge.yml` runs `npm ci && npm run build` and deploys to the `live` channel.
- **On pull request** → `.github/workflows/firebase-hosting-pull-request.yml` deploys to an ephemeral preview channel and posts the URL as a PR comment (7-day expiry by default).

#### Required GitHub secret (one-time setup)

The deploy workflows authenticate to Firebase using a Google service account key stored as the GitHub repo secret **`FIREBASE_SERVICE_ACCOUNT_JIFUNZE_7DBFE`**. The easiest way to create it:

```bash
# Install the Firebase CLI once (locally or globally)
npm install -g firebase-tools

# Sign in to Google (opens browser)
firebase login

# From the project root: creates the service account, uploads the key as a
# GitHub repo secret named FIREBASE_SERVICE_ACCOUNT_JIFUNZE_7DBFE, and asks
# whether to scaffold workflows (skip — they already exist here).
firebase init hosting:github
```

If you prefer not to use the CLI, you can do it manually:

1. In the Firebase Console → Project Settings → Service Accounts, generate a new private key (JSON).
2. In GitHub → repo Settings → Secrets and variables → Actions, create a secret named `FIREBASE_SERVICE_ACCOUNT_JIFUNZE_7DBFE` with the JSON contents as the value.

#### Local preview of the production build

```bash
npm run build
npx firebase emulators:start --only hosting
# → http://localhost:5000
```

#### Manual / emergency deploy

```bash
npm run build
npx firebase deploy --only hosting
```

#### Rollback

If a deploy ships a regression: `npx firebase hosting:rollback` (or pick a previous release in the Firebase Console → Hosting → Release history).

---

### Fallback: Cloud Run (not actively maintained)

The repo still contains `Dockerfile`, `nginx.conf`, and `cloudbuild.yaml` from an earlier Cloud Run deploy pipeline. These are kept as an emergency fallback only — they are **not part of the active deploy path** and may drift out of date. Don't rely on them without re-testing first.

If you ever need them, the original flow was:

```bash
gcloud builds submit --config=cloudbuild.yaml --region=europe-west1
```

---

## Pushing to GitHub

```bash
# From the project root
git init
git add .
git commit -m "Initial commit: Jifunze learning hub with 13 courses"

# Create the repo on GitHub first, then:
git remote add origin git@github.com:Rachel-Solidaridad/Jifunze.git
git branch -M main
git push -u origin main
```

---

## Customisation guide

### Adding a new course

Open `src/App.jsx`, search for `COURSES.push({` — you'll find the existing courses as templates. Add a new `COURSES.push({ ... });` block following the same shape:

```js
COURSES.push({
  id: 'my-course',                    // unique id, used in URLs and progress tracking
  title: 'My New Course',
  subtitle: 'Short subtitle',
  category: 'Compliance',             // must match a value in CATEGORIES
  icon: Shield,                       // a lucide-react icon (import at top)
  duration: '30 min',
  description: '...',
  lessons: [ /* array of lesson objects */ ],
  interactive: { /* one of: match-value | spelling-sort | scenario | country-commodity */ },
  quiz: [ /* array of question objects */ ],
});
```

### Adding a new category

Add it to the `CATEGORIES` array (search for `const CATEGORIES =`).

### Authentication

Sign-in is handled by Firebase Auth using Google Workspace SSO only. The `googleProvider` in `src/firebase.js` is configured with:

- `hd: solidaridadnetwork.org` — Google preselects/filters the account chooser to Solidaridad accounts.
- `prompt: select_account` — the account chooser is always shown (avoids a wrong-account silent reuse in mixed-account browsers).

The `hd` parameter is a hint, not a hard gate, so `LoginPage` also performs a post-sign-in check: any account whose email doesn't end with `@solidaridadnetwork.org` is signed out via `signOut(auth)` and the user sees an "access restricted" panel naming the rejected email and pointing to `info.secaec@solidaridadnetwork.org` for access requests.

The session is hydrated in `App()` via `onAuthStateChanged` — Firebase persists the auth token in IndexedDB, so refreshes keep the user signed in without any localStorage juggling.

Email/password is intentionally not offered: this is a Workspace-only app and the extra UI was a UX trap (no sign-up flow, no admin provisioning). The Email/Password provider can be disabled in the Firebase Console → Authentication → Sign-in method.

### Cross-device progress (Firestore)

User progress and the display name shown on certificates are stored in **Firestore**, scoped by `auth.currentUser.uid`:

- `users/{uid}` — single doc holding the user's `displayName` and last-updated timestamp.
- `users/{uid}/progress/{courseId}` — one doc per course, holding the per-step completion flags (`lesson-*`, `interactive`, `quiz`).

Writes are partial (single-field `setDoc` with `merge: true`) to keep us under the ~1 write/sec/document soft limit and the 1 MiB doc size limit as more courses are added. The Firestore client is initialised with `persistentLocalCache` + `persistentSingleTabManager` (in `src/firebase.js`), so:

- Progress writes survive offline use and replay on reconnect — important for field connectivity in ECA.
- Refreshes hit IndexedDB first, then sync from the server, so the catalog renders instantly.

Security rules live in `firestore.rules`. They enforce two layers:

1. Caller must be signed in **and** their auth-token email must match `@solidaridadnetwork.org` (`signedInSolidaridad()`) — defence-in-depth alongside the client-side domain check.
2. Per-user data (`users/{uid}` and subcollections) is restricted to the owner (`request.auth.uid == uid`).

The rules also cover two collections that **are not yet wired into the app**:

- `users/{uid}/certificates/{courseId}` — write-once / immutable. Scaffolded for moving certificates from in-memory rendering to a server-of-record audit trail.
- `forum/{threadId}` and `forum/{threadId}/replies/{replyId}` — shared per-org forum. The forum page exists in the UI but is currently a placeholder; the rules are ready for when it's wired up.

Deploy rules + indexes after changes:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

---

## Content sources

The course content is drawn from official Solidaridad materials and authoritative external sources:

- **MASP 2026-2030** — Solidaridad ECA strategic plan
- **Code of Conduct** — Solidaridad Network
- **Climate & EUDR** — European Commission (https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en)
- **Soy** — Solidaridad Southern Africa Soy Training Manual (developed under SATSBIS with the Livelihoods & Food Security Programme, Zimbabwe)
- **Gender** — Solidaridad's Gender Task Force / KAYA Humanitarian Leadership Academy curriculum

---

## License

Internal Solidaridad ECA tool. Not for public redistribution. Contact your line manager for any external use questions.

---

*Built for Solidaridad ECA.* **Change That Matters.**

<!-- ci-test: sync-main-to-production workflow smoke test (temporary, will be reverted) -->

