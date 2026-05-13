# CEM-PLS-Pro

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111111)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=ffffff)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28?logo=firebase&logoColor=111111)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=ffffff)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

CEM-PLS-Pro is a Firebase-backed personalized learning system for computer architecture education. It combines learner authentication, module-based lessons, adaptive-style assessment flows, AI-assisted reviewer generation, progress tracking, certification, and admin analytics in a React + TypeScript application.

The project is designed as a portfolio-ready academic system prototype: it demonstrates end-to-end product thinking, structured learning workflows, secure Firestore access patterns, and maintainable frontend architecture.

## Live Demo

Production deployment: [https://cem-pls-pro-21ey.vercel.app](https://cem-pls-pro-21ey.vercel.app)

> Note: Some features require Firebase configuration and authenticated user data. Admin analytics require a Firebase Auth user with an admin profile role in Firestore.

## Feature Highlights

### Learner Experience

- Email/password and Google authentication through Firebase Auth
- Dashboard for learning progress, module access, and assessment status
- Computer architecture modules with bundled local video lessons
- Guided module viewer with progress persistence
- Learning results and certificate generation flow

### Assessment and Progress Tracking

- Diagnostic pre-test and summative post-test workflows
- Adaptive-style question selection using module balancing and weighted scoring
- Gap analysis visualizations for competency-level feedback
- Stage progression gates for structured learning flow
- Firestore-backed assessment and module progress records

### AI-Assisted Review

- Personalized study plan generation based on learner assessment data
- OpenAI-compatible reviewer generation through a Vite server proxy
- Review formats for flashcards, audiobook-style narration, and cheatsheets
- Fallback reviewer behavior when AI generation is unavailable

### Admin Analytics

- Protected admin dashboard
- Cross-user progress and completion analytics
- Item analysis views for assessment performance review
- Admin-only Firestore access enforced through security rules and user profile roles

## Architecture

```txt
Browser client
  React + TypeScript + Vite
  React Router
  Tailwind CSS
  Recharts / React Flow visualizations
        |
        | Firebase client SDK
        v
Firebase
  Authentication
  Firestore
  Storage
  Analytics
        |
        | Optional reviewer generation proxy during Vite dev/preview
        v
OpenAI-compatible chat API

Deployment
  Vercel serves the static Vite build
  Firebase hosts authentication, data, rules, and storage services
```

For a portfolio case-study view, see [docs/portfolio.md](docs/portfolio.md).

## Screenshots

Screenshots are intentionally tracked as placeholders until production captures are added. Recommended filenames and captions are documented in [docs/assets/screenshots](docs/assets/screenshots/README.md).

| Area | Suggested file | Caption |
| --- | --- | --- |
| Authentication | `docs/assets/screenshots/01-login.png` | Firebase-backed login and onboarding entry point |
| Learner dashboard | `docs/assets/screenshots/02-dashboard.png` | Progress overview and next learning actions |
| Module viewer | `docs/assets/screenshots/03-module-viewer.png` | Video lesson and module completion workflow |
| Diagnostic pre-test | `docs/assets/screenshots/04-diagnostic-pretest.png` | Assessment interface with adaptive-style question flow |
| Gap analysis | `docs/assets/screenshots/05-gap-analysis.png` | Competency feedback and learning gap visualization |
| Study plan | `docs/assets/screenshots/06-personalized-study-plan.png` | AI-assisted reviewer generation from learner results |
| Review modes | `docs/assets/screenshots/07-review-modes.png` | Flashcards, audiobook, and cheatsheet review options |
| Certification | `docs/assets/screenshots/08-certification.png` | Learning results and certificate output |
| Admin dashboard | `docs/assets/screenshots/09-admin-dashboard.png` | Admin analytics for learner progress |
| Item analysis | `docs/assets/screenshots/10-item-analysis.png` | Assessment item performance review |

Architecture image placeholders are documented in [docs/assets/architecture](docs/assets/architecture/README.md).

## Technology Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Firebase Auth, Firestore, Storage, and Analytics
- React Router
- Recharts
- React Flow
- Framer Motion
- html2canvas and jsPDF for downloadable outputs
- Vercel deployment

## Project Structure

```txt
docs/              Portfolio, Firebase, release, and system documentation
public/videos/     Bundled lesson videos served by Vite
src/admin/         Admin pages, analytics views, and route protection
src/auth/          Learner authentication screens
src/contexts/      Shared React context providers
src/dashboard/     Learner dashboard, modules, assessments, and review pages
src/lib/           Firebase initialization
src/routes/        Route definitions and route constants
src/services/      Firebase and reviewer-generation service helpers
```

## Getting Started

### Prerequisites

- Node.js and npm
- Firebase project with Auth and Firestore enabled
- Optional OpenAI-compatible API key for reviewer generation

### Installation

```bash
npm install
```

Create a local environment file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Fill in the required values, then start the development server:

```bash
npm run dev
```

## Environment Variables

The app reads Firebase configuration from Vite environment variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Optional reviewer-generation and admin route values:

```bash
OPENAI_API_KEY=
VITE_OPENAI_API_BASE_URL=/api/openai
VITE_OPENAI_DEFAULT_MODEL=gpt-4.1-mini
VITE_ADMIN_USERNAME=
VITE_ADMIN_PASSWORD=
```

Do not commit `.env`. Use `.env.example` for placeholders only. See [docs/firebase.md](docs/firebase.md) for Firebase and admin access notes.

## Scripts

```bash
npm run dev      # Start the Vite development server
npm run build    # Type-check and create a production build
npm run preview  # Preview the production build locally
```

## Firebase and Deployment

- Firestore rules are stored at `firestore.rules` and referenced by `firebase.json`.
- Learner data is scoped to authenticated users.
- Admin analytics access requires a Firebase Auth user with `role: "admin"` in `userProfiles/{uid}`.
- The frontend is deployed as a Vite static build on Vercel.
- Bundled lesson videos are currently served from `public/videos/`.

More details:

- [Firebase setup](docs/firebase.md)
- [Release checklist](docs/release-checklist.md)
- [System documentation](docs/system-documentation.md)

## What This Demonstrates

- Production-oriented React + TypeScript organization
- Firebase Auth and Firestore integration with security rules
- Role-aware admin access and analytics workflows
- Data-driven assessment, progress tracking, and review generation
- Vercel deployment flow for a modern frontend application
- Documentation discipline for public release and academic review

## Suggested Portfolio Screenshots

Prioritize these captures before sharing with recruiters or professors:

1. Login and sign-up screens
2. Learner dashboard with populated progress
3. Module viewer with video lesson
4. Diagnostic pre-test question screen
5. Gap analysis visualization
6. Personalized study plan generation
7. Flashcard, audiobook, and cheatsheet review modes
8. Learning results and certificate screen
9. Admin dashboard analytics
10. Admin item analysis table/chart

## Optional Future Improvements

- Add route-level code splitting to reduce the production bundle size.
- Replace bundled videos with Firebase Storage or CDN-hosted assets.
- Add automated UI smoke tests for the main learner and admin flows.
- Add real screenshot and architecture image assets under `docs/assets/`.
- Add CI checks for TypeScript, build, and markdown link validation.

## License

MIT
