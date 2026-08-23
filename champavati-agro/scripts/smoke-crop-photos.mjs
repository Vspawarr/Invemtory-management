import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

// A GENUINE, browser-encoder-produced JPEG (not hand-typed base64) — drawn
// on a real canvas and exported via toDataURL, so it's guaranteed to be a
// fully valid, decodable image rather than just something that happens to
// pass a magic-byte sniff.
async function generateRealJpeg(page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#2f7d4f";
    ctx.fillRect(0, 0, 40, 40);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(10, 10, 20, 20);
    return canvas.toDataURL("image/jpeg", 0.9);
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", "admin@champavatiagro.in");
  await page.fill("#password", "Champavati@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
}

async function loginFarmer(page, phone) {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", phone);
  await page.fill("#password", "Farmer@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/farmer\/dashboard/, { timeout: 15000 });
}

// --- Step 1: admin uploads a real photo to one of Ramesh Patil's crops ---
const adminPage = await browser.newPage();
adminPage.on("console", (msg) => {
  if (msg.type() === "error") console.log("BROWSER ERROR:", msg.text());
});
await loginAdmin(adminPage);

await adminPage.goto(`${BASE}/admin/farmers`);
await adminPage.waitForSelector("text=Ramesh Patil", { timeout: 15000 });
await adminPage.click("text=Ramesh Patil");
await adminPage.waitForURL(/\/admin\/farmers\//, { timeout: 15000 });
await adminPage.waitForTimeout(800);

// Click into the first active crop from Ramesh's Farmer 360 (exclude the
// "Add Crop" link, which also starts with /admin/crops/ but points to "new").
await adminPage.click('a[href^="/admin/crops/"]:not([href*="new"])');
await adminPage.waitForURL(/\/admin\/crops\//, { timeout: 15000 });
const cropUrl = adminPage.url();
const cropId = cropUrl.split("/").pop();
console.log("Uploading to crop:", cropId);

await adminPage.click('button:has-text("Add Field Photo")');
await adminPage.waitForSelector('input[type="file"]', { state: "attached", timeout: 5000 });

// Set the gallery (non-camera) file input directly with a real in-memory JPEG.
const fileInputs = adminPage.locator('input[type="file"]');
const galleryInput = fileInputs.nth(1); // second input = gallery (no capture attr)
const realJpegBuffer = await generateRealJpeg(adminPage);
await galleryInput.setInputFiles({
  name: "field-photo.jpg",
  mimeType: "image/jpeg",
  buffer: realJpegBuffer,
});
await adminPage.waitForTimeout(1500); // client-side canvas resize

await adminPage.fill("#photo-caption", "Smoke test field photo");
await adminPage.click('button:has-text("Upload 1 photo")');
await adminPage.waitForTimeout(1500);

const uploadedThumb = await adminPage.locator('img[alt="Smoke test field photo"], img[src^="/api/photos/"]').count();
console.log("Upload result: photo visible in gallery =", uploadedThumb > 0);

await adminPage.screenshot({ path: "/tmp/crop-photos-after-upload.png", fullPage: true });

// Extract a real photo id straight from a rendered gallery <img> src.
const photoSrc = await adminPage.locator('img[src^="/api/photos/"]').first().getAttribute("src");
const photoId = photoSrc ? photoSrc.split("/").pop() : null;
console.log("Uploaded photo id:", photoId);

// --- Step 2: admin can fetch the photo bytes ---
const adminFetch = await adminPage.request.get(`${BASE}/api/photos/${photoId}`);
console.log("Admin GET /api/photos/[id]:", adminFetch.status(), adminFetch.headers()["content-type"]);

await adminPage.close();

// --- Step 3: Ramesh (the owning farmer) can fetch his own photo ---
const ownerPage = await browser.newPage();
await loginFarmer(ownerPage, "9876500001"); // Ramesh Patil
const ownerFetch = await ownerPage.request.get(`${BASE}/api/photos/${photoId}`);
console.log("Owning farmer (Ramesh) GET /api/photos/[id]:", ownerFetch.status());
await ownerPage.close();

// --- Step 4: SECURITY TEST — a DIFFERENT farmer must be denied ---
const otherPage = await browser.newPage();
await loginFarmer(otherPage, "9876500002"); // Sunil Jadhav — does NOT own this crop
const otherFetch = await otherPage.request.get(`${BASE}/api/photos/${photoId}`);
console.log("Other farmer (Sunil) GET /api/photos/[id] — MUST be 403:", otherFetch.status());
if (otherFetch.status() !== 403) {
  console.log("!!! SECURITY FAILURE: other farmer was not denied !!!");
}
await otherPage.close();

// --- Step 5: unauthenticated request must be denied ---
const anonContext = await browser.newContext();
const anonPage = await anonContext.newPage();
const anonFetch = await anonPage.request.get(`${BASE}/api/photos/${photoId}`);
console.log("Unauthenticated GET /api/photos/[id] — MUST be 401:", anonFetch.status());
if (anonFetch.status() !== 401) {
  console.log("!!! SECURITY FAILURE: unauthenticated request was not denied !!!");
}
await anonContext.close();

// --- Step 6: also try ID substitution the other direction — Sunil's own farmer page must not show Ramesh's photo ---
const sunilPage = await browser.newPage();
await loginFarmer(sunilPage, "9876500002");
await sunilPage.goto(`${BASE}/farmer/crops`);
await sunilPage.waitForTimeout(800);
const sunilPageContent = await sunilPage.content();
console.log("Sunil's crop list contains uploaded photo id (must be false):", sunilPageContent.includes(photoId));
await sunilPage.close();

await browser.close();
console.log("DONE");
