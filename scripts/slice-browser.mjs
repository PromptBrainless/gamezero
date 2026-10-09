import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const output = fileURLToPath(new URL("../screenshots/", import.meta.url));
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const failures = [];
try {
  for (const [label, width, height] of [["desktop", 1280, 900], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") failures.push(message.text()); });
    const response = await page.goto(process.env.SLICE_URL || "http://127.0.0.1:8080/", { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: "Wer zieht zur Nordwacht?" }).waitFor();
    assert.equal(await page.locator(".slice-career").count(), 3);
    for (const name of ["Duellant", "Söldner", "Gelehrtenmagier"]) {
      const choice = page.getByRole("button", { name: new RegExp(`^${name}`) });
      await choice.click();
      assert.equal(await choice.getAttribute("aria-pressed"), "true");
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${label} overflow`);
    await page.screenshot({ path: `${output}slice-careers-${label}.png`, fullPage: true });
    await page.getByRole("button", { name: /aufbrechen/ }).click();
    await page.getByRole("button", { name: "Begegnung beginnen" }).click();
    await page.locator(".slice-scene").waitFor();
    assert.ok(await page.locator(".slice-scene").evaluate((scene) => scene.getBoundingClientRect().height) > 150);
    await page.screenshot({ path: `${output}slice-combat-${label}.png`, fullPage: true });
    let actions = 0;
    while (!(await page.getByRole("heading", { name: "Die Nordwacht gehört dir." }).count())) {
      if (++actions > 150) throw new Error(`${label}: Journey did not finish`);
      const continuation = page.getByRole("button", { name: "Reise fortsetzen" });
      if (await continuation.count()) { await continuation.click(); continue; }
      const start = page.getByRole("button", { name: "Begegnung beginnen" });
      if (await start.count()) { await start.click(); continue; }
      if (await page.getByRole("heading", { name: "Die Nordwacht muss warten." }).count()) throw new Error(`${label}: Mage strategy defeated`);
      const targets = page.locator(".slice-target:not(:disabled)");
      assert.ok(await targets.count() > 0);
      await targets.first().click();
      await page.getByRole("button", { name: /Arkanes Geschoss/ }).click();
      const confirm = page.locator(".slice-preview button");
      if (await confirm.isDisabled()) await page.getByRole("button", { name: /Kraft sammeln/ }).click();
      const before = await page.locator(".slice-title.compact").innerText();
      await confirm.click();
      await page.waitForFunction((text) => document.querySelector(".slice-title.compact")?.textContent.replace(/\s+/g, " ").trim() !== text.replace(/\s+/g, " ").trim() || document.querySelector(".slice-result"), before);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${label} combat overflow`);
    }
    console.log(`${label}: career selection, 2D scene, full four-encounter journey passed (${actions} steps)`);
    await page.close();
  }
  assert.deepEqual(failures, [], "Browser console/page errors");
} finally {
  await browser.close();
}