# ManhwaVault Development Rules

## Project

ManhwaVault is a personal Manhwa/Manga/Manhua/Webtoon reading-progress tracker.

The application is NOT a manga reader and must not host, scrape, or distribute chapters.

## Technology

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- Lucide React

Backend:
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security

Deployment:
- Vercel

Version control:
- Git
- GitHub

## Development Rules

1. Do not rewrite the entire project when implementing a feature.
2. Inspect the existing code before making changes.
3. Reuse existing components.
4. Keep components modular.
5. Use TypeScript strictly.
6. Do not use `any` unless absolutely necessary.
7. Do not hardcode secrets.
8. Never commit `.env.local`.
9. Never expose service-role keys in frontend code.
10. Use Supabase Row Level Security for user data.
11. Validate user input.
12. Handle loading states.
13. Handle error states.
14. Handle empty states.
15. Make the application mobile-first.
16. Maintain accessibility.
17. Do not introduce unnecessary dependencies.
18. Do not modify unrelated files.
19. Run tests/build checks after completing a feature.
20. Do not claim a feature is complete unless it has been tested.

## Git Rules

Every completed Mark must result in:

git status
git add .
git commit
git push

Use descriptive conventional commit messages.

Example:

feat: add quick chapter tracking

## UI Rules

Figma is the visual source of truth.

Do not invent a completely different design from the approved Figma design.

Prioritize:
- usability
- readability
- fast chapter updates
- responsive design
- accessibility

## Core UX

The primary workflow is:

Open app
→ Find title
→ Press +
→ Chapter updates
→ Done

The user should be able to update a chapter within approximately 1–2 seconds.
