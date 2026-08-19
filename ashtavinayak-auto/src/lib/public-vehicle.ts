import type { Prisma } from "@prisma/client";

/**
 * The ONLY select shape allowed on public-facing vehicle queries.
 *
 * Deliberately omitted (private):
 *   ownerExpectedPrice, adminValuation, negotiatedPrice,
 *   registrationNumber, seller (PII), submission (admin workflow data),
 *   approvedById.
 */
export const PUBLIC_VEHICLE_SELECT = {
  id: true,
  slug: true,
  source: true,
  listingType: true,
  status: true,
  vehicleType: true,
  brand: true,
  model: true,
  variant: true,
  year: true,
  registrationYear: true,
  price: true,
  isPriceNegotiable: true,
  kilometres: true,
  fuelType: true,
  transmission: true,
  engine: true,
  mileage: true,
  owners: true,
  color: true,
  condition: true,
  location: true,
  city: true,
  state: true,
  description: true,
  rcAvailable: true,
  insuranceAvailable: true,
  pucAvailable: true,
  serviceHistoryAvailable: true,
  hasLoan: true,
  isFeatured: true,
  isDemo: true,
  listedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, altText: true, sortOrder: true, isPrimary: true },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] as const,
  },
  features: { select: { feature: { select: { id: true, name: true } } } },
} satisfies Prisma.VehicleSelect;

/** Vehicles that may appear publicly: LISTED normally, RESERVED with a badge. */
export const PUBLIC_VEHICLE_STATUSES = ["LISTED", "RESERVED"] as const;

export type PublicVehicle = Prisma.VehicleGetPayload<{ select: typeof PUBLIC_VEHICLE_SELECT }>;

export function vehicleTitle(v: {
  year: number;
  brand: string;
  model: string;
  variant?: string | null;
}): string {
  return [v.year, v.brand, v.model, v.variant].filter(Boolean).join(" ");
}
