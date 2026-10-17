// 総合テスト（TC-S）。ビルド済みのサイトを、現在のコンテンツ（RES-01〜03）で検査する。
import { expect, test } from "@playwright/test";

test.describe("TC-S01：全画面が表示され、画面項目がある", () => {
  test("SCR-01 トップ", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("副業のぬこ");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("副業のぬこ");
    for (const name of ["できること", "サービス", "制作例"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await expect(page.locator("section[aria-labelledby=services] .card").first()).toBeVisible();
  });

  test("SCR-02 About", async ({ page }) => {
    await page.goto("/about/");
    await expect(page).toHaveTitle("About | 副業のぬこ");
    await expect(page.getByRole("img", { name: /アイコン/ })).toBeVisible();
    await expect(page.locator(".bio p").first()).not.toBeEmpty();
    await expect(page.getByRole("heading", { level: 2, name: "できること" })).toBeVisible();
  });

  test("SCR-03 サービス一覧", async ({ page }) => {
    await page.goto("/services/");
    await expect(page).toHaveTitle("サービス | 副業のぬこ");
    const cards = page.locator(".card");
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first().locator(".price")).not.toBeEmpty();
  });

  test("SCR-04 サービス詳細", async ({ page }) => {
    await page.goto("/services/homepage-mock/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ホームページ・モックの制作");
    await expect(page.getByText("料金")).toBeVisible();
    await expect(page.getByRole("link", { name: "このサービスについて問い合わせる" })).toBeVisible();
  });

  test("SCR-05 問い合わせ", async ({ page }) => {
    await page.goto("/contact/");
    await expect(page).toHaveTitle("問い合わせ | 副業のぬこ");
    await expect(page.locator(".channel a, .channel form, .channel iframe").first()).toBeVisible();
  });
});

test("TC-S02：トップ → サービス一覧 → 詳細 → 問い合わせ（サービスを指定）と進める", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "サービスを見る" }).click();
  await expect(page).toHaveURL("/services/");
  await page.locator(".card a").first().click();
  await expect(page).toHaveURL(/\/services\/[a-z0-9-]+\/$/);
  const slug = new URL(page.url()).pathname.split("/")[2];
  await page.getByRole("link", { name: "このサービスについて問い合わせる" }).click();
  await expect(page).toHaveURL(`/contact/?service=${slug}`);
  const select = page.locator("select[data-service-select]");
  if (await select.count()) await expect(select).toHaveValue(slug);
});

test("TC-S04：全画面のフッターに外部チャネルのリンクがある", async ({ page }) => {
  for (const path of ["/", "/about/", "/services/", "/news/", "/news/news-section/", "/contact/"]) {
    await page.goto(path);
    const links = page.locator("footer .channels a");
    expect(await links.count()).toBeGreaterThan(0);
    await expect(links.first()).toHaveAttribute("target", "_blank");
  }
});

test("TC-S05：存在しない URL で 404 ページが表示され、トップに戻れる", async ({ page }) => {
  const response = await page.goto("/no-such-page/");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("ページが見つかりません | 副業のぬこ");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await page.getByRole("link", { name: "トップへ戻る" }).click();
  await expect(page).toHaveURL("/");
});

test("TC-S08：サイト内リンクにリンク切れがない", async ({ page, request }) => {
  const seen = new Set<string>();
  const queue = ["/"];
  while (queue.length > 0) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    for (const href of hrefs) {
      const target = href.split(/[?#]/)[0];
      if (!seen.has(target)) queue.push(target);
    }
  }
  for (const asset of ["/sitemap-index.xml", "/robots.txt", "/og-default.jpg", "/favicon.png", "/news/rss.xml"]) {
    expect((await request.get(asset)).status(), asset).toBe(200);
  }
});

test.describe("TC-S09：JavaScript が無効でも主要な内容が表示される", () => {
  test.use({ javaScriptEnabled: false });
  test("トップ、About、サービス詳細", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("section[aria-labelledby=services] .card").first()).toBeVisible();
    await page.goto("/about/");
    await expect(page.locator(".bio p").first()).toBeVisible();
    await page.goto("/services/homepage-mock/");
    await expect(page.getByRole("link", { name: "このサービスについて問い合わせる" })).toBeVisible();
  });
});

test("TC-S10：すべての制作例に種類のラベルが表示される", async ({ page }) => {
  await page.goto("/about/");
  const works = page.locator(".work");
  const count = await works.count();
  for (let i = 0; i < count; i++) {
    await expect(works.nth(i).locator(".kind")).toHaveText(/^(受託|個人制作|サンプル)$/);
  }
});

test("TC-N12：?service= に HTML を含む値を与えても解釈されない", async ({ page }) => {
  let dialog = false;
  page.on("dialog", async (d) => {
    dialog = true;
    await d.dismiss();
  });
  await page.goto(`/contact/?service=${encodeURIComponent('"><img src=x onerror=alert(1)>')}`);
  await page.waitForLoadState("networkidle");
  expect(dialog).toBe(false);
  expect(await page.locator("img[src='x']").count()).toBe(0);
});

test("TC-N13：外部リンクには noopener noreferrer が付き、iframe には sandbox が付く", async ({ page }) => {
  for (const path of ["/", "/about/", "/services/homepage-mock/", "/news/news-section/", "/contact/"]) {
    await page.goto(path);
    const external = page.locator("a[href^='http']");
    const n = await external.count();
    for (let i = 0; i < n; i++) {
      await expect(external.nth(i)).toHaveAttribute("rel", "noopener noreferrer");
    }
    const frames = page.locator("iframe");
    for (let i = 0; i < (await frames.count()); i++) {
      await expect(frames.nth(i)).toHaveAttribute("sandbox", /.+/);
    }
  }
});

test("TC-N03：全画面に固有の title・description・canonical・OGP がある", async ({ page }) => {
  const titles = new Set<string>();
  for (const path of ["/", "/about/", "/services/", "/services/homepage-mock/", "/news/", "/news/news-section/", "/contact/"]) {
    await page.goto(path);
    const title = await page.title();
    expect(titles.has(title), `${path} の title が重複`).toBe(false);
    titles.add(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://fukugyononuko.github.io${path}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\/.+\.jpg$/);
  }
});

test("TC-N14：問い合わせの送信先は https で、ハニーポット欄があり、必須項目が指定されている", async ({ page }) => {
  await page.goto("/contact/");
  const form = page.locator(".channel form");
  if ((await form.count()) === 0) test.skip(true, "問い合わせ手段が form-post ではない");
  await expect(form).toHaveAttribute("action", /^https:\/\//);
  await expect(form).toHaveAttribute("method", "post");
  await expect(form.locator(".honeypot input")).toHaveAttribute("tabindex", "-1");
  await expect(form.locator("input[type=email]")).toHaveAttribute("required", "");
  await expect(form.locator("textarea")).toHaveAttribute("required", "");
});
