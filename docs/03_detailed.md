# 3. 詳細設計

## 3.0 詳細設計の項目一覧

| ID | 項目 | 対象 |
| --- | --- | --- |
| DD-01 | 契約（層の間で受け渡す型） | 全構成要素 |
| DD-02 | コンテンツのスキーマ | CMP-A01, RES-01 |
| DD-03 | 価格表示のアルゴリズム | CMP-E01 |
| DD-04 | 注目項目の選び方と並べ方 | CMP-E02 |
| DD-05 | 導線の決め方 | CMP-E03 |
| DD-06 | 問い合わせ手段の設定 | CMP-A02, RES-02 |
| DD-07 | 外部チャネルの設定 | CMP-A03, RES-03 |
| DD-08 | ニュースの記事 | CMP-A04, RES-04 |
| DD-09 | Manager の実装方針 | CMP-M01, CMP-M02 |
| DD-10 | Utility | CMP-U01〜U03 |
| DD-11 | Client（ページとコンポーネント） | CMP-C01 |
| DD-12 | 依存規則の検査 | 01 §1.6 |
| DD-13 | ビルドとデプロイ | RES-06, EIF-03 |
| DD-14 | エラー処理 | 全構成要素 |
| DD-15 | ファイル配置 | 全構成要素 |
| DD-16 | セキュリティ設計 | 全構成要素、RES-05、RES-06 |
| DD-17 | 読む時間の見積もり方 | CMP-E04 |

## 3.1 DD-01 契約

`src/system/contracts/` に置く。層の間は、この型だけで受け渡す（01 §1.6 R9）。

### Resource 由来のレコード（ResourceAccess が返す）

```ts
// contracts/records.ts
/** 運営者の Markdown をビルド時に変換した HTML。運営者のコンテンツ以外を入れてはいけない（NFR-15） */
export type TrustedHtml = string;

export interface OperatorProfile {
  displayName: string;
  tagline: string;
  avatar: ImageRef;
  bio: TrustedHtml;
}

export interface ImageRef { src: string; alt: string }

export interface Curatable {
  id: string;
  featured: boolean;
  order: number;        // 小さいほど先
  date?: string;        // ISO 8601（YYYY-MM-DD）
}

export interface SkillGroup { name: string; order: number; skills: Skill[] }
export interface Skill extends Curatable { name: string; description?: string }

export type WorkKind = "client" | "personal" | "sample";   // 受託 / 個人制作 / サンプル（FR-03）

export interface Work extends Curatable {
  kind: WorkKind;
  title: string;
  summary: string;
  url?: string;
}

export type PriceSpec =
  | { kind: "fixed"; amount: number; unit?: string }   // 例：30000 円 / 件
  | { kind: "from"; amount: number; unit?: string }    // 例：10000 円〜
  | { kind: "quote" };                                 // 要見積もり

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

export interface CurationRule { featuredLimit: number; sort: "order" | "date-desc" }

export interface PresentationSettings {
  pricePolicy: PricePolicy;
  curation: { skills: CurationRule; works: CurationRule; services: CurationRule };
}

export interface Channel {
  id: string;           // 例："note", "x", "github"
  label: string;
  url: string;
  icon: string;
  order: number;
}

export type InquiryChannel =
  | { kind: "form-post"; action: string; fields: InquiryField[]; honeypotField?: string; note?: string }
  | { kind: "embed"; src: string; fallbackUrl: string; note?: string }
  | { kind: "link"; url: string; label: string; note?: string };

export interface InquiryField {
  name: "name" | "replyTo" | "service" | "message";
  label: string;
  required: boolean;
  param?: string;   // 送信先に渡す項目名（受付先のサービスの決まりに合わせる。省略時は name）
}

export interface Taggable { id: string; date?: string; tags: string[] }   // pickRelated の入力（DD-04）
export type ArticleCategory = "notice" | "work" | "essay";               // お知らせ / 制作 / 読み物（FR-11）
export interface ArticleImage extends ImageRef { caption?: string; credit?: string }
export interface Article extends Taggable {                              // 一覧用（本文なし）
  slug: string; title: string; summary: string; category: ArticleCategory;
  date: string;          // 公開日
  updated?: string;      // 更新日
  image?: ArticleImage;
  bodyText: string;      // 本文を文字だけにしたもの（読む時間の見積もり用。DD-17）
}
export interface ArticleRecord extends Article { body: TrustedHtml }
export interface ShareLink { id: string; label: string; icon: string; url: string }   // 解決済みの共有リンク（DD-07）
```

### Engine の出力

```ts
// contracts/engine-results.ts
export interface PriceDisplay {
  visible: boolean;
  text: string;          // 例："30,000円 / 件"、"10,000円〜"、"お見積もり"
  note?: string;
}

export type CallToAction =
  | { route: "inquiry"; href: string; label: string }    // href = "/contact/?service={slug}"
  | { route: "external"; href: string; label: string; channelId: string };
```

### View（Manager が Client に返す）

```ts
// contracts/views.ts
export interface PageMeta {
  title: string; description: string; canonical: string;
  ogImage: string; ogType: "website" | "article";
}

export interface LayoutView { siteName: string; avatar: ImageRef; copyright: string; analytics: AnalyticsTag | null }
export interface HomeView {
  meta: PageMeta; profile: OperatorProfile;
  featuredSkills: Skill[]; featuredWorks: Work[]; featuredServices: ServiceCard[];
}
export interface AboutView { meta: PageMeta; profile: OperatorProfile; skillGroups: SkillGroup[]; works: Work[] }
export interface ServiceCard { slug: string; title: string; summary: string; price: PriceDisplay; href: string }
export interface ServiceCatalogView { meta: PageMeta; services: ServiceCard[] }
export interface ServiceDetailView {
  meta: PageMeta; slug: string; title: string; summary: string;
  audience: string[]; deliverables: string[]; body: TrustedHtml;
  price: PriceDisplay; leadTime?: string; cta: CallToAction;
}
export interface ContactView {
  meta: PageMeta; channel: InquiryChannel;
  serviceOptions: { slug: string; title: string }[];
  cspSources: { formAction: string[]; frameSrc: string[] };   // DD-16
}
export interface ChannelLinkView { label: string; url: string; icon: string }
export interface ArticleCard extends Article { href: string; readingMinutes: number }   // href はベースパスつき
export interface ArticleFeedView { articles: ArticleCard[] }
export interface NewsIndexView { meta: PageMeta; articles: ArticleCard[]; feedHref: string }
export interface NewsArticleView {
  meta: PageMeta; article: ArticleRecord; readingMinutes: number; author: { name: string; avatar: ImageRef };
  share: ShareLink[];            // リンクのコピーは Client が足す（コピーする URL は meta.canonical）
  follow: ChannelLinkView[]; related: ArticleCard[];
}
export interface NewsFeedView { title: string; description: string; siteUrl: string; feedUrl: string; items: NewsFeedItem[] }
export interface NewsFeedItem { title: string; link: string; date: string; description: string; categories: string[] }
export interface AnalyticsTag { provider: string; snippet: string; scriptOrigins: string[] }   // scriptOrigins は DD-16
```

