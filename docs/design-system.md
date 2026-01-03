# Design System

Guidelines for consistent UI across Mounjaro Tracker.

---

## Typography

### Principle: Weight > Size

Use **font weight contrast** rather than size variation to create hierarchy. This produces cleaner, more cohesive designs.

```tsx
// ✅ Good - same size, different weights
<h2 className="text-xl font-bold text-card-foreground">You're on track</h2>
<p className="text-[0.9375rem] font-normal text-muted-foreground">Week 1 · Consistency looks good</p>

// ❌ Avoid - relying only on size
<h2 className="text-2xl text-gray-900">You're on track</h2>
<p className="text-sm text-gray-500">Week 1 · Consistency looks good</p>
```

### Font Families

| Font | Use Case | CSS Class |
|------|----------|-----------|
| **Plus Jakarta Sans** | Large numbers, percentages, stats | `font-display` |
| **Inter** | Everything else (body, labels, UI) | `font-sans` (default) |

### Font Weights

| Weight | Value | Use For |
|--------|-------|---------|
| Bold | 700 | Headlines, display numbers, emphasis |
| Semibold | 600 | Card titles, labels |
| Medium | 500 | Buttons, active nav |
| Normal | 400 | Body text, muted text |

### Type Scale (Exact Values)

Use bracket notation for precise sizing that matches the design:

| Token | Size | Use |
|-------|------|-----|
| `text-[1.625rem]` | 26px | Page titles |
| `text-xl` | 1.25rem (20px) | Hero card titles |
| `text-[1.0625rem]` | 17px | Card titles, section headers |
| `text-[0.9375rem]` | 15px | Body text, subtitles |
| `text-[0.875rem]` | 14px | Small text, metadata |
| `text-[0.75rem]` | 12px | Tiny labels, stat labels |
| `text-[0.6875rem]` | 11px | Nav labels, badges |

---

## Colors

### Semantic Tokens (Required)

Always use semantic color tokens for dark mode support. Never hardcode hex values.

```tsx
// ✅ Correct - semantic tokens
<div className="bg-card text-card-foreground">
<p className="text-muted-foreground">

// ❌ Wrong - hardcoded colors
<div className="bg-white text-gray-900">
<p className="text-gray-500">
```

### Primary Tokens

| Token | Light Mode | Use |
|-------|------------|-----|
| `bg-card` | white | Card backgrounds |
| `text-card-foreground` | dark blue-gray | Primary text |
| `text-muted-foreground` | medium gray | Secondary/muted text |
| `bg-secondary` | light gray | Nested card backgrounds (use with /50) |
| `border-border` | light gray | Borders (use with /40 for subtle) |
| `text-foreground` | near black | Page-level text |

### Status Colors

| Token | Use |
|-------|-----|
| `text-success` / `bg-success` | Positive states, on-track, completed |
| `bg-success-light` | Success backgrounds (at 60% opacity) |
| `text-warning` / `bg-warning` | Warnings, due soon, milestones |
| `text-destructive` | Errors, overdue states |

### Accent Colors (Feature-Specific)

```tsx
// Injections theme
bg-violet-500/15  text-violet-500

// Weight/scale theme
bg-blue-500/15    text-blue-500

// Dose/medication theme
bg-amber-500/15   text-amber-500
```

---

## Spacing

Consistent spacing scale:

| Use | Value | Class |
|-----|-------|-------|
| Page padding | 20px | `px-5 pt-5` |
| Card padding | 20px | `p-5` |
| Compact card padding | 12-16px | `p-3` or `p-4` |
| Card gap | 16px | `mb-4` or `gap-4` |
| Section header gap | 20px | `mb-5` |
| Tight gap | 8px | `gap-2` |
| Element spacing | 4-6px | `mt-0.5`, `gap-1.5` |

---

## Shadows & Radius

### Shadows

Use Tailwind's built-in `shadow-sm` for cards:

```tsx
// ✅ Correct
<div className="rounded-[1.25rem] bg-card p-5 shadow-sm">

// ❌ Wrong - custom shadow
<div className="shadow-card">
```

### Border Radius

