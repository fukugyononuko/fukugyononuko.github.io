// フェーズ 1 の疎通確認。TC-S01（トップの表示）と TC-S05（404）の最小版。
// 画面項目の検査はフェーズ 3 で TC-S01 の本体として広げる。
import { expect, test } from "@playwright/test";

test("TC-S01（最小）：トップが表示される", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("副業のぬこ");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("副業のぬこ");
});

test("TC-S05：存在しない URL で 404 ページが表示され、トップに戻れる", async ({ page }) => {
  const response = await page.goto("/no-such-page/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ページが見つかりません");
  await page.getByRole("link", { name: "トップへ戻る" }).click();
  await expect(page).toHaveURL("/");
});
