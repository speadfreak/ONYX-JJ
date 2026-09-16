"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The JJ ONYX gem — a flat-shaded obsidian icosahedron wrapped in gold
 * wire edges.
 *
 * Outer group: mouse parallax (smoothed) + a gentle idle bob.
 * Inner group: the continuous slow spin, so the two motions never fight.
 *
 * Easter egg: clicking the gem runs a ref-driven fracture timeline
 * (flash → burst into ~24 faceted shards → elastic reform) — driven inside
 * useFrame, no new dependencies. Mouse parallax is untouched: a click is a
 * distinct pointerdown+up on the mesh, not a hover/parallax gesture.
 */

const SHARD_COUNT = 24;

/* Fracture timeline (seconds) */
const DURATION = 1.6;
const FLASH_END = 0.16;
const CRUSH_START = 0.05;
const CRUSH_END = 0.5;
const FADE_START = 0.3;
const FADE_END = 0.48;
const BURST_START = 0.1;
const BURST_END = 0.95;
const PULL_START = 0.95;
const PULL_END = 1.4;
const SHARD_FADE_END = 1.45;
const REFORM_START = 1.0;
const REFORM_END = DURATION;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInCubic = (p: number) => p * p * p;
/** easeOutBack with a mild overshoot — the elastic reform (≈1.06 peak). */
const easeOutBack = (p: number) => {
  const c = 1.2;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};

interface ShardParams {
  dir: THREE.Vector3;
  dist: number;
  scale: number;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
  phase: number;
  delay: number;
}

function makeShardParams(): ShardParams {
  const theta = Math.random() * Math.PI * 2;
  const y = Math.random() * 2 - 1;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  return {
    dir: new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)).normalize(),
    dist: 1.1 + Math.random() * 1.5,
    scale: 0.55 + Math.random() * 1.1,
    rotAxis: new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .normalize(),
    rotSpeed: (Math.random() * 2 - 1) * 7,
    phase: Math.random() * Math.PI * 2,
    delay: Math.random() * 0.07,
  };
}

