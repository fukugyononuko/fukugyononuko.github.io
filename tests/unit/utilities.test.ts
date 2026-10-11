// TC-U08 Seo、TC-U09 Config / Analytics（DD-10）
import { describe, expect, it } from "vitest";
import { createSiteConfig, toAbsoluteUrl, withBase } from "../../src/system/utilities/config";
import { createSeo } from "../../src/system/utilities/seo";
import { createAnalytics, noAnalytics } from "../../src/system/utilities/analytics";

describe("TC-U09 Config", () => {
  it("site と base から設定を作る", () => {
    expect(createSiteConfig({ SITE: "https://example.github.io/", BASE_URL: "/" })).toEqual({
      siteUrl: "https://example.github.io",
      base: "/",
      locale: "ja",
    });
  });

  it("ベースパスを正規化して付ける", () => {
    const config = createSiteConfig({ SITE: "https://example.com", BASE_URL: "home" });
    expect(withBase(config, "/contact/")).toBe("/home/contact/");
    expect(toAbsoluteUrl(config, "/contact/")).toBe("https://example.com/home/contact/");
  });

  it("site がなければ失敗する", () => {
    expect(() => createSiteConfig({})).toThrow();
  });
});

describe("TC-U08 Seo", () => {
  const seo = createSeo(createSiteConfig({ SITE: "https://example.github.io", BASE_URL: "/" }));

  it("トップのタイトルはサイト名だけ", () => {
    expect(seo.buildPageMeta({ siteName: "ぬこ", description: "説明", path: "/" }).title).toBe("ぬこ");
  });

  it("それ以外は「ページ名 | サイト名」、canonical と OGP 画像は絶対 URL", () => {
    expect(seo.buildPageMeta({ siteName: "ぬこ", title: "About", description: "説明", path: "/about/" })).toEqual({
      title: "About | ぬこ",
      description: "説明",
      canonical: "https://example.github.io/about/",
      ogImage: "https://example.github.io/og-default.jpg",
      ogType: "website",
    });
  });
});

describe("TC-U09 Analytics", () => {
  it("設定がなければ null", async () => {
    expect(await createAnalytics(noAnalytics).getAnalyticsTag()).toBeNull();
  });
});
