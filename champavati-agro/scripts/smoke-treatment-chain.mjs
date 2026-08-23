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

  // Add a product first
  await page.goto(`${BASE}/admin/products`);
  await page.click('button:has-text("Add Product")');
  await page.fill('input[name="name"]', "Test Neem Oil");
  await page.locator("button:has-text('Select category')").click();
  await page.locator("[role=option]:has-text('Pesticides')").click();
  await page.fill('input[name="unit"]', "litre");
  await page.fill('input[name="packSize"]', "1 litre");
  await page.fill('input[name="mrp"]', "450");
  await page.fill('input[name="sellingPrice"]', "420");
  await page.click('button:has-text("Save product")');
  await page.waitForTimeout(800);
  console.log("PRODUCT CREATED");

  // Farmer + crop
  const phone = "9" + Math.floor(100000000 + Math.random() * 899999999);
  await page.goto(`${BASE}/admin/farmers/new`);
  await page.fill("#fullName", "Treatment Chain Farmer");
  await page.fill("#phone", phone);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.fill('input[name="land.0.name"]', "Gat 300");
  await page.fill('input[name="land.0.areaAcres"]', "2");
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
  await page.locator("[role=option]:has-text('Gat 300')").click();
  await page.locator("button:has-text('Select crop')").click();
  await page.locator("[role=option]:has-text('Cotton')").click();
  await page.fill('input[type="number"]', "2");
  await page.fill('input[type="date"]', "2026-06-18");
  await page.click('button:has-text("Generate Timeline")');
  await page.waitForSelector("text=Generated crop timeline", { timeout: 10000 });
  await page.click('button:has-text("Confirm & create crop")');
  await page.waitForFunction(
    () => !location.pathname.endsWith("/new") && location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/),
    { timeout: 10000 }
  );
  const cropId = page.url().split("/").pop();
  console.log("CROP CREATED", cropId);

  // Health record
  await page.click('button:has-text("Record")');
  await page.waitForSelector("text=Record crop health");
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(800);
  const healthText = await page.textContent("body");
  if (!healthText.includes("Health 3/5")) throw new Error("Health record not shown after save");
  console.log("HEALTH RECORD OK");

  // Recommendation
  await page.click('a:has-text("Recommend product")');
  await page.waitForSelector("text=Recommend a product");
  await page.locator("button:has-text('Select product')").click();
  await page.locator("[role=option]:has-text('Test Neem Oil')").first().click();
  await page.fill('input[name="targetPestOrDisease"]', "Aphid");
  await page.fill('input[name="dosage"]', "2 ml/litre");
  await page.click('button:has-text("Save recommendation")');
  await page.waitForFunction(() => location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/), { timeout: 10000 });
  await page.waitForTimeout(500);
  let journeyText = await page.textContent("body");
  if (!journeyText.includes("Test Neem Oil")) throw new Error("Recommendation not shown in journey");
  if (!journeyText.includes("RECOMMENDED")) throw new Error("Application status not shown");
  console.log("RECOMMENDATION OK");

  // Update application status to APPLIED
  await page.click('a:has-text("Update application status")');
  await page.waitForSelector("text=Update application");
  await page.locator("button", { hasText: "RECOMMENDED" }).first().click();
  await page.getByRole("option", { name: "APPLIED", exact: true }).click();
  await page.fill('input[type="date"]', "2026-07-01");
  await page.click('button:has-text("Save")');
  await page.waitForFunction(() => location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/), { timeout: 10000 });
  await page.waitForTimeout(500);
  journeyText = await page.textContent("body");
  if (!journeyText.includes("APPLIED")) throw new Error("Application status not updated to APPLIED");
  console.log("APPLICATION STATUS -> APPLIED OK");

  // Record result
  await page.click('a:has-text("Record result")');
  await page.waitForSelector("text=Record treatment result");
  await page.locator("button:has-text('Select result')").click();
  await page.locator("[role=option]:has-text('EXCELLENT')").click();
  await page.fill('input[name="improvementPercent"]', "85");
  await page.click('button:has-text("Save result")');
  await page.waitForFunction(() => location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/), { timeout: 10000 });
  await page.waitForTimeout(500);
  journeyText = await page.textContent("body");
  if (!journeyText.includes("EXCELLENT")) throw new Error("Treatment result not shown");
  if (!journeyText.includes("85%")) throw new Error("Improvement percent not shown");
  console.log("TREATMENT RESULT OK");

  // Record feedback
  await page.click('a:has-text("Record farmer feedback")');
  await page.waitForSelector("text=Record farmer feedback");
  await page.click('button:has-text("Save feedback")');
  await page.waitForFunction(() => location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/), { timeout: 10000 });
  await page.waitForTimeout(500);
  journeyText = await page.textContent("body");
  if (!journeyText.includes("4/5")) throw new Error("Feedback rating not shown");
  console.log("FEEDBACK OK");

  // Follow-ups page
  await page.goto(`${BASE}/admin/followups`);
  await page.click('button:has-text("Add follow-up")');
  await page.waitForSelector("text=Schedule a follow-up");
  await page.locator("button:has-text('Select farmer')").click();
  await page.locator("[role=option]:has-text('Treatment Chain Farmer')").click();
  await page.fill('#followup-reason', "Check regrowth after treatment");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page.fill('#followup-due-date', tomorrow);
  await page.click('button:has-text("Schedule")');
  await page.waitForTimeout(800);
  await page.click('button[role="tab"]:has-text("Upcoming")');
  await page.waitForTimeout(300);
  const followupsText = await page.textContent("body");
  if (!followupsText.includes("Check regrowth")) throw new Error("Follow-up not created");
  console.log("FOLLOW-UP CREATED OK (correctly bucketed under Upcoming, due tomorrow)");

  // Treatments and feedback list pages
  await page.goto(`${BASE}/admin/treatments`);
  const treatmentsText = await page.textContent("body");
  if (!treatmentsText.includes("Test Neem Oil")) throw new Error("Treatments list missing entry");
  console.log("TREATMENTS LIST OK");

  await page.goto(`${BASE}/admin/feedback`);
  const feedbackListText = await page.textContent("body");
  if (!feedbackListText.includes("Treatment Chain Farmer")) throw new Error("Feedback list missing entry");
  console.log("FEEDBACK LIST OK");

  console.log("FULL TREATMENT CHAIN SMOKE TEST PASSED");
} catch (err) {
  console.error("SMOKE TEST FAILED:", err.message);
  await page.screenshot({ path: "/tmp/smoke-failure.png", fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
