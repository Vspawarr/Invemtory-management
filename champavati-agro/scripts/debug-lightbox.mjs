import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });

page.on("response", (res) => {
  if (res.url().includes("/api/photos/")) {
    console.log("RESPONSE", res.status(), res.url());
  }
});
page.on("requestfailed", (req) => {
  if (req.url().includes("/api/photos/")) {
    console.log("REQUEST FAILED", req.url(), req.failure()?.errorText);
  }
});
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
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
await page.waitForTimeout(1500);

console.log("--- opening lightbox ---");
await page.locator('button:has(img[src^="/api/photos/"])').first().click();
await page.waitForTimeout(2000);

const allImgs = await page.evaluate(() =>
  Array.from(document.querySelectorAll("img")).map((img) => ({
    src: img.src,
    naturalWidth: img.naturalWidth,
    complete: img.complete,
  }))
);
console.log("ALL IMAGES:", JSON.stringify(allImgs, null, 2));

await browser.close();
