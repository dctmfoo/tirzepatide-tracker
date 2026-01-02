Based on the screen recording of **Shotsy** and your existing **Mounjaro Tracker** codebase, I have performed a detailed gap analysis.

Your current app is functional and clean (shadcn/ui style), but **Shotsy** relies heavily on **"Bento Box" grids**, **vibrant gradients**, **large data visualizations**, and **gamified progress indicators** (arcs/rings).

Here is the refactoring plan to transform your app.

---

### 1. Global Styling & Theme Updates
**Goal:** Move from "Clinical Dark Mode" to "Vibrant Data Dark Mode". Shotsy uses deep blacks (`#000`) with high-contrast neon accents (Teal, Orange, Purple).

**File:** `src/app/globals.css`
Update your root variables to support the "Shotsy" gradient look.

```css
@layer base {
  :root {
    /* Deep Black Background */
    --background: 0 0% 0%; 
    --card: 240 10% 3.9%; /* Slightly lighter for cards */
    --radius: 1.25rem; /* Larger border radius (20px) like Shotsy */
  }
  
  /* Add Custom Gradients via utility classes in tailwind.config instead */
}

/* Add specific utility classes for the "Glass" look */
.glass-panel {
  @apply bg-card/60 backdrop-blur-xl border-white/5 border;
}
```

**File:** `tailwind.config.ts` (Conceptual update)
Add these specific colors observed in the video:
*   **Brand Teal:** For "On Track" / "Medication Levels"
*   **Warning Orange:** For "Next Jab" countdown.
*   **Purple:** For "Weight" metrics.

---

### 2. Summary Page (The Dashboard)
**Current:** Vertical stack of distinct sections.
**Target:** A dense "Bento Grid" layout.

#### A. New Component: `MedicationLevelChart`
Shotsy’s signature feature is the "Estimated Medication Levels" line chart at the top. You need to visualize the half-life of the medication.

**Create:** `src/components/summary/MedicationLevelChart.tsx`

```tsx
'use client';

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

export function MedicationLevelChart() {
  // TODO: Logic to calculate half-life decay based on user's injection history
  // Mounjaro half-life is approx 5 days.
  const data = [
    { day: 1, level: 5 }, { day: 2, level: 8 }, { day: 3, level: 6.5 },
    { day: 4, level: 5.2 }, { day: 5, level: 4.1 }, { day: 6, level: 3.2 },
    { day: 7, level: 2.5 },
  ];

  return (
    <div className="w-full h-[180px] bg-card rounded-3xl p-4 border border-white/10 relative overflow-hidden">
      <div className="flex justify-between items-center mb-2 z-10 relative">
        <div>
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Est. Medication Levels</h3>
          <p className="text-2xl font-bold text-teal-400">4.12<span className="text-sm text-muted-foreground ml-1">mg</span></p>
        </div>
      </div>
      
      <div className="absolute inset-0 bottom-0 top-16 right-0 left-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis hide domain={[0, 'dataMax + 2']} />
            <Area 
              type="monotone" 
              dataKey="level" 
              stroke="#2dd4bf" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorLevel)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

#### B. Refactor: `NextInjectionCard` -> `HeroCountdownArc`
Shotsy uses a massive "Horseshoe" progress bar for the next jab, not a small ring.

**Update:** `src/components/summary/NextInjectionCard.tsx`

```tsx
// Use a library like chart.js or custom SVG for the horseshoe
// Here is a simplified custom SVG approach matching the video style
export function NextInjectionCard({ daysUntil, nextDue }: Props) {
  // 50% arc logic...
  
  return (
    <div className="col-span-2 bg-card rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
      
      <h3 className="self-start text-muted-foreground text-xs font-semibold uppercase mb-4">Next Jab</h3>
      
      <div className="relative w-64 h-32 flex items-end justify-center mb-2">
        {/* Custom SVG Arc implementation here */}
        <div className="text-center mb-2">
          <span className="text-5xl font-black text-white">{daysUntil}</span>
          <span className="text-muted-foreground text-sm block font-medium">days to go</span>
        </div>
      </div>
      
      <div className="w-full flex justify-between items-center bg-white/5 rounded-full p-1 pl-4 mt-4">
        <span className="text-xs text-muted-foreground">{new Date(nextDue).toLocaleDateString(undefined, {weekday: 'short', day: 'numeric', month: 'short'})}</span>
        <Button size="sm" className="rounded-full bg-white text-black hover:bg-gray-200">
          Log Jab
        </Button>
      </div>
    </div>
  )
}
```

#### C. New Layout: `SummaryPage` Grid
Replace the vertical `Section` stack with a Grid.

**File:** `src/app/(app)/summary/page.tsx`

```tsx
// ... imports

