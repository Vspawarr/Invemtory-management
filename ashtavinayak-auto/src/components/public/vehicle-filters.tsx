"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  VEHICLE_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  CONDITION_OPTIONS,
} from "@/lib/vehicle-options";

const ALL = "__all__";

function FilterFields({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Vehicle Type</Label>
        <Select value={values.type || ALL} onValueChange={(v) => onChange("type", v === ALL ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any</SelectItem>
            {VEHICLE_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Brand</Label>
        <Input value={values.brand || ""} onChange={(e) => onChange("brand", e.target.value)} placeholder="e.g. Maruti" />
      </div>
      <div className="space-y-1.5">
        <Label>Model</Label>
        <Input value={values.model || ""} onChange={(e) => onChange("model", e.target.value)} placeholder="e.g. Swift" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Min Price</Label>
          <Input type="number" value={values.minPrice || ""} onChange={(e) => onChange("minPrice", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Max Price</Label>
          <Input type="number" value={values.maxPrice || ""} onChange={(e) => onChange("maxPrice", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Year From</Label>
          <Input type="number" value={values.minYear || ""} onChange={(e) => onChange("minYear", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Year To</Label>
          <Input type="number" value={values.maxYear || ""} onChange={(e) => onChange("maxYear", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Fuel</Label>
        <Select value={values.fuel || ALL} onValueChange={(v) => onChange("fuel", v === ALL ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any</SelectItem>
            {FUEL_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Transmission</Label>
        <Select value={values.transmission || ALL} onValueChange={(v) => onChange("transmission", v === ALL ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any</SelectItem>
            {TRANSMISSION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Min KM</Label>
          <Input type="number" value={values.minKm || ""} onChange={(e) => onChange("minKm", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Max KM</Label>
          <Input type="number" value={values.maxKm || ""} onChange={(e) => onChange("maxKm", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Location</Label>
        <Input value={values.location || ""} onChange={(e) => onChange("location", e.target.value)} placeholder="City" />
      </div>
      <div className="space-y-1.5">
        <Label>Condition</Label>
        <Select value={values.condition || ALL} onValueChange={(v) => onChange("condition", v === ALL ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any</SelectItem>
            {CONDITION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function VehicleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = Object.fromEntries(searchParams.entries());
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [open, setOpen] = useState(false);

  const onChange = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const apply = () => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value);
    });
    router.push(`/vehicles?${params.toString()}`);
    setOpen(false);
  };

  const clear = () => {
    setValues({});
    router.push("/vehicles");
    setOpen(false);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Filters</h2>
            <Button variant="ghost" size="sm" onClick={clear}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
          <FilterFields values={values} onChange={onChange} />
          <Button onClick={apply} className="w-full">Apply Filters</Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetTitle>Filters</SheetTitle>
            <div className="mt-4">
              <FilterFields values={values} onChange={onChange} />
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={clear} className="flex-1">Clear</Button>
              <Button onClick={apply} className="flex-1">Apply</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
