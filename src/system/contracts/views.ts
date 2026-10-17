// DD-01 契約：Manager が Client に返す View
import type { CallToAction, PriceDisplay } from "./engine-results";
import type {
  Article, ArticleRecord, ImageRef, InquiryChannel, OperatorProfile, ShareLink, TrustedHtml, Skill, SkillGroup, Work,
} from "./records";

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: "website" | "article";
}

export interface AnalyticsTag {
  provider: string;
  snippet: string;
  /** CSP に足すオリジン（DD-16） */
  scriptOrigins: string[];
}

export interface LayoutView {
  siteName: string;
  avatar: ImageRef;
  copyright: string;
  analytics: AnalyticsTag | null;
}

export interface ServiceCard {
  slug: string;
  title: string;
  summary: string;
  price: PriceDisplay;
  href: string;
}

export interface HomeView {
  meta: PageMeta;
  profile: OperatorProfile;
  featuredSkills: Skill[];
  featuredWorks: Work[];
  featuredServices: ServiceCard[];
}

export interface AboutView {
  meta: PageMeta;
  profile: OperatorProfile;
  skillGroups: SkillGroup[];
  works: Work[];
}

export interface ServiceCatalogView {
  meta: PageMeta;
  services: ServiceCard[];
}

export interface ServiceDetailView {
  meta: PageMeta;
  slug: string;
  title: string;
  summary: string;
  audience: string[];
  deliverables: string[];
  body: TrustedHtml;
  price: PriceDisplay;
  leadTime?: string;
  cta: CallToAction;
}

export interface ContactView {
  meta: PageMeta;
  channel: InquiryChannel;
  serviceOptions: { slug: string; title: string }[];
  /** DD-16 */
  cspSources: { formAction: string[]; frameSrc: string[] };
}

export interface ChannelLinkView {
  label: string;
  url: string;
  icon: string;
}

/** 記事カード（SCR-01、SCR-07、SCR-08 の関連記事） */
export interface ArticleCard extends Article {
  /** 記事のページのパス（ベースパスつき） */
  href: string;
  /** 読む時間の目安（分。FR-18） */
  readingMinutes: number;
}

/** トップの最新のニュース（FR-11） */
export interface ArticleFeedView {
  articles: ArticleCard[];
}

/** SCR-07 */
export interface NewsIndexView {
  meta: PageMeta;
  articles: ArticleCard[];
  /** RSS のパス（ベースパスつき） */
  feedHref: string;
}

/** SCR-08 */
export interface NewsArticleView {
  meta: PageMeta;
  article: ArticleRecord;
  /** 読む時間の目安（分。FR-18） */
  readingMinutes: number;
  author: { name: string; avatar: ImageRef };
  /** FR-15 共有（リンクのコピーは Client が足す。コピーする URL は meta.canonical） */
  share: ShareLink[];
  /** FR-15 フォロー */
  follow: ChannelLinkView[];
  /** FR-16 */
  related: ArticleCard[];
}

/** /news/rss.xml（FR-17） */
export interface NewsFeedView {
  title: string;
  description: string;
  /** サイトのトップの絶対 URL */
  siteUrl: string;
  /** フィード自身の絶対 URL */
  feedUrl: string;
  items: NewsFeedItem[];
}

export interface NewsFeedItem {
  title: string;
  /** 記事の絶対 URL */
  link: string;
  /** 公開日（ISO 8601） */
  date: string;
  description: string;
  categories: string[];
}
