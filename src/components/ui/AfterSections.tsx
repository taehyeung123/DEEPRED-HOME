/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BASE, CONTACT_EMAIL, PRODUCTS } from "@/lib/products";
import { getQuality } from "@/lib/device";

gsap.registerPlugin(ScrollTrigger);

/**
 * 시네마틱 이후 이어지는 정보 섹션.
 * 톤은 유지하되 투자자가 원하는 '정제된 정보'를 담는다.
 */
export default function AfterSections() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (getQuality().reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 44,
          autoAlpha: 0,
          duration: 1.0,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="after" ref={root}>
      <div className="after-inner">
        {/* ---- 핵심 지표 ---- */}
        <section id="vision" style={{ paddingTop: 90 }}>
          <div data-reveal>
            <div className="sec-eyebrow">WHY DEEPRED</div>
            <h2 className="sec-title">
              하나의 AI 코어,
              <br />
              세 개의 검증된 시장
            </h2>
            <p className="sec-desc">
              블로그 검색, 소셜 미디어, 유튜브 — 사람들이 매일 머무는 세 개의
              채널 위에 딥레드의 AI가 동작합니다. 각 제품은 독립적으로
              성장하고, 하나의 코어 엔진 위에서 데이터를 공유하며 서로를
              가속합니다.
            </p>
          </div>
          <div className="metrics-grid" data-reveal>
            <div className="metric">
              <div className="metric-num">3<small>제품</small></div>
              <div className="metric-cap">동시 운영되는 AI SaaS 라인업</div>
            </div>
            <div className="metric">
              <div className="metric-num">1<small>코어</small></div>
              <div className="metric-cap">제품을 관통하는 통합 AI 엔진</div>
            </div>
            <div className="metric">
              <div className="metric-num">2026.08</div>
              <div className="metric-cap">(주)딥레드 법인 설립</div>
            </div>
            <div className="metric">
              <div className="metric-num">10<small>배</small></div>
              <div className="metric-cap">목표 콘텐츠 운영 효율</div>
            </div>
          </div>
          <p className="metric-note" data-reveal>
            * 상세 트랙션·재무 지표는 IR 자료를 통해 제공됩니다. 하단 투자
            문의로 요청해 주세요.
          </p>
        </section>

        {/* ---- 제품 ---- */}
        <section id="products" style={{ paddingTop: 130 }}>
          <div data-reveal>
            <div className="sec-eyebrow">PRODUCTS</div>
            <h2 className="sec-title">일상의 채널마다, 딥레드</h2>
          </div>
          <div className="prod-grid">
            {PRODUCTS.map((p) => (
              <article
                key={p.id}
                className="prod-card"
                data-reveal
                style={
                  {
                    "--accent": p.accent,
                    "--accent-text": p.accent,
                  } as React.CSSProperties
                }
              >
                <img className="mark" src={p.mark} alt="" />
                <h3>{p.nameKo}</h3>
                <div className="en">{p.nameEn} — {p.field}</div>
                <p>
                  <b style={{ color: "var(--fg)" }}>{p.tagline}.</b>
                  <br />
                  {p.sub}
                </p>
                {p.url ? (
                  <a className="link" href={p.url} target="_blank" rel="noopener noreferrer">
                    {p.domain} <i>→</i>
                  </a>
                ) : (
                  <span className="link" style={{ color: "var(--faint)", pointerEvents: "none" }}>
                    {p.domain} — 출시 준비 중
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ---- 회사 / 로드맵 ---- */}
        <section id="about" style={{ paddingTop: 130 }}>
          <div data-reveal>
            <div className="sec-eyebrow">COMPANY</div>
            <h2 className="sec-title">
              딥레드는 AI를
              <br />
              일상의 도구로 만듭니다
            </h2>
            <p className="sec-desc">
              거창한 기술 데모가 아니라, 크리에이터와 브랜드가 오늘 바로 쓰는
              도구. 딥레드는 콘텐츠가 만들어지고 소비되는 모든 채널에 AI를
              심어, 개인과 팀이 미디어 기업의 화력을 갖게 하는 것을 목표로
              합니다.
            </p>
          </div>
          <div className="roadmap" data-reveal>
            <div className="road-item">
              <div className="road-when">2025 — 2026 상반기</div>
              <h3>제품 개발</h3>
              <p>Redrank · Finch · Viewscope 3개 AI SaaS 개발 및 내부 검증.</p>
            </div>
            <div className="road-item hot">
              <div className="road-when">2026.08 (예정)</div>
              <h3>(주)딥레드 법인 설립</h3>
              <p>법인 전환과 함께 팀 확장 및 정식 서비스 운영 체제로 전환.</p>
            </div>
            <div className="road-item">
              <div className="road-when">2026 하반기</div>
              <h3>3개 제품 정식 출시</h3>
              <p>순차 론칭과 함께 초기 유저 트랙션 확보, 유료 전환 검증.</p>
            </div>
            <div className="road-item">
              <div className="road-when">2027</div>
              <h3>통합 AI 플랫폼</h3>
              <p>
                채널을 넘나드는 크로스 데이터 인사이트 — 하나의 딥레드 계정으로
                모든 콘텐츠 채널을 운영하는 통합 플랫폼으로 확장.
              </p>
            </div>
          </div>
        </section>

        {/* ---- 컨택트 ---- */}
        <section id="contact">
          <div className="contact-band" data-reveal>
            <div className="sec-eyebrow" style={{ marginBottom: 22 }}>CONTACT</div>
            <h2 className="sec-title" style={{ marginBottom: 30 }}>
              딥레드의 다음 장을
              <br />
              함께 쓰실 분을 찾습니다
            </h2>
            <div className="prod-cta" style={{ justifyContent: "center" }}>
              <a
                className="btn btn-red"
                href={`mailto:${CONTACT_EMAIL}?subject=[DEEPRED] 투자 문의`}
              >
                투자 문의 <i>→</i>
              </a>
              <a
                className="btn btn-ghost"
                href={`mailto:${CONTACT_EMAIL}?subject=[DEEPRED] 파트너십 제안`}
              >
                파트너십 제안
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ---- 푸터 ---- */}
      <footer className="footer">
        <div className="brand">
          <img src={`${BASE}/brand/deepred-mark.svg`} alt="" />
          <span>DEEPRED</span>
        </div>
        <small>
          © 2026 DEEPRED. All rights reserved.
          <br />
          (주)딥레드 — 2026년 8월 법인 설립 예정 · {CONTACT_EMAIL}
        </small>
      </footer>
    </div>
  );
}
