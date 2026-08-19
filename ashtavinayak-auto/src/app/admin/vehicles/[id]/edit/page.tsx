import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { ExistingImagesPanel } from "@/components/admin/existing-images-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit Vehicle" };

export default async function EditVehiclePage({ params }: PageProps<"/admin/vehicles/[id]/edit">) {
  const { id } = await params;

  const [vehicle, categories, features] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, features: true },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.feature.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!vehicle) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Edit {vehicle.brand} {vehicle.model}
        </h1>
        <p className="text-sm text-muted-foreground">
          Source: {vehicle.source === "BUSINESS_STOCK" ? "Business Stock" : "Customer Submitted"}
        </p>
      </div>

      {vehicle.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <ExistingImagesPanel images={vehicle.images} />
          </CardContent>
        </Card>
      )}

      <VehicleForm
        vehicleId={vehicle.id}
        categories={categories}
        features={features}
        existingImages={vehicle.images}
        defaultValues={{
          categoryId: vehicle.categoryId,
          vehicleType: vehicle.vehicleType,
          brand: vehicle.brand,
          model: vehicle.model,
          variant: vehicle.variant ?? "",
          year: vehicle.year,
          registrationYear: vehicle.registrationYear ?? undefined,
          registrationNumber: vehicle.registrationNumber ?? "",
          price: vehicle.price,
          ownerExpectedPrice: vehicle.ownerExpectedPrice ?? undefined,
          adminValuation: vehicle.adminValuation ?? undefined,
          negotiatedPrice: vehicle.negotiatedPrice ?? undefined,
          isPriceNegotiable: vehicle.isPriceNegotiable,
          kilometres: vehicle.kilometres,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission ?? undefined,
          engine: vehicle.engine ?? "",
          mileage: vehicle.mileage ?? "",
          owners: vehicle.owners ?? undefined,
          color: vehicle.color ?? "",
          condition: vehicle.condition ?? undefined,
          location: vehicle.location ?? "",
          city: vehicle.city,
          state: vehicle.state ?? "",
          description: vehicle.description ?? "",
          rcAvailable: vehicle.rcAvailable,
          insuranceAvailable: vehicle.insuranceAvailable,
          pucAvailable: vehicle.pucAvailable,
          serviceHistoryAvailable: vehicle.serviceHistoryAvailable,
          hasLoan: vehicle.hasLoan,
          isFeatured: vehicle.isFeatured,
          featureIds: vehicle.features.map((f) => f.featureId),
        }}
      />
    </div>
  );
}
