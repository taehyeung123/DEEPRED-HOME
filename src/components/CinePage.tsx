/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import dynamic from "next/dynamic";

import { cine, SCROLL_VH } from "@/lib/cine";
import { getQuality } from "@/lib/device";
import { audio } from "@/lib/audio";
import { sampleLogoPoints } from "@/lib/logoPoints";
import { BASE, PRODUCTS } from "@/lib/products";

import Preloader from "./ui/Preloader";
import Hud from "./ui/Hud";
import BoltOverlay, { spawnBolt } from "./ui/BoltOverlay";
import {
  CtaScreen,
  FlashLayer,
  IntroTitle,
  ProductOverlays,
  SceneLabel,
  ScrollHint,
} from "./ui/Overlays";
import AfterSections from "./ui/AfterSections";
import GlassCard from "./ui/MockDashboards";

const Experience = dynamic(() => import("./scenes/Experience"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */

function useLoader(canvasReadyRef: React.RefObject<(() => void) | null>) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const targetRef = useRef(0);
  const stateRef = useRef({ raf: 0, display: 0, shown: -1 });

  useEffect(() => {
    const q = getQuality();
    const bump = (v: number) => {
      targetRef.current = Math.min(100, targetRef.current + v);
    };

    document.fonts.ready.then(() => bump(30));
    PRODUCTS.forEach((p) => {
      sampleLogoPoints(p.mark, q.particleCount, 11).then(() => bump(15));
    });
    canvasReadyRef.current = () => bump(25);

    const s = stateRef.current;
    const tick = () => {
      s.display += (targetRef.current - s.display) * 0.06 + 0.05;
      // 정수 %가 바뀔 때만 리렌더
      if (Math.floor(s.display) !== s.shown) {
        s.shown = Math.floor(s.display);
        setProgress(s.display);
      }
      if (s.display >= 99.5 && targetRef.current >= 100) {
        setDone(true);
        return;
      }
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    const failsafe = setTimeout(() => bump(100), 9000);
    return () => {
      cancelAnimationFrame(s.raf);
      clearTimeout(failsafe);
    };
  }, [canvasReadyRef]);

  return { progress, done };
}

/* ------------------------------------------------------------------ */

const SCENE_LABELS: [number, number, string][] = [
  [0.004, 0.115, "SCENE 02 — <b>CLOUD DIVE</b>"],
  [0.115, 0.2, "SCENE 03 — <b>THE TOWER</b>"],
  [0.2, 0.38, "03-1 — <b>REDRANK</b> · BLOG SEO"],
  [0.39, 0.57, "03-2 — <b>FINCH</b> · SNS"],
  [0.58, 0.76, "03-3 — <b>VIEWSCOPE</b> · YOUTUBE"],
  [0.76, 0.885, "SCENE 04 — <b>CONVERGENCE</b>"],
];

export default function CinePage() {
  const canvasReadyRef = useRef<(() => void) | null>(null);
  const { progress, done } = useLoader(canvasReadyRef);
  const [soundOn, setSoundOn] = useState(false);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const introDoneRef = useRef(false);

  useEffect(() => {
    const q = getQuality();
    // 모션 축소 선호 또는 WebGL2 미지원 → 정적 경험 (클라이언트 전용 판별이라 의도적 즉시 setState)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(q.reducedMotion || !q.webgl2);
  }, []);

  /* ---------- 번개 스트라이크 헬퍼 ---------- */
  const strike = useCallback((intensity = 1, bolt = true) => {
    cine.lightX = (Math.random() - 0.5) * 14;
    cine.lightY = 2 + Math.random() * 8;
    cine.lightZ = 18 + Math.random() * 30;
    gsap.fromTo(
      cine,
      { lightningBoost: 0 },
      {
        lightningBoost: intensity,
        duration: 0.09,
        yoyo: true,
        repeat: 3,
        repeatDelay: 0.03,
        ease: "power2.in",
        onComplete: () => {
          cine.lightningBoost = 0;
        },
      }
    );
    if (bolt) spawnBolt(Math.min(1.2, intensity));
    audio.thunder(Math.min(1, intensity * 0.8));
  }, []);

  /* ---------- 메인 셋업 (Lenis + 인트로 + 마스터 타임라인) ---------- */
  useEffect(() => {
    if (reduced !== false || !done) return;
    const root = rootRef.current;
    if (!root) return;

    const q = gsap.utils.selector(root);
    document.body.style.overflow = "hidden";
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __cine: typeof cine }).__cine = cine;
    }

    const lenis = new Lenis({ duration: 1.25 });
    lenisRef.current = lenis;
    lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    const rafCb = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCb);
    gsap.ticker.lagSmoothing(0);

    const letters = q("[data-letter]") as HTMLElement[];
    const word = q("[data-intro-word]")[0] as HTMLElement;
    const label = q("[data-scene-label]")[0] as HTMLElement;

    // 숨김 오버레이는 visibility까지 내려 히트테스트를 차단 (autoAlpha가 복원)
    gsap.set(
      q("[data-cta], [data-prod-panel], [data-prod-logo], [data-blackout], [data-hud]"),
      { autoAlpha: 0 }
    );

    const flickerLetters = (n: number, ms: number) => {
      const idx = gsap.utils.shuffle([...letters.keys()]).slice(0, n);
      idx.forEach((i) => letters[i].classList.add("lit"));
      setTimeout(() => idx.forEach((i) => letters[i].classList.remove("lit")), ms);
    };

    /* ----- 인트로 종료 처리 (완주/스킵 공용, 멱등) ----- */
    const finishIntro = () => {
      if (introDoneRef.current) return;
      introDoneRef.current = true;
      cine.introDone = true;
      if (intro.progress() < 1) {
        // 스킵: 남은 콜백 몰아치기 대신 최종 상태를 직접 세팅
        intro.kill();
        gsap.killTweensOf(cine, "intro,lightningBoost");
        cine.intro = 1;
        cine.lightningBoost = 0;
        letters.forEach((l) => l.classList.remove("lit"));
        word?.classList.add("red");
        gsap.set(q("[data-flash]"), { opacity: 0 });
        // 힌트는 아직 최상단일 때만 — 이미 스크롤해 내려갔다면 켜지 않는다
        const targets =
          cine.progress < 0.02
            ? "[data-intro-tag], [data-scroll-hint], [data-hud]"
            : "[data-intro-tag], [data-hud]";
        gsap.to(q(targets), { autoAlpha: 1, y: 0, duration: 0.5 });
      }
      document.body.style.overflow = "";
      lenis.start();
    };

    /* ----- 콜드 오픈 (시간 기반) ----- */
    const intro = gsap.timeline({ onComplete: finishIntro });

    intro
      .to(cine, { intro: 1, duration: 4.0, ease: "power1.inOut" }, 0)
      .call(() => strike(0.3, false), undefined, 0.9)
      .call(() => flickerLetters(2, 90), undefined, 0.95)
      .call(() => strike(0.5), undefined, 1.7)
      .call(() => flickerLetters(3, 110), undefined, 1.75)
      .call(() => strike(0.75), undefined, 2.4)
      .call(() => flickerLetters(4, 130), undefined, 2.45)
      .call(() => strike(1.0), undefined, 3.05)
      .call(() => flickerLetters(5, 160), undefined, 3.1)
      // 결정적 스트라이크
      .call(
        () => {
          strike(1.3);
          spawnBolt(1.2);
          audio.impact(1.1);
          letters.forEach((l) => l.classList.add("lit"));
        },
        undefined,
        3.7
      )
      .fromTo(
        q("[data-flash]"),
        { opacity: 0 },
        { opacity: 1, duration: 0.1, ease: "power4.in" },
        3.7
      )
      .to(q("[data-flash]"), { opacity: 0, duration: 0.7, ease: "power2.out" }, 3.82)
      .call(
        () => {
          letters.forEach((l) => l.classList.remove("lit"));
          word?.classList.add("red");
        },
        undefined,
        4.05
      )
      .fromTo(
        q("[data-intro-tag]"),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" },
        4.25
      )
      .to(q("[data-scroll-hint]"), { autoAlpha: 1, duration: 0.8 }, 4.6)
      .to(q("[data-hud]"), { autoAlpha: 1, duration: 0.8 }, 4.6);

    const skip = () => finishIntro();
    window.addEventListener("wheel", skip, { passive: true, once: true });
    window.addEventListener("touchstart", skip, { passive: true, once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });

    /* ----- 앰비언트 스트라이크 (히어로 대기 중) ----- */
    const ambient = setInterval(() => {
      if (introDoneRef.current && cine.progress < 0.05 && Math.random() < 0.75) {
        strike(0.35 + Math.random() * 0.6, Math.random() < 0.6);
      }
    }, 4200);

    /* ----- 마스터 스크롤 타임라인 (0..100) ----- */
    const N = "none";
    // 역방향 스크럽에서 임팩트성 SFX 재발화 방지
    function fwd() {
      return (tl.scrollTrigger?.direction ?? 1) >= 0;
    }
    let lastIntensity = -1;
    const tl = gsap.timeline({
      defaults: { ease: N },
      scrollTrigger: {
        trigger: spacerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.1,
        onUpdate: (self) => {
          cine.progress = self.progress;
          // 씬 라벨
          const hit = SCENE_LABELS.find(
            ([a, b]) => self.progress >= a && self.progress < b
          );
          if (label) {
            if (hit && label.dataset.txt !== hit[2]) {
              label.dataset.txt = hit[2];
              label.innerHTML = hit[2];
            }
            const op = hit ? "1" : "0";
            if (label.style.opacity !== op) label.style.opacity = op;
          }
          const intensity = 0.35 + Math.round(self.progress * 20) * 0.0225;
          if (Math.abs(intensity - lastIntensity) > 0.001) {
            lastIntensity = intensity;
            audio.setIntensity(intensity);
          }
        },
      },
    });

    /* Scene 2 — 클라우드 다이브 */
    tl.fromTo(cine, { fly: 0 }, { fly: 34, duration: 15, immediateRender: false }, 0)
      .fromTo(cine, { cloudPart: 0 }, { cloudPart: 1.3, duration: 12, immediateRender: false }, 1.5)
      .to(q("[data-intro-screen]"), { autoAlpha: 0, scale: 1.55, duration: 5, ease: "power2.in" }, 0)
      .fromTo(q("[data-scroll-hint]"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 1.5, immediateRender: false }, 0)
      // 인트로 완주 타이밍과의 레이스 방지: 다이브 이후엔 힌트 강제 숨김
      .set(q("[data-scroll-hint]"), { autoAlpha: 0 }, 3.2)
      .fromTo(q("[data-vignette]"), { opacity: 0 }, { opacity: 0.8, duration: 6, immediateRender: false }, 2)
      .to(q("[data-vignette]"), { opacity: 0, duration: 6 }, 12)
      .call(() => { if (fwd()) audio.whoosh(1.2); }, undefined, 1.2)

      /* Scene 3 도입 — 타워 리빌 (옅은 안개는 잔류시켜 공기감 유지) */
      .fromTo(cine, { world: 0 }, { world: 1, duration: 8, immediateRender: false }, 10)
      .fromTo(cine, { cloudOpacity: 1 }, { cloudOpacity: 0.1, duration: 8, immediateRender: false }, 11)
      .fromTo(cine, { towerReveal: 0 }, { towerReveal: 1, duration: 8, immediateRender: false }, 12)
      .fromTo(
        cine,
        { camY: 196, camRadius: 48, camAngle: -1.35, camPitch: 7 },
        { camY: 52, camRadius: 29, camAngle: 0, camPitch: 0, duration: 12, ease: "power2.inOut", immediateRender: false },
        8
      )
      .call(() => { if (fwd()) audio.thunder(0.7); }, undefined, 12);

    /* 타워 상시 회전 */
    tl.to(cine, { camAngle: 5.4, duration: 70, ease: N }, 20);

    /* 제품 시퀀스 ×3 */
    const starts = [20, 39, 58];
    starts.forEach((S, i) => {
      tl.set(cine, { prodActive: i }, S - 0.8)
        // 1. 로고 줌인 (elastic 오버슛)
        .fromTo(
          q(`[data-prod-logo="${i}"]`),
          { autoAlpha: 0, scale: 0.35 },
          { autoAlpha: 1, scale: 1, duration: 1.8, ease: "back.out(2.2)", immediateRender: false },
          S
        )
        .call(() => { if (fwd()) audio.chime(430 + i * 90); }, undefined, S + 0.4)
        // 2. 로고 → 연기 입자로 해체
        .to(
          q(`[data-prod-logo="${i}"]`),
          { autoAlpha: 0, scale: 1.18, filter: "blur(14px)", duration: 1.6, ease: "power2.in" },
          S + 2.8
        )
        .fromTo(
          cine,
          { prodPhase: 0 },
          { prodPhase: 1, duration: 13.4, ease: N, immediateRender: false },
          S + 1.4
        )
        // 3. 팡 — 플래시 + 셰이크 + FOV 킥 + 층 점등
        .to(q("[data-flash]"), { opacity: 0.55, duration: 0.3, ease: "power3.in" }, S + 7.1)
        .to(q("[data-flash]"), { opacity: 0, duration: 0.8, ease: "power2.out" }, S + 7.45)
        .fromTo(cine, { shake: 0 }, { shake: 1, duration: 0.5, immediateRender: false }, S + 6.8)
        .to(cine, { shake: 0, duration: 2.2, ease: "power2.out" }, S + 7.4)
        .to(cine, { camFov: 71, duration: 0.5, ease: "power3.in" }, S + 6.9)
        .to(cine, { camFov: 62, duration: 2.4, ease: "power2.out" }, S + 7.5)
        .fromTo(
          cine,
          { activation: i },
          { activation: i + 1, duration: 1.8, immediateRender: false },
          S + 7.2
        )
        .call(() => { if (fwd()) { audio.impact(1); audio.whoosh(0.8); } }, undefined, S + 7.1)
        // 4. 유리 패널 리빌
        .fromTo(
          q(`[data-prod-panel="${i}"]`),
          { autoAlpha: 0, y: 84, scale: 0.94 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 3.0, ease: "power3.out", immediateRender: false },
          S + 8.2
        )
        .to(
          q(`[data-prod-panel="${i}"]`),
          { autoAlpha: 0, y: -46, duration: 1.8, ease: "power2.in" },
          S + 15.2
        );
      // 다음 층으로 카메라 상승
      if (i < 2) {
        tl.to(cine, {
          camY: PRODUCTS[i + 1].floorY + 6,
          duration: 5,
          ease: "power1.inOut",
        }, S + 14.5);
      }
    });
    tl.set(cine, { prodActive: -1 }, 76);

    /* Scene 4 — 컨버전스 + CTA (빔이 아래에서 프레임 안으로 상승하도록 로우 앵글) */
    tl.to(cine, { camY: 146, camRadius: 34, camPitch: 17, duration: 8, ease: "power2.inOut" }, 75)
      .fromTo(cine, { converge: 0 }, { converge: 1, duration: 11, ease: N, immediateRender: false }, 77)
      .call(() => { if (fwd()) audio.riser(2.6); }, undefined, 77.3)
      .to(q("[data-flash]"), { opacity: 0.7, duration: 0.5, ease: "power3.in" }, 83.2)
      .to(q("[data-flash]"), { opacity: 0, duration: 1.4, ease: "power2.out" }, 83.7)
      .fromTo(cine, { shake: 0 }, { shake: 0.9, duration: 0.5, immediateRender: false }, 83.0)
      .to(cine, { shake: 0, duration: 2.4, ease: "power2.out" }, 83.6)
      .call(() => { if (fwd()) audio.impact(1.2); }, undefined, 83.4)
      .fromTo(
        q("[data-cta]"),
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 3.4, ease: "power3.out", immediateRender: false },
        85.5
      )
      .to(cine, { camAngle: 6.3, camY: 186, camPitch: 8, duration: 15, ease: "power1.inOut" }, 84)
      /* 마무리 페이드 */
      .to(q("[data-cta]"), { autoAlpha: 0, duration: 2.2, ease: "power2.in" }, 97.5)
      .fromTo(
        q("[data-blackout]"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 3.5, immediateRender: false },
        96.5
      )
      // 블랙아웃 뒤 3D 렌더 부하 제거용
      .fromTo(cine, { fade: 0 }, { fade: 1, duration: 3.5, immediateRender: false }, 96.5);

    intro.play();

    return () => {
      clearInterval(ambient);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      intro.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.ticker.remove(rafCb);
      lenis.destroy();
      document.body.style.overflow = "";
    };
  }, [reduced, done, strike]);

  /* ---------- 내비게이션 ---------- */
  const onNav = useCallback((sel: string) => {
    const lenis = lenisRef.current;
    if (sel === "top") {
      if (lenis) lenis.scrollTo(0, { duration: 2 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.querySelector(sel);
    if (!el) return;
    if (lenis) lenis.scrollTo(el as HTMLElement, { duration: 1.6, offset: -40 });
    else el.scrollIntoView({ behavior: "smooth" });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn(audio.toggle());
  }, []);

  /* ---------- 렌더 ---------- */

  /* 모션 축소 선호 / WebGL2 미지원: 정적 페이지 */
  if (reduced === true) {
    return (
      <div className="grain static-mode">
        <Hud soundOn={false} onToggleSound={() => {}} onNav={onNav} />
        <main id="content">
          <StaticHero />
          <div style={{ padding: "40px 0" }}>
            {PRODUCTS.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "center", padding: "34px 16px" }}>
                <GlassCard product={p} />
              </div>
            ))}
          </div>
          <AfterSections />
        </main>
      </div>
    );
  }

  /* reduced === null(SSG 프리렌더 포함)에도 전체 트리를 렌더해
     정적 HTML에 회사·제품 콘텐츠가 포함되도록 한다. */
  return (
    <div ref={rootRef} className="grain">
      <a className="skip-link" href="#vision">
        본문 바로가기
      </a>
      <Preloader progress={progress} done={done} />
      <Experience onReady={() => canvasReadyRef.current?.()} />
      <BoltOverlay />
      <FlashLayer />
      <SceneLabel />
      <Hud soundOn={soundOn} onToggleSound={toggleSound} onNav={onNav} />
      <main id="content">
        <IntroTitle />
        <ScrollHint />
        <ProductOverlays />
        <CtaScreen onNav={onNav} />
        {/* 시네마틱 스크롤 트랙 */}
        <div ref={spacerRef} style={{ height: `${SCROLL_VH}vh` }} aria-hidden />
        <AfterSections />
      </main>
      <div
        data-blackout
        style={{ position: "fixed", inset: 0, background: "#06060a", zIndex: 8, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}

/* ---------- 모션 축소용 정적 히어로 ---------- */
function StaticHero() {
  return (
    <div
      style={{
        minHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 26,
        background:
          "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(140,0,20,.28), transparent 70%), #06060a",
        padding: "80px 20px 40px",
      }}
    >
      <img
        src={`${BASE}/brand/deepred-mark.svg`}
        alt=""
        width={84}
        height={84}
        style={{ filter: "drop-shadow(0 0 30px rgba(232,16,46,.55))" }}
      />
      <h1 className="intro-word red" style={{ fontSize: "clamp(52px,11vw,150px)" }}>
        DEEPRED
      </h1>
      <p className="intro-tag" style={{ marginTop: 0 }}>
        가장 가까운 곳에, AI가 함께합니다
      </p>
    </div>
  );
}
