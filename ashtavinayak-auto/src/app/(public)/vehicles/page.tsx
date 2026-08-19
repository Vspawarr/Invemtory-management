import type { Metadata } from "next";
import { searchVehicles, type VehicleSearchParams } from "@/lib/queries/vehicles";
import { VehicleFilters } from "@/components/public/vehicle-filters";
import { VehicleCard } from "@/components/public/vehicle-card";
import { PublicPagination } from "@/components/public/public-pagination";
import { EmptyState } from "@/components/public/empty-state";
import { SortSelect } from "@/components/public/sort-select";

export const metadata: Metadata = {
  title: "Buy Vehicles",
  description: "Browse quality used cars, bikes, scooters, buses and commercial vehicles.",
};

export default async function VehiclesPage({ searchParams }: PageProps<"/vehicles">) {
  const params = (await searchParams) as Record<string, string | undefined>;
  const result = await searchVehicles(params as VehicleSearchParams);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buy Vehicles</h1>
        <p className="text-sm text-muted-foreground">{result.total} vehicle(s) found</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <VehicleFilters />

        <div className="flex-1 space-y-6">
          <div className="flex justify-end">
            <SortSelect current={params.sort} />
          </div>

          {result.vehicles.length === 0 ? (
            <EmptyState
              title="No vehicles found"
              description="Try adjusting your filters or check back soon for new listings."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}

          <PublicPagination page={result.page} totalPages={result.totalPages} searchParams={params} />
        </div>
      </div>
    </div>
  );
}
