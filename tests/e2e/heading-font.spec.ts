// 見出しフォントのサブセット（scripts/subset-heading-font.mjs）に、画面で見出しフォントを使う文字がすべて入っていること。
// 抜けた文字は、別のフォントで表示されて見た目が崩れるため。
import { expect, test } from "@playwright/test";

const pages = ["/", "/about/", "/services/", "/services/homepage-mock/", "/news/", "/news/news-section/", "/contact/", "/no-such-page/"];

test.describe("見出しフォントのサブセットに、使っている文字がすべて入っている", () => {
  for (const path of pages) {
    test(path, async ({ page, request }) => {
      const subset = new Set(await (await request.get("/fonts/heading-chars.txt")).text());
      await page.goto(path);
      const used = await page.evaluate(() => {
        const chars = new Set<string>();
        for (const el of document.querySelectorAll("body *")) {
          if (!getComputedStyle(el).fontFamily.includes("Zen Maru Gothic")) continue;
          for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) for (const ch of node.textContent ?? "") if (ch.trim()) chars.add(ch);
          }
        }
        return [...chars];
      });
      expect(used.length).toBeGreaterThan(0);
      expect(used.filter((ch) => !subset.has(ch))).toEqual([]);
    });
  }

  test("フォントのライセンス（OFL）も公開している", async ({ request }) => {
    expect((await request.get("/fonts/OFL.txt")).status()).toBe(200);
  });
});
