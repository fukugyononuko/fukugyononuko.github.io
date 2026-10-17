# 2b. 基本設計（内部設計）

## 2b.1 構成要素の一覧

| ID | 構成要素 | 層 | 閉じ込める変動性 | 状態 |
| --- | --- | --- | --- | --- |
| CMP-C01 | Pages | Client | VOL-10 | 初期 |
| CMP-C02 | 運営者の環境 | Client | — | 初期 |
| CMP-M01 | ShowcaseManager | Manager | VOL-11（見せる手順） | 初期 |
| CMP-M02 | EngagementManager | Manager | VOL-11（つなぐ手順） | 初期 |
| CMP-E01 | PricingEngine | Engine | VOL-03 | 初期 |
| CMP-E02 | CurationEngine | Engine | VOL-04 | 初期 |
| CMP-E03 | CtaEngine | Engine | VOL-02 | 初期 |
| CMP-E04 | ReadingTimeEngine | Engine | VOL-12 | 初期 |
| CMP-A01 | ContentAccess | ResourceAccess | VOL-05 | 初期 |
| CMP-A02 | InquiryAccess | ResourceAccess | VOL-01 | 初期 |
| CMP-A03 | ChannelAccess | ResourceAccess | VOL-07 | 初期 |
| CMP-A04 | ArticleAccess | ResourceAccess | VOL-06 | 初期 |
| CMP-U01 | Config | Utility | VOL-08 | 初期 |
| CMP-U02 | Seo | Utility | —（§1.3） | 初期 |
| CMP-U03 | Analytics | Utility | VOL-09 | 初期 |

## 2b.2 責務と契約

各操作の型は 03 §3.1（DD-01）で定義する。ここでは責務と、操作の意味だけを決める。

### CMP-C01 Pages（Client）
- 責務：Manager から受け取った View を HTML にする。見た目とレイアウトのすべて。
- 知ってはいけないこと：コンテンツファイルの場所や形式、価格表示や導線のルール、問い合わせ先の接続情報。
- 閲覧時に動く JavaScript は Client の中だけに置く（問い合わせ時のサービス指定の補助など）。

### CMP-C02 運営者の環境（Client）
- 責務：コンテンツファイルを編集し、`main` に push する。
- 決められたスキーマ（DD-02）に従ってコンテンツを書く。

### CMP-M01 ShowcaseManager
- 責務：運営者とサービスを「見せる」手順の組み立て。

| 操作 | 意味 | 呼び出す相手 |
| --- | --- | --- |
| `getLayoutView()` | 共通レイアウトに必要な、運営者に関する情報 | A01 |
| `getHomeView()` | トップに出す注目項目 | A01, E02, E01, U02 |
| `getAboutView()` | プロフィール、スキル、制作例 | A01, E02, U02 |
| `getServiceCatalogView()` | 公開中のサービスの一覧（価格表示つき） | A01, E02, E01, U02 |
| `listServiceSlugs()` | 詳細ページを生成するサービスの slug 一覧 | A01 |
| `getServiceDetailView(slug)` | 1 サービスの詳細（価格表示と行動喚起つき） | A01, E01, E03, U02 |

### CMP-M02 EngagementManager
- 責務：訪問者を問い合わせや外部の場に「つなぐ」手順の組み立て。ニュースを読ませ、共有・フォローにつなぐ手順（UC-06）も持つ（01 §1.4）。

| 操作 | 意味 | 呼び出す相手 |
| --- | --- | --- |
| `getChannelLinks()` | 共通フッターに出す外部チャネルのリンク | A03 |
| `getContactView()` | 問い合わせ手段と、問い合わせで指定できるサービスの選択肢 | A02, A01, E03, U02 |
| `getArticleFeedView(limit)` | 最新の記事カード（最大 `limit` 件。トップ用） | A04, E04 |
| `getNewsIndexView()` | ニュース一覧（すべての記事カード、新しい順） | A04, A01, E04, U02 |
| `listArticleSlugs()` | 記事のページを生成する slug の一覧 | A04 |
| `getNewsArticleView(slug)` | 1 つの記事と、筆者・読む時間・共有リンク・フォローのリンク・関連記事 | A04, A01, A03, E02, E04, U02 |
| `getNewsFeed()` | RSS フィードの中身（絶対 URL つき） | A04, A01, U01 |

`getContactView` は、各サービスについて CtaEngine に導線を判定させ、導線が「問い合わせ」のサービスだけを選択肢にする。note で販売しているもの（将来）を問い合わせの選択肢に出さないため。

### CMP-E01 PricingEngine
- 責務：サービスの価格情報と価格表示ポリシーから、表示用の価格を決める（VOL-03）。
- `presentPrice(price, policy)`：表示する文字列、注記、表示の種類を返す。リソースにはアクセスしない（純粋な関数）。

### CMP-E02 CurationEngine
- 責務：項目の集合から、注目項目を選び、並べる（VOL-04）。
- `pickFeatured(items, rule)`：規則に従って最大 N 件を選ぶ。
- `arrange(items, rule)`：規則に従って並べる。
- `pickRelated(items, base, limit)`：`base` と関連の強い項目を最大 `limit` 件選ぶ（記事の関連記事。DD-04）。タグを持つ項目（`Taggable`）を扱い、記事であることは知らない。
- スキル、制作例、サービスに共通の「並べられる項目」（`Curatable`）として扱い、種類ごとの違いを知らない。

### CMP-E03 CtaEngine
- 責務：サービスごとに、訪問者をどこにつなぐかを決める（VOL-02）。
- `decideForService(service)`：行き先（問い合わせ / 外部の場）、リンク先、ラベルを返す。
- 外部の場の URL は CMP-A03 ChannelAccess から得る。存在しないチャネルが指定されていたらエラーにする（DD-14）。

### CMP-E04 ReadingTimeEngine
- 責務：本文の文字から、読む時間の目安（分）を見積もる（VOL-12、FR-18）。
- `estimateMinutes(text)`：文字だけにした本文から、分（1 以上の整数）を返す。リソースにはアクセスしない（純粋な関数）。
- 記事であることも HTML の形も知らない。本文を文字だけにするのは CMP-A04 の仕事（記事の形式を隠すため）。

### CMP-A01 ContentAccess
- 責務：コンテンツ（RES-01）を業務の言葉で提供する。保管場所と形式を隠す（VOL-05）。

| 操作 | 意味 |
| --- | --- |
| `getOperatorProfile()` | 運営者のプロフィール |
| `listSkillGroups()` | 分類ごとのスキル |
| `listWorks()` | 公開する制作例 |
| `listOfferedServices()` | 公開中のサービス（下書きは含めない） |
| `findOfferedService(slug)` | 公開中のサービス 1 件。なければ `undefined` |
| `getPresentationSettings()` | 価格表示ポリシー、注目項目の選び方などの表示設定 |

- スキーマ違反のコンテンツはビルドを失敗させる（FR-14）。

### CMP-A02 InquiryAccess
- 責務：その時点の問い合わせ手段（RES-02）を提供する。手段の種類と接続先を隠す（VOL-01）。
- `getInquiryChannel()`：手段の種類（`form-post` / `embed` / `link`）と、表示に必要な情報を返す。

### CMP-A03 ChannelAccess
- 責務：外部チャネルの一覧（RES-03）を提供する（VOL-07）。
- `listChannels()`：表示順に並んだ外部チャネル。
- `findChannel(id)`：チャネル 1 件。なければ `undefined`。
- `listShareLinks(page)`：ページ（絶対 URL と見出し）を共有するリンクを、表示順に返す。共有用 URL の形（RES-03）を隠す。

