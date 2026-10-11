// 共通レイアウトとデザインの検査（SCR-00、02a §2a.7）
// TC-N04（幅 360px で横スクロールなし）と TC-N05（ダークモード）。フェーズ 3 で全画面に広げる。
import { expect, test } from "@playwright/test";

const pages = ["/", "/about/", "/services/", "/services/homepage-mock/", "/contact/", "/no-such-page/"];

test.describe("TC-N04：幅 360px で横スクロールが発生しない", () => {
  test.use({ viewport: { width: 360, height: 780 } });
  for (const path of pages) {
    test(path, async ({ page }) => {
      await page.goto(path);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(360);
    });
  }
});

test.describe("TC-N05：OS のダークモード設定に追従する", () => {
  for (const [scheme, expected] of [["light", "rgb(246, 242, 234)"], ["dark", "rgb(27, 33, 40)"]] as const) {
    test(scheme, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe(expected);
    });
  }
});

test("SCR-00：ヘッダーのナビゲーションが現在のページを示す", async ({ page }) => {
  await page.goto("/about/");
  const nav = page.getByRole("navigation", { name: "メインメニュー" });
  await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "サービス" })).not.toHaveAttribute("aria-current", "page");
});

test("SCR-00：本文へ移動するリンクがある", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "本文へ移動" })).toBeFocused();
});
