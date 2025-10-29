# Design Guidelines - BasicPlatform.

## 🎨 Design Philosophy

BasicPlatform følger et **moderne, organisk og blødt design** inspireret af Apple's designsprog. Vi prioriterer:

- **Minimalisme** - Clean og luftigt layout
- **Organiske former** - Bløde, runde hjørner og naturlige kurver
- **Moderne æstetik** - Tidssvarende og elegant udtryk
- **Brugervenlig** - Intuitivt og tilgængeligt interface

---

## 🔤 Typografi

### **Primær Font - Geist**
```css
/* Ultra-moderne font designet til web interfaces */
font-family: 'Geist', system-ui, -apple-system, sans-serif;
```

**Hvorfor Geist:**
- **Cutting-edge design** - Vercel's egen font til moderne web
- **Perfekt til tech produkter** - Designet specifikt til interfaces
- **Ekstremt clean** - Minimalistisk og geometrisk
- **Fremragende læsbarhed** - Optimeret til alle skærmstørrelser
- **Moderne æstetik** - Føles meget 2024/2025
- **Variabel font** - Understøtter alle font-weights

### **Font Weights**
```css
/* Tilgængelige weights */
--font-light: 300;      /* Til subtil tekst */
--font-regular: 400;    /* Standard body tekst */
--font-medium: 500;     /* Labels og navigation */
--font-semibold: 600;   /* Knapper og vigtig tekst */
--font-bold: 700;       /* Overskrifter */
--font-extrabold: 800;  /* Hero titler */
```

---

## 🎯 Primær Farvepalette

### **Primær Farve - Professionel Blå**
```css
/* Primær blå - til CTA knapper og vigtige elementer */
--primary: #1e40af        /* Blue-800 */
--primary-hover: #1e3a8a  /* Blue-900 */
--primary-light: #3b82f6  /* Blue-500 */
--primary-dark: #1d4ed8   /* Blue-700 */

/* Lyse varianter til baggrunde */
--primary-pastel: #eff6ff /* Blue-50 */
--primary-soft: #dbeafe   /* Blue-100 */
--primary-medium: #93c5fd /* Blue-300 */
```

### **Sekundære Farver**
```css
/* Neutrale farver */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-600: #4b5563
--gray-700: #374151
--gray-900: #111827

/* Accent farver */
--success: #10b981     /* Emerald-500 */
--warning: #f59e0b     /* Amber-500 */
--error: #ef4444       /* Red-500 */
```

---

## 📐 Border Radius System

### **Organiske Runde Hjørner**
```css
/* Små elementer - inputs */
--radius-sm: 16px

/* Medium elementer - cards, modals */
--radius-md: 24px

/* Store elementer - containers, sections */
--radius-lg: 32px

/* Extra store elementer - hero sections */
--radius-xl: 40px

/* Helt runde knapper */
--radius-full: 9999px
```

### **Anvendelse:**
- **Knapper**: `border-radius: 9999px` (helt runde)
- **Input felter**: `border-radius: 16px`
- **Cards/Bokse**: `border-radius: 24px`
- **Store containers**: `border-radius: 32px`
- **Hero sektioner**: `border-radius: 40px`

---

## 🔘 Knap Design

### **Standard Knappestørrelser**
```css
/* STANDARD for alle sideindhold knapper */
padding: 32px; /* px-8 */
height: 44px;  /* h-11 */
border-radius: 9999px; /* Helt runde hjørner */
font-weight: 600;
font-size: 16px; /* text-base */

/* Header knapper (mindre) */
padding: 20px; /* px-5 */
height: 44px;  /* h-11 */
```

### **Primær Knap (CTA)**
```css
background: linear-gradient(135deg, #1e40af, #1d4ed8);
color: white;
border-radius: 9999px; /* Helt runde hjørner */
padding: 32px; /* px-8 - STANDARD størrelse */
height: 44px;  /* h-11 - STANDARD størrelse */
font-weight: 600;
box-shadow: 0 4px 14px rgba(30, 64, 175, 0.25);
transition: all 0.2s ease;

/* Hover state - kun farve og shadow ændring */
box-shadow: 0 6px 20px rgba(30, 64, 175, 0.35);
background: linear-gradient(135deg, #1e3a8a, #1e40af);
/* Ingen transform/movement */
```

### **Sekundær Knap (Outline)**
```css
background: white;
color: #1e40af;
border: 2px solid #1e40af;
border-radius: 9999px; /* Helt runde hjørner */
padding: 32px; /* px-8 - STANDARD størrelse */
height: 44px;  /* h-11 - STANDARD størrelse */
font-weight: 600;
```

### **Ghost Knap (Neutral)**
```css
background: transparent;
color: #4b5563;
border: 1px solid #d1d5db;
border-radius: 9999px; /* Helt runde hjørner */
padding: 32px; /* px-8 - STANDARD størrelse */
height: 44px;  /* h-11 - STANDARD størrelse */
font-weight: 600;
```

### **Knap Konsistens Regler**
- **Alle sideindhold knapper**: `px-8 h-11` (32px padding, 44px højde)
- **Header knapper**: `size="sm"` (20px padding, 44px højde)
- **Tekststørrelse**: Standard `text-base` (16px) - ingen `text-lg`
- **Border radius**: Altid `rounded-full` (helt runde)
- **Font weight**: Altid `font-semibold` (600)

---

## 📦 Container & Card Design

### **Cards/Bokse**
```css
background: white;
border-radius: 16px;
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
border: 1px solid rgba(0, 0, 0, 0.05);
padding: 24px;
```

### **Store Containers**
```css
background: white;
border-radius: 24px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
padding: 32px;
```

---

## 📝 Input Felter

### **Standard Input**
```css
border: 2px solid #e5e7eb;
border-radius: 16px; /* Øget border-radius */
padding: 14px 18px; /* Lidt mere padding */
font-size: 16px;
transition: all 0.2s ease;
outline: none;
box-shadow: none; /* Ingen shadows */

/* Focus state - kun border farve ændring */
border-color: #1e40af;
outline: none;
box-shadow: none;
/* Ingen ekstra rammer eller shadows */
```

### **Input Labels**
```css
/* Labels skal være indenteret for at matche runde input felter */
margin-left: 16px; /* 2px mindre for perfekt alignment */
```

---

## 🌈 Gradient System

### **Baggrunde**
```css
/* Primær gradient */
background: linear-gradient(135deg, #eff6ff, #dbeafe);

/* Hero gradient */
background: linear-gradient(135deg, #1e40af, #3b82f6, #93c5fd);

/* Subtil gradient */
background: linear-gradient(180deg, #f9fafb, #f3f4f6);

/* Professional gradient */
background: linear-gradient(135deg, #1e40af, #1d4ed8);
```

---

## 📱 Responsive Design

### **Breakpoints**
```css
/* Mobile first approach */
--mobile: 320px
--tablet: 768px
--desktop: 1024px
--large: 1280px
```

---

## ✨ Animation & Transitions

### **Standard Transitions**
```css
/* Hover effekter */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Transform animationer */
transform: translateY(-2px);
transition: transform 0.2s ease;
```

---

*Denne fil opdateres løbende med nye design komponenter og retningslinjer.*