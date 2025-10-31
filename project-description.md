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
- **🚀 NYHED: Optimeret billedupload workflow** - Billeder uploades til LinkedIn med det samme når opslag planlægges, hvilket reducerer API-kald ved udgivelse

### 3. **Dashboard Funktionalitet**
- `/dashboard` - **LinkedIn-fokuseret overblik** med KPI'er, seneste opslag og kommende planlagte opslag ✨ *Opdateret*
- `/dashboard/settings` - Bruger indstillinger
- `/dashboard/integration` - LinkedIn forbindelse ✨ *Ny*
- `/dashboard/new-post` - Opret LinkedIn posts ✨ *Ny*
- `/dashboard/content-plan` - Kalender visning af planlagte opslag ✨ *Nyligt tilføjet*
- `/dashboard/mine-opslag` - Oversigt over alle opslag med søgning og filtrering

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
- `linkedin_posts` - Historie over udgivne og planlagte LinkedIn posts med scheduling support
  - `status` - 'published', 'scheduled', 'failed'
  - `scheduled_for` - Planlagt udgivelsestidspunkt (NULL for øjeblikkelige posts)
  - `published_at` - Faktisk udgivelsestidspunkt (NULL for planlagte posts)
  - `ugc_post_id` - LinkedIn post ID (NULL for planlagte posts indtil udgivelse)
  - **🚀 NYHED: Billedupload tracking felter**:
    - `image_upload_status` - 'pending', 'uploaded', 'failed'
    - `linkedin_image_urn` - LinkedIn URN for uploadet billede
    - `image_upload_error` - Fejlbesked hvis upload fejler
    - `image_file_size`, `image_file_type`, `image_original_name` - Metadata

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
│   │   │   └── post/          # Post creation & scheduling ✨
│   │   └── stripe/            # Stripe webhooks
│   ├── dashboard/
│   │   ├── integration/       # LinkedIn connection ✨
│   │   ├── new-post/          # Post creation UI med scheduling ✨
│   │   ├── content-plan/      # Kalender visning ✨ *Nyligt tilføjet*
│   │   ├── mine-opslag/       # Opslag oversigt
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
3. Vælger "Udgiv nu" eller "Planlæg"
4. POST til `/api/linkedin/post` med `publishType` parameter

**Øjeblikkelig udgivelse (`publishType: "now"`):**
5a. Billede upload til LinkedIn (hvis relevant):
   - `registerUpload` → upload binary → asset URN
6a. UGC Post creation via LinkedIn API
7a. Gem post data i Supabase med `status: "published"`

**Planlagt udgivelse (`publishType: "schedule"`):**
5b. Billede upload kun til Supabase Storage (optimeret)
6b. Gem post data i Supabase med `status: "scheduled"` og `scheduled_for` timestamp

### **3. Content Planning Flow** ✨ *Nyligt tilføjet*
1. Bruger navigerer til `/dashboard/content-plan`
2. Kalender viser månedsoversigt med:
   - Udgivne opslag (grøn)
   - Planlagte opslag (blå) 
   - Fejlede opslag (rød)
3. Klik på opslag åbner detaljeret modal
4. Modal viser samme interface som "Mine Opslag" siden

### **4. Dashboard Overview Flow** ✨ *Nyligt opdateret*
1. Bruger ser LinkedIn-fokuserede KPI'er:
   - **Samlede opslag**: Totalt antal oprettede opslag
   - **Planlagte opslag**: Antal afventende udgivelser
   - **Udgivet denne måned**: Månedlig aktivitet
   - **LinkedIn status**: Forbindelsesstatus med dynamisk styling
2. **Seneste opslag** sektion viser de sidste 5 udgivne opslag med:
   - Truncated tekst (80 karakterer)
   - Visibility badges (Offentlig/Forbindelser)
   - Udgivelsesdato
3. **Kommende planlagte opslag** viser næste 5 planlagte posts sorteret efter dato
4. **Hurtige handlinger** med kontekstuel LinkedIn integration status

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
- ✅ **🚀 NYEST: Optimeret billedupload workflow**
  - Billeder uploades til LinkedIn øjeblikkeligt ved planlægning
  - LinkedIn URN gemmes i database for senere brug
  - Ny `/api/linkedin/publish-scheduled` endpoint
  - Udvidet database schema med upload tracking
- ✅ **🎯 NYEST: Planlagt Opslag Management**
  - "Udgiv Nu" funktionalitet for planlagte opslag
  - "Ændre Dato" funktionalitet med DateTimePicker
  - Action dropdown menu i Mine Opslag
  - Content Plan modal actions
  - Ny `/api/linkedin/reschedule` endpoint
- ✅ **✏️ NYEST: Rediger Opslag Funktionalitet**
  - "Rediger opslag" mulighed for alle opslag
  - Permanent tre-prikker menu (kun øje-ikon ved hover)
  - Pre-udfyldt new-post form i edit mode
  - Ny `/api/linkedin/update-post` endpoint
  - Seamless navigation mellem Mine Opslag og redigering
  - **🖼️ NYEST**: Billede management i edit mode - viser eksisterende billeder med mulighed for at fjerne/erstatte
- ✅ **📸 NYEST: Flere Billeder Support (Op til 9 billeder)**
  - Ny `linkedin_post_images` tabel for skalérbar billede håndtering
  - Frontend understøtter upload af flere billeder samtidig
  - LinkedIn API multiImage payload for flere billeder
  - Korrekt URN håndtering ved sletning/erstatning af billeder
  - Edit mode viser og håndterer alle eksisterende billeder
  - **🧹 Database cleanup**: Fjernet overflødige billede kolonner fra `linkedin_posts` tabel
  - **🖼️ Smart billede visning**: 
    - Liste view: Første billede som thumbnail + "+X" indikator for flere
    - Modal view: Enkelt billede stort, flere billeder i responsive grid
    - Maks 4 billeder synlige med "+X" overlay for resten
  - **🗑️ Selektiv billede sletning**: Korrekt sletning af specifikke billeder i edit mode
