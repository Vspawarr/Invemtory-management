"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Copy, Star, StarOff, BadgeCheck, Ban, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  publishVehicle,
  reserveVehicle,
  markVehicleSold,
  archiveVehicle,
  toggleFeaturedVehicle,
  duplicateVehicle,
  deleteVehicle,
} from "@/actions/vehicles";
import type { ActionResult } from "@/actions/auth";

export function VehicleRowActions({
  id,
  status,
  isFeatured,
}: {
  id: string;
  status: string;
  isFeatured: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const run = <T,>(fn: () => Promise<ActionResult<T>>, successMessage: string) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/admin/vehicles/${id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status !== "LISTED" && (
            <DropdownMenuItem onClick={() => run(() => publishVehicle(id), "Vehicle published.")}>
              <BadgeCheck className="h-4 w-4" /> Publish
            </DropdownMenuItem>
          )}
          {status === "LISTED" && (
            <DropdownMenuItem onClick={() => run(() => reserveVehicle(id), "Marked as reserved.")}>
              <Ban className="h-4 w-4" /> Mark Reserved
            </DropdownMenuItem>
          )}
          {(status === "LISTED" || status === "RESERVED") && (
            <DropdownMenuItem onClick={() => run(() => markVehicleSold(id), "Marked as sold.")}>
              <BadgeCheck className="h-4 w-4" /> Mark Sold
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() =>
              run(() => toggleFeaturedVehicle(id, !isFeatured), isFeatured ? "Removed from featured." : "Added to featured.")
            }
          >
            {isFeatured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
            {isFeatured ? "Unfeature" : "Feature"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run(() => duplicateVehicle(id), "Vehicle duplicated.")}>
            <Copy className="h-4 w-4" /> Duplicate
          </DropdownMenuItem>
          {status !== "ARCHIVED" && (
            <DropdownMenuItem onClick={() => run(() => archiveVehicle(id), "Vehicle archived.")}>
              <Archive className="h-4 w-4" /> Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <div className="px-1">
            <DeleteButton
              id={id}
              action={deleteVehicle}
              label="Delete"
              title="Delete this vehicle?"
              description="This permanently removes the vehicle and its photos."
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