export function OnyxGem({ onFound }: { onFound?: () => void }) {
  const parallaxRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  const shardGroupRef = useRef<THREE.Group>(null);
  const shardRefs = useRef<(THREE.Group | null)[]>([]);

  /** One-click-at-a-time guard — also the fracture debounce. */
  const timeline = useRef({ active: false, t: 0 });
  const reducedMotion = useRef(false);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);

  // Imperative geometries (edges derived from the same icosahedron so the
  // gold wireframe hugs the facets exactly).
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.35, 0), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  // Shard geometry variants — created once, shared across all shards.
  const shardGeometries = useMemo(
    () => [
      new THREE.TetrahedronGeometry(0.17),
      new THREE.TetrahedronGeometry(0.12),
      new THREE.OctahedronGeometry(0.14),
    ],
    []
  );
  const shardEdgesGeometries = useMemo(
    () => shardGeometries.map((g) => new THREE.EdgesGeometry(g)),
    [shardGeometries]
  );

  // Shared shard materials — one instance so every shard fades in lockstep.
  // Aliased through refs below (the fracture mutates opacity every frame).
  const shardMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#15151C",
        metalness: 0.6,
        roughness: 0.3,
        flatShading: true,
        transparent: true,
        opacity: 1,
      }),
    []
  );
  const shardLineMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: "#D4A857", transparent: true, opacity: 0.5 }),
    []
  );
  const shardMatRef = useRef<THREE.MeshStandardMaterial>(shardMaterial);
  const shardLineMatRef = useRef<THREE.LineBasicMaterial>(shardLineMaterial);

  // Random burst parameters (client-only component — no hydration concern);
  // aliased through a ref so each click can regenerate them.
  const shardParams = useMemo<ShardParams[]>(
    () => Array.from({ length: SHARD_COUNT }, () => makeShardParams()),
    []
  );
  const shardParamsRef = useRef<ShardParams[]>(shardParams);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;
    const sync = () => {
      reducedMotion.current = mq.matches;
    };
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      geometry.dispose();
      edgesGeometry.dispose();
      shardGeometries.forEach((g) => g.dispose());
      shardEdgesGeometries.forEach((g) => g.dispose());
      shardMaterial.dispose();
      shardLineMaterial.dispose();
    };
  }, [
    geometry,
    edgesGeometry,
    shardGeometries,
    shardEdgesGeometries,
    shardMaterial,
    shardLineMaterial,
  ]);

  const resetGemVisuals = () => {
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity = 0;
      bodyMatRef.current.opacity = 1;
    }
    if (edgeMatRef.current) edgeMatRef.current.opacity = 0.35;
    if (flashLightRef.current) flashLightRef.current.intensity = 0;
    if (shardGroupRef.current) shardGroupRef.current.visible = false;
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (timeline.current.active) return; // ignore clicks mid-fracture

    // Reduced motion: no burst, no flash — straight to the reward.
    if (reducedMotion.current) {
      onFound?.();
      return;
    }

    // Fresh burst for every click (client-only randomness).
    const params = shardParamsRef.current;
    for (let i = 0; i < params.length; i++) {
      params[i] = makeShardParams();
      const shard = shardRefs.current[i];
      if (shard) {
        shard.position.set(0, 0, 0);
        shard.scale.setScalar(1);
      }
    }
    timeline.current = { active: true, t: 0 };
    if (shardGroupRef.current) shardGroupRef.current.visible = true;
    onFound?.();
  };

  useFrame((state, delta) => {
    const parallax = parallaxRef.current;
    const spin = spinRef.current;
    if (!parallax || !spin) return;

    const t = state.clock.elapsedTime;

    // Continuous rotation + gentle vertical bob
    spin.rotation.y += delta * 0.28;
    parallax.position.y = Math.sin(t * 0.8) * 0.08;

    // Mouse parallax — R3F pointer is NDC (-1..1); lerp for a silky follow.
    const { pointer } = state;
    parallax.rotation.x = THREE.MathUtils.lerp(parallax.rotation.x, pointer.y * 0.25, 0.06);
    parallax.rotation.y = THREE.MathUtils.lerp(parallax.rotation.y, pointer.x * 0.35, 0.06);

    // ── Fracture timeline (ref-driven, only while active) ──────────────
    const tl = timeline.current;
    if (!tl.active) return;
    tl.t = Math.min(tl.t + delta, DURATION);
    const ft = tl.t;
    const spinGroup = spinRef.current;

    // Flash — emissive spike + a pointLight burst over the first ~0.16s
    if (ft < FLASH_END) {
      const pulse = 1 - ft / FLASH_END;
      if (bodyMatRef.current) bodyMatRef.current.emissiveIntensity = pulse * 1.8;
      if (flashLightRef.current) flashLightRef.current.intensity = pulse * 24;
    } else {
      if (bodyMatRef.current) bodyMatRef.current.emissiveIntensity = 0;
      if (flashLightRef.current) flashLightRef.current.intensity = 0;
    }

    // Body scale: crush → (shards own the stage) → elastic reform
    let bodyScale = 1;
    if (ft >= CRUSH_START && ft < CRUSH_END) {
      bodyScale = 1 - 0.9 * easeInCubic((ft - CRUSH_START) / (CRUSH_END - CRUSH_START));
    } else if (ft >= CRUSH_END && ft < REFORM_START) {
      bodyScale = 0.1;
    } else if (ft >= REFORM_START) {
      bodyScale = 0.1 + 0.9 * easeOutBack(clamp01((ft - REFORM_START) / (REFORM_END - REFORM_START)));
    }

    // Body opacity: fade out during the crush, back in on the reform
    let bodyOpacity = 1;
    if (ft >= FADE_START && ft < FADE_END) {
      bodyOpacity = 1 - (ft - FADE_START) / (FADE_END - FADE_START);
    } else if (ft >= FADE_END && ft < REFORM_START) {
      bodyOpacity = 0;
    } else if (ft >= REFORM_START) {
      bodyOpacity = clamp01((ft - REFORM_START) / 0.25);
    }

    if (bodyMatRef.current) bodyMatRef.current.opacity = bodyOpacity;
    if (edgeMatRef.current) edgeMatRef.current.opacity = 0.35 * bodyOpacity;
    if (spinGroup) spinGroup.scale.setScalar(Math.max(0.001, bodyScale));

    // Shards: burst outward with gravity-lite curl, then pull back + fade
    const shardGroup = shardGroupRef.current;
    if (shardGroup && shardGroup.visible) {
      const outT = clamp01((ft - BURST_START) / (BURST_END - BURST_START));
      const pullT = easeInCubic(clamp01((ft - PULL_START) / (PULL_END - PULL_START)));
      const shardOpacity =
        ft < PULL_START ? 1 : 1 - clamp01((ft - PULL_START) / (SHARD_FADE_END - PULL_START));

      const params = shardParamsRef.current;
      for (let i = 0; i < params.length; i++) {
        const p = params[i];
        const shard = shardRefs.current[i];
        if (!shard) continue;

        const burst = easeOutCubic(clamp01((outT - p.delay) / (1 - p.delay)));
        const reach = (0.35 + burst * p.dist) * (1 - pullT * 0.94);
        shard.position.set(
          p.dir.x * reach + Math.sin(ft * 2.2 + p.phase) * 0.06 * ft,
          p.dir.y * reach - 0.28 * ft * ft * (0.6 + p.scale * 0.4),
          p.dir.z * reach + Math.cos(ft * 1.9 + p.phase) * 0.06 * ft
        );
        tmpQuat.setFromAxisAngle(p.rotAxis, p.phase + ft * p.rotSpeed);
        shard.quaternion.copy(tmpQuat);
        shard.scale.setScalar(p.scale * (1 - pullT * 0.35));
      }

      // Shared shard materials fade together (cheap + uniform)
      shardMatRef.current.opacity = shardOpacity;
      shardLineMatRef.current.opacity = 0.5 * shardOpacity;
    }

    if (ft >= DURATION) {
      tl.active = false;
      if (spinGroup) spinGroup.scale.setScalar(1);
      shardMatRef.current.opacity = 1;
      shardLineMatRef.current.opacity = 0.5;
      resetGemVisuals();
    }
  });

  return (
    <group ref={parallaxRef}>
      <group ref={spinRef}>
        {/* faceted obsidian body — clickable, flashes on fracture */}
        <mesh geometry={geometry} onClick={handleClick}>
          <meshStandardMaterial
            ref={bodyMatRef}
            color="#15151C"
            metalness={0.65}
            roughness={0.22}
            flatShading
            emissive="#D4A857"
            emissiveIntensity={0}
            transparent
          />
        </mesh>
        {/* gold wire edges */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial ref={edgeMatRef} color="#D4A857" transparent opacity={0.35} />
        </lineSegments>
        {/* fracture flash — sits just off the surface toward the camera */}
        <pointLight ref={flashLightRef} color="#D4A857" intensity={0} position={[0, 0, 1.8]} />
      </group>

      {/* fracture shards — hidden until a click bursts them outward */}
      <group ref={shardGroupRef} visible={false}>
        {shardParams.map((_, i) => (
          <group
            key={i}
            ref={(el) => {
              shardRefs.current[i] = el;
            }}
          >
            <mesh
              geometry={shardGeometries[i % shardGeometries.length]}
              material={shardMaterial}
            />
            <lineSegments
              geometry={shardEdgesGeometries[i % shardEdgesGeometries.length]}
              material={shardLineMaterial}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
