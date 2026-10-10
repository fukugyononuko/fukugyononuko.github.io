// DD-01 契約：構成要素のインターフェース（CMP-M01〜U03）
import type { CallToAction, PriceDisplay } from "./engine-results";
import type {
  Article, Channel, CurationRule, Curatable, InquiryChannel, OperatorProfile,
  PresentationSettings, PricePolicy, PriceSpec, ServiceRecord, SkillGroup, Work,
} from "./records";
import type {
  AboutView, AnalyticsTag, ArticleFeedView, ChannelLinkView, ContactView, HomeView,
  LayoutView, PageMeta, ServiceCatalogView, ServiceDetailView,
} from "./views";

/** CMP-M01 */
export interface ShowcaseManager {
  getLayoutView(): Promise<LayoutView>;
  getHomeView(): Promise<HomeView>;
  getAboutView(): Promise<AboutView>;
  getServiceCatalogView(): Promise<ServiceCatalogView>;
  listServiceSlugs(): Promise<string[]>;
  getServiceDetailView(slug: string): Promise<ServiceDetailView>;
}

/** CMP-M02 */
export interface EngagementManager {
  getChannelLinks(): Promise<ChannelLinkView[]>;
  getContactView(): Promise<ContactView>;
  /** 将来（FR-11） */
  getArticleFeedView(limit: number): Promise<ArticleFeedView>;
}

/** CMP-E01 */
export interface PricingEngine {
  presentPrice(price: PriceSpec, policy: PricePolicy, note?: string): PriceDisplay;
}

/** CMP-E02 */
export interface CurationEngine {
  pickFeatured<T extends Curatable>(items: T[], rule: CurationRule): T[];
  arrange<T extends Curatable>(items: T[], rule: CurationRule): T[];
}

/** CMP-E03 */
export interface CtaEngine {
  decideForService(service: ServiceRecord): Promise<CallToAction>;
}

/** CMP-A01 */
export interface ContentAccess {
  getOperatorProfile(): Promise<OperatorProfile>;
  listSkillGroups(): Promise<SkillGroup[]>;
  listWorks(): Promise<Work[]>;
  listOfferedServices(): Promise<ServiceRecord[]>;
  findOfferedService(slug: string): Promise<ServiceRecord | undefined>;
  getPresentationSettings(): Promise<PresentationSettings>;
}

/** CMP-A02 */
export interface InquiryAccess {
  getInquiryChannel(): Promise<InquiryChannel>;
}

/** CMP-A03 */
export interface ChannelAccess {
  listChannels(): Promise<Channel[]>;
  findChannel(id: string): Promise<Channel | undefined>;
}

/** CMP-A04（将来） */
export interface ArticleAccess {
  listRecentArticles(limit: number): Promise<Article[]>;
}

/** CMP-U01 */
export interface SiteConfig {
  siteUrl: string;
  base: string;
  locale: "ja";
}

/** CMP-U02 */
export interface PageMetaInput {
  title?: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: PageMeta["ogType"];
}

/** CMP-U03 */
export type GetAnalyticsTag = () => Promise<AnalyticsTag | null>;
