# CEM-PLS-Pro

A Thesis Management System Prototype designed to streamline thesis submission, monitoring, and management processes for students and faculty.

## Features

- Student thesis submission
- Thesis tracking system
- Admin dashboard
- Authentication system
- Responsive UI
- Real-time status monitoring

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase / Supabase (if applicable)

## Live Demo

https://cem-pls-pro-21ey.vercel.app

## Installation

```bash
git clone https://github.com/yourusername/CEM-PLS-Pro.git
cd CEM-PLS-Pro
npm install
npm run dev
```

## Firebase Setup

This app reads and writes Firestore directly from the browser, so Firestore security rules must allow authenticated users to access their own `userProfiles/{uid}` data and must allow admins to read cross-user analytics.

Publish `firestore.rules` in Firebase Console or with the Firebase CLI. For the admin console, the signed-in Firebase Auth user also needs a matching profile document:

```txt
userProfiles/{adminAuthUid}
  role: "admin"
  fullName: "Admin"
  email: "admin@example.com"
```

The static admin login in `.env` only unlocks the React admin route; it does not authenticate to Firestore by itself.

## Project Structure

```txt
src/
public/
docs/
```

## Screenshots

(Add screenshots here)

## Author

- Mark Benison

## License

MIT License
