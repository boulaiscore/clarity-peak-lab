

## Redesign: Cognitive Load Expanded View

The current expanded state is cluttered with tiny 8-9px text, barely visible icons, and cramped spacing. The S1/S2 rows with micro progress bars are nearly impossible to read, and the whole section feels like a data dump rather than a premium dashboard.

### Design Direction

Replace the current dense grid layout with a clean, vertically stacked card system that prioritizes readability and breathing space.

### Changes (all in `src/components/dashboard/WeeklyGoalCard.tsx`, compact mode only)

**1. Cognitive Balance Section -- Complete Redesign**
- Replace the cramped horizontal S1/S2 rows (with inline micro-bars and 8px text) with two distinct horizontal cards
- Each card: system icon + label on the left, two area progress indicators stacked vertically, XP total on the right
- Increase text to 10-11px minimum, icons to w-3.5 h-3.5
- Area progress bars become taller (h-1.5) with area labels visible by default (no tap-to-reveal)
- Add subtle background tint per card (e.g., `bg-muted/10`) for visual separation
- Remove the expandedCell tap-to-reveal pattern -- show XP values directly as small labels next to each bar

**2. Recovery Budget -- Visual Upgrade**
- Increase progress bar height to h-2 for consistency with the main bar
- Bump text sizes to 10-11px
- Add a subtle background container matching the S1/S2 cards for visual unity

**3. Spacing and Typography**
- Increase `space-y` from 4 to 5-6 between sections
- Section headers: 11px semibold (up from 10px)
- Value labels: 10px tabular (up from 8-9px)
- Remove italic helper text ("Add one S2 session...") when at 0 -- replace with nothing (less noise)
- Remove "No recovery logged yet." italic text -- the empty bar is self-explanatory

**4. Section Dividers**
- Replace thin `border-t border-border/15` with slightly more visible `border-border/25` and more generous `pt-5` padding

### Technical Scope
- Single file edit: `src/components/dashboard/WeeklyGoalCard.tsx`
- Only the `CollapsibleContent` block inside the `compact` branch (lines ~377-516)
- No data logic changes, no hook changes, no new dependencies

