import Link from "next/link";
import { Activity, CalendarClock, MessageSquareText, Plus, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddLandDialog } from "@/components/farmers/add-land-dialog";
import { AddFollowupDialog } from "@/components/followups/add-followup-dialog";
import { ActionPickerDialog, type PickerItem } from "@/components/common/action-picker-dialog";

/**
 * The six Farmer 360° quick actions. Add Land and Schedule Follow-up are
 * real inline dialogs. Add Crop is the existing crop-wizard link. Record
 * Health, Recommend Product, and Record Feedback are inherently scoped to a
 * specific crop or treatment result in the data model (never "any farmer"),
 * so they open a picker naming the farmer's real crops/treatments and route
 * straight into the SAME existing Crop 360° forms — never a duplicate form.
 */
export function FarmerQuickActions({
  farmerId,
  village,
  activeCrops,
  pendingFeedback,
}: {
  farmerId: string;
  village: string;
  activeCrops: { id: string; label: string }[];
  pendingFeedback: { id: string; label: string; sublabel: string }[];
}) {
  const cropPickerItems: PickerItem[] = activeCrops.map((c) => ({
    id: c.id,
    label: c.label,
    href: `/admin/crops/${c.id}`,
  }));
  const recommendPickerItems: PickerItem[] = activeCrops.map((c) => ({
    id: c.id,
    label: c.label,
    href: `/admin/crops/${c.id}/recommendations/new`,
  }));
  const feedbackPickerItems: PickerItem[] = pendingFeedback.map((f) => ({
    id: f.id,
    label: f.label,
    sublabel: f.sublabel,
    href: `/admin/treatment-results/${f.id}/feedback`,
  }));

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" asChild>
        <Link href={`/admin/crops/new?farmerId=${farmerId}`}>
          <Plus className="size-4" /> Add crop
        </Link>
      </Button>
      <AddLandDialog farmerId={farmerId} defaultVillage={village} />
      <ActionPickerDialog
        triggerLabel="Record health"
        triggerIcon={<Activity className="size-4" />}
        title="Record health for which crop?"
        items={cropPickerItems}
        emptyMessage="No active crops to record health for"
      />
      <ActionPickerDialog
        triggerLabel="Recommend product"
        triggerIcon={<Stethoscope className="size-4" />}
        title="Recommend a product for which crop?"
        items={recommendPickerItems}
        emptyMessage="No active crops to recommend for"
      />
      <AddFollowupDialog
        defaultFarmerId={farmerId}
        crops={activeCrops}
        trigger={
          <Button size="sm" variant="outline">
            <CalendarClock className="size-4" /> Schedule follow-up
          </Button>
        }
      />
      <ActionPickerDialog
        triggerLabel="Record feedback"
        triggerIcon={<MessageSquareText className="size-4" />}
        title="Record feedback for which treatment?"
        description="Only treatments awaiting farmer feedback are listed."
        items={feedbackPickerItems}
        emptyMessage="No treatments awaiting feedback"
      />
    </div>
  );
}
