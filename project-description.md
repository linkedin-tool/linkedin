# LinkedIn Tool Projekt - Project Description

## 📋 Project Overview

Dette projekt er en Next.js-baseret SaaS platform der giver brugere mulighed for at administrere og udgive indhold på LinkedIn gennem en integreret dashboard-løsning.

## 🎯 Core Features

### 1. **Bruger Autentificering & Abonnement**
- Supabase Auth integration for bruger login/signup
- Stripe integration for abonnement håndtering
- Trial periode funktionalitet med automatisk udløb

### 2. **LinkedIn Integration** ✨ *Nyligt tilføjet*
- **OAuth 2.0 + OIDC** integration med LinkedIn
- **Scope**: `openid profile email w_member_social`
- **UGC Posts API** til at udgive indhold med billeder
- **Asset Upload** til LinkedIn billede håndtering

### 3. **Dashboard Funktionalitet**
- `/dashboard` - Hovedoversigt
- `/dashboard/settings` - Bruger indstillinger
- `/dashboard/integration` - LinkedIn forbindelse ✨ *Ny*
- `/dashboard/new-post` - Opret LinkedIn posts ✨ *Ny*

## 🏗️ Technical Architecture

### **Frontend**
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Custom Design System
- **UI Components**: Custom komponenter følger design guidelines
- **TypeScript**: Fuldt type-safe implementation

### **Backend & Database**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (hvis nødvendigt)
- **API Routes**: Next.js API routes

### **External Integrations**
- **Stripe**: Betalinger og abonnement
- **LinkedIn API**: Social media integration
- **Make.com**: Webhook og automation håndtering

## 🗄️ Database Schema

### **Core Tables**
- `auth.users` - Supabase bruger tabel
- `user_profiles` - Udvidet bruger information
- `subscriptions` - Stripe abonnement data

### **LinkedIn Integration Tables** ✨ *Nyligt tilføjet*
- `linkedin_profiles` - LinkedIn OAuth tokens og profil data
- `linkedin_posts` - Historie over udgivne LinkedIn posts

## 🔐 Environment Configuration

### **Supabase** (Auto-managed via MCP)
- URL og keys hentes automatisk via Supabase MCP integration

### **LinkedIn OAuth**
```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/api/linkedin/callback
LINKEDIN_SCOPES=openid profile email w_member_social
```

### **Stripe**
- Håndteres via eksisterende Stripe integration

### **Make.com**
- OpenAI API key administreres i Make.com workflows

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── linkedin/          # LinkedIn API endpoints ✨
│   │   │   ├── auth/          # OAuth initiation
│   │   │   ├── callback/      # OAuth callback
│   │   │   └── post/          # Post creation
│   │   └── stripe/            # Stripe webhooks
│   ├── dashboard/
│   │   ├── integration/       # LinkedIn connection ✨
│   │   ├── new-post/          # Post creation UI ✨
│   │   └── settings/
│   └── auth/                  # Authentication pages
├── components/
│   └── ui/                    # Reusable UI components
└── lib/
    ├── supabase/              # Database clients
    └── stripe/                # Payment integration
```

## 🔄 LinkedIn Integration Flow

### **1. Authentication Flow**
1. Bruger klikker "Connect LinkedIn" på `/dashboard/integration`
2. Redirect til `/api/linkedin/auth` → LinkedIn OAuth
3. LinkedIn callback til `/api/linkedin/callback`
4. Token exchange og profil oprettelse i database
5. Redirect tilbage til dashboard med success/error status

### **2. Post Creation Flow**
1. Bruger udfylder form på `/dashboard/new-post`
2. Optional billede upload
3. POST til `/api/linkedin/post`
4. Billede upload til LinkedIn (hvis relevant):
   - `registerUpload` → upload binary → asset URN
5. UGC Post creation via LinkedIn API
6. Gem post data i Supabase

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+
- Supabase projekt
- LinkedIn Developer App
- Stripe konto

### **Local Development**
```bash
npm install
npm run dev  # Starter på port 3000 (eller næste tilgængelige)
```

### **Environment Setup**
1. Opret `.env.local` med LinkedIn credentials
2. Supabase connection håndteres automatisk via MCP
3. Stripe keys skal konfigureres for payment flow

## 📋 Recent Updates

### **LinkedIn Integration Implementation** (Latest)
- ✅ Supabase tabeller oprettet (`linkedin_profiles`, `linkedin_posts`)
- ✅ OAuth 2.0 flow implementeret med OIDC
- ✅ UGC Posts API med billede upload support
- ✅ Dashboard sider for integration og post creation
- ✅ Komplet API endpoint struktur

### **Next Steps**
- [ ] Token refresh implementering
- [ ] Error handling forbedringer
- [ ] Post historie visning
- [ ] Bulk post scheduling (fremtidig feature)

## 🎨 Design System

Projektet følger et moderne, organisk design inspireret af Apple's designsprog. Se `design-guidelines.md` for detaljerede retningslinjer omkring:
- Typografi (Geist font)
- Farvepalette (Professionel blå primær)
- Border radius system (Organiske runde hjørner)
- Knap design (Helt runde knapper)
- Animation og transitions

---

*Denne fil opdateres løbende når nye features tilføjes eller ændres.*
