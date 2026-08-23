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

  // Crop stage settings: edit Cotton's Land Preparation stage monitoring text, verify persists.
  await page.goto(`${BASE}/admin/settings/crop-stages`);
  await page.waitForSelector("text=Crop stage configuration");
  const cottonCard = page.locator("text=Cotton").first();
  await cottonCard.waitFor();
  // Click the first edit (pencil) button in the Cotton table (Land Preparation row).
  await page.locator("table").first().locator("button").first().click();
  await page.waitForSelector("text=Land Preparation");
  const monitoringField = page.locator("textarea").first();
  await monitoringField.fill("QA-updated monitoring guidance for Land Preparation.");
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(800);
  const settingsText = await page.textContent("body");
  if (!settingsText.includes("Stage updated")) {
    // toast may have already disappeared; verify by re-opening the dialog instead
  }
  await page.reload();
  await page.waitForSelector("text=Crop stage configuration");
  await page.locator("table").first().locator("button").first().click();
  await page.waitForSelector("text=Land Preparation");
  const savedValue = await page.locator("textarea").first().inputValue();
  if (!savedValue.includes("QA-updated monitoring guidance")) {
    throw new Error("Stage edit did not persist: " + savedValue);
  }
  console.log("CROP STAGE SETTINGS EDIT OK");

  // Test validation rejection: try to make Land Preparation overlap Sowing (end offset way too high).
  await page.locator('input[id^="default-end-"]').fill("50");
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(500);
  const errorText = await page.textContent("body");
  if (!errorText.includes("inconsistent")) throw new Error("Expected validation rejection for overlapping stage edit");
  console.log("CROP STAGE VALIDATION REJECTION OK");

  await page.keyboard.press("Escape");

  // Weather: create a crop, record a weather observation, verify advisory text shows.
  const phone = "9" + Math.floor(100000000 + Math.random() * 899999999);
  await page.goto(`${BASE}/admin/farmers/new`);
  await page.fill("#fullName", "Weather Test Farmer");
  await page.fill("#phone", phone);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.fill('input[name="land.0.name"]', "Gat 400");
  await page.fill('input[name="land.0.areaAcres"]', "1.5");
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
  await page.locator("[role=option]:has-text('Gat 400')").click();
  await page.locator("button:has-text('Select crop')").click();
  await page.locator("[role=option]:has-text('Maize')").click();
  await page.fill('input[type="number"]', "1.5");
  await page.fill('input[type="date"]', "2026-07-01");
  await page.click('button:has-text("Generate Timeline")');
  await page.waitForSelector("text=Generated crop timeline", { timeout: 10000 });
  await page.click('button:has-text("Confirm & create crop")');
  await page.waitForFunction(
    () => !location.pathname.endsWith("/new") && location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/),
    { timeout: 10000 }
  );

  // There are two "Record" buttons (health + weather); scope to the weather card specifically.
  const weatherCard = page.locator("text=Weather & field conditions").locator("..").locator("..");
  await weatherCard.scrollIntoViewIfNeeded();
  await weatherCard.locator('button:has-text("Record")').click();
  await page.waitForSelector("text=Record weather observation");
  await page.locator("button:has-text('Normal')").click();
  await page.getByRole("option", { name: "Dry spell" }).click();
  await page.fill("#weather-notes", "QA test observation");
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(800);
  const weatherText = await page.textContent("body");
  if (!weatherText.includes("Monitor soil moisture")) throw new Error("Weather advisory text not shown");
  if (!weatherText.includes("Dry spell")) throw new Error("Weather status badge not shown");
  console.log("WEATHER PANEL OK");

  console.log("SETTINGS + WEATHER SMOKE TEST PASSED");
} catch (err) {
  console.error("SMOKE TEST FAILED:", err.message);
  await page.screenshot({ path: "/tmp/smoke-failure.png", fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
