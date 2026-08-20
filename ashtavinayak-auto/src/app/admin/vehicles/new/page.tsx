import { prisma } from "@/lib/prisma";
import { VehicleForm } from "@/components/forms/vehicle-form";

export const metadata = { title: "Add Vehicle" };

export default async function NewVehiclePage() {
  const [categories, features] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.feature.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Business Stock Vehicle</h1>
        <p className="text-sm text-muted-foreground">
          Vehicles added here are owned/held by Ashtavinayak Auto Consultant directly.
        </p>
      </div>
      <VehicleForm categories={categories} features={features} />
    </div>
  );
}
