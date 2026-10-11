// CMP-M01 ShowcaseManager / DD-09（VOL-11：見せる手順）
// UC-01（能力を知る）と UC-02（サービスを検討する）の手順を組み立てる。判断は Engine に任せる。
import type {
  Analytics, ContentAccess, CtaEngine, CurationEngine, PricingEngine, Seo, ServiceRecord,
  ShowcaseManager, SiteConfig, PresentationSettings, ServiceCard,
} from "../contracts";
import { withBase } from "../utilities/config";

export class ServiceNotFoundError extends Error {
  constructor(slug: string) {
    super(`サービス「${slug}」が見つかりません`);
    this.name = "ServiceNotFoundError";
  }
}

export interface ShowcaseManagerDeps {
  content: ContentAccess;
  pricing: PricingEngine;
  curation: CurationEngine;
  cta: CtaEngine;
  seo: Seo;
  analytics: Analytics;
  config: SiteConfig;
  now?: () => Date;
}

export function createShowcaseManager(deps: ShowcaseManagerDeps): ShowcaseManager {
  const { content, pricing, curation, cta, seo, analytics, config } = deps;
  const now = deps.now ?? (() => new Date());

  function toCard(service: ServiceRecord, settings: PresentationSettings): ServiceCard {
    return {
      slug: service.slug,
      title: service.title,
      summary: service.summary,
      price: pricing.presentPrice(service.price, settings.pricePolicy, service.priceNote),
      href: withBase(config, `/services/${service.slug}/`),
    };
  }

  return {
    async getLayoutView() {
      const profile = await content.getOperatorProfile();
      return {
        siteName: profile.displayName,
        avatar: profile.avatar,
        copyright: `© ${now().getFullYear()} ${profile.displayName}`,
        analytics: await analytics.getAnalyticsTag(),
      };
    },

    async getHomeView() {
      const [profile, settings, groups, works, services] = await Promise.all([
        content.getOperatorProfile(),
        content.getPresentationSettings(),
        content.listSkillGroups(),
        content.listWorks(),
        content.listOfferedServices(),
      ]);
      return {
        meta: seo.buildPageMeta({ siteName: profile.displayName, description: profile.tagline, path: "/" }),
        profile,
        featuredSkills: curation.pickFeatured(groups.flatMap((g) => g.skills), settings.curation.skills),
        featuredWorks: curation.pickFeatured(works, settings.curation.works),
        featuredServices: curation
          .pickFeatured(services, settings.curation.services)
          .map((s) => toCard(s, settings)),
      };
    },

    async getAboutView() {
      const [profile, settings, groups, works] = await Promise.all([
        content.getOperatorProfile(),
        content.getPresentationSettings(),
        content.listSkillGroups(),
        content.listWorks(),
      ]);
      return {
        meta: seo.buildPageMeta({
          siteName: profile.displayName,
          title: "About",
          description: `${profile.displayName}のプロフィール、できること、制作例です。`,
          path: "/about/",
        }),
        profile,
        skillGroups: [...groups]
          .sort((a, b) => a.order - b.order)
          .map((g) => ({ ...g, skills: curation.arrange(g.skills, settings.curation.skills) })),
        works: curation.arrange(works, settings.curation.works),
      };
    },

    async getServiceCatalogView() {
      const [profile, settings, services] = await Promise.all([
        content.getOperatorProfile(),
        content.getPresentationSettings(),
        content.listOfferedServices(),
      ]);
      return {
        meta: seo.buildPageMeta({
          siteName: profile.displayName,
          title: "サービス",
          description: `${profile.displayName}が受け付けているサービスの一覧です。`,
          path: "/services/",
        }),
        services: curation.arrange(services, settings.curation.services).map((s) => toCard(s, settings)),
      };
    },

    async listServiceSlugs() {
      return (await content.listOfferedServices()).map((s) => s.slug);
    },

    async getServiceDetailView(slug: string) {
      const [profile, settings, service] = await Promise.all([
        content.getOperatorProfile(),
        content.getPresentationSettings(),
        content.findOfferedService(slug),
      ]);
      if (!service) throw new ServiceNotFoundError(slug);
      return {
        meta: seo.buildPageMeta({
          siteName: profile.displayName,
          title: service.title,
          description: service.summary,
          path: `/services/${service.slug}/`,
        }),
        slug: service.slug,
        title: service.title,
        summary: service.summary,
        audience: service.audience,
        deliverables: service.deliverables,
        body: service.body,
        price: pricing.presentPrice(service.price, settings.pricePolicy, service.priceNote),
        leadTime: service.leadTime,
        cta: await cta.decideForService(service),
      };
    },
  };
}
