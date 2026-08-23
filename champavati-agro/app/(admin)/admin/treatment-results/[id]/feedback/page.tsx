import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { requireSession } from "@/lib/server/require-session";
import { assertRecordAccess } from "@/lib/server/auth-guards";
import { prisma } from "@/lib/prisma";
import { FeedbackForm } from "@/components/treatments/feedback-form";

export const metadata: Metadata = { title: "Record Feedback — Champavati Agro" };

export default async function TreatmentFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const treatmentResult = await prisma.treatmentResult.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          recommendation: {
            include: { product: true, crop: { include: { farmer: true, cropMaster: true } } },
          },
        },
      },
    },
  });
  if (!treatmentResult) notFound();
  assertRecordAccess(session, treatmentResult.application.recommendation.crop);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Record farmer feedback</h1>
        <p className="text-sm text-muted-foreground">
          {treatmentResult.application.recommendation.product.name} for{" "}
          {treatmentResult.application.recommendation.crop.cropMaster.name} —{" "}
          {treatmentResult.application.recommendation.crop.farmer.fullName}
        </p>
      </div>
      <FeedbackForm
        treatmentResultId={treatmentResult.id}
        cropId={treatmentResult.application.recommendation.crop.id}
      />
    </div>
  );
}
