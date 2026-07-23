export type Quality = {
  tier: "high" | "mid" | "low";
  isMobile: boolean;
  dpr: [number, number];
  cloudSteps: number;
  particleCount: number;
  towerSegments: number;
  postFx: boolean;
  reducedMotion: boolean;
  webgl2: boolean;
};

let cached: Quality | null = null;

export function getQuality(): Quality {
  if (cached) return cached;
  if (typeof window === "undefined") {
    return {
      tier: "high",
      isMobile: false,
      dpr: [1, 2],
      cloudSteps: 48,
      particleCount: 20000,
      towerSegments: 160,
      postFx: true,
      reducedMotion: false,
      webgl2: true,
    };
  }

  const isMobile =
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 8;

  let webgl2 = false;
  try {
    webgl2 = !!document.createElement("canvas").getContext("webgl2");
  } catch {
    webgl2 = false;
  }

  let tier: Quality["tier"] = "high";
  if (isMobile || cores <= 4 || mem <= 4) tier = "mid";
  if ((isMobile && (cores <= 4 || mem <= 3)) || cores <= 2) tier = "low";

  cached = {
    tier,
    isMobile,
    reducedMotion,
    webgl2,
    dpr: tier === "high" ? [1, 2] : tier === "mid" ? [1, 1.5] : [0.8, 1],
    cloudSteps: tier === "high" ? 48 : tier === "mid" ? 34 : 24,
    particleCount: tier === "high" ? 20000 : tier === "mid" ? 11000 : 6000,
    towerSegments: tier === "high" ? 160 : 110,
    postFx: tier !== "low",
  };
  return cached;
}
