"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cine } from "@/lib/cine";
import { PRODUCTS } from "@/lib/products";

/**
 * Scene 4 — 컨버전스.
 * 세 제품 층에서 나선 빔이 타워를 타고 올라 정상(y=172)에서 합류,
 * 하나의 거대한 수직 광주(光柱)로 하늘을 뚫는다.
 */

const SUMMIT_Y = 172;

const TUBE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const TUBE_FRAG = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform float uP;
uniform vec3 uColor;
uniform float uTime;
void main() {
  // 진행도까지만 드로우-온, 머리 부분은 화이트핫
  if (vUv.x > uP) discard;
  float head = smoothstep(uP - 0.16, uP, vUv.x);
  float flow = 0.75 + 0.25 * sin(vUv.x * 60.0 - uTime * 14.0);
  vec3 col = mix(uColor, vec3(1.0), head * 0.9) * (2.4 + head * 3.0) * flow;
  gl_FragColor = vec4(col, 0.85 + head * 0.15);
}
`;

const PILLAR_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PILLAR_FRAG = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform float uP;
uniform float uTime;
void main() {
  float core = smoothstep(0.5, 0.18, abs(vUv.x - 0.5));
  float body = smoothstep(0.5, 0.46, abs(vUv.x - 0.5));
  float fadeTop = 1.0 - smoothstep(0.55, 1.0, vUv.y);
  float flow = 0.8 + 0.2 * sin(vUv.y * 40.0 - uTime * 20.0);
  vec3 col = mix(vec3(1.0, 0.14, 0.22), vec3(1.0, 0.92, 0.9), core);
  float a = (body * 0.4 + core * 0.8) * fadeTop * uP * flow;
  gl_FragColor = vec4(col * (2.0 + core * 3.0), a);
}
`;

function helixCurve(from: THREE.Vector3, turns: number) {
  const pts: THREE.Vector3[] = [];
  const n = 60;
  const a0 = Math.atan2(from.z, from.x);
  const r0 = Math.hypot(from.x, from.z);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = from.y + (SUMMIT_Y - from.y) * t;
    // 타워 바깥을 넓게 감다가 마지막 30%에서 정상으로 수렴
    const dive = THREE.MathUtils.smoothstep(t, 0.7, 1);
    const r = THREE.MathUtils.lerp(THREE.MathUtils.lerp(r0, r0 * 0.85, t), 0.8, dive);
    const a = a0 + turns * Math.PI * 2 * t * (0.3 + 0.7 * t);
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return new THREE.CatmullRomCurve3(pts);
}

export default function Beams() {
  const group = useRef<THREE.Group>(null);
  const tubeMats = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const pillarMat = useRef<THREE.ShaderMaterial>(null);
  const wave = useRef<THREE.Mesh>(null);

  const tubes = useMemo(
    () =>
      PRODUCTS.map((p, i) => {
        const start = new THREE.Vector3(
          Math.cos(i * 2.1) * 13,
          p.floorY,
          Math.sin(i * 2.1) * 13
        );
        const curve = helixCurve(start, 1.1 + i * 0.25);
        return {
          geo: new THREE.TubeGeometry(curve, 90, 0.3, 6, false),
          color: new THREE.Color(p.accent),
        };
      }),
    []
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const c = cine.converge;
    const visible = c > 0.001 && cine.fade < 0.95;
    g.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime;

    // 각 빔은 살짝 시차를 두고 상승
    tubeMats.current.forEach((m, i) => {
      if (!m) return;
      const local = THREE.MathUtils.clamp((c - i * 0.05) / 0.48, 0, 1);
      m.uniforms.uP.value = local;
      m.uniforms.uTime.value = t;
    });

    if (pillarMat.current) {
      const p = THREE.MathUtils.clamp((c - 0.55) / 0.45, 0, 1);
      pillarMat.current.uniforms.uP.value = p;
      pillarMat.current.uniforms.uTime.value = t;
    }

    if (wave.current) {
      const w = THREE.MathUtils.clamp((c - 0.6) / 0.4, 0, 1);
      wave.current.visible = w > 0;
      const s = 1 + w * 26;
      wave.current.scale.set(s, s, s);
      (wave.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - w) * 0.9;
    }
  });

  return (
    <group ref={group} visible={false}>
      {tubes.map((tb, i) => (
        <mesh key={i} geometry={tb.geo} renderOrder={5}>
          <shaderMaterial
            ref={(el) => {
              tubeMats.current[i] = el;
            }}
            vertexShader={TUBE_VERT}
            fragmentShader={TUBE_FRAG}
            uniforms={{
              uP: { value: 0 },
              uTime: { value: 0 },
              uColor: { value: tb.color },
            }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* 정상 광주 */}
      <mesh position={[0, SUMMIT_Y + 130, 0]}>
        <cylinderGeometry args={[1.5, 1.1, 260, 24, 1, true]} />
        <shaderMaterial
          ref={pillarMat}
          vertexShader={PILLAR_VERT}
          fragmentShader={PILLAR_FRAG}
          uniforms={{ uP: { value: 0 }, uTime: { value: 0 } }}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 충격파 링 */}
      <mesh
        ref={wave}
        position={[0, SUMMIT_Y + 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[1, 0.06, 8, 64]} />
        <meshBasicMaterial
          color="#ff5060"
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
