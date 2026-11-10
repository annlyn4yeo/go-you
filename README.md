# GO—YOU

**Train. Log. Progress.** A minimal strength-training logger. Start a workout (blank or from a template),
log sets as you go, then track progress with stats, PRs and weekly/monthly goals.

## Features

- **Live workout logging:** add exercises by name, log reps × weight (kg or lb), and edit or remove sets as you go
- **Program templates:** start a session from built-in Upper / Lower / Push / Pull templates
- **Workout log:** history of every session with full set detail
- **Stats:** workouts, total volume, average session length, weekly volume trend, top exercises,
  estimated 1RM (Epley) and PR events, filterable by range and display unit
- **Goals:** weekly and monthly workout targets with progress on the dashboard
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
