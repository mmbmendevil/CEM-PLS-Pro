# Firebase Setup

This app uses Firebase Auth, Firestore, Storage, and optional Analytics from the browser client. Keep Firebase behavior unchanged unless you are intentionally changing authentication, persistence, or deployment rules.

## Environment Variables

Create a local `.env` file from `.env.example` and fill in your Firebase web app values:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Reviewer generation can use the Vite proxy in `vite.config.ts`:

```bash
OPENAI_API_KEY=...
VITE_OPENAI_API_BASE_URL=/api/openai
VITE_OPENAI_DEFAULT_MODEL=gpt-4.1-mini
```

Avoid using `VITE_OPENAI_API_KEY` for public builds because `VITE_` variables are exposed to browser code by Vite.

## Firestore Rules

Firestore rules are intentionally kept at the repository root because `firebase.json` points to `firestore.rules`:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

Deploy rules with:

```bash
firebase deploy --only firestore:rules
```

## Admin Access

The static admin credentials configured with `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` only unlock the React admin route. They do not grant Firestore privileges.

For admin data access, the signed-in Firebase Auth user must have a matching Firestore profile:

```txt
userProfiles/{adminAuthUid}
  role: "admin"
  fullName: "Admin"
  email: "admin@example.com"
```

## Public Release Notes

- Do not commit `.env`.
- Rotate any credentials that were ever exposed before public release.
- Review `.firebaserc` before publishing if the project ID should remain private.
- Keep `public/videos/` in place unless the app is migrated to Firebase Storage or a CDN.
