// TC-I01 ShowcaseManager（DD-09、CC-01〜CC-03）
import { describe, expect, it } from "vitest";
import { createShowcaseManager, ServiceNotFoundError } from "../../src/system/managers/showcase-manager";
import { createPricingEngine } from "../../src/system/engines/pricing-engine";
import { createCurationEngine } from "../../src/system/engines/curation-engine";
import { createCtaEngine } from "../../src/system/engines/cta-engine";
import { createSeo } from "../../src/system/utilities/seo";
import { createAnalytics, noAnalytics } from "../../src/system/utilities/analytics";
import type { ContentAccess } from "../../src/system/contracts";
import { config, fakeChannels, fakeContent, note, profile, service, work } from "../support/fakes";

function manager(content: ContentAccess) {
  return createShowcaseManager({
    content,
    pricing: createPricingEngine(),
    curation: createCurationEngine(),
    cta: createCtaEngine(fakeChannels([note]), config),
    seo: createSeo(config),
    analytics: createAnalytics(noAnalytics),
    config,
    now: () => new Date("2026-10-11T00:00:00Z"),
  });
}

const services = [
  service({ slug: "a", featured: true, order: 2, price: { kind: "fixed", amount: 1000 } }),
  service({ slug: "b", featured: true, order: 1 }),
  service({ slug: "c", featured: true, order: 3 }),
  service({ slug: "d", order: 0, cta: { route: "channel", channelId: "note" } }),
];
const works = [
  work({ id: "old", featured: true, date: "2025-01-01" }),
  work({ id: "new", featured: true, date: "2026-09-01", kind: "sample" }),
  work({ id: "plain" }),
];
const groups = [
  { name: "データ", order: 20, skills: [{ id: "data/x", name: "X", featured: true, order: 30 }] },
  { name: "ウェブ", order: 10, skills: [{ id: "web/y", name: "Y", featured: true, order: 10 }, { id: "web/z", name: "Z", featured: false, order: 20 }] },
];

describe("TC-I01 ShowcaseManager", () => {
  const m = manager(fakeContent({ services, works, groups }));

  it("getLayoutView：サイト名、アイコン、コピーライト", async () => {
    expect(await m.getLayoutView()).toEqual({
      siteName: profile.displayName,
      avatar: profile.avatar,
      copyright: `© 2026 ${profile.displayName}`,
      analytics: null,
    });
  });

  it("getHomeView：注目項目を featuredLimit 件まで、規則の順に選ぶ（CC-01）", async () => {
    const view = await m.getHomeView();
    expect(view.featuredServices.map((s) => s.slug)).toEqual(["b", "a"]);
    expect(view.featuredWorks.map((w) => w.id)).toEqual(["new", "old"]);
    expect(view.featuredSkills.map((s) => s.name)).toEqual(["Y", "X"]);
    expect(view.featuredServices[1]).toMatchObject({ href: "/services/a/", price: { text: "1,000円" } });
    expect(view.meta).toMatchObject({ title: profile.displayName, canonical: "https://example.github.io/" });
  });

  it("getAboutView：分類は order 順、制作例は規則の順（CC-02）", async () => {
    const view = await m.getAboutView();
    expect(view.skillGroups.map((g) => g.name)).toEqual(["ウェブ", "データ"]);
    expect(view.works.map((w) => w.id)).toEqual(["new", "old", "plain"]);
    expect(view.meta.title).toBe(`About | ${profile.displayName}`);
  });

  it("getServiceCatalogView：すべてのサービスを規則の順に、価格表示つきで（CC-03）", async () => {
    const view = await m.getServiceCatalogView();
    expect(view.services.map((s) => s.slug)).toEqual(["d", "b", "a", "c"]);
    expect(view.services.every((s) => s.price.text.length > 0)).toBe(true);
  });

  it("getServiceDetailView：行動喚起を CtaEngine で決める（CC-03）", async () => {
    expect((await m.getServiceDetailView("b")).cta.route).toBe("inquiry");
    expect(await m.getServiceDetailView("d")).toMatchObject({ cta: { route: "external", href: note.url } });
  });

  it("getServiceDetailView：存在しない slug は ServiceNotFoundError", async () => {
    await expect(m.getServiceDetailView("nope")).rejects.toBeInstanceOf(ServiceNotFoundError);
  });

  it("サービスも制作例もないとき、空の一覧を返す（FR-03、FR-04 の空の状態）", async () => {
    const empty = manager(fakeContent({}));
    const home = await empty.getHomeView();
    expect(home.featuredServices).toEqual([]);
    expect(home.featuredWorks).toEqual([]);
    expect((await empty.getServiceCatalogView()).services).toEqual([]);
    expect(await empty.listServiceSlugs()).toEqual([]);
  });
});
