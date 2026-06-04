# Агуулахын Удирдлагын Систем

Multi-tenant агуулахын удирдлагын веб систем. Тус бүр бие даасан агуулахтай олон хэрэглэгчийг дэмждэг.

## Технологийн Stack

| Хэсэг | Технологи |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + Recharts |
| Auth | Auth.js v5 (next-auth beta) |
| ORM | Prisma 7 + PostgreSQL |
| Имэйл | Resend |
| Push | Web Push (VAPID) |
| Deploy | Railway + Docker |

## Үндсэн боломжууд

- **Бараа бүртгэл** — код/нэр/ангилал, давтагдахгүй код
- **Орлого (Stock-In)** — batch/lot, дуусах хугацаа, нийлүүлэгч
- **Зарлага (Stock-Out)** — FEFO зарчмаар автомат batch сонголт
- **Тайлан** — үлдэгдэл, хугацаа хэтрэлтийн статус, CSV export
- **Dashboard** — 8 статистик карт + 6 сарын Recharts диаграм
- **Мэдэгдэл** — DB → SSE real-time → Имэйл (Resend) + Web Push

## Локал Хөгжүүлэлт

### Шаардлага

- Node.js 20+
- Docker (PostgreSQL ажиллуулахад)

### 1. Төсөл клонлох

```bash
git clone <repo-url>
cd warehouse-app
npm install
```

### 2. Орчны хувьсагч тохируулах

```bash
cp .env.example .env.local
```

`.env.local`-г засаж дараах утгуудыг бөглөнө:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/warehouse
AUTH_SECRET=<openssl rand -hex 32>
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
RESEND_API_KEY=re_xxxx
EMAIL_FROM="Агуулах <noreply@your-domain.com>"
CRON_SECRET=<openssl rand -hex 32>
VAPID_PUBLIC_KEY=<npx web-push generate-vapid-keys>
VAPID_PRIVATE_KEY=<npx web-push generate-vapid-keys>
```

### 3. Мэдээллийн сан асаах (Docker)

```bash
docker compose up -d
```

### 4. Prisma migration

```bash
npx prisma migrate dev --name init
```

### 5. Сервер асаах

```bash
npm run dev
```

Браузерт: http://localhost:3000

## Railway Deploy

### 1. Railway дээр шинэ project үүсгэнэ

Railway dashboard → New Project → Empty Project

### 2. PostgreSQL нэмнэ

Add Plugin → PostgreSQL

Railway автоматаар `DATABASE_URL` environment variable тохируулна.

### 3. Орчны хувьсагч оруулна

Railway → Settings → Variables:

```
AUTH_SECRET=<hex 64>
AUTH_URL=https://<your-app>.up.railway.app
AUTH_TRUST_HOST=true
RESEND_API_KEY=re_xxxx
EMAIL_FROM="Агуулах <noreply@your-domain.com>"
CRON_SECRET=<hex 64>
VAPID_PUBLIC_KEY=<vapid key>
VAPID_PRIVATE_KEY=<vapid key>
```

### 4. Deploy

```bash
railway up
```

эсвэл GitHub repo холбоод автоматаар deploy хийнэ.

### 5. Migration

Railway shell дээр:

```bash
npx prisma migrate deploy
```

## Cron Jobs

`railway.toml`-д тодорхойлогдсон 2 cron ажил:

| Ажил | Цаг | Зорилго |
|---|---|---|
| `daily-scan` | 08:00 өдөр бүр | Дуусах хугацааг шалгаж мэдэгдэл үүсгэнэ |
| `retry-dispatch` | 30 минут тутам | Илгээгдээгүй мэдэгдлийг дахин оролдоно |

Cron endpoint-уудыг `CRON_SECRET` Bearer token-оор хамгаалдаг.

## Web Push тохируулах

```bash
npx web-push generate-vapid-keys
```

Гарах public болон private key-г `.env.local`-д хийнэ. Хэрэглэгч Settings хуудаснаас push мэдэгдэл идэвхжүүлнэ.

## Хөгжүүлэлтийн тушаалууд

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run typecheck    # TypeScript шалгалт
npx prisma studio    # DB GUI
npx prisma generate  # Client дахин үүсгэх
```
