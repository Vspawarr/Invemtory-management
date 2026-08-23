import type { Metadata } from "next";
import { format } from "date-fns";
import { Download } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import {
  getFarmerActivityReport,
  getCropStatusReport,
  getTreatmentOutcomesReport,
  getProductEffectivenessReport,
} from "@/lib/server/dal/reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CropsByStatusChart } from "@/components/dashboard/crops-by-status-chart";
import { TreatmentOutcomesChart } from "@/components/dashboard/treatment-outcomes-chart";
import { ProductSuccessChart } from "@/components/reports/product-success-chart";

export const metadata: Metadata = { title: "Reports & Exports — Champavati Agro" };

function ExportButton({ report, filename }: { report: string; filename: string }) {
  return (
    <Button asChild size="sm" variant="outline">
      <a href={`/api/reports/${report}`} download={filename}>
        <Download className="size-4" /> Export CSV
      </a>
    </Button>
  );
}

const CROP_STATUS_TONE: Record<string, "success" | "warning" | "muted"> = {
  PLANNED: "muted",
  SEEDED: "muted",
  GROWING: "success",
  FLOWERING: "success",
  DEVELOPMENT: "success",
  HARVEST_READY: "warning",
  HARVESTED: "muted",
  COMPLETED: "muted",
  FAILED: "warning",
  CANCELLED: "muted",
};

const RESULT_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  EXCELLENT: "success",
  GOOD: "success",
  MODERATE: "warning",
  NO_IMPROVEMENT: "warning",
  POOR: "danger",
  CROP_DAMAGED: "danger",
};

export default async function ReportsPage() {
  const session = await requireSession();
  const [farmers, crops, treatments, products] = await Promise.all([
    getFarmerActivityReport(session),
    getCropStatusReport(session),
    getTreatmentOutcomesReport(session),
    getProductEffectivenessReport(session),
  ]);

  const cropsByStatus = Object.entries(
    crops.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const treatmentOutcomes = treatments.reduce<Record<string, number>>((acc, t) => {
    acc[t.result] = (acc[t.result] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Reports &amp; Exports</h1>
        <p className="text-sm text-muted-foreground">
          Real, live data — every export reflects exactly what&apos;s on screen, nothing pre-baked.
        </p>
      </div>

      <Tabs defaultValue="farmers">
        <TabsList>
          <TabsTrigger value="farmers">Farmers ({farmers.length})</TabsTrigger>
          <TabsTrigger value="crops">Crops ({crops.length})</TabsTrigger>
          <TabsTrigger value="treatments">Treatments ({treatments.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="farmers" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Land, crops, treatments, and satisfaction per farmer.</p>
            <ExportButton report="farmers" filename="farmer-activity-report.csv" />
          </div>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Land (ac)</TableHead>
                    <TableHead>Crops</TableHead>
                    <TableHead>Treatments</TableHead>
                    <TableHead>Success %</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Follow-ups</TableHead>
                    <TableHead>Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmers.map((f) => (
                    <TableRow key={f.farmerId}>
                      <TableCell className="font-medium">{f.fullName}</TableCell>
                      <TableCell>{f.village}</TableCell>
                      <TableCell>{f.totalLandAcres.toFixed(2)}</TableCell>
                      <TableCell>
                        {f.activeCrops} / {f.totalCrops}
                      </TableCell>
                      <TableCell>{f.totalTreatments}</TableCell>
                      <TableCell>{f.treatmentSuccessRate === null ? "—" : `${f.treatmentSuccessRate}%`}</TableCell>
                      <TableCell>{f.avgSatisfaction === null ? "—" : `${f.avgSatisfaction}/5`}</TableCell>
                      <TableCell>{f.pendingFollowups}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.relationshipDuration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crops" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Every crop cycle&apos;s current status and stage.</p>
            <ExportButton report="crops" filename="crop-status-report.csv" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Crops by status</CardTitle>
            </CardHeader>
            <CardContent>
              <CropsByStatusChart data={cropsByStatus} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Land</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Age (days)</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Expected harvest</TableHead>
                    <TableHead>Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crops.map((c) => (
                    <TableRow key={c.cropId}>
                      <TableCell className="font-medium">{c.farmerName}</TableCell>
                      <TableCell>
                        {c.cropName}
                        {c.variety ? ` — ${c.variety}` : ""}
                      </TableCell>
                      <TableCell>{c.landParcel}</TableCell>
                      <TableCell>
                        <Badge variant={CROP_STATUS_TONE[c.status] ?? "muted"}>{c.status.replaceAll("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{c.cropAgeDays}</TableCell>
                      <TableCell>
                        {c.currentStage ?? "—"}
                        {c.needsReview && (
                          <Badge variant="warning" className="ml-1.5 text-[10px]">
                            Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{c.expectedHarvestDate ? format(c.expectedHarvestDate, "d MMM yyyy") : "—"}</TableCell>
                      <TableCell>{c.overallHealth === null ? "—" : `${c.overallHealth}/5`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Every recorded treatment result and its outcome.</p>
            <ExportButton report="treatments" filename="treatment-outcomes-report.csv" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Outcomes distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <TreatmentOutcomesChart data={treatmentOutcomes} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Improvement</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.map((t) => (
                    <TableRow key={t.treatmentResultId}>
                      <TableCell>{format(t.observedAt, "d MMM yyyy")}</TableCell>
                      <TableCell className="font-medium">{t.farmerName}</TableCell>
                      <TableCell>{t.cropName}</TableCell>
                      <TableCell>{t.productName}</TableCell>
                      <TableCell>{t.targetPestOrDisease ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={RESULT_TONE[t.result] ?? "muted"}>{t.result.replaceAll("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{t.improvementPercent === null ? "—" : `${t.improvementPercent}%`}</TableCell>
                      <TableCell>{t.farmerRating === null ? "—" : `${t.farmerRating}/5`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">How each recommended product actually performs in the field.</p>
            <ExportButton report="products" filename="product-effectiveness-report.csv" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Success rate by product</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSuccessChart data={products} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Recommended</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Success %</TableHead>
                    <TableHead>Avg improvement</TableHead>
                    <TableHead>Avg rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-medium">
                        {p.productName}
                        {p.brand ? ` (${p.brand})` : ""}
                      </TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>{p.timesRecommended}</TableCell>
                      <TableCell>{p.timesApplied}</TableCell>
                      <TableCell>{p.successRate === null ? "—" : `${p.successRate}%`}</TableCell>
                      <TableCell>{p.avgImprovementPercent === null ? "—" : `${p.avgImprovementPercent}%`}</TableCell>
                      <TableCell>{p.avgFarmerRating === null ? "—" : `${p.avgFarmerRating}/5`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
