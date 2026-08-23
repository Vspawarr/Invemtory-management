"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { CropVisualKind } from "@/lib/farm-3d-types";
import { seededRandom, hashString } from "@/lib/farm-3d-rng";

/** Kept low-poly deliberately — this is a stylized agricultural twin, never
 * a photorealistic asset. Discriminated on `geometry` so each variant's
 * `geometryArgs` tuple matches the Three.js constructor it feeds. */
type RowSpec =
  | { geometry: "sphere"; geometryArgs: [radius: number, widthSegments: number, heightSegments: number]; spacing: number; targetSize: number; maxPerRow: number }
  | {
      geometry: "cylinder";
      geometryArgs: [radiusTop: number, radiusBottom: number, height: number, radialSegments: number];
      spacing: number;
      targetSize: number;
      maxPerRow: number;
    }
  | { geometry: "cone"; geometryArgs: [radius: number, height: number, radialSegments: number]; spacing: number; targetSize: number; maxPerRow: number };

const ROW_SPECS: Record<CropVisualKind, RowSpec> = {
  // Cotton — bushier plants, wider spacing (fewer, larger bushes read as
  // distinct plants rather than a dense dot-grid).
  cotton: { geometry: "sphere", geometryArgs: [1, 7, 5], spacing: 0.62, targetSize: 0.17, maxPerRow: 7 },
  // Maize — tall, narrow, tapered stalks with visible row structure.
  maize: { geometry: "cylinder", geometryArgs: [0.025, 0.065, 1, 5], spacing: 0.62, targetSize: 0.95, maxPerRow: 7 },
  // Sugarcane — tall, dense, narrow cane rows (visibly denser than maize).
  sugarcane: { geometry: "cylinder", geometryArgs: [0.02, 0.045, 1, 5], spacing: 0.38, targetSize: 1.15, maxPerRow: 10 },
  // Ginger — low, leafy, bushier vegetation (wider cone than onion).
  ginger: { geometry: "cone", geometryArgs: [0.19, 1, 6], spacing: 0.42, targetSize: 0.22, maxPerRow: 9 },
  // Onion — low, dense, narrow bulb rows.
  onion: { geometry: "cone", geometryArgs: [0.09, 1, 6], spacing: 0.32, targetSize: 0.16, maxPerRow: 12 },
  generic: { geometry: "cone", geometryArgs: [0.11, 1, 6], spacing: 0.4, targetSize: 0.22, maxPerRow: 10 },
};

interface PlantTransform {
  x: number;
  z: number;
  scale: number;
  rotation: number;
}

/** Renders one crop's field rows as a single InstancedMesh — the whole
 * planting is one draw call regardless of plant count, per the performance
 * constraint (no large asset counts, no individually animated meshes). Row
 * geometry is picked by crop type; size AND density both scale with
 * `stageProgress`, a plain 0..1 normalization of the crop's existing
 * timeline-stage sequence (never a new stage calculation). */
export function CropPlanting({
  kind,
  footprint,
  stageProgress,
  color,
  seed,
  reducedDetail = false,
}: {
  kind: CropVisualKind;
  footprint: number;
  stageProgress: number;
  color: string;
  seed: string;
  reducedDetail?: boolean;
}) {
  const spec = ROW_SPECS[kind];
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const transforms = useMemo<PlantTransform[]>(() => {
    const rand = seededRandom(hashString(seed));
    const inset = 0.32;
    const usable = Math.max(0.5, footprint - inset * 2);
    const spacing = spec.spacing * (reducedDetail ? 1.9 : 1);
    const perRow = Math.min(spec.maxPerRow, Math.max(1, Math.floor(usable / spacing)));
    const totalRows = Math.max(1, Math.floor(usable / spacing));
    const density = 0.55 + 0.45 * Math.max(0, Math.min(1, stageProgress));
    const activeRows = Math.max(1, Math.round(totalRows * density));
    const list: PlantTransform[] = [];

    for (let r = 0; r < activeRows; r++) {
      for (let c = 0; c < perRow; c++) {
        if (rand() > density + 0.3) continue;
        const jitterX = (rand() - 0.5) * (usable / perRow) * 0.4;
        const jitterZ = (rand() - 0.5) * (usable / activeRows) * 0.4;
        const x = -usable / 2 + (c + 0.5) * (usable / perRow) + jitterX;
        const z = -usable / 2 + (r + 0.5) * (usable / activeRows) + jitterZ;
        const growth = 0.35 + 0.65 * stageProgress;
        const scale = growth * (0.85 + rand() * 0.3);
        list.push({ x, z, scale, rotation: rand() * Math.PI * 2 });
      }
    }
    return list;
  }, [footprint, stageProgress, seed, spec, reducedDetail]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    transforms.forEach((t, i) => {
      if (spec.geometry === "sphere") {
        const r = spec.targetSize * t.scale;
        dummy.position.set(t.x, r, t.z);
        dummy.scale.set(r, r, r);
      } else {
        const h = spec.targetSize * t.scale;
        dummy.position.set(t.x, h / 2, t.z);
        dummy.scale.set(t.scale, h, t.scale);
      }
      dummy.rotation.set(0, t.rotation, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [transforms, spec]);

  if (transforms.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, transforms.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      {spec.geometry === "sphere" && <sphereGeometry args={spec.geometryArgs} />}
      {spec.geometry === "cylinder" && <cylinderGeometry args={spec.geometryArgs} />}
      {spec.geometry === "cone" && <coneGeometry args={spec.geometryArgs} />}
      <meshStandardMaterial color={color} roughness={0.85} />
    </instancedMesh>
  );
}
