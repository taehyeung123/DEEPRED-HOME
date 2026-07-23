/* eslint-disable @next/next/no-img-element */
import type { Product } from "@/lib/products";

/**
 * 제품별 미니 대시보드 목업 — 실제 서비스 화면 대신
 * 유리판 위에 떠 있는 상징적 프리뷰. 순수 HTML/CSS/SVG라 어떤 해상도에서도 선명하다.
 */

function Spark({ d, color, id }: { d: string; color: string; id: string }) {
  return (
    <svg viewBox="0 0 120 44" style={{ width: "100%", height: 44 }} aria-hidden>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.5" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L 120 44 L 0 44 Z`} fill={`url(#sg-${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RedrankBody({ p }: { p: Product }) {
  const rows = [
    { kw: "브랜드 마케팅 전략", rank: "1위", w: 96, up: "▲ 12" },
    { kw: "AI 블로그 자동화", rank: "1위", w: 90, up: "▲ 8" },
    { kw: "SEO 상위노출 방법", rank: "2위", w: 78, up: "▲ 21" },
    { kw: "콘텐츠 키워드 분석", rank: "3위", w: 64, up: "▲ 5" },
  ];
  return (
    <div className="glass-body">
      <div className="mock-block">
        <div className="mock-label">
          <span>KEYWORD RANKING</span>
          <b>실시간 순위 추적</b>
        </div>
        <div className="mock-rows">
          {rows.map((r) => (
            <div className="mock-row" key={r.kw}>
              <span style={{ minWidth: 118, fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.kw}</span>
              <span className="bar"><i style={{ transform: `scaleX(${r.w / 100})` }} /></span>
              <span className="val" style={{ color: p.accent }}>{r.rank}</span>
              <span className="up">{r.up}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mock-block">
        <div className="mock-label"><span>SEO SCORE</span></div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: p.accent }}>94</span>
          <span style={{ fontSize: 12, color: "var(--dim)" }}>/ 100</span>
        </div>
        <Spark id="rr" color={p.accent} d="M0 38 L14 34 L28 35 L42 28 L56 24 L70 18 L84 14 L98 10 L112 6 L120 4" />
        <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--faint)", letterSpacing: "0.08em" }}>
          지난 30일 상위노출 <b style={{ color: p.accent }}>+287%</b>
        </div>
      </div>
    </div>
  );
}

function FinchBody({ p }: { p: Product }) {
  const rows = [
    { ch: "Instagram", w: 88, val: "128K" },
    { ch: "TikTok", w: 72, val: "94K" },
    { ch: "Threads", w: 54, val: "41K" },
  ];
  return (
    <div className="glass-body">
      <div className="mock-block">
        <div className="mock-label">
          <span>UNIFIED CHANNELS</span>
          <b>통합 채널 분석</b>
        </div>
        <div className="mock-rows">
          {rows.map((r) => (
            <div className="mock-row" key={r.ch}>
              <span style={{ minWidth: 84, fontSize: 11.5 }}>{r.ch}</span>
              <span className="bar"><i style={{ transform: `scaleX(${r.w / 100})` }} /></span>
              <span className="val">{r.val}</span>
              <span className="up">▲</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--faint)" }}>
          <span>META ADS</span>
          <span>ROAS <b style={{ color: p.accent }}>412%</b></span>
        </div>
      </div>
      <div className="mock-block">
        <div className="mock-label"><span>ENGAGEMENT</span></div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: p.accent }}>+64</span>
          <span style={{ fontSize: 12, color: "var(--dim)" }}>%</span>
        </div>
        <Spark id="fc" color={p.accent} d="M0 36 L14 30 L28 33 L42 26 L56 28 L70 20 L84 22 L98 12 L112 10 L120 6" />
        <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--faint)", letterSpacing: "0.08em" }}>
          광고 소진 대비 전환 <b style={{ color: p.accent }}>2.8×</b>
        </div>
      </div>
    </div>
  );
}

function ViewscopeBody({ p }: { p: Product }) {
  return (
    <div className="glass-body">
      <div className="mock-block">
        <div className="mock-label">
          <span>RETENTION CURVE</span>
          <b>시청 지속률 분석</b>
        </div>
        <Spark id="vs" color={p.accent} d="M0 6 L14 10 L28 18 L42 22 L56 24 L70 23 L84 26 L98 30 L112 31 L120 32" />
        <div className="mock-rows" style={{ marginTop: 10 }}>
          <div className="mock-row">
            <span style={{ minWidth: 96, fontSize: 11.5 }}>훅 유지율</span>
            <span className="bar"><i style={{ transform: "scaleX(0.82)" }} /></span>
            <span className="val" style={{ color: p.accent }}>82%</span>
          </div>
          <div className="mock-row">
            <span style={{ minWidth: 96, fontSize: 11.5 }}>평균 시청 시간</span>
            <span className="bar"><i style={{ transform: "scaleX(0.67)" }} /></span>
            <span className="val">6:41</span>
          </div>
        </div>
      </div>
      <div className="mock-block">
        <div className="mock-label"><span>NEXT VIDEO AI</span></div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: p.accent }}>1.2M</span>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 2, letterSpacing: "0.08em" }}>예상 도달 조회수</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {["#쇼츠전략", "#업로드타이밍", "#썸네일A/B"].map((t) => (
            <span key={t} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, border: `1px solid ${p.accent}44`, color: p.accent }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GlassCard({ product }: { product: Product }) {
  return (
    <div
      className="glass-card"
      style={
        {
          "--accent": product.accent,
          "--accent-dim": product.accentDim,
          "--accent-text": product.accent,
        } as React.CSSProperties
      }
    >
      <div className="glass-head">
        <div className="dots"><i /><i /><i /></div>
        <div className="url">{product.domain}</div>
        <img src={product.mark} alt="" width={20} height={20} />
      </div>
      {product.id === "redrank" && <RedrankBody p={product} />}
      {product.id === "finch" && <FinchBody p={product} />}
      {product.id === "viewscope" && <ViewscopeBody p={product} />}
    </div>
  );
}
