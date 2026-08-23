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

await page.goto(`${BASE}/admin/reports`);
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/reports-farmers-tab.png", fullPage: true });
console.log("Farmers tab screenshot OK");

await page.click('button:has-text("Crops (")');
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/reports-crops-tab.png", fullPage: true });
console.log("Crops tab screenshot OK");

await page.click('button:has-text("Products (")');
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/reports-products-tab.png", fullPage: true });
console.log("Products tab screenshot OK");

// --- CSV download verification (real HTTP fetch with admin's session cookies) ---
const csvResp = await page.request.get(`${BASE}/api/reports/farmers`);
console.log("Farmers CSV status:", csvResp.status(), csvResp.headers()["content-type"]);
const csvText = await csvResp.text();
const csvLines = csvText.trim().split("\r\n");
console.log("Farmers CSV rows (incl. header):", csvLines.length);
console.log("Farmers CSV header:", csvLines[0]);
console.log("Farmers CSV sample row:", csvLines[1]);

const productsCsv = await page.request.get(`${BASE}/api/reports/products`);
console.log("Products CSV status:", productsCsv.status());
const treatmentsCsv = await page.request.get(`${BASE}/api/reports/treatments`);
console.log("Treatments CSV status:", treatmentsCsv.status());
const cropsCsv = await page.request.get(`${BASE}/api/reports/crops`);
console.log("Crops CSV status:", cropsCsv.status());

// --- RBAC: farmer session must be denied everywhere ---
await page.context().clearCookies();
await page.goto(`${BASE}/login`);
await page.fill("#identifier", "9876500001");
await page.fill("#password", "Farmer@123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/farmer\/dashboard/, { timeout: 15000 });

const farmerPageResp = await page.goto(`${BASE}/admin/reports`);
console.log("Farmer session visiting /admin/reports -> status:", farmerPageResp.status(), "final URL:", page.url());

const farmerApiResp = await page.request.get(`${BASE}/api/reports/farmers`);
console.log("Farmer session GET /api/reports/farmers — MUST be 403:", farmerApiResp.status());
if (farmerApiResp.status() !== 403) console.log("!!! SECURITY FAILURE: farmer was not denied report access !!!");

// --- unauthenticated ---
const anonContext = await browser.newContext();
const anonPage = await anonContext.newPage();
const anonResp = await anonPage.request.get(`${BASE}/api/reports/farmers`);
console.log("Unauthenticated GET /api/reports/farmers — MUST be 401:", anonResp.status());
if (anonResp.status() !== 401) console.log("!!! SECURITY FAILURE: unauthenticated request was not denied !!!");
await anonContext.close();

await browser.close();
console.log("DONE");
