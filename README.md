# GO—YOU

**Train. Log. Progress.** A mobile-first strength-training logger built for the gym floor. Start a workout
(blank, or from routines it learns from your history), log sets with one thumb, and see your PRs the moment they happen.

## Features

- **One-thumb logging:** sets are pre-filled from your last session (`LAST · 3 × 8 @ 80 KG`), with ± steppers,
  one remembered kg/lb unit, and bodyweight sets (0 kg = BW)
- **Live PRs:** a set that beats your all-time best estimated 1RM is marked as a PR on the spot
- **Never lose a set:** the workout in progress is kept on the device through reloads and bad gym Wi-Fi. Removed sets can
  be undone, and a failed save keeps everything with a retry
- **Finish receipt:** time, sets, volume and PRs for the session, before and after saving
- **Earned routines:** after 21 sessions, GO—YOU builds templates (Routine A–D) from the workouts you actually repeat.
  Progress toward the unlock is tracked on Goals, and unlocked routines start with one tap from Train
- **Workout log:** every session by month, with full set detail and PR sets marked
- **Stats:** personal records, workouts, volume, average session, weekly volume trend and top exercises,
  by range (7D / 30D / 90D / ALL) and unit
- **Goals:** weekly and monthly workout targets tracked on the Train screen
- **Accessible:** labelled controls, visible focus, 44–56 px touch targets, screen-reader announcements, and reduced-motion support
- **Accounts:** email + password. An account is created automatically on first sign-in

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) · React 19 · TypeScript
- Tailwind CSS 3
- NextAuth v4 (credentials, JWT sessions) · bcrypt
- Prisma 7 (`@prisma/adapter-pg` driver adapter) · PostgreSQL ([Neon](https://neon.tech))
- Zustand for live workout state
- Deployed on [Vercel](https://vercel.com)

## Getting started

### Prerequisites
- Node.js 22+
- A PostgreSQL database (e.g. a free Neon project)

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
NEXTAUTH_SECRET="a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

Create the database tables by applying the migrations:

```bash
npx prisma migrate deploy
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any email and password to create an account.

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Node's built-in test runner) |

## Project structure

```
app/
  page.tsx            Sign-in screen
  app/                Authenticated app: dashboard, log, stats, settings
  api/                Route handlers: auth, workouts (save), warm-up
components/           Shared UI (app shell, set row, exercise input)
domain/               Workout domain types
state/                Zustand store for the active workout
lib/                  Auth, Prisma client, stats, time zones, validation, goals, templates
prisma/               Database schema and migrations (config in prisma.config.ts)
```

## Contributing

`main` is protected by convention. Create a branch (`feature/…`, `fix/…`, `chore/…`, `docs/…`),
then open a pull request into `main`. Run `npm run lint` and `npm run build` before opening the PR.