### CMP-A04 ArticleAccess
- 責務：記事の出所（初期は自サイトのニュース。将来は note の RSS なども）を隠して、記事を提供する（VOL-06）。
- `listRecentArticles(limit?)`：公開中の記事を新しい順に最大 `limit` 件（省略時はすべて）。本文の HTML は含めない。読む時間を見積もるための、文字だけにした本文（`bodyText`）は含める。外部から取得する実装（将来）では、取得に失敗したら空の一覧を返し、警告を出す。
- `findArticle(slug)`：公開中の記事 1 件（本文つき）。なければ `undefined`。
- 下書き（`draft: true`）は返さない。

### CMP-U01 Config
- 責務：公開先に関わる設定（サイト URL、ベースパス、言語）を提供する（VOL-08）。
- `getSiteConfig()`

### CMP-U02 Seo
- 責務：画面ごとのメタ情報（title、description、canonical、OGP）を組み立てる。
- `buildPageMeta(input)`：Config を使って絶対 URL を作る。

### CMP-U03 Analytics
- 責務：アクセス解析のタグを提供する（VOL-09）。
- `getAnalyticsTag()`：設定がなければ `null`。

## 2b.3 コールチェーン（CC）

設計した構成要素の組み合わせで、すべてのコアユースケースを実現できることを示す。矢印はすべて 01 §1.6 の利用規則に従っている。

| ID | コールチェーン | 実現する UC |
| --- | --- | --- |
| CC-01 | トップの表示 | UC-01, UC-02 |
| CC-02 | About の表示 | UC-01 |
| CC-03 | サービス一覧・詳細の表示 | UC-02 |
| CC-04 | 問い合わせ | UC-03 |
| CC-05 | 外部の場への移動 | UC-04 |
| CC-06 | コンテンツの更新と公開 | UC-05 |
| CC-07 | ニュースの表示と共有 | UC-06 |

### CC-01 トップの表示（ビルド時）

```mermaid
sequenceDiagram
  participant P as C01 Pages（/）
  participant SM as M01 ShowcaseManager
  participant CA as A01 ContentAccess
  participant CE as E02 CurationEngine
  participant PE as E01 PricingEngine
  participant SEO as U02 Seo
  P->>SM: getHomeView()
  SM->>CA: getOperatorProfile()
  SM->>CA: getPresentationSettings()
  SM->>CA: listSkillGroups() / listWorks() / listOfferedServices()
  SM->>CE: pickFeatured(skills / works / services, rule)
  loop 注目サービスごと
    SM->>PE: presentPrice(price, policy)
  end
  SM->>SEO: buildPageMeta(...)
  SM-->>P: HomeView
```

共通レイアウトの部分は、どの画面でも `ShowcaseManager.getLayoutView()` と `EngagementManager.getChannelLinks()` を呼ぶ（CC-05 を参照）。

### CC-02 About の表示（ビルド時）

```mermaid
sequenceDiagram
  participant P as C01 Pages（/about/）
  participant SM as M01 ShowcaseManager
  participant CA as A01 ContentAccess
  participant CE as E02 CurationEngine
  participant SEO as U02 Seo
  P->>SM: getAboutView()
  SM->>CA: getOperatorProfile()
  SM->>CA: listSkillGroups()
  SM->>CA: listWorks()
  SM->>CA: getPresentationSettings()
  SM->>CE: arrange(works, rule)
  SM->>SEO: buildPageMeta(...)
  SM-->>P: AboutView
```

### CC-03 サービス一覧・詳細の表示（ビルド時）

```mermaid
sequenceDiagram
  participant P as C01 Pages（/services/…）
  participant SM as M01 ShowcaseManager
  participant CA as A01 ContentAccess
  participant CE as E02 CurationEngine
  participant PE as E01 PricingEngine
  participant CT as E03 CtaEngine
  participant CH as A03 ChannelAccess
  P->>SM: getServiceCatalogView()
  SM->>CA: listOfferedServices() / getPresentationSettings()
  SM->>CE: arrange(services, rule)
  SM->>PE: presentPrice(...)（各サービス）
  SM-->>P: ServiceCatalogView
  P->>SM: listServiceSlugs()
  loop slug ごと
    P->>SM: getServiceDetailView(slug)
    SM->>CA: findOfferedService(slug)
    SM->>PE: presentPrice(price, policy)
    SM->>CT: decideForService(service)
    CT->>CH: findChannel(id)（外部の場のとき）
    SM-->>P: ServiceDetailView
  end
```

