// TC-U04 ContentAccess（DD-02、FR-14）
import { describe, expect, it } from "vitest";
import { createContentAccess, InvalidContentError, type ContentSource } from "../../src/system/resource-access/content-access";
import {
  presentationSchema, profileSchema, serviceSchema, skillGroupSchema, workSchema,
} from "../../src/system/resource-access/content-access/schemas";

const validService = serviceSchema.parse({ title: "サービス", summary: "要約", price: { kind: "quote" } });
const validWork = workSchema.parse({ kind: "sample", title: "例", summary: "要約", date: "2026-10-01" });

function source(overrides: Partial<ContentSource> = {}): ContentSource {
  return {
    profile: async () => ({
      id: "profile",
      data: profileSchema.parse({ displayName: "ぬこ", tagline: "一言", avatar: { src: "/a.webp", alt: "アイコン" } }),
      html: "<p>自己紹介</p>",
    }),
    skillGroups: async () => [
      { id: "web", data: skillGroupSchema.parse({ id: "web", name: "ウェブ", skills: [{ id: "site", name: "サイト" }] }) },
    ],
    works: async () => [
      { id: "shown", data: validWork },
      { id: "hidden", data: { ...validWork, draft: true } },
    ],
    services: async () => [
      { id: "web-site", data: validService, html: "<p>本文</p>" },
      { id: "draft-one", data: { ...validService, draft: true } },
    ],
    presentation: async () =>
      presentationSchema.parse({
        pricePolicy: "as-is",
        curation: {
          skills: { featuredLimit: 3, sort: "order" },
          works: { featuredLimit: 3, sort: "date-desc" },
          services: { featuredLimit: 3, sort: "order" },
        },
      }),
    ...overrides,
  };
}

describe("TC-U04 ContentAccess：契約の型への変換", () => {
  const access = createContentAccess(source());

  it("プロフィールの本文は変換済みの HTML", async () => {
    expect((await access.getOperatorProfile()).bio).toBe("<p>自己紹介</p>");
  });

  it("下書きのサービスと制作例を含めない", async () => {
    expect((await access.listOfferedServices()).map((s) => s.slug)).toEqual(["web-site"]);
    expect((await access.listWorks()).map((w) => w.id)).toEqual(["shown"]);
  });

  it("サービスの slug はファイル名、本文は HTML、省略した値は既定値", async () => {
    const s = await access.findOfferedService("web-site");
    expect(s).toMatchObject({ slug: "web-site", body: "<p>本文</p>", cta: { route: "inquiry" }, featured: false, order: 100 });
  });

  it("下書きのサービスは見つからない", async () => {
    expect(await access.findOfferedService("draft-one")).toBeUndefined();
  });

  it("スキルの id は分類の中で一意になるよう分類の id を付ける", async () => {
    expect((await access.listSkillGroups())[0].skills[0].id).toBe("web/site");
  });

  it("制作例の日付は YYYY-MM-DD", async () => {
    expect((await access.listWorks())[0].date).toBe("2026-10-01");
  });

  it("slug に使えないファイル名は InvalidContentError", async () => {
    const bad = createContentAccess(source({ services: async () => [{ id: "Web_Site", data: validService }] }));
    await expect(bad.listOfferedServices()).rejects.toBeInstanceOf(InvalidContentError);
  });
});

describe("TC-U04 ContentAccess：スキーマ違反を検出する（DD-02 の検証規則）", () => {
  const cases: [string, () => unknown][] = [
    ["制作例の kind の欠落", () => workSchema.parse({ title: "例", summary: "要約", date: "2026-10-01" })],
    ["制作例の kind が想定外", () => workSchema.parse({ kind: "other", title: "例", summary: "要約", date: "2026-10-01" })],
    ["制作例の url が https でない", () => workSchema.parse({ ...validWork, kind: "sample", url: "http://example.com" })],
    ["price.kind が quote なのに amount がある", () => serviceSchema.parse({ title: "a", summary: "b", price: { kind: "quote", amount: 1 } })],
    ["price.amount が負", () => serviceSchema.parse({ title: "a", summary: "b", price: { kind: "fixed", amount: -1 } })],
    ["price.amount が小数", () => serviceSchema.parse({ title: "a", summary: "b", price: { kind: "from", amount: 1.5 } })],
    ["cta が channel なのに channelId がない", () => serviceSchema.parse({ title: "a", summary: "b", price: { kind: "quote" }, cta: { route: "channel" } })],
    ["title が 40 字を超える", () => serviceSchema.parse({ title: "あ".repeat(41), summary: "b", price: { kind: "quote" } })],
    ["summary が 120 字を超える", () => serviceSchema.parse({ title: "a", summary: "あ".repeat(121), price: { kind: "quote" } })],
    ["知らない項目がある", () => serviceSchema.parse({ title: "a", summary: "b", price: { kind: "quote" }, typo: 1 })],
    ["アイコンの alt が空", () => profileSchema.parse({ displayName: "a", tagline: "b", avatar: { src: "/a", alt: "" } })],
    ["価格表示ポリシーが想定外", () => presentationSchema.parse({ pricePolicy: "free", curation: {} })],
  ];
  it.each(cases)("%s", (_, parse) => {
    expect(parse).toThrow();
  });
});
