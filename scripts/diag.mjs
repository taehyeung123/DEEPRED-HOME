import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--no-sandbox","--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction(() => document.querySelector(".preloader")?.classList.contains("done"), { timeout: 30000 });
await new Promise((r) => setTimeout(r, 5200));
const scrollEnd = await page.evaluate(() => window.innerHeight * 14);
for (const p of [0.252, 0.442, 0.632]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(scrollEnd * p));
  await new Promise((r) => setTimeout(r, 2600));
  const c = await page.evaluate(() => {
    const c = window.__cine;
    return { progress: +c.progress.toFixed(4), prodActive: c.prodActive, prodPhase: +c.prodPhase.toFixed(3), camAngle: +c.camAngle.toFixed(3), camY: +c.camY.toFixed(1), camPitch: c.camPitch, camRadius: c.camRadius };
  });
  console.log(p, JSON.stringify(c));
}
await browser.close();
