---
Document ID: LEXFIAT-UI-SPEC
Title: LexFiat UI Specification
Subject(s): LexFiat | UI | Design System | Frontend
Project: Cyrano
Version: v548
Created: 2025-11-27 (2025-W48)
Last Substantive Revision: 2025-11-27 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Definitive reference for all LexFiat UI structure, styling, and behavior. Authoritative specification that all UI implementations must match.
Status: Active
Related Documents: LEXFIAT-ARCHITECTURE
---

# LexFiat UI Specification

## Executive Summary

LexFiat UI is a dark-themed, glass-morphism legal intelligence dashboard. The design is based on the "Piquette" design system (SwimMeet Glass-Ocean aesthetic) with darker, more saturated colors. The UI must match the structure and styling of `/Users/davidtowne/Desktop/Coding/Dev+Test/Dashboard_GOOD_20251024.html` exactly.

---

## Design System

### Color Palette

**Primary Colors:**
- `--ocean-deep: #0A1A2A` - Deepest background
- `--ocean-mid: #1E3A5F` - Mid-tone background
- `--steel-blue: #2C5282` - Steel blue accent
- `--glass-blue: #3B82F6` - Primary blue accent
- `--electric-purple: #A855F7` - Purple accent
- `--cyber-green: #10B981` - Success/positive
- `--neon-orange: #F59E0B` - Warning/attention
- `--gold: #D4AF37` - Gold accent (used for logo borders, avatar borders)

**Text Colors:**
- `--white: #FFFFFF` - Primary text
- `--mist: #F8FAFC` - Light text
- `--steel-gray: #94A3B8` - Secondary text
- `--chrome: #E2E8F0` - Tertiary text

**Glass Effects:**
- `--panel-glass: rgba(255, 255, 255, 0.08)` - Glass panel background
- `--panel-border: rgba(255, 255, 255, 0.15)` - Glass panel border
- `--accent-glow: rgba(59, 130, 246, 0.2)` - Accent glow effect

### Typography

**Font Family:**
- Primary: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`
- System fallbacks for cross-platform consistency

**Font Sizes:**
- Headers: 1.5rem - 2.5rem
- Body: 1rem (14px base)
- Small text: 0.875rem
- Labels: 0.75rem

### Background

**Body Background:**
- Base: `#2a2e35` (dark gray)
- Overlay: `#2a2a2a` (via `::before` pseudo-element)
- Caustic lighting: Radial gradients with blue, purple, green overlays (via `::after` pseudo-element)
- Opacity: 0.4
- Mix-blend-mode: screen

---

## Component Structure

### Header

**Location:** `LexFiat/client/src/components/layout/header.tsx`

**Structure:**
- Sticky header at top (z-index: 1000)
- Glass-morphism background with backdrop blur
- Contains: Logo, Status Pills, Action Buttons, Avatar

**Logo:**
- **File:** `/assets/logo/lexfiat-logo-corrected.png` (PNG, NOT SVG)
- **Styling:** Blue (instead of black) with gold (instead of white) interior
- **Border:** Gold circular border around outside edge
- **Size:** Matches avatar size
- **Container:** `.logo-container` with gold border ring

**Avatar:**
- **File:** `/assets/avatars/mekel-miller.jpg`
- **Shape:** PERFECT CIRCLE (NOT oval) - use `border-radius: 50%` with `aspect-ratio: 1/1` and explicit width/height constraints
- **Size:** Same size as logo
- **Border:** Gold border/ring matching logo border
- **User:** Mekel S. Miller (Family Law)

**Status Pills:**
- Gmail (success dot)
- AI (processing dot) - Uses HAL-inspired icon (rectangle, circle, dot)
- Clio (warning dot)
- Calendar (success dot)
- Research (warning dot)

**Action Buttons:**
- Help (💬)
- Admin (⚙️)
- Settings

### Dashboard

**Location:** `LexFiat/client/src/pages/dashboard.tsx`

