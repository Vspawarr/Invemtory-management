import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateVehicleSlug(parts: {
  brand: string;
  model: string;
  variant?: string | null;
  year: number;
  city: string;
}): Promise<string> {
  const base = slugify(
    [parts.brand, parts.model, parts.variant ?? "", String(parts.year), parts.city]
      .filter(Boolean)
      .join(" ")
  );
  let slug = base || "vehicle";
  let counter = 2;
  while (await prisma.vehicle.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}