### 構成要素のインターフェース

```ts
// contracts/components.ts
export interface ShowcaseManager {
  getLayoutView(): Promise<LayoutView>;
  getHomeView(): Promise<HomeView>;
  getAboutView(): Promise<AboutView>;
  getServiceCatalogView(): Promise<ServiceCatalogView>;
  listServiceSlugs(): Promise<string[]>;
  getServiceDetailView(slug: string): Promise<ServiceDetailView>;
}
export interface EngagementManager {
  getChannelLinks(): Promise<ChannelLinkView[]>;
  getContactView(): Promise<ContactView>;
  getArticleFeedView(limit: number): Promise<ArticleFeedView>;
  getNewsIndexView(): Promise<NewsIndexView>;
  listArticleSlugs(): Promise<string[]>;
  getNewsArticleView(slug: string): Promise<NewsArticleView>;
  getNewsFeed(): Promise<NewsFeedView>;
}
export interface PricingEngine { presentPrice(price: PriceSpec, policy: PricePolicy, note?: string): PriceDisplay }
export interface CurationEngine {
  pickFeatured<T extends Curatable>(items: T[], rule: CurationRule): T[];
  arrange<T extends Curatable>(items: T[], rule: CurationRule): T[];
  pickRelated<T extends Taggable>(items: T[], base: Taggable, limit: number): T[];
}
export interface CtaEngine { decideForService(service: ServiceRecord): Promise<CallToAction> }
export interface ReadingTimeEngine { estimateMinutes(text: string): number }   // 1 以上の整数の分
export interface ContentAccess {
  getOperatorProfile(): Promise<OperatorProfile>;
  listSkillGroups(): Promise<SkillGroup[]>;
  listWorks(): Promise<Work[]>;
  listOfferedServices(): Promise<ServiceRecord[]>;
  findOfferedService(slug: string): Promise<ServiceRecord | undefined>;
  getPresentationSettings(): Promise<PresentationSettings>;
}
export interface InquiryAccess { getInquiryChannel(): Promise<InquiryChannel> }
export interface ChannelAccess {
  listChannels(): Promise<Channel[]>;
  findChannel(id: string): Promise<Channel | undefined>;
  listShareLinks(page: { url: string; title: string }): Promise<ShareLink[]>;
}
export interface ArticleAccess {
  listRecentArticles(limit?: number): Promise<Article[]>;   // 新しい順。limit を省くとすべて
  findArticle(slug: string): Promise<ArticleRecord | undefined>;
}
export interface SiteConfig { siteUrl: string; base: string; locale: "ja" }
export interface PageMetaInput {
  siteName: string; title?: string;   // title を省くとサイト名だけ（トップ用）
  description: string; path: string; ogImage?: string; type?: PageMeta["ogType"];
}
export interface Seo { buildPageMeta(input: PageMetaInput): PageMeta }
export interface Analytics { getAnalyticsTag(): Promise<AnalyticsTag | null> }
```

### 構成要素の組み立て

- 各構成要素は、依存する相手をコンストラクタ引数で受け取るクラス（または生成関数）として実装する。
- 実体の組み立ては `src/system/compose.ts` の 1 か所だけで行い、Client は `compose.ts` が公開する 2 つの Manager だけを import する。
- テストでは ResourceAccess を偽物に差し替える（TC-I01、TC-I02）。

## 3.2 DD-02 コンテンツのスキーマ

Astro の Content Collections（`src/content.config.ts`）で zod スキーマを定義する。これは ContentAccess の内部実装で、外には ContentAccess の契約（DD-01）しか見せない。

| コレクション | 場所 | 形式 | 主な項目 |
| --- | --- | --- | --- |
| `profile` | `src/content/profile.md` | Markdown + frontmatter（1 件） | displayName, tagline, avatar{src, alt}。本文が自己紹介（bio） |
| `skills` | `src/content/skills.yaml` | YAML（分類の配列） | id, name, order, skills[{id, name, description?, featured, order}] |
| `works` | `src/content/works/*.md` | Markdown + frontmatter | kind, title, summary, url?, date, featured, order, draft |
| `services` | `src/content/services/*.md` | Markdown + frontmatter | title, summary, audience[], deliverables[], price, priceNote?, leadTime?, cta, featured, order, draft |
| `presentation` | `src/content/settings/presentation.yaml` | YAML（1 件） | pricePolicy, curation{skills, works, services} |

### 検証規則

| 項目 | 規則 |
| --- | --- |
| slug | ファイル名から作る。`^[a-z0-9]+(-[a-z0-9]+)*$` |
| price | `kind` が `fixed` / `from` なら `amount` は 0 以上の整数。`quote` なら `amount` を書かない |
| cta | `route: channel` なら `channelId` が必須（存在するかどうかは CtaEngine が確かめる。DD-05） |
| kind | 制作例では必須。`client` / `personal` / `sample` のどれか（省略させないことで、サンプルを受託実績と取り違えて載せることを防ぐ） |
| スキルの order | 分類の中ではなく、スキル全体での並び順（トップの注目項目を選ぶときに全体で並べるため） |
| featured / order | 省略時は `false` / `100` |
| draft | `true` のものは `listOfferedServices` と `listWorks` に含めない |
| 画像 | `avatar.alt` は必須（NFR-03） |
| 文字数 | `summary` は 120 字以内、`title` は 40 字以内（description や OGP に使うため） |
| 本文のリンク | Markdown の書き方（`[文字](URL)`）で書く。HTML の `<a>` を直接書かない（外部リンクに属性を付ける変換が届かないため。DD-11、#39） |