**Structure:**
- Priority ticker at top (rotating alerts)
- Widget grid (Today's Focus, GoodCounsel, etc.)
- Workflow pipeline (assembly line with stages)
- Testing sidebar (slide-out from right)
- Footer banner (slide-out from bottom)

**Widgets:**
- Today's Focus - Priority cases and deadlines
- GoodCounsel - Legal intelligence companion (heart and soul of LexFiat)
- Document Intake - Email monitoring and document capture
- AI Analysis - Document review and red flag detection
- Draft Preparation - AI-generated draft responses
- Attorney Review - Final review and approval

**Workflow Pipeline:**
- Horizontal assembly line layout
- Stages connected with lines and arrows
- Draggable stages
- Metrics displayed per stage
- Expand buttons to open full panels

**Expanded Panels:**
- Modal overlays with glass-morphism styling
- Sharp corners (border-radius: 0)
- Backdrop blur
- Close button in top-right
- Content area scrollable

### Testing Sidebar

**Location:** `LexFiat/client/src/components/dashboard/testing-sidebar-html.tsx`

**Behavior:**
- Hidden by default
- Persistent tab on right edge (vertical text "Testing")
- Slides out when mouse hovers over right edge
- Contains beta tester report form
- Auto-closes when mouse leaves sidebar area

### Footer Banner

**Location:** `LexFiat/client/src/components/layout/footer-banner-html.tsx`

**Behavior:**
- Hidden by default
- Persistent tab at bottom center
- Slides up when mouse hovers over bottom edge
- Contains AI error disclaimer, copyright, contact info
- Auto-closes when mouse leaves banner area

---

## Icon System

### SVG Sprite

**Location:** `LexFiat/client/src/components/ui/icon-sprite.tsx`

**Icons:**
- `icon-mail` - Mail/envelope
- `icon-ai` - HAL-inspired (rectangle, circle, dot) - DO NOT CHANGE
- `icon-clio` - Clio integration
- `icon-calendar` - Calendar
- `icon-research` - Legal research
- `icon-intake` - Document intake
- `icon-analysis` - AI analysis
- `icon-draft` - Draft preparation
- `icon-attorney` - Attorney review
- `icon-goodcounsel` - GoodCounsel
- `icon-alert` - Alerts/warnings
- `icon-beta-circle` - Beta testing

**Usage:**
```tsx
<svg className="ui-icon"><use href="#icon-name"/></svg>
```

**CRITICAL:** The AI icon (`icon-ai`) is HAL-inspired (rectangle taller than wide, circle and dot centered). DO NOT use generic brain icons or change this design.

---

## Styling Rules

### Glass Morphism

**All Panels:**
- Background: `linear-gradient(135deg, var(--panel-glass) 0%, rgba(255, 255, 255, 0.04) 100%)`
- Backdrop filter: `blur(15px) saturate(120%)`
- Border: `1px solid var(--panel-border)`
- Border-radius: `0` (sharp corners, NOT rounded)
- Box-shadow: `0 4px 12px rgba(0, 0, 0, 0.3)`

### Sharp Corners

**CRITICAL:** All UI elements use `border-radius: 0` (sharp corners). NO rounded corners unless explicitly specified.

### Logo and Avatar

**Logo:**
- PNG file (NOT SVG)
- CSS filters applied to convert black→blue and white→gold
- Gold circular border around outside edge
- Must be visible (not just a blue circle)

**Avatar:**
- PERFECT CIRCLE (use `border-radius: 50%` with `aspect-ratio: 1/1` and explicit width/height)
- Gold border matching logo border
- Same size as logo

---

## CSS File

**Location:** `LexFiat/client/src/styles/dashboard-html.css`

**Source:** Extracted directly from `Dashboard_GOOD_20251024.html`

**Usage:** Import in dashboard component: `import "@/styles/dashboard-html.css"`

---

## Reference Files

**Primary Reference:**
- `/Users/davidtowne/Desktop/Coding/Dev+Test/Dashboard_GOOD_20251024.html` - Gold standard HTML/CSS

**Assets:**
- Logo: `/assets/logo/lexfiat-logo-corrected.png`
- Avatar: `/assets/avatars/mekel-miller.jpg`

---

## Implementation Rules

1. **Match HTML exactly** - Structure, classes, inline styles must match reference HTML
2. **Use PNG logo** - Never use SVG for logo unless it can reproduce PNG exactly
3. **Perfect circle avatar** - Not oval, use explicit constraints
4. **Sharp corners** - No rounded corners unless specified
5. **Glass effects** - All panels use glass-morphism
6. **HAL AI icon** - Rectangle, circle, dot - DO NOT CHANGE
7. **Gold accents** - Logo border, avatar border use gold color
8. **Blue/gold logo** - Black parts become blue, white parts become gold

---

## Component Locations

- Header: `LexFiat/client/src/components/layout/header.tsx`
- Dashboard: `LexFiat/client/src/pages/dashboard.tsx`
- Testing Sidebar: `LexFiat/client/src/components/dashboard/testing-sidebar-html.tsx`
- Footer Banner: `LexFiat/client/src/components/layout/footer-banner-html.tsx`
- Expanded Panels: `LexFiat/client/src/components/dashboard/*-panel.tsx`
- Icon Sprite: `LexFiat/client/src/components/ui/icon-sprite.tsx`
- CSS: `LexFiat/client/src/styles/dashboard-html.css`

---

**Last Updated:** 2025-11-27  
**Maintained By:** UI Team  
**Status:** Authoritative - All other UI docs must match this specification


