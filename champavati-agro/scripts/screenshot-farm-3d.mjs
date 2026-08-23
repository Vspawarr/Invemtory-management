import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));

await page.goto(`${BASE}/login`);
await page.fill("#identifier", "admin@champavatiagro.in");
await page.fill("#password", "Champavati@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

await page.goto(`${BASE}/admin/farm-3d?farmerId=cmt5l4vi4002e7dh35e5n06oh`); // Ramesh Patil: Cotton + Maize
await page.waitForTimeout(2500);

const canvas = page.locator("canvas").first();
const box = await canvas.boundingBox();

// A. Entire farm view (far / default fit)
await page.screenshot({ path: "/tmp/p-A-far.png", fullPage: true });

// B. Medium zoom
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.wheel(0, -200);
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/p-B-medium.png", fullPage: true });

// C. Close zoom
await page.mouse.wheel(0, -300);
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/p-C-close.png", fullPage: true });

// D. Very close zoom (extreme test — same test that caused the giant-label bug before)
for (let i = 0; i < 10; i++) {
  await page.mouse.wheel(0, -150);
  await page.waitForTimeout(60);
}
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/p-D-veryclose.png", fullPage: true });
await canvas.screenshot({ path: "/tmp/p-D-veryclose-canvas.png" });

// Reset before selection tests
const resetBtn = page.locator("button:has-text('Reset')");
await resetBtn.first().click();
await page.waitForTimeout(1000);

// G. Rotate
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/p-G-rotate.png", fullPage: true });

// I. Fit Farm
await page.locator("button:has-text('Fit Farm')").first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/p-I-fitfarm.png", fullPage: true });

// H. Top View
await page.locator("button:has-text('Top View')").first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/p-H-topview.png", fullPage: true });

// E/F. Select Cotton (Gat 102) and Maize (Gat 145) via the accessible Fields list
const fieldButtons = page.locator("aside, div").locator("button", { hasText: "Gat" });
const cottonBtn = page.locator("button", { hasText: "Cotton" });
if ((await cottonBtn.count()) > 0) {
  await cottonBtn.first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/p-E-select-cotton.png", fullPage: true });
}
const maizeBtn = page.locator("button", { hasText: "Maize" });
if ((await maizeBtn.count()) > 0) {
  await maizeBtn.first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/p-F-select-maize.png", fullPage: true });
}
void fieldButtons;

// J. Reset
await page.locator("button:has-text('Reset')").first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/p-J-reset.png", fullPage: true });

// K. Mobile portrait
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/p-K-mobile-portrait.png", fullPage: true });

// L. Mobile landscape
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/p-L-mobile-landscape.png", fullPage: true });

console.log("CONSOLE ERRORS:", errors.length === 0 ? "none" : JSON.stringify(errors, null, 2));
await browser.close();
console.log("DONE");
