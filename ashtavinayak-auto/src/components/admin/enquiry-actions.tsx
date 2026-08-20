"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateEnquiryStatus, saveEnquiryNotes } from "@/actions/enquiries";
import { ENQUIRY_STATUS_OPTIONS } from "@/lib/vehicle-options";
import type { EnquiryStatus } from "@prisma/client";

export function EnquiryStatusSelect({ id, status }: { id: string; status: EnquiryStatus }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Select
      value={status}
      onValueChange={(value) =>
        startTransition(async () => {
          const result = await updateEnquiryStatus(id, value as EnquiryStatus);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Status updated.");
          router.refresh();
        })
      }
      disabled={isPending}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ENQUIRY_STATUS_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EnquiryNotesForm({ id, initialNotes }: { id: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await saveEnquiryNotes(id, notes);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Notes saved.");
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="enquiry-notes">Internal Notes (never shown publicly)</Label>
      <Textarea id="enquiry-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button size="sm" variant="secondary" onClick={save} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Notes
      </Button>
    </div>
  );
}
