# AdNabbit Web MVP — Smoke Test Results

**Date:** 2026-09-18 (America/Denver, MDT)  
**Environment:** box local, SQLite + Next.js 14.2.35, `npm run dev` on http://localhost:3000

## Setup commands run

```bash
cd /workspace/adnabbit-web
# .env already present with SQLite + NextAuth + ADMIN_* 
npm install   # (done during scaffold)
npx prisma migrate dev --name init --skip-seed
npm run db:seed
# Seeded ADMIN: admin@adnabbit.com
npm run dev
```

## Smoke script (API)

Created `/tmp/smoke-test.png` (69-byte 1×1 PNG).

### 1. Advertiser signup — PASS

```bash
curl -s -X POST http://localhost:3000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"advertiser@example.com","password":"advertiser123","name":"Smoke Advertiser"}'
```

**Result:** `HTTP 201`  
`{"user":{"email":"advertiser@example.com","role":"ADVERTISER",...}}`

### 2. Advertiser login (NextAuth credentials) — PASS

```bash
# CSRF + cookie jar
curl -s -c /tmp/adv-cookies.txt http://localhost:3000/api/auth/csrf
curl -s -b /tmp/adv-cookies.txt -c /tmp/adv-cookies.txt \
  -X POST http://localhost:3000/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "csrfToken=$CSRF&email=advertiser@example.com&password=advertiser123&json=true"
curl -s -b /tmp/adv-cookies.txt http://localhost:3000/api/auth/session
```

**Result:** Session shows `role: ADVERTISER`

### 3. Upload creative — PASS

```bash
curl -s -b /tmp/adv-cookies.txt -X POST http://localhost:3000/api/creatives \
  -F "name=Smoke Test Banner" \
  -F "notes=Automated smoke upload" \
  -F "file=@/tmp/smoke-test.png;type=image/png"
```

**Result:** `HTTP 201`, status `DRAFT`, file on disk under `uploads/<uuid>.png`

### 4. Submit for review — PASS

```bash
curl -s -b /tmp/adv-cookies.txt -X POST http://localhost:3000/api/creatives/$CREATIVE_ID/submit
```

**Result:** `HTTP 200`, status `PENDING`

### 5. Admin login (seeded) — PASS

```bash
# Same CSRF/cookie flow with admin@adnabbit.com / admin123!
```

**Result:** Session shows `role: ADMIN`

### 6. Approve — PASS

```bash
curl -s -b /tmp/admin-cookies.txt -X POST http://localhost:3000/api/creatives/$CREATIVE_ID/approve
```

**Result:** `HTTP 200`, status `APPROVED`

### 7. Reject path — PASS

Second creative submitted, then:

```bash
curl -s -b /tmp/admin-cookies.txt -X POST http://localhost:3000/api/creatives/$ID2/reject \
  -H 'Content-Type: application/json' \
  -d '{"reason":"Logo too small for screen"}'
```

**Result:** `HTTP 200`, status `REJECTED`, `rejectReason` set

### 8. Advertiser list — PASS

```bash
curl -s -b /tmp/adv-cookies.txt http://localhost:3000/api/creatives
```

**Result:** Lists own creatives including `APPROVED` and `REJECTED` with reason

### 9. UI pages — PASS

| Path | Cookie | Status |
|------|--------|--------|
| `/` | advertiser | 307 → dashboard |
| `/login` | — | 200 |
| `/signup` | — | 200 |
| `/dashboard` | advertiser | 200 |
| `/creatives/new` | advertiser | 200 |
| `/admin` | advertiser | 307 (redirect) |
| `/admin` | admin | 200 |

## Auth approach (documented)

**NextAuth.js v4** with Credentials provider, **JWT session strategy**, bcrypt password hashes. Roles stored as strings on `User.role` (`ADVERTISER` | `ADMIN`). Admin created only via `npm run db:seed` from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Blockers

None for local SQLite MVP. Postgres was not running on the box; SQLite used as specified.

---

# Ticket A — Host/screen inventory smoke

**Date:** 2026-09-18 (America/Denver)  
**Prereq:** migrations applied (`npx prisma migrate dev`), `npm run db:seed`, `npm run dev` on :3000

## Setup

