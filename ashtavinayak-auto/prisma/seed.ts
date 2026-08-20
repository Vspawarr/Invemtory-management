/**
 * Seed data. Everything created here is clearly demo/development data:
 * - the bootstrap admin comes from ADMIN_EMAIL / ADMIN_PASSWORD env vars
 * - vehicles/submissions carry isDemo: true and a "[DEMO DATA]" description
 *   prefix — none of this represents real Ashtavinayak inventory
 * This file is safe to re-run (idempotent upserts / delete-and-recreate for
 * the demo vehicle & submission sets).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { generateDemoImage } from "../scripts/gen-demo-images";
import { generateVehicleSlug } from "../src/lib/slug";
import { formatReferenceNumber, generateTrackingToken } from "../src/lib/reference-number";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[seed] ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin bootstrap.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: { name: "Admin", email, passwordHash, role: "SUPER_ADMIN" },
    update: { passwordHash, role: "SUPER_ADMIN", isActive: true },
  });
  console.log(`[seed] Admin user ready: ${email}`);
}

const CATEGORIES = [
  { name: "Cars", slug: "cars", vehicleType: "CAR" as const, sortOrder: 1 },
  { name: "Bikes", slug: "bikes", vehicleType: "BIKE" as const, sortOrder: 2 },
  { name: "Scooters", slug: "scooters", vehicleType: "SCOOTER" as const, sortOrder: 3 },
  { name: "Buses", slug: "buses", vehicleType: "BUS" as const, sortOrder: 4 },
  { name: "Commercial Vehicles", slug: "commercial-vehicles", vehicleType: "COMMERCIAL" as const, sortOrder: 5 },
  { name: "Other Vehicles", slug: "other-vehicles", vehicleType: "OTHER" as const, sortOrder: 6 },
];

async function seedCategories() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: { name: cat.name, vehicleType: cat.vehicleType, sortOrder: cat.sortOrder },
    });
  }
  console.log(`[seed] ${CATEGORIES.length} categories ready.`);
}

const FEATURES = [
  "Air Conditioning",
  "Power Steering",
  "Power Windows",
  "ABS",
  "Airbags",
  "Reverse Camera",
  "Parking Sensors",
  "Alloy Wheels",
  "Bluetooth",
  "Sunroof",
  "Cruise Control",
];

async function seedFeatures() {
  for (const [i, name] of FEATURES.entries()) {
    await prisma.feature.upsert({
      where: { name },
      create: { name, sortOrder: i },
      update: { sortOrder: i },
    });
  }
  console.log(`[seed] ${FEATURES.length} features ready.`);
}

// ─── Demo vehicles ──────────────────────────────────────────────────────────

type DemoVehicleSpec = {
  categorySlug: string;
  vehicleType: "CAR" | "BIKE" | "SCOOTER" | "BUS" | "COMMERCIAL" | "OTHER";
  brand: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  kilometres: number;
  fuelType: "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID" | "LPG";
  transmission?: "MANUAL" | "AUTOMATIC" | "AMT" | "CVT" | "DCT";
  engine?: string;
  mileage?: string;
  owners: number;
  color: string;
  condition: "EXCELLENT" | "GOOD" | "AVERAGE";
  city: string;
  state: string;
  status: "DRAFT" | "LISTED" | "RESERVED" | "SOLD";
  source: "BUSINESS_STOCK" | "CUSTOMER_SUBMITTED";
  isFeatured?: boolean;
  featureNames: string[];
  linkSeller?: boolean;
};

const DEMO_VEHICLES: DemoVehicleSpec[] = [
  { categorySlug: "cars", vehicleType: "CAR", brand: "Maruti Suzuki", model: "Swift", variant: "VXI", year: 2021, price: 620000, kilometres: 32000, fuelType: "PETROL", transmission: "MANUAL", engine: "1197 cc", mileage: "22 km/l", owners: 1, color: "Pearl White", condition: "EXCELLENT", city: "Pune", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", isFeatured: true, featureNames: ["Air Conditioning", "Power Steering", "Power Windows", "ABS", "Bluetooth"] },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Hyundai", model: "Creta", variant: "SX", year: 2022, price: 1450000, kilometres: 21000, fuelType: "DIESEL", transmission: "AUTOMATIC", engine: "1493 cc", mileage: "18 km/l", owners: 1, color: "Phantom Black", condition: "EXCELLENT", city: "Mumbai", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", isFeatured: true, featureNames: ["Sunroof", "Reverse Camera", "Cruise Control", "Alloy Wheels", "Airbags"] },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Tata", model: "Nexon", variant: "XZ+", year: 2020, price: 850000, kilometres: 41000, fuelType: "PETROL", transmission: "MANUAL", engine: "1199 cc", mileage: "17 km/l", owners: 2, color: "Calypso Red", condition: "GOOD", city: "Nagpur", state: "Maharashtra", status: "LISTED", source: "CUSTOMER_SUBMITTED", linkSeller: true, featureNames: ["Airbags", "ABS", "Alloy Wheels"] },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Mahindra", model: "Scorpio", variant: "S11", year: 2019, price: 1150000, kilometres: 58000, fuelType: "DIESEL", transmission: "MANUAL", engine: "2179 cc", mileage: "15 km/l", owners: 2, color: "Napoli Black", condition: "GOOD", city: "Nashik", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", featureNames: ["Power Steering", "Power Windows", "ABS"] },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Toyota", model: "Innova Crysta", variant: "ZX", year: 2021, price: 2150000, kilometres: 34000, fuelType: "DIESEL", transmission: "AUTOMATIC", engine: "2393 cc", mileage: "14 km/l", owners: 1, color: "Silver Metallic", condition: "EXCELLENT", city: "Pune", state: "Maharashtra", status: "RESERVED", source: "BUSINESS_STOCK", featureNames: ["Cruise Control", "Reverse Camera", "Airbags", "Sunroof"] },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Honda", model: "City", variant: "VX", year: 2020, price: 980000, kilometres: 29000, fuelType: "PETROL", transmission: "CVT", engine: "1498 cc", mileage: "18 km/l", owners: 1, color: "Lunar Silver", condition: "EXCELLENT", city: "Mumbai", state: "Maharashtra", status: "LISTED", source: "CUSTOMER_SUBMITTED", linkSeller: true, isFeatured: true, featureNames: ["Sunroof", "Alloy Wheels", "Bluetooth", "Reverse Camera"] },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Maruti Suzuki", model: "Baleno", variant: "Alpha", year: 2022, price: 720000, kilometres: 18000, fuelType: "PETROL", transmission: "MANUAL", engine: "1197 cc", mileage: "22 km/l", owners: 1, color: "Nexa Blue", condition: "EXCELLENT", city: "Pune", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", featureNames: ["Alloy Wheels", "Bluetooth", "Airbags"] },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Hyundai", model: "i20", variant: "Sportz", year: 2019, price: 610000, kilometres: 47000, fuelType: "PETROL", transmission: "MANUAL", engine: "1197 cc", mileage: "20 km/l", owners: 2, color: "Fiery Red", condition: "GOOD", city: "Nashik", state: "Maharashtra", status: "SOLD", source: "BUSINESS_STOCK", featureNames: ["Power Windows", "ABS"] },

  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Royal Enfield", model: "Classic 350", year: 2021, price: 155000, kilometres: 14000, fuelType: "PETROL", transmission: "MANUAL", engine: "349 cc", mileage: "36 km/l", owners: 1, color: "Stealth Black", condition: "EXCELLENT", city: "Pune", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", isFeatured: true, featureNames: ["ABS"] },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Bajaj", model: "Pulsar", variant: "NS200", year: 2020, price: 98000, kilometres: 22000, fuelType: "PETROL", transmission: "MANUAL", engine: "199 cc", mileage: "40 km/l", owners: 1, color: "Racing Blue", condition: "GOOD", city: "Nagpur", state: "Maharashtra", status: "LISTED", source: "CUSTOMER_SUBMITTED", linkSeller: true, featureNames: ["ABS"] },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "TVS", model: "Apache", variant: "RTR 160", year: 2019, price: 82000, kilometres: 27000, fuelType: "PETROL", transmission: "MANUAL", engine: "159 cc", mileage: "45 km/l", owners: 2, color: "Matte Grey", condition: "GOOD", city: "Mumbai", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", featureNames: [] },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Royal Enfield", model: "Meteor 350", year: 2022, price: 175000, kilometres: 9000, fuelType: "PETROL", transmission: "MANUAL", engine: "349 cc", mileage: "35 km/l", owners: 1, color: "Fireball Red", condition: "EXCELLENT", city: "Pune", state: "Maharashtra", status: "RESERVED", source: "BUSINESS_STOCK", featureNames: ["ABS"] },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Bajaj", model: "Dominar 400", year: 2020, price: 138000, kilometres: 19000, fuelType: "PETROL", transmission: "MANUAL", engine: "373 cc", mileage: "30 km/l", owners: 1, color: "Vine Black", condition: "GOOD", city: "Nashik", state: "Maharashtra", status: "LISTED", source: "CUSTOMER_SUBMITTED", linkSeller: true, featureNames: ["ABS"] },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Honda", model: "CB Shine", year: 2018, price: 48000, kilometres: 39000, fuelType: "PETROL", transmission: "MANUAL", engine: "125 cc", mileage: "60 km/l", owners: 2, color: "Black", condition: "AVERAGE", city: "Mumbai", state: "Maharashtra", status: "SOLD", source: "BUSINESS_STOCK", featureNames: [] },

  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "Honda", model: "Activa", variant: "6G", year: 2021, price: 62000, kilometres: 16000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "109 cc", mileage: "50 km/l", owners: 1, color: "Pearl White", condition: "EXCELLENT", city: "Pune", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", isFeatured: true, featureNames: [] },
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "TVS", model: "Jupiter", year: 2020, price: 52000, kilometres: 21000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "113 cc", mileage: "48 km/l", owners: 1, color: "Titanium Grey", condition: "GOOD", city: "Mumbai", state: "Maharashtra", status: "LISTED", source: "CUSTOMER_SUBMITTED", linkSeller: true, featureNames: [] },
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "Suzuki", model: "Access 125", year: 2019, price: 55000, kilometres: 26000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "124 cc", mileage: "45 km/l", owners: 2, color: "Candy Red", condition: "GOOD", city: "Nagpur", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", featureNames: [] },
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "Honda", model: "Dio", year: 2022, price: 58000, kilometres: 8000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "109 cc", mileage: "48 km/l", owners: 1, color: "Sports Red", condition: "EXCELLENT", city: "Pune", state: "Maharashtra", status: "DRAFT", source: "BUSINESS_STOCK", featureNames: [] },

  { categorySlug: "buses", vehicleType: "BUS", brand: "Tata", model: "Starbus", variant: "40-Seater", year: 2017, price: 1850000, kilometres: 210000, fuelType: "DIESEL", transmission: "MANUAL", engine: "3300 cc", owners: 1, color: "White", condition: "GOOD", city: "Pune", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", featureNames: [] },
  { categorySlug: "buses", vehicleType: "BUS", brand: "Ashok Leyland", model: "Viking", year: 2016, price: 1550000, kilometres: 265000, fuelType: "DIESEL", transmission: "MANUAL", engine: "5660 cc", owners: 2, color: "White", condition: "AVERAGE", city: "Nagpur", state: "Maharashtra", status: "LISTED", source: "CUSTOMER_SUBMITTED", linkSeller: true, featureNames: [] },
  { categorySlug: "buses", vehicleType: "BUS", brand: "Eicher", model: "Skyline Bus", year: 2018, price: 1980000, kilometres: 175000, fuelType: "DIESEL", transmission: "MANUAL", engine: "3298 cc", owners: 1, color: "White", condition: "GOOD", city: "Nashik", state: "Maharashtra", status: "RESERVED", source: "BUSINESS_STOCK", featureNames: [] },

  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Tata", model: "Ace Gold", year: 2020, price: 480000, kilometres: 62000, fuelType: "DIESEL", transmission: "MANUAL", engine: "702 cc", owners: 1, color: "White", condition: "GOOD", city: "Pune", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", featureNames: [] },
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Ashok Leyland", model: "Dost+", year: 2019, price: 560000, kilometres: 81000, fuelType: "DIESEL", transmission: "MANUAL", engine: "1478 cc", owners: 2, color: "White", condition: "GOOD", city: "Mumbai", state: "Maharashtra", status: "LISTED", source: "CUSTOMER_SUBMITTED", linkSeller: true, featureNames: [] },
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Mahindra", model: "Bolero Pickup", year: 2021, price: 620000, kilometres: 38000, fuelType: "DIESEL", transmission: "MANUAL", engine: "1493 cc", owners: 1, color: "White", condition: "EXCELLENT", city: "Nagpur", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", isFeatured: true, featureNames: [] },
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Tata", model: "407 Truck", year: 2017, price: 720000, kilometres: 145000, fuelType: "DIESEL", transmission: "MANUAL", engine: "2956 cc", owners: 2, color: "Blue", condition: "AVERAGE", city: "Nashik", state: "Maharashtra", status: "SOLD", source: "BUSINESS_STOCK", featureNames: [] },

  { categorySlug: "other-vehicles", vehicleType: "OTHER", brand: "Mahindra", model: "Treo", variant: "Electric Auto", year: 2022, price: 245000, kilometres: 12000, fuelType: "ELECTRIC", transmission: "AUTOMATIC", owners: 1, color: "Yellow", condition: "EXCELLENT", city: "Pune", state: "Maharashtra", status: "LISTED", source: "BUSINESS_STOCK", featureNames: [] },
];

const SELLER_POOL = [
  { name: "Rahul Deshmukh", phone: "9800011001", city: "Nagpur", state: "Maharashtra" },
  { name: "Priya Kulkarni", phone: "9800011002", city: "Mumbai", state: "Maharashtra" },
  { name: "Sanjay Patil", phone: "9800011003", city: "Nashik", state: "Maharashtra" },
];

async function seedVehicles() {
  const existingDemo = await prisma.vehicle.count({ where: { isDemo: true } });
  if (existingDemo > 0) {
    console.log(`[seed] ${existingDemo} demo vehicles already present — skipping vehicle seed.`);
    return;
  }

  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const features = await prisma.feature.findMany();
  const featureByName = new Map(features.map((f) => [f.name, f]));

  let sellerIndex = 0;
  let created = 0;

  for (const spec of DEMO_VEHICLES) {
    const category = categoryBySlug.get(spec.categorySlug);
    if (!category) continue;

    let sellerId: string | undefined;
    if (spec.linkSeller) {
      const pooled = SELLER_POOL[sellerIndex % SELLER_POOL.length];
      sellerIndex += 1;
      const seller = await prisma.vehicleSeller.upsert({
        where: { phone: pooled.phone },
        create: { name: pooled.name, phone: pooled.phone, city: pooled.city, state: pooled.state, preferredContact: "WHATSAPP" },
        update: {},
      });
      sellerId = seller.id;
    }

    const slug = await generateVehicleSlug({
      brand: spec.brand,
      model: spec.model,
      variant: spec.variant,
      year: spec.year,
      city: spec.city,
    });

    const title = `${spec.brand} ${spec.model}${spec.variant ? " " + spec.variant : ""}`;
    const imageLabels = ["Front", "Side", "Interior"];
    const imageUrls: string[] = [];
    for (const [i, label] of imageLabels.entries()) {
      const filename = `demo-${slug}-${i}.svg`;
      const url = await generateDemoImage(filename, `${title} — ${label}`, spec.vehicleType, slug.length + i);
      imageUrls.push(url);
    }

    const now = new Date();
    const isPublic = spec.status === "LISTED" || spec.status === "RESERVED" || spec.status === "SOLD";

    await prisma.vehicle.create({
      data: {
        slug,
        source: spec.source,
        listingType: spec.source === "CUSTOMER_SUBMITTED" ? "CUSTOMER_CONSIGNMENT" : "BUSINESS_STOCK",
        status: spec.status,
        categoryId: category.id,
        vehicleType: spec.vehicleType,
        brand: spec.brand,
        model: spec.model,
        variant: spec.variant,
        year: spec.year,
        price: spec.price,
        ownerExpectedPrice: spec.source === "CUSTOMER_SUBMITTED" ? Math.round(spec.price * 0.97) : null,
        adminValuation: spec.source === "CUSTOMER_SUBMITTED" ? Math.round(spec.price * 0.98) : null,
        kilometres: spec.kilometres,
        fuelType: spec.fuelType,
        transmission: spec.transmission,
        engine: spec.engine,
        mileage: spec.mileage,
        owners: spec.owners,
        color: spec.color,
        condition: spec.condition,
        city: spec.city,
        state: spec.state,
        location: spec.city,
        description: `[DEMO DATA] This ${title} listing is sample data for demonstration purposes and is not an actual vehicle available from Ashtavinayak Auto Consultant. ${spec.condition === "EXCELLENT" ? "Well maintained with complete service history." : "Runs well; inspect before purchase."}`,
        rcAvailable: true,
        insuranceAvailable: spec.status !== "SOLD",
        pucAvailable: true,
        serviceHistoryAvailable: spec.owners === 1,
        hasLoan: false,
        isFeatured: Boolean(spec.isFeatured),
        isDemo: true,
        sellerId,
        approvedAt: spec.source === "CUSTOMER_SUBMITTED" ? now : null,
        listedAt: isPublic ? now : null,
        reservedAt: spec.status === "RESERVED" ? now : null,
        soldAt: spec.status === "SOLD" ? now : null,
        images: {
          create: imageUrls.map((url, i) => ({ url, sortOrder: i, isPrimary: i === 0, altText: `${title} photo ${i + 1}` })),
        },
        features: {
          create: spec.featureNames
            .map((n) => featureByName.get(n))
            .filter((f): f is NonNullable<typeof f> => Boolean(f))
            .map((f) => ({ featureId: f.id })),
        },
      },
    });
    created += 1;
  }

  console.log(`[seed] ${created} demo vehicles created.`);
}

// ─── Demo submissions (Sell Your Vehicle workflow states) ─────────────────

type DemoSubmissionSpec = {
  seller: { name: string; phone: string; email?: string; city: string; state: string };
  vehicleType: DemoVehicleSpec["vehicleType"];
  brand: string;
  model: string;
  variant?: string;
  year: number;
  kilometres: number;
  fuelType: DemoVehicleSpec["fuelType"];
  transmission?: DemoVehicleSpec["transmission"];
  expectedPrice: number;
  city: string;
  state: string;
  status: "PENDING_REVIEW" | "UNDER_REVIEW" | "MORE_INFORMATION_REQUIRED" | "APPROVED" | "REJECTED";
  requestMoreInfoMessage?: string;
  rejectionReason?: string;
};

const DEMO_SUBMISSIONS: DemoSubmissionSpec[] = [
  {
    seller: { name: "Amit Joshi", phone: "9800022001", city: "Pune", state: "Maharashtra" },
    vehicleType: "CAR", brand: "Maruti Suzuki", model: "Alto", variant: "LXI", year: 2018, kilometres: 51000, fuelType: "PETROL", transmission: "MANUAL",
    expectedPrice: 320000, city: "Pune", state: "Maharashtra", status: "PENDING_REVIEW",
  },
  {
    seller: { name: "Neha Shah", phone: "9800022002", email: "neha.shah@example.com", city: "Mumbai", state: "Maharashtra" },
    vehicleType: "BIKE", brand: "TVS", model: "Apache", variant: "RTR 200", year: 2020, kilometres: 18000, fuelType: "PETROL", transmission: "MANUAL",
    expectedPrice: 105000, city: "Mumbai", state: "Maharashtra", status: "PENDING_REVIEW",
  },
  {
    seller: { name: "Vikram Rao", phone: "9800022003", city: "Nagpur", state: "Maharashtra" },
    vehicleType: "CAR", brand: "Hyundai", model: "Venue", variant: "SX", year: 2021, kilometres: 24000, fuelType: "PETROL", transmission: "MANUAL",
    expectedPrice: 950000, city: "Nagpur", state: "Maharashtra", status: "UNDER_REVIEW",
  },
  {
    seller: { name: "Sunita Pawar", phone: "9800022004", city: "Nashik", state: "Maharashtra" },
    vehicleType: "SCOOTER", brand: "Yamaha", model: "Fascino", year: 2019, kilometres: 22000, fuelType: "PETROL", transmission: "AUTOMATIC",
    expectedPrice: 48000, city: "Nashik", state: "Maharashtra", status: "MORE_INFORMATION_REQUIRED",
    requestMoreInfoMessage: "Please upload clear photographs of the dashboard and provide insurance validity details.",
  },
  {
    seller: { name: "Ramesh Iyer", phone: "9800022005", city: "Pune", state: "Maharashtra" },
    vehicleType: "COMMERCIAL", brand: "Tata", model: "Intra V30", year: 2020, kilometres: 55000, fuelType: "DIESEL", transmission: "MANUAL",
    expectedPrice: 590000, city: "Pune", state: "Maharashtra", status: "REJECTED",
    rejectionReason: "Duplicate submission — vehicle already listed by the same owner under a different reference.",
  },
];

async function seedSubmissions() {
  const existingDemo = await prisma.vehicleSubmission.count({ where: { isDemo: true } });
  if (existingDemo > 0) {
    console.log(`[seed] ${existingDemo} demo submissions already present — skipping submission seed.`);
    return;
  }

  let created = 0;
  for (const spec of DEMO_SUBMISSIONS) {
    const seller = await prisma.vehicleSeller.upsert({
      where: { phone: spec.seller.phone },
      create: { ...spec.seller, preferredContact: "WHATSAPP" },
      update: {},
    });

    const { tokenHash } = generateTrackingToken();
    const placeholderRef = `TEMP-DEMO-${created}-${Date.now()}`;

    const submission = await prisma.vehicleSubmission.create({
      data: {
        referenceNumber: placeholderRef,
        sellerId: seller.id,
        vehicleType: spec.vehicleType,
        brand: spec.brand,
        model: spec.model,
        variant: spec.variant,
        year: spec.year,
        kilometres: spec.kilometres,
        fuelType: spec.fuelType,
        transmission: spec.transmission,
        expectedPrice: spec.expectedPrice,
        isPriceNegotiable: true,
        condition: "GOOD",
        owners: 1,
        city: spec.city,
        state: spec.state,
        description: `[DEMO DATA] Sample submission for workflow testing — ${spec.brand} ${spec.model}.`,
        rcAvailable: true,
        insuranceAvailable: true,
        pucAvailable: true,
        serviceHistoryAvailable: false,
        hasLoan: false,
        consentAt: new Date(),
        isDemo: true,
        status: spec.status,
        requestMoreInfoMessage: spec.requestMoreInfoMessage,
        rejectionReason: spec.rejectionReason,
        reviewedAt: spec.status === "PENDING_REVIEW" ? null : new Date(),
        publicTrackingTokenHash: tokenHash,
        trackingTokenCreatedAt: new Date(),
      },
    });

    const referenceNumber = formatReferenceNumber(submission.seq);
    await prisma.vehicleSubmission.update({ where: { id: submission.id }, data: { referenceNumber } });

    const label = `${spec.brand} ${spec.model}`;
    for (let i = 0; i < 4; i++) {
      const filename = `demo-submission-${submission.id}-${i}.svg`;
      const url = await generateDemoImage(filename, `${label} — Photo ${i + 1}`, spec.vehicleType, submission.id.length + i);
      await prisma.vehicleSubmissionImage.create({
        data: { submissionId: submission.id, url, sortOrder: i, isPrimary: i === 0, altText: `${label} photo ${i + 1}` },
      });
    }

    created += 1;
  }

  console.log(`[seed] ${created} demo submissions created.`);
}

async function main() {
  await seedAdmin();
  await seedCategories();
  await seedFeatures();
  await seedVehicles();
  await seedSubmissions();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
