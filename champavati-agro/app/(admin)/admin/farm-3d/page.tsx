import type { Metadata } from "next";
import { Box } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Digital Farm — Champavati Agro" };

export default function DigitalFarmPage() {
  return (
    <ComingSoon
      icon={Box}
      title="Interactive Digital Farm"
      description="A 3D view of every field, crop, and its health at a glance is planned for a future release. Until then, the Crops list and each Crop 360° page give you the same information in full detail."
      cta={
        <Button asChild variant="outline">
          <Link href="/admin/crops">View all crops</Link>
        </Button>
      }
    />
  );
}