### CC-04 問い合わせ

```mermaid
sequenceDiagram
  participant P as C01 Pages（/contact/）
  participant EM as M02 EngagementManager
  participant IA as A02 InquiryAccess
  participant CA as A01 ContentAccess
  participant CT as E03 CtaEngine
  actor V as 訪問者のブラウザ
  participant EXT as EIF-01 受付先
  Note over P,CT: ビルド時
  P->>EM: getContactView()
  EM->>IA: getInquiryChannel()
  EM->>CA: listOfferedServices()
  EM->>CT: decideForService(service)（各サービス）
  EM-->>P: ContactView（問い合わせ導線のサービスだけを選択肢に）
  Note over V,EXT: 閲覧時
  V->>V: ?service= を読んで選択欄に反映（JS が有効なときだけ）
  V->>EXT: 送信 / 遷移
```

### CC-05 外部の場への移動

```mermaid
sequenceDiagram
  participant P as C01 Pages（共通レイアウト）
  participant EM as M02 EngagementManager
  participant CH as A03 ChannelAccess
  actor V as 訪問者のブラウザ
  P->>EM: getChannelLinks()
  EM->>CH: listChannels()
  EM-->>P: ChannelLinkView[]
  V->>V: リンクを選ぶと新しいタブで外部の場が開く
```

サービス詳細の行動喚起からの移動は CC-03 で、記事のページのフォローのリンクは CC-07 で解決済みのリンクを使う。

### CC-06 コンテンツの更新と公開

```mermaid
sequenceDiagram
  actor O as C02 運営者
  participant GH as GitHub リポジトリ
  participant CI as GitHub Actions
  participant B as Astro ビルド（CC-01〜05）
  participant PG as GitHub Pages
  O->>GH: コンテンツを編集して push（main）
  GH->>CI: ワークフロー起動
  CI->>CI: 依存規則の検査（TC-A01）と単体・結合テスト
  CI->>B: astro build（ContentAccess がスキーマを検証）
  alt すべて成功
    CI->>PG: デプロイ
  else 失敗
    CI-->>O: 失敗の通知と違反箇所（公開はされない）
  end
```

### CC-07 ニュースの表示と共有

```mermaid
sequenceDiagram
  participant P as C01 Pages（/、/news/…）
  participant EM as M02 EngagementManager
  participant AA as A04 ArticleAccess
  participant CA as A01 ContentAccess
  participant CH as A03 ChannelAccess
  participant CE as E02 CurationEngine
  participant RT as E04 ReadingTimeEngine
  participant SEO as U02 Seo
  actor V as 訪問者のブラウザ
  Note over P,SEO: ビルド時
  P->>EM: getArticleFeedView(3)（トップ）/ getNewsIndexView()（一覧）
  EM->>AA: listRecentArticles(limit)
  EM->>RT: estimateMinutes(bodyText)（記事ごと）
  EM-->>P: ArticleFeedView / NewsIndexView
  P->>EM: listArticleSlugs()
  loop slug ごと
    P->>EM: getNewsArticleView(slug)
    EM->>AA: findArticle(slug)
    EM->>AA: listRecentArticles()
    EM->>CE: pickRelated(articles, article, 3)
    EM->>RT: estimateMinutes(bodyText)（記事と関連記事）
    EM->>CA: getOperatorProfile()（筆者）
    EM->>SEO: buildPageMeta(...)（type: article、記事の画像）
    EM->>CH: listShareLinks({ url: canonical, title })
    EM->>CH: listChannels()（フォロー）
    EM-->>P: NewsArticleView
  end
  P->>EM: getNewsFeed()（/news/rss.xml）
  EM->>AA: listRecentArticles()
  EM-->>P: NewsFeedView
  Note over V: 閲覧時
  V->>V: 共有リンクを選ぶと新しいタブで共有先が開く。「リンクをコピー」は記事の URL をクリップボードに入れる（JS が有効なときだけ）
```

