import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { requireSession } from "@/lib/server/require-session";
import { getCropById } from "@/lib/server/dal/crops";
import { listActiveProducts } from "@/lib/server/dal/products";
import { RecommendationForm } from "@/components/treatments/recommendation-form";

export const metadata: Metadata = { title: "Recommend Product — Champavati Agro" };

export default async function NewRecommendationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const crop = await getCropById(session, id);
  if (!crop) notFound();
  const rawProducts = await listActiveProducts();
  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: { name: p.category.name },
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Recommend a product</h1>
        <p className="text-sm text-muted-foreground">
          {crop.cropMaster.name} — {crop.farmer.fullName}
        </p>
      </div>
      <RecommendationForm cropId={crop.id} products={products} />
    </div>
  );
}
