import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLIC_VEHICLE_STATUSES } from "@/lib/public-vehicle";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [vehicles, categories] = await Promise.all([
    prisma.vehicle.findMany({
      where: { status: { in: [...PUBLIC_VEHICLE_STATUSES] } },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/vehicles`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/sell-your-vehicle`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/vehicles?type=${c.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const vehicleRoutes: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${siteUrl}/vehicles/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...vehicleRoutes];
}
