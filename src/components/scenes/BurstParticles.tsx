"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cine } from "@/lib/cine";
import { getQuality } from "@/lib/device";
import { PRODUCTS } from "@/lib/products";
import { sampleLogoPoints } from "@/lib/logoPoints";

/**
 * 제품 리빌 파티클 시스템.
 * uPhase 0..1 (스크롤 스크럽, 완전 결정론적):
 *   0.00-0.28 gather  — 사방에서 모여 로고 실루엣 형성
 *   0.28-0.50 swirl   — 연기처럼 소용돌이
 *   0.50-0.80 burst   — 제품별 패턴으로 폭발 확산
 *   0.80-1.00 fade
 * 버스트 모드: 0=rise(빛기둥 상승) 1=murmuration(새떼) 2=aperture(조리개)
 */

const VERT = /* glsl */ `
attribute vec4 aRand;
attribute vec3 aTarget;
uniform float uPhase;
uniform float uMode;
uniform float uTime;
uniform vec3 uOrigin;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uFwd;
uniform float uSizeBase;
varying float vAlpha;
varying float vHot;

float ease(float t) { return t * t * (3.0 - 2.0 * t); }
float easeOut(float t) { return 1.0 - pow(1.0 - t, 3.0); }

void main() {
  float t = uPhase;
  vec3 tgt = aTarget;

  // 로컬(로고 평면) 공간에서 계산 후 카메라 기저로 월드 변환
  // 스폰: 실루엣 주변 랜덤 구
  vec3 spawnDir = normalize(aRand.xyz * 2.0 - 1.0 + vec3(0.0001));
  vec3 spawn = tgt + spawnDir * (14.0 + aRand.w * 26.0);

  float gather = ease(smoothstep(0.0, 0.28, t));
  vec3 pos = mix(spawn, tgt, gather);

  // 소용돌이
  float swirlEnv = smoothstep(0.20, 0.42, t) * (1.0 - smoothstep(0.46, 0.62, t));
  float ang = uTime * 0.5 + aRand.x * 6.2831 + t * 5.0;
  vec3 swirl = vec3(
    sin(ang + tgt.y * 0.35),
    cos(ang * 0.8 + tgt.x * 0.35),
    sin(ang * 0.6)
  ) * (0.55 + aRand.y * 0.9);
  pos += swirl * swirlEnv;

  // 버스트
  float bt = smoothstep(0.50, 0.86, t);
  float b = easeOut(bt);
  if (bt > 0.0) {
    vec3 dir;
    float a2 = aRand.y * 6.2831;
    if (uMode < 0.5) {
      // rise: 위로 솟구치는 빛줄기
      dir = vec3((aRand.x - 0.5) * 0.55, 1.0 + aRand.z * 0.7, (aRand.z - 0.5) * 0.3);
      dir = normalize(dir);
      pos = mix(pos, pos + dir * (30.0 + aRand.w * 46.0), b);
    } else if (uMode < 1.5) {
      // murmuration: 군집 새떼 — 그룹별 방향 + 스윕 곡선
      float grp = floor(aRand.x * 5.0);
      float ga = grp * 1.2566 + aRand.w * 0.7;
      dir = normalize(vec3(cos(ga), sin(ga * 1.3) * 0.6 + 0.15, sin(ga) * 0.5));
      vec3 sweep = vec3(
        sin(b * 6.0 + grp * 2.0),
        cos(b * 5.0 + grp),
        sin(b * 4.0 + grp * 3.0)
      ) * 4.5 * b * (1.0 - b);
      pos = mix(pos, pos + dir * (26.0 + aRand.z * 34.0) + sweep, b);
    } else {
      // aperture: 조리개 원형 확산 + 회전 스윕
      float blades = 9.0;
      float snap = floor(aRand.y * blades) / blades * 6.2831;
      float aa = mix(a2, snap, 0.55) + b * 1.9;
      dir = vec3(cos(aa), sin(aa), 0.0);
      pos = mix(pos, pos + dir * (24.0 + aRand.w * 34.0) + vec3(0.0, 0.0, (aRand.z - 0.3) * 12.0 * b), b);
    }
  }

  // 알파/사이즈 엔벨로프
  float ain = smoothstep(0.02, 0.16, t);
  float aout = 1.0 - smoothstep(0.78, 0.98, t);
  vAlpha = ain * aout * (0.5 + aRand.z * 0.5);
  vHot = smoothstep(0.44, 0.52, t) * (1.0 - smoothstep(0.52, 0.72, t));

  vec3 world = uOrigin + uRight * pos.x + uUp * pos.y + uFwd * pos.z;
  vec4 mv = viewMatrix * vec4(world, 1.0);
  float size = uSizeBase * (0.7 + aRand.w * 0.9) * (1.0 + vHot * 1.6);
  gl_PointSize = min(size * (120.0 / max(1.0, -mv.z)), 24.0);
  gl_Position = projectionMatrix * mv;
}
`;

