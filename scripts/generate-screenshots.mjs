/**
 * PWA Screenshot Generator Script
 *
 * Generates placeholder PNG screenshots for PWA manifest.
 * Run with: node scripts/generate-screenshots.mjs
 *
 * Creates screenshots for:
 * - Mobile (narrow): 390x844 (iPhone 14 Pro)
 * - Desktop (wide): 1280x800
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Mobile screenshot SVG (390x844 - iPhone 14 Pro)
const createMobileSummarySvg = () => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="390" height="844" viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="390" height="844" fill="#0a0a0a"/>

  <!-- Status bar area -->
  <rect x="0" y="0" width="390" height="44" fill="#0a0a0a"/>
  <text x="195" y="30" text-anchor="middle" fill="#ffffff" font-family="system-ui" font-size="14" font-weight="600">9:41</text>

  <!-- Header -->
  <rect x="0" y="44" width="390" height="60" fill="#0a0a0a"/>
  <text x="20" y="82" fill="#ffffff" font-family="system-ui" font-size="24" font-weight="700">Summary</text>

  <!-- Action Required Card -->
  <rect x="16" y="120" width="358" height="100" rx="12" fill="#1a2a3a"/>
  <text x="32" y="148" fill="#9ca3af" font-family="system-ui" font-size="12" font-weight="600">ACTION REQUIRED</text>
  <text x="32" y="175" fill="#ffffff" font-family="system-ui" font-size="16" font-weight="500">Next injection due in 2 days</text>
  <rect x="32" y="190" width="100" height="20" rx="10" fill="#00d4ff"/>
  <text x="82" y="204" text-anchor="middle" fill="#0a0a0a" font-family="system-ui" font-size="12" font-weight="600">Log Now</text>

  <!-- Current State -->
  <text x="16" y="256" fill="#9ca3af" font-family="system-ui" font-size="12" font-weight="600">CURRENT STATE</text>

  <!-- Weight Card -->
  <rect x="16" y="268" width="170" height="90" rx="12" fill="#1a2a3a"/>
  <text x="32" y="294" fill="#9ca3af" font-family="system-ui" font-size="12">Current Weight</text>
  <text x="32" y="326" fill="#ffffff" font-family="system-ui" font-size="28" font-weight="700">82.5</text>
  <text x="95" y="326" fill="#9ca3af" font-family="system-ui" font-size="16">kg</text>
  <text x="32" y="346" fill="#22c55e" font-family="system-ui" font-size="12">-3.2 kg this month</text>

  <!-- BMI Card -->
  <rect x="204" y="268" width="170" height="90" rx="12" fill="#1a2a3a"/>
  <text x="220" y="294" fill="#9ca3af" font-family="system-ui" font-size="12">Current BMI</text>
  <text x="220" y="326" fill="#ffffff" font-family="system-ui" font-size="28" font-weight="700">27.4</text>
  <text x="220" y="346" fill="#22c55e" font-family="system-ui" font-size="12">Overweight</text>

  <!-- Journey Progress -->
  <text x="16" y="394" fill="#9ca3af" font-family="system-ui" font-size="12" font-weight="600">JOURNEY PROGRESS</text>

  <rect x="16" y="406" width="358" height="80" rx="12" fill="#1a2a3a"/>
  <text x="32" y="432" fill="#9ca3af" font-family="system-ui" font-size="12">Goal Progress</text>
  <rect x="32" y="444" width="326" height="8" rx="4" fill="#374151"/>
  <rect x="32" y="444" width="200" height="8" rx="4" fill="#00d4ff"/>
  <text x="32" y="472" fill="#ffffff" font-family="system-ui" font-size="14">7.5 kg lost of 15 kg goal (50%)</text>

  <!-- Recent Activity -->
  <text x="16" y="522" fill="#9ca3af" font-family="system-ui" font-size="12" font-weight="600">RECENT ACTIVITY</text>

  <rect x="16" y="534" width="358" height="50" rx="12" fill="#1a2a3a"/>
  <text x="32" y="564" fill="#ffffff" font-family="system-ui" font-size="14">Logged weight: 82.5 kg</text>
  <text x="340" y="564" text-anchor="end" fill="#9ca3af" font-family="system-ui" font-size="12">Today</text>

  <rect x="16" y="592" width="358" height="50" rx="12" fill="#1a2a3a"/>
  <text x="32" y="622" fill="#ffffff" font-family="system-ui" font-size="14">Injection: 5.0mg</text>
  <text x="340" y="622" text-anchor="end" fill="#9ca3af" font-family="system-ui" font-size="12">5 days ago</text>

  <!-- Bottom Navigation -->
  <rect x="0" y="760" width="390" height="84" fill="#0a0a0a"/>
  <line x1="0" y1="760" x2="390" y2="760" stroke="#374151" stroke-width="1"/>

  <!-- Nav items -->
  <circle cx="39" cy="790" r="20" fill="#1a2a3a"/>
  <text x="39" y="795" text-anchor="middle" fill="#00d4ff" font-size="16">H</text>
  <text x="39" y="820" text-anchor="middle" fill="#00d4ff" font-family="system-ui" font-size="10">Summary</text>

  <text x="117" y="795" text-anchor="middle" fill="#9ca3af" font-size="16">R</text>
  <text x="117" y="820" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="10">Results</text>

  <text x="195" y="795" text-anchor="middle" fill="#9ca3af" font-size="16">J</text>
  <text x="195" y="820" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="10">Jabs</text>

  <text x="273" y="795" text-anchor="middle" fill="#9ca3af" font-size="16">C</text>
  <text x="273" y="820" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="10">Calendar</text>

  <text x="351" y="795" text-anchor="middle" fill="#9ca3af" font-size="16">S</text>
  <text x="351" y="820" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="10">Settings</text>
</svg>`;

// Mobile Results screenshot
const createMobileResultsSvg = () => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="390" height="844" viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="390" height="844" fill="#0a0a0a"/>

  <!-- Status bar -->
  <text x="195" y="30" text-anchor="middle" fill="#ffffff" font-family="system-ui" font-size="14" font-weight="600">9:41</text>

  <!-- Header -->
  <text x="20" y="82" fill="#ffffff" font-family="system-ui" font-size="24" font-weight="700">Results</text>

  <!-- Period Tabs -->
  <text x="30" y="120" fill="#9ca3af" font-family="system-ui" font-size="14">1m</text>
  <text x="80" y="120" fill="#9ca3af" font-family="system-ui" font-size="14">3m</text>
  <text x="130" y="120" fill="#00d4ff" font-family="system-ui" font-size="14" font-weight="600">6m</text>
  <line x1="118" y1="128" x2="150" y2="128" stroke="#00d4ff" stroke-width="2"/>
  <text x="190" y="120" fill="#9ca3af" font-family="system-ui" font-size="14">All</text>

  <!-- Chart Area -->
  <rect x="16" y="140" width="358" height="280" rx="12" fill="#1a2a3a"/>

  <!-- Chart Y-axis labels -->
  <text x="350" y="170" text-anchor="end" fill="#9ca3af" font-family="system-ui" font-size="10">95</text>
  <text x="350" y="220" text-anchor="end" fill="#9ca3af" font-family="system-ui" font-size="10">90</text>
  <text x="350" y="270" text-anchor="end" fill="#9ca3af" font-family="system-ui" font-size="10">85</text>
  <text x="350" y="320" text-anchor="end" fill="#9ca3af" font-family="system-ui" font-size="10">80</text>
  <text x="350" y="370" text-anchor="end" fill="#9ca3af" font-family="system-ui" font-size="10">75</text>

  <!-- Chart line (simulated weight loss curve) -->
  <path d="M 40 180 Q 100 190, 140 210 T 200 260 T 260 300 T 320 340"
        fill="none" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/>
  <path d="M 140 210 Q 170 230, 200 260"
        fill="none" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>
  <path d="M 200 260 Q 230 280, 260 300 T 320 340"
        fill="none" stroke="#00d4ff" stroke-width="3" stroke-linecap="round"/>

  <!-- Dose badges -->
  <rect x="40" y="390" width="50" height="18" rx="9" fill="#9ca3af"/>
  <text x="65" y="403" text-anchor="middle" fill="#0a0a0a" font-family="system-ui" font-size="10" font-weight="600">2.5mg</text>

  <rect x="140" y="390" width="50" height="18" rx="9" fill="#a855f7"/>
  <text x="165" y="403" text-anchor="middle" fill="#ffffff" font-family="system-ui" font-size="10" font-weight="600">5.0mg</text>

  <rect x="240" y="390" width="50" height="18" rx="9" fill="#00d4ff"/>
  <text x="265" y="403" text-anchor="middle" fill="#0a0a0a" font-family="system-ui" font-size="10" font-weight="600">7.5mg</text>

  <!-- Stats Grid -->
  <rect x="16" y="440" width="112" height="70" rx="8" fill="#1a2a3a"/>
  <text x="32" y="462" fill="#9ca3af" font-family="system-ui" font-size="10">Total Change</text>
  <text x="32" y="490" fill="#22c55e" font-family="system-ui" font-size="20" font-weight="700">-12.5 kg</text>

  <rect x="140" y="440" width="112" height="70" rx="8" fill="#1a2a3a"/>
  <text x="156" y="462" fill="#9ca3af" font-family="system-ui" font-size="10">Current BMI</text>
  <text x="156" y="490" fill="#ffffff" font-family="system-ui" font-size="20" font-weight="700">27.4</text>

  <rect x="262" y="440" width="112" height="70" rx="8" fill="#1a2a3a"/>
  <text x="278" y="462" fill="#9ca3af" font-family="system-ui" font-size="10">Weekly Avg</text>
  <text x="278" y="490" fill="#22c55e" font-family="system-ui" font-size="20" font-weight="700">-0.8 kg</text>

  <rect x="16" y="520" width="112" height="70" rx="8" fill="#1a2a3a"/>
  <text x="32" y="542" fill="#9ca3af" font-family="system-ui" font-size="10">% Lost</text>
  <text x="32" y="570" fill="#22c55e" font-family="system-ui" font-size="20" font-weight="700">13.2%</text>

  <rect x="140" y="520" width="112" height="70" rx="8" fill="#1a2a3a"/>
  <text x="156" y="542" fill="#9ca3af" font-family="system-ui" font-size="10">Current</text>
  <text x="156" y="570" fill="#ffffff" font-family="system-ui" font-size="20" font-weight="700">82.5 kg</text>

  <rect x="262" y="520" width="112" height="70" rx="8" fill="#1a2a3a"/>
  <text x="278" y="542" fill="#9ca3af" font-family="system-ui" font-size="10">To Goal</text>
  <text x="278" y="570" fill="#eab308" font-family="system-ui" font-size="20" font-weight="700">7.5 kg</text>

  <!-- Bottom Navigation -->
  <rect x="0" y="760" width="390" height="84" fill="#0a0a0a"/>
  <line x1="0" y1="760" x2="390" y2="760" stroke="#374151" stroke-width="1"/>

  <text x="39" y="795" text-anchor="middle" fill="#9ca3af" font-size="16">H</text>
  <text x="39" y="820" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="10">Summary</text>

  <circle cx="117" cy="790" r="20" fill="#1a2a3a"/>
  <text x="117" y="795" text-anchor="middle" fill="#00d4ff" font-size="16">R</text>
  <text x="117" y="820" text-anchor="middle" fill="#00d4ff" font-family="system-ui" font-size="10">Results</text>

  <text x="195" y="795" text-anchor="middle" fill="#9ca3af" font-size="16">J</text>
  <text x="195" y="820" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="10">Jabs</text>

  <text x="273" y="795" text-anchor="middle" fill="#9ca3af" font-size="16">C</text>
  <text x="273" y="820" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="10">Calendar</text>

  <text x="351" y="795" text-anchor="middle" fill="#9ca3af" font-size="16">S</text>
  <text x="351" y="820" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="10">Settings</text>
</svg>`;

// Desktop screenshot (1280x800)
const createDesktopSummarySvg = () => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1280" height="800" fill="#0a0a0a"/>

  <!-- Header -->
  <rect x="0" y="0" width="1280" height="64" fill="#0a0a0a"/>
  <text x="40" y="42" fill="#00d4ff" font-family="system-ui" font-size="20" font-weight="700">MounjaroRx</text>
  <text x="180" y="42" fill="#ffffff" font-family="system-ui" font-size="16">Summary</text>
  <text x="280" y="42" fill="#9ca3af" font-family="system-ui" font-size="16">Results</text>
  <text x="360" y="42" fill="#9ca3af" font-family="system-ui" font-size="16">Jabs</text>
  <text x="420" y="42" fill="#9ca3af" font-family="system-ui" font-size="16">Calendar</text>

  <!-- Main Content Area -->
  <rect x="40" y="84" width="1200" height="680" rx="16" fill="transparent"/>

  <!-- Page Title -->
  <text x="60" y="130" fill="#ffffff" font-family="system-ui" font-size="32" font-weight="700">Summary</text>

  <!-- Action Required -->
  <rect x="60" y="160" width="580" height="120" rx="12" fill="#1a2a3a"/>
  <text x="80" y="195" fill="#9ca3af" font-family="system-ui" font-size="14" font-weight="600">ACTION REQUIRED</text>
  <text x="80" y="230" fill="#ffffff" font-family="system-ui" font-size="18">Next injection due in 2 days</text>
  <rect x="80" y="245" width="120" height="28" rx="14" fill="#00d4ff"/>
  <text x="140" y="264" text-anchor="middle" fill="#0a0a0a" font-family="system-ui" font-size="14" font-weight="600">Log Injection</text>

  <!-- Current State Cards -->
  <text x="60" y="320" fill="#9ca3af" font-family="system-ui" font-size="14" font-weight="600">CURRENT STATE</text>

  <rect x="60" y="340" width="280" height="120" rx="12" fill="#1a2a3a"/>
  <text x="80" y="375" fill="#9ca3af" font-family="system-ui" font-size="14">Current Weight</text>
  <text x="80" y="420" fill="#ffffff" font-family="system-ui" font-size="36" font-weight="700">82.5</text>
  <text x="170" y="420" fill="#9ca3af" font-family="system-ui" font-size="20">kg</text>
  <text x="80" y="445" fill="#22c55e" font-family="system-ui" font-size="14">-3.2 kg this month</text>

  <rect x="360" y="340" width="280" height="120" rx="12" fill="#1a2a3a"/>
  <text x="380" y="375" fill="#9ca3af" font-family="system-ui" font-size="14">Current BMI</text>
  <text x="380" y="420" fill="#ffffff" font-family="system-ui" font-size="36" font-weight="700">27.4</text>
  <text x="380" y="445" fill="#22c55e" font-family="system-ui" font-size="14">Overweight (was Obese)</text>

  <!-- Journey Progress -->
  <text x="60" y="500" fill="#9ca3af" font-family="system-ui" font-size="14" font-weight="600">JOURNEY PROGRESS</text>

  <rect x="60" y="520" width="580" height="100" rx="12" fill="#1a2a3a"/>
  <text x="80" y="555" fill="#9ca3af" font-family="system-ui" font-size="14">Goal Progress</text>
  <rect x="80" y="570" width="540" height="10" rx="5" fill="#374151"/>
  <rect x="80" y="570" width="324" height="10" rx="5" fill="#00d4ff"/>
  <text x="80" y="600" fill="#ffffff" font-family="system-ui" font-size="14">7.5 kg lost of 15 kg goal (50%)</text>

  <!-- Right Side - Chart Preview -->
  <rect x="660" y="160" width="580" height="460" rx="12" fill="#1a2a3a"/>
  <text x="680" y="200" fill="#ffffff" font-family="system-ui" font-size="18" font-weight="600">Weight Progress</text>

  <!-- Mini chart -->
  <path d="M 700 350 Q 800 360, 900 380 T 1100 450 T 1200 500"
        fill="none" stroke="#00d4ff" stroke-width="3" stroke-linecap="round"/>

  <!-- Y axis labels -->
  <text x="1210" y="280" fill="#9ca3af" font-family="system-ui" font-size="12">95 kg</text>
  <text x="1210" y="380" fill="#9ca3af" font-family="system-ui" font-size="12">85 kg</text>
  <text x="1210" y="480" fill="#9ca3af" font-family="system-ui" font-size="12">75 kg</text>

  <!-- Stats below chart -->
  <rect x="680" y="540" width="160" height="60" rx="8" fill="#0a0a0a"/>
  <text x="700" y="565" fill="#9ca3af" font-family="system-ui" font-size="12">Total Lost</text>
  <text x="700" y="588" fill="#22c55e" font-family="system-ui" font-size="18" font-weight="700">-12.5 kg</text>

  <rect x="860" y="540" width="160" height="60" rx="8" fill="#0a0a0a"/>
  <text x="880" y="565" fill="#9ca3af" font-family="system-ui" font-size="12">Weekly Avg</text>
  <text x="880" y="588" fill="#22c55e" font-family="system-ui" font-size="18" font-weight="700">-0.8 kg</text>

  <rect x="1040" y="540" width="160" height="60" rx="8" fill="#0a0a0a"/>
  <text x="1060" y="565" fill="#9ca3af" font-family="system-ui" font-size="12">To Goal</text>
  <text x="1060" y="588" fill="#eab308" font-family="system-ui" font-size="18" font-weight="700">7.5 kg</text>

  <!-- Recent Activity -->
  <text x="60" y="660" fill="#9ca3af" font-family="system-ui" font-size="14" font-weight="600">RECENT ACTIVITY</text>

  <rect x="60" y="680" width="580" height="50" rx="8" fill="#1a2a3a"/>
  <text x="80" y="712" fill="#ffffff" font-family="system-ui" font-size="14">Logged weight: 82.5 kg</text>
  <text x="600" y="712" text-anchor="end" fill="#9ca3af" font-family="system-ui" font-size="12">Today</text>
</svg>`;

// Screenshots to generate
const screenshots = [
  { name: 'mobile-summary', width: 390, height: 844, createSvg: createMobileSummarySvg },
  { name: 'mobile-results', width: 390, height: 844, createSvg: createMobileResultsSvg },
  { name: 'desktop-summary', width: 1280, height: 800, createSvg: createDesktopSummarySvg },
];

async function generateScreenshots() {
  for (const { name, createSvg } of screenshots) {
    const svg = createSvg();
    const pngPath = path.join(screenshotsDir, `${name}.png`);

    // Convert to PNG using sharp
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    console.log(`Created: ${name}.png`);
  }

  console.log(`
PWA screenshots generated in public/screenshots/

Files created:
- mobile-summary.png (390x844) - narrow form_factor
- mobile-results.png (390x844) - narrow form_factor
- desktop-summary.png (1280x800) - wide form_factor

These are placeholder screenshots. Replace with actual app screenshots
for the best install experience.
`);
}

generateScreenshots().catch(console.error);
