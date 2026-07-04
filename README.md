# Kromed

Kromed is a mobile-first medical operations app built with Next.js App Router,
Tailwind CSS, shadcn/ui, and Supabase.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Local Database

The repo includes a Supabase migration and deterministic fake seed data for the
buildathon demo. The global Supabase CLI is not required; the npm scripts use
`npx supabase`.

```bash
npm run db:start
npm run db:reset
npm run db:test
```

Useful schema checks:

```bash
npm run db:lint
npm run db:advisors
npm run db:types
```

Fake local demo accounts use `password123`:

- `karla.admin@example.test`
- `jenny.lou@example.test`
- `mario.rivera@example.test`

The seed data contains fake patients, fake contact numbers, fake addresses, and
demo-only clinical/financial records.

## Required Checks

For app changes, run:

```bash
npm run lint
npm run build
```
