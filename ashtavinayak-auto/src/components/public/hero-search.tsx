"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VEHICLE_TYPE_OPTIONS } from "@/lib/vehicle-options";

export function HeroSearch() {
  const router = useRouter();
  const [type, setType] = useState<string>("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (brand) params.set("brand", brand);
    if (model) params.set("model", model);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (location) params.set("location", location);
    router.push(`/vehicles?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-xl border bg-card p-4 shadow-lg sm:grid-cols-2 lg:grid-cols-6"
    >
      <Select value={type} onValueChange={setType}>
        <SelectTrigger aria-label="Vehicle type">
          <SelectValue placeholder="Vehicle Type" />
        </SelectTrigger>
        <SelectContent>
          {VEHICLE_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Brand" />
      <Input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model" />
      <Input
        placeholder="Min Price"
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        aria-label="Minimum price"
      />
      <Input
        placeholder="Max Price"
        type="number"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        aria-label="Maximum price"
      />
      <div className="flex gap-2">
        <Input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Location"
        />
        <Button type="submit" size="icon" aria-label="Search" className="shrink-0">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
