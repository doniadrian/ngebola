// Mengukur pergeseran isi saat Select/Dialog dibuka (scrollbar asli). node scripts/uji-lompat.mjs [url]
import { chromium } from "playwright-core";
const url = process.argv[2] ?? "http://localhost:3000/jelajahi";
const b = await chromium.launch({ channel: "msedge", ignoreDefaultArgs: ["--hide-scrollbars"] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 560 } })).newPage();
await p.goto(url); await p.waitForLoadState("networkidle");
const ukur = () => p.evaluate(() => ({ h1: Math.round(document.querySelector("h1").getBoundingClientRect().left), lebar: document.documentElement.clientWidth, margin: getComputedStyle(document.body).marginRight, padding: getComputedStyle(document.body).paddingRight }));
console.log("tertutup", JSON.stringify(await ukur()));
await p.getByRole("combobox").first().click();
await p.waitForTimeout(400);
console.log("terbuka ", JSON.stringify(await ukur()));
await p.keyboard.press("Escape");
await p.waitForTimeout(400);
console.log("ditutup ", JSON.stringify(await ukur()));
await b.close();
