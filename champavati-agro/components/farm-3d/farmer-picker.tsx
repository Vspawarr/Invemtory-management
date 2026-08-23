"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FarmerPicker({
  farmers,
  selectedFarmerId,
}: {
  farmers: { id: string; fullName: string; village: string }[];
  selectedFarmerId: string;
}) {
  const router = useRouter();

  return (
    <Select value={selectedFarmerId} onValueChange={(id) => router.push(`/admin/farm-3d?farmerId=${id}`)}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select a farmer" />
      </SelectTrigger>
      <SelectContent>
        {farmers.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.fullName} — {f.village}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
