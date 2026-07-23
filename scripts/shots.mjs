/**
 * 헤드리스 시각 검증: 시네마틱 진행도(스페이서 기준)별 스크린샷.
 * 사용: node scripts/shots.mjs [outDir] [--mobile]
 */
import puppeteer from "puppeteer";
import fs from "node:fs";

const out = process.argv[2] ?? "shots";
const mobile = process.argv.includes("--mobile");
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--enable-unsafe-swiftshader",
    "--disable-gpu-sandbox",
    "--no-sandbox",
    "--mute-audio",
  ],
});
const page = await browser.newPage();
await page.setViewport(
  mobile
    ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
    : { width: 1280, height: 720, deviceScaleFactor: 1 }
);

page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) console.log(`[${m.type()}]`, m.text());
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });

await page.waitForFunction(
  () => document.querySelector(".preloader")?.classList.contains("done"),
  { timeout: 30000 }
);
console.log("preloader done");

await new Promise((r) => setTimeout(r, 5500));
await page.screenshot({ path: `${out}/00-hero.png` });
console.log("hero captured");

// 시네마틱 진행도 p → 스크롤 위치 (스페이서 1500vh 기준: 끝 = 14 * vh)
const scrollEnd = await page.evaluate(() => window.innerHeight * 14);

const stops = [
  ["01-dive", 0.06],
  ["02-tower-reveal", 0.17],
  ["03-rr-logo", 0.212],
  ["04-rr-swirl", 0.252],
  ["05-rr-burst", 0.273],
  ["06-rr-panel", 0.31],
  ["07-fc-logo", 0.402],
  ["08-fc-burst", 0.463],
  ["09-fc-panel", 0.50],
  ["10-vs-logo", 0.592],
  ["11-vs-burst", 0.653],
  ["12-vs-panel", 0.69],
  ["13-converge-mid", 0.815],
  ["14-converge-peak", 0.845],
  ["15-cta", 0.92],
];

for (const [name, p] of stops) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(scrollEnd * p));
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log("captured", name);
}

// 애프터 섹션
const H = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
for (const [name, y] of [
  ["16-metrics", scrollEnd + 400],
  ["17-products", scrollEnd + 1100],
  ["18-roadmap", scrollEnd + 1900],
  ["19-footer", H],
]) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await new Promise((r) => setTimeout(r, 1800));
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log("captured", name);
}

await browser.close();
console.log("all done");
