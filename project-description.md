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
- `/dashboard/new-post` - Opret LinkedIn posts ✨ *Opdateret med kladde funktionalitet*
- `/dashboard/content-plan` - Kalender visning af planlagte opslag ✨ *Nyligt tilføjet*
- `/dashboard/mine-opslag` - Oversigt over alle opslag med søgning og filtrering ✨ *Opdateret med kladde og fejlede support*

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
- **Edge Functions**: Supabase Edge Functions til scheduled post publishing

### **External Integrations**
- **Stripe**: Betalinger og abonnement
- **LinkedIn API**: Social media integration
- **Make.com**: Webhook og automation håndtering

### **Scalability & Performance** ✨ *Nyligt forbedret*
- **Batch Processing**: Edge function processer LinkedIn posts i batches af 50 for optimal performance
- **Retry Logic**: Automatisk retry med exponential backoff ved API fejl
- **Timeout Protection**: 30 sekunders timeout på LinkedIn API calls
- **Error Categorization**: Intelligent fejlhåndtering der skelner mellem retryable og permanente fejl
- **Progress Logging**: Detaljeret logging af batch fremgang for monitoring

## 🗄️ Database Schema

### **Core Tables**
- `auth.users` - Supabase bruger tabel
- `user_profiles` - Udvidet bruger information
- `subscriptions` - Stripe abonnement data

### **LinkedIn Integration Tables** ✨ *Nyligt tilføjet*
- `linkedin_profiles` - LinkedIn OAuth tokens og profil data
- `linkedin_posts` - Historie over udgivne, planlagte og kladde LinkedIn posts med scheduling support ✨ *Opdateret*
  - `status` - 'published', 'scheduled', 'failed', 'draft' ✨ *Ny kladde status*
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
5b. Billede upload til både LinkedIn og Supabase Storage (optimeret workflow)
6b. Gem post data i Supabase med `status: "scheduled"` og `scheduled_for` timestamp

**Kladde (`publishType: "draft"`):** ✨ *Nyligt tilføjet*
5c. Billede upload kun til Supabase Storage (ikke LinkedIn)
6c. Gem post data i Supabase med `status: "draft"` (ingen scheduled_for eller published_at)

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

### **5. Draft Management Flow** ✨ *Nyligt tilføjet*
1. **Oprettelse af kladder**:
   - Fra `/dashboard/new-post` med "Gem som kladde" knap
   - Billeder uploades kun til Supabase (ikke LinkedIn)
   - Gemmes med `status: "draft"`

2. **Kladde oversigt**:
   - Filter for "Kladder" på `/dashboard/mine-opslag`
   - Grå badge styling for kladde status
   - Samme action menu som andre opslag

3. **Konvertering af planlagte opslag til kladder**:
   - "Konverter til kladde" knap for planlagte opslag
   - Fjerner `scheduled_for` tidspunkt
   - Ændrer status fra "scheduled" til "draft"

4. **Redigering af kladder**:
   - Samme edit workflow som andre opslag
   - Pre-udfylder alle felter inkl. eksisterende billeder
   - Kan konverteres til planlagt eller øjeblikkelig udgivelse

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
- ✅ **📝 NYEST: Optimized Calendar Layout**
  - **Maximum 2 visible posts**: Kalender viser maksimalt 2 opslag per dag for konsistens
  - **Fixed row heights**: Alle kalender rækker har præcis samme højde (110px)
  - **Optimal spacing**: Plads til 2 opslag + "+X flere" knap i hver celle
  - **"+X flere" threshold**: Vises kun når der er mere end 2 opslag (ikke 3)
  - **Consistent visual hierarchy**: Perfekt balance mellem indhold og whitespace
  - **Professional appearance**: Ensartet grid layout som moderne kalendersystemer
  - **Realistic usage**: Optimeret for typisk posting frekvens (1-2 posts per dag)
  - **Clean design**: Eliminerer variable række højder for bedre visuel ro
