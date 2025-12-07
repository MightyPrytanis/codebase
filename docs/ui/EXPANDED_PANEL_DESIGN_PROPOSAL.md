# Expanded Panel Design Proposal

**Last Updated:** 2025-12-07 (2025-W49)  
**Version:** v549

## Design Principles

All expanded panels should follow a consistent visual structure:

### Layout Structure
1. **Header Section** (Fixed at top)
   - Title with icon
   - Close button (×)
   - Optional: Action buttons (Filter, Sort, Export)

2. **Hero/Summary Section** (Optional, below header)
   - Key metrics in a card grid
   - Quick stats with visual indicators
   - Status overview

3. **Content Area** (Scrollable)
   - Tabbed interface for complex panels
   - List/grid view toggle
   - Filter and search controls
   - Item cards with consistent styling

4. **Action Bar** (Fixed at bottom, optional)
   - Primary actions
   - Bulk operations
   - Quick filters

### Visual Consistency

**Typography:**
- Panel title: 1.5rem, font-weight 700, uppercase, letter-spacing 0.1em
- Section headers: 1.1rem, font-weight 600
- Body text: 0.9rem, line-height 1.6
- Labels: 0.75rem, uppercase, letter-spacing 0.05em

**Spacing:**
- Panel padding: 2rem
- Section gap: 1.5rem
- Card gap: 1rem
- Internal card padding: 1rem

**Colors:**
- Background: Same glass effect as widgets
- Cards: Subtle background with border
- Accent colors match widget colors

**Cards:**
- Right angle corners: 0px
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Hover: Slight lift and glow
- Consistent padding and spacing

## Panel-Specific Designs

### Intake Panel
- **Header:** "Document Intake" with Inbox icon
- **Summary:** Today count, Pending count in metric cards
- **Content:** 
  - Filter bar: Date range, Source, Status
  - Document list: Cards with preview, metadata, actions
  - Each card: Icon, title, source, date, status badge, quick actions

### Processing Panel  
- **Header:** "Processing" with RotateCw icon
- **Summary:** In Progress count, Completed today
- **Content:**
  - Tabs: "In Progress" | "Completed" | "Needs Attention"
  - Progress indicators for each item
  - Expandable details

### Ready Panel
- **Header:** "Ready for Review" with GrLaunch icon
- **Summary:** Ready count, Urgent count
- **Content:**
  - Priority-sorted list
  - Quick review actions
  - Batch operations

### Today's Focus Panel
- **Header:** "Today's Focus" with Eye icon
- **Content:**
  - Calendar view integration
  - Task list with deadlines
  - Drag-to-reschedule

### GoodCounsel Panel
- Notes provided separately.

## Implementation Notes

- Use ExpandedPanel component as base
- Add consistent card components
- Implement shared filter/search components
- Ensure responsive design
- Add loading states
- Add empty states with helpful messages

