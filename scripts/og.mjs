import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--no-sandbox","--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction(() => document.querySelector(".preloader")?.classList.contains("done"), { timeout: 30000 });
await new Promise((r) => setTimeout(r, 6200));
// HUD/힌트/데브배지 없이 깔끔하게
await page.evaluate(() => {
  document.querySelector("[data-hud]")?.remove();
  document.querySelector("[data-scroll-hint]")?.remove();
  document.querySelector("nextjs-portal")?.remove();
});
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: "public/og.png" });
await browser.close();
console.log("og.png saved");
