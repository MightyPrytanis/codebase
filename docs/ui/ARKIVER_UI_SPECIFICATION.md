---
Document ID: ARKIVER-UI-SPEC
Title: Arkiver UI Specification
Subject(s): Arkiver | UI | Design System | Frontend
Project: Cyrano
Version: v548
Created: 2025-11-27 (2025-W48)
Last Substantive Revision: 2025-11-27 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Definitive reference for all Arkiver UI structure, styling, and behavior. Authoritative source for Arkiver UI/UX specifications. For architecture, see ARKIVER-ARCHITECTURE-GUIDE.
Status: Active
Related Documents: ARKIVER-ARCHITECTURE-GUIDE
---

# Arkiver UI Specification

## Executive Summary

Arkiver UI is a light-themed, professional document processing and insight extraction application. The design must match **exactly** the Base44 Arkiver design at https://arkiver.base44.app. The UI uses a clean, professional aesthetic with light backgrounds, white cards, and copper/teal accents.

---

## Design System

### Color Palette

**Primary Colors:**
- `--arkiver-dark: #2C3E50` - Dark blue-gray (headers, primary text)
- `--arkiver-accent: #D89B6A` - Copper/brown accent (buttons, highlights, active states)
- `--arkiver-teal: #5B8FA3` - Teal secondary (secondary text, links)
- `--arkiver-bg: #f5f5f5` - Light gray background
- `--arkiver-card: #ffffff` - White card background
- `--arkiver-border: #e0e0e0` - Light gray borders

**Text Colors:**
- Primary: `#2C3E50` (dark blue-gray)
- Secondary: `#5B8FA3` (teal)
- Accent: `#D89B6A` (copper)

**Background:**
- Body: `#f5f5f5` (light gray)
- Cards: `#ffffff` (white)
- Borders: `#e0e0e0` (light gray)

### Typography

**Font Family:**
- Primary: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`
- Professional, modern sans-serif stack

**Font Sizes:**
- Headers: 1.5rem - 2.5rem (24px - 40px)
- Body: 0.875rem (14px base)
- Small text: 0.75rem (12px)
- Labels: 0.75rem (12px)

### Spacing

**Padding:**
- Cards: 1.5rem (24px)
- Sections: 2rem (32px)
- Buttons: 0.75rem 1.5rem (12px 24px)

**Margins:**
- Between cards: 1.5rem (24px)
- Section spacing: 2rem (32px)

---

## Component Structure

### Navigation Header

**Location:** `apps/arkiver/frontend/src/App.tsx` (Navigation component)

**Structure:**
- Dark blue header (`#2C3E50`)
- Logo on left
- Navigation items on right
- Active state: white background with dark text
- Inactive state: teal text (`#D89B6A`) on dark background

**Logo:**
- **File:** `apps/arkiver/frontend/src/Arkiver Main.png`
- **Size:** Height 32px, width auto, max-width 120px
- **Styling:** `object-fit: contain`
- **Description:** Copper/brown logo with crescent moon, stars, feather/quill, and "Arkiver" wordmark

**Navigation Items:**
- Dashboard (Home icon)
- Extractor (Upload icon)
- Insights (TrendingUp icon)
- Visualizations (BarChart3 icon)
- AI Assistant (AIIcon - HAL-inspired)
- AI Integrity (Shield icon)
- Settings (SettingsIcon)

**Active State:**
- Background: `#ffffff` (white)
- Text: `#2C3E50` (dark)
- Icons: `#2C3E50` (dark)

**Inactive State:**
- Background: transparent
- Text: `#D89B6A` (copper)
- Icons: `#D89B6A` (copper)

### Dashboard Page

**Location:** `apps/arkiver/frontend/src/pages/Dashboard.tsx`

**Structure:**
- Light background (`#f5f5f5`)
- White cards with rounded corners
- Stats grid (4 columns)
- Quick actions
- Recent files list

**Stats Cards:**
- Background: `#ffffff` (white)
- Border: `1px solid #e0e0e0`
- Border-radius: `0.5rem` (8px)
- Padding: `1.5rem` (24px)
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`

**Colors:**
- Icons: `#D89B6A` (copper) for primary, standard colors for status
- Values: `#5B8FA3` (teal) or `#D89B6A` (copper)
- Labels: `#5B8FA3` (teal)

