/* eslint-disable @next/next/no-img-element */
"use client";

import { BASE } from "@/lib/products";

export default function Preloader({
  progress,
  done,
}: {
  progress: number;
  done: boolean;
}) {
  const pct = Math.floor(Math.min(100, progress));
  return (
    <div
      className={`preloader ${done ? "done" : ""}`}
      aria-hidden={done}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label="페이지 로딩"
    >
      <img
        className="preloader-logo"
        src={`${BASE}/brand/deepred-mark.svg`}
        alt="DEEPRED"
      />
      <div className="preloader-bar">
        <i style={{ transform: `scaleX(${Math.min(1, progress / 100)})` }} />
      </div>
      <div className="preloader-pct">{pct}% — CINEMATIC LOADING</div>
    </div>
  );
}
