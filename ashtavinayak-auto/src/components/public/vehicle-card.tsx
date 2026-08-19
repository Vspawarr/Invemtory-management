import Link from "next/link";
import { Gauge, Fuel, Cog, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppImage } from "@/components/app-image";
import { VehicleStatusBadge } from "@/components/public/status-badge";
import { formatPrice, formatNumber } from "@/lib/utils";
import type { PublicVehicle } from "@/lib/public-vehicle";

export function VehicleCard({ vehicle }: { vehicle: PublicVehicle }) {
  const primary = vehicle.images[0];
  return (
    <Link href={`/vehicles/${vehicle.slug}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {primary ? (
            <AppImage
              src={primary.url}
              alt={primary.altText || `${vehicle.brand} ${vehicle.model}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No photo
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1">
            {vehicle.isFeatured && <Badge variant="accent">Featured</Badge>}
            {vehicle.isDemo && <Badge variant="secondary">Demo</Badge>}
          </div>
          <div className="absolute right-2 top-2">
            <VehicleStatusBadge status={vehicle.status} />
          </div>
        </div>
        <CardContent className="space-y-2 p-4">
          <h3 className="line-clamp-1 font-semibold">
            {vehicle.year} {vehicle.brand} {vehicle.model} {vehicle.variant}
          </h3>
          <p className="text-lg font-bold text-primary">{formatPrice(vehicle.price)}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> {formatNumber(vehicle.kilometres)} km
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" /> {vehicle.fuelType}
            </span>
            {vehicle.transmission && (
              <span className="flex items-center gap-1">
                <Cog className="h-3.5 w-3.5" /> {vehicle.transmission}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {vehicle.city}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
