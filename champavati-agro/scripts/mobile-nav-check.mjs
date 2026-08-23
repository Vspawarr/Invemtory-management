import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3000/login");
await page.fill("#identifier", "9876500001");
await page.fill("#password", "Farmer@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/farmer\/dashboard/, { timeout: 15000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/farmer-mobile-nav.png" });
console.log("dashboard nav OK");

await page.goto("http://localhost:3000/farmer/profile");
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/farmer-mobile-myfarm.png" });
console.log("my farm mobile OK");

await browser.close();
