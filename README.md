# StockMate — Агуулахын Удирдлагын Систем

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

## Боломж ба чадамж

### Хяналтын самбар (Dashboard)
- Нийт бараа, үлдэгдэл, нөөцийн үнэлгээ, сарын орлого/зарлага зэрэг **8 статистик карт**
- **6 сарын Recharts диаграм** — орлого/зарлагын хөдөлгөөн
- Агуулахын **дүүргэлт хувь** (тохируулсан багтаамжтай харьцуулан)
- **Ангиллын хуваарилалт** — ямар бараа хэдэн % эзэлж байгааг харах
- Ойрхон дуусах болон хугацаа хэтэрсэн барааны **сэрэмжлүүлэг хэсэг**

### Бараа (Products)
- Код, нэр, ангилал, нэгж, нэгжийн үнэ, байршил, баркод/SKU бүртгэл
- Агуулах дотор **давтагдахгүй код** шалгалт
- **Доод хязгаар** тохируулах — хязгаараас доош унахад автомат мэдэгдэл
- Дуусах хугацааны **хяналтын тэмдэглэгээ** (isPerishable)
- Зурагтай бараа бүртгэх дэмжлэг

### Орлого (Stock-In)
- Batch/lot дугаар, дуусах хугацаа, нийлүүлэгч, баримтын дугаар бүртгэл
- Нэг барааны **олон batch** зэрэг орлого хийх боломж

### Зарлага (Stock-Out)
- **FEFO (First Expired, First Out)** зарчмаар автомат batch сонголт
- Хүлээн авагч, баримтын дугаар бүртгэл

### Тайлан (Report)
- Бүх барааны үлдэгдэл, хугацааны статус нэг дор харах
- **CSV export** хийх боломж

### Мэдэгдэл (Notifications)
- Дуусах хугацааны **олон шатны сэрэмжлүүлэг** (60/30/14/7 өдрийн босго, тохируулах боломжтой)
- Доод нөөцийн сэрэмжлүүлэг
- **SSE real-time** мэдэгдэл (хуудас дахин ачаалахгүйгээр)
- **Имэйл** (Resend) болон **Web Push (VAPID)** мэдэгдэл
- Мэдэгдэл илгээлтийн retry механизм (PENDING → SENT / FAILED)

### Ажилтан (Staff)
- Захирал / Менежер / Ажилтан гэсэн **3 үүргийн** бүртгэл
- Утас, имэйл, тэмдэглэл хадгалах
- Ажилтан идэвхжүүлэх / идэвхгүй болгох

### Аудит лог (Logs)
- Бүх үйлдлийг **хэн, хэзээ, юу хийсэн** гэж бүртгэдэг
- Хяналт хийх үйлдлүүд: орлого, зарлага, бараа нэмэх/засах/устгах, ажилтан нэмэх/хасах, тохиргоо шинэчлэх
- **Хуудаслалт** болон **үйлдлийн төрлөөр шүүлт** хийх боломж

### Тохиргоо (Settings)
- Мэдэгдлийн босго өдрүүд, имэйл/push идэвхжүүлэх
- Агуулахын **нийт багтаамж** болон нэгж тохируулах
- Web Push бүртгэл хийх / цуцлах

### Multi-warehouse
- Нэг бүртгэлтэй хэрэглэгч **олон агуулах** үүсгэж удирдах боломж
- Sidebar дээрх **switcher**-ээр агуулах солих

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
