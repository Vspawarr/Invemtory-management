import Link from "next/link";
import type { Metadata } from "next";
import { Sprout } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { listCropsForCurrentUser } from "@/lib/server/dal/crops";
import { confirmedCurrentStageStatus, isStatusConcerning } from "@/lib/server/crop-timeline/rules";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "My Crops — Champavati Agro" };

export default async function FarmerCropsPage() {
  const session = await requireSession();
  const crops = await listCropsForCurrentUser(session);
  const today = new Date();

  return (
    <div className="space-y-4 p-4">
      <h1 className="font-display text-xl font-semibold">My crops</h1>

      {crops.length === 0 ? (
        <EmptyState icon={Sprout} title="No crops yet" description="Your crops will appear here." />
      ) : (
        <div className="space-y-3">
          {crops.map((crop) => (
            <Link key={crop.id} href={`/farmer/crops/${crop.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-medium">
                      {crop.cropMaster.name}
                      {crop.variety ? ` — ${crop.variety}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {crop.landParcel.name} · {Number(crop.areaAcres).toFixed(2)} acres
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{crop.currentStage?.stageNameSnapshot ?? "—"}</Badge>
                    {crop.currentStage && isStatusConcerning(confirmedCurrentStageStatus(crop.currentStage, today)) && (
                      <Badge variant="warning" className="text-[10px]">
                        Review
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