- ✅ **📝 FORRIGE: Failed Posts Recovery Options**
  - **Problem**: Opslag med status "fejlet" havde ingen recovery muligheder
  - **Solution**: Fejlede opslag får samme valgmuligheder som kladder
  - **Recovery options**: "Udgiv nu", "Planlæg opslag", "Rediger opslag", "Slet opslag"
  - **Consistent UX**: Samme funktionalitet på tværs af Mine Opslag og Content Plan
  - **Smart scheduling**: Fejlede opslag bruger schedule modal (ny planlægning) i stedet for reschedule
  - **Status transitions**: Fejlede opslag kan ændres til 'scheduled' eller 'published' via update-post API
  - **User empowerment**: Brugere kan nu nemt håndtere tekniske fejl og API problemer
- ✅ **📝 FORRIGE: Fixed Draft Edit Status Bug**
  - **Problem**: "Gem ændringer" på kladder forsøgte at udgive til LinkedIn i stedet for at gemme som kladde
  - **Root cause**: Default `publishType` var "now", så `editPostStatus === 'draft' && publishType !== 'draft'` var altid true
  - **Solution**: Ændret `publishType` til optional parameter og opdateret logik
  - **Logic**: Kun sæt `newStatus` hvis `publishType` er eksplicit angivet ("now" eller "schedule")
  - **Draft editing**: "Gem ændringer" uden `publishType` bevarer nu eksisterende status
  - **Error prevention**: Eliminerer "LinkedIn access token not found" fejl ved simpel kladde redigering
  - **Preserved functionality**: "Udgiv nu" og "Planlæg opslag" knapper fungerer stadig korrekt
  - **Image upload**: Billeder uploades stadig til LinkedIn for pre-upload optimering
- ✅ **📝 FORRIGE: LinkedIn "Vis på LinkedIn" Integration**
  - **Direct LinkedIn links**: Automatisk konvertering fra URN til LinkedIn URL
  - **URN format konvertering**: `urn:li:share:X` → `https://www.linkedin.com/feed/update/urn:li:activity:X`
  - **Dropdown integration**: "Vis på LinkedIn" option i tre-prikker menu for udgivne opslag
  - **Modal integration**: "Vis på LinkedIn" knap i post detail modals
  - **Conditional display**: Kun synlig for opslag med `status: 'published'` og `ugc_post_id`
  - **New tab opening**: Åbner LinkedIn post i ny fane for bedre UX
  - **Konsistent på tværs af app**: Tilgængelig i både Mine Opslag og Content Plan
- ✅ **📝 FORRIGE: Perfect Toast Slide Animations**
  - **Komplet slide workflow**: Både slide-in og slide-out fungerer korrekt
  - **SweetAlert2 integration**: Bruger `showClass` og `hideClass` for proper timing
  - **Smooth slide-in**: `.swal2-toast-fade-in` med translateX(100%) → translateX(0)
  - **Elegant slide-out**: `.swal2-toast-fade-out` med translateX(0) → translateX(100%)
  - **300ms timing**: Perfekt balance mellem hurtig og smooth (ease-out/ease-in)
  - **Ingen wiggle**: Fjernet alle default SweetAlert2 shake/wiggle effekter
  - **Minimal distraction**: Ingen progress bar, kun clean slide transitions
- ✅ **📝 FORRIGE: Fixed Loading State Timing**
  - **Øjeblikkelig loading stop**: Loading-ikon stopper så snart UI er opdateret
  - **Ikke vente på notifikation**: Loading venter ikke på SweetAlert countdown (2-3 sek)
  - **Bedre UX feedback**: Tre-prikker ikon kommer tilbage øjeblikkeligt efter success
  - **Konsistent på tværs af operationer**: Både schedule og convert-to-draft har samme timing
  - **Error handling**: Loading fortsætter kun ved fejl til fejlbesked er vist
