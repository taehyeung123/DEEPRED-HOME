/**
 * 시네마틱 경험의 단일 상태 소스.
 * GSAP 타임라인이 이 객체의 필드를 스크럽하고,
 * R3F 씬은 매 프레임 이 값을 읽어 렌더링한다.
 */
export const cine = {
  /** 콜드 오픈(시간 기반) 진행도 0..1 */
  intro: 0,
  introDone: false,

  /** 마스터 스크롤 진행도 0..1 */
  progress: 0,

  /** 구름 레이어 */
  fly: 0, // 다이브 비행 거리
  cloudOpacity: 1,
  cloudPart: 0, // 구름 갈라짐
  lightningBoost: 0, // 인트로 낙뢰 수동 부스트
  lightX: 3,
  lightY: 5,
  lightZ: 34,

  /** 월드 전환: 0=구름 하늘, 1=타워 세계 */
  world: 0,

  /** 타워 */
  towerReveal: 0,
  activation: 0, // 점등된 층 수 0..3

  /** 카메라 */
  camY: 196,
  camAngle: -1.35,
  camRadius: 48,
  camFov: 62,
  camPitch: 0, // 위를 올려다보는 각도(컨버전스)
  shake: 0,

  /** 제품 시퀀스 */
  prodActive: -1,
  prodPhase: 0, // 활성 제품 내부 진행도 0..1

  /** 컨버전스 */
  converge: 0,

  /** 마지막 페이드 아웃 */
  fade: 0,
};

/** 마스터 타임라인 구간 (스크롤 진행도 기준) */
export const SEG = {
  dive: [0.0, 0.13],
  towerIn: [0.1, 0.2],
  products: [
    [0.2, 0.37],
    [0.39, 0.56],
    [0.58, 0.75],
  ] as [number, number][],
  converge: [0.77, 0.9],
  cta: [0.89, 1.0],
} as const;

/** 시네마틱 스크롤 총 높이 (vh) */
export const SCROLL_VH = 1500;

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function remap(v: number, a: number, b: number) {
  return clamp01((v - a) / (b - a));
}
