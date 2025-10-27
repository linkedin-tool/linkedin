# Basic Platformen

En simpel og kraftfuld platform til at håndtere brugerregistrering, betalinger og abonnementer.

## Funktioner

- 🔐 **Brugeradministration** - Registrering, login og profil administration
- 💳 **Stripe Integration** - Sikre betalinger og abonnementshåndtering
- 📊 **Dashboard** - Komplet overblik over brugere og abonnementer
- ⚡ **Gratis Prøveperiode** - 7 dages gratis adgang til alle funktioner
- 🎯 **Pro Abonnement** - Fuld adgang til platformen

## Teknologi Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Betalinger**: Stripe
- **UI Komponenter**: shadcn/ui

## Kom i gang

### 1. Klon projektet

```bash
cd "/Users/rubenjuncher/Udvikling/To projekter/basic"
```

### 2. Installer dependencies

```bash
npm install
```

### 3. Opsæt environment variabler

Kopier `env.example` til `.env.local` og udfyld med dine værdier:

```bash
cp env.example .env.local
```

Udfyld følgende variabler:
- `NEXT_PUBLIC_SUPABASE_URL` - Din Supabase projekt URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Din Supabase anon key
- `STRIPE_SECRET_KEY` - Din Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Din Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Din Stripe webhook secret
- `STRIPE_PRICE_ID` - Dit Stripe price ID for Pro abonnement

### 4. Opsæt Supabase database

Kør migrationerne i din Supabase database:

```sql
-- Kør filerne i supabase/migrations/ i rækkefølge
-- 01_create_users_table.sql
-- 02_create_expire_trials_function.sql
-- 03_setup_trial_expiry_cron.sql
```

### 5. Opsæt Stripe

1. Opret et produkt og pris i Stripe Dashboard
2. Opsæt webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Vælg følgende events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 6. Start udviklings server

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

## Projektstruktur

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── create-checkout-session/
│   │   ├── create-portal-session/
│   │   ├── checkout-success/
│   │   └── webhooks/stripe/
│   ├── auth/                   # Authentication sider
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/              # Dashboard sider
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx               # Forside
├── components/
│   ├── ui/                    # UI komponenter
│   ├── Header.tsx
│   └── Footer.tsx
└── lib/
    ├── supabase/              # Supabase konfiguration
    ├── stripe.ts              # Stripe konfiguration
    ├── stripe-client.ts
    └── utils.ts
```

## Deployment

### Vercel (Anbefalet)

1. Push til GitHub
2. Forbind repository til Vercel
3. Tilføj environment variabler i Vercel dashboard
4. Deploy

### Supabase Edge Functions (Valgfrit)

For at køre trial expiry funktionen som Edge Function i stedet for cron job:

```bash
supabase functions deploy expire-trials
```

## Support

For spørgsmål eller support, kontakt: support@basicplatform.dk

## Licens

Dette projekt er privat og ikke til offentlig brug.# linkedin-tool
