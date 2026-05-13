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
## Presentation Assets
Login
<img width="1897" height="905" alt="image" src="https://github.com/user-attachments/assets/cca8e473-38fb-443d-9ccf-58d772b6b7d0" />
Create Account
<img width="1896" height="902" alt="image" src="https://github.com/user-attachments/assets/508d5d64-50f2-4de2-bad0-7045ddd5d599" />
Dashboard
<img width="1907" height="903" alt="image" src="https://github.com/user-attachments/assets/eed78282-a311-49cf-a066-dc1637d3873a" />
<img width="1877" height="900" alt="image" src="https://github.com/user-attachments/assets/40eb4000-6c4a-4498-af84-c8abacc2aa77" />
<img width="1877" height="893" alt="image" src="https://github.com/user-attachments/assets/01f6e89b-4620-4b25-a7be-43d28d960872" />
Course Module
<img width="1873" height="900" alt="image" src="https://github.com/user-attachments/assets/e5285960-12f6-4a0d-be47-a8854657cdfe" />
<img width="1883" height="897" alt="image" src="https://github.com/user-attachments/assets/31e48f70-0dda-460d-bbbc-b53648028dd3" />
Diagnostic Pre-test
<img width="1872" height="766" alt="image" src="https://github.com/user-attachments/assets/f81a936a-e8c7-42d4-becf-46d01f09cb0f" />
<img width="1909" height="795" alt="image" src="https://github.com/user-attachments/assets/e6b7cc86-5e5a-44d7-8c9d-98c7d29e0c48" />
Gap Anlaysis
<img width="1907" height="902" alt="image" src="https://github.com/user-attachments/assets/380f7064-04dc-48bc-953b-13a3587f3d98" />
<img width="1906" height="902" alt="image" src="https://github.com/user-attachments/assets/443110ce-96d8-4632-8517-3e947e675795" />
<img width="1902" height="907" alt="image" src="https://github.com/user-attachments/assets/9813c53b-9928-4dac-b8a6-0d7fa635a8a8" />
<img width="1906" height="902" alt="image" src="https://github.com/user-attachments/assets/67942792-27ed-4a18-b698-870f57688210" />
Study Plan
<img width="1892" height="768" alt="image" src="https://github.com/user-attachments/assets/d7f24169-0986-4a3c-b028-6262c0e2349a" />
<img width="1896" height="897" alt="image" src="https://github.com/user-attachments/assets/a158b2e8-7551-4319-86fe-befe34b72699" />
<img width="1913" height="774" alt="image" src="https://github.com/user-attachments/assets/45cb172f-839c-47e0-bdd1-18e1c055e549" />
<img width="1870" height="894" alt="image" src="https://github.com/user-attachments/assets/e02c098b-21d8-4644-92f7-e55135a91d2f" />
Summative Post-Test
<img width="1891" height="896" alt="image" src="https://github.com/user-attachments/assets/ba181bae-3483-4c17-911f-c4d4b2914773" />
<img width="1877" height="897" alt="image" src="https://github.com/user-attachments/assets/eb4d26ff-e9b4-43cf-b534-90ede7d017b3" />
Learning Result
<img width="1872" height="906" alt="image" src="https://github.com/user-attachments/assets/745b166b-713a-43b6-b02b-e288a91656b9" />

Certification Page

<img width="443" height="798" alt="image" src="https://github.com/user-attachments/assets/485048dd-cb1d-414a-a177-74c3e2a39e21" />

Admin Page
<img width="1110" height="893" alt="image" src="https://github.com/user-attachments/assets/578afb9d-cc6d-4c52-a7fb-cdcd4d87aa36" />
<img width="1132" height="896" alt="image" src="https://github.com/user-attachments/assets/26514b81-8722-4a31-bfc5-661acc5b064f" />
<img width="1112" height="902" alt="image" src="https://github.com/user-attachments/assets/12a8ef1f-a024-4b89-bf1e-baaa8f95ac64" />
<img width="1110" height="878" alt="image" src="https://github.com/user-attachments/assets/fcd98f0b-40b4-4b08-92b6-50c25a2c81fb" />

## Architecture
<img width="1024" height="1536" alt="image" src="https://github.com/user-attachments/assets/20e2a242-2226-4ac0-8a88-01d4f54d9ba7" />
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
