import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PUBLIC_VEHICLE_SELECT, PUBLIC_VEHICLE_STATUSES } from "@/lib/public-vehicle";

export const PAGE_SIZE = 12;

export interface VehicleSearchParams {
  type?: string;
  category?: string;
  brand?: string;
  model?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  fuel?: string;
  transmission?: string;
  minKm?: string;
  maxKm?: string;
  location?: string;
  condition?: string;
  sort?: string;
  page?: string;
}

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function buildVehicleWhere(params: VehicleSearchParams): Prisma.VehicleWhereInput {
  const minPrice = toInt(params.minPrice);
  const maxPrice = toInt(params.maxPrice);
  const minYear = toInt(params.minYear);
  const maxYear = toInt(params.maxYear);
  const minKm = toInt(params.minKm);
  const maxKm = toInt(params.maxKm);

  const where: Prisma.VehicleWhereInput = {
    status: { in: [...PUBLIC_VEHICLE_STATUSES] },
  };

  if (params.type) where.vehicleType = params.type as Prisma.EnumVehicleTypeFilter["equals"];
  if (params.category) where.category = { slug: params.category };
  if (params.brand) where.brand = { equals: params.brand, mode: "insensitive" };
  if (params.model) where.model = { contains: params.model, mode: "insensitive" };
  if (params.fuel) where.fuelType = params.fuel as Prisma.EnumFuelTypeFilter["equals"];
  if (params.transmission) where.transmission = params.transmission as Prisma.EnumTransmissionNullableFilter["equals"];
  if (params.condition) where.condition = params.condition as Prisma.EnumConditionNullableFilter["equals"];
  if (params.location) where.city = { equals: params.location, mode: "insensitive" };

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) };
  }
  if (minYear !== undefined || maxYear !== undefined) {
    where.year = { ...(minYear !== undefined ? { gte: minYear } : {}), ...(maxYear !== undefined ? { lte: maxYear } : {}) };
  }
  if (minKm !== undefined || maxKm !== undefined) {
    where.kilometres = { ...(minKm !== undefined ? { gte: minKm } : {}), ...(maxKm !== undefined ? { lte: maxKm } : {}) };
  }

  if (params.q) {
    where.OR = [
      { brand: { contains: params.q, mode: "insensitive" } },
      { model: { contains: params.q, mode: "insensitive" } },
      { variant: { contains: params.q, mode: "insensitive" } },
      { city: { contains: params.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildOrderBy(sort: string | undefined): Prisma.VehicleOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "year_desc":
      return { year: "desc" };
    case "km_asc":
      return { kilometres: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export async function searchVehicles(params: VehicleSearchParams) {
  const page = Math.max(1, toInt(params.page) ?? 1);
  const where = buildVehicleWhere(params);
  const orderBy = buildOrderBy(params.sort);

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      select: PUBLIC_VEHICLE_SELECT,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
