import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage();

try {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", "admin@champavatiagro.test");
  await page.fill("#password", "Champavati@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });

  // Create a farmer first
  const phone = "9" + Math.floor(100000000 + Math.random() * 899999999);
  await page.goto(`${BASE}/admin/farmers/new`);
  await page.fill("#fullName", "Cotton Test Farmer");
  await page.fill("#phone", phone);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.fill('input[name="land.0.name"]', "Gat 55");
  await page.fill('input[name="land.0.areaAcres"]', "3");
  await page.fill('input[name="land.0.village"]', "Chapaner");
  await page.click('button:has-text("Save farmer")');
  await page.waitForFunction(
    () => !location.pathname.endsWith("/new") && location.pathname.includes("/admin/farmers/"),
    { timeout: 15000 }
  );
  const farmerId = page.url().split("/").pop();
  console.log("FARMER CREATED", farmerId);

  // Now create a crop
  await page.goto(`${BASE}/admin/crops/new?farmerId=${farmerId}`);
  await page.waitForTimeout(500);

  // Select farmer (should be preselected) - verify, then select land
  await page.locator("button:has-text('Select land')").click();
  await page.locator("[role=option]:has-text('Gat 55')").click();

  await page.locator("button:has-text('Select crop')").click();
  await page.locator("[role=option]:has-text('Cotton')").click();

  await page.fill('input[type="number"]', "3");
  await page.fill('input[type="date"]', "2026-06-18");

  await page.click('button:has-text("Generate Timeline")');
  await page.waitForSelector("text=Generated crop timeline", { timeout: 10000 });
  const previewText = await page.textContent("body");
  if (!previewText.includes("Land Preparation")) throw new Error("Land Preparation stage missing from preview");
  console.log("TIMELINE PREVIEW OK");

  await page.click('button:has-text("Confirm & create crop")');
  await page.waitForFunction(
    () => !location.pathname.endsWith("/new") && location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/),
    { timeout: 10000 }
  );
  console.log("CROP CREATED", page.url());

  const cropPageText = await page.textContent("body");
  if (!cropPageText.includes("Cotton")) throw new Error("Cotton not shown on Crop 360");
  if (!cropPageText.includes("Land Preparation")) throw new Error("Timeline stages missing on Crop 360");
  if (!cropPageText.includes("Sowing")) throw new Error("Sowing stage missing on Crop 360");
  console.log("CROP 360 PAGE OK");

  await page.screenshot({ path: "/tmp/crop-360.png", fullPage: true });
  console.log("SMOKE TEST PASSED");
} catch (err) {
  console.error("SMOKE TEST FAILED:", err.message);
  await page.screenshot({ path: "/tmp/smoke-failure.png", fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
