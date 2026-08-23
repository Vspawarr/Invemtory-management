"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { AlertTriangle, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCropAction,
  previewCropTimeline,
  type TimelinePreviewStage,
} from "@/lib/server/actions/crops";

type Farmer = {
  id: string;
  fullName: string;
  village: string;
  landParcels: { id: string; name: string; areaAcres: number; village: string }[];
};

type CropMasterOption = {
  id: string;
  name: string;
  localName: string;
  anchorType: "SOWING" | "PLANTING" | "TRANSPLANTING";
  anchorLabel: string;
  plantingWindows: { plantingType: string; startMonth: number; endMonth: number; label: string }[];
};

const SUGARCANE_TYPES = ["SURU", "PRE_SEASONAL", "ADSALI"];
const ONION_TYPES = ["KHARIF", "LATE_KHARIF", "RABI"];

export function CropCreationWizard({
  farmers,
  cropMasters,
  initialFarmerId,
}: {
  farmers: Farmer[];
  cropMasters: CropMasterOption[];
  initialFarmerId?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"details" | "preview">("details");
  const [farmerId, setFarmerId] = useState(initialFarmerId ?? "");
  const [landParcelId, setLandParcelId] = useState("");
  const [cropMasterId, setCropMasterId] = useState("");
  const [variety, setVariety] = useState("");
  const [season, setSeason] = useState("Kharif");
  const [plantingType, setPlantingType] = useState("");
  const [areaAcres, setAreaAcres] = useState("");
  const [anchorDate, setAnchorDate] = useState("");
  const [irrigationAvailable, setIrrigationAvailable] = useState(true);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<{
    stages: TimelinePreviewStage[];
    expectedHarvestDate: string;
    plantingWindowWarning?: string;
  } | null>(null);

  const selectedFarmer = farmers.find((f) => f.id === farmerId);
  const selectedCrop = cropMasters.find((c) => c.id === cropMasterId);

  const plantingTypeOptions = useMemo(() => {
    if (selectedCrop?.name === "Sugarcane") return SUGARCANE_TYPES;
    if (selectedCrop?.name === "Onion") return ONION_TYPES;
    return [];
  }, [selectedCrop]);

  const detailsValid =
    farmerId && landParcelId && cropMasterId && season && areaAcres && anchorDate &&
    (plantingTypeOptions.length === 0 || plantingType);

  async function handleGenerate() {
    if (!detailsValid) {
      toast.error("Fill in all required fields first.");
      return;
    }
    setLoadingPreview(true);
    const result = await previewCropTimeline({ cropMasterId, plantingType, anchorDate });
    setLoadingPreview(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPreview(result.data);
    setPhase("preview");
  }

  async function handleConfirm() {
    setSubmitting(true);
    const result = await createCropAction({
      farmerId,
      landParcelId,
      cropMasterId,
      variety: variety || undefined,
      season,
      plantingType: plantingType || undefined,
      areaAcres: Number(areaAcres),
      anchorDate,
      irrigationAvailable,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Crop cycle created.");
    router.push(`/admin/crops/${result.data.cropId}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AnimatePresence mode="wait">
        {phase === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wizard-farmer">Farmer</Label>
                    <Select
                      value={farmerId}
                      onValueChange={(v) => {
                        setFarmerId(v);
                        setLandParcelId("");
                      }}
                    >
                      <SelectTrigger id="wizard-farmer">
                        <SelectValue placeholder="Select farmer" />
                      </SelectTrigger>
                      <SelectContent>
                        {farmers.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.fullName} — {f.village}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-land">Land parcel</Label>
                    <Select value={landParcelId} onValueChange={setLandParcelId} disabled={!selectedFarmer}>
                      <SelectTrigger id="wizard-land">
                        <SelectValue placeholder={selectedFarmer ? "Select land" : "Select a farmer first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFarmer?.landParcels.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {p.areaAcres.toFixed(2)} ac
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-crop">Crop</Label>
                    <Select
                      value={cropMasterId}
                      onValueChange={(v) => {
                        setCropMasterId(v);
                        setPlantingType("");
                      }}
                    >
                      <SelectTrigger id="wizard-crop">
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropMasters.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.localName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-variety">Variety (optional)</Label>
                    <Input id="wizard-variety" value={variety} onChange={(e) => setVariety(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-season">Season</Label>
                    <Select value={season} onValueChange={setSeason}>
                      <SelectTrigger id="wizard-season">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kharif">Kharif</SelectItem>
                        <SelectItem value="Rabi">Rabi</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {plantingTypeOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="wizard-planting-type">Planting type</Label>
                      <Select value={plantingType} onValueChange={setPlantingType}>
                        <SelectTrigger id="wizard-planting-type">
                          <SelectValue placeholder="Select planting type" />
                        </SelectTrigger>
                        <SelectContent>
                          {plantingTypeOptions.map((pt) => {
                            const window = selectedCrop?.plantingWindows.find((w) => w.plantingType === pt);
                            return (
                              <SelectItem key={pt} value={pt}>
                                {pt.replaceAll("_", " ")} {window ? `(${window.label})` : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="wizard-area">Area (acres)</Label>
                    <Input
                      id="wizard-area"
                      type="number"
                      step="0.01"
                      value={areaAcres}
                      onChange={(e) => setAreaAcres(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-anchor-date">{selectedCrop?.anchorLabel ?? "Anchor date"}</Label>
                    <Input
                      id="wizard-anchor-date"
                      type="date"
                      value={anchorDate}
                      onChange={(e) => setAnchorDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="wizard-irrigation" className="text-sm font-medium">
                      Irrigation available
                    </Label>
                    <p className="text-xs text-muted-foreground">Affects follow-up guidance, not the schedule.</p>
                  </div>
                  <Switch
                    id="wizard-irrigation"
                    checked={irrigationAvailable}
                    onCheckedChange={setIrrigationAvailable}
                  />
                </div>

                <div className="flex justify-end border-t pt-5">
                  <Button onClick={handleGenerate} disabled={!detailsValid || loadingPreview}>
                    {loadingPreview ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" /> Generate Timeline
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "preview" && preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div>
                  <h2 className="font-display text-lg font-semibold">Generated crop timeline</h2>
                  <p className="text-sm text-muted-foreground">
                    Expected harvest: {format(new Date(preview.expectedHarvestDate), "d MMM yyyy")}
                  </p>
                </div>

                {preview.plantingWindowWarning && (
                  <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-earth-600">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {preview.plantingWindowWarning}
                  </div>
                )}

                <ol className="space-y-0">
                  {preview.stages.map((stage, i) => (
                    <li key={stage.stageMasterId} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < preview.stages.length - 1 && (
                        <span className="absolute top-6 left-[11px] h-full w-px bg-border" />
                      )}
                      <span
                        className={`z-10 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                          stage.criticalStage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {stage.name}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {stage.localName}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(stage.expectedStartDate), "d MMM")} –{" "}
                          {format(new Date(stage.expectedEndDate), "d MMM yyyy")}
                        </p>
                        {stage.monitoringActions && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            {stage.monitoringActions}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="flex items-center justify-between border-t pt-5">
                  <Button variant="ghost" onClick={() => setPhase("details")}>
                    Back
                  </Button>
                  <Button onClick={handleConfirm} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Creating…
                      </>
                    ) : (
                      <>
                        <Check className="size-4" /> Confirm &amp; create crop
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
