/**
 * Generates offline SVG placeholder images for seed/demo vehicles.
 * These are static assets under public/demo-images — not user uploads —
 * so the SVG-upload ban in lib/storage/validate.ts does not apply here.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "public", "demo-images");

const PALETTE: Record<string, string> = {
  CAR: "#1e3a5f",
  BIKE: "#b8462f",
  SCOOTER: "#2f7a4f",
  BUS: "#7a4f2f",
  COMMERCIAL: "#4a4a4a",
  OTHER: "#5a5a8f",
};

function svgFor(label: string, category: string, seed: number): string {
  const color = PALETTE[category] ?? "#1e3a5f";
  const stripes = Array.from({ length: 4 }).map((_, i) => {
    const x = (seed * 37 + i * 90) % 720;
    return `<rect x="${x}" y="0" width="30" height="480" fill="white" opacity="0.03" />`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
  <defs>
    <linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}" />
      <stop offset="1" stop-color="#0f1f33" />
    </linearGradient>
  </defs>
  <rect width="800" height="480" fill="url(#g${seed})" />
  ${stripes.join("\n  ")}
  <text x="50%" y="46%" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="white">${escapeXml(label)}</text>
  <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.75)">DEMO IMAGE — Ashtavinayak Auto Consultant</text>
</svg>`;
}

function escapeXml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
      ["placeholder-car.svg", "Used Car", "CAR"],
      ["placeholder-bike.svg", "Used Bike", "BIKE"],
      ["placeholder-scooter.svg", "Used Scooter", "SCOOTER"],
      ["placeholder-bus.svg", "Used Bus", "BUS"],
      ["placeholder-commercial.svg", "Commercial Vehicle", "COMMERCIAL"],
    ] as const;
    for (const [file, label, cat] of samples) {
      await generateDemoImage(file, label, cat, file.length);
    }
    console.log(`Generated ${samples.length} placeholder images in ${OUT_DIR}`);
  })();
}
