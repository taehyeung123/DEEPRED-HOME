import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--no-sandbox","--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://localhost:3777", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));
await page.screenshot({ path: "shots-m/reduced-hero.png" });
const info = await page.evaluate(() => ({
  hasCanvas: !!document.querySelector("canvas"),
  heroText: document.querySelector(".intro-word")?.textContent,
  sections: [...document.querySelectorAll("section")].map((s) => s.id),
}));
console.log(JSON.stringify(info));
await browser.close();
