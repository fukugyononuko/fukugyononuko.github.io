// TC-U07 ArticleAccess（DD-08、FR-11、FR-14）
import { describe, expect, it } from "vitest";
import { createLocalArticleAccess, InvalidArticleError, type ArticleEntry } from "../../src/system/resource-access/article-access";
import { newsSchema } from "../../src/system/resource-access/article-access/schema";

const valid = { title: "見出し", summary: "要約", category: "notice", date: "2026-10-01" };
const entry = (id: string, data: Record<string, unknown> = {}, html = `<p>${id}</p>`): ArticleEntry => ({
  id,
  data: newsSchema.parse({ ...valid, ...data }),
  html,
});

function access(entries: ArticleEntry[], images: string[] = []) {
  return createLocalArticleAccess({ articles: async () => entries, imageExists: (src) => images.includes(src) });
}

describe("TC-U07 ArticleAccess：契約の型への変換", () => {
  const entries = [
    entry("old", { date: "2026-01-01" }),
    entry("same-b", { date: "2026-10-01" }),
    entry("same-a", { date: "2026-10-01", tags: ["web"] }),
    entry("hidden", { date: "2026-12-01", draft: true }),
  ];

  it("新しい順、同じ日付は id の順。下書きを含めない。本文を含めない", async () => {
    const list = await access(entries).listRecentArticles();
    expect(list.map((a) => a.slug)).toEqual(["same-a", "same-b", "old"]);
    expect(list[0]).toEqual({
      id: "same-a", slug: "same-a", title: "見出し", summary: "要約", category: "notice",
      date: "2026-10-01", updated: undefined, tags: ["web"], image: undefined,
    });
    expect(list[0]).not.toHaveProperty("body");
  });

  it("limit 件まで", async () => {
    expect((await access(entries).listRecentArticles(2)).map((a) => a.slug)).toEqual(["same-a", "same-b"]);
  });

  it("findArticle：本文つき。下書きと、ない slug は undefined", async () => {
    expect((await access(entries).findArticle("old"))?.body).toBe("<p>old</p>");
    expect(await access(entries).findArticle("hidden")).toBeUndefined();
    expect(await access(entries).findArticle("nothing")).toBeUndefined();
  });

  it("画像は、ファイルがあれば返す", async () => {
    const image = { src: "/images/news/a.webp", alt: "説明", caption: "キャプション" };
    const [a] = await access([entry("a", { image })], ["/images/news/a.webp"]).listRecentArticles();
    expect(a.image).toEqual(image);
  });

  it("既定値：tags は空、draft は false", () => {
    expect(newsSchema.parse(valid)).toMatchObject({ tags: [], draft: false });
  });
});

describe("TC-U07 ArticleAccess：検証規則（DD-08）", () => {
  it("slug（ファイル名）が規則に合わなければ InvalidArticleError", async () => {
    await expect(access([entry("Bad_Name")]).listRecentArticles()).rejects.toBeInstanceOf(InvalidArticleError);
  });

  it("画像のファイルがなければ InvalidArticleError", async () => {
    const e = entry("a", { image: { src: "/images/news/missing.webp", alt: "説明" } });
    await expect(access([e]).listRecentArticles()).rejects.toThrow(/public\/images\/news\/missing\.webp/);
  });

  const invalid: [string, Record<string, unknown>][] = [
    ["分類の欠落", { category: undefined }],
    ["分類が一覧にない", { category: "blog" }],
    ["見出しが 61 字", { title: "あ".repeat(61) }],
    ["要約が 121 字", { summary: "あ".repeat(121) }],
    ["公開日の欠落", { date: undefined }],
    ["更新日が公開日より前", { date: "2026-10-02", updated: "2026-10-01" }],
    ["タグの重複", { tags: ["web", "web"] }],
    ["タグが 6 個", { tags: ["a", "b", "c", "d", "e", "f"] }],
    ["画像の alt の欠落", { image: { src: "/images/news/a.webp" } }],
    ["画像の置き場所が違う", { image: { src: "/images/a.webp", alt: "説明" } }],
    ["知らない項目", { author: "だれか" }],
  ];
  it.each(invalid)("%s はスキーマで失敗する", (_name, data) => {
    expect(() => newsSchema.parse({ ...valid, ...data })).toThrow();
  });

  it("境界：見出し 60 字、要約 120 字、更新日が公開日と同じ日は通る", () => {
    expect(() => newsSchema.parse({ ...valid, title: "あ".repeat(60), summary: "あ".repeat(120), updated: valid.date })).not.toThrow();
  });
});
