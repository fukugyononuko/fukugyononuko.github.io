// CMP-M02 EngagementManager / DD-09（VOL-11：つなぐ手順）
// UC-03（問い合わせる）と UC-04（外部の場へ移る）の手順を組み立てる。
import type {
  ArticleAccess, ChannelAccess, ContactView, ContentAccess, CtaEngine, EngagementManager,
  InquiryAccess, InquiryChannel, Seo,
} from "../contracts";

export interface EngagementManagerDeps {
  inquiry: InquiryAccess;
  channels: ChannelAccess;
  content: ContentAccess;
  articles: ArticleAccess;
  cta: CtaEngine;
  seo: Seo;
}

export function createEngagementManager(deps: EngagementManagerDeps): EngagementManager {
  const { inquiry, channels, content, articles, cta, seo } = deps;

  return {
    async getChannelLinks() {
      return (await channels.listChannels()).map((c) => ({ label: c.label, url: c.url, icon: c.icon }));
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
      return { articles: await articles.listRecentArticles(limit) };
    },
  };
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
