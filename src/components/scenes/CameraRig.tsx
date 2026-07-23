"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cine } from "@/lib/cine";

/**
 * 카메라 리그: cine 상태(각도/반경/높이/피치)로 타워 공전 궤도를 계산하고
 * 셰이크(임팩트 순간)와 미세 드리프트를 얹는다.
 */
export default function CameraRig() {
  const look = useRef(new THREE.Vector3());

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const t = state.clock.elapsedTime;

    const drift = cine.world * 0.15;
    const a = cine.camAngle + Math.sin(t * 0.11) * 0.02 * drift;
    const r = cine.camRadius;
    const y = cine.camY + Math.sin(t * 0.23) * 0.35 * drift;

    let x = Math.cos(a) * r;
    let z = Math.sin(a) * r;
    let cy = y;

    // 셰이크
    if (cine.shake > 0.001) {
      const s = cine.shake;
      x += (Math.sin(t * 91.7) + Math.sin(t * 47.3)) * 0.13 * s;
      cy += (Math.cos(t * 83.1) + Math.sin(t * 59.9)) * 0.11 * s;
      z += (Math.sin(t * 71.3) + Math.cos(t * 39.7)) * 0.13 * s;
    }

    cam.position.set(x, cy, z);
    look.current.set(0, cine.camY + cine.camPitch, 0);
    cam.lookAt(look.current);

    if (Math.abs(cam.fov - cine.camFov) > 0.01) {
      cam.fov = cine.camFov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
