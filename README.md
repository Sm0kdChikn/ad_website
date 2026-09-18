# AdNabbit Web MVP (first slice)

Advertiser signup/login, creative upload (image/video), submit for review, and admin approve/reject.

**Repo target:** https://github.com/Sm0kdChikn/ad_website

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **NextAuth.js (Auth.js v4)** — Credentials provider, JWT sessions
- **Prisma** + **SQLite** (zero-setup local demo)
- Files stored on local disk under `uploads/`

## Auth model

- Email + password (bcrypt hashed)
- Roles: `ADVERTISER` (signup) and `ADMIN` (seeded from env)
- Session strategy: JWT via NextAuth

## Quick start

```bash
cd adnabbit-web
cp .env.example .env   # or use the included .env for local demo
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Default seed admin (from `.env`)

- Email: `admin@adnabbit.com`
- Password: `admin123!`

Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` before seeding in non-dev environments.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run db:migrate` | Prisma migrate (interactive) |
| `npm run db:push` | Push schema without migration history |
| `npm run db:seed` | Create/update ADMIN from env |
| `npm run build` / `start` | Production build & serve |

## Creative statuses

`DRAFT` → (submit) → `PENDING` → (admin) → `APPROVED` or `REJECTED`

- Reject requires a reason; advertisers see it on their dashboard
- Rejected creatives can be re-submitted

## Uploads

- Allowed: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`
- Max size: 50 MB
- Stored under `/workspace/adnabbit-web/uploads` (project `uploads/`)
- Served via authenticated `/api/uploads/[storedName]`

## Switching to Postgres

1. In `prisma/schema.prisma`, set:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. In `.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/adnabbit"
```

3. Re-run migrate + seed:

```bash
npx prisma migrate dev --name postgres
npm run db:seed
```

## Out of scope (this slice)

Host/screens, scheduling, proof-of-play, marketplace, billing, e-sign, OptiSigns API, Linux player.

## Push to GitHub

```bash
cd adnabbit-web
git init
git add .
git commit -m "feat: AdNabbit web MVP first slice"
git remote add origin https://github.com/Sm0kdChikn/ad_website.git
git push -u origin main
```

(Do not commit `.env`, `uploads/*`, or `*.db` — already gitignored.)
