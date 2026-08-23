import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/login`);
await page.fill("#identifier", "admin@champavatiagro.test");
await page.fill("#password", "Champavati@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
await page.waitForTimeout(2000);

const bodyText = await page.textContent("body");
console.log("Has hero heading:", bodyText.includes("Farmer & Crop Intelligence"));
console.log("Has Quick actions:", bodyText.includes("Add Farmer"));

await page.screenshot({ path: "/tmp/dashboard.png", fullPage: true });
console.log("Screenshot saved");

await browser.close();