違反があれば `astro build` が失敗する（FR-14、DD-14）。

- スキーマは ResourceAccess のディレクトリに置き（`resource-access/content-access/schemas.ts` など）、`src/content.config.ts` から使う。単体テストでも同じスキーマを使う（TC-U04〜U06）。
- 1 件だけの YAML（`presentation.yaml`、`inquiry.yaml`）は、id「main」の 1 エントリーとして読む（`content.config.ts` の `singleEntry`）。
- ResourceAccess は「契約への変換」（`index.ts`、テストで偽の読み込み元に差し替えられる）と「Astro からの読み込み」（`astro-source.ts`、`astro:content` を使う）に分ける。

### サービスの例

```markdown
---
title: "ホームページ・モックの制作"
summary: "個人や小さなお店のホームページ、アプリ画面のモックを作ります。"
audience: ["自分のホームページがほしい方", "アイデアを画面の形で確認したい方"]
deliverables: ["公開できるサイト一式、またはモック", "更新方法の説明"]
price: { kind: "quote" }
leadTime: "要相談"
cta: { route: "inquiry" }
featured: true
order: 10
---
本文（Markdown）
```

### 制作例の例

```markdown
---
kind: personal
title: "このホームページ"
summary: "Astro で作った自分のホームページ。設計書からテストまで公開しています。"
url: https://github.com/fukugyononuko/fukugyononuko.github.io
date: 2026-10-11
featured: true
---
```

## 3.3 DD-03 価格表示のアルゴリズム（PricingEngine）

`presentPrice(price, policy, note)` は、価格の種類とポリシーの組み合わせで次の表に従う。

| price.kind ＼ policy | `as-is`（そのまま） | `from-only`（「〜から」に統一） | `hide`（出さない） |
| --- | --- | --- | --- |
| `fixed` | `"{amount}円 / {unit}"` | `"{amount}円〜"` | `"お見積もり"` |
| `from` | `"{amount}円〜"` | `"{amount}円〜"` | `"お見積もり"` |
| `quote` | `"お見積もり"` | `"お見積もり"` | `"お見積もり"` |

- 金額は `Intl.NumberFormat("ja-JP")` で 3 桁区切りにする。
- `unit` がなければ ` / {unit}` を付けない。
- `visible` は常に `true`。将来、価格欄そのものを出さないポリシーを足すときに `false` を使う。
- `note` は `policy` が `hide` のときは出さない。それ以外はそのまま返す。

## 3.4 DD-04 注目項目の選び方と並べ方（CurationEngine）

- `arrange(items, rule)`
  - `sort: "order"`：`order` の昇順。同じなら `id` の昇順。
  - `sort: "date-desc"`：`date` の降順。`date` がないものは最後に回し、その中は `order` の昇順。
- `pickFeatured(items, rule)`
  1. `featured: true` の項目を `arrange` で並べる。
  2. 先頭から `rule.featuredLimit` 件を返す。
  3. `featured: true` が `featuredLimit` に満たなければ、満たないまま返す（勝手に補わない）。
- `pickRelated(items, base, limit)`（記事の関連記事。FR-16）
  1. `base` 自身（`id` が同じもの）を除く。
  2. 各項目について、`base` と共通するタグの数を数える。
  3. 共通するタグが 1 つ以上の項目を、タグの数の降順 → `date` の降順 → `id` の昇順で並べる。
  4. `limit` 件に満たなければ、残り（共通するタグがない項目）を `date` の降順 → `id` の昇順で後ろに足す（`pickFeatured` と違い、補う。ユーザーと決めた）。
  5. 先頭から `limit` 件を返す。`date` がないものは、`date` のあるものより後ろに回す。
- 入力の配列は変更しない（新しい配列を返す）。

## 3.5 DD-05 導線の決め方（CtaEngine）

`decideForService(service)`：

1. `service.cta.route` が `"inquiry"` なら
   `{ route: "inquiry", href: "/contact/?service={slug}", label: "このサービスについて問い合わせる" }`
2. `"channel"` なら、`ChannelAccess.findChannel(channelId)` でチャネルを探す。
   - 見つかれば `{ route: "external", href: channel.url, label: cta.label ?? "{channel.label}で見る", channelId }`
   - 見つからなければ `UnknownChannelError` を投げる（ビルド失敗。DD-14）。
- `href` のパス部分は Config のベースパスを付けて組み立てる（CMP-U01）。

## 3.6 DD-06 問い合わせ手段の設定（InquiryAccess）

`src/content/settings/inquiry.yaml`（RES-02）。手段の種類ごとに書く項目が違う。

```yaml
# 例：Formspree を使う場合
kind: form-post
action: https://formspree.io/f/xxxxxxx
note: 2〜3 日以内に返信します。
fields:
  - { name: name,    label: お名前（任意）, required: false }
  - { name: replyTo, label: 返信先,        required: true }
  - { name: service, label: 対象サービス, required: false }
  - { name: message, label: ご相談内容,    required: true }
```

```yaml
# 例：DM だけで受け付ける場合
kind: link
url: https://x.com/xxxxx
label: X の DM で問い合わせる
```

- 読み込み時に zod で検証する。不正なら `InvalidInquiryConfigError`（ビルド失敗）。
- `form-post` の `action` と `embed` の `src` は `https://` で始まること。
- OPEN-01 が決まるまでは、仮の `kind: link`（GitHub のプロフィール URL）を置く。

## 3.7 DD-07 外部チャネルの設定（ChannelAccess）

`src/content/settings/channels.yaml`（RES-03）。

