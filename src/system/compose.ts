// 構成要素の組み立て（DD-01「構成要素の組み立て」、DD-15）
// 実体の組み立てはここだけで行う。Client が import してよいのは、このファイルと contracts/ だけ（R1）。
// 実装を差し替えるとき（例：note の記事もニュースに並べる）は、ここだけを変える。
import type { EngagementManager, ShowcaseManager } from "./contracts";
import { createSiteConfig } from "./utilities/config";
import { createSeo } from "./utilities/seo";
import { createAnalytics, noAnalytics } from "./utilities/analytics";
import { createContentAccess } from "./resource-access/content-access";
import { astroContentSource } from "./resource-access/content-access/astro-source";
import { createInquiryAccess } from "./resource-access/inquiry-access";
import { loadInquiryFromAstro } from "./resource-access/inquiry-access/astro-source";
import { createChannelAccess } from "./resource-access/channel-access";
import { astroChannelSource } from "./resource-access/channel-access/astro-source";
import { createLocalArticleAccess } from "./resource-access/article-access";
import { astroArticleSource } from "./resource-access/article-access/astro-source";
import { createPricingEngine } from "./engines/pricing-engine";
import { createCurationEngine } from "./engines/curation-engine";
import { createCtaEngine } from "./engines/cta-engine";
import { createShowcaseManager } from "./managers/showcase-manager";
import { createEngagementManager } from "./managers/engagement-manager";

const config = createSiteConfig({ SITE: import.meta.env.SITE, BASE_URL: import.meta.env.BASE_URL });
const seo = createSeo(config);
const analytics = createAnalytics(noAnalytics);

const content = createContentAccess(astroContentSource);
const inquiry = createInquiryAccess(loadInquiryFromAstro);
const channels = createChannelAccess(astroChannelSource);
const articles = createLocalArticleAccess(astroArticleSource);

const pricing = createPricingEngine();
const curation = createCurationEngine();
const cta = createCtaEngine(channels, config);

export const showcase: ShowcaseManager = createShowcaseManager({ content, pricing, curation, cta, seo, analytics, config });
export const engagement: EngagementManager = createEngagementManager({
  inquiry, channels, content, articles, cta, curation, seo, config,
});
