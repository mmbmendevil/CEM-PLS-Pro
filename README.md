# CEM-PLS-Pro

A Firebase-backed personalized learning system for computer architecture modules, adaptive-style assessments, AI-assisted review materials, learner progress tracking, certification, and admin analytics.

## Features

- Firebase Auth sign-in and sign-up flows
- Course modules with bundled local video lessons
- Diagnostic pre-test and summative post-test flows
- Gap analysis and personalized study plan generation
- Review modes for flashcards, audiobook scripts, and cheatsheets
- Learning results and certification pages
- Admin dashboard with learner analytics and item analysis
- Firestore security rules for learner-owned data and admin analytics access

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Firebase Auth, Firestore, Storage, and Analytics
- React Router
- Recharts
- Framer Motion

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the Firebase and optional OpenAI/admin values in `.env`, then start the dev server:

```bash
npm run dev
```

## Scripts

```bash
npm run dev      # Start the Vite development server
npm run build    # Type-check and create a production build
npm run preview  # Preview the production build locally
```

## Firebase

Firestore rules are kept at the repository root in `firestore.rules` because `firebase.json` references that path.

For setup details, admin profile requirements, and deployment notes, see [docs/firebase.md](docs/firebase.md).

## Project Structure

```txt
docs/              Release, Firebase, and system documentation
public/videos/     Bundled lesson videos served by Vite
src/admin/         Admin routes, pages, and route protection
src/auth/          Learner authentication screens
src/contexts/      Shared React context providers
src/dashboard/     Learner dashboard, modules, assessments, and review pages
src/lib/           Firebase initialization
src/routes/        Route definitions and route constants
src/services/      Firebase and reviewer-generation service helpers
```

## Documentation

- [Firebase setup](docs/firebase.md)
- [Release checklist](docs/release-checklist.md)
- [System documentation](docs/system-documentation.md)

## Public Release Notes

- Do not commit `.env`.
- Rotate any credentials that were ever committed or shared before publishing.
- Review `.firebaserc` before publishing if the Firebase project ID should remain private.
- Large lesson videos currently remain in `public/videos/` so the app works locally without external hosting.

## License

MIT
