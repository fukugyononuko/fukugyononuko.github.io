// TC-I02 EngagementManager（DD-09、CC-04、CC-05、CC-07）
import { describe, expect, it } from "vitest";
import { ArticleNotFoundError, createEngagementManager } from "../../src/system/managers/engagement-manager";
import { createCtaEngine } from "../../src/system/engines/cta-engine";
import { createCurationEngine } from "../../src/system/engines/curation-engine";
import { createSeo } from "../../src/system/utilities/seo";
import type { ArticleRecord, InquiryChannel } from "../../src/system/contracts";
import {
  article, config, fakeArticles, fakeChannels, fakeContent, fakeInquiry, github, note, profile, service,
} from "../support/fakes";

const news: ArticleRecord[] = [
  article({ slug: "newest", date: "2026-10-17", tags: ["site"], image: { src: "/images/news/newest.webp", alt: "説明" } }),
  article({ slug: "middle", date: "2026-10-10", tags: ["data"] }),
  article({ slug: "older", date: "2026-10-01", tags: ["site"] }),
  article({ slug: "oldest", date: "2026-09-01" }),
];

function manager(channel: InquiryChannel, articles: ArticleRecord[] = news) {
  const channels = fakeChannels([github, note]);
  return createEngagementManager({
    inquiry: fakeInquiry(channel),
    channels,
    content: fakeContent({
      services: [
        service({ slug: "web", title: "ウェブ" }),
        service({ slug: "tpl", title: "テンプレート", cta: { route: "channel", channelId: "note" } }),
      ],
    }),
    articles: fakeArticles(articles),
    cta: createCtaEngine(channels, config),
    curation: createCurationEngine(),
    seo: createSeo(config),
    config,
  });
}

const link: InquiryChannel = { kind: "link", url: "https://x.com/example", label: "DM" };

describe("TC-I02 EngagementManager", () => {
  it("getChannelLinks：order の順（CC-05）", async () => {
    expect((await manager(link).getChannelLinks()).map((c) => c.label)).toEqual(["note", "GitHub"]);
  });

  it("getContactView：選択肢は導線が問い合わせのサービスだけ（CC-04）", async () => {
    const view = await manager(link).getContactView();
    expect(view.serviceOptions).toEqual([{ slug: "web", title: "ウェブ" }]);
    expect(view.channel).toEqual(link);
  });

  it("getContactView：CSP に足すオリジンを問い合わせ手段から決める（DD-16）", async () => {
    const post = await manager({ kind: "form-post", action: "https://forms.example.com/f/1", fields: [] }).getContactView();
    expect(post.cspSources).toEqual({ formAction: ["https://forms.example.com"], frameSrc: [] });
    const embed = await manager({ kind: "embed", src: "https://docs.example.com/form", fallbackUrl: "https://docs.example.com" }).getContactView();
    expect(embed.cspSources).toEqual({ formAction: [], frameSrc: ["https://docs.example.com"] });
    expect((await manager(link).getContactView()).cspSources).toEqual({ formAction: [], frameSrc: [] });
  });

});

describe("TC-I02 EngagementManager：ニュース（CC-07）", () => {
  it("getArticleFeedView：limit 件の記事カード。href は記事のページ", async () => {
    const view = await manager(link).getArticleFeedView(3);
    expect(view.articles.map((a) => a.href)).toEqual(["/news/newest/", "/news/middle/", "/news/older/"]);
    expect(await manager(link, []).getArticleFeedView(3)).toEqual({ articles: [] });
  });

  it("getNewsIndexView：すべての記事カード、meta、RSS のパス", async () => {
    const view = await manager(link).getNewsIndexView();
    expect(view.articles.map((a) => a.slug)).toEqual(["newest", "middle", "older", "oldest"]);
    expect(view.meta).toMatchObject({ title: `ニュース | ${profile.displayName}`, canonical: "https://example.github.io/news/" });
    expect(view.feedHref).toBe("/news/rss.xml");
  });

  it("listArticleSlugs：公開中の記事の slug", async () => {
    expect(await manager(link).listArticleSlugs()).toEqual(["newest", "middle", "older", "oldest"]);
  });

  it("getNewsArticleView：meta は article 型で記事の画像。共有は canonical、フォローはチャネルの順", async () => {
    const view = await manager(link).getNewsArticleView("newest");
    expect(view.meta).toEqual({
      title: `記事 newest | ${profile.displayName}`,
      description: "要約",
      canonical: "https://example.github.io/news/newest/",
      ogImage: "https://example.github.io/images/news/newest.webp",
      ogType: "article",
    });
    expect(view.article.body).toBe("<p>newest</p>");
    expect(view.author).toEqual({ name: profile.displayName, avatar: profile.avatar });
    expect(view.share[0].url).toBe(`https://x.example.com/share?url=${encodeURIComponent(view.meta.canonical)}`);
    expect(view.follow.map((c) => c.label)).toEqual(["note", "GitHub"]);
  });

  it("getNewsArticleView：画像のない記事の OGP は既定の画像", async () => {
    expect((await manager(link).getNewsArticleView("middle")).meta.ogImage).toBe("https://example.github.io/og-default.jpg");
  });

  it("getNewsArticleView：関連記事は自分を含まず、同じタグ → 新しい順で 3 件", async () => {
    const view = await manager(link).getNewsArticleView("newest");
    expect(view.related.map((a) => a.slug)).toEqual(["older", "middle", "oldest"]);
    expect(view.related[0].href).toBe("/news/older/");
  });

  it("getNewsArticleView：ない slug は ArticleNotFoundError", async () => {
    await expect(manager(link).getNewsArticleView("nothing")).rejects.toBeInstanceOf(ArticleNotFoundError);
  });

  it("getNewsFeed：項目は新しい順で、リンクは絶対 URL", async () => {
    const feed = await manager(link).getNewsFeed();
    expect(feed).toMatchObject({
      title: `${profile.displayName}のニュース`,
      siteUrl: "https://example.github.io/",
      feedUrl: "https://example.github.io/news/rss.xml",
    });
    expect(feed.items[0]).toEqual({
      title: "記事 newest", link: "https://example.github.io/news/newest/", date: "2026-10-17", description: "要約", categories: ["site"],
    });
    expect(feed.items.map((i) => i.date)).toEqual(["2026-10-17", "2026-10-10", "2026-10-01", "2026-09-01"]);
  });
});
