"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { GemErrorBoundary } from "@/components/three/gem-error-boundary";
import { OnyxGem } from "@/components/three/onyx-gem";

/**
 * Offline-safe 3D hero scene — pure lights only, no drei Environment or
 * remote assets, so it works without network access. Default-exported so
 * the hero can pull it in with next/dynamic({ ssr: false }).
 *
 * `onFound` fires when the visitor clicks/taps the gem (easter egg) — the
 * fracture itself lives inside OnyxGem; this only forwards the callback.
 */
export default function GemScene({ onFound }: { onFound?: () => void }) {
  return (
    <GemErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          {/* Lighting rig — warm gold key, mint kick from below, soft white top */}
          <ambientLight intensity={0.2} />
          <pointLight color="#D4A857" intensity={40} position={[3, 2, 3]} />
          <pointLight color="#00E5A0" intensity={10} position={[-3, -2, 2]} />
          <directionalLight color="#FFFFFF" intensity={0.4} position={[0, 4, 2]} />
          <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1}>
            <OnyxGem onFound={onFound} />
          </Float>
        </Suspense>
      </Canvas>
    </GemErrorBoundary>
  );
}
