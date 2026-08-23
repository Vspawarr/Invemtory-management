import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

async function adminLogin(page) {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", "admin@champavatiagro.test");
  await page.fill("#password", "Champavati@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
}

async function createFarmerWithCrop(page, name, cropName, sowDate) {
  const phone = "9" + Math.floor(100000000 + Math.random() * 899999999);
  await page.goto(`${BASE}/admin/farmers/new`);
  await page.fill("#fullName", name);
  await page.fill("#phone", phone);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(200);
  await page.fill('input[name="land.0.name"]', "Gat 999");
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
  await page.locator("[role=option]:has-text('Gat 999')").click();
  await page.locator("button:has-text('Select crop')").click();
  await page.locator(`[role=option]:has-text('${cropName}')`).click();
  await page.fill('input[type="number"]', "2");
  await page.fill('input[type="date"]', sowDate);
  await page.click('button:has-text("Generate Timeline")');
  await page.waitForSelector("text=Generated crop timeline", { timeout: 10000 });
  await page.click('button:has-text("Confirm & create crop")');
  await page.waitForFunction(
    () => !location.pathname.endsWith("/new") && location.pathname.match(/\/admin\/crops\/[a-zA-Z0-9]+$/),
    { timeout: 10000 }
  );
  const cropId = page.url().split("/").pop();

  // Grant portal access
  await page.goto(`${BASE}/admin/farmers/${farmerId}`);
  await page.click('button:has-text("Enable portal access")');
  await page.waitForSelector("text=Enable portal access", { state: "visible" });
  await page.fill("#portal-password", "FarmerPass123");
  await page.click('button:has-text("Grant access")');
  await page.waitForTimeout(800);

  return { farmerId, phone, cropId };
}

const adminPage = await browser.newPage();
try {
  await adminLogin(adminPage);
  const farmerA = await createFarmerWithCrop(adminPage, "Portal Farmer A", "Cotton", "2026-06-18");
  console.log("FARMER A CREATED + PORTAL ENABLED", farmerA.phone);
  const farmerB = await createFarmerWithCrop(adminPage, "Portal Farmer B", "Maize", "2026-06-20");
  console.log("FARMER B CREATED + PORTAL ENABLED", farmerB.phone);

  // Log in as farmer A in a fresh context
  const farmerContext = await browser.newContext();
  const farmerPage = await farmerContext.newPage();
  await farmerPage.goto(`${BASE}/login`);
  await farmerPage.fill("#identifier", farmerA.phone);
  await farmerPage.fill("#password", "FarmerPass123");
  await farmerPage.click('button[type="submit"]');
  await farmerPage.waitForURL(/\/farmer\/dashboard/, { timeout: 10000 });
  console.log("FARMER A LOGIN OK -> redirected to /farmer/dashboard");

  const dashText = await farmerPage.textContent("body");
  if (!dashText.includes("Portal Farmer A")) throw new Error("Farmer dashboard doesn't show own name");
  if (!dashText.includes("Cotton")) throw new Error("Farmer dashboard doesn't show own crop");
  console.log("FARMER A DASHBOARD OK");

  // RBAC: farmer cannot reach /admin/*
  await farmerPage.goto(`${BASE}/admin/dashboard`);
  await farmerPage.waitForURL(/\/farmer\/dashboard/, { timeout: 10000 });
  console.log("RBAC: farmer redirected away from /admin/dashboard OK");

  // RBAC: farmer A cannot view farmer B's crop via direct URL
  const resp = await farmerPage.goto(`${BASE}/farmer/crops/${farmerB.cropId}`);
  await farmerPage.waitForTimeout(500);
  const bodyText = await farmerPage.textContent("body");
  const leaked = bodyText.includes("Maize") && !bodyText.includes("couldn't") && !bodyText.includes("error");
  if (leaked) throw new Error("RBAC LEAK: Farmer A could see Farmer B's Maize crop!");
  console.log("RBAC: farmer A cannot view farmer B's crop via direct URL OK (status: " + resp.status() + ")");

  // Farmer A can view own crop
  await farmerPage.goto(`${BASE}/farmer/crops/${farmerA.cropId}`);
  const ownCropText = await farmerPage.textContent("body");
  if (!ownCropText.includes("Cotton")) throw new Error("Farmer A cannot see own crop");
  if (!ownCropText.includes("Land Preparation")) throw new Error("Timeline missing on farmer crop page");
  console.log("FARMER A OWN CROP VIEW OK");

  // Mobile bottom nav visible
  await farmerPage.setViewportSize({ width: 390, height: 844 });
  await farmerPage.goto(`${BASE}/farmer/dashboard`);
  const navVisible = await farmerPage.locator("nav >> text=My Crops").isVisible();
  if (!navVisible) throw new Error("Mobile bottom nav not visible");
  console.log("MOBILE BOTTOM NAV OK");

  await farmerContext.close();
  console.log("FARMER PORTAL SMOKE TEST PASSED");
} catch (err) {
  console.error("SMOKE TEST FAILED:", err.message);
  await adminPage.screenshot({ path: "/tmp/smoke-failure.png", fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