```yaml
- { id: note,   label: note,   url: https://note.com/xxxxx,           icon: note,   order: 10 }
- { id: x,      label: X,      url: https://x.com/xxxxx,              icon: x,      order: 20 }
- { id: github, label: GitHub, url: https://github.com/fukugyononuko, icon: github, order: 30 }
```

- `id` は重複禁止。`url` は `https://` で始まること。違反があればビルド失敗。
- `listChannels` は `order` の昇順で返す。
- `icon` の名前と SVG アイコンの対応は Client（CMP-C01）が持つ。知らない名前のときは汎用のリンクアイコンを出す。

### 共有先（`listShareLinks`）

`src/content/settings/share-targets.yaml`（RES-03）。`url` は共有用 URL の形で、`{url}` と `{title}` を、共有するページの絶対 URL と見出しに置き換える。

```yaml
- { id: x,       label: X,                  icon: x,       url: "https://x.com/intent/post?text={title}&url={url}",                  order: 10 }
- { id: threads, label: Threads,            icon: threads, url: "https://www.threads.com/intent/post?text={title}&url={url}",        order: 20 }
- { id: hatena,  label: はてなブックマーク, icon: hatena,  url: "https://b.hatena.ne.jp/add?mode=confirm&url={url}&title={title}", order: 30 }
```

- 置き換える値は `encodeURIComponent` でエンコードする（見出しに `&` や `#` があっても URL が壊れないように）。
- `id` は重複禁止。`url` は `https://` で始まり、`{url}` を含むこと。違反があればビルド失敗（`InvalidChannelConfigError`）。
- `order` の昇順で返す。
- 「リンクのコピー」は外部の共有先ではないので、ここには書かない。Client が足す（DD-11）。

## 3.8 DD-08 ニュースの記事（ArticleAccess）

初期の実装は `createLocalArticleAccess(source)`（`resource-access/article-access/`）。記事は `src/content/news/*.md`（RES-04）に Markdown + frontmatter で書き、Astro の Content Collections（`news`）で読む。構成は ContentAccess と同じく、契約への変換（`index.ts`）と Astro からの読み込み（`astro-source.ts`）に分ける。

```markdown
---
title: "ホームページにニュース欄を作りました"
summary: "近況や新しい制作物のお知らせを、ここに書いていきます。"
category: notice
date: 2026-10-17
tags: ["このサイト"]
image: { src: /images/news/news-section.webp, alt: "……", caption: "……", credit: "副業のぬこ" }   # 任意
---
本文（Markdown）
```

### 検証規則

| 項目 | 規則 |
| --- | --- |
| slug | ファイル名から作る。`^[a-z0-9]+(-[a-z0-9]+)*$`（DD-02 と同じ）。公開後は変えない |
| title | 1〜60 字（ニュースの見出しはサービスより長くなるため） |
| summary | 1〜120 字（description、OGP、RSS に使う） |
| category | 必須。`notice` / `work` / `essay` のどれか |
| date / updated | `date` は必須。`updated` は任意で、`date` より前の日付は不可 |
| tags | 0〜5 個。1 つ 1〜20 字。重複は不可 |
| image | 任意。`src` は `/images/news/` の下の `.webp` / `.jpg` / `.png`。`alt` は必須（NFR-03）。`caption` と `credit` は任意。ファイルが `public/` にないときはビルド失敗 |
| draft | `true` のものはどの操作も返さない（ページも RSS も作らない） |
| 本文のリンク | DD-02 と同じく、Markdown の書き方で書く |

### 操作

- `listRecentArticles(limit?)`：`date` の降順 → `id` の昇順。`limit` があれば先頭から `limit` 件。
- `findArticle(slug)`：本文（ビルド時に変換した HTML。`TrustedHtml`）つき。
- `bodyText`：本文の HTML からタグを除き、文字参照（`&amp;` など）を文字に戻したもの。どの操作の結果にも入れる（記事カードにも読む時間を出すため）。
- 結果はビルドの間だけメモ化してよい（DD-09）。

### 将来（VOL-06）

- note の記事も並べるときは、`NoteRssArticleAccess`（ビルド時に `https://note.com/{id}/rss` を取得）と、自サイトの記事を合わせる実装を足し、`compose.ts` で切り替える。note の記事には本文がないので、`Article` に外部の URL を持たせる拡張が要る（そのときに契約を見直す）。
- 取得のタイムアウトは 10 秒。失敗したら note の記事を出さず、ビルドログに警告を出す（ビルドは失敗させない。DD-14）。

## 3.9 DD-09 Manager の実装方針

- Manager は手順（どれを呼び、どう組み合わせるか）だけを持つ。価格の計算や並べ替えのような判断は Engine に任せる。
- `getServiceDetailView(slug)` は、該当するサービスがなければ `ServiceNotFoundError` を投げる。`listServiceSlugs` と同じデータを使うので、通常は起きない。
- `getContactView` の `serviceOptions` は、CtaEngine の判定が `inquiry` になるサービスだけにする（02b §2b.2）。
- ニュースの操作（EngagementManager）：
  - 記事カードの `href` は `/news/{slug}/` にベースパスを付けたもの（CMP-U01）。
  - `getNewsArticleView(slug)` は、該当する記事がなければ `ArticleNotFoundError` を投げる。
  - 関連記事は、公開中の全記事から `CurationEngine.pickRelated(articles, article, 3)` で選ぶ。
  - 共有リンクは `ChannelAccess.listShareLinks({ url: meta.canonical, title: article.title })`。フォローのリンクは `listChannels()` をフッターと同じ形（`ChannelLinkView`）にしたもの。
  - meta：title は記事の見出し、description は要約、`type: "article"`、OGP 画像は記事の画像（なければ既定）。
  - 筆者は運営者のプロフィール（表示名とアイコン）。
  - 読む時間は `ReadingTimeEngine.estimateMinutes(article.bodyText)`。記事カード（トップ、一覧、関連記事）にも同じく付ける。
  - `getNewsFeed()` の項目は新しい順のすべての記事。リンクは絶対 URL（CMP-U01 の `toAbsoluteUrl`）。categories には分類のラベルではなくタグを入れる。
- ビルド中に同じリソースを何度も読まないよう、ResourceAccess の結果をビルドの間だけメモ化してよい。メモ化は ResourceAccess の内部で行い、Manager は気にしない。