- ✅ **🗑️ NYEST: Slet Opslag Funktionalitet**
  - "Slet opslag" mulighed for alle opslag (både planlagte og udgivne)
  - SweetAlert2 bekræftelsesdialog med advarsel
  - Automatisk sletning af tilknyttede billeder (CASCADE)
  - Tilgængelig i både Mine Opslag dropdown og Content Plan modal
  - Øjeblikkelig opdatering af UI efter sletning
- ✅ **🎨 NYEST: Minimalistisk Modal Design**
  - **Tre-prikker menu** i modal header (MoreVertical ikon)
  - **Permanent grå baggrund** på header knapper (tre-prikker + luk)
  - Alle actions samlet i elegant dropdown menu
  - **Ren og simpel** modal uden knap-rod i bunden
  - **Konsistent styling** med Mine Opslag:
    - ⚫ "Rediger opslag" (neutral grå tekst)
    - ⚫ "Udgiv nu" (neutral grå tekst, Send ikon)
    - ⚫ "Ændre dato" (neutral grå tekst, Clock ikon)  
    - 🔴 "Slet opslag" (rød tekst og hover)
  - **HR separatorer** mellem sektioner
  - **Click outside** og **escape** lukker menu automatisk
  - **Moderne UX** inspireret af sociale medier og mobile apps
- ✅ **🎨 NYEST: Standardiserede Visibility Farver**
  - **Konsistente farver** på tværs af alle sider:
    - 🔵 **"Offentligt"**: `bg-blue-100 text-blue-800` (blå)
    - 🟣 **"Kun forbindelser"**: `bg-purple-100 text-purple-800` (lilla)
  - **Synlige badges** i alle modaler og lister
  - **Centraliserede styling funktioner** for nem vedligeholdelse
  - **Fikset usynligt "Offentligt" tag** i Content Plan modal
- ✅ **🎯 NYEST: Smart Return Navigation**
  - **Intelligent navigation** efter redigering af opslag
  - **Mine Opslag** → Rediger → Gem → **Tilbage til Mine Opslag**
  - **Content Plan** → Rediger → Gem → **Tilbage til Content Plan**
  - **Dynamiske beskeder** viser korrekt destination
  - **Forbedret UX** - brugeren kommer tilbage hvor de startede
- ✅ **🖼️ NYEST: Optimeret Billedvisning i Modaler**
  - **Adaptiv højde** baseret på antal billeder:
    - **2 billeder**: `h-40` (160px) - bedre detaljevisning
    - **3+ billeder**: `h-32` (128px) - kompakt grid layout
  - **Konsistent visning** på tværs af Mine Opslag og Content Plan
  - **Forbedret proportioner** - mindre "aflang" effekt
  - **Optimal modal udnyttelse** uden for meget scrolling
- ✅ **🖼️ NYEST: Professionel Lightbox Funktionalitet**
  - **Klikbare billeder** i alle modaler - åbner lightbox ved klik
  - **Fuld størrelse visning** med `object-contain` (hele billedet synligt)
  - **Elegant navigation**:
    - ← → **pil-knapper** mellem billeder
    - **Keyboard navigation** (ESC, Arrow keys)
    - **Billednummer indikator** (1 af 4)
    - **Dot navigation** for hurtig spring mellem billeder
  - **Moderne UX features**:
    - **Mørk overlay** baggrund (90% opacity)
    - **Smooth transitions** og hover-effekter
    - **Loading spinner** for store billeder
    - **Click outside** og **ESC** for at lukke
    - **Body scroll lock** når lightbox er åben
  - **Portal rendering** for optimal z-index håndtering
  - **Konsistent på tværs af Mine Opslag og Content Plan**
- ✅ **🎨 NYEST: Standardiseret Modal Overlay**
  - **Konsistent backdrop** på tværs af alle modaler
  - **Glassmorphism effekt**: `bg-black/10 backdrop-blur-[2px]`
  - **Moderne blur overlay** erstatter simple transparente baggrunde
  - **Bedre fokus** på modal indhold med subtil blur
  - **Ensartet UX** mellem Mine Opslag og Content Plan modaler
- ✅ **🎯 NYEST: Konsistent Modal Actions**
  - **Tre-prikker menu** nu også i Mine Opslag modal
  - **Identiske actions** på tværs af begge modaler:
    - Rediger opslag, Udgiv nu, Ændre dato, Slet opslag
  - **Samme styling** og baggrundsfarver på ikoner
  - **100% konsistent UX** mellem Mine Opslag og Content Plan
  - **Modal komponent** bruges overalt for ensartet adfærd
- ✅ **🎨 NYEST: SweetAlert2 Integration**
  - Elegant animerede success beskeder med flueben
  - Toast notifications i top-højre hjørne
  - Erstatter alle browser alerts med pæne popups
  - Konsistent UX på tværs af alle handlinger
  - **🎨 Custom styling**: Større border radius (24px modal, 12px knapper) for moderne look
  - **🎯 Brand-konsistent**: Følger projektets design system med Figtree font og farvepalette

### **Next Steps**
- [ ] Token refresh implementering
- [ ] Chrome function til automatisk udgivelse af planlagte opslag (nu meget nemmere!)
- [ ] Error handling forbedringer for fejlede billeduploads
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
