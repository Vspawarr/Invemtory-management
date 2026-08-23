import type { Metadata } from "next";

import { requireSession } from "@/lib/server/require-session";
import { listFarmersForCropWizard } from "@/lib/server/dal/farmers";
import { listCropMasters } from "@/lib/server/dal/crop-master";
import { CropCreationWizard } from "@/components/crops/crop-creation-wizard";

export const metadata: Metadata = { title: "Add Crop — Champavati Agro" };

export default async function NewCropPage({
  searchParams,
}: {
  searchParams: Promise<{ farmerId?: string }>;
}) {
  const { farmerId } = await searchParams;
  const session = await requireSession();
  const [farmers, cropMasters] = await Promise.all([
    listFarmersForCropWizard(session),
    listCropMasters(),
  ]);

  const serializedFarmers = farmers.map((f) => ({
    id: f.id,
    fullName: f.fullName,
    village: f.village,
    landParcels: f.landParcels.map((p) => ({
      id: p.id,
      name: p.name,
      areaAcres: Number(p.areaAcres),
      village: p.village,
    })),
  }));

  const serializedCropMasters = cropMasters.map((c) => ({
    id: c.id,
    name: c.name,
    localName: c.localName,
    anchorType: c.anchorType,
    anchorLabel: c.anchorLabel,
    plantingWindows: c.plantingWindows.map((w) => ({
      plantingType: w.plantingType,
      startMonth: w.startMonth,
      endMonth: w.endMonth,
      label: w.label,
    })),
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Add crop</h1>
        <p className="text-sm text-muted-foreground">
          Start a new crop cycle and generate its expected lifecycle timeline.
        </p>
      </div>
      <CropCreationWizard
        farmers={serializedFarmers}
        cropMasters={serializedCropMasters}
        initialFarmerId={farmerId}
      />
    </div>
  );
}
