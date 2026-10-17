// CMP-M02 EngagementManager / DD-09（VOL-11：つなぐ手順）
// UC-03（問い合わせる）、UC-04（外部の場へ移る）、UC-06（ニュースを読み、広める）の手順を組み立てる。
import type {
  Article, ArticleAccess, ArticleCard, Channel, ChannelAccess, ChannelLinkView, ContactView, ContentAccess,
  CtaEngine, CurationEngine, EngagementManager, InquiryAccess, InquiryChannel, NewsArticleView, Seo, SiteConfig,
} from "../contracts";
import { toAbsoluteUrl, withBase } from "../utilities/config";

/** 記事のページの関連記事の数（FR-16） */
const RELATED_LIMIT = 3;

export class ArticleNotFoundError extends Error {
  constructor(slug: string) {
    super(`記事「${slug}」が見つかりません`);
    this.name = "ArticleNotFoundError";
  }
}

export interface EngagementManagerDeps {
  inquiry: InquiryAccess;
  channels: ChannelAccess;
  content: ContentAccess;
  articles: ArticleAccess;
  cta: CtaEngine;
  curation: CurationEngine;
  seo: Seo;
  config: SiteConfig;
}

export function createEngagementManager(deps: EngagementManagerDeps): EngagementManager {
  const { inquiry, channels, content, articles, cta, curation, seo, config } = deps;
  const newsPath = (slug: string) => `/news/${slug}/`;
  const toCard = (a: Article): ArticleCard => ({ ...a, href: withBase(config, newsPath(a.slug)) });
  const newsDescription = (siteName: string) => `${siteName}のお知らせ、制作の記録、読み物。`;

  return {
    async getChannelLinks() {
      return (await channels.listChannels()).map(toLinkView);
    },

    async getContactView(): Promise<ContactView> {
      const [profile, channel, services] = await Promise.all([
        content.getOperatorProfile(),
        inquiry.getInquiryChannel(),
        content.listOfferedServices(),
      ]);
      const decisions = await Promise.all(services.map(async (s) => ({ s, action: await cta.decideForService(s) })));
      return {
        meta: seo.buildPageMeta({
          siteName: profile.displayName,
          title: "問い合わせ",
          description: `${profile.displayName}へのご相談・お問い合わせはこちらから。`,
          path: "/contact/",
        }),
        channel,
        serviceOptions: decisions
          .filter(({ action }) => action.route === "inquiry")
          .map(({ s }) => ({ slug: s.slug, title: s.title })),
        cspSources: cspSourcesFor(channel),
      };
    },

    async getArticleFeedView(limit: number) {
      return { articles: (await articles.listRecentArticles(limit)).map(toCard) };
    },

    async getNewsIndexView() {
      const [profile, list] = await Promise.all([content.getOperatorProfile(), articles.listRecentArticles()]);
      return {
        meta: seo.buildPageMeta({
          siteName: profile.displayName,
          title: "ニュース",
          description: newsDescription(profile.displayName),
          path: "/news/",
        }),
        articles: list.map(toCard),
        feedHref: withBase(config, "/news/rss.xml"),
      };
    },

    async listArticleSlugs() {
      return (await articles.listRecentArticles()).map((a) => a.slug);
    },

    async getNewsArticleView(slug: string): Promise<NewsArticleView> {
      const article = await articles.findArticle(slug);
      if (!article) throw new ArticleNotFoundError(slug);
      const [profile, all, channelList] = await Promise.all([
        content.getOperatorProfile(),
        articles.listRecentArticles(),
        channels.listChannels(),
      ]);
      const meta = seo.buildPageMeta({
        siteName: profile.displayName,
        title: article.title,
        description: article.summary,
        path: newsPath(slug),
        ogImage: article.image?.src,
        type: "article",
      });
      return {
        meta,
        article,
        author: { name: profile.displayName, avatar: profile.avatar },
        share: await channels.listShareLinks({ url: meta.canonical, title: article.title }),
        follow: channelList.map(toLinkView),
        related: curation.pickRelated(all, article, RELATED_LIMIT).map(toCard),
      };
    },

    async getNewsFeed() {
      const [profile, list] = await Promise.all([content.getOperatorProfile(), articles.listRecentArticles()]);
      return {
        title: `${profile.displayName}のニュース`,
        description: newsDescription(profile.displayName),
        siteUrl: toAbsoluteUrl(config, "/"),
        feedUrl: toAbsoluteUrl(config, "/news/rss.xml"),
        items: list.map((a) => ({
          title: a.title,
          link: toAbsoluteUrl(config, newsPath(a.slug)),
          date: a.date,
          description: a.summary,
          categories: a.tags,
        })),
      };
    },
  };
}

function toLinkView(c: Channel): ChannelLinkView {
  return { label: c.label, url: c.url, icon: c.icon };
}

/** 問い合わせページの CSP に足す外部のオリジン（DD-16） */
function cspSourcesFor(channel: InquiryChannel): ContactView["cspSources"] {
  switch (channel.kind) {
    case "form-post":
      return { formAction: [new URL(channel.action).origin], frameSrc: [] };
    case "embed":
      return { formAction: [], frameSrc: [new URL(channel.src).origin] };
    case "link":
      return { formAction: [], frameSrc: [] };
  }
}