- ✅ **📝 FORRIGE: Improved UX - No Page Refresh on Convert-to-Draft**
  - **Konsistent UX**: Convert-to-draft opdaterer nu UI lokalt uden page refresh
  - **Lokal state opdatering**: Bruger `setPosts/setAllPosts` i stedet for `fetchAllPosts()`
  - **Hurtigere respons**: Øjeblikkelig UI opdatering på både Mine Opslag og Content Plan
  - **Konsistent med schedule**: Samme UX pattern som når man planlægger kladder
- ✅ **📝 FORRIGE: Fixed Convert-to-Draft API Error**
  - **Root cause løst**: update-post API håndterer nu `newStatus` parameter korrekt
  - **Status opdatering**: Kladder ændres nu til "scheduled" status når de planlægges
  - **LinkedIn publishing**: Automatisk LinkedIn udgivelse når status ændres til "published"
  - **API validation**: Kun gyldige statusser accepteres (draft, scheduled, published, failed)
  - **Error handling**: Proper fejlhåndtering hvis LinkedIn publishing fejler
  - **Complete workflow**: Draft → Schedule → Status "scheduled" → Convert back to draft works
- ✅ **📝 FORRIGE: Fixed Draft Scheduling & Modal System**
  - **Korrekte modaler**: "Planlæg opslag" for kladder vs "Ændre planlagt dato" for planlagte
  - **Intelligent modal routing**: Automatisk valg af korrekt modal baseret på post status
  - **Ny schedule modal**: Dedikeret planlægningsmodal for kladder med "Planlæg opslag" knap
  - **API fejl løst**: Kladder bruger nu update-post endpoint i stedet for reschedule
  - **Komplet modal system**: Både Mine Opslag og Content Plan har begge modal typer
  - **Korrekt workflow**: Draft → Schedule modal → API call → Status opdatering
- ✅ **📝 FORRIGE: Enhanced Draft Workflow**
  - **Mørkere grå badge** for kladder (`bg-gray-200`) for bedre synlighed
  - **Korrekte modal labels**: "Status: Kladde" og "Visning: Offentligt/Forbindelser"
  - **Komplet kladde dropdown**: "Udgiv nu" og "Planlæg opslag" muligheder
  - **Forbedret edit mode**: Kladder kan udgives eller planlægges direkte fra redigering
  - **Intelligent API routing**: Bruger `newStatus` parameter til at ændre kladde status
  - **Synkroniserede funktioner** på tværs af Mine Opslag og Content Plan
  - **Komplet workflow**: Kladde → Planlagt → Udgivet med alle mellemtrin
- ✅ **📝 FORRIGE: Draft System Implementation**
  - **Ny "draft" status** i database schema med constraint og index
  - **"Gem som kladde"** knap på new-post siden
  - **"Gør til kladde"** funktionalitet for planlagte opslag (forkortet tekst)
  - **Kladde filter** på Mine Opslag siden
  - **Optimeret billede håndtering**: Kladder uploader kun til Supabase
  - **Ny `/api/linkedin/convert-to-draft` endpoint**
  - **Grå badge styling** for kladde status
  - **Komplet CRUD support** for kladder med samme UI som andre opslag
  - **Synkroniserede dropdown menus** mellem Mine Opslag og Content Plan
  - **Optimeret rækkefølge**: Udgiv nu → Ændre dato → Rediger opslag → Gør til kladde → Slet opslag
  - **Bredere dropdown** (180px) for at undgå linjeskift
  - **Database constraint fix**: Korrekt implementeret 'draft' status i PostgreSQL constraint
  - **SweetAlert2 styling fix**: Bruger nu SweetAlert2's indbyggede error ikon (ingen custom styling)
  - **Brugervenlige fejlbeskeder**: Ændret "Unknown error" til "Noget gik galt. Prøv igen." på tværs af hele platformen
  - **Fejlede opslag filter**: Tilføjet "Fejlede" som filter option på Mine Opslag siden
  - **Fjernet stats boks**: Fjernet redundant statistik boks (statistik vises på dashboard)
