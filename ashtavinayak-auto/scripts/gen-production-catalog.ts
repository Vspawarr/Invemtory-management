/**
 * One-off generator for the production client-demo catalog: 5-6 vehicles per
 * category. Writes placeholder images to public/demo-images (committed to
 * git so they deploy on Vercel) and prints a SQL script (INSERT statements
 * for Vehicle + VehicleImage) to stdout for the Supabase SQL Editor — this
 * sandbox cannot reach the production Postgres instance directly.
 *
 * Run with: npx tsx scripts/gen-production-catalog.ts > /path/to/output.sql
 */
import { randomUUID } from "crypto";
import { generateDemoImage } from "./gen-demo-images";

type Spec = {
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
  isFeatured?: boolean;
};

const STATE = "Maharashtra";

const CATALOG: Spec[] = [
  // Cars
  { categorySlug: "cars", vehicleType: "CAR", brand: "Maruti Suzuki", model: "Swift", variant: "VXI", year: 2021, price: 620000, kilometres: 32000, fuelType: "PETROL", transmission: "MANUAL", engine: "1197 cc", mileage: "22 km/l", owners: 1, color: "Pearl White", condition: "EXCELLENT", city: "Chhatrapati Sambhajinagar", isFeatured: true },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Hyundai", model: "Creta", variant: "SX", year: 2022, price: 1450000, kilometres: 21000, fuelType: "DIESEL", transmission: "AUTOMATIC", engine: "1493 cc", mileage: "18 km/l", owners: 1, color: "Phantom Black", condition: "EXCELLENT", city: "Nashik", isFeatured: true },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Tata", model: "Nexon", variant: "XZ+", year: 2020, price: 850000, kilometres: 41000, fuelType: "PETROL", transmission: "MANUAL", engine: "1199 cc", mileage: "17 km/l", owners: 2, color: "Calypso Red", condition: "GOOD", city: "Jalna", },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Honda", model: "City", variant: "VX", year: 2020, price: 980000, kilometres: 29000, fuelType: "PETROL", transmission: "CVT", engine: "1498 cc", mileage: "18 km/l", owners: 1, color: "Lunar Silver", condition: "EXCELLENT", city: "Pune", },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Toyota", model: "Innova Crysta", variant: "ZX", year: 2021, price: 2150000, kilometres: 34000, fuelType: "DIESEL", transmission: "AUTOMATIC", engine: "2393 cc", mileage: "14 km/l", owners: 1, color: "Silver Metallic", condition: "EXCELLENT", city: "Chhatrapati Sambhajinagar", },
  { categorySlug: "cars", vehicleType: "CAR", brand: "Mahindra", model: "XUV700", variant: "AX7", year: 2022, price: 1985000, kilometres: 18000, fuelType: "DIESEL", transmission: "AUTOMATIC", engine: "2198 cc", mileage: "16 km/l", owners: 1, color: "Napoli Black", condition: "EXCELLENT", city: "Vaijapur", },

  // Bikes
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Royal Enfield", model: "Classic 350", year: 2021, price: 155000, kilometres: 14000, fuelType: "PETROL", transmission: "MANUAL", engine: "349 cc", mileage: "36 km/l", owners: 1, color: "Stealth Black", condition: "EXCELLENT", city: "Chhatrapati Sambhajinagar", isFeatured: true },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Bajaj", model: "Pulsar", variant: "NS200", year: 2020, price: 98000, kilometres: 22000, fuelType: "PETROL", transmission: "MANUAL", engine: "199 cc", mileage: "40 km/l", owners: 1, color: "Racing Blue", condition: "GOOD", city: "Jalna", },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "TVS", model: "Apache", variant: "RTR 160", year: 2019, price: 82000, kilometres: 27000, fuelType: "PETROL", transmission: "MANUAL", engine: "159 cc", mileage: "45 km/l", owners: 2, color: "Matte Grey", condition: "GOOD", city: "Nashik", },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Honda", model: "CB Shine", year: 2019, price: 55000, kilometres: 31000, fuelType: "PETROL", transmission: "MANUAL", engine: "125 cc", mileage: "60 km/l", owners: 1, color: "Black", condition: "GOOD", city: "Vaijapur", },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "Royal Enfield", model: "Meteor 350", year: 2022, price: 175000, kilometres: 9000, fuelType: "PETROL", transmission: "MANUAL", engine: "349 cc", mileage: "35 km/l", owners: 1, color: "Fireball Red", condition: "EXCELLENT", city: "Pune", },
  { categorySlug: "bikes", vehicleType: "BIKE", brand: "KTM", model: "Duke", variant: "200", year: 2021, price: 148000, kilometres: 16000, fuelType: "PETROL", transmission: "MANUAL", engine: "199 cc", mileage: "32 km/l", owners: 1, color: "Orange", condition: "EXCELLENT", city: "Chhatrapati Sambhajinagar", },

  // Scooters
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "Honda", model: "Activa", variant: "6G", year: 2021, price: 62000, kilometres: 16000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "109 cc", mileage: "50 km/l", owners: 1, color: "Pearl White", condition: "EXCELLENT", city: "Chhatrapati Sambhajinagar", isFeatured: true },
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "TVS", model: "Jupiter", year: 2020, price: 52000, kilometres: 21000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "113 cc", mileage: "48 km/l", owners: 1, color: "Titanium Grey", condition: "GOOD", city: "Jalna", },
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "Suzuki", model: "Access 125", year: 2019, price: 55000, kilometres: 26000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "124 cc", mileage: "45 km/l", owners: 2, color: "Candy Red", condition: "GOOD", city: "Nashik", },
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "Honda", model: "Dio", year: 2022, price: 58000, kilometres: 8000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "109 cc", mileage: "48 km/l", owners: 1, color: "Sports Red", condition: "EXCELLENT", city: "Vaijapur", },
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "Yamaha", model: "Fascino", year: 2020, price: 51000, kilometres: 19000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "125 cc", mileage: "46 km/l", owners: 1, color: "Cyan Blue", condition: "GOOD", city: "Pune", },
  { categorySlug: "scooters", vehicleType: "SCOOTER", brand: "Hero", model: "Pleasure+", year: 2021, price: 47000, kilometres: 12000, fuelType: "PETROL", transmission: "AUTOMATIC", engine: "110 cc", mileage: "49 km/l", owners: 1, color: "Panther Black", condition: "EXCELLENT", city: "Chhatrapati Sambhajinagar", },

  // Buses
  { categorySlug: "buses", vehicleType: "BUS", brand: "Tata", model: "Starbus", variant: "40-Seater", year: 2017, price: 1850000, kilometres: 210000, fuelType: "DIESEL", transmission: "MANUAL", engine: "3300 cc", owners: 1, color: "White", condition: "GOOD", city: "Chhatrapati Sambhajinagar", isFeatured: true },
  { categorySlug: "buses", vehicleType: "BUS", brand: "Ashok Leyland", model: "Viking", year: 2016, price: 1550000, kilometres: 265000, fuelType: "DIESEL", transmission: "MANUAL", engine: "5660 cc", owners: 2, color: "White", condition: "AVERAGE", city: "Jalna", },
  { categorySlug: "buses", vehicleType: "BUS", brand: "Eicher", model: "Skyline Bus", year: 2018, price: 1980000, kilometres: 175000, fuelType: "DIESEL", transmission: "MANUAL", engine: "3298 cc", owners: 1, color: "White", condition: "GOOD", city: "Nashik", },
  { categorySlug: "buses", vehicleType: "BUS", brand: "Force", model: "Traveller", variant: "26-Seater", year: 2019, price: 1350000, kilometres: 130000, fuelType: "DIESEL", transmission: "MANUAL", engine: "2596 cc", owners: 1, color: "White", condition: "GOOD", city: "Vaijapur", },
  { categorySlug: "buses", vehicleType: "BUS", brand: "Tata", model: "Marcopolo", variant: "35-Seater", year: 2015, price: 1250000, kilometres: 320000, fuelType: "DIESEL", transmission: "MANUAL", engine: "3300 cc", owners: 2, color: "White", condition: "AVERAGE", city: "Pune", },

  // Commercial vehicles
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Tata", model: "Ace Gold", year: 2020, price: 480000, kilometres: 62000, fuelType: "DIESEL", transmission: "MANUAL", engine: "702 cc", owners: 1, color: "White", condition: "GOOD", city: "Chhatrapati Sambhajinagar", isFeatured: true },
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Ashok Leyland", model: "Dost+", year: 2019, price: 560000, kilometres: 81000, fuelType: "DIESEL", transmission: "MANUAL", engine: "1478 cc", owners: 2, color: "White", condition: "GOOD", city: "Jalna", },
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Mahindra", model: "Bolero Pickup", year: 2021, price: 620000, kilometres: 38000, fuelType: "DIESEL", transmission: "MANUAL", engine: "1493 cc", owners: 1, color: "White", condition: "EXCELLENT", city: "Vaijapur", },
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Tata", model: "407 Truck", year: 2017, price: 720000, kilometres: 145000, fuelType: "DIESEL", transmission: "MANUAL", engine: "2956 cc", owners: 2, color: "Blue", condition: "AVERAGE", city: "Nashik", },
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Mahindra", model: "Jeeto", variant: "Minitruck", year: 2020, price: 410000, kilometres: 58000, fuelType: "DIESEL", transmission: "MANUAL", engine: "798 cc", owners: 1, color: "White", condition: "GOOD", city: "Pune", },
  { categorySlug: "commercial-vehicles", vehicleType: "COMMERCIAL", brand: "Eicher", model: "Pro 1049", year: 2018, price: 1150000, kilometres: 190000, fuelType: "DIESEL", transmission: "MANUAL", engine: "3298 cc", owners: 1, color: "White", condition: "GOOD", city: "Chhatrapati Sambhajinagar", },

  // Other vehicles
  { categorySlug: "other-vehicles", vehicleType: "OTHER", brand: "Mahindra", model: "Treo", variant: "Electric Auto", year: 2022, price: 245000, kilometres: 12000, fuelType: "ELECTRIC", transmission: "AUTOMATIC", owners: 1, color: "Yellow", condition: "EXCELLENT", city: "Chhatrapati Sambhajinagar", isFeatured: true },
  { categorySlug: "other-vehicles", vehicleType: "OTHER", brand: "Bajaj", model: "RE", variant: "Compact Auto", year: 2019, price: 175000, kilometres: 48000, fuelType: "CNG", transmission: "MANUAL", owners: 1, color: "Green", condition: "GOOD", city: "Jalna", },
  { categorySlug: "other-vehicles", vehicleType: "OTHER", brand: "Piaggio", model: "Ape Xtra", variant: "LDX", year: 2020, price: 210000, kilometres: 35000, fuelType: "DIESEL", transmission: "MANUAL", owners: 1, color: "White", condition: "GOOD", city: "Vaijapur", },
  { categorySlug: "other-vehicles", vehicleType: "OTHER", brand: "Mahindra", model: "Alfa Plus", year: 2021, price: 190000, kilometres: 22000, fuelType: "CNG", transmission: "MANUAL", owners: 1, color: "Silver", condition: "EXCELLENT", city: "Nashik", },
  { categorySlug: "other-vehicles", vehicleType: "OTHER", brand: "TVS", model: "King Deluxe", year: 2018, price: 155000, kilometres: 51000, fuelType: "PETROL", transmission: "MANUAL", owners: 2, color: "Black", condition: "AVERAGE", city: "Pune", },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sqlStr(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNum(value: number | null | undefined): string {
  return value === null || value === undefined ? "NULL" : String(value);
}

function sqlBool(value: boolean): string {
  return value ? "true" : "false";
}

async function main() {
  const usedSlugs = new Set<string>();
  const statements: string[] = [];

  statements.push(`-- Production client-demo catalog: ${CATALOG.length} vehicles across all categories.`);
  statements.push(`-- Generated by scripts/gen-production-catalog.ts — run in Supabase SQL Editor.`);
  statements.push(`BEGIN;`);
  statements.push("");

  let vehicleCount = 0;
  let imageCount = 0;

  for (const spec of CATALOG) {
    let base = slugify([spec.brand, spec.model, spec.variant ?? "", String(spec.year), spec.city].filter(Boolean).join(" "));
    if (!base) base = "vehicle";
    let slug = base;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${counter}`;
      counter += 1;
    }
    usedSlugs.add(slug);

    const vehicleId = randomUUID();
    const title = `${spec.brand} ${spec.model}${spec.variant ? " " + spec.variant : ""}`;
    const now = new Date().toISOString();

    const imageLabels = ["Front", "Side", "Interior"];
    const imageRows: { id: string; url: string; label: string }[] = [];
    for (const [i, label] of imageLabels.entries()) {
      const filename = `catalog-${slug}-${i}.svg`;
      const url = await generateDemoImage(filename, `${title} — ${label}`, spec.vehicleType, slug.length + i);
      imageRows.push({ id: randomUUID(), url, label });
    }

    const description = `${title} in ${spec.condition === "EXCELLENT" ? "excellent" : spec.condition === "GOOD" ? "good" : "average"} condition. ${spec.owners === 1 ? "Single owner, " : ""}well maintained${spec.owners === 1 ? " with complete service history" : ""}. Inspect at our yard before purchase.`;

    statements.push(`INSERT INTO "Vehicle" (
  id, slug, source, "listingType", status, "categoryId", "vehicleType",
  brand, model, variant, year, "registrationYear", "registrationNumber",
  price, "ownerExpectedPrice", "adminValuation", "negotiatedPrice", "isPriceNegotiable",
  kilometres, "fuelType", transmission, engine, mileage, owners, color, condition,
  location, city, state, description,
  "rcAvailable", "insuranceAvailable", "pucAvailable", "serviceHistoryAvailable", "hasLoan",
  "isFeatured", "isDemo", "approvedAt", "approvedById", "listedAt", "reservedAt", "soldAt",
  "sellerId", "submissionId", "createdAt", "updatedAt"
) VALUES (
  ${sqlStr(vehicleId)}, ${sqlStr(slug)}, 'BUSINESS_STOCK', 'BUSINESS_STOCK', 'LISTED',
  (SELECT id FROM "Category" WHERE slug = ${sqlStr(spec.categorySlug)}), ${sqlStr(spec.vehicleType)},
  ${sqlStr(spec.brand)}, ${sqlStr(spec.model)}, ${sqlStr(spec.variant)}, ${sqlNum(spec.year)}, NULL, NULL,
  ${sqlNum(spec.price)}, NULL, NULL, NULL, false,
  ${sqlNum(spec.kilometres)}, ${sqlStr(spec.fuelType)}, ${sqlStr(spec.transmission)}, ${sqlStr(spec.engine)}, ${sqlStr(spec.mileage)}, ${sqlNum(spec.owners)}, ${sqlStr(spec.color)}, ${sqlStr(spec.condition)},
  ${sqlStr(spec.city)}, ${sqlStr(spec.city)}, ${sqlStr(STATE)}, ${sqlStr(description)},
  true, true, true, ${sqlBool(spec.owners === 1)}, false,
  ${sqlBool(Boolean(spec.isFeatured))}, true, NULL, NULL, ${sqlStr(now)}, NULL, NULL,
  NULL, NULL, ${sqlStr(now)}, ${sqlStr(now)}
);`);

    for (const [i, row] of imageRows.entries()) {
      statements.push(`INSERT INTO "VehicleImage" (id, "vehicleId", url, "storageKey", "altText", "sortOrder", "isPrimary", "createdAt")
VALUES (${sqlStr(row.id)}, ${sqlStr(vehicleId)}, ${sqlStr(row.url)}, NULL, ${sqlStr(`${title} photo ${i + 1}`)}, ${i}, ${sqlBool(i === 0)}, ${sqlStr(now)});`);
      imageCount += 1;
    }

    statements.push("");
    vehicleCount += 1;
  }

  statements.push(`COMMIT;`);
  statements.push("");
  statements.push(`-- ${vehicleCount} vehicles, ${imageCount} images.`);

  console.log(statements.join("\n"));
  console.error(`[gen-production-catalog] Wrote images for ${vehicleCount} vehicles to public/demo-images/. SQL printed to stdout.`);
}

void main();
