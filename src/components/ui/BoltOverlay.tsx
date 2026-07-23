"use client";

import { useEffect, useRef } from "react";

/**
 * SVG 낙뢰 오버레이 — 미드포인트 변위로 가지 치는 번개를 그린다.
 * spawnBolt()는 모듈 싱글턴이라 어디서든 호출 가능 (인트로/앰비언트 스트라이크).
 */

let handler: ((intensity?: number) => void) | null = null;

export function spawnBolt(intensity = 1) {
  handler?.(intensity);
}

function boltPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  displace: number
): string {
  const pts: [number, number][] = [[x1, y1], [x2, y2]];
  let d = displace;
  while (d > 4) {
    for (let i = pts.length - 1; i > 0; i--) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      pts.splice(i, 0, [
        (ax + bx) / 2 + (Math.random() - 0.5) * d,
        (ay + by) / 2 + (Math.random() - 0.5) * d * 0.35,
      ]);
    }
    d *= 0.5;
  }
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
}

export default function BoltOverlay() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    handler = (intensity = 1) => {
      const el = svg.current;
      if (!el) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      el.setAttribute("viewBox", `0 0 ${W} ${H}`);

      const x = W * (0.2 + Math.random() * 0.6);
      const endY = H * (0.4 + Math.random() * 0.25);
      const main = boltPath(x, -30, x + (Math.random() - 0.5) * W * 0.25, endY, W * 0.09);

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.innerHTML = `
        <path d="${main}" fill="none" stroke="rgba(255,240,245,${0.9 * intensity})"
          stroke-width="2.4" filter="url(#bolt-glow)" stroke-linejoin="round"/>
        <path d="${main}" fill="none" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/>
      `;
      // 가지 1-2개
      const branches = 1 + Math.floor(Math.random() * 2);
      for (let b = 0; b < branches; b++) {
        const by = 60 + Math.random() * (endY * 0.5);
        const bx = x + (Math.random() - 0.5) * 60;
        const branch = boltPath(
          bx, by,
          bx + (Math.random() - 0.5) * W * 0.22,
          by + H * (0.12 + Math.random() * 0.16),
          W * 0.05
        );
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", branch);
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", `rgba(255,235,240,${0.55 * intensity})`);
        p.setAttribute("stroke-width", "1");
        p.setAttribute("filter", "url(#bolt-glow)");
        g.appendChild(p);
      }
      el.appendChild(g);

      // 플리커 후 제거
      let vis = true;
      const flicker = setInterval(() => {
        vis = !vis;
        g.style.opacity = vis ? "1" : "0.15";
      }, 45);
      setTimeout(() => {
        clearInterval(flicker);
        let o = 1;
        const fade = setInterval(() => {
          o -= 0.2;
          g.style.opacity = String(Math.max(0, o));
          if (o <= 0) {
            clearInterval(fade);
            g.remove();
          }
        }, 30);
      }, 180 + Math.random() * 120);
    };
    return () => {
      handler = null;
    };
  }, []);

  return (
    <svg
      ref={svg}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 9,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <defs>
        <filter id="bolt-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
