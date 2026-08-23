import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import {
  CalendarClock,
  CalendarPlus,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Sprout,
  Star,
  Stethoscope,
  ThumbsUp,
  Wheat,
} from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { getFarmerById, getFarmerStats, getFarmerHistory } from "@/lib/server/dal/farmers";
import { getCropStageDisplay } from "@/lib/server/crop-timeline/rules";
import { formatRelationshipDuration } from "@/lib/server/farmer-relationship";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { InfoTile } from "@/components/dashboard/info-tile";
import { AadhaarReveal } from "@/components/farmers/aadhaar-reveal";
import { PortalAccessCard } from "@/components/farmers/portal-access-card";
import { EditFarmerDialog } from "@/components/farmers/edit-farmer-dialog";
import { AddLandDialog } from "@/components/farmers/add-land-dialog";
import { FarmerQuickActions } from "@/components/farmers/farmer-quick-actions";
import { FollowupList } from "@/components/followups/followup-list";
import { TreatmentJourney } from "@/components/crops/treatment-journey";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Farmer 360° — Champavati Agro" };

const STATUS_TONE: Record<string, "success" | "warning" | "muted"> = {
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

const INACTIVE_CROP_STATUSES = new Set(["COMPLETED", "HARVESTED", "FAILED", "CANCELLED"]);

const OWNERSHIP_LABEL: Record<string, string> = {
  OWNED: "Owned",
  LEASED: "Leased",
  SHARECROPPED: "Sharecropped",
  OTHER: "Other",
};

export default async function FarmerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const farmer = await getFarmerById(session, id);
  if (!farmer) notFound();
  const [stats, history] = await Promise.all([
    getFarmerStats(session, id),
    getFarmerHistory(session, id),
  ]);

  const today = new Date();
  const activeCrops = farmer.crops.filter((c) => !INACTIVE_CROP_STATUSES.has(c.status));
  const previousCrops = farmer.crops.filter((c) => INACTIVE_CROP_STATUSES.has(c.status));

  const stageSummaries = activeCrops.map((crop) => {
    const stageInput = crop.timelineStages.map((s) => ({
      sequence: s.sequenceSnapshot,
      expectedStartDate: s.expectedStartDate,
      expectedEndDate: s.expectedEndDate,
      actualStartDate: s.actualStartDate,
      actualEndDate: s.actualEndDate,
    }));
    const currentStageSequence = crop.currentStage?.sequenceSnapshot ?? null;
    const display = getCropStageDisplay(stageInput, currentStageSequence, today);
    const expectedStage = crop.timelineStages.find((s) => s.sequenceSnapshot === display.expectedSequence);
    return {
      crop,
      needsReview: display.needsReview,
      stageName: display.needsReview
        ? (expectedStage?.stageNameSnapshot ?? "—")
        : (crop.currentStage?.stageNameSnapshot ?? "—"),
      stageLabel: display.needsReview ? "Expected" : "Current",
    };
  });

  const pendingFeedback = history.recommendations.flatMap((rec) =>
    rec.applications
      .filter((a) => a.treatmentResult && !a.treatmentResult.feedback)
      .map((a) => ({
        id: a.treatmentResult!.id,
        label: rec.product.name,
        sublabel: rec.crop.cropMaster.name,
      }))
  );

  const relationship = stats.registeredAt ? formatRelationshipDuration(stats.registeredAt, today) : "—";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold">{farmer.fullName}</h1>
            <Badge variant="outline" className="font-mono text-[11px]">
              ID {farmer.id.slice(-8)}
            </Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Phone className="size-3.5" /> {farmer.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {farmer.village}, {farmer.taluka}
            </span>
            {stats.registeredAt && (
              <span className="flex items-center gap-1">
                <CalendarPlus className="size-3.5" /> Since {format(stats.registeredAt, "d MMM yyyy")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EditFarmerDialog
            farmer={{
              id: farmer.id,
              fullName: farmer.fullName,
              fatherOrHusbandName: farmer.fatherOrHusbandName,
              altPhone: farmer.altPhone,
              email: farmer.email,
              gender: farmer.gender,
              dob: farmer.dob ? format(farmer.dob, "yyyy-MM-dd") : null,
              address: farmer.address,
              village: farmer.village,
              taluka: farmer.taluka,
              district: farmer.district,
              state: farmer.state,
              pincode: farmer.pincode,
              notes: farmer.notes,
            }}
          />
          <Button asChild>
            <Link href={`/admin/crops/new?farmerId=${farmer.id}`}>
              <Plus className="size-4" /> Add Crop
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall relationship summary — a short, real-data narrative, never a fixed template with fake numbers. */}
      <Card className="mb-6 bg-primary/5">
        <CardContent className="pt-6 text-sm">
          <p>
            <span className="font-medium">{farmer.fullName}</span> has been with Champavati Agro for{" "}
            <span className="font-medium">{relationship}</span>, across{" "}
            <span className="font-medium">{stats.totalCrops}</span> crop cycle{stats.totalCrops === 1 ? "" : "s"}
            {stats.cropsHarvested > 0 && (
              <>
                {" "}
                (<span className="font-medium">{stats.cropsHarvested}</span> harvested)
              </>
            )}
            {stats.totalTreatments > 0 && stats.treatmentSuccessRate !== null && (
              <>
                , with <span className="font-medium">{stats.treatmentSuccessRate}%</span> treatment success across{" "}
                <span className="font-medium">{stats.totalTreatments}</span> treatment
                {stats.totalTreatments === 1 ? "" : "s"}
              </>
            )}
            {stats.avgSatisfaction !== null && (
              <>
                {" "}
                and an average satisfaction of <span className="font-medium">{stats.avgSatisfaction}/5</span>
              </>
            )}
            .{" "}
            {stats.pendingFollowups > 0 && (
              <span className="font-medium text-amber-700 dark:text-amber-500">
                {stats.pendingFollowups} follow-up{stats.pendingFollowups === 1 ? "" : "s"} pending.
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <KpiCard label="Total land" value={stats.totalLandAcres} decimals={2} suffix=" ac" icon={<Landmark className="size-4" />} index={0} />
        <KpiCard label="Active crops" value={stats.activeCrops} icon={<Sprout className="size-4" />} index={1} />
        <KpiCard label="Harvested" value={stats.cropsHarvested} icon={<Wheat className="size-4" />} index={2} />
        <KpiCard label="Treatments" value={stats.totalTreatments} icon={<Stethoscope className="size-4" />} index={3} />
        <KpiCard
          label="Follow-ups"
          value={stats.pendingFollowups}
          icon={<CalendarClock className="size-4" />}
          tone={stats.pendingFollowups > 0 ? "warning" : "default"}
          index={4}
        />
        <KpiCard label="Satisfaction" value={stats.avgSatisfaction} decimals={1} suffix=" / 5" icon={<ThumbsUp className="size-4" />} tone="success" index={5} />
        <InfoTile label="Relationship" value={relationship} icon={<CalendarPlus className="size-4" />} index={6} />
      </div>

      <div className="mb-6">
        <FarmerQuickActions
          farmerId={farmer.id}
          village={farmer.village}
          activeCrops={activeCrops.map((c) => ({ id: c.id, label: `${c.cropMaster.name}${c.variety ? ` — ${c.variety}` : ""}` }))}
          pendingFeedback={pendingFeedback}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current crop stage summary</CardTitle>
            </CardHeader>
            <CardContent>
              {stageSummaries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active crops right now.</p>
              ) : (
                <ul className="divide-y">
                  {stageSummaries.map(({ crop, needsReview, stageName, stageLabel }) => (
                    <li key={crop.id}>
                      <Link
                        href={`/admin/crops/${crop.id}`}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {crop.cropMaster.name}
                            {crop.variety ? ` — ${crop.variety}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stageLabel} stage: {stageName}
                          </p>
                        </div>
                        {needsReview && <Badge variant="warning">Needs review</Badge>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crops</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active">
                <TabsList>
                  <TabsTrigger value="active">Active ({activeCrops.length})</TabsTrigger>
                  <TabsTrigger value="history">History ({previousCrops.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active">
                  <CropList crops={activeCrops} farmerId={farmer.id} />
                </TabsContent>
                <TabsContent value="history">
                  <CropList crops={previousCrops} farmerId={farmer.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Treatment history</CardTitle>
            </CardHeader>
            <CardContent>
              {history.recommendations.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="No treatments yet"
                  description="Recommendations made for this farmer's crops will appear here."
                  className="py-10"
                />
              ) : (
                <TreatmentJourney recommendations={history.recommendations} editable basePath="/admin" />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                {history.transactions.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="No purchases recorded"
                    description="Product purchases will appear here."
                    className="py-8"
                  />
                ) : (
                  <ul className="space-y-3">
                    {history.transactions.slice(0, 6).map((txn) => (
                      <li key={txn.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">₹{Number(txn.totalAmount).toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">{format(txn.createdAt, "d MMM yyyy")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {txn.items.map((i) => i.product.name).join(", ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <FollowupList followups={history.followups} emptyMessage="No follow-ups scheduled for this farmer." />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Farmer feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {history.feedback.length === 0 ? (
                <EmptyState
                  icon={ThumbsUp}
                  title="No feedback yet"
                  description="Feedback recorded against this farmer's treatments will appear here."
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {history.feedback.map((f) => (
                    <div key={f.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {f.treatmentResult.application.recommendation.product.name} on{" "}
                          {f.treatmentResult.application.recommendation.crop.cropMaster.name}
                        </span>
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
                      {f.comments && <p className="mt-1.5">{f.comments}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{format(f.createdAt, "d MMM yyyy")}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PortalAccessCard farmerId={farmer.id} phone={farmer.phone} hasAccess={!!farmer.userId} />

          <Card>
            <CardHeader>
              <CardTitle>Contact information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Father/Husband" value={farmer.fatherOrHusbandName} />
              <Row label="Alternate mobile" value={farmer.altPhone} />
              <Row label="Email" value={farmer.email} icon={<Mail className="size-3.5" />} />
              <Row label="Gender" value={farmer.gender} />
              <Row label="Date of birth" value={farmer.dob ? format(farmer.dob, "d MMM yyyy") : null} />
              <Row label="Address" value={farmer.address} />
              <Row label="Village" value={farmer.village} />
              <Row label="Taluka" value={farmer.taluka} />
              <Row label="District" value={farmer.district} />
              <Row label="State" value={farmer.state} />
              <Row label="PIN" value={farmer.pincode} />
              {farmer.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Notes</span>
                    <p className="mt-1 whitespace-pre-wrap">{farmer.notes}</p>
                  </div>
                </>
              )}
              <Separator />
              {farmer.documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No documents on file.</p>
              ) : (
                farmer.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{doc.type}</span>
                    <AadhaarReveal documentId={doc.id} masked={doc.valueMasked} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Land portfolio</CardTitle>
              <AddLandDialog farmerId={farmer.id} defaultVillage={farmer.village} />
            </CardHeader>
            <CardContent>
              {farmer.landParcels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No land parcels recorded.</p>
              ) : (
                <div className="space-y-3">
                  {farmer.landParcels.map((parcel) => (
                    <div key={parcel.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{parcel.name}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {OWNERSHIP_LABEL[parcel.ownershipStatus] ?? parcel.ownershipStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Number(parcel.areaAcres).toFixed(2)} acres · {parcel.village}
                        {parcel.surveyNo ? ` · Survey ${parcel.surveyNo}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {parcel.soilType && `Soil: ${parcel.soilType}`}
                        {parcel.soilType && parcel.waterSource && " · "}
                        {parcel.waterSource && `${parcel.waterSource}`}
                        {parcel.irrigationAvailable === false && " · No irrigation"}
                      </p>
                      {parcel.notes && <p className="mt-1 text-xs text-muted-foreground">{parcel.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CropList({
  crops,
  farmerId,
}: {
  crops: {
    id: string;
    variety: string | null;
    season: string;
    status: string;
    areaAcres: unknown;
    cropMaster: { name: string };
    landParcel: { name: string };
  }[];
  farmerId: string;
}) {
  if (crops.length === 0) {
    return (
      <EmptyState
        icon={Sprout}
        title="Nothing here"
        description="Crop cycles will appear here once added."
        className="py-8"
        action={
          <Button asChild size="sm">
            <Link href={`/admin/crops/new?farmerId=${farmerId}`}>
              <Plus className="size-4" /> Add Crop
            </Link>
          </Button>
        }
      />
    );
  }
  return (
    <ul className="divide-y">
      {crops.map((crop) => (
        <li key={crop.id}>
          <Link
            href={`/admin/crops/${crop.id}`}
            className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80"
          >
            <div>
              <p className="text-sm font-medium">
                {crop.cropMaster.name}
                {crop.variety ? ` — ${crop.variety}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {crop.landParcel.name} · {Number(crop.areaAcres).toFixed(2)} ac · {crop.season}
              </p>
            </div>
            <Badge variant={STATUS_TONE[crop.status] ?? "muted"}>{crop.status.replaceAll("_", " ")}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}
