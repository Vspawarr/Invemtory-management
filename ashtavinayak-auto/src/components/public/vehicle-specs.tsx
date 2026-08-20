import { formatNumber } from "@/lib/utils";
import { FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS, CONDITION_OPTIONS } from "@/lib/vehicle-options";
import type { PublicVehicle } from "@/lib/public-vehicle";

function label(options: readonly { value: string; label: string }[], value?: string | null) {
  return options.find((o) => o.value === value)?.label ?? value;
}

type SpecValue = string | number | null | undefined;

export function VehicleSpecs({ vehicle }: { vehicle: PublicVehicle }) {
  const allRows: [string, SpecValue][] = [
    ["Brand", vehicle.brand],
    ["Model", vehicle.model],
    ["Variant", vehicle.variant],
    ["Year", vehicle.year],
    ["Registration Year", vehicle.registrationYear],
    ["Engine", vehicle.engine],
    ["Fuel", label(FUEL_TYPE_OPTIONS, vehicle.fuelType)],
    ["Transmission", label(TRANSMISSION_OPTIONS, vehicle.transmission)],
    ["Mileage", vehicle.mileage],
    ["KM Driven", formatNumber(vehicle.kilometres)],
    ["Owners", vehicle.owners ? `${vehicle.owners}${vehicle.owners === 1 ? "st" : "th"}` : null],
    ["Colour", vehicle.color],
    ["Condition", label(CONDITION_OPTIONS, vehicle.condition)],
    ["Location", vehicle.city],
  ];
  const rows = allRows.filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
