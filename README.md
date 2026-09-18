# AdNabbit Web MVP

Advertiser signup/login, creative upload (image/video), submit for review, admin approve/reject, and **Ticket A — Host/screen inventory**.

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
- Admin-only routes reuse the same `role === "ADMIN"` gate as creative approve/reject

## Quick start

```bash
cd adnabbit-web
cp .env.example .env   # or use the included .env for local demo
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Default seed admin (from `.env`)

- Email: `admin@adnabbit.com`
- Password: `admin123!`

Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` before seeding in non-dev environments.

Seed also creates sample **hosts** and **screens** for Ticket A demos.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run db:migrate` | Prisma migrate (interactive) |
| `npm run db:push` | Push schema without migration history |
| `npm run db:seed` | Create/update ADMIN + sample hosts/screens |
| `npm run build` / `start` | Production build & serve |

## Creative statuses

`DRAFT` → (submit) → `PENDING` → (admin) → `APPROVED` or `REJECTED`

- Reject requires a reason; advertisers see it on their dashboard
- Rejected creatives can be re-submitted

## Ticket A — Host / screen inventory

Admin-only CRUD for venues (hosts) and screens.

### Data model

- **Host**: `name`, required `vertical` (Forge enum below), optional `otherLabel` **iff** `vertical === OTHER`, optional `notes`
- **Screen**: `name`, `city`, `zip`, `inventoryStatus` (`OPEN` | `LIMITED` | `FULL`), optional `notes`, `hostId`
- Screens **do not** store vertical — join `Screen.host.vertical`

### Host vertical enum (Forge lock)

`RESTAURANT_FB`, `SPORTS_BAR`, `GYM`, `AUTO`, `MEDICAL_DENTAL`, `SALON_SPA`, `RETAIL`, `GROCERY`, `WAITING_ROOM`, `HOTEL`, `EDUCATION`, `PROFESSIONAL`, `GAS_TRAVEL`, `CHURCH_COMMUNITY`, `AIRPORT_TRANSIT`, `OTHER`

### Admin UI

| Path | Purpose |
|------|---------|
| `/admin/hosts` | List hosts |
| `/admin/hosts/new` | Create host |
| `/admin/hosts/[id]` | Edit/delete host + list its screens |
| `/admin/screens` | List screens; filter by city, zip, inventory status, host vertical |
| `/admin/screens/new` | Create screen |
| `/admin/screens/[id]` | Edit/delete screen |

### Admin APIs

| Method | Path |
|--------|------|
| GET/POST | `/api/admin/hosts` |
| GET/PATCH/DELETE | `/api/admin/hosts/[id]` |
| GET/POST | `/api/admin/screens` (GET query: `city`, `zip`, `inventoryStatus`, `vertical`) |
| GET/PATCH/DELETE | `/api/admin/screens/[id]` |

Non-admins receive `401`/`403` on APIs and are redirected away from admin pages.

## Uploads

- Allowed: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`
- Max size: 50 MB
- Stored under project `uploads/`
- Served via authenticated `/api/uploads/[storedName]`

## Switching to Postgres

1. In `prisma/schema.prisma`, set provider to `postgresql`
2. Set `DATABASE_URL` accordingly
3. `npx prisma migrate dev` + `npm run db:seed`

## Out of scope (later tickets)

- Ticket B: public advertiser profiles
- Ticket C: placement requests
- Host self-serve portal, player, OptiSigns sync, scheduling, proof-of-play, marketplace, billing

## Push to GitHub

Leave commits for Cron; do not force-push. Local tree should be ready to commit.

(Do not commit `.env`, `uploads/*`, or `*.db` — already gitignored.)
