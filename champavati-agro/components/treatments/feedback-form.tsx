"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createFeedbackAction } from "@/lib/server/actions/treatments";

export function FeedbackForm({
  treatmentResultId,
  cropId,
  basePath = "/admin",
}: {
  treatmentResultId: string;
  cropId: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(4);
  const [satisfied, setSatisfied] = useState(true);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const result = await createFeedbackAction({ treatmentResultId, rating, satisfied, comments });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Feedback recorded.");
    router.push(`${basePath}/crops/${cropId}`);
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-1.5">
          <Label id="feedback-rating-label">Rating</Label>
          <div className="flex gap-1" role="radiogroup" aria-labelledby="feedback-rating-label">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={n === rating}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                onClick={() => setRating(n)}
              >
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    n <= rating ? "fill-warmyellow-500 text-warmyellow-500" : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="feedback-satisfied" className="text-sm font-medium">
            Farmer satisfied
          </Label>
          <Switch id="feedback-satisfied" checked={satisfied} onCheckedChange={setSatisfied} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="feedback-comments">Comments</Label>
          <Textarea id="feedback-comments" value={comments} onChange={(e) => setComments(e.target.value)} />
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
