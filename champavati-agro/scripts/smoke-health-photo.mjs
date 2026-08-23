import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("BROWSER ERROR:", msg.text());
});

async function generateRealJpeg(page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 30;
    canvas.height = 30;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#b23b3b";
    ctx.fillRect(0, 0, 30, 30);
    return canvas.toDataURL("image/jpeg", 0.9);
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

await page.goto(`${BASE}/login`);
await page.fill("#identifier", "admin@champavatiagro.in");
await page.fill("#password", "Champavati@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

await page.goto(`${BASE}/admin/farmers`);
await page.waitForSelector("text=Sunil Jadhav", { timeout: 15000 });
await page.click("text=Sunil Jadhav");
await page.waitForURL(/\/admin\/farmers\//, { timeout: 15000 });
await page.click('a[href^="/admin/crops/"]:not([href*="new"])');
await page.waitForURL(/\/admin\/crops\//, { timeout: 15000 });
await page.waitForTimeout(1000);

await page.click('button:has-text("Record")');
await page.waitForSelector("#health-notes", { timeout: 5000 });
await page.fill("#health-notes", "Smoke test health record with photo");

const buffer = await generateRealJpeg(page);
const fileInputs = page.locator('input[type="file"]');
await fileInputs.nth(1).setInputFiles({ name: "health.jpg", mimeType: "image/jpeg", buffer });
await page.waitForTimeout(1200);

await page.click('button:has-text("Save")');
await page.waitForTimeout(2000);

const photoCountText = await page.locator("text=/\\d+ photos?$/").first().textContent().catch(() => null);
console.log("Health record photo badge:", photoCountText);

await page.screenshot({ path: "/tmp/health-record-photo.png", fullPage: true });
console.log("DONE");

await browser.close();
