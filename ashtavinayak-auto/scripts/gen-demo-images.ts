/**
 * Generates offline SVG placeholder images for seed/demo vehicles: simple
 * flat-illustration silhouettes (not photos — this sandbox has no network
 * access to stock-photo sources) styled per vehicle type, colored per
 * vehicle, with a cockpit/handlebar "interior" variant for the third photo
 * slot. These are static assets under public/demo-images — not user
 * uploads — so the SVG-upload ban in lib/storage/validate.ts does not
 * apply here. The vehicle-card UI shows an honest "Demo" badge alongside
 * these, so there is no attempt to pass them off as real photographs.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "public", "demo-images");

const DEFAULT_COLOR: Record<string, string> = {
  CAR: "#3a5f8a",
  BIKE: "#b8462f",
  SCOOTER: "#2f7a4f",
  BUS: "#c9762b",
  COMMERCIAL: "#5a6570",
  OTHER: "#5a5a8f",
};

// A curated set of realistic vehicle body colors, picked deterministically
// per vehicle (by its title) so the same vehicle keeps one color across its
// photos, and different vehicles look varied rather than uniform.
const BODY_COLORS = [
  "#e6e8ea", // pearl white
  "#1c1f24", // phantom black
  "#8a9096", // silver metallic
  "#8c1a1a", // racing red
  "#1e3a5f", // ocean blue
  "#6b6f73", // matte grey
  "#c9a24b", // champagne gold
  "#274b32", // forest green
  "#5a1f2b", // maroon
  "#d9541f", // sunset orange
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function shade(hex: string, percent: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 0xff) + Math.round(255 * (percent / 100)));
  const g = clamp(((n >> 8) & 0xff) + Math.round(255 * (percent / 100)));
  const b = clamp((n & 0xff) + Math.round(255 * (percent / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const GROUND_Y = 385;
const GLASS = "#bfe0ee";

function scene(inner: string): string {
  return `<rect width="800" height="480" fill="url(#sky)" />
  <rect x="0" y="${GROUND_Y}" width="800" height="${480 - GROUND_Y}" fill="#dde2e6" />
  <rect x="0" y="${GROUND_Y}" width="800" height="4" fill="#c7ced3" />
  ${inner}`;
}

function wheel(cx: number, cy: number, r: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1b1b1b" />
  <circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="#c9ccd0" />
  <circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="none" stroke="#8b8f93" stroke-width="2" />`;
}

function shadowUnder(cx: number, rx: number): string {
  return `<ellipse cx="${cx}" cy="${GROUND_Y + 16}" rx="${rx}" ry="13" fill="#000" opacity="0.14" />`;
}

function carGroup(color: string): string {
  const dark = shade(color, -22);
  return `${shadowUnder(400, 260)}
  <rect x="170" y="300" width="460" height="90" rx="18" fill="${color}" stroke="rgba(0,0,0,0.28)" stroke-width="3" />
  <path d="M 260,300 L 300,205 Q 320,193 340,193 L 480,193 Q 500,193 520,205 L 570,300 Z" fill="${color}" />
  <path d="M 288,296 L 316,216 L 500,216 L 546,296 Z" fill="${GLASS}" />
  <line x1="402" y1="216" x2="402" y2="296" stroke="${dark}" stroke-width="6" />
  <rect x="170" y="300" width="460" height="14" fill="${dark}" />
  <rect x="420" y="332" width="26" height="6" rx="3" fill="${dark}" />
  <ellipse cx="580" cy="322" rx="13" ry="9" fill="#fff3b0" />
  <ellipse cx="183" cy="322" rx="10" ry="8" fill="#c73a3a" />
  ${wheel(260, GROUND_Y, 48)}
  ${wheel(560, GROUND_Y, 48)}`;
}

function bikeGroup(color: string): string {
  const dark = shade(color, -30);
  const outline = "rgba(0,0,0,0.28)";
  return `${shadowUnder(400, 220)}
  <path d="M 246,378 L 300,300 Q 315,282 335,278 L 380,270 Q 400,238 440,232 L 480,232 Q 508,234 520,255 L 528,270 L 556,290 L 552,378 Z"
    fill="${color}" stroke="${outline}" stroke-width="3" stroke-linejoin="round" />
  <rect x="392" y="248" width="118" height="26" rx="12" fill="#232323" />
  <rect x="262" y="352" width="95" height="15" rx="7" fill="#8b8f93" stroke="${dark}" stroke-width="1.5" />
  <path d="M 524,258 L 500,222" stroke="${dark}" stroke-width="8" stroke-linecap="round" />
  <path d="M 500,222 L 470,214" stroke="${dark}" stroke-width="8" stroke-linecap="round" />
  <circle cx="465" cy="213" r="6" fill="${dark}" />
  <circle cx="528" cy="265" r="13" fill="#fff3b0" stroke="${dark}" stroke-width="1.5" />
  ${wheel(246, GROUND_Y, 55)}
  ${wheel(552, GROUND_Y, 55)}`;
}

function scooterGroup(color: string): string {
  const dark = shade(color, -25);
  const outline = "rgba(0,0,0,0.28)";
  return `${shadowUnder(400, 210)}
  <path d="M 234,385 L 234,278 Q 234,232 278,232 Q 306,232 306,264 L 306,330 Q 306,346 322,346 L 460,346 Q 468,346 470,330 L 474,296 Q 478,270 508,266 L 560,262 L 560,346 L 322,346"
    fill="${color}" stroke="${outline}" stroke-width="3" stroke-linejoin="round" />
  <rect x="478" y="252" width="96" height="26" rx="12" fill="#232323" />
  <circle cx="268" cy="252" r="12" fill="#fff3b0" stroke="${dark}" stroke-width="1.5" />
  <path d="M 300,232 L 330,214" stroke="${dark}" stroke-width="7" stroke-linecap="round" />
  <circle cx="335" cy="211" r="6" fill="${dark}" />
  ${wheel(258, GROUND_Y, 42)}
  ${wheel(556, GROUND_Y, 42)}`;
}

function busGroup(color: string): string {
  const dark = shade(color, -25);
  const windows = Array.from({ length: 6 })
    .map((_, i) => `<rect x="${128 + i * 79}" y="172" width="58" height="58" rx="8" fill="${GLASS}" />`)
    .join("\n  ");
  return `${shadowUnder(430, 320)}
  <rect x="90" y="138" width="650" height="172" rx="22" fill="${color}" stroke="rgba(0,0,0,0.28)" stroke-width="3" />
  <rect x="90" y="138" width="650" height="12" rx="6" fill="${shade(color, 18)}" />
  ${windows}
  <rect x="648" y="172" width="66" height="88" rx="10" fill="${GLASS}" />
  <rect x="168" y="232" width="46" height="78" rx="5" fill="${dark}" />
  <rect x="90" y="296" width="650" height="18" fill="${dark}" />
  ${wheel(240, GROUND_Y, 52)}
  ${wheel(620, GROUND_Y, 52)}`;
}

function commercialGroup(color: string): string {
  const dark = shade(color, -25);
  return `${shadowUnder(410, 300)}
  <rect x="150" y="336" width="500" height="18" fill="${dark}" />
  <rect x="150" y="286" width="330" height="58" rx="6" fill="none" stroke="${dark}" stroke-width="10" />
  <rect x="150" y="330" width="330" height="16" fill="${color}" />
  <rect x="510" y="246" width="150" height="110" rx="14" fill="${color}" stroke="rgba(0,0,0,0.28)" stroke-width="3" />
  <path d="M 530,246 L 545,196 L 640,196 L 655,246 Z" fill="${color}" />
  <rect x="548" y="202" width="88" height="52" rx="8" fill="${GLASS}" />
  <rect x="510" y="246" width="150" height="12" fill="${shade(color, 16)}" />
  <ellipse cx="655" cy="300" rx="12" ry="9" fill="#fff3b0" />
  ${wheel(230, GROUND_Y, 48)}
  ${wheel(600, GROUND_Y, 48)}`;
}

function otherGroup(color: string): string {
  const dark = shade(color, -25);
  return `${shadowUnder(430, 260)}
  <path d="M 250,385 L 270,290 Q 272,250 305,250 L 555,250 Q 600,250 600,285 L 600,340 L 260,340 Z" fill="${color}" stroke="rgba(0,0,0,0.28)" stroke-width="3" />
  <path d="M 270,250 Q 430,205 560,250" fill="none" stroke="${dark}" stroke-width="10" stroke-linecap="round" />
  <rect x="330" y="270" width="230" height="55" rx="8" fill="${GLASS}" opacity="0.55" />
  <circle cx="255" cy="278" r="10" fill="#fff3b0" />
  ${wheel(250, GROUND_Y, 38)}
  ${wheel(555, GROUND_Y, 40)}
  ${wheel(605, GROUND_Y, 40)}`;
}

const EXTERIOR_BUILDERS: Record<string, (color: string) => string> = {
  CAR: carGroup,
  BIKE: bikeGroup,
  SCOOTER: scooterGroup,
  BUS: busGroup,
  COMMERCIAL: commercialGroup,
  OTHER: otherGroup,
};

function cockpitGroup(color: string): string {
  return `<rect x="60" y="260" width="680" height="170" rx="16" fill="#2a2c30" />
  <rect x="60" y="260" width="680" height="26" rx="13" fill="#3a3d42" />
  <circle cx="270" cy="330" r="80" fill="#1c1d20" />
  <circle cx="270" cy="330" r="80" fill="none" stroke="#3a3d42" stroke-width="10" />
  <circle cx="270" cy="330" r="24" fill="#3a3d42" />
  <line x1="270" y1="270" x2="270" y2="306" stroke="#3a3d42" stroke-width="8" />
  <line x1="216" y1="360" x2="248" y2="342" stroke="#3a3d42" stroke-width="8" />
  <line x1="324" y1="360" x2="292" y2="342" stroke="#3a3d42" stroke-width="8" />
  <rect x="400" y="300" width="230" height="70" rx="10" fill="#1c1d20" />
  <circle cx="450" cy="335" r="26" fill="${color}" opacity="0.85" />
  <circle cx="530" cy="335" r="26" fill="${color}" opacity="0.55" />
  <rect x="60" y="150" width="680" height="110" rx="14" fill="${GLASS}" opacity="0.5" />`;
}

function handlebarGroup(color: string): string {
  return `<rect x="0" y="150" width="800" height="330" fill="#20232a" />
  <path d="M 220,300 L 400,270 L 580,300" fill="none" stroke="#3a3d42" stroke-width="16" stroke-linecap="round" />
  <circle cx="220" cy="300" r="22" fill="#111" />
  <circle cx="580" cy="300" r="22" fill="#111" />
  <rect x="330" y="220" width="140" height="90" rx="12" fill="#111417" />
  <circle cx="400" cy="265" r="40" fill="#1c1f24" />
  <circle cx="400" cy="265" r="40" fill="none" stroke="${color}" stroke-width="4" />
  <circle cx="400" cy="265" r="4" fill="${color}" />
  <rect x="370" y="150" width="60" height="40" rx="8" fill="#3a3d42" />`;
}

const INTERIOR_BUILDERS: Record<string, (color: string) => string> = {
  CAR: cockpitGroup,
  BUS: cockpitGroup,
  COMMERCIAL: cockpitGroup,
  OTHER: cockpitGroup,
  BIKE: handlebarGroup,
  SCOOTER: handlebarGroup,
};

function pickColor(seedText: string, category: string): string {
  const idx = hashString(seedText) % BODY_COLORS.length;
  return BODY_COLORS[idx] ?? DEFAULT_COLOR[category] ?? "#3a5f8a";
}

function escapeXml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svgFor(label: string, category: string, seed: number): string {
  const isInterior = /interior/i.test(label);
  const titlePart = label.split(" — ")[0] ?? label;
  const color = pickColor(titlePart, category);
  const skyTop = isInterior ? "#4a5568" : "#cfe8f5";
  const skyBottom = isInterior ? "#20232a" : "#eef6fa";

  const group = isInterior
    ? (INTERIOR_BUILDERS[category] ?? cockpitGroup)(color)
    : (EXTERIOR_BUILDERS[category] ?? carGroup)(color);

  const body = isInterior ? group : scene(group);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skyTop}" />
      <stop offset="1" stop-color="${skyBottom}" />
    </linearGradient>
  </defs>
  ${body}
  <rect x="0" y="430" width="800" height="50" fill="rgba(10,15,20,0.55)" />
  <text x="24" y="462" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="white">${escapeXml(titlePart)}</text>
  <text x="776" y="462" text-anchor="end" font-family="Arial, sans-serif" font-size="15" fill="rgba(255,255,255,0.7)">Ashtavinayak Auto Consultant</text>
</svg>`;
}

export async function generateDemoImage(
  filename: string,
  label: string,
  category: string,
  seed: number
): Promise<string> {
  await mkdir(OUT_DIR, { recursive: true });
  const filePath = path.join(OUT_DIR, filename);
  await writeFile(filePath, svgFor(label, category, seed));
  return `/demo-images/${filename}`;
}

// Allow running standalone: `npm run gen:demo-images`
if (require.main === module) {
  void (async () => {
    const samples = [
      ["placeholder-car.svg", "Used Car — Front", "CAR"],
      ["placeholder-car-interior.svg", "Used Car — Interior", "CAR"],
      ["placeholder-bike.svg", "Used Bike — Front", "BIKE"],
      ["placeholder-scooter.svg", "Used Scooter — Front", "SCOOTER"],
      ["placeholder-bus.svg", "Used Bus — Front", "BUS"],
      ["placeholder-commercial.svg", "Commercial Vehicle — Front", "COMMERCIAL"],
      ["placeholder-other.svg", "Auto Rickshaw — Front", "OTHER"],
    ] as const;
    for (const [file, label, cat] of samples) {
      await generateDemoImage(file, label, cat, file.length);
    }
    console.log(`Generated ${samples.length} placeholder images in ${OUT_DIR}`);
  })();
}
