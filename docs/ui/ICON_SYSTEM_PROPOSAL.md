# Icon System Proposal for Cyrano Ecosystem

**Date:** 2025-11-29  
**Status:** ✅ Implemented  
**Owner:** David W Towne / Cognisint LLC  
**Last Updated:** 2025-11-29

---

## Overview

This document describes the implemented icon system for the Cyrano ecosystem.

---

## Core Principles

1. **Consistency**: Same function = same icon across all apps
2. **Clarity**: Icons should be immediately recognizable
3. **Scalability**: Icons work at multiple sizes (16px to 64px)
4. **Brand Identity**: Each app has a unique brand icon while sharing functional icons
5. **HAL Homage**: AI icon always features red dot, referencing HAL 9000

---

## Shared Functional Icons

These icons are used consistently across all Cyrano apps for the same functions:

### Research
**Icon:** `ResearchIcon` - Archive + Search from lucide-react
- **Usage:** Legal research, case law lookup, document search
- **Style:** Archive icon with Search icon overlay (both from lucide-react)
- **Component:** `Cyrano/shared-assets/icon-components.tsx`
- **Design:** Uses lucide-react Archive as base, with lucide-react Search icon positioned as overlay

### GoodCounsel
**Icon:** `GoodCounselIcon` - Scale with Heart overlay
- **Usage:** AI-powered legal guidance, ethical counsel - "the heart and soul of LexFiat"
- **Style:** Scales of justice (Scale from lucide-react) with Heart icon overlay (both from lucide-react)
- **Component:** `Cyrano/shared-assets/icon-components.tsx`
- **Design:** Uses lucide-react Scale icon with lucide-react Heart icon overlaid

### (Beta) Testing
**Icon:** `BetaTestingIcon` - Bug with β overlay
- **Usage:** Beta testing features, bug reporting
- **Style:** Bug icon from lucide-react with "β" text overlay
- **Component:** `Cyrano/shared-assets/icon-components.tsx`
- **Design:** Uses lucide-react Bug icon with β symbol overlaid in center

### Document Intake
**Icon:** `Inbox` or `FileDown` from lucide-react
- **Usage:** Document upload, email monitoring, file ingestion
- **Style:** Inbox tray or downward arrow into folder