## 3.10 DD-10 Utility

| 構成要素 | 実装 |
| --- | --- |
| CMP-U01 Config | `astro.config.mjs` の `site`（`https://fukugyononuko.github.io`）と `base`（`/`）を `import.meta.env` から読み、`{ siteUrl, base, locale: "ja" }` を返す |
| CMP-U02 Seo | `buildPageMeta({ title, description, path, ogImage?, type? })`。記事のページは `ogImage` に記事の画像、`type` に `article` を渡す。title は `"{ページ名} | {サイト名}"`（トップはサイト名のみ）。canonical と OGP 画像は Config から絶対 URL にする。OGP 画像の既定は `/og-default.jpg`。サイト名は Manager が `siteName` として渡す（Utility は ResourceAccess を呼ばないため。R7） |
| CMP-U03 Analytics | `src/content/settings/analytics.yaml` があれば読み、`{ provider, snippet }` を返す。なければ `null`（OPEN-06 が決まるまでは置かない） |

## 3.11 DD-11 Client（ページとコンポーネント）

| 画面 | ファイル | 呼ぶ Manager の操作 |
| --- | --- | --- |
| SCR-00 | `src/layouts/BaseLayout.astro`、`src/components/{Header,Footer,Icon,ExternalLink,Button,Section}.astro` | `getLayoutView`、`getChannelLinks` |
| SCR-01 | `src/pages/index.astro` | `getHomeView` |
| SCR-02 | `src/pages/about.astro` | `getAboutView` |
| SCR-03 | `src/pages/services/index.astro` | `getServiceCatalogView` |
| SCR-04 | `src/pages/services/[slug].astro`（`getStaticPaths` で `listServiceSlugs` を使う） | `getServiceDetailView` |
| SCR-05 | `src/pages/contact.astro`、`src/components/inquiry/{FormPost,Embed,Link}.astro`、`src/scripts/contact-prefill.ts` | `getContactView` |
| SCR-06 | `src/pages/404.astro`（canonical と OGP を出さず `noindex`） | `getLayoutView` だけ |
| SCR-07 | `src/pages/news/index.astro`、`src/components/ArticleCard.astro` | `getNewsIndexView` |
| SCR-08 | `src/pages/news/[slug].astro`（`getStaticPaths` で `listArticleSlugs` を使う）、`src/components/{ArticleCard,ShareButtons}.astro`、`src/scripts/copy-link.ts` | `getNewsArticleView` |
| RSS | `src/pages/news/rss.xml.ts`（Astro のエンドポイント） | `getNewsFeed` |

- スタイルは `src/styles/tokens.css`（色・余白・文字の CSS 変数）、`src/styles/global.css`（全体の基本）、各コンポーネントの scoped CSS。ダークモードは `prefers-color-scheme` で CSS 変数を切り替える（NFR-05）。値と部品の一覧は 02a §2a.7。
- 閲覧時の JavaScript は `contact-prefill.ts` と `copy-link.ts` だけ（NFR-10）。`?service=` の値が `serviceOptions` にあるときだけ選択欄に反映する。値を HTML として書き込まない（NFR-15）。
- 外部リンクは共通コンポーネント `ExternalLink.astro` だけで出力し、`target="_blank" rel="noopener noreferrer"` を必ず付ける（NFR-16）。
- Markdown の本文（プロフィール、サービス、ニュースの記事）の外部リンクには、Markdown を HTML に変えるときに、`src/markdown/external-links.ts`（Sätteri の hast プラグイン。`astro.config.mjs` の `markdown.processor` で設定する）が同じ属性と、`ExternalLink.astro` と同じ読み上げの文字「（新しいタブで開きます）」を付ける（#39）。外部リンクは、`http:`・`https:` でサイトと別のオリジンへのリンクとする。サイト内のリンクと `mailto:` などは変えない。これは CMP-A01・A04 の内部（Markdown の変換）で、`TrustedHtml` を作る前に行う。
  - Astro 7 の標準の Markdown の変換器は Sätteri なので、`markdown.rehypePlugins` は使えない（使うには別の変換器に替える必要がある。決まり 4 で試して確かめた）。
  - `@astrojs/markdown-satteri` は、Astro が固定している版と同じ版に固定し、Dependabot では `astro` と同じグループで上げる（版が 2 つ入ると、設定したプラグインが Astro の使う変換器に届かないおそれがあるため。決まり 3）。
- Markdown の本文は ContentAccess がビルド時に HTML に変換して渡す（`TrustedHtml`）。Client は `set:html` を `TrustedHtml` にだけ使う（NFR-15）。
- 制作例の種類ラベルは Client が持つ（`client` → 受託、`personal` → 個人制作、`sample` → サンプル）。ラベルは省略せず、すべての制作例に表示する（FR-03）。
- 制作例が 0 件ならその欄を出さない。サービスが 0 件なら「準備中です」と問い合わせへの誘導を出す（FR-03、FR-04）。
- ニュース（FR-11、FR-15〜17）：
  - 分類のラベルは Client が持つ（`notice` → お知らせ、`work` → 制作、`essay` → 読み物）。
  - 日付は「2026年10月17日」の形で、`<time datetime="2026-10-17">` に入れる。
  - 記事カードの画像は、記事の画像がなければ既定の画像（`/og-default.jpg`）を出す。カードの画像は `alt=""`（見出しがリンクの文字になるため、読み上げを重ねない）、`loading="lazy"`。カード全体を 1 つのリンクにする。
  - 記事のページのレイアウト（02a §2a.4 SCR-08）：CSS グリッドで、幅 64rem 以上は 2 列（左 `14rem`、右は残り、間は `3rem`）。HTML の順は「見出しの部分（読む時間、h1）→ 左の列（筆者、日付、分類、共有）→ 右の列（画像、本文、下の共有、フォロー、タグ）」とし、スマホではこの順に縦に並べる。PC 幅では、見出しの部分を右の列の上に置き、左の列を見出しの下の行から始める。左の列の項目は横線で区切る。
  - 読む時間は「◯ 分で読めます」と書く（記事のページは見出しの上、記事カードは日付の横）。
  - 画像のクレジットは、キャプションの下に「クレジット：{credit}」と書く。
  - 記事のページの画像は `alt` を記事のものにし、`fetchpriority="high"`。画像の枠は 16:9（`aspect-ratio`、`object-fit: cover`）にして、読み込みでレイアウトがずれないようにする。画像がない記事では枠ごと出さない。
  - 共有ボタン（`ShareButtons.astro`）は共有リンクを `ExternalLink.astro` で出す。リンクの読み上げは「{ラベル}で共有」。アイコンの対応は `Icon.astro`（`hatena`、`copy` を足す）。
  - 「リンクをコピー」は `<button hidden data-copy-url="…">` で出し、`copy-link.ts` が、クリップボード API（`navigator.clipboard`）が使えるときだけ `hidden` を外す（JavaScript が無効なときや、API のないブラウザでは表示されない。NFR-10）。押すと `navigator.clipboard.writeText` で URL をコピーし、ボタンの横の `role="status"` に「リンクをコピーしました」と出す。コピーに失敗したときは「コピーできませんでした」と出す。値を HTML として書き込まない（`textContent` を使う。NFR-15）。
  - RSS は `rss.xml.ts` が XML を組み立てる。文字列は `&`、`<`、`>`、`"`、`'` をエスケープする。依存は増やさない（`@astrojs/rss` は zod と XML パーサーへの依存が増えるため使わない）。
  - 共通レイアウトの `<head>` に `<link rel="alternate" type="application/rss+xml" href="/news/rss.xml">` を置く。

