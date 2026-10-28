// Uji cepat animasi tombol: node scripts/uji-gerak.mjs (server dev harus jalan).
import { chromium } from "playwright-core";
(async () => {
  const b = await chromium.launch({ channel: "msedge" });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
  await p.goto("http://localhost:3000/masuk");
  const btn = p.getByRole("button", { name: "Masuk" });
  const ukur = () => btn.evaluate((e) => { const c = getComputedStyle(e); return { t: c.translate, s: c.boxShadow.replace(/rgba?([^)]*)/g, "").trim(), ditekan: e.hasAttribute("data-ditekan") }; });
  console.log("diam   ", await ukur());
  const box = await btn.boundingBox();
  await p.mouse.move(box.x + 30, box.y + 20);
  await p.waitForTimeout(400);
  console.log("hover  ", await ukur());
  await p.mouse.down();
  await p.waitForTimeout(120);
  console.log("tekan  ", await ukur());
  await p.mouse.up();
  const lintasan = [];
  for (let i = 0; i < 8; i++) { lintasan.push((await ukur()).t); await p.waitForTimeout(30); }
  console.log("lepas  ", lintasan.join(" | "));
  // Ketukan sangat singkat (HP): data-ditekan harus bertahan ≥ 100 ms.
  await p.mouse.move(5, 5); await p.waitForTimeout(300);
  await p.mouse.move(box.x + 30, box.y + 20);
  await p.evaluate(() => document.querySelector("button[type=submit]").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
  await p.evaluate(() => window.dispatchEvent(new PointerEvent("pointerup")));
  await p.waitForTimeout(60);
  console.log("tap60ms", (await ukur()).ditekan);
  await p.waitForTimeout(150);
  console.log("tap210 ", (await ukur()).ditekan);
  await b.close();
})();
