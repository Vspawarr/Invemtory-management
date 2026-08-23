import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { MessageSquareHeart, Star } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { listFeedback } from "@/lib/server/dal/treatments";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Feedback — Champavati Agro" };

export default async function FeedbackPage() {
  const session = await requireSession();
  const feedback = await listFeedback(session);
  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Farmer feedback</h1>
        <p className="text-sm text-muted-foreground">
          {feedback.length} responses{avgRating ? ` · Average rating ${avgRating}/5` : ""}
        </p>
      </div>

      {feedback.length === 0 ? (
        <EmptyState
          icon={MessageSquareHeart}
          title="No feedback recorded yet"
          description="Feedback recorded against treatment results will appear here."
        />
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => (
            <div key={f.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <Link href={`/admin/farmers/${f.farmer.id}`} className="text-sm font-medium hover:underline">
                  {f.farmer.fullName}
                </Link>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        "size-4",
                        n <= f.rating ? "fill-warmyellow-500 text-warmyellow-500" : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {f.treatmentResult.application.recommendation.product.name} on{" "}
                {f.treatmentResult.application.recommendation.crop.cropMaster.name} ·{" "}
                {format(f.createdAt, "d MMM yyyy")}
              </p>
              {f.comments && <p className="mt-2 text-sm">{f.comments}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
