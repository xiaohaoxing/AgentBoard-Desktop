#!/usr/bin/env node
// Generates assets/icon.icns and assets/icon.png from the AgentBoard SVG logo.
// Wraps the logo in a dark macOS-style background; macOS applies the squircle clip.
// Usage: node scripts/generate-icons.js

const sharp = require('sharp');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ── Composite SVG: green gradient background + white logo ─────────────────
// macOS icon convention: vibrant coloured background + white symbol.
// The SVG mask punches the inner cutouts out of the white shape so the
// gradient background shows through, giving clean negative-space curves.
// macOS applies the squircle clip automatically in the Dock / Finder.
const LOGO_SIZE = 680;                     // ~66% of canvas — comfortable padding
const OFFSET    = (1024 - LOGO_SIZE) / 2; // 172 px each side
const SCALE     = LOGO_SIZE / 512;        // 1.328125

// Corner radius that matches macOS squircle (~22.5% of canvas size).
const SQUIRCLE_R = 230;

function buildSvg({ squircle }) {
  const clip = squircle
    ? `<clipPath id="sq"><rect width="1024" height="1024" rx="${SQUIRCLE_R}" ry="${SQUIRCLE_R}"/></clipPath>`
    : '';
  const clipAttr = squircle ? ' clip-path="url(#sq)"' : '';
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${clip}
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#23d35c"/>
      <stop offset="100%" stop-color="#0d8a3a"/>
    </linearGradient>
    <mask id="logo" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
      <rect width="512" height="512" fill="black"/>
      <path d="M256 34L85 240L85 478H256V358C256 358 384 358 416 304C448 250 416 196 352 196C352 196 416 178 416 106C416 52 352 34 256 34Z" fill="white"/>
      <path d="M256 84C320 84 352 106 352 142C352 178 320 196 256 196V84Z"   fill="black"/>
      <path d="M256 232C336 232 368 268 368 304C368 340 336 358 256 358V232Z" fill="black"/>
    </mask>
  </defs>
  <g${clipAttr}>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <g transform="translate(${OFFSET}, ${OFFSET}) scale(${SCALE})">
      <rect width="512" height="512" fill="white" mask="url(#logo)"/>
    </g>
  </g>
</svg>`;
}

// ── Icon sizes required for ICNS ───────────────────────────────────────────
const ICNS_SIZES = [16, 32, 64, 128, 256, 512, 1024];

async function main() {
  const iconsetDir = path.join(ROOT, 'assets', 'icon.iconset');
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir, { recursive: true });

  console.log('Generating PNG sizes...');
  for (const size of ICNS_SIZES) {
    const fileName = sizeToFilename(size);
    const outPath = path.join(iconsetDir, fileName);
    await sharp(Buffer.from(buildSvg({ squircle: false }))).resize(size, size).png().toFile(outPath);
    console.log(`  ${fileName}`);
  }

  console.log('Building icon.icns...');
  const icnsOut = path.join(ROOT, 'assets', 'icon.icns');
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsOut}"`);

  // icon.png / icon@2x.png — used by app.dock.setIcon() in dev mode.
  // Electron's nativeImage.createFromPath() auto-picks @2x on Retina.
  // Both have squircle pre-baked because app.dock.setIcon() does NOT
  // apply the macOS squircle clip automatically (unlike packaged .app icons).
  console.log('Building icon.png (256px 1x) and icon@2x.png (512px 2x) for dev dock...');
  const svgSquircle = Buffer.from(buildSvg({ squircle: true }));
  await sharp(svgSquircle).resize(256, 256).png().toFile(path.join(ROOT, 'assets', 'icon.png'));
  await sharp(svgSquircle).resize(512, 512).png().toFile(path.join(ROOT, 'assets', 'icon@2x.png'));

  fs.rmSync(iconsetDir, { recursive: true });
  console.log('Done → assets/icon.icns  assets/icon.png');
}

// Maps a pixel size to the ICNS iconset filename convention.
function sizeToFilename(px) {
  switch (px) {
    case 16:   return 'icon_16x16.png';
    case 32:   return 'icon_16x16@2x.png';   // also written as icon_32x32.png
    case 64:   return 'icon_32x32@2x.png';
    case 128:  return 'icon_128x128.png';
    case 256:  return 'icon_128x128@2x.png';
    case 512:  return 'icon_256x256@2x.png';
    case 1024: return 'icon_512x512@2x.png';
    default:   return `icon_${px}x${px}.png`;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
