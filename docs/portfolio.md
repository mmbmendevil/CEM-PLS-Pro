# Portfolio Case Study

## Project Overview

CEM-PLS-Pro is a personalized learning system for computer architecture education. It helps learners move through modules, complete diagnostic and summative assessments, review weak competencies, and track learning outcomes. The system also includes an admin dashboard for monitoring progress and assessment performance.

## Problem

Traditional module-based learning systems often show content and quizzes without connecting assessment performance to targeted review. This project addresses that gap by combining module progress, competency-based assessment results, personalized review generation, and admin analytics.

## Solution

The application provides a structured learning flow:

1. Learners authenticate through Firebase.
2. Learners complete modules and diagnostic assessments.
3. The system computes competency gaps and recommends review.
4. AI-assisted reviewer generation creates study material from learner results.
5. Learners complete summative assessment and view learning results.
6. Admin users review aggregate learner progress and item-level assessment performance.

## Technical Highlights

- React + TypeScript frontend built with Vite.
- Firebase Auth for learner authentication.
- Firestore for user profiles, module progress, assessment progress, reviewer data, and admin analytics.
- Firestore security rules for learner-owned records and admin-only cross-user reads.
- React Router for protected learner and admin flows.
- Recharts and React Flow for progress and gap-analysis visualizations.
- OpenAI-compatible reviewer generation through a Vite server proxy.
- Vercel deployment for the static frontend.

## Production-Ready Aspects

- Environment variables are documented through `.env.example`.
- Firebase rules are versioned in the repository.
- Admin access is separated from regular learner access.
- Public release documentation is organized under `docs/`.
- Build validation uses TypeScript and Vite production bundling.
- Large lesson media remains isolated under `public/videos/`.

## Presentation Assets

Recommended screenshots are documented in [assets/screenshots](assets/screenshots/README.md).

<img width="1024" height="1536" alt="image" src="https://github.com/user-attachments/assets/66161cd3-ed09-4241-98c3-4f769eb250f1" />

## Future Improvements

- Add route-level code splitting for smaller production chunks.
- Add automated smoke tests for learner and admin routes.
- Move large lesson videos to Firebase Storage or a CDN.
- Add CI for TypeScript, production build, and markdown link validation.
- Add polished screenshots and diagrams to the README.