- ✅ **🎨 FORRIGE: Minimalistisk Modal Design**
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

### **🚀 NYEST: Automatisk Udgivelse af Planlagte Opslag**
- **✅ Supabase Edge Function** til at udgive planlagte opslag
  - Funktionsnavn: `publish-scheduled-posts`
  - Finder alle opslag der skal udgives nu (±1 minut buffer)
  - Behandler posts parallelt for optimal performance
  - Håndterer op til 200+ opslag på samme tidspunkt
- **✅ pg_cron Integration**
  - Kører automatisk **hvert minut** via pg_cron
  - Asynkron HTTP kald via pg_net til Edge Function
  - Robust fejlhåndtering og logging
- **✅ Performance Optimeret**
  - **Parallelt processing** af alle planlagte opslag
  - **Batch processing** - kan håndtere store volumener
  - **5 minut timeout** for at håndtere store batches
  - **Billeder allerede uploadet** - kun ét API kald per opslag
- **✅ Database Function**
  - `publish_scheduled_linkedin_posts()` - kalder Edge Function
  - Sikker via SECURITY DEFINER og service_role_key
  - Fejlhåndtering der ikke stopper cron jobbet
- **✅ Monitoring & Logging**
  - Alle requests logges med request_id
  - Fejl logges med detaljerede beskeder
  - Cron job status kan tjekkes via `cron.job_run_details`
- **✅ 📊 Queue Status Dashboard**
  - **Real-time overblik** over cron job kørsler
  - **Automatisk opdatering** hvert 30. sekund
  - **Statistikker**: Total kørsler, success rate, fejlede kørsler, gennemsnitlig varighed
  - **Historisk visning** af seneste 50 kørsler
  - **Status badges** med farvekodning (grøn=success, rød=fejlet, blå=kører)
  - **Tilgængelig via** `/dashboard/queue` i navigationen
  - **Database function** `get_queue_status()` for optimal performance
- **🔧 NYESTE: Komplet Minut-Vindue System Implementation** *(31. oktober 2025)*
  - **Problem løst**: Queue-siden viste tomme kørsler selvom opslag blev udgivet korrekt
  - **Root cause**: Cron jobbet kørte 1 minut frem i tiden og PostgreSQL funktionen nåede ikke at parse HTTP responses
  - **AI-inspireret løsning**: Implementeret minut-vindue system der binder hver kørsel til et specifikt minut
  - **Løsning implementeret**:
    - **Migration 16-19**: Komplet database refaktorering med `minute_bucket` system
    - **Ny PostgreSQL funktion**: Minut-præcis kørsel med idempotent records og komplet status tracking
    - **Edge Function v4**: Accepterer minut-vindue parametre og kører præcist på det specifikke minut
    - **Opdateret Queue Status**: Viser kun færdige runs (status != 'running') med korrekte statistikker
    - **Robust fejlhåndtering**: 15-sekunders timeout, komplet error logging, og graceful degradation
  - **Tekniske forbedringer**:
    - **Unique index på `minute_bucket`**: Sikrer kun én record per minut-vindue
    - **Status tracking**: 'running' → 'success'/'partial'/'error' med præcise timestamps
    - **Præcise metrics**: `posts_found`, `published_ok`, `posts_failed`, `duration_ms`
    - **Idempotent operations**: Bruger `ON CONFLICT` til at undgå duplikater
  - **Resultat**: 
    - ✅ Queue-siden viser nu 100% korrekte data for hver minut-kørsel
    - ✅ Ingen tomme kørsler - kun færdige runs med præcise tal vises
    - ✅ Minut-præcision - hver kørsel viser data for sit specifikke tidsvindue
    - ✅ Robust og skalerbart system der kan håndtere høje volumener

### **Next Steps**
- [x] ✅ Automatisk udgivelse af planlagte opslag via cron
- [x] ✅ Queue Status Dashboard til monitoring
- [ ] Token refresh implementering (hvis nødvendigt)
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
