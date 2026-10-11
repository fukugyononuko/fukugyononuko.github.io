// DD-01 契約：Manager が Client に返す View
import type { CallToAction, PriceDisplay } from "./engine-results";
import type { Article, ImageRef, InquiryChannel, OperatorProfile, TrustedHtml, Skill, SkillGroup, Work } from "./records";

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

/** 将来（FR-11） */
export interface ArticleFeedView {
  articles: Article[];
}