**Buttons:**
- Primary: Background `#D89B6A` (copper), text white
- Secondary: Background white, border `#e0e0e0`, text `#2C3E50`

### Extractor Page

**Location:** `apps/arkiver/frontend/src/pages/Extractor.tsx`

**Structure:**
- Light background (`#f5f5f5`)
- Upload area
- File list
- Processing status

**Upload Area:**
- White card with border
- Drag-and-drop zone
- Upload button (copper `#D89B6A`)

**File List:**
- White cards
- Status indicators
- Action buttons

### Insights Page

**Location:** `apps/arkiver/frontend/src/pages/Insights.tsx`

**Structure:**
- Light background (`#f5f5f5`)
- Search bar
- Filter options
- Insight cards grid
- Pagination

**Insight Cards:**
- White background
- Border: `1px solid #e0e0e0`
- Padding: `1.5rem`
- Rounded corners

**Text Colors:**
- Titles: `#2C3E50` (dark)
- Content: `#5B8FA3` (teal)
- Metadata: `#5B8FA3` (teal)

### AI Assistant Page

**Location:** `apps/arkiver/frontend/src/pages/AiAssistant.tsx`

**Structure:**
- Light background (`#f5f5f5`)
- Chat interface
- Mode selector
- Insight sidebar

**AI Icon:**
- **Component:** `apps/arkiver/frontend/src/components/AIIcon.tsx`
- **Design:** HAL-inspired (rectangle taller than wide, circle and dot centered)
- **Color:** `#D89B6A` (copper)
- **DO NOT CHANGE** - This is the correct AI icon

**Chat Messages:**
- User: Background `#D89B6A` (copper), text white
- Assistant: Background `#f5f5f5` (light gray), text `#2C3E50` (dark)

### Other Pages

**AI Integrity, Settings, Visualizations:**
- Light background (`#f5f5f5`)
- White cards
- Copper accents for buttons
- Teal for secondary text
- Dark text for primary content

---

## Icon System

### HAL-Inspired AI Icon

**Location:** `apps/arkiver/frontend/src/components/AIIcon.tsx`

**Design:**
- Rectangle taller than wide (10px width, 18px height)
- Circle centered (4px radius)
- Dot centered (1.6px radius)
- Based on HAL 9000's red eye from 2001: A Space Odyssey

**Usage:**
```tsx
import { AIIcon } from './components/AIIcon';
<AIIcon size={16} style={{ color: '#D89B6A' }} />
```

**CRITICAL:** DO NOT use generic brain icons or change this design.

### Other Icons

**Library:** `lucide-react`

**Icons Used:**
- Home, Upload, TrendingUp, BarChart3, Shield, Settings
- FileText, CheckCircle, Clock, Sparkles
- Send, User, Loader2, X

**Colors:**
- Active: `#2C3E50` (dark)
- Inactive: `#D89B6A` (copper)
- Status: Standard colors (green, blue, etc.)

---

## Styling Rules

### Cards

**All Cards:**
- Background: `#ffffff` (white)
- Border: `1px solid #e0e0e0`
- Border-radius: `0.5rem` (8px) - ROUNDED corners
- Padding: `1.5rem` (24px)
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`

### Buttons

**Primary Buttons:**
- Background: `#D89B6A` (copper)
- Text: `#ffffff` (white)
- Border-radius: `0.5rem` (8px)
- Padding: `0.75rem 1.5rem`

**Secondary Buttons:**
- Background: `#ffffff` (white)
- Border: `1px solid #e0e0e0`
- Text: `#2C3E50` (dark)
- Border-radius: `0.5rem` (8px)

### Text

**Headings:**
- Color: `#2C3E50` (dark)
- Font-weight: `bold`
- Font-size: `1.5rem - 2.5rem`

**Body Text:**
- Color: `#5B8FA3` (teal)
- Font-size: `0.875rem` (14px)

