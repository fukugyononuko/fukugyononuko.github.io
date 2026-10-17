// ニュースの総合テスト（TC-S01 の SCR-07・SCR-08、TC-S09 のニュース、TC-S11〜TC-S13）。
// ビルド済みのサイトを、現在のコンテンツ（RES-03、RES-04）で検査する。
import { expect, test, type Page } from "@playwright/test";

const ARTICLE = "/news/news-section/";
const CANONICAL = `https://fukugyononuko.github.io${ARTICLE}`;

/** セレクターに合う最初の要素の、文書の中での順番（見つからなければ -1） */
async function domOrder(page: Page, selectors: string[]): Promise<number[]> {
  return page.evaluate((sels) => {
    const all = Array.from(document.querySelectorAll("*"));
    return sels.map((s) => {
      const el = document.querySelector(s);
      return el ? all.indexOf(el) : -1;
    });
  }, selectors);
}

test.describe("TC-S01：SCR-07、SCR-08 の画面項目", () => {
  test("SCR-07 ニュース一覧", async ({ page }) => {
    await page.goto("/news/");
    await expect(page).toHaveTitle("ニュース | 副業のぬこ");
    const card = page.locator(".card").first();
    await expect(card.locator("img")).toBeVisible();
    await expect(card.locator(".category")).toHaveText(/^(お知らせ|制作|読み物)$/);
    await expect(card.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
    await expect(card.getByRole("heading", { level: 2 })).not.toBeEmpty();
    await expect(page.getByRole("link", { name: "RSS で購読する" })).toHaveAttribute("href", "/news/rss.xml");
  });

  test("SCR-08 記事", async ({ page }) => {
    await page.goto(ARTICLE);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ホームページにニュース欄を作りました");
    await expect(page.locator(".side .category")).toHaveText("お知らせ");
    await expect(page.locator(".author")).toContainText("副業のぬこ");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await expect(page.locator(".body p").first()).not.toBeEmpty();
    await expect(page.getByRole("link", { name: "ニュースの一覧へ" })).toBeVisible();
  });
});

test("TC-S11：ナビゲーション → 一覧 → 記事。トップの最新のニュースはサービスの上。記事の項目が SCR-08 の表の順", async ({ page }) => {
  await page.goto("/");
  const [news, services] = await domOrder(page, ["#news", "#services"]);
  expect(news).toBeGreaterThan(-1);
  expect(news).toBeLessThan(services);
  await page.locator("section[aria-labelledby=news] .card a").first().click();
  await expect(page).toHaveURL(/\/news\/[a-z0-9-]+\/$/);

  await page.getByRole("navigation", { name: "メインメニュー" }).getByRole("link", { name: "ニュース" }).click();
  await expect(page).toHaveURL("/news/");
  await expect(page.getByRole("link", { name: "ニュース", exact: true })).toHaveAttribute("aria-current", "page");
  const dates = await page.locator(".card time").evaluateAll((ts) => ts.map((t) => t.getAttribute("datetime")!));
  expect(dates).toEqual([...dates].sort().reverse());
  await page.locator(".card a").first().click();
  await expect(page).toHaveURL(/\/news\/[a-z0-9-]+\/$/);

  await page.goto(ARTICLE);
  await expect(page.locator(".head .reading")).toHaveText(/^\d+ 分で読めます$/);
  // HTML の順（スマホの並び）。画像のない記事なので .hero はない。関連記事は記事が 1 件のうちは出ない
  const order = await domOrder(page, [".reading", "h1", ".side .author", ".side time", ".side .category", ".side [data-share]", ".body", ".foot [data-share]", ".follow", ".tags"]);
  expect(order.every((n) => n > -1), `見つからない項目がある：${order}`).toBe(true);
  expect(order).toEqual([...order].sort((a, b) => a - b));
});

test("TC-S11：記事カードに読む時間がある", async ({ page }) => {
  for (const path of ["/", "/news/"]) {
    await page.goto(path);
    await expect(page.locator(".card .reading").first()).toHaveText(/^\d+ 分で読めます$/);
  }
});

test.describe("TC-S11：記事のページの位置関係", () => {
  test.describe("幅 1280px：2 列", () => {
    test.use({ viewport: { width: 1280, height: 900 } });
    test("左の列が本文の列の左にあり、上端は見出しより下", async ({ page }) => {
      await page.goto(ARTICLE);
      const side = (await page.locator(".side").boundingBox())!;
      const main = (await page.locator(".main").boundingBox())!;
      const h1 = (await page.locator("h1").boundingBox())!;
      expect(side.x + side.width).toBeLessThanOrEqual(main.x);
      expect(h1.x).toBeCloseTo(main.x, 0);
      expect(side.y).toBeGreaterThanOrEqual(h1.y + h1.height);
      expect(Math.abs(side.y - main.y)).toBeLessThanOrEqual(1);
    });
  });
  test.describe("幅 360px：1 列", () => {
    test.use({ viewport: { width: 360, height: 780 } });
    test("左の列が本文の上にある", async ({ page }) => {
      await page.goto(ARTICLE);
      const side = (await page.locator(".side").boundingBox())!;
      const main = (await page.locator(".main").boundingBox())!;
      expect(side.y + side.height).toBeLessThanOrEqual(main.y);
      expect(Math.abs(side.x - main.x)).toBeLessThanOrEqual(1);
    });
  });
});

test("TC-S12：共有リンクとフォローのリンク、リンクのコピー", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(ARTICLE);
  for (const share of await page.locator("[data-share]").all()) {
    const links = share.locator("a[data-share-target]");
    expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute("data-share-target")))).toEqual(["x", "threads", "hatena"]);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(await link.getAttribute("href")).toContain(encodeURIComponent(CANONICAL));
    }
  }
  await expect(page.getByRole("link", { name: /^Xで共有/ }).first()).toBeVisible();

  const follow = await page.locator(".follow a").evaluateAll((as) => as.map((a) => a.textContent!.replace(/（新しいタブで開きます）/, "").trim()));
  const footer = await page.locator("footer .channels a").evaluateAll((as) => as.map((a) => a.textContent!.replace(/（新しいタブで開きます）/, "").trim()));
  expect(follow).toEqual(footer);

  const copy = page.getByRole("button", { name: "リンクをコピー" }).first();
  await expect(copy).toBeVisible();
  await copy.click();
  await expect(page.locator("[data-copy-status]").first()).toHaveText("リンクをコピーしました");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(CANONICAL);
});

