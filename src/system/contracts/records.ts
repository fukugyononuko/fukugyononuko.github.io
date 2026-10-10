// DD-01 契約：ResourceAccess が返すレコード
export type Markdown = string;

export interface ImageRef {
  src: string;
  alt: string;
}

export interface OperatorProfile {
  displayName: string;
  tagline: string;
  avatar: ImageRef;
  bio: Markdown;
}

export interface Curatable {
  id: string;
  featured: boolean;
  /** 小さいほど先 */
  order: number;
  /** ISO 8601（YYYY-MM-DD） */
  date?: string;
}

export interface SkillGroup {
  name: string;
  order: number;
  skills: Skill[];
}

export interface Skill extends Curatable {
  name: string;
  description?: string;
}

/** 受託 / 個人制作 / サンプル（FR-03） */
export type WorkKind = "client" | "personal" | "sample";

export interface Work extends Curatable {
  kind: WorkKind;
  title: string;
  summary: string;
  url?: string;
}

export type PriceSpec =
  | { kind: "fixed"; amount: number; unit?: string }
  | { kind: "from"; amount: number; unit?: string }
  | { kind: "quote" };

export type CtaSpec =
  | { route: "inquiry" }
  | { route: "channel"; channelId: string; label?: string };

export interface ServiceRecord extends Curatable {
  slug: string;
  title: string;
  summary: string;
  audience: string[];
  deliverables: string[];
  body: Markdown;
  price: PriceSpec;
  priceNote?: string;
  leadTime?: string;
  cta: CtaSpec;
}

export type PricePolicy = "as-is" | "from-only" | "hide";

export interface CurationRule {
  featuredLimit: number;
  sort: "order" | "date-desc";
}

export interface PresentationSettings {
  pricePolicy: PricePolicy;
  curation: { skills: CurationRule; works: CurationRule; services: CurationRule };
}

export interface Channel {
  id: string;
  label: string;
  url: string;
  icon: string;
  order: number;
}

export interface InquiryField {
  name: "name" | "replyTo" | "service" | "message";
  label: string;
  required: boolean;
}

export type InquiryChannel =
  | { kind: "form-post"; action: string; fields: InquiryField[]; note?: string }
  | { kind: "embed"; src: string; fallbackUrl: string; note?: string }
  | { kind: "link"; url: string; label: string; note?: string };

export interface Article {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
}