| Element | Radius | Class |
|---------|--------|-------|
| Cards | 20px | `rounded-[1.25rem]` |
| Nested cards | 16px | `rounded-2xl` |
| Buttons/pills | 12px | `rounded-xl` |
| Icon containers | full | `rounded-full` |
| Small elements | 8px | `rounded-lg` |

---

## Component Patterns

### Card Structure

```tsx
// Main card
<section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
  <div className="mb-5">
    <h2 className="text-xl font-bold tracking-tight text-card-foreground">
      Title
    </h2>
    <p className="mt-0.5 text-[0.9375rem] font-normal text-muted-foreground">
      Subtitle
    </p>
  </div>
  {/* content */}
</section>
```

### Nested Cards

```tsx
// Nested card inside main card
<div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
  <h3 className="text-[1.0625rem] font-semibold text-card-foreground">
    Card Title
  </h3>
  <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">
    Description
  </p>
</div>
```

### Display Numbers

```tsx
// Large stats with display font
<span className="font-display text-lg font-bold text-card-foreground">86%</span>
<span className="font-display text-2xl font-bold text-violet-500">2.5</span>
```

### Icon + Text Row

```tsx
<div className="mt-3 flex items-center gap-1.5 text-[0.875rem] text-muted-foreground">
  <MapPin className="h-4 w-4" />
  <span>Thigh - Left</span>
</div>
```

### Status Indicator

```tsx
<div className="mt-3 flex items-center gap-1.5 text-[0.875rem] font-medium text-success">
  <CheckCircle2 className="h-4 w-4" />
  <span>On track</span>
</div>
```

### Stat Card (Compact)

```tsx
<div className="rounded-[1.25rem] bg-card p-3 shadow-sm">
  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15">
    <Syringe className="h-4 w-4 text-violet-500" />
  </div>
  <p className="font-display text-lg font-bold text-card-foreground">4</p>
  <p className="text-[0.75rem] text-muted-foreground">Total</p>
</div>
```

---

## Page Layout

### Responsive Viewport Sizing (CRITICAL)

Use `svh` (Small Viewport Height) for stable mobile sizing. This prevents layout shifts when the mobile browser UI (address bar) hides/shows.

```tsx
// ✅ Correct - uses svh for stable mobile sizing
<div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">

// ❌ Wrong - vh causes layout shifts on mobile
<div className="flex min-h-[calc(100vh-140px)] flex-col gap-4 p-4">
```

**Key points:**
- `100svh` = Small Viewport Height (excludes mobile browser chrome)
- `140px` accounts for: header (~56px) + bottom nav (~84px)
- Always add `overflow-x-hidden` to prevent horizontal scroll
- Use `p-4` for consistent page padding

### Standard Page Structure

```tsx
<div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
  {/* Header */}
  <header className="flex items-center justify-between">
    <h1 className="text-[1.625rem] font-bold tracking-tight text-foreground">
      Page Title
    </h1>
    <Button variant="ghost" size="icon" className="rounded-full">
      <Bell className="h-6 w-6 text-muted-foreground" />
    </Button>
  </header>

  {/* Content sections */}
  <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">...</section>
</div>
```

### Skeleton Loaders

Skeletons must match the same viewport sizing as content:

```tsx
function PageSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-48 rounded-[1.25rem]" />
      {/* Match card rounded corners */}
    </div>
  );
}
```

---

## Light Theme Page Gradient

For light theme, use a subtle sage-tinted gradient:

```css
background: linear-gradient(
  180deg,
  #f4f7f4 0%,
  #eef3ee 40%,
  #e8f0e8 70%,
  #e0ebe0 100%
);
```

---

## Quick Reference

```tsx
// Page title
<h1 className="text-[1.625rem] font-bold tracking-tight text-foreground">

// Hero/Card title
<h2 className="text-xl font-bold tracking-tight text-card-foreground">

// Section title
<h3 className="text-[1.0625rem] font-semibold text-card-foreground">

// Subtitle/body
<p className="text-[0.9375rem] text-muted-foreground">

// Small text
<span className="text-[0.875rem] text-muted-foreground">

// Display number
<span className="font-display text-lg font-bold text-card-foreground">

// Success text
<span className="text-[0.875rem] font-medium text-success">

// Main card
<section className="rounded-[1.25rem] bg-card p-5 shadow-sm">

// Nested card
<div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
```
