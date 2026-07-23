"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { getQuality } from "@/lib/device";

export default function Effects() {
  const q = getQuality();
  if (!q.postFx) return null;
  const mid = q.tier === "mid";
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur={!mid}
        height={mid ? 360 : undefined}
        intensity={1.15}
        luminanceThreshold={0.78}
        luminanceSmoothing={0.25}
        radius={0.72}
      />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  );
}
