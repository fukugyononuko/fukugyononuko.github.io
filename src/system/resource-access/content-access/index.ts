// CMP-A01 ContentAccess / DD-02（VOL-05）
// コンテンツの置き場所と形式を隠し、業務の言葉で提供する。読み込み元（ContentSource）は差し替えられる。
import type {
  ContentAccess, OperatorProfile, PresentationSettings, ServiceRecord, SkillGroup, TrustedHtml, Work,
} from "../../contracts";
import type { PresentationData, ProfileData, ServiceData, SkillGroupData, WorkData } from "./schemas";

export interface ContentEntry<T> {
  id: string;
  data: T;
  /** Markdown の本文を変換した HTML（本文がなければ空文字） */
  html?: TrustedHtml;
}

export interface ContentSource {
  profile(): Promise<ContentEntry<ProfileData>>;
  skillGroups(): Promise<ContentEntry<SkillGroupData>[]>;
  works(): Promise<ContentEntry<WorkData>[]>;
  services(): Promise<ContentEntry<ServiceData>[]>;
  presentation(): Promise<PresentationData>;
}

export class InvalidContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidContentError";
  }
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function createContentAccess(source: ContentSource): ContentAccess {
  async function listOfferedServices(): Promise<ServiceRecord[]> {
    const entries = await source.services();
    return entries.filter((e) => !e.data.draft).map(toServiceRecord);
  }

  return {
    async getOperatorProfile(): Promise<OperatorProfile> {
      const { data, html } = await source.profile();
      return { displayName: data.displayName, tagline: data.tagline, avatar: data.avatar, bio: html ?? "" };
    },

    async listSkillGroups(): Promise<SkillGroup[]> {
      const groups = await source.skillGroups();
      return groups.map(({ data }) => ({
        name: data.name,
        order: data.order,
        skills: data.skills.map((s) => ({ ...s, id: `${data.id}/${s.id}` })),
      }));
    },

    async listWorks(): Promise<Work[]> {
      const entries = await source.works();
      return entries
        .filter((e) => !e.data.draft)
        .map(({ id, data }) => ({
          id,
          kind: data.kind,
          title: data.title,
          summary: data.summary,
          url: data.url,
          date: data.date,
          featured: data.featured,
          order: data.order,
        }));
    },

    listOfferedServices,

    async findOfferedService(slug: string): Promise<ServiceRecord | undefined> {
      return (await listOfferedServices()).find((s) => s.slug === slug);
    },

    async getPresentationSettings(): Promise<PresentationSettings> {
      return source.presentation();
    },
  };
}

function toServiceRecord({ id, data, html }: ContentEntry<ServiceData>): ServiceRecord {
  if (!SLUG_PATTERN.test(id)) {
    throw new InvalidContentError(`サービスのファイル名「${id}」は英小文字・数字・ハイフンだけにしてください（DD-02）`);
  }
  return {
    id,
    slug: id,
    title: data.title,
    summary: data.summary,
    audience: data.audience,
    deliverables: data.deliverables,
    body: html ?? "",
    price: data.price,
    priceNote: data.priceNote,
    leadTime: data.leadTime,
    cta: data.cta,
    date: data.date,
    featured: data.featured,
    order: data.order,
  };
}