## 3.12 DD-12 依存規則の検査

`.dependency-cruiser.cjs` で 01 §1.6 の R1〜R7 を検査する。dependency-cruiser は `.astro` ファイルを解析できないため、`.astro` の import は `scripts/check-astro-imports.mjs` で R1 を検査する。`npm run depcruise` が両方を実行する。

| 規則 | from | 禁止する to |
| --- | --- | --- |
| R1 | `src/(pages\|layouts\|components\|scripts\|styles)/` | `src/system/`（`compose.ts` と `contracts/` を除く）、`src/content/`、`src/content.config.ts`、`astro:content` |
| R3 | `src/system/managers/X` | `src/system/managers/`（X 以外） |
| R4 | `src/system/engines/X` | `src/system/engines/`（X 以外）、`src/system/managers/` |
| R5 | `src/system/resource-access/X` | `src/system/resource-access/`（X 以外）、`engines/`、`managers/` |
| R6 | `src/system/` | Client（`src/(pages\|layouts\|components\|scripts\|styles)/`）。上位の層への呼び出しは R4・R5・R7 で禁止している |
| R7 | `src/system/utilities/` | `src/system/(managers\|engines\|resource-access)/` |
| R9 | `src/system/contracts/` | `src/` の `contracts/` 以外（契約は他の層に依存しない） |
| — | すべて | 循環参照 |

- 規則が空振りしていないことを、違反をわざと含むフィクスチャ（`tests/architecture/fixtures/violations`）と、許可された呼び出しだけのフィクスチャ（`fixtures/valid`）で確かめる（TC-A01）。

- 構成要素は 1 ファイルでも、同名のディレクトリでもよい。同じ構成要素の中での import は許可する。
- `contracts/` はどこからでも import してよい。
- R2 は許可の規則なので、検査は R1 と R3〜R7 の禁止で足りる。
- Client が import してよいのは `src/system/compose.ts` と `src/system/contracts/` だけ。

## 3.13 DD-13 ビルドとデプロイ

`.github/workflows/deploy.yml`：

| ジョブ | きっかけ | 手順 |
| --- | --- | --- |
| `check` | すべての push と PR | `npm ci` → `npm audit --audit-level=high`（TC-N09）→ `npm run check:workflows`（TC-N10）→ `npm run check:images`（TC-N15）→ `npm run check:privacy`（TC-N06）→ `npm run lint`（`astro check` による型検査）→ `npm run depcruise`（TC-A01）→ `npm test`（TC-U、TC-I、TC-A01） |
| `build` | `check` の成功後 | `npm run build`（スキーマ検証を含む）→ `npm run test:e2e`（TC-S、TC-N の自動検査）→ `npm run test:lighthouse`（TC-N01）→ `actions/upload-pages-artifact` |
| `deploy` | `main` で `build` の成功後 | `actions/deploy-pages` |

- Node.js のバージョンは `.nvmrc` で固定する。
- ワークフロー全体の既定の権限は `contents: read` にする。`pages: write` と `id-token: write` は `deploy` ジョブにだけ与える（NFR-12）。
- 外部の Action（`actions/checkout` なども含む）はコミット SHA で固定し、横にバージョンをコメントで書く。Dependabot が SHA の更新 PR を作る（NFR-12、NFR-13）。
- `pull_request_target` は使わない。

## 3.14 DD-14 エラー処理

| エラー | 発生元 | 扱い |
| --- | --- | --- |
| コンテンツのスキーマ違反 | CMP-A01（Astro の Content Collections） | ビルド失敗。ファイル名と項目を表示する（FR-14） |
| `InvalidInquiryConfigError` | CMP-A02 | ビルド失敗 |
| チャネル設定の不正 | CMP-A03 | ビルド失敗 |
| `UnknownChannelError` | CMP-E03 | ビルド失敗。サービスの slug と channelId を表示する |
| `ServiceNotFoundError` | CMP-M01 | ビルド失敗 |
| 記事のスキーマ違反、画像のファイルがない | CMP-A04（Astro の Content Collections と `astro-source.ts`） | ビルド失敗。ファイル名と項目を表示する（FR-14） |
| `ArticleNotFoundError` | CMP-M02 | ビルド失敗 |
| 共有先の設定の不正 | CMP-A03 | ビルド失敗（`InvalidChannelConfigError`） |
| 外部からの記事の取得失敗（将来） | CMP-A04 | 警告だけ。外部の記事を出さずに続ける |
| 依存規則違反 | DD-12 | CI 失敗。公開しない（NFR-09） |

