import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--no-sandbox","--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction(() => document.querySelector(".preloader")?.classList.contains("done"), { timeout: 30000 });
await new Promise((r) => setTimeout(r, 6000));

// 1) 히어로에서 화면 중앙 하단 히트테스트 — CTA 버튼이 가로채면 안 됨
const hit = await page.evaluate(() => {
  const el = document.elementFromPoint(640, 560);
  return el ? `${el.tagName}.${el.className}`.slice(0, 80) : "none";
});
console.log("hit-test @hero(640,560):", hit);

// 2) 씬 회귀 확인 스크린샷
const scrollEnd = await page.evaluate(() => window.innerHeight * 14);
for (const [name, p] of [["v2-rr-panel",0.31],["v2-converge",0.845],["v2-cta",0.92]]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(scrollEnd * p));
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: `shots-m/${name}.png` });
}
// CTA 구간에서 버튼 히트테스트 — 이땐 버튼이어야 함
const hitCta = await page.evaluate(() => {
  const btn = document.querySelector("[data-cta] .btn-red");
  const r = btn.getBoundingClientRect();
  const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return el ? (btn.contains(el) ? "cta-button-ok" : el.tagName) : "none";
});
console.log("hit-test @cta:", hitCta);
await browser.close();

// 3) reduced-motion: HUD 보임 확인
const b2 = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--no-sandbox","--mute-audio"] });
const p2 = await b2.newPage();
await p2.setViewport({ width: 1280, height: 720 });
await p2.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await p2.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
const hudVis = await p2.evaluate(() => {
  const hud = document.querySelector(".hud");
  const cs = getComputedStyle(hud);
  return { opacity: cs.opacity, visibility: cs.visibility };
});
console.log("reduced hud:", JSON.stringify(hudVis));
await p2.screenshot({ path: "shots-m/v2-reduced.png" });
await b2.close();
console.log("verify2 done");
