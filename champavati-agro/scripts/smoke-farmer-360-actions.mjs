import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("BROWSER ERROR:", msg.text());
});

await page.goto(`${BASE}/login`);
await page.fill("#identifier", "admin@champavatiagro.in");
await page.fill("#password", "Champavati@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

await page.goto(`${BASE}/admin/farmers`);
await page.waitForSelector("text=Sunil Jadhav", { timeout: 15000 });
await page.click("text=Sunil Jadhav");
await page.waitForURL(/\/admin\/farmers\//, { timeout: 15000 });
await page.waitForTimeout(1000);

// --- Add Land ---
await page.click('button:has-text("Add land")');
await page.waitForSelector("#land-name", { timeout: 5000 });
await page.fill("#land-name", "Gat 999 Smoke Test");
await page.fill("#land-areaAcres", "2.25");
await page.fill("#land-village", "SmokeVillage");
await page.fill("#land-waterSource", "Tanker");
await page.click('button:has-text("Add parcel")');
await page.waitForTimeout(1200);
const landAdded = await page.locator("text=Gat 999 Smoke Test").count();
console.log("Add Land result:", landAdded > 0 ? "OK - parcel visible" : "FAIL - parcel not found");

// --- Edit Profile ---
await page.click('button:has-text("Edit profile")');
await page.waitForSelector("#ef-email", { timeout: 5000 });
await page.fill("#ef-email", "sunil.smoketest@example.com");
await page.fill("#ef-notes", "Smoke-test note: prefers morning visits.");
await page.click('button:has-text("Save changes")');
await page.waitForTimeout(1200);
const emailShown = await page.locator("text=sunil.smoketest@example.com").count();
const notesShown = await page.locator("text=Smoke-test note").count();
console.log("Edit Profile result:", emailShown > 0 && notesShown > 0 ? "OK - email & notes visible" : "FAIL - not reflected");

await page.screenshot({ path: "/tmp/farmer-360-after-actions.png", fullPage: true });

// --- Quick action picker navigation (Record health -> Crop 360) ---
await page.reload();
await page.waitForTimeout(800);
const recordHealthBtn = page.locator('button:has-text("Record health")');
if (await recordHealthBtn.count() > 0) {
  await recordHealthBtn.click();
  await page.waitForTimeout(500);
  const items = await page.locator('button:has-text("Cotton"), button:has-text("Maize")').count();
  console.log("Record-health picker items found:", items);
  if (items > 0) {
    await page.locator("ul li button").first().click();
    await page.waitForURL(/\/admin\/crops\//, { timeout: 10000 });
    console.log("Picker navigation result: OK - landed on", page.url());
  }
}

await browser.close();
