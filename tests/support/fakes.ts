// テスト用の偽物（TC-I01、TC-I02）。ResourceAccess を差し替えて Manager を検査する。
import type {
  ArticleAccess, ArticleRecord, Channel, ChannelAccess, ContentAccess, InquiryAccess, InquiryChannel, OperatorProfile,
  PresentationSettings, ServiceRecord, SkillGroup, Work,
} from "../../src/system/contracts";
import { createSiteConfig } from "../../src/system/utilities/config";

export const config = createSiteConfig({ SITE: "https://example.github.io", BASE_URL: "/" });

export const profile: OperatorProfile = {
  displayName: "テストのぬこ",
  tagline: "テスト用のキャッチコピー",
  avatar: { src: "/images/avatar.webp", alt: "アイコン" },
  bio: "<p>自己紹介</p>",
};

export const settings: PresentationSettings = {
  pricePolicy: "as-is",
  curation: {
    skills: { featuredLimit: 2, sort: "order" },
    works: { featuredLimit: 2, sort: "date-desc" },
    services: { featuredLimit: 2, sort: "order" },
  },
};

export function service(overrides: Partial<ServiceRecord> & { slug: string }): ServiceRecord {
  return {
    id: overrides.slug,
    title: `サービス ${overrides.slug}`,
    summary: "要約",
    audience: [],
    deliverables: [],
    body: "",
    price: { kind: "quote" },
    cta: { route: "inquiry" },
    featured: false,
    order: 100,
    ...overrides,
  };
}

export function work(overrides: Partial<Work> & { id: string }): Work {
  return { kind: "personal", title: `制作例 ${overrides.id}`, summary: "要約", featured: false, order: 100, ...overrides };
}

export function fakeContent(data: {
  services?: ServiceRecord[];
  works?: Work[];
  groups?: SkillGroup[];
  settings?: PresentationSettings;
}): ContentAccess {
  const services = data.services ?? [];
  return {
    getOperatorProfile: async () => profile,
    listSkillGroups: async () => data.groups ?? [],
    listWorks: async () => data.works ?? [],
    listOfferedServices: async () => services,
    findOfferedService: async (slug) => services.find((s) => s.slug === slug),
    getPresentationSettings: async () => data.settings ?? settings,
  };
}

export function fakeChannels(channels: Channel[]): ChannelAccess {
  return {
    listChannels: async () => [...channels].sort((a, b) => a.order - b.order),
    findChannel: async (id) => channels.find((c) => c.id === id),
    listShareLinks: async (page) => [
      { id: "x", label: "X", icon: "x", url: `https://x.example.com/share?url=${encodeURIComponent(page.url)}` },
    ],
  };
}

export function article(overrides: Partial<ArticleRecord> & { slug: string; date: string }): ArticleRecord {
  return {
    id: overrides.slug,
    title: `記事 ${overrides.slug}`,
    summary: "要約",
    category: "notice",
    tags: [],
    body: `<p>${overrides.slug}</p>`,
    ...overrides,
  };
}

/** 渡した順を「新しい順」とみなす偽物 */
export function fakeArticles(records: ArticleRecord[]): ArticleAccess {
  const summaries = records.map(({ body: _body, ...a }) => a);
  return {
    listRecentArticles: async (limit) => (limit === undefined ? summaries : summaries.slice(0, limit)),
    findArticle: async (slug) => records.find((a) => a.slug === slug),
  };
}

export function fakeInquiry(channel: InquiryChannel): InquiryAccess {
  return { getInquiryChannel: async () => channel };
}

export const note: Channel = { id: "note", label: "note", url: "https://note.com/example", icon: "note", order: 10 };
export const github: Channel = { id: "github", label: "GitHub", url: "https://github.com/example", icon: "github", order: 30 };
