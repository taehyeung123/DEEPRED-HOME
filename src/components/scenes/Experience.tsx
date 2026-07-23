"use client";

import { Canvas } from "@react-three/fiber";
import { Component, Suspense, type ReactNode } from "react";
import { getQuality } from "@/lib/device";
import CloudsVolume from "./CloudsVolume";
import Tower from "./Tower";
import BurstParticles from "./BurstParticles";
import Beams from "./Beams";
import CameraRig from "./CameraRig";
import Effects from "./Effects";

/** WebGL 초기화 실패 시 캔버스만 조용히 내리는 안전망 */
class GlBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** 고정 풀스크린 3D 스테이지 */
function ExperienceInner({ onReady }: { onReady?: () => void }) {
  const q = getQuality();
  return (
    <div className="stage" aria-hidden>
      <Canvas
        dpr={q.dpr}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
        }}
        camera={{ fov: 62, near: 0.1, far: 900, position: [0, 30, 30] }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050508");
          onReady?.();
        }}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <Tower />
          <BurstParticles />
          <Beams />
          <CloudsVolume />
          <Effects />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function Experience(props: { onReady?: () => void }) {
  return (
    <GlBoundary>
      <ExperienceInner {...props} />
    </GlBoundary>
  );
}