return (
  <div className="p-4 space-y-4 pb-32">
    {/* Top Row: Jab Stats (Small Cards) */}
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Jabs Taken" value={data.injection.totalCount} icon={Syringe} />
      <StatCard label="Last Dose" value={`${data.injection.currentDose}mg`} icon={Pill} />
      <StatCard label="Current" value="3.5mg" icon={Activity} /> {/* Calculated level */}
    </div>

    {/* Chart Row */}
    <MedicationLevelChart />

    {/* Hero Row: Next Jab */}
    <NextInjectionCard ... />

    {/* Horizontal Scroll Row: "Today" Metrics */}
    <div>
      <h3 className="text-lg font-bold mb-3 px-1">Today</h3>
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        <MetricCard 
          label="Weight" 
          value={currentWeight} 
          unit="kg" 
          color="bg-purple-500/20 text-purple-400"
          onClick={() => openWeightModal()} // Using your existing modal logic
        />
        <MetricCard 
          label="Side Effects" 
          value="None" 
          icon={Activity}
          color="bg-blue-500/20 text-blue-400"
        />
        {/* Add Calories/Protein placeholders if you want to match Shotsy fully */}
      </div>
    </div>
    
    {/* Bottom: Results Summary (Bento Grid) */}
    <ResultsSummaryGrid data={data} />
  </div>
);
```

---

### 3. Jabs Page (History & Details)
**Observation:** Shotsy uses a timeline view with high-contrast cards.
**Update:** `src/components/jabs/InjectionHistoryItem.tsx`

*   **Styling:** Remove the border. Use a solid dark gray background (`bg-zinc-900`).
*   **Typography:** Make the dosage (e.g., "2.5mg") huge and bold.
*   **Visuals:** Add a small visual pill shape indicating the color of the pen (e.g., Purple for 5mg, Teal for 7.5mg - matching Mounjaro branding colors).

```tsx
// Conceptual Refactor
export function InjectionHistoryItem({ doseMg, date, site }: Props) {
  const doseColor = getDoseColor(doseMg); // Helper to get brand color
  
  return (
    <div className="flex gap-4 relative">
      {/* Timeline Line */}
      <div className="absolute left-[19px] top-10 bottom-[-16px] w-[2px] bg-white/10" />
      
      {/* Date Circle */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-[${doseColor}] bg-background z-10`}>
        <Syringe className="w-4 h-4" style={{ color: doseColor }} />
      </div>
      
      {/* Card */}
      <div className="flex-1 bg-zinc-900 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-2xl font-bold text-white">{doseMg}<span className="text-sm text-muted-foreground ml-1">mg</span></h4>
            <p className="text-muted-foreground text-sm">{site}</p>
          </div>
          <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded-md">
            {formatDate(date)}
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Log "Wizard" Refactor
**Observation:** Your current `LogWizard` is a multi-step page. Shotsy uses quick bottom-sheet modals for individual items ("Weight", "Side Effects").
**Recommendation:** Keep your wizard for a "Daily Review", but expose quick-add buttons on the Summary page (as seen in the layout above).

1.  **Refactor `LogWeightModal`:** Style it to look like an iOS bottom sheet (use `vaul` drawer if not already, or style `Dialog` to slide up).
2.  **Side Effects UI:** Instead of a dropdown, use a grid of toggleable pill buttons (Chips) in the logging modal.

---

### 5. Results Page (Analytics)
**Observation:** Shotsy puts heavy stats in a 2-column grid at the bottom of the dashboard, but also has a detailed view.
**Refactor:** `src/components/results/ResultsClient.tsx`

Create a **Bento Grid** for the stats instead of the current list.

```tsx
export function ResultsGrid({ data }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-zinc-900 p-4 rounded-2xl">
        <p className="text-muted-foreground text-xs uppercase">Total Change</p>
        <p className="text-2xl font-bold text-green-400">-4.2<span className="text-sm">kg</span></p>
      </div>
      <div className="bg-zinc-900 p-4 rounded-2xl">
        <p className="text-muted-foreground text-xs uppercase">Current BMI</p>
        <p className="text-2xl font-bold text-white">32.6</p>
      </div>
      <div className="bg-zinc-900 p-4 rounded-2xl col-span-2">
        <p className="text-muted-foreground text-xs uppercase mb-2">Weight Trend</p>
        {/* Small sparkline chart here */}
        <div className="h-16 w-full">
           <WeightSparkline data={data} />
        </div>
      </div>
    </div>
  )
}
```

### Summary of Tasks for Developer:
1.  **Install Recharts** (you have it) and **Vaul** (for better drawers) if not installed.
2.  **Update `globals.css`** to deepen the blacks and round the corners (`20px+`).
3.  **Implement `MedicationLevelChart.tsx`** using a half-life formula (Power function) to generate the curve.
4.  **Rewrite `summary/page.tsx`** to use the new Bento Grid layout shown in the video.
5.  **Refactor `NextInjectionCard`** to use a large semi-circle SVG progress bar.
6.  **Update `InjectionHistoryItem`** to use a timeline layout.