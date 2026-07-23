/* eslint-disable @next/next/no-img-element */
"use client";

import { BASE, CONTACT_EMAIL, PRODUCTS } from "@/lib/products";
import GlassCard from "./MockDashboards";

/**
 * 시네마틱 구간의 고정 오버레이들.
 * GSAP이 클래스/데이터 속성 셀렉터로 직접 트윈한다. (모두 초기 opacity 0)
 */

export function IntroTitle() {
  return (
    <div className="screen" data-intro-screen style={{ zIndex: 12 }}>
      <div className="intro-title">
        <h1 className="intro-word" data-intro-word aria-label="DEEPRED">
          {"DEEPRED".split("").map((ch, i) => (
            <span key={i} data-letter aria-hidden="true">{ch}</span>
          ))}
        </h1>
        <p className="intro-tag" data-intro-tag style={{ opacity: 0 }}>
          가장 가까운 곳에, AI가 함께합니다
        </p>
      </div>
    </div>
  );
}

export function ProductOverlays() {
  return (
    <>
      {PRODUCTS.map((p, i) => (
        <div key={p.id}>
          {/* 1단계: 로고 줌인 */}
          <div className="prod-logo-flyin" data-prod-logo={i}>
            <img src={p.mark} alt={`${p.nameKo} 로고`} />
          </div>
          {/* 4단계: 유리 패널 리빌 */}
          <div className="prod-panel-wrap" data-prod-panel={i}>
            <div className="prod-eyebrow" style={{ color: p.accent }}>
              {p.field}
            </div>
            <h2 className="prod-title">
              {p.tagline}
              <small>
                <b style={{ color: p.accent }}>{p.nameKo}</b> — {p.sub}
              </small>
            </h2>
            <GlassCard product={p} />
            <div className="prod-cta">
              {p.url ? (
                <a className="btn btn-red" href={p.url} target="_blank" rel="noopener noreferrer">
                  {p.nameKo} 바로가기 <i>→</i>
                </a>
              ) : (
                <span className="btn btn-ghost" style={{ cursor: "default" }}>
                  {p.domain} — 출시 준비 중
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function CtaScreen({ onNav }: { onNav: (sel: string) => void }) {
  return (
    <div className="cta-screen" data-cta>
      <img
        src={`${BASE}/brand/deepred-mark.svg`}
        alt=""
        width={64}
        height={64}
        style={{ filter: "drop-shadow(0 0 24px rgba(232,16,46,.6))" }}
      />
      <h2 className="cta-line">
        세 개의 AI가 하나로.
        <br />
        가장 가까운 곳에, <em>DEEPRED</em>
      </h2>
      <p className="cta-sub">
        블로그 · SNS · 유튜브 — 일상의 채널에 스며드는 AI.
        <br />
        딥레드가 콘텐츠의 미래를 설계합니다.
      </p>
      <div className="prod-cta">
        <a className="btn btn-red" href={`mailto:${CONTACT_EMAIL}?subject=[DEEPRED] 투자 문의`}>
          투자 문의 <i>→</i>
        </a>
        <button className="btn btn-ghost" onClick={() => onNav("#products")}>
          제품 살펴보기
        </button>
      </div>
    </div>
  );
}

export function FlashLayer() {
  return (
    <>
      <div className="flash" data-flash />
      <div className="vignette-red" data-vignette />
    </>
  );
}

export function SceneLabel() {
  return <div className="scene-label" data-scene-label />;
}

export function ScrollHint() {
  return (
    <div className="scroll-hint" data-scroll-hint style={{ opacity: 0 }}>
      SCROLL TO DIVE
    </div>
  );
}
