// DD-01 契約：ResourceAccess が返すレコード
/**
 * 運営者のコンテンツ（Markdown）をビルド時に変換した HTML。
 * 運営者が書いたもの以外（外部データ、URL のクエリなど）を入れてはいけない（NFR-15）。
 */
export type TrustedHtml = string;

export interface ImageRef {
  src: string;
  alt: string;
}

export interface OperatorProfile {
  displayName: string;
  tagline: string;
  avatar: ImageRef;
  bio: TrustedHtml;
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
  body: TrustedHtml;
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
  /** 送信先に渡す項目名。受付先のサービスごとの決まりに合わせる（省略時は name） */
  param?: string;
}

export type InquiryChannel =
  | { kind: "form-post"; action: string; fields: InquiryField[]; honeypotField?: string; note?: string }
  | { kind: "embed"; src: string; fallbackUrl: string; note?: string }
  | { kind: "link"; url: string; label: string; note?: string };

/** 関連の強さを比べられる項目（CurationEngine の pickRelated の入力。DD-04） */
export interface Taggable {
  id: string;
  /** ISO 8601（YYYY-MM-DD） */
  date?: string;
  tags: string[];
}

/** お知らせ / 制作 / 読み物（FR-11） */
export type ArticleCategory = "notice" | "work" | "essay";

export interface ArticleImage extends ImageRef {
  caption?: string;
  /** 画像の出典（例：「副業のぬこ」）。表示は「クレジット：…」 */
  credit?: string;
}

/** ニュースの記事の要約（一覧用。本文なし） */
export interface Article extends Taggable {
  slug: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  /** 公開日（ISO 8601） */
  date: string;
  /** 更新日（ISO 8601） */
  updated?: string;
  image?: ArticleImage;
  /** 本文を文字だけにしたもの（タグを除き、文字参照を戻したもの）。読む時間の見積もりに使う（DD-17） */
  bodyText: string;
}

/** 本文つきの記事 */
export interface ArticleRecord extends Article {
  body: TrustedHtml;
}

/** 記事を共有するリンク 1 つ分（解決済みの URL。DD-07） */
export interface ShareLink {
  id: string;
  label: string;
  icon: string;
  url: string;
}
