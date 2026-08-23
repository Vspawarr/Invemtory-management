import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage();

await page.goto(`${BASE}/login`);
await page.fill("#identifier", process.argv[2]);
await page.fill("#password", "FarmerPass123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/farmer\/dashboard/, { timeout: 10000 });

await page.goto(`${BASE}/farmer/crops/${process.argv[3]}`);
await page.waitForSelector("h2, h1", { timeout: 10000 });
await page.waitForTimeout(500);
const text = await page.locator("main").textContent();
console.log("MAIN TEXT:", text);
await page.screenshot({ path: "/tmp/error-page-check.png" });

await browser.close();
