import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

import { ComingSoon } from "@/components/common/coming-soon";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Reports — Champavati Agro" };

export default function ReportsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Reports &amp; Exports"
      description="Downloadable farmer, crop, treatment, and product-effectiveness reports are planned for a future release. In the meantime, the Dashboard, Crops, and Treatments pages give you the same underlying data live."
      cta={
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/treatments">View treatments</Link>
          </Button>
        </div>
      }
    />
  );
}
