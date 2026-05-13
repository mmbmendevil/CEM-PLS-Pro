# Architecture Visuals

Use this folder for diagrams that explain how CEM-PLS-Pro works at a glance.

## Recommended Diagrams

| File | Purpose |
| --- | --- |
| `system-architecture.png` | Shows React/Vite frontend, Firebase services, optional OpenAI proxy, and Vercel deployment. |
| `firebase-data-flow.png` | Shows Auth, Firestore user profiles, assessment progress, module progress, and admin analytics access. |
| `learner-journey.png` | Shows the learner flow from login to modules, diagnostic assessment, gap analysis, review, summative assessment, results, and certification. |

## Diagram Guidance

- Keep diagrams readable in GitHub's markdown preview.
- Use neutral labels and avoid implementation-only details unless they clarify the system.
- Do not include secrets, project credentials, or private Firebase console screenshots.
- Export final diagrams as PNG for README embedding.
- Keep source diagram files in the same folder if using Figma, Mermaid, Excalidraw, or another editable format.

## Suggested System Architecture Content

```txt
Vercel
  Static Vite build

React client
  Routes, dashboard, assessments, review modes, admin views

Firebase
  Auth, Firestore, Storage, Analytics, security rules

AI reviewer generation
  Vite proxy to OpenAI-compatible chat API during dev/preview
```
