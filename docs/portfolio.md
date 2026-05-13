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
<img width="1024" height="1536" alt="image" src="https://github.com/user-attachments/assets/66161cd3-ed09-4241-98c3-4f769eb250f1" />

## Future Improvements

- Add route-level code splitting for smaller production chunks.
- Add automated smoke tests for learner and admin routes.
- Move large lesson videos to Firebase Storage or a CDN.
- Add CI for TypeScript, production build, and markdown link validation.
- Add polished screenshots and diagrams to the README.
