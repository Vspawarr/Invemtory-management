"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { ArrowUpToLine, Maximize2, RotateCcw } from "lucide-react";

import { FarmScene, type FarmSceneHandle } from "@/components/farm-3d/farm-scene";
import { FarmInfoPanel } from "@/components/farm-3d/farm-info-panel";
import { FARM_3D_CSS, farmPlotColorCss } from "@/lib/farm-3d-colors";
import type { Farm3DPlot } from "@/lib/farm-3d-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LEGEND: { color: string; label: string }[] = [
  { color: FARM_3D_CSS.healthy, label: "Healthy / on track" },
  { color: FARM_3D_CSS.review, label: "Needs review" },
  { color: FARM_3D_CSS.poor, label: "Poor health" },
  { color: FARM_3D_CSS.harvestReady, label: "Harvest ready" },
  { color: FARM_3D_CSS.empty, label: "No active crop" },
];

let cachedWebglSupport: boolean | undefined;
function computeWebglSupport(): boolean {
  if (cachedWebglSupport !== undefined) return cachedWebglSupport;
  try {
    const canvas = document.createElement("canvas");
    cachedWebglSupport = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    cachedWebglSupport = false;
  }
  return cachedWebglSupport;
}
function subscribeNever() {
  return () => {};
}
/** WebGL support never changes mid-session, so this is a one-shot read via
 * useSyncExternalStore rather than a setState-in-effect — the officially
 * recommended way to read a client-only browser capability without an SSR
 * hydration mismatch (server always sees the "supported" snapshot; the
 * client corrects it right after hydration if the device can't do WebGL). */
function useWebglSupport(): boolean {
  return useSyncExternalStore(subscribeNever, computeWebglSupport, () => true);
}

/** Gates the WebGL canvas behind an actual capability check — Digital Farm
 * has no separate 2D renderer, so a device/browser without WebGL gets an
 * honest message instead of a blank or crashed canvas. */
function WebglGate({ children }: { children: ReactNode }) {
  const supported = useWebglSupport();

  if (!supported) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-8 text-center">
        <p className="text-sm font-medium">3D view isn&apos;t available on this device or browser.</p>
        <p className="text-xs text-muted-foreground">
          Digital Farm needs WebGL. Try a recent version of Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

const REDUCED_DETAIL_QUERY = "(max-width: 768px)";
function subscribeReducedDetail(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(REDUCED_DETAIL_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedDetailSnapshot(): boolean {
  return window.matchMedia(REDUCED_DETAIL_QUERY).matches;
}
function getReducedDetailServerSnapshot(): boolean {
  return false;
}
/** Reduce geometry complexity on small screens — subscribed via
 * useSyncExternalStore (the viewport crossing the breakpoint is a real
 * external-store change, not a one-shot read) rather than setState-in-effect. */
function useReducedDetail(): boolean {
  return useSyncExternalStore(subscribeReducedDetail, getReducedDetailSnapshot, getReducedDetailServerSnapshot);
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
function getReducedMotionServerSnapshot(): boolean {
  return false;
}
/** Respect prefers-reduced-motion — camera flights become instant jumps and
 * the field hover/select elevate animation snaps instead of easing. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

export function FarmView({ plots }: { plots: Farm3DPlot[] }) {
  const sceneRef = useRef<FarmSceneHandle>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const reducedDetail = useReducedDetail();
  const reducedMotion = usePrefersReducedMotion();

  const selectedPlot = plots.find((p) => p.landParcelId === selectedPlotId) ?? null;

  function handleSelect(plot: Farm3DPlot) {
    setSelectedPlotId(plot.landParcelId);
    sceneRef.current?.focusPlot(plot.landParcelId);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <Card className="overflow-hidden lg:col-span-3">
        <CardContent className="relative p-0">
          <div className="relative h-[380px] w-full overflow-hidden sm:h-[460px] lg:h-[560px]">
            <WebglGate>
              <FarmScene
                ref={sceneRef}
                plots={plots}
                selectedPlotId={selectedPlotId}
                onSelectPlot={handleSelect}
                reducedDetail={reducedDetail}
                reducedMotion={reducedMotion}
              />
            </WebglGate>
          </div>
          <div className="absolute top-3 right-3 flex gap-1.5">
            <Button size="sm" variant="secondary" className="shadow-sm" onClick={() => sceneRef.current?.fitFarm()}>
              <Maximize2 className="size-3.5" /> Fit Farm
            </Button>
            <Button size="sm" variant="secondary" className="shadow-sm" onClick={() => sceneRef.current?.topView()}>
              <ArrowUpToLine className="size-3.5" /> Top View
            </Button>
            <Button size="sm" variant="secondary" className="shadow-sm" onClick={() => sceneRef.current?.resetView()}>
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Accessible, non-3D way to select a field and reach its details —
         * screen-reader and keyboard users never have to interact with the
         * canvas itself. Selecting here drives the exact same state as
         * clicking a field in 3D. */}
        <Card>
          <CardContent className="space-y-2 pt-6">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Fields</p>
            <ul className="space-y-1">
              {plots.map((plot) => (
                <li key={plot.landParcelId}>
                  <button
                    type="button"
                    onClick={() => handleSelect(plot)}
                    aria-pressed={plot.landParcelId === selectedPlotId}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      plot.landParcelId === selectedPlotId ? "border-primary bg-primary/5" : "border-transparent"
                    )}
                  >
                    <span className="truncate">{plot.landParcelName}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: farmPlotColorCss(plot) }}
                      />
                      {plot.crop ? plot.crop.cropName : "No crop"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {selectedPlot && <FarmInfoPanel plot={selectedPlot} onClose={() => setSelectedPlotId(null)} />}

        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Legend</p>
            {LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span
                  className="size-3 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Drag to rotate, scroll to zoom, click a field to select it and see its details.
        </p>
      </div>
    </div>
  );
}
