"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCallbackStatus } from "@/actions/enquiries";
import { CALLBACK_STATUS_OPTIONS } from "@/lib/vehicle-options";
import type { CallbackStatus } from "@prisma/client";

export function CallbackStatusSelect({ id, status }: { id: string; status: CallbackStatus }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) =>
        startTransition(async () => {
          const result = await updateCallbackStatus(id, value as CallbackStatus);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Status updated.");
          router.refresh();
        })
      }
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CALLBACK_STATUS_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