## 2b.4 変動性への対応の確認

各変動性が起きたとき、変更が 1 つの構成要素（とデータ・設定）の中で済むことを確認する。テストとしては TC-R01〜TC-R12（04 §4.7）でレビューする。

| VOL | 変化の例 | 変える場所 | 変えなくてよい場所 |
| --- | --- | --- | --- |
| VOL-01 | Google フォーム → Formspree | A02 と RES-02 | Manager、Engine、ページ（手段の種類が既存の 3 種類に収まる場合） |
| VOL-02 | テンプレートなどを note で販売する | RES-01 のサービスに導線を指定。ルール自体を変えるなら E03 | Manager、ページ |
| VOL-03 | 「〜円から」に統一 | RES-01 の表示設定。新しい見せ方なら E01 | それ以外のすべて |
| VOL-04 | 注目項目を新しい順に | RES-01 の表示設定。新しい規則なら E02 | それ以外のすべて |
| VOL-05 | CMS に移行 | A01 | Manager、Engine、ページ |
| VOL-06 | 自サイトのニュースに note の記事も並べる | A04（と `compose.ts`） | M02、ページ |
| VOL-07 | チャネルや共有先を追加 | RES-03（共有先のアイコンが新しければ C01 の `Icon.astro` も） | Manager、Engine、ページ |
| VOL-08 | 独自ドメインに移行 | U01（と DNS） | それ以外のすべて |
| VOL-09 | アクセス解析を導入 | U03 と設定 | それ以外のすべて |
| VOL-10 | デザインを変更 | C01 | Business Logic 以下のすべて |
| VOL-11 | 記事のページにサービスへの誘導を足す | M01 / M02 の手順と C01 の表示 | Engine、ResourceAccess |
| VOL-12 | 読む時間を黙読の速さで見積もる。画像 1 枚ごとに時間を足す | E04（画像の数が要るなら A04 の `Article` と契約も） | Manager、ページ |

## 2b.5 層をまたいで共有する型（データの契約）

決まり 18 に従い、層をまたいで受け渡す型と置き場所をここで決める。定義は 03 §3.1（DD-01）。どれも `src/system/contracts/` に置き、他の層に依存しない（R9）。

| 型 | 置き場所 | 作る層 → 使う層 | 内容 |
| --- | --- | --- | --- |
| `Taggable` | `records.ts` | —（Engine の入力の形） | `Curatable` にタグ（`tags: string[]`）を足したもの。CurationEngine の `pickRelated` が受け取る |
| `ArticleCategory` | `records.ts` | A04 → M02 → C01 | 記事の分類 `"notice" \| "work" \| "essay"`。表示のラベルは Client が持つ（制作例の種類と同じ。DD-11） |
| `Article`、`ArticleImage` | `records.ts` | A04 → M02 → C01 | 記事の要約（一覧用。本文の HTML はなく、文字だけにした本文 `bodyText` を持つ）と画像（キャプション、クレジット）。`Article` は `Taggable` |
| `ArticleRecord` | `records.ts` | A04 → M02 | 本文（`TrustedHtml`）つきの記事 |
| `ShareLink` | `records.ts` | A03 → M02 → C01 | 共有先 1 つ分の、解決済みのリンク（ラベル、アイコン名、URL） |
| `ArticleCard` | `views.ts` | M02 → C01 | 記事カード（`Article` に記事ページの `href` と読む時間 `readingMinutes` を足したもの） |
| `ArticleFeedView`、`NewsIndexView`、`NewsArticleView`、`NewsFeedView` | `views.ts` | M02 → C01 | 各画面と RSS の View |

旧版の `Article`（`title`、`url`、`publishedAt`、`source`。note の RSS を想定した将来の型）は、自サイトの記事に合わせて置き換える。旧版を使っていたのは「記事なし」の実装（`createNoArticleAccess`）だけで、画面からは使っていない。
