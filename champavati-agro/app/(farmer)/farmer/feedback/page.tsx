import type { Metadata } from "next";
import { format } from "date-fns";
import { MessageSquareHeart, Star } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { listFeedback } from "@/lib/server/dal/treatments";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Feedback — Champavati Agro" };

export default async function FarmerFeedbackPage() {
  const session = await requireSession();
  const feedback = await listFeedback(session);

  return (
    <div className="space-y-4 p-4">
      <h1 className="font-display text-xl font-semibold">My feedback</h1>

      {feedback.length === 0 ? (
        <EmptyState
          icon={MessageSquareHeart}
          title="No feedback yet"
          description="Feedback you share after a treatment will appear here."
        />
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => (
            <Card key={f.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {f.treatmentResult.application.recommendation.product.name}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "size-3.5",
                          n <= f.rating ? "fill-warmyellow-500 text-warmyellow-500" : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.treatmentResult.application.recommendation.crop.cropMaster.name} ·{" "}
                  {format(f.createdAt, "d MMM yyyy")}
                </p>
                {f.comments && <p className="mt-2 text-sm">{f.comments}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