**Labels:**
- Color: `#5B8FA3` (teal)
- Font-size: `0.75rem` (12px)

---

## CSS Configuration

### Tailwind Config

**Location:** `apps/arkiver/frontend/tailwind.config.js`

**Colors:**
```javascript
colors: {
  'arkiver-dark': '#2C3E50',
  'arkiver-accent': '#D89B6A',
  'arkiver-teal': '#5B8FA3',
  'arkiver-bg': '#f5f5f5',
  'arkiver-card': '#ffffff',
  'arkiver-border': '#e0e0e0',
}
```

### Global CSS

**Location:** `apps/arkiver/frontend/src/index.css`

**CSS Variables:**
```css
:root {
  --arkiver-dark: #2C3E50;
  --arkiver-accent: #D89B6A;
  --arkiver-teal: #5B8FA3;
  --arkiver-bg: #f5f5f5;
  --arkiver-card: #ffffff;
  --arkiver-border: #e0e0e0;
  --arkiver-text: #2C3E50;
  --arkiver-text-secondary: #5B8FA3;
}
```

**Body:**
- Background: `var(--arkiver-bg)` (`#f5f5f5`)
- Font-family: Inter stack
- Font-size: `14px`
- Line-height: `1.5`

---

## Reference

**Primary Reference:**
- **LIVE SITE:** https://arkiver.base44.app
- **CRITICAL:** All UI must match this site exactly

**Logo:**
- File: `apps/arkiver/frontend/src/Arkiver Main.png`
- Description: Copper/brown with crescent moon, stars, feather/quill, "Arkiver" wordmark

---

## Implementation Rules

1. **Match Base44 exactly** - Layout, spacing, colors, fonts must match https://arkiver.base44.app
2. **Light theme** - Background `#f5f5f5`, cards white
3. **Copper accents** - Buttons, active states use `#D89B6A`
4. **Teal secondary** - Secondary text, links use `#5B8FA3`
5. **Dark headers** - Navigation and headings use `#2C3E50`
6. **Rounded corners** - Cards and buttons use `border-radius: 0.5rem` (8px)
7. **HAL AI icon** - Rectangle, circle, dot - DO NOT CHANGE
8. **Professional fonts** - Inter font stack
9. **Dashboard landing** - Dashboard is the landing page, not Extractor
10. **Inline styles** - Use inline styles for colors to ensure exact matches

---

## Component Locations

- App/Navigation: `apps/arkiver/frontend/src/App.tsx`
- Dashboard: `apps/arkiver/frontend/src/pages/Dashboard.tsx`
- Extractor: `apps/arkiver/frontend/src/pages/Extractor.tsx`
- Insights: `apps/arkiver/frontend/src/pages/Insights.tsx`
- AI Assistant: `apps/arkiver/frontend/src/pages/AiAssistant.tsx`
- AI Integrity: `apps/arkiver/frontend/src/pages/AiIntegrity.tsx`
- Settings: `apps/arkiver/frontend/src/pages/Settings.tsx`
- Visualizations: `apps/arkiver/frontend/src/pages/Visualizations.tsx`
- AIIcon: `apps/arkiver/frontend/src/components/AIIcon.tsx`
- CSS: `apps/arkiver/frontend/src/index.css`
- Tailwind Config: `apps/arkiver/frontend/tailwind.config.js`

---

## Differences from LexFiat

**CRITICAL:** Arkiver UI is COMPLETELY DIFFERENT from LexFiat UI:

- **Theme:** Light (LexFiat is dark)
- **Background:** `#f5f5f5` (LexFiat is `#2a2e35`)
- **Cards:** White with rounded corners (LexFiat uses glass-morphism with sharp corners)
- **Colors:** Copper/teal accents (LexFiat uses blue/gold)
- **Font:** Inter (LexFiat uses SF Pro Display)
- **Style:** Professional, clean (LexFiat is glass-morphism, industrial)

**DO NOT** apply LexFiat styling to Arkiver. They are separate design systems.

---

**Last Updated:** 2025-11-27  
**Maintained By:** UI Team  
**Status:** Authoritative - All other UI docs must match this specification  
**Reference:** https://arkiver.base44.app


