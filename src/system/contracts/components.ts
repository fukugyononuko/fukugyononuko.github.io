// DD-01 契約：構成要素のインターフェース（CMP-M01〜U03）
import type { CallToAction, PriceDisplay } from "./engine-results";
import type {
  Article, ArticleRecord, Channel, CurationRule, Curatable, InquiryChannel, OperatorProfile,
  PresentationSettings, PricePolicy, PriceSpec, ServiceRecord, ShareLink, SkillGroup, Taggable, Work,
} from "./records";
import type {
  AboutView, AnalyticsTag, ArticleFeedView, ChannelLinkView, ContactView, HomeView,
  LayoutView, NewsArticleView, NewsFeedView, NewsIndexView, PageMeta, ServiceCatalogView, ServiceDetailView,
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
  getArticleFeedView(limit: number): Promise<ArticleFeedView>;
  getNewsIndexView(): Promise<NewsIndexView>;
  listArticleSlugs(): Promise<string[]>;
  getNewsArticleView(slug: string): Promise<NewsArticleView>;
  getNewsFeed(): Promise<NewsFeedView>;
}

/** CMP-E01 */
export interface PricingEngine {
  presentPrice(price: PriceSpec, policy: PricePolicy, note?: string): PriceDisplay;
}

/** CMP-E02 */
export interface CurationEngine {
  pickFeatured<T extends Curatable>(items: T[], rule: CurationRule): T[];
  arrange<T extends Curatable>(items: T[], rule: CurationRule): T[];
  pickRelated<T extends Taggable>(items: T[], base: Taggable, limit: number): T[];
}

/** CMP-E03 */
export interface CtaEngine {
  decideForService(service: ServiceRecord): Promise<CallToAction>;
}

/** CMP-E04 */
export interface ReadingTimeEngine {
  /** 文字だけにした本文から、読む時間の目安（1 以上の整数の分）を返す */
  estimateMinutes(text: string): number;
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
  listShareLinks(page: { url: string; title: string }): Promise<ShareLink[]>;
}

/** CMP-A04 */
export interface ArticleAccess {
  /** 公開中の記事を新しい順に。limit を省くとすべて */
  listRecentArticles(limit?: number): Promise<Article[]>;
  findArticle(slug: string): Promise<ArticleRecord | undefined>;
}

/** CMP-U01 */
export interface SiteConfig {
  siteUrl: string;
  base: string;
  locale: "ja";
}

/** CMP-U02 */
export interface PageMetaInput {
  siteName: string;
  /** 省略するとサイト名だけのタイトルになる（トップ用） */
  title?: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: PageMeta["ogType"];
}

/** CMP-U02 */
export interface Seo {
  buildPageMeta(input: PageMetaInput): PageMeta;
}

/** CMP-U03 */
export interface Analytics {
  getAnalyticsTag(): Promise<AnalyticsTag | null>;
}
