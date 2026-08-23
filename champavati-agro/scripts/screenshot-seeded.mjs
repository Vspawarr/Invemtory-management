import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/login`);
await page.fill("#identifier", "admin@champavatiagro.in");
await page.fill("#password", "Champavati@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/seeded-dashboard.png", fullPage: true });
console.log("dashboard OK");

await page.goto(`${BASE}/admin/farmers`);
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/seeded-farmers.png", fullPage: true });
console.log("farmers list OK");

await page.goto(`${BASE}/admin/followups`);
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/seeded-followups.png", fullPage: true });
console.log("followups OK");

// Baban Bhosale's delayed maize crop
await page.goto(`${BASE}/admin/farmers`);
await page.fill('input[name="q"]', "Baban");
await page.press('input[name="q"]', "Enter");
await page.waitForTimeout(500);
await page.click("text=Baban Bhosale");
await page.waitForTimeout(500);
await page.click("text=Maize");
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/seeded-delayed-crop.png", fullPage: true });
console.log("delayed crop 360 OK");

await browser.close();