test("TC-S13：RSS が XML として読め、全画面の head に RSS のリンクがある", async ({ page, request }) => {
  const response = await request.get("/news/rss.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  await page.goto("/");
  const parsed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    return {
      error: doc.querySelector("parsererror")?.textContent ?? null,
      links: Array.from(doc.querySelectorAll("item > link")).map((l) => l.textContent),
      dates: Array.from(doc.querySelectorAll("item > pubDate")).map((d) => Date.parse(d.textContent!)),
    };
  }, xml);
  expect(parsed.error).toBeNull();
  expect(parsed.links).toContain(CANONICAL);
  expect(parsed.links.every((l) => l!.startsWith("https://fukugyononuko.github.io/news/"))).toBe(true);
  expect(parsed.dates.every((d) => !Number.isNaN(d))).toBe(true);
  expect(parsed.dates).toEqual([...parsed.dates].sort((a, b) => b - a));

  for (const path of ["/", "/about/", "/news/", ARTICLE, "/contact/"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute("href", "/news/rss.xml");
  }
});

test.describe("TC-S09：JavaScript が無効でもニュースが読め、リンクのコピーは出ない", () => {
  test.use({ javaScriptEnabled: false });
  test("トップ、一覧、記事", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("section[aria-labelledby=news] .card").first()).toBeVisible();
    await page.goto("/news/");
    await expect(page.locator(".card").first()).toBeVisible();
    await page.goto(ARTICLE);
    await expect(page.locator(".body p").first()).toBeVisible();
    await expect(page.locator("a[data-share-target]").first()).toBeVisible();
    await expect(page.locator(".follow a").first()).toBeVisible();
    await expect(page.locator("button[data-copy-url]").first()).toBeHidden();
  });
});