```bash
cd /workspace/adnabbit-web
npx prisma migrate dev --name host_screen_inventory   # already applied in this branch
npm run db:seed
# Seeded ADMIN + sample hosts/screens (Denver Peak Fitness, Mile High Sports Bar, …)
```

## A1. Non-admin blocked — PASS expected

```bash
# Advertiser session cookie jar from MVP smoke (or re-login)
curl -s -o /dev/null -w "%{http_code}" -b /tmp/adv-cookies.txt http://localhost:3000/api/admin/hosts
# expect 403

curl -s -o /dev/null -w "%{http_code}" -b /tmp/adv-cookies.txt -L http://localhost:3000/admin/hosts
# UI redirects away from admin (307 → dashboard)
```

## A2. Admin list seeded hosts — PASS expected

```bash
# Admin login (admin@adnabbit.com / admin123!)
curl -s -c /tmp/admin-cookies.txt http://localhost:3000/api/auth/csrf
# then credentials callback with csrfToken…

curl -s -b /tmp/admin-cookies.txt http://localhost:3000/api/admin/hosts | head -c 500
# expect hosts array with vertical GYM, SPORTS_BAR, MEDICAL_DENTAL, OTHER(+otherLabel)
```

## A3. Create host with vertical + OTHER otherLabel — PASS expected

```bash
curl -s -b /tmp/admin-cookies.txt -X POST http://localhost:3000/api/admin/hosts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Cafe","vertical":"RESTAURANT_FB"}'
# expect 201

curl -s -b /tmp/admin-cookies.txt -X POST http://localhost:3000/api/admin/hosts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Other","vertical":"OTHER"}'
# expect 400 otherLabel required

curl -s -b /tmp/admin-cookies.txt -X POST http://localhost:3000/api/admin/hosts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Other","vertical":"OTHER","otherLabel":"Pop-up market"}'
# expect 201
```

## A4. Create screen (no vertical on screen) — PASS expected

```bash
HOST_ID=…  # from create or list
curl -s -b /tmp/admin-cookies.txt -X POST http://localhost:3000/api/admin/screens \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke Lobby\",\"city\":\"Aurora\",\"zip\":\"80012\",\"inventoryStatus\":\"OPEN\",\"hostId\":\"$HOST_ID\"}"
# expect 201; response host.vertical present via join, no vertical field on screen itself
```

## A5. Filter screens — PASS expected

```bash
curl -s -b /tmp/admin-cookies.txt "http://localhost:3000/api/admin/screens?city=Denver"
curl -s -b /tmp/admin-cookies.txt "http://localhost:3000/api/admin/screens?zip=80202"
curl -s -b /tmp/admin-cookies.txt "http://localhost:3000/api/admin/screens?inventoryStatus=OPEN"
curl -s -b /tmp/admin-cookies.txt "http://localhost:3000/api/admin/screens?vertical=GYM"
```

## A6. UI pages — PASS expected

| Path | Cookie | Expect |
|------|--------|--------|
| `/admin/hosts` | admin | 200 |
| `/admin/screens` | admin | 200 |
| `/admin/hosts` | advertiser | redirect |
| `/admin/screens?city=Denver&vertical=GYM` | admin | 200 filtered |

## Demo path

1. Log in as `admin@adnabbit.com` / `admin123!`
2. Nav → **Hosts** → browse seeded venues; open one; note vertical
3. Nav → **Screens** → filter by city Denver + vertical GYM
4. Create host (pick vertical; if OTHER fill otherLabel) → create screen under it

## Blockers

None for local Ticket A.


## Ticket A verified results (2026-09-18 ~1:30 PM MT)

| Check | Result |
|-------|--------|
| A1 Non-admin API `/api/admin/hosts` | **PASS** HTTP 403 |
| A1 Non-admin UI `/admin/hosts` | **PASS** HTTP 307 → `/dashboard` |
| A2 Admin list hosts (seeded) | **PASS** GYM, SPORTS_BAR, MEDICAL_DENTAL, OTHER(+Coworking) |
| A3 Create host `RESTAURANT_FB` | **PASS** 201 |
| A3 OTHER without otherLabel | **PASS** 400 |
| A3 OTHER with otherLabel | **PASS** 201 |
| A4 Create screen | **PASS** no `vertical` on screen; `host.vertical` via join |
| A5 Filter city/zip/inventory/vertical | **PASS** (e.g. vertical=GYM → 2) |
| A6 Admin UI pages | **PASS** all 200 |

