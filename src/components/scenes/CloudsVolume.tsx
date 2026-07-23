"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cine } from "@/lib/cine";
import { getQuality } from "@/lib/device";

/**
 * 레이마칭 볼류메트릭 구름 — 화면 공간 풀스크린 쿼드.
 * 카메라와 독립된 '하늘 공간'에서 계산되며 uFly로 전진 비행을 표현한다.
 * iq 스타일 텍스처 기반 3D 노이즈(픽셀당 1회 페치)로 모바일까지 대응.
 */

function makeNoiseTexture(): THREE.DataTexture {
  const S = 256;
  const data = new Uint8Array(S * S * 4);
  const rand = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) rand[i] = Math.floor(Math.random() * 256);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      // R: 슬라이스 z, G: 슬라이스 z+1 (37,239 오프셋 미리 계산)
      data[i * 4] = rand[i];
      data[i * 4 + 1] = rand[((y + 239) % S) * S + ((x + 37) % S)];
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.99999, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uNoise;
uniform vec2 uRes;
uniform float uTime;
uniform float uFly;
uniform float uPart;
uniform float uOpacity;
uniform float uBoost;
uniform float uWorldGlow;
uniform float uSteps;
uniform vec3 uLightPos;
uniform float uIntro;

float noise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  vec2 uv = (p.xy + vec2(37.0, 239.0) * p.z) + f.xy;
  vec2 rg = texture2D(uNoise, (uv + 0.5) / 256.0).rg;
  return mix(rg.x, rg.y, f.z) * 2.0 - 1.0;
}

float fbm(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * noise3(p);
    p = p * 2.03 + vec3(13.7, 7.1, 3.9);
    a *= 0.5;
  }
  return s;
}

// 셀프섀도 샘플용 저비용 3옥타브 fbm
float fbmS(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 3; i++) {
    s += a * noise3(p);
    p = p * 2.03 + vec3(13.7, 7.1, 3.9);
    a *= 0.5;
  }
  return s;
}

float density(vec3 p) {
  vec3 q = p * 0.085 + vec3(0.0, uTime * 0.012, uTime * 0.02);
  float base = fbm(q);
  float band = 1.0 - smoothstep(0.0, 15.0, abs(p.y + 1.0));
  float d = base * 1.2 + band * 0.85 - 0.58;
  // 인트로: 구름이 서서히 형성됨
  d -= (1.0 - uIntro) * 0.9;
  // 다이브 터널: 중심축 주변 밀도 제거
  float axis = length(p.xy + vec2(0.0, 1.5));
  d -= uPart * smoothstep(11.0, 0.0, axis) * 1.5;
  return d;
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 q = vUv * 2.0 - 1.0;
  q.x *= uRes.x / uRes.y;
  vec3 ro = vec3(0.0, 0.0, uFly);
  vec3 rd = normalize(vec3(q * 0.58, 1.0));

  float jitter = hash12(gl_FragCoord.xy + uTime);
  float t = 2.0 + jitter * 2.2;
  vec4 acc = vec4(0.0);
  vec3 lightP = uLightPos + vec3(0.0, 0.0, uFly);

  for (int i = 0; i < 64; i++) {
    if (i >= int(uSteps) || acc.a > 0.98) break;
    vec3 p = ro + rd * t;
    float d = density(p);
    if (d > 0.0) {
      vec3 pu = p + vec3(0.0, 2.2, 0.0);
      vec3 qu = pu * 0.085 + vec3(0.0, uTime * 0.012, uTime * 0.02);
      float dUp = fbmS(qu) * 1.2 + (1.0 - smoothstep(0.0, 15.0, abs(pu.y + 1.0))) * 0.85 - 0.58;
      float shade = clamp((d - dUp) * 1.7 + 0.32, 0.0, 1.0);
      vec3 col = mix(vec3(0.012, 0.013, 0.024), vec3(0.155, 0.16, 0.21), shade);
      // 아래에서 올라오는 딥레드 언더글로우
      col += vec3(0.55, 0.035, 0.07) * smoothstep(4.0, -13.0, p.y) * (0.4 + uWorldGlow * 1.6);
      // 번개 포인트 라이트
      float ld = length(p - lightP);
      col += vec3(1.0, 0.96, 1.15) * uBoost * exp(-ld * ld * 0.0045) * 4.0;
      // 원거리 은은한 번개 산란
      col += vec3(0.75, 0.72, 0.95) * uBoost * 0.10;

      float a = clamp(d * 0.62, 0.0, 1.0);
      col *= a;
      acc.rgb += col * (1.0 - acc.a);
      acc.a += a * (1.0 - acc.a);
    }
    t += 1.75 + t * 0.02;
  }

  // 하늘 배경으로 새어드는 플래시
  acc.rgb += vec3(0.85, 0.85, 1.05) * uBoost * 0.10 * (1.0 - acc.a);
  // 딥 스카이 그라디언트(구름 없는 영역)
  vec3 sky = mix(vec3(0.006, 0.006, 0.013), vec3(0.024, 0.008, 0.014), smoothstep(0.4, -0.6, rd.y));
  acc.rgb += sky * (1.0 - acc.a);

  gl_FragColor = vec4(acc.rgb, uOpacity * max(acc.a, 0.85));
}
`;

export default function CloudsVolume() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const q = getQuality();

  const uniforms = useMemo(
    () => ({
      uNoise: { value: makeNoiseTexture() },
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uFly: { value: 0 },
      uPart: { value: 0 },
      uOpacity: { value: 1 },
      uBoost: { value: 0 },
      uWorldGlow: { value: 0 },
      uSteps: { value: q.cloudSteps },
      uLightPos: { value: new THREE.Vector3(3, 5, 34) },
      uIntro: { value: 0 },
    }),
    [q.cloudSteps]
  );

  useFrame((state) => {
    const m = mat.current;
    const me = mesh.current;
    if (!m || !me) return;
    const visible = cine.cloudOpacity > 0.004 && cine.fade < 0.95;
    me.visible = visible;
    if (!visible) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uRes.value.set(size.width, size.height);
    m.uniforms.uFly.value = cine.fly;
    m.uniforms.uPart.value = cine.cloudPart;
    m.uniforms.uOpacity.value = cine.cloudOpacity;
    m.uniforms.uBoost.value = cine.lightningBoost;
    m.uniforms.uWorldGlow.value = cine.world;
    m.uniforms.uIntro.value = Math.min(1, cine.intro * 1.6);
    m.uniforms.uLightPos.value.set(cine.lightX, cine.lightY, cine.lightZ);
    // 옅은 잔류 안개 상태에선 스텝 수를 낮춰 상시 비용 절감
    m.uniforms.uSteps.value =
      cine.cloudOpacity < 0.25 ? Math.min(18, q.cloudSteps) : q.cloudSteps;
  });

  // 노이즈 텍스처 GPU 메모리 해제
  useEffect(() => {
    const tex = uniforms.uNoise.value;
    return () => {
      tex.dispose();
    };
  }, [uniforms]);

  return (
    <mesh ref={mesh} frustumCulled={false} renderOrder={100}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
