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

  const phone = "9" + Math.floor(100000000 + Math.random() * 899999999);
  await page.goto(`${BASE}/admin/farmers/new`);
  await page.fill("#fullName", "QA Verify Farmer");
  await page.fill("#phone", phone);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.fill('input[name="land.0.name"]', "Gat 200");
  await page.fill('input[name="land.0.areaAcres"]', "3");
  await page.fill('input[name="land.0.village"]', "Chapaner");
  await page.click('button:has-text("Save farmer")');
  await page.waitForFunction(
    () => !location.pathname.endsWith("/new") && location.pathname.includes("/admin/farmers/"),
    { timeout: 15000 }
  );
  const farmerId = page.url().split("/").pop();

  await page.goto(`${BASE}/admin/crops/new?farmerId=${farmerId}`);
  await page.waitForTimeout(500);
  await page.locator("button:has-text('Select land')").click();
  await page.locator("[role=option]:has-text('Gat 200')").click();
  await page.locator("button:has-text('Select crop')").click();
  await page.locator("[role=option]:has-text('Cotton')").click();
  await page.fill('input[type="number"]', "3");
  await page.fill('input[type="date"]', "2026-06-18");
  await page.click('button:has-text("Generate Timeline")');
  await page.waitForSelector("text=Generated crop timeline", { timeout: 10000 });
  await page.click('button:has-text("Confirm & create crop")');
  await page.waitForFunction(
    () => !location.pathname.endsWith("/new") && location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/),
    { timeout: 10000 }
  );

  // Generous wait for count-up animations and stagger entrance to fully settle.
  await page.waitForTimeout(2500);

  const bodyText = await page.textContent("body");
  const ageMatch = bodyText.match(/(\d+)\s*days/);
  console.log("CROP AGE SHOWN:", ageMatch ? ageMatch[0] : "NOT FOUND");
  console.log("Contains 'Delayed':", bodyText.includes("Delayed"));
  console.log("Contains 'Needs review':", bodyText.includes("Needs review"));
  console.log("Contains '4 Jan 2027':", bodyText.includes("4 Jan 2027"));

  await page.screenshot({ path: "/tmp/crop-360-verified.png", fullPage: true });
  console.log("DONE — screenshot saved");
} catch (err) {
  console.error("FAILED:", err.message);
  await page.screenshot({ path: "/tmp/smoke-failure.png", fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
