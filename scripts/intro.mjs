import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--no-sandbox","--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction(() => document.querySelector(".preloader")?.classList.contains("done"), { timeout: 30000 });
const t0 = Date.now();
const marks = [800, 1800, 2600, 3780, 4300];
for (const m of marks) {
  const wait = t0 + m - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  await page.screenshot({ path: `shots-m/intro-${m}.png` });
}
await browser.close();
console.log("intro frames done");
