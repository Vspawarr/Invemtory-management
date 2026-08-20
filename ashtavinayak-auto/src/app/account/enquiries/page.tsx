import Link from "next/link";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/public/empty-state";
import { ENQUIRY_STATUS_LABELS } from "@/lib/vehicle-options";

export const metadata = { title: "My Enquiries" };

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "destructive" | "secondary"> = {
  NEW: "warning",
  CONTACTED: "secondary",
  FOLLOW_UP: "secondary",
  INTERESTED: "success",
  CLOSED: "muted",
  NOT_INTERESTED: "destructive",
};

export default async function AccountEnquiriesPage() {
  const user = await requireUser();

  const enquiries = await prisma.enquiry.findMany({
    where: { userId: user.id },
    include: { vehicle: { select: { slug: true, brand: true, model: true, year: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (enquiries.length === 0) {
    return (
      <EmptyState
        title="No enquiries yet"
        description="Enquiries you send from a vehicle page will show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {enquiries.map((e) => (
        <Card key={e.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                {e.vehicle ? (
                  <Link href={`/vehicles/${e.vehicle.slug}`} className="hover:underline">
                    {e.vehicle.year} {e.vehicle.brand} {e.vehicle.model}
                  </Link>
                ) : (
                  "General enquiry"
                )}
              </p>
              {e.message && <p className="mt-1 text-sm text-muted-foreground">{e.message}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{format(e.createdAt, "dd MMM yyyy, HH:mm")}</p>
            </div>
            <Badge variant={STATUS_VARIANT[e.status] ?? "secondary"}>{ENQUIRY_STATUS_LABELS[e.status]}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