### AI Analysis
**Icon:** `AIAnalysisIcon` - Single Eye with Always-Red Pupil (same as AI Insights)
- **Usage:** AI-powered document analysis, content review
- **Style:** Single eye with red pupil (material-symbols:eye-tracking-outline-sharp style)
- **Component:** `Cyrano/shared-assets/ai-analysis-icon.tsx`
- **Design:** Same as AI Insights icon - Eye from lucide-react with always-red pupil (#DC2626)

### Draft Preparation
**Icon:** `FileEdit` or `PenTool` from lucide-react
- **Usage:** Document drafting, content creation
- **Style:** Document with pen/pencil, or pen tool icon

### Attorney Review
**Icon:** `ClipboardCheck` from lucide-react ✅
- **Usage:** Review, approval, sign-off
- **Style:** Clipboard with checkmark

### Final Review
**Icon:** `SearchCheck` from lucide-react ✅
- **Usage:** Final quality check, comprehensive review
- **Style:** Magnifying glass with checkmark

### File and Serve
**Icon:** `Send` from lucide-react ✅
- **Usage:** Filing documents, serving parties
- **Style:** Send arrow/paper airplane

### Client Update
**Icon:** `MessageSquare` from lucide-react ✅
- **Usage:** Client communication, status updates
- **Style:** Message bubble/square

### Progress Summary
**Icon:** `TrendingUp` from lucide-react ✅
- **Usage:** Metrics, progress tracking, analytics
- **Style:** Upward trending line

### Billing/Time Recording
**Icon:** `BillingTimeIcon` - Clock with DollarSign overlay
- **Usage:** Time tracking, billing, invoicing
- **Style:** Clock icon from lucide-react with DollarSign overlay
- **Component:** `Cyrano/shared-assets/icon-components.tsx`
- **Note:** Single combined icon for time and billing

---

## App-Specific Brand Icons

Each app in the Cyrano ecosystem has a simplified icon version of its logo for use in menus, navigation, and UI elements. These are **not** the logos themselves, but condensed versions designed to work at small sizes (16px-32px) while remaining recognizable.

### LexFiat
**Icon:** `LexFiatBrandIcon` - Lightbulb from lucide-react
- **Design:** Uses lucide-react Lightbulb icon (simplified version of LexFiat's full logo)
- **Style:** Clean, simple, works at small sizes (16px+)
- **Color:** Gold/amber accent color
- **Component:** `Cyrano/shared-assets/icon-components.tsx`
- **Usage:** Menu items, navigation bars, UI elements (NOT the full logo)

### Arkiver
**Icon:** `ArkiverBrandIcon` - Moon + Star + Feather from lucide-react
- **Design:** Uses lucide-react Moon, Star, and Feather icons arranged together
- **Style:** Simple arrangement of three lucide-react icons
- **Color:** Bronze/brown color (copper when active)
- **Component:** `Cyrano/shared-assets/icon-components.tsx`
- **Usage:** Menu items, navigation bars, UI elements (NOT the full logo)

### Potemkin
**Icon:** `PotemkinBrandIcon` - Layers with light beam overlay
- **Design:** Uses lucide-react Layers icon with simple light beam line overlay
- **Style:** Represents revealing truth - layers with light piercing through
- **Color:** Deep blue or purple with gold accent
- **Component:** `Cyrano/shared-assets/icon-components.tsx`
- **Usage:** Menu items, navigation bars, UI elements (NOT the full logo)

### MAE (Multi-Agent Engine)
**Icon:** `MAEBrandIcon` - bx:swim ONLY
- **Design:** Uses bx:swim (BiSwim from react-icons/bi) - swim icon only
- **Style:** Swim icon from Boxicons
- **Color:** Blue tones with accent colors
- **Component:** `Cyrano/shared-assets/icon-components.tsx`
- **Usage:** Menu items, navigation bars, UI elements (NOT the full logo)

### Other Engines (Future)
- **Icon Style:** Should follow similar principles: simplified, recognizable, scalable
- **Design:** Should reflect the engine's core function or identity

---

## Implementation Guidelines

### Icon Library
- **Primary:** `lucide-react` is the primary icon library
- **Other Libraries:** Use specific icon libraries when directed (e.g., react-icons for bx:swim)
- **Combinations:** Multiple icons overlaid/combined using filled + outline or filled + filled techniques
- **Custom SVG:** Only when specifically requested
- **Shared:** `Cyrano/shared-assets/icon-components.tsx` for ecosystem-wide icons

### Icon Sizes
- **Small:** 16px (toolbars, inline)
- **Medium:** 24px (buttons, navigation)
- **Large:** 32px (cards, headers)
- **XLarge:** 48px+ (hero sections, logos)

### Icon Colors
- **LexFiat:** Gold/amber accent (`#D89B6A` or theme equivalent)
- **Arkiver:** Copper (`#D89B6A`) when active, white/light gray when inactive
- **Potemkin:** Deep blue/purple with gold accent (TBD)
- **MAE:** Blue tones with accent colors (TBD)
- **AI Icon:** Outer elements use theme color, **center dot always red (#DC2626)**

### Consistency Rules
1. Same function = same icon across all apps
2. App brand icons are unique to each app
3. AI icon always has red dot (HAL homage)
4. Icons should be recognizable at 16px minimum
5. Icons use appropriate libraries and techniques as specified
6. For combinations: use filled + outline, or filled + filled in background color for negative space effect

---

## Implementation Status

### ✅ Completed
- [x] Shared AI icon component with red dot (HAL homage)
- [x] Shared icon component library (primary: lucide-react)
- [x] All functional icons implemented
- [x] All brand icons implemented (LexFiat, Arkiver, Potemkin, MAE)
- [x] LexFiat icon overhaul - replaced SVG sprites
- [x] Arkiver icon consistency - uses same functional icons
- [x] Workflow stage panels updated with icons
- [x] Icon preview page created for review

---

## Icon Reference

### Lucide React Icons (Recommended)
- `BookOpen` - Research
- `Brain` - GoodCounsel
- `Bug` - Testing
- `Inbox` / `FileDown` - Document Intake
- `FileEdit` / `PenTool` - Draft Preparation
- `CheckCircle` / `ClipboardCheck` - Attorney Review
- `Eye` / `SearchCheck` - Final Review
- `Send` / `PaperPlane` - File and Serve
- `UserPlus` / `MessageSquare` - Client Update
- `BarChart3` / `TrendingUp` - Progress Summary
- `Clock` / `Timer` - Time Recording
- `DollarSign` - Billing

### Custom Icons Created ✅
- AI Icon (HAL-inspired) - ✅ Created (`Cyrano/shared-assets/ai-icon.tsx`)
- AI Analysis Icon (HAL with Sparkles overlay) - ✅ Created (`Cyrano/shared-assets/ai-analysis-icon.tsx`)
- All other icons - ✅ Created (`Cyrano/shared-assets/icon-components.tsx`)
  - ResearchIcon (BookOpen + Search)
  - GoodCounselIcon (Scale + Heart overlay)
  - BetaTestingIcon (Bug + β overlay)
  - LexFiatBrandIcon (Lightbulb)
  - ArkiverBrandIcon (Moon + Star + Feather)
  - PotemkinBrandIcon (Layers + light beam)
  - MAEBrandIcon (bx:swim ONLY - BiSwim from react-icons)
  - BillingTimeIcon (Clock + DollarSign)
  - Standard icons exported directly from lucide-react

---

## Notes

- All icons should be vector-based (SVG) for scalability
- Consider dark mode variants where appropriate
- Icons should have consistent stroke width (typically 2px)
- Brand icons may have more detail but should still work at small sizes
- Functional icons should be immediately recognizable without labels

---

## Current Icon Specifications

All icons are implemented:

- **Research:** Archive + Search (lucide-react)
- **GoodCounsel:** Scale + Heart (lucide-react)
- **Beta Testing:** Bug + β text overlay (lucide-react)
- **AI Analysis:** Eye with red pupil (lucide-react)
- **MAE Brand:** bx:swim ONLY (react-icons)
- **Arkiver Brand:** Moon + Feather (lucide-react)
- **LexFiat Brand:** Lightbulb + Scale (both lucide-react, negative space overlay)
- **Potemkin Brand:** Layers (lucide-react)
- **All workflow stages:** Direct lucide-react exports (ClipboardCheck, SearchCheck, Send, etc.)

