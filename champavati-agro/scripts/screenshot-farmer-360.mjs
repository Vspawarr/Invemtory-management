import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("BROWSER ERROR:", msg.text());
});
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

await page.goto(`${BASE}/login`);
await page.fill("#identifier", "admin@champavatiagro.in");
await page.fill("#password", "Champavati@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

await page.goto(`${BASE}/admin/farmers`);
await page.waitForSelector("text=Baban Bhosale", { timeout: 15000 });
await page.click("text=Baban Bhosale");
await page.waitForURL(/\/admin\/farmers\//, { timeout: 15000 });
await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/farmer-360-full.png", fullPage: true });
console.log("farmer 360 (Baban Bhosale) OK");

// Farmer with more history — Ramesh Patil (first seeded farmer)
await page.goto(`${BASE}/admin/farmers`);
await page.waitForSelector("text=Ramesh Patil", { timeout: 15000 });
await page.click("text=Ramesh Patil");
await page.waitForURL(/\/admin\/farmers\//, { timeout: 15000 });
await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/farmer-360-ramesh.png", fullPage: true });
console.log("farmer 360 (Ramesh Patil) OK");

// Farmer portal — Ramesh's own login, "My Farm" page
await page.goto(`${BASE}/login`);
await page.fill("#identifier", "9876500001");
await page.fill("#password", "Farmer@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/farmer\/dashboard/, { timeout: 15000 });
await page.goto(`${BASE}/farmer/profile`);
await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/farmer-my-farm.png", fullPage: true });
console.log("farmer portal My Farm OK");

await browser.close();