/* useFrame GC 방지용 스크래치 벡터 (모듈 스코프 재사용) */
const _toCam = new THREE.Vector3();
const _origin = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _axis = new THREE.Vector3();

const FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uExposure;
varying float vAlpha;
varying float vHot;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float disc = smoothstep(0.5, 0.12, d);
  vec3 col = mix(uColor, vec3(1.0, 0.98, 0.96), vHot * 0.85);
  gl_FragColor = vec4(col * (uExposure + vHot * 2.4), disc * vAlpha);
  if (gl_FragColor.a < 0.003) discard;
}
`;

export default function BurstParticles() {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const activeRef = useRef(-1);
  const targetsRef = useRef<(Float32Array | null)[]>([null, null, null]);
  const q = getQuality();
  const N = q.particleCount;

  const { positions, rands } = useMemo(() => {
    const positions = new Float32Array(N * 3);
    const rands = new Float32Array(N * 4);
    // 시드 PRNG(mulberry32): 렌더 순수성 유지 + 리렌더 간 결정론
    let seed = 0x9e3779b9;
    for (let i = 0; i < N * 4; i++) {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      rands[i] = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return { positions, rands };
  }, [N]);

  const uniforms = useMemo(
    () => ({
      uPhase: { value: 0 },
      uMode: { value: 0 },
      uTime: { value: 0 },
      uOrigin: { value: new THREE.Vector3() },
      uRight: { value: new THREE.Vector3(1, 0, 0) },
      uUp: { value: new THREE.Vector3(0, 1, 0) },
      uFwd: { value: new THREE.Vector3(0, 0, 1) },
      uColor: { value: new THREE.Color("#ff3b4e") },
      uExposure: { value: 1.0 },
      uSizeBase: { value: q.isMobile ? 0.95 : 1.15 },
    }),
    [q.isMobile]
  );

  // 로고 실루엣 프리로드
  useEffect(() => {
    let alive = true;
    PRODUCTS.forEach((p, i) => {
      sampleLogoPoints(p.mark, N, 11).then((arr) => {
        if (alive) targetsRef.current[i] = arr;
      });
    });
    return () => {
      alive = false;
    };
  }, [N]);

  useFrame((state) => {
    const pts = points.current;
    const m = mat.current;
    if (!pts || !m) return;
    const active = cine.prodActive;
    const visible = active >= 0 && cine.prodPhase > 0.001 && cine.prodPhase < 0.999;
    pts.visible = visible;
    if (!visible) return;

    // 제품 전환 시 타깃 버퍼 스왑
    if (activeRef.current !== active) {
      const tgt = targetsRef.current[active];
      if (tgt) {
        const attr = pts.geometry.getAttribute("aTarget") as THREE.BufferAttribute;
        (attr.array as Float32Array).set(tgt);
        attr.needsUpdate = true;
        m.uniforms.uColor.value.set(PRODUCTS[active].accent);
        // 채움이 많은 실루엣일수록 가산 포화를 낮춘다
        m.uniforms.uExposure.value = [1.0, 0.5, 0.62][active];
        m.uniforms.uMode.value = active === 0 ? 0 : active === 1 ? 1 : 2;
        activeRef.current = active;
      } else {
        pts.visible = false;
        return;
      }
    }

    m.uniforms.uPhase.value = cine.prodPhase;
    m.uniforms.uTime.value = state.clock.elapsedTime;

    // 쇼 평면: 타워 밖, 카메라 쪽으로 12유닛
    const p = PRODUCTS[active];
    const cam = state.camera;
    _axis.set(0, cam.position.y, 0);
    _toCam.subVectors(cam.position, _axis).normalize();
    _origin.set(_toCam.x * 17, p.floorY + 6, _toCam.z * 17);
    m.uniforms.uOrigin.value.copy(_origin);

    // 카메라 기저(빌보드)
    _fwd.subVectors(cam.position, _origin).normalize();
    _right.crossVectors(cam.up, _fwd).normalize();
    _up.crossVectors(_fwd, _right).normalize();
    m.uniforms.uRight.value.copy(_right);
    m.uniforms.uUp.value.copy(_up);
    m.uniforms.uFwd.value.copy(_fwd);
  });

  return (
    <points ref={points} frustumCulled={false} visible={false} renderOrder={10}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRand" args={[rands, 4]} />
        <bufferAttribute attach="attributes-aTarget" args={[new Float32Array(N * 3), 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