Forge vertical lock confirmed in seed/API: `GYM`, `PROFESSIONAL` (not GYM_FITNESS / PROFESSIONAL_SERVICES).

---

# Ticket B — Advertiser public profiles smoke

**Date:** 2026-09-18 (America/Denver)  
**Prereq:** migrations applied (`advertiser_profiles`), `npm run db:seed`, `npm run dev` on :3000

## Setup

```bash
cd /workspace/adnabbit-web
npx prisma migrate dev --name advertiser_profiles   # already applied on this branch
npm run db:seed
# Seeded demo.advertiser@adnabbit.com / demo123! + published /a/front-range-hvac
npm run dev
```

## B1. Public published profile — PASS expected

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/a/front-range-hvac
# expect 200; body contains "Front Range HVAC"
curl -s http://localhost:3000/a/front-range-hvac | grep -o "Front Range HVAC" | head -1
```

## B2. Unpublished / missing → soft not available — PASS expected

```bash
curl -s http://localhost:3000/a/does-not-exist | grep -o "Profile not available" | head -1
# expect "Profile not available"
```

## B3. Advertiser create/edit + publish — PASS expected

```bash
# Login as demo.advertiser@adnabbit.com / demo123! (CSRF + credentials callback → /tmp/demo-cookies.txt)

curl -s -b /tmp/demo-cookies.txt http://localhost:3000/api/profile
# expect existing Front Range HVAC profile

curl -s -b /tmp/demo-cookies.txt -X PUT http://localhost:3000/api/profile \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Front Range HVAC","pitch":"Updated pitch","website":"https://example.com","contact":"303-555-0100","category":"PROFESSIONAL","serviceAreaZips":"80202,80205","published":true}'
# expect 200, slug front-range-hvac (or collision-safe)
```

## B4. Non-advertiser cannot edit profile — PASS expected

```bash
curl -s -o /dev/null -w "%{http_code}" -b /tmp/admin-cookies.txt -X PUT http://localhost:3000/api/profile \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Nope","published":true}'
# expect 403
```

## B5. Admin list + unpublish — PASS expected

```bash
curl -s -b /tmp/admin-cookies.txt http://localhost:3000/api/admin/profiles | head -c 400
# expect profiles array with published Front Range HVAC

PROFILE_ID=…  # from list
curl -s -b /tmp/admin-cookies.txt -X POST http://localhost:3000/api/admin/profiles/$PROFILE_ID/unpublish
# expect published:false

curl -s http://localhost:3000/a/front-range-hvac | grep -o "Profile not available" | head -1
# expect not available after unpublish

# Re-publish via demo advertiser PUT published:true for further demos
```

## B6. UI pages — PASS expected

| Path | Cookie | Expect |
|------|--------|--------|
| `/a/front-range-hvac` | — | 200 (when published) |
| `/profile` | demo advertiser | 200 |
| `/admin/profiles` | admin | 200 |
| `/admin/profiles` | advertiser | redirect |
| `/api/admin/profiles` | advertiser | 403 |

## Demo path

1. Open http://localhost:3000/a/front-range-hvac (anonymous) — see Front Range HVAC
2. Log in as `demo.advertiser@adnabbit.com` / `demo123!` → **Profile** → edit pitch / publish
3. Log in as `admin@adnabbit.com` / `admin123!` → **Profiles** → Unpublish → public page shows not available

## Blockers

None for local Ticket B.

## Ticket B verified results (2026-09-18 ~1:35 PM MT)

| Check | Result |
|-------|--------|
| B1 Public `/a/front-range-hvac` | **PASS** HTTP 200, “Front Range HVAC” |
| B2 Missing slug soft not-available | **PASS** |
| B3 Advertiser GET/PUT `/api/profile` | **PASS** slug `front-range-hvac` |
| B4 Admin PUT `/api/profile` | **PASS** HTTP 403 |
| B5 Admin list + unpublish | **PASS** public becomes not available; re-publish restores 200 |
| B6 UI `/profile`, `/admin/profiles` | **PASS** 200 for roles; advertiser 403/307 on admin |
| Slug collision | **PASS** second “Front Range HVAC” → `front-range-hvac-1` |

Demo stays published at `/a/front-range-hvac` after smoke (re-published).
