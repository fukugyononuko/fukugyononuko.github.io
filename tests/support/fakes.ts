// テスト用の偽物（TC-I01、TC-I02）。ResourceAccess を差し替えて Manager を検査する。
import type {
  Channel, ChannelAccess, ContentAccess, InquiryAccess, InquiryChannel, OperatorProfile,
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
  };
}

export function fakeInquiry(channel: InquiryChannel): InquiryAccess {
  return { getInquiryChannel: async () => channel };
}

export const note: Channel = { id: "note", label: "note", url: "https://note.com/example", icon: "note", order: 10 };
export const github: Channel = { id: "github", label: "GitHub", url: "https://github.com/example", icon: "github", order: 30 };
