# NumisVault — Design System Specification (DESIGN.md)

> **Standard:** Open Design Semantic Specification  
> **Inspiration:** Stripe Precision Engineering × Luxury Numismatic Vault  
> **Craft Directives:** Anti-AI-Slop, Typographic Hierarchy, Material Discipline, Perpetual Micro-Motion  
> **Status:** Active Source of Truth  

---

## 1. Brand Atmosphere & Design Philosophy

NumisVault is not a generic database or hobbyist checklist; it is an **archival-grade digital vault for rare coins and sovereign bullion**. The interface merges the timeless authority of classical numismatics with the crisp, mathematical precision of modern fintech (inspired by Stripe’s typography and elevation standards).

### Core Pillars
- **Curatorial Dignity:** Every coin is treated as a museum specimen with historical provenance, authenticated census data, and verified strike quality.
- **Deep Velvet Vault Surfaces:** Replacing stark white cards or generic neon cyber themes with warm obsidian, dark slate, and subtle champagne/gold refractions that let the coin photography be the hero.
- **Precision Typography:** High-contrast serif headlines for heritage and sovereign identity, paired with clean humanist body text and engineered tabular monospace for years, valuations, and grading metrics.
- **Zero AI Slop:** Banned purple-to-blue gradients, banned emoji icons, banned generic left-accent cards, and zero placeholder copy.

---

## 2. Color Palette & Semantic Roles

```
[Deep Vault]          [Elevated Slate]      [Sovereign Gold]      [Mint Accent]
#08090D               #121622               #D4AF37               #10B981
```

### 2.1 Surfaces & Vault Elevation
- **Vault Foundation (`--surface-vault`):** `#08090D` — Infinite depth base background.
- **Card Surface (`--surface-card`):** `rgba(18, 22, 34, 0.85)` — Elevated slate with backdrop blur (20px).
- **Surface Highlight (`--surface-border`):** `rgba(255, 255, 255, 0.08)` — 1px crisp specular edge.
- **Surface Hover Glow (`--surface-glow`):** `radial-gradient(circle at center, rgba(212, 175, 55, 0.12) 0%, transparent 70%)`.

### 2.2 Gold & Metallics
- **Sovereign Gold (`--gold-400`):** `#D4AF37` — Primary brand accent, verified highlights, active navigation.
- **Antique Gold (`--gold-500`):** `#AA8C2C` — Interactive button gradients, subtle borders.
- **Pale Aureus (`--gold-100`):** `#F6EEDC` — High-contrast labels, badge backgrounds, iconography.
- **Deep Bronze (`--gold-800`):** `#2B230B` — Muted badge containers, inset shadows.

### 2.3 Semantic Accents
- **Mint State Green (`--accent-mint`):** `#10B981` — High-grade condition status (MS-65+, Uncirculated, Valuation up).
- **Archival Blue (`--accent-proof`):** `#38BDF8` — Proof strikes, special commemorative issues.
- **Heritage Crimson (`--accent-danger`):** `#EF4444` — Permanent deletion, loss warnings, extreme caution.

---

## 3. Typographic Architecture

| Hierarchy | Font Family | Size / Leading | Weight | Letter-Spacing | Feature |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero / Master Titles** | Playfair Display / Outfit | 36px–48px / 1.1 | 700 / 900 | `-0.03em` | Tight tracking, classical elegance |
| **Section Headings** | Playfair Display | 24px–30px / 1.2 | 700 | `-0.02em` | Serifs with clear hierarchical authority |
| **Card Coin Titles** | Outfit / Inter | 18px–20px / 1.3 | 600 | `-0.01em` | Clean, highly legible at a glance |
| **Body & Provenance** | Inter | 14px–15px / 1.6 | 400 / 500 | `0` | Comfortable editorial reading |
| **Metrics, Year & Mint** | Roboto Mono | 12px–13px / 1.4 | 600 / 700 | `+0.06em` | `font-variant-numeric: tabular-nums` |

---

## 4. Multi-Layer Shadows & Materials

Stripe-inspired multi-layered atmospheric elevation calibrated for dark numismatic surfaces:

```css
/* Card Resting Elevation */
box-shadow: 
  0 4px 6px -1px rgba(0, 0, 0, 0.4),
  0 20px 25px -5px rgba(0, 0, 0, 0.5),
  0 0 0 1px rgba(255, 255, 255, 0.07) inset;

/* Card Active Hover Elevation */
box-shadow: 
  0 12px 24px -4px rgba(0, 0, 0, 0.6),
  0 30px 45px -10px rgba(0, 0, 0, 0.7),
  0 0 25px 0 rgba(212, 175, 55, 0.15),
  0 0 0 1px rgba(212, 175, 55, 0.35) inset;
```

---

## 5. Component Standards & Micro-Interactions

### 5.1 Coin Showcase Card (`CoinCard`)
- **3D Specular Tilt:** Perspective `900px`, dynamic rotation calculation responding to cursor proximity (`max ±6.5deg`).
- **Surface Sheen:** Radial specular gradient tracking cursor coordinates (`radial-gradient(circle at X% Y%, rgba(212,175,55,0.18), transparent 60%)`).
- **Specimen Portrait:** Floating coin image centered on a micro-textured velvet well with drop-shadow simulating physical relief (`filter: drop-shadow(0 15px 25px rgba(0,0,0,0.65))`).
- **Grading & Certification Badge:** High-contrast pill displaying strike grade (e.g., `MS-67`, `Proof`, `AU-55`) with certified authentication indicator.
- **Action Tray:** Contextual curator actions (View Historical Dossier, Quick Edit, Delete) appearing smoothly on hover with subtle haptic scale.

### 5.2 Curatorial Stats Ribbon
- Counters animate upwards smoothly with GSAP `power3.out`.
- Distinct iconography using monoline Lucide vector shapes (never emoji).
- Interactive filter triggers (clicking "Oldest Coin" or "Countries" isolates those records in the vault).

### 5.3 Quick Search & Navigation
- Deep-blur fixed header with gold accent active state.
- Floating command-bar search with instant debounced query matching across Name, Country, Year, and Provenance Description.

---

## 6. Anti-AI-Slop Guardrails

1. **NO Default Tailwind Purple Gradients:** Banned `#6366f1` / `#8b5cf6` combinations.
2. **NO Emoji Feature Icons:** All icons must be stroke-based vector SVGs (`currentColor`).
3. **NO Cliché Left-Border Tiles:** Elevation, border-radii, and subtle internal glow replace thick left color stripes.
4. **NO Filler / Mock Data:** Authentic numismatic terms only (Mint Mark, Grading Tier, Composition, Mintage Year, Obverse/Reverse strike).
5. **NO Fragile External Image CDNs:** All imagery uses local/uploaded assets or clean SVG numismatic reliefs.
