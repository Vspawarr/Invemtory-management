import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { requireSession } from "@/lib/server/require-session";
import { assertRecordAccess } from "@/lib/server/auth-guards";
import { prisma } from "@/lib/prisma";
import { TreatmentResultForm } from "@/components/treatments/treatment-result-form";

export const metadata: Metadata = { title: "Record Treatment Result — Champavati Agro" };

export default async function TreatmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      recommendation: {
        include: { product: true, crop: { include: { farmer: true, cropMaster: true } } },
      },
    },
  });
  if (!application) notFound();
  assertRecordAccess(session, application.recommendation.crop);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Record treatment result</h1>
        <p className="text-sm text-muted-foreground">
          {application.recommendation.product.name} for {application.recommendation.crop.cropMaster.name} —{" "}
          {application.recommendation.crop.farmer.fullName}
        </p>
      </div>
      <TreatmentResultForm applicationId={application.id} cropId={application.recommendation.crop.id} />
    </div>
  );
}
