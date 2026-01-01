/**
 * PWA Icon Generator Script
 *
 * Generates placeholder PNG icons for PWA manifest.
 * Run with: node scripts/generate-icons.mjs
 *
 * Creates icons with the Mounjaro Tracker branding:
 * - Background: #0a0a0a (app background)
 * - Accent: #00d4ff (cyan primary)
 * - Icon: Syringe symbol
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for icons (using simple shapes instead of emoji for better rendering)
const createSvg = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.1 : 0;
  const innerSize = size - padding * 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = innerSize * 0.35;

  // Syringe icon paths (simplified)
  const syringeScale = innerSize * 0.004;
  const syringeX = centerX - 50 * syringeScale;
  const syringeY = centerY - 50 * syringeScale;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#1a2a3a"/>
  <g transform="translate(${syringeX}, ${syringeY}) scale(${syringeScale})">
    <!-- Syringe body -->
    <rect x="35" y="25" width="30" height="60" rx="3" fill="#00d4ff"/>
    <!-- Syringe plunger -->
    <rect x="42" y="10" width="16" height="20" rx="2" fill="#00d4ff"/>
    <rect x="46" y="5" width="8" height="10" rx="2" fill="#00d4ff"/>
    <!-- Needle -->
    <rect x="47" y="85" width="6" height="20" fill="#00d4ff"/>
    <polygon points="50,105 47,115 53,115" fill="#00d4ff"/>
    <!-- Measurement lines -->
    <rect x="35" y="35" width="8" height="2" fill="#0a0a0a"/>
    <rect x="35" y="45" width="8" height="2" fill="#0a0a0a"/>
    <rect x="35" y="55" width="8" height="2" fill="#0a0a0a"/>
    <rect x="35" y="65" width="8" height="2" fill="#0a0a0a"/>
  </g>
</svg>`;
};

// Icon sizes to generate
const icons = [
  { name: 'icon-192', size: 192, maskable: false },
  { name: 'icon-384', size: 384, maskable: false },
  { name: 'icon-512', size: 512, maskable: false },
  { name: 'icon-maskable', size: 512, maskable: true },
];

async function generateIcons() {
  for (const { name, size, maskable } of icons) {
    const svg = createSvg(size, maskable);
    const svgPath = path.join(iconsDir, `${name}.svg`);
    const pngPath = path.join(iconsDir, `${name}.png`);

    // Save SVG
    fs.writeFileSync(svgPath, svg);
    console.log(`Created: ${name}.svg`);

    // Convert to PNG using sharp
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    console.log(`Created: ${name}.png`);
  }

  console.log(`
✅ PWA icons generated in public/icons/

Files created:
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)
- icon-maskable.png (512x512 with safe zone)

You can replace these with your actual brand icons.
`);
}

generateIcons().catch(console.error);
