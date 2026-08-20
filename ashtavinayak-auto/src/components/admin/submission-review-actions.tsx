"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  markSubmissionUnderReview,
  requestMoreInformation,
  rejectSubmission,
} from "@/actions/submissions";

const REJECTION_REASONS = [
  "Incomplete information",
  "Duplicate submission",
  "Unsuitable vehicle",
  "Invalid information",
  "Business decision",
  "Other",
];

export function SubmissionReviewActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const markUnderReview = () => {
    startTransition(async () => {
      const result = await markSubmissionUnderReview(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Marked as under review.");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING_REVIEW" && (
        <Button variant="secondary" onClick={markUnderReview} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Mark Under Review
        </Button>
      )}
      <RequestMoreInfoDialog id={id} />
      <RejectDialog id={id} />
    </div>
  );
}

function RequestMoreInfoDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    startTransition(async () => {
      const result = await requestMoreInformation(id, message);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Requested more information from the seller.");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Request More Information</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request More Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="more-info-message">Message to seller</Label>
          <Textarea
            id="more-info-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please upload clear photographs of the dashboard and provide insurance validity."
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !message.trim()}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    const finalReason = reason === "Other" ? customReason : reason;
    startTransition(async () => {
      const result = await rejectSubmission(id, finalReason);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Submission rejected.");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Reject</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Submission</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reason === "Other" && (
            <Textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe the reason"
            />
          )}
          <p className="text-xs text-muted-foreground">
            This reason is stored internally only and is never shown publicly.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={isPending || (reason === "Other" && !customReason.trim())}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
