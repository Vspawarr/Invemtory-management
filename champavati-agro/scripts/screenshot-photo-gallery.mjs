import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("BROWSER ERROR:", msg.text());
});

await page.goto(`${BASE}/login`);
await page.fill("#identifier", "admin@champavatiagro.in");
await page.fill("#password", "Champavati@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

await page.goto(`${BASE}/admin/farmers`);
await page.waitForSelector("text=Ramesh Patil", { timeout: 15000 });
await page.click("text=Ramesh Patil");
await page.waitForURL(/\/admin\/farmers\//, { timeout: 15000 });
await page.click('a[href^="/admin/crops/"]:not([href*="new"])');
await page.waitForURL(/\/admin\/crops\//, { timeout: 15000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/crop-360-with-gallery.png", fullPage: true });
console.log("crop 360 gallery screenshot OK");

// Open the lightbox
await page.locator('button:has(img[src^="/api/photos/"])').first().click();
await page.waitForSelector('img[alt*="treatment photo"], .max-h-\\[60vh\\]', { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(2000);
const lightboxImg = page.locator("dialog img, [role=dialog] img").last();
const naturalWidth = await lightboxImg.evaluate((img) => img.naturalWidth).catch(() => -1);
console.log("Lightbox image naturalWidth (0/-1 = broken or not found):", naturalWidth);
await page.screenshot({ path: "/tmp/photo-lightbox.png" });
console.log("lightbox screenshot OK");

await browser.close();
