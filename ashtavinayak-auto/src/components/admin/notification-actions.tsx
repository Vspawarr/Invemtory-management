"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/notifications";

export function MarkReadButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markNotificationRead(id);
          router.refresh();
        })
      }
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      Mark read
    </Button>
  );
}

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await markAllNotificationsRead();
          if (result.ok) toast.success("All notifications marked read.");
          router.refresh();
        })
      }
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
      Mark all read
    </Button>
  );
}
