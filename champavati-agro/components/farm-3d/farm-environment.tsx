"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { FARM_3D_HEX } from "@/lib/farm-3d-colors";
import { seededRandom, hashString } from "@/lib/farm-3d-rng";

export interface FarmBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const GROUND_MARGIN = 6;
const TREE_SPACING = 4.4;
const MAX_TREES = 18;
const TREE_MARGIN = 3.4;
const TRUNK_BASE_HEIGHT = 0.2;
const FOLIAGE_BASE_HEIGHT = 0.36;
const FOLIAGE_RADIUS = 0.17;

/** Ground plane with barely-perceptible terrain undulation (computed once,
 * never per-frame) plus a ring of lightweight low-poly boundary trees —
 * two InstancedMeshes (trunks, foliage) regardless of tree count, so this
 * stays cheap however large the farm is. Purely decorative: it never reads
 * or implies any crop/business data. */
export function FarmEnvironment({ bounds, seed }: { bounds: FarmBounds; seed: string }) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const width = bounds.maxX - bounds.minX + GROUND_MARGIN * 2;
  const depth = bounds.maxZ - bounds.minZ + GROUND_MARGIN * 2;

  const groundGeometry = useMemo(() => {
    const segX = Math.min(48, Math.max(8, Math.round(width / 1.5)));
    const segZ = Math.min(48, Math.max(8, Math.round(depth / 1.5)));
    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    const rand = seededRandom(hashString(`${seed}-terrain`));
    const seedX = rand() * 100;
    const seedZ = rand() * 100;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // plane is unrotated here; this is the "z" axis before rotation
      const bump =
        Math.sin((x + seedX) * 0.35) * 0.05 + Math.sin((y + seedZ) * 0.4) * 0.05 + Math.sin((x + y) * 0.15) * 0.03;
      pos.setZ(i, bump);
    }
    geo.computeVertexNormals();
    return geo;
  }, [width, depth, seed]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);

  const treePlacements = useMemo(() => {
    const rand = seededRandom(hashString(`${seed}-trees`));
    const list: { x: number; z: number; scale: number }[] = [];

    const addEdge = (length: number, axis: "x" | "z", fixedValue: number, alongMin: number) => {
      const count = Math.min(6, Math.max(1, Math.round(length / TREE_SPACING)));
      for (let i = 0; i < count; i++) {
        const along = alongMin + ((i + 0.5) / count) * length + (rand() - 0.5) * TREE_SPACING * 0.4;
        const jitter = (rand() - 0.5) * 0.8;
        const scale = 0.6 + rand() * 0.4;
        if (axis === "x") list.push({ x: fixedValue + jitter, z: along, scale });
        else list.push({ x: along, z: fixedValue + jitter, scale });
      }
    };

    const zSpan = bounds.maxZ - bounds.minZ;
    const xSpan = bounds.maxX - bounds.minX;
    addEdge(zSpan, "x", bounds.minX - TREE_MARGIN, bounds.minZ);
    addEdge(zSpan, "x", bounds.maxX + TREE_MARGIN, bounds.minZ);
    addEdge(xSpan, "z", bounds.minZ - TREE_MARGIN, bounds.minX);
    addEdge(xSpan, "z", bounds.maxZ + TREE_MARGIN, bounds.minX);

    return list.slice(0, MAX_TREES);
  }, [seed, bounds]);

  useLayoutEffect(() => {
    const trunk = trunkRef.current;
    const foliage = foliageRef.current;
    if (!trunk || !foliage) return;
    const dummy = new THREE.Object3D();
    treePlacements.forEach((t, i) => {
      const trunkHeight = TRUNK_BASE_HEIGHT * t.scale;
      dummy.position.set(t.x, trunkHeight / 2, t.z);
      dummy.scale.set(t.scale, t.scale, t.scale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);

      const foliageHeight = FOLIAGE_BASE_HEIGHT * t.scale;
      dummy.position.set(t.x, trunkHeight + foliageHeight / 2, t.z);
      dummy.updateMatrix();
      foliage.setMatrixAt(i, dummy.matrix);
    });
    trunk.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;
    trunk.computeBoundingSphere();
    foliage.computeBoundingSphere();
  }, [treePlacements]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.1, centerZ]}
        receiveShadow
        geometry={groundGeometry}
      >
        <meshStandardMaterial color={FARM_3D_HEX.ground} roughness={1} />
      </mesh>

      {treePlacements.length > 0 && (
        <>
          <instancedMesh ref={trunkRef} args={[undefined, undefined, treePlacements.length]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, TRUNK_BASE_HEIGHT, 5]} />
            <meshStandardMaterial color={FARM_3D_HEX.trunk} roughness={0.9} />
          </instancedMesh>
          <instancedMesh ref={foliageRef} args={[undefined, undefined, treePlacements.length]} castShadow>
            <coneGeometry args={[FOLIAGE_RADIUS, FOLIAGE_BASE_HEIGHT, 7]} />
            <meshStandardMaterial color={FARM_3D_HEX.foliage} roughness={0.85} />
          </instancedMesh>
        </>
      )}
    </group>
  );
}