公開中のサイトには前回成功したビルドが残るので、失敗しても訪問者への影響はない。

## 3.15 DD-15 ファイル配置

```
.
├── .github/workflows/deploy.yml          DD-13
├── .github/dependabot.yml                DD-16（npm と github-actions。astro と @astrojs/markdown-satteri は同じグループ）
├── .dependency-cruiser.cjs               DD-12
├── .nvmrc
├── assets/fonts/                         見出しフォントの元（Zen Maru Gothic Bold、OFL）。ビルド時にサブセット化する
├── astro.config.mjs                      CMP-U01 の値の元
├── docs/                                 設計ドキュメント
├── public/                               favicon、og-default.jpg、robots.txt、images/（images/news/ は記事の画像。RES-04）
├── scripts/                              check-astro-imports.mjs（DD-12）、check-workflows.mjs（TC-N10）、check-image-metadata.mjs（TC-N15）、check-privacy.mjs（TC-N06）、lighthouse.mjs（TC-N01）、subset-heading-font.mjs（見出しフォントのサブセット化）
├── src/
│   ├── content.config.ts                 DD-02（CMP-A01 の内部）
│   ├── markdown/external-links.ts        DD-11（CMP-A01・A04 の内部：本文の外部リンクの属性。astro.config.mjs から使う）
│   ├── content/                          RES-01〜03
│   │   ├── profile.md
│   │   ├── skills.yaml
│   │   ├── works/*.md
│   │   ├── services/*.md
│   │   ├── news/*.md                     RES-04（DD-08）
│   │   └── settings/{presentation,inquiry,channels,share-targets}.yaml
│   ├── pages/                            CMP-C01
│   ├── layouts/                          CMP-C01
│   ├── components/                       CMP-C01
│   ├── scripts/{contact-prefill,copy-link}.ts  CMP-C01（閲覧時）
│   ├── styles/                           CMP-C01
│   └── system/
│       ├── contracts/                    DD-01
│       ├── managers/
│       │   ├── showcase-manager.ts       CMP-M01
│       │   └── engagement-manager.ts     CMP-M02
│       ├── engines/
│       │   ├── pricing-engine.ts         CMP-E01
│       │   ├── curation-engine.ts        CMP-E02
│       │   ├── cta-engine.ts             CMP-E03
│       │   └── reading-time-engine.ts    CMP-E04
│       ├── resource-access/
│       │   ├── content-access/           CMP-A01（index.ts、schemas.ts、astro-source.ts）
│       │   ├── inquiry-access/           CMP-A02（index.ts、schema.ts、astro-source.ts）
│       │   ├── channel-access/           CMP-A03（index.ts、schema.ts、astro-source.ts）
│       │   └── article-access/           CMP-A04（index.ts、schema.ts、astro-source.ts）
│       ├── utilities/
│       │   ├── config.ts                 CMP-U01
│       │   ├── seo.ts                    CMP-U02
│       │   └── analytics.ts              CMP-U03
│       └── compose.ts                    構成要素の組み立て
└── tests/
    ├── unit/                             TC-U
    ├── integration/                      TC-I
    ├── e2e/                              TC-S
    ├── architecture/                     TC-A01（規則の検査とフィクスチャ）
    ├── support/                          テスト用の偽物（Manager の結合テストで ResourceAccess を差し替える）
    └── fixtures/                         テスト用のコンテンツ
```

各ソースファイルの先頭に、対応する ID をコメントで書く（例：`// CMP-E01 PricingEngine / DD-03`）。コードから設計へさかのぼれるようにするため。

## 3.16 DD-16 セキュリティ設計

### 脅威と対策

静的サイトなので、サーバーへの侵入や、データベースからの情報漏えいは起こらない。守るべきものは「公開の経路（アカウント、リポジトリ、CI）」と「訪問者・運営者の情報」の 2 つ。

| 脅威 | 起きること | 対策 | NFR |
| --- | --- | --- | --- |
| GitHub アカウントの乗っ取り | サイトの改ざん、偽サイトへの誘導 | 2 要素認証（パスキー推奨）、使わないトークンの削除 | NFR-11 |
| `main` への不正な変更 | 検査を通らない変更の公開 | ブランチ保護（`check` と `build` の成功を必須、force push と削除を禁止） | NFR-12 |
| CI の悪用 | 権限の強いトークンで改ざん | 最小権限、Action の SHA 固定、`pull_request_target` を使わない | NFR-12 |
| 依存パッケージの脆弱性や乗っ取り | ビルド時に悪意あるコードが動く、出力に混入する | ロックファイルと `npm ci`、Dependabot、`npm audit` | NFR-13 |
| 秘密情報の誤コミット | トークンなどの漏えい | 秘密情報を置かない設計（問い合わせ先の ID は公開されても困らない値だけ）、secret scanning と push protection | NFR-14 |
| スクリプトの注入（XSS） | 訪問者のブラウザで不正な処理が動く | 外部データはエスケープして出力、CSP | NFR-15 |
| 外部リンクや埋め込みの悪用 | 遷移先からの元ページの操作、リファラーからの情報漏れ | `noopener noreferrer`（部品の外部リンクと、Markdown の本文の外部リンクの両方。DD-11）、iframe の `sandbox`、外部スクリプトの許可リスト | NFR-16 |
| 共有ボタンからの追跡 | 共有先のスクリプトが訪問者を追跡する、CSP を緩める必要が出る | 共有先のスクリプトやボタンの画像を読み込まず、共有用 URL へのリンクだけにする（EIF-06）。CSP は変えない | NFR-15, NFR-16 |
| 問い合わせのスパム、内容の漏えい | 受付先があふれる、個人情報の漏えい | HTTPS、受付先のスパム対策＋ハニーポット欄、サイトに保存しない | NFR-17 |
| 通信の盗聴・改ざん | 表示内容のすり替え | HTTPS の強制 | NFR-18 |
| 画像からの個人情報の漏えい | 撮影場所などが分かる | 公開前に EXIF を削除 | NFR-06 |
| 独自ドメインの乗っ取り（将来） | 別人がドメインでサイトを公開 | 独自ドメインに移すときは GitHub でドメインを検証してから設定する | NFR-12 |

