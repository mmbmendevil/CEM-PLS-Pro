# Public Release Checklist

Use this checklist before publishing the repository.

## Repository Hygiene

- Confirm `.env` is ignored and `.env.example` contains placeholders only.
- Confirm `firebase-debug.log`, build artifacts, dependency folders, and local editor files are not committed.
- Confirm generated documentation lives under `docs/`.
- Confirm the README describes the actual personalized learning system.
- Confirm license metadata is consistent between `README.md`, `package.json`, and `package-lock.json`.

## Secrets Review

- Rotate Firebase, OpenAI, and admin credentials that were ever committed, shared, or exposed.
- Prefer `OPENAI_API_KEY` for Vite dev/preview proxy usage.
- Do not use `VITE_OPENAI_API_KEY` in public browser builds.
- Review `.firebaserc` and decide whether the Firebase project ID should be public.

## Validation

Run:

```bash
.\node_modules\.bin\tsc.cmd --noEmit
npm run build
```

Smoke-check:

- `/auth/login`
- `/auth/signin`
- `/dashboard`
- `/dashboard/modules`
- `/dashboard/review`
- `/dashboard/summative-posttest`
- `/dashboard/learning-results`
- `/admin/login`
- `/admin`
- `/admin/item-analysis`

## Deployment

- Deploy Firestore rules after reviewing `firestore.rules`.
- Confirm the production host can serve `public/videos/*.mp4`.
- Confirm Firebase Auth providers are enabled for the intended sign-in methods.
- Confirm admin users have `role: "admin"` in `userProfiles/{uid}`.
