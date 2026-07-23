/* eslint-disable @next/next/no-img-element */
"use client";

import { BASE } from "@/lib/products";

export default function Hud({
  soundOn,
  onToggleSound,
  onNav,
}: {
  soundOn: boolean;
  onToggleSound: () => void;
  onNav: (sel: string) => void;
}) {
  return (
    <header className="hud" data-hud>
      <button className="hud-logo" onClick={() => onNav("top")} aria-label="맨 위로">
        <img src={`${BASE}/brand/deepred-mark.svg`} alt="" />
        <span>
          DEEP<b>RED</b>
        </span>
      </button>
      <nav className="hud-nav" aria-label="주요 메뉴">
        <a
          className="hide-m"
          href="#products"
          onClick={(e) => {
            e.preventDefault();
            onNav("#products");
          }}
        >
          PRODUCTS
        </a>
        <a
          className="hide-m"
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            onNav("#about");
          }}
        >
          COMPANY
        </a>
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            onNav("#contact");
          }}
        >
          CONTACT
        </a>
        <button
          className={`sound-btn ${soundOn ? "on" : ""}`}
          onClick={onToggleSound}
          aria-pressed={soundOn}
        >
          <span className="sound-bars" aria-hidden>
            <i /><i /><i /><i />
          </span>
          {soundOn ? "SOUND ON" : "SOUND OFF"}
        </button>
      </nav>
    </header>
  );
}