### Content-Security-Policy

GitHub Pages ではレスポンスヘッダーを設定できないため、`<meta http-equiv="Content-Security-Policy">` で指定する。

**実装（フェーズ 5）**：Astro の `security.csp`（`astro.config.mjs`）を使う。Astro が、ページで使われているスクリプトとスタイルのハッシュを計算して `script-src` と `style-src` を出力するので、インラインのスタイルやスクリプトも `'unsafe-inline'` なしで許可できる。`form-action` と `frame-src` は、`BaseLayout.astro` が `Astro.csp.insertDirective` でページごとに加える。

- フォントを `data:` URI で CSS に埋め込むと `font-src 'self'` に阻まれるため、フォントだけ埋め込みを無効にする（`vite.build.assetsInlineLimit`）。TC-N11 で検出した。
- コードのハイライト（Shiki）はインラインのスタイルを使うため無効にする（コードブロックを使わない）。

方針として決めた値（Astro が実際に出力する値は、これにハッシュを加えたもの）：

```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
form-action 'self' {問い合わせ先のオリジン};
frame-src {埋め込みフォームのオリジン};
base-uri 'self';
object-src 'none'
```

- CSP はページごとの `<meta>` なので、ページごとに変えられる。`form-action` と `frame-src` に外部のオリジンを足すのは問い合わせページだけ。値は `EngagementManager.getContactView()` が返す `cspSources` を使う（EngagementManager が CMP-A02 の設定から組み立てる）。問い合わせ手段を変えても CSP の手直しは要らない（VOL-01 の閉じ込めを保つ）。
- アクセス解析を入れるときは、`LayoutView.analytics.scriptOrigins` を全ページの `script-src` と `connect-src` に足す（VOL-09）。
- Astro がインラインで出力するスクリプトやスタイルが CSP に違反しないよう、ビルド設定で外部ファイルに出力する。
- `<meta>` の CSP では `frame-ancestors`（他サイトへの埋め込み禁止）を指定できない。このサイトにはログインも入力の確定操作もないので、他サイトに埋め込まれても実害は小さいと判断し、受け入れる。

### GitHub の設定（リポジトリとアカウント）

コードではなく設定で守る部分。初回の公開前に設定し、TC-N08 で確認する。

| 設定 | 値 | NFR |
| --- | --- | --- |
| アカウントの 2 要素認証 | 有効（パスキー推奨） | NFR-11 |
| ブランチ保護（`main`） | 必須のステータスチェック：`check`、`build`／force push 禁止／削除禁止 | NFR-12 |
| Actions の既定の権限 | Read のみ。Actions による PR の承認は禁止 | NFR-12 |
| Dependabot alerts / security updates | 有効 | NFR-13 |
| Secret scanning / push protection | 有効 | NFR-14 |
| Pages の公開元 | GitHub Actions | NFR-12 |
| Enforce HTTPS | 有効 | NFR-18 |

### 問い合わせ（EIF-01）

- 送信先は `https://` に限る（DD-06 の検証規則）。
- `form-post` のフォームには、人には見えない入力欄（ハニーポット）を置き、受付先で値が入った送信を捨てる。受付先のサービスにスパム対策の機能があれば有効にする。
- 問い合わせの内容はリポジトリにも CI にも残らない。受付先のサービスだけが持つ。

## 3.17 DD-17 読む時間の見積もり方（ReadingTimeEngine）

`estimateMinutes(text)` は、本文の文字数を、人の平均の**黙読**の速さで割って分にする（VOL-12、FR-18、#41）。

### 速さの値と出典

| 文字の種類 | 速さ | 出典と条件 |
| --- | --- | --- |
| 日本語（漢字・ひらがな・カタカナ） | 653 字/分 | 小林潤平・川嶋稔夫 (2018) 「日本語文章の読み速度の個人差をもたらす眼球運動」映像情報メディア学会誌 72(10): J154–J159。情報科学系の大学生 200 人が、星新一の SF 短編（約 3000 字、縦書き 1 行 38 字、iPad）を「普段の読みで、飛ばし読みをしない」で読んだ平均（中央値 635、SD 174、範囲 323〜1189） |
| それ以外の文字（英字・数字など） | 238 × 4.6 ≒ 1095 字/分 | Brysbaert (2019) "How many words do we read per minute? A review and meta-analysis of reading rate", *Journal of Memory and Language* 109: 104047。190 研究（18,573 人）のメタ分析で、英語のノンフィクションの黙読は 238 語/分。その平均語長が 4.6 文字（論文の補正式「238 × 4.6 ÷ 本文の平均語長」） |

- 英語の値は、語長の文字数（空白と句読点を含まない）で字/分に直したので、下の数え方とそろう。
- 日本語の出典は「黙読」と明記していない。普段の読みで、読書中の眼球運動を測る実験なので、黙読と推定した。文字数に句読点を含めたかどうかも書かれていない（含めていれば、句読点を数えないこの見積もりは、わずかに短めになる）。どちらも未確認。
- 以前（#38）は音読の速さ（Trauzettel-Klosinski & Dietz (2012) IOVS 53(9): 5452–5461 の表 2。日本語 357 字/分、英語 987 字/分）を使っていた。ふつうの読者は黙読するので、ユーザーと黙読の値に替えた（#41）。

### アルゴリズム

1. 空白（`\p{White_Space}`）、句読点（`\p{P}`）、記号（`\p{S}`）を除く。
2. 残った文字のうち、`\p{Script=Han}`・`\p{Script=Hiragana}`・`\p{Script=Katakana}` と長音符「ー」を日本語の文字として数え、それ以外をその他の文字として数える。サロゲートペアは 1 文字と数える。
3. 分 = 日本語の文字数 ÷ 653 ＋ その他の文字数 ÷ (238 × 4.6)。
4. 切り上げて整数にする。0 分（本文が空など）のときは 1 分にする（「0 分で読めます」とは書かない）。

- 画像、コード、表の分は足さない（足すときは VOL-12 の変化として扱う）。
- 入力は文字だけにした本文（`Article.bodyText`）。HTML の形は知らない。
