# Phase 04 — Design System & App Shell

You are implementing Phase 04 of CareQueue: **CareQueue Flowline Design System & Application Shell**.

## Project Context
CareQueue uses the "CareQueue Flowline" design system. The visual identity represents the patient flow from arrival to service completion.

Brand Palette:
- Primary Blue: `#0EA5E9`
- Healthy Green: `#10B981`
- Warning Amber: `#F59E0B`
- Danger Red: `#EF4444`
- Surface: `#F8FAFC`
- Text Primary: `#0F172A`
- Text Muted: `#64748B`
- Border: `#E2E8F0`

## Your Task

### 1. Design Tokens (`frontend/src/design-system/tokens.ts`)
Export a complete tokens object:
```typescript
export const tokens = {
  colors: { primary, accent, warning, danger, surface, text, border },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px' },
  radius: { sm: '4px', md: '8px', lg: '12px', full: '9999px' },
  shadow: { sm: '...', md: '...', lg: '...' },
  font: { sans: 'Inter, system-ui, sans-serif', mono: 'JetBrains Mono, monospace' },
  fontSize: { xs, sm, base, lg, xl, '2xl', '3xl' },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
}
```

### 2. Tailwind Configuration (`frontend/tailwind.config.ts`)
Extend Tailwind with CareQueue tokens:
- Custom colors: `cq-primary`, `cq-accent`, `cq-warning`, `cq-danger`, `cq-surface`
- Custom font family: `font-cq`
- Ensure `content` includes all `src/**/*.{tsx,ts}` files

### 3. Reusable UI Components (`frontend/src/components/`)

**`components/ui/Button.tsx`**:
Props: `variant` (primary | secondary | ghost | danger), `size` (sm | md | lg), `loading`, `disabled`, `onClick`, `children`
Style: Tailwind classes, loading spinner, hover/focus states

**`components/ui/Card.tsx`**:
Props: `title?`, `subtitle?`, `children`, `className?`
Style: white bg, border, rounded-lg, shadow-sm, padding

**`components/ui/Badge.tsx`**:
Props: `variant` (success | warning | danger | info | neutral), `children`
Style: small pill shape with appropriate color

**`components/ui/Input.tsx`**:
Props: `label?`, `error?`, `hint?`, `...HTMLInputProps`
Style: labeled input with error state in red

**`components/ui/Select.tsx`**:
Similar to Input but for `<select>` elements

**`components/ui/Modal.tsx`**:
Using Radix UI Dialog. Props: `open`, `onClose`, `title`, `children`, `footer?`

**`components/ui/Table.tsx`**:
Props: `columns: {key, header, render?}[]`, `data: any[]`, `loading?`, `emptyMessage?`
Style: striped rows, hover highlight, responsive

**`components/ui/KPICard.tsx`**:
Props: `title`, `value`, `unit?`, `trend?` (up | down | flat), `trendValue?`, `icon?`
Style: white card with large value, colored trend indicator

**`components/ui/LoadingSpinner.tsx`**:
Animated ring spinner in `cq-primary` color

### 4. Layout Shell (`frontend/src/components/layout/`)

**`AppShell.tsx`**:
Main layout wrapper:
- Left sidebar (240px wide, collapsed to 60px on mobile)
- Top navbar (64px tall)
- Main content area (scrollable)

**`Sidebar.tsx`**:
Navigation links using `react-router-dom` NavLink:
- Overview / Dashboard
- Analytics → Historical, Time-Slot
- Simulation
- Data → Import, Manage
- Settings → Clinic, Users
- Logout button at bottom

Each link: icon (lucide-react) + label, active state with `cq-primary` highlight

**`Navbar.tsx`**:
- CareQueue logo/wordmark on left
- Current clinic name in center
- User avatar + name + role badge on right
- Notification bell (placeholder)

### 5. Update App Router (`frontend/src/app/App.tsx`)
Wire up routes with AppShell wrapping authenticated routes:
```
/login             → LoginPage (no shell)
/dashboard         → OverviewPage (shell + protected)
/analytics/*       → AnalyticsPages (shell + protected)
/simulation/*      → SimulationPages (shell + protected)
/data/*            → DataPages (shell + protected)
/settings/*        → SettingsPages (shell + protected)
```
All page components can be placeholders ("Coming in Phase X") for now.

### 6. Inter Font Setup
In `index.html`, add Google Fonts import for Inter (weights 400, 500, 600, 700).

## Exit Gates
- [ ] All 8 UI components exist and render without errors
- [ ] AppShell renders sidebar + navbar + content area
- [ ] Sidebar NavLinks highlight the active route
- [ ] Tailwind config has `cq-*` color classes working
- [ ] KPICard, Badge, Table components styled correctly
- [ ] All routes in App.tsx defined (even as placeholders)
