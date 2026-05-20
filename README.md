# Jifunze — Solidaridad ECA Learning Hub

Interactive e-learning platform for Solidaridad East & Central Africa staff. Built with React + Vite + Tailwind, deployable to Google Cloud Run via Docker + Nginx.

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

The login page accepts any `@solidaridadnetwork.org` email and any password (auth is simulated for now — wire up real SSO before production).

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
├── Dockerfile              # Multi-stage build (Node → Nginx)
├── nginx.conf              # Nginx serving config (SPA fallback, gzip, caching)
├── cloudbuild.yaml         # Cloud Build → Cloud Run deployment config
├── .gitignore
└── README.md
```

The entire app lives in `src/App.jsx` as a single file — about 4,400 lines. It's organised top-to-bottom as:

1. Imports (React, lucide-react icons)
2. Brand constants (colours, fonts)
3. Custom `JifunzeIcon` logo component
4. `COURSES` array — all course data (definitions, lessons, interactives, quizzes)
5. `CATEGORIES` array — filter chips for the catalog
6. Storage helpers (localStorage-backed)
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

## Deployment to Cloud Run

### Option A: Cloud Build (recommended)

The included `cloudbuild.yaml` builds the Docker image, pushes to Container Registry, and deploys to Cloud Run in one command.

```bash
gcloud builds submit --config=cloudbuild.yaml --region=europe-west1
```

Make sure your GCP project has Cloud Build, Container Registry, and Cloud Run APIs enabled, and that the Cloud Build service account has Cloud Run Admin permissions.

### Option B: Manual Docker build

```bash
# Build image locally
docker build -t gcr.io/YOUR_PROJECT/jifunze .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT/jifunze

# Deploy to Cloud Run
gcloud run deploy jifunze \
  --image=gcr.io/YOUR_PROJECT/jifunze \
  --region=europe-west1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi
```

Replace `YOUR_PROJECT` with your GCP project ID.

### Continuous deployment from GitHub

Once the repo is on GitHub, set up a Cloud Build trigger pointing at the `main` branch and the `cloudbuild.yaml`. Every push to `main` will rebuild and redeploy automatically.

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

### Wiring up real authentication

The login gate currently checks the email domain only. To wire up real SSO (Google Workspace, Microsoft Entra, Okta), replace the `LoginPage` component's `onLogin` handler with a real OAuth flow. Recommended: use Firebase Auth or the cloud provider's IAP layer.

### Real backend for progress

Progress is currently stored in `localStorage`. To make it cross-device, replace the `loadProgress` / `saveProgress` functions (in the Storage helpers section) with calls to a backend — Firestore, Supabase, or a custom API.

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
