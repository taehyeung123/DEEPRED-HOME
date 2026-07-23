import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--no-sandbox","--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("console", (m) => { if (m.type()==="error") console.log("[console.error]", m.text()); });
await page.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction(() => document.querySelector(".preloader")?.classList.contains("done"), { timeout: 30000 });
await new Promise((r) => setTimeout(r, 6000));
const before = await page.$eval(".sound-btn", (b) => b.getAttribute("aria-pressed"));
await page.click(".sound-btn");
await new Promise((r) => setTimeout(r, 800));
const after = await page.$eval(".sound-btn", (b) => b.getAttribute("aria-pressed"));
const ctxState = await page.evaluate(() => !!window.AudioContext);
// 스크롤하면서 SFX 트리거 구간 통과 (오류 검증)
for (const p of [0.1, 0.28, 0.47, 0.66, 0.85, 0.95]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(1280*7.875*p*1.42));
  await new Promise((r) => setTimeout(r, 900));
}
console.log(JSON.stringify({ before, after, ctxState }));
await browser.close();
console.log("sound test done, no errors above = pass");
