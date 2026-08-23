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
  console.log("LOGIN OK");

  await page.goto(`${BASE}/admin/farmers/new`);
  const phone = "9" + Math.floor(100000000 + Math.random() * 899999999);
  await page.fill("#fullName", "Ramesh Patil (smoke test)");
  await page.fill("#phone", phone);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(300);

  await page.fill('input[name="land.0.name"]', "Gat 102");
  await page.fill('input[name="land.0.areaAcres"]', "2.5");
  await page.fill('input[name="land.0.village"]', "Chapaner");

  await page.click('button:has-text("Save farmer")');
  await page.waitForFunction(
    () => !location.pathname.endsWith("/new") && location.pathname.includes("/admin/farmers/"),
    { timeout: 15000 }
  );
  console.log("FARMER CREATED, URL:", page.url());

  const bodyText = await page.textContent("body");
  if (!bodyText.includes("Ramesh Patil (smoke test)")) throw new Error("Farmer name not found on 360 page");
  if (!bodyText.includes("Gat 102")) throw new Error("Land parcel not found on 360 page");
  console.log("FARMER 360 PAGE OK");

  console.log("SMOKE TEST PASSED");
} catch (err) {
  console.error("SMOKE TEST FAILED:", err.message);
  await page.screenshot({ path: "/tmp/smoke-failure.png" });
  process.exitCode = 1;
} finally {
  await browser.close();
}
