import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PUBLIC_VEHICLE_SELECT } from "@/lib/public-vehicle";
import { VehicleCard } from "@/components/public/vehicle-card";
import { EmptyState } from "@/components/public/empty-state";

export const metadata = { title: "Saved Vehicles" };

export default async function AccountFavouritesPage() {
  const user = await requireUser();

  const favourites = await prisma.favourite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { vehicle: { select: PUBLIC_VEHICLE_SELECT } },
  });

  if (favourites.length === 0) {
    return (
      <EmptyState
        title="No saved vehicles yet"
        description="Tap the heart icon on any vehicle to save it here for later."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {favourites.map(({ vehicle }) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
