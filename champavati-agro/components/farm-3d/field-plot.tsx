"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Outlines } from "@react-three/drei";
import * as THREE from "three";

import { FARM_3D_HEX, farmPlotColorHex, farmPlotStatusLabel } from "@/lib/farm-3d-colors";
import { getCropEmoji, getCropVisualKind } from "@/lib/farm-3d-types";
import type { Farm3DPlot } from "@/lib/farm-3d-types";
import { CropPlanting } from "@/components/farm-3d/crop-planting";

/** One field plot: a soil base sized to its relative land area, a low
 * boundary lip, real crop rows (via CropPlanting), and a DOM label. Digital
 * Farm is a visualization layer only — clicking SELECTS the plot (elevate +
 * outline) and notifies the parent; navigating to Crop 360 happens only via
 * the explicit button in the selection info panel, never on click here. */
export function FieldPlot({
  plot,
  position,
  footprint,
  selected,
  onSelect,
  reducedDetail = false,
  reducedMotion = false,
}: {
  plot: Farm3DPlot;
  position: [number, number, number];
  footprint: number;
  selected: boolean;
  onSelect: (plot: Farm3DPlot) => void;
  reducedDetail?: boolean;
  reducedMotion?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const color = farmPlotColorHex(plot);
  const soilColor = plot.crop ? FARM_3D_HEX.soil : FARM_3D_HEX.empty;
  const visualKind = plot.crop ? getCropVisualKind(plot.crop.cropName) : "generic";
  const emoji = plot.crop ? getCropEmoji(visualKind) : "🟤";

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = selected ? 0.14 : 0;
    const targetScale = selected ? 1.04 : hovered ? 1.015 : 1;
    if (reducedMotion) {
      groupRef.current.position.y = targetY;
      groupRef.current.scale.set(targetScale, 1, targetScale);
      return;
    }
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 7, delta);
    const s = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 8, delta);
    groupRef.current.scale.set(s, 1, s);
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Boundary lip / bunding — a shade darker, slightly wider than the soil */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[footprint + 0.14, 0.08, footprint + 0.14]} />
          <meshStandardMaterial color={FARM_3D_HEX.boundary} roughness={1} />
        </mesh>

        {/* Soil base */}
        <mesh
          position={[0, 0, 0]}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelect(plot);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <boxGeometry args={[footprint, 0.12, footprint]} />
          <meshStandardMaterial color={soilColor} roughness={0.95} />
          {selected && <Outlines thickness={2.5} color={FARM_3D_HEX.selectionRing} />}
        </mesh>

        {plot.crop && (
          <CropPlanting
            kind={visualKind}
            footprint={footprint}
            stageProgress={plot.crop.stageProgress}
            color={color}
            seed={plot.landParcelId}
            reducedDetail={reducedDetail}
          />
        )}
      </group>

      {/* Labels rendered as real DOM/CSS via drei's Html — never drei's Text,
       * which pulls a remote default font and silently blocks rendering
       * entirely in a network-restricted environment. This also keeps the
       * label typography visually identical to the rest of the app.
       * Deliberately NO distanceFactor: that prop scales the label inversely
       * with camera distance (a "sprite" billboard), which is what made
       * labels balloon to fill the viewport on zoom-in. Omitting it keeps
       * the label a fixed, small screen-space size at any zoom level — the
       * detailed breakdown lives in the selection info panel instead. */}
      <Html position={[0, 1.35, 0]} center zIndexRange={[10, 0]} className="pointer-events-none">
        <div className="pointer-events-none w-max max-w-36 rounded-md bg-card/95 px-2 py-1 text-center shadow-sm">
          <p className="text-[11px] font-medium whitespace-nowrap">{plot.landParcelName}</p>
          {plot.crop ? (
            <>
              <p className="text-[10px] whitespace-nowrap text-muted-foreground">
                {emoji} {plot.crop.cropName}
              </p>
              <p className="text-[10px] whitespace-nowrap font-medium" style={{ color }}>
                {plot.crop.stageName ? `${plot.crop.stageName} · ` : ""}
                {farmPlotStatusLabel(plot)}
              </p>
            </>
          ) : (
            <p className="text-[10px] whitespace-nowrap font-medium" style={{ color }}>
              {farmPlotStatusLabel(plot)}
            </p>
          )}
        </div>
      </Html>
    </group>
  );
}
