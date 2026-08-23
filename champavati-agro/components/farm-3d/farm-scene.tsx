"use client";

import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, Sky, type CameraControlsImpl } from "@react-three/drei";
import * as THREE from "three";

import { FieldPlot } from "@/components/farm-3d/field-plot";
import { FarmEnvironment, type FarmBounds } from "@/components/farm-3d/farm-environment";
import { FARM_3D_HEX } from "@/lib/farm-3d-colors";
import type { Farm3DPlot } from "@/lib/farm-3d-types";

const MIN_FOOTPRINT = 2.2;
const MAX_FOOTPRINT = 4.4;
const GAP = 1.8;
const CELL = MAX_FOOTPRINT + GAP;
const PLOT_HEIGHT_MARGIN = 1.6;

function computeFootprints(plots: Farm3DPlot[]): number[] {
  const maxArea = Math.max(...plots.map((p) => p.areaAcres), 0.1);
  return plots.map((p) => {
    const ratio = Math.sqrt(Math.max(p.areaAcres, 0.05) / maxArea);
    return MIN_FOOTPRINT + ratio * (MAX_FOOTPRINT - MIN_FOOTPRINT);
  });
}

function gridPositions(total: number): [number, number][] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
  const rows = Math.ceil(total / cols);
  const offsetX = ((cols - 1) * CELL) / 2;
  const offsetZ = ((rows - 1) * CELL) / 2;
  return Array.from({ length: total }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return [col * CELL - offsetX, row * CELL - offsetZ] as [number, number];
  });
}

function boundsToBox3(bounds: FarmBounds): THREE.Box3 {
  return new THREE.Box3(
    new THREE.Vector3(bounds.minX, 0, bounds.minZ),
    new THREE.Vector3(bounds.maxX, PLOT_HEIGHT_MARGIN, bounds.maxZ)
  );
}

function fitToBounds(controls: CameraControlsImpl | null, bounds: FarmBounds, enableTransition: boolean) {
  if (!controls) return Promise.resolve();
  const box = boundsToBox3(bounds);
  const size = new THREE.Vector3();
  box.getSize(size);
  const pad = Math.max(size.x, size.z, 2) * 0.2;
  return controls.fitToBox(box, enableTransition, {
    paddingLeft: pad,
    paddingRight: pad,
    paddingTop: pad * 0.55,
    paddingBottom: pad * 0.55,
  });
}

export interface FarmSceneHandle {
  resetView: () => void;
  fitFarm: () => void;
  topView: () => void;
  focusPlot: (landParcelId: string) => void;
}

function CameraRigInitializer({
  controlsRef,
  bounds,
}: {
  controlsRef: React.RefObject<CameraControlsImpl | null>;
  bounds: FarmBounds;
}) {
  useEffect(() => {
    let cancelled = false;
    void fitToBounds(controlsRef.current, bounds, false)?.then(() => {
      if (!cancelled) controlsRef.current?.saveState();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ]);
  return null;
}

export const FarmScene = forwardRef<
  FarmSceneHandle,
  {
    plots: Farm3DPlot[];
    selectedPlotId: string | null;
    onSelectPlot: (plot: Farm3DPlot) => void;
    reducedDetail?: boolean;
    reducedMotion?: boolean;
  }
>(function FarmScene({ plots, selectedPlotId, onSelectPlot, reducedDetail = false, reducedMotion = false }, ref) {
  const controlsRef = useRef<CameraControlsImpl>(null);

  const footprints = useMemo(() => computeFootprints(plots), [plots]);
  const positions = useMemo(() => gridPositions(plots.length), [plots.length]);

  const bounds = useMemo<FarmBounds>(() => {
    if (positions.length === 0) return { minX: -3, maxX: 3, minZ: -3, maxZ: 3 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    positions.forEach(([x, z], i) => {
      const half = footprints[i] / 2 + 0.4;
      minX = Math.min(minX, x - half);
      maxX = Math.max(maxX, x + half);
      minZ = Math.min(minZ, z - half);
      maxZ = Math.max(maxZ, z + half);
    });
    return { minX, maxX, minZ, maxZ };
  }, [positions, footprints]);

  const seed = plots.map((p) => p.landParcelId).join("|") || "empty-farm";

  useImperativeHandle(
    ref,
    () => ({
      resetView: () => {
        void controlsRef.current?.reset(!reducedMotion);
      },
      fitFarm: () => {
        void fitToBounds(controlsRef.current, bounds, !reducedMotion);
      },
      topView: () => {
        void fitToBounds(controlsRef.current, bounds, !reducedMotion)?.then(() => {
          void controlsRef.current?.rotateTo(0, 0.02, !reducedMotion);
        });
      },
      focusPlot: (landParcelId: string) => {
        const idx = plots.findIndex((p) => p.landParcelId === landParcelId);
        if (idx === -1) return;
        const [x, z] = positions[idx];
        const fp = footprints[idx];
        const box = new THREE.Box3(
          new THREE.Vector3(x - fp / 2 - 0.9, 0, z - fp / 2 - 0.9),
          new THREE.Vector3(x + fp / 2 + 0.9, PLOT_HEIGHT_MARGIN, z + fp / 2 + 0.9)
        );
        void controlsRef.current?.fitToBox(box, !reducedMotion, {
          paddingLeft: 1.0,
          paddingRight: 1.0,
          paddingTop: 0.6,
          paddingBottom: 0.6,
        });
      },
    }),
    [plots, positions, footprints, bounds, reducedMotion]
  );

  return (
    <Canvas shadows camera={{ position: [10, 9, 10], fov: 42 }} dpr={reducedDetail ? [1, 1.2] : [1, 2]}>
      <color attach="background" args={[FARM_3D_HEX.skyHorizon]} />
      <fog attach="fog" args={[FARM_3D_HEX.skyHorizon, 20, 52]} />
      {!reducedDetail && (
        <Sky sunPosition={[10, 14, 8]} turbidity={2.5} rayleigh={0.85} mieCoefficient={0.02} mieDirectionalG={0.85} />
      )}
      <hemisphereLight args={[FARM_3D_HEX.sky, FARM_3D_HEX.ground, 0.55]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.3}
        castShadow={!reducedDetail}
        shadow-mapSize={reducedDetail ? [512, 512] : [1536, 1536]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />

      <FarmEnvironment bounds={bounds} seed={seed} />

      <Suspense fallback={null}>
        {plots.map((plot, i) => (
          <FieldPlot
            key={plot.landParcelId}
            plot={plot}
            position={[positions[i][0], 0, positions[i][1]]}
            footprint={footprints[i]}
            selected={plot.landParcelId === selectedPlotId}
            onSelect={onSelectPlot}
            reducedDetail={reducedDetail}
            reducedMotion={reducedMotion}
          />
        ))}
      </Suspense>

      <CameraControls ref={controlsRef} minDistance={3.5} maxDistance={45} maxPolarAngle={Math.PI / 2.05} />
      <CameraRigInitializer controlsRef={controlsRef} bounds={bounds} />
    </Canvas>
  );
});
