import puppeteer from "puppeteer";
import fs from "node:fs";
const out = process.argv[2] ?? "shots-q";
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--no-sandbox","--mute-audio"] });
const page = await browser.newPage();
await page.setViewport(process.argv.includes("--mobile") ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { width: 1280, height: 720, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction(() => document.querySelector(".preloader")?.classList.contains("done"), { timeout: 30000 });
await new Promise((r) => setTimeout(r, 5200));
const scrollEnd = await page.evaluate(() => window.innerHeight * 14);
const stops = JSON.parse(process.argv[3] ?? '[["a",0.25]]');
for (const [name, p] of stops) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(scrollEnd * p));
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log("captured", name);
}
await browser.close();
