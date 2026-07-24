"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cine } from "@/lib/cine";
import { getQuality } from "@/lib/device";
import { PRODUCTS } from "@/lib/products";

/**
 * 프로시저럴 모노리스 타워 v2 — 세트백(setback) 4단 티어 실루엣.
 * 표면 셰이더: 메이저/마이너 패널 심, 창문 클러스터, 상승 데이터 펄스,
 * 스캐너 스윕, 리브 셰이딩. uActivation(0..3)에 따라 층이 점등된다.
 */

const VERT = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
uniform float uTime;
uniform float uReveal;
uniform float uActivation;
uniform float uConverge;
uniform vec3 uCols[3];
uniform float uFloors[3];
uniform vec3 uCamPos;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  return fract(p * (p + p));
}
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  float floorH = 4.6;
  float colN = 96.0;
  float fy = vWorld.y / floorH;
  float cx = vUv.x * colN;
  vec2 cell = vec2(floor(cx), floor(fy));
  vec2 f = vec2(fract(cx), fract(fy));
  float h = hash21(cell);

  vec3 viewDir = normalize(uCamPos - vWorld);
  float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.2);

  // 기본 다크 메탈 + 레드 림 + 층별 미세 명도 변화
  vec3 col = vec3(0.014, 0.015, 0.024) * (0.85 + 0.3 * hash11(cell.y * 3.7));
  col += rim * vec3(0.26, 0.030, 0.055) * 0.6;

  // 패널 이음매 (마이너)
  float seam = smoothstep(0.0, 0.05, f.x) * smoothstep(1.0, 0.95, f.x)
             * smoothstep(0.0, 0.07, f.y) * smoothstep(1.0, 0.93, f.y);
  col *= 0.55 + 0.45 * seam;

  // 메이저 수직 심 (8컬럼마다 깊은 홈)
  float f8 = fract(cx / 8.0);
  float major = smoothstep(0.0, 0.012, f8) * smoothstep(1.0, 0.988, f8);
  col *= 0.62 + 0.38 * major;

  // 리브 셰이딩 (32분할 수직 리브의 음영)
  float ribF = fract(vUv.x * 32.0);
  float ribShade = smoothstep(0.0, 0.09, ribF) * smoothstep(1.0, 0.91, ribF);
  col *= 0.82 + 0.18 * ribShade;

  // 활성화: 점등 상한선이 위로 상승
  float litTop = -18.0 + uActivation * 52.0 + uConverge * 90.0;
  float actHere = smoothstep(litTop, litTop - 26.0, vWorld.y);

  // 창문 — 클러스터 단위 점등 (연속 블록이 함께 켜져 '입주된 층' 느낌)
  float win = step(0.30, f.x) * step(f.x, 0.72) * step(0.35, f.y) * step(f.y, 0.75);
  float cluster = hash21(vec2(floor(cx / 3.0), floor(fy / 2.0)));
  float winOn = step(0.62, cluster) * step(0.35, h) * actHere;
  float flick = 0.75 + 0.25 * sin(uTime * (0.6 + h * 2.0) + h * 40.0);
  col += vec3(0.95, 0.28, 0.30) * win * winOn * 0.5 * flick;
  col += vec3(0.60, 0.62, 0.75) * win * step(0.93, cluster) * step(0.5, h) * actHere * 0.55;

  // 레드 회로: 세로 데이터 라인 + 상승 펄스
  float isCirc = step(hash11(cell.x * 7.31), 0.14);
  float lineMask = smoothstep(0.10, 0.03, abs(f.x - 0.5));
  float p1 = fract(vWorld.y * 0.045 - uTime * 0.42 + hash11(cell.x) * 9.0);
  float pulse = smoothstep(0.22, 0.0, p1) * smoothstep(0.0, 0.02, p1);
  vec3 red = vec3(1.0, 0.075, 0.16);
  col += red * isCirc * lineMask * (0.14 + pulse * 3.2) * (0.35 + 0.65 * actHere);

  // 층 경계 링
  float ring = smoothstep(0.045, 0.0, abs(f.y - 0.03));
  col += red * ring * (0.05 + 0.13 * actHere);

  // 스캐너 스윕 — 천천히 상승하는 진단 밴드
  float scanY = mix(-70.0, 190.0, fract(uTime * 0.016));
  float scan = smoothstep(3.2, 0.0, abs(vWorld.y - scanY));
  col += red * scan * (0.10 + 0.22 * actHere);

  // 제품 층 하이라이트
  for (int i = 0; i < 3; i++) {
    float on = step(float(i) + 0.5, uActivation);
    float d = abs(vWorld.y - uFloors[i]);
    float glow = smoothstep(3.4, 0.0, d);
    float beat = 0.8 + 0.2 * sin(uTime * 2.2 + float(i) * 2.0);
    col += uCols[i] * glow * on * beat * 1.35;
  }

  // 컨버전스: 전체가 레드로 고동
  col += red * uConverge * (0.20 + 0.16 * sin(uTime * 3.0 + vWorld.y * 0.08));

  // 거리 안개
  float dist = length(vWorld - uCamPos);
  float fogF = 1.0 - exp(-pow(dist * 0.0135, 2.0));
  vec3 fogCol = vec3(0.016, 0.014, 0.028);
  col = mix(col, fogCol, clamp(fogF, 0.0, 1.0));

  gl_FragColor = vec4(col, uReveal);
}
`;

/* 세트백 티어: [yBottom, yTop, rBottom, rTop] */
const TIERS: [number, number, number, number][] = [
  [-268, -30, 12.4, 10.2],
  [-24, 64, 9.9, 8.9],
  [70, 136, 8.5, 7.6],
  [141, 172, 7.3, 6.2],
];

/* 티어 사이 조인트 칼라: [yCenter, radius, height] */
const COLLARS: [number, number, number][] = [
  [-27, 10.9, 7],
  [67, 9.6, 7],
  [138.5, 8.3, 6],
];

/* 제품 층 링 반경 (티어 표면에 맞춤) */
const RING_R = [9.7, 8.9, 8.4];

export default function Tower() {
  const group = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const trims = useRef<(THREE.Mesh | null)[]>([]);
  const q = getQuality();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uActivation: { value: 0 },
          uConverge: { value: 0 },
          uCols: { value: PRODUCTS.map((p) => new THREE.Color(p.accent)) },
          uFloors: { value: PRODUCTS.map((p) => p.floorY) },
          uCamPos: { value: new THREE.Vector3() },
        },
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: true,
      }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const visible = cine.towerReveal > 0.003 && cine.fade < 0.95;
    g.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime;
    material.uniforms.uTime.value = t;
    material.uniforms.uReveal.value = cine.towerReveal;
    material.uniforms.uActivation.value = cine.activation;
    material.uniforms.uConverge.value = cine.converge;
    material.uniforms.uCamPos.value.copy(state.camera.position);

    if (beacon.current) {
      const s = 1 + Math.sin(t * 3.2) * 0.25;
      beacon.current.scale.setScalar(s);
      (beacon.current.material as THREE.MeshBasicMaterial).opacity =
        cine.towerReveal * (0.6 + 0.4 * Math.sin(t * 3.2));
    }
    // 티어 조인트 네온 트림: 은은한 상시 펄스, 컨버전스에 증폭
    trims.current.forEach((m, i) => {
      if (!m) return;
      (m.material as THREE.MeshBasicMaterial).opacity =
        cine.towerReveal *
        (0.16 + 0.1 * Math.sin(t * 1.6 + i * 2.1) + cine.converge * 0.5);
    });
    // 제품 층 링: 활성화되면 제품 컬러로 점등 + 펄스
    rings.current.forEach((r, i) => {
      if (!r) return;
      const on = cine.activation > i + 0.5 ? 1 : 0;
      const mm = r.material as THREE.MeshBasicMaterial;
      mm.opacity =
        cine.towerReveal * (on ? 0.75 + 0.25 * Math.sin(t * 2.4 + i) : 0.1);
      const s = 1 + (on ? Math.sin(t * 2.4 + i) * 0.012 : 0);
      r.scale.set(s, s, 1);
    });
  });

  return (
    <group ref={group}>
      {/* 세트백 티어 본체 */}
      {TIERS.map(([y0, y1, rB, rT], i) => (
        <mesh key={`tier-${i}`} position={[0, (y0 + y1) / 2, 0]} material={material}>
          <cylinderGeometry
            args={[rT, rB, y1 - y0, q.towerSegments, 1, true]}
          />
        </mesh>
      ))}

      {/* 조인트 칼라 + 네온 트림 */}
      {COLLARS.map(([y, r, h], i) => (
        <group key={`collar-${i}`}>
          <mesh position={[0, y, 0]}>
            <cylinderGeometry args={[r, r, h, q.towerSegments]} />
            <meshBasicMaterial color="#08080e" />
          </mesh>
          <mesh
            ref={(el) => {
              trims.current[i] = el;
            }}
            position={[0, y + h / 2 - 0.35, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[r + 0.06, 0.07, 8, 96]} />
            <meshBasicMaterial
              color="#ff2438"
              transparent
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* 정상 캡 */}
      <mesh position={[0, 178, 0]}>
        <cylinderGeometry args={[0.9, 6.2, 12, 24]} />
        <meshBasicMaterial color="#0a0a12" />
      </mesh>
      {/* 첨탑 */}
      <mesh position={[0, 193, 0]}>
        <cylinderGeometry args={[0.1, 0.75, 18, 8]} />
        <meshBasicMaterial color="#16070c" />
      </mesh>
      {/* 첨탑 비콘 */}
      <mesh ref={beacon} position={[0, 203, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color="#ff2438" transparent toneMapped={false} />
      </mesh>
      {/* 제품 층 링 */}
      {PRODUCTS.map((p, i) => (
        <mesh
          key={p.id}
          ref={(el) => {
            rings.current[i] = el;
          }}
          position={[0, p.floorY, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[RING_R[i], 0.09, 8, 96]} />
          <meshBasicMaterial
            color={p.accent}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
