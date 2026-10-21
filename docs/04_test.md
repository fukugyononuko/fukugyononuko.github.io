# 4. テスト仕様

## 4.1 テストの種類と道具

| 種類 | 接頭辞 | 対象 | 道具 | 実行 |
| --- | --- | --- | --- | --- |
| 単体 | TC-U | Engine、ResourceAccess、Utility | Vitest | CI（`check`） |
| 結合 | TC-I | Manager と、偽物に差し替えた ResourceAccess | Vitest | CI（`check`） |
| アーキテクチャ | TC-A | 依存規則 | dependency-cruiser | CI（`check`） |
| 総合 | TC-S | ビルド結果のサイト全体 | Playwright | CI（`build`） |
| 非機能 | TC-N | 性能、アクセシビリティ、SEO など | Lighthouse（`scripts/lighthouse.mjs`）、axe、Playwright、検査スクリプト | CI（`check`、`build`） |
| 変動性シナリオ | TC-R | 変動性を閉じ込められているか | 設計レビュー | 設計を変える PR のたび |

## 4.2 単体テスト（TC-U）

| ID | 対象 | 確認すること | 設計 |
| --- | --- | --- | --- |
| TC-U01 | CMP-E01 PricingEngine | DD-03 の表の 9 通りすべて、3 桁区切り、`unit` の有無、`hide` のときに `note` を出さないこと | DD-03 |
| TC-U02 | CMP-E02 CurationEngine | `order` / `date-desc` の並び、同順位の扱い、`featuredLimit` で切ること、足りないときに補わないこと、入力を変更しないこと | DD-04 |
| TC-U03 | CMP-E03 CtaEngine | `inquiry` の href とラベル、`channel` で URL を解決すること、ラベルの上書き、存在しないチャネルで `UnknownChannelError` | DD-05 |
| TC-U04 | CMP-A01 ContentAccess | 正しいフィクスチャを契約の型に変換すること、`draft` を除くこと、DD-02 の検証規則に違反するフィクスチャ（制作例の `kind` の欠落を含む）で失敗すること | DD-02 |
| TC-U05 | CMP-A02 InquiryAccess | 3 種類の設定を読めること、`https://` 以外や必須項目の欠落で `InvalidInquiryConfigError` | DD-06 |
| TC-U06 | CMP-A03 ChannelAccess | `order` の順、`findChannel` の有無、`id` の重複や不正な URL で失敗すること。`listShareLinks` が `{url}`・`{title}` をエンコードして置き換え（`&`・`#`・日本語を含む見出し）、`order` の順に返すこと。共有先の `id` の重複、`https://` 以外、`{url}` のない形で失敗すること | DD-07 |
| TC-U07 | CMP-A04 ArticleAccess | 正しいフィクスチャを契約の型に変換すること、`bodyText` がタグを除き文字参照を戻したものになること、新しい順（同じ日付は `id` の順）、`limit`、`draft` を除くこと、`findArticle` の有無と本文。DD-08 の検証規則（slug、文字数、分類の欠落、`updated` が `date` より前、タグの重複、画像の `alt` の欠落と置き場所）に違反するフィクスチャで失敗すること | DD-08 |
| TC-U08 | CMP-U02 Seo | title の形式（トップとそれ以外）、canonical と OGP 画像が絶対 URL になること | DD-10 |
| TC-U09 | CMP-U01 Config / CMP-U03 Analytics | ベース URL を設定から読むこと、解析の設定がないときに `null` | DD-10 |
| TC-U10 | CMP-E02 CurationEngine（`pickRelated`） | 自分自身を除くこと、共通するタグの数の順、同数なら新しい順 → `id` の順、足りないときに新しい記事で補うこと、`limit` で切ること、記事が自分だけのときに空、入力を変更しないこと | DD-04 |
| TC-U11 | CMP-E04 ReadingTimeEngine | 日本語 653 字でちょうど 1 分・654 字で 2 分、英字 1094 字で 1 分・1095 字で 2 分、混ざった文章で両方の和を切り上げること、空白・句読点・記号を数えないこと、長音符とサロゲートペア（𠮷）を 1 文字の日本語と数えること、空の本文で 1 分。文字を足しても分が減らないこと（単調性） | DD-17 |
| TC-U12 | Markdown の外部リンクの変換（`src/markdown/external-links.ts`） | 外部リンクの判定の境界（プロトコル相対 `//host/`、大文字のスキームとホスト、ポートの有無、`http` と `https` の違い、サイトのホストで始まる別のドメイン）。別のオリジンの `http`・`https` のリンクに `target="_blank"`・`rel="noopener noreferrer"`・読み上げの文字を付けること。サイト内のリンク（相対・同じオリジンの絶対 URL）、`mailto:`、`#` だけのリンク、`href` のないリンクを変えないこと。本文の HTML の `<a>`（大文字、改行、タブ、`<a/>`、ブロックの中、入れ子、コメントのあと、`<!-->`・`<!--->`・`--!>` で閉じたコメントのあとを含む）を記録し、ビルドの最後に `RawAnchorError` を出すこと。`<abbr>`・`<abbr/>`・`<aside>`・`</a>`、コメントの中の `<a>`（改行を含む、閉じていないもの）、文字参照の `&lt;a&gt;`、`<textarea>` の中の `<a>` は記録しないこと | DD-11 |

## 4.3 結合テスト（TC-I）

| ID | 対象 | 確認すること | 設計 |
| --- | --- | --- | --- |
| TC-I01 | CMP-M01 ShowcaseManager | 偽の ContentAccess / ChannelAccess を使い、各 View が CC-01〜CC-03 のとおりに組み立てられること（注目項目の件数、価格表示、行動喚起、meta）。存在しない slug で `ServiceNotFoundError` | DD-09、CC-01〜03 |
| TC-I02 | CMP-M02 EngagementManager | `getContactView` の選択肢が導線 `inquiry` のサービスだけになること、`getChannelLinks` の順序。ニュース：記事カードの `href`、`getArticleFeedView` の件数、記事の View の meta（`article`、記事の画像、canonical）・筆者・共有リンク（canonical を共有すること）・フォロー・関連記事（自分を含まない）・読む時間（記事とすべてのカード）、存在しない slug で `ArticleNotFoundError`、RSS の項目が絶対 URL で新しい順 | DD-09、CC-04、CC-05、CC-07 |

## 4.4 アーキテクチャテスト（TC-A）

| ID | 確認すること | 設計 |
| --- | --- | --- |
| TC-A01 | DD-12 の禁止規則に違反する import が 0 件であること。違反を含むわざと壊したフィクスチャで検査が失敗することも確認する | DD-12、01 §1.6 |
| TC-A02 | ほかの依存が使っているパッケージ（`@astrojs/markdown-satteri` は `astro` が、`satteri` は `@astrojs/markdown-satteri` が使う）を直接の依存にも書くとき、版を固定して入っている版と同じで、使っている依存の下に別のコピーがないこと。`@astrojs/markdown-satteri` は `astro` が固定している版と同じこと | DD-11 |

## 4.5 総合テスト（TC-S）

| ID | 確認すること | 画面 / 設計 |
| --- | --- | --- |
| TC-S01 | 全画面が表示され、各画面に 02a §2a.4 の項目があること | SCR-00〜08 |
| TC-S02 | トップ → サービス一覧 → 詳細 → 問い合わせ（サービスが選ばれた状態）と進めること | SCR-01, 03, 04, 05、CC-03, 04 |
| TC-S03 | 行動喚起が外部の場のサービスでは、ボタンが外部の URL を新しいタブで開くこと | SCR-04、CC-03 |
| TC-S04 | 全画面のフッターに外部チャネルのリンクが RES-03 の順で並ぶこと | SCR-00、CC-05 |
| TC-S05 | 存在しない URL で 404 ページが表示され、トップに戻れること | SCR-06 |
| TC-S06 | `main` への push で、公開 URL に変更が反映されること（初回のデプロイ時と、ワークフローを変えたときに手動で確認） | DD-13、CC-06 |
| TC-S07 | スキーマに違反するコンテンツ（ニュースの記事を含む）や、本文に HTML の `<a>` を直接書いたコンテンツを含めると `npm run build` が失敗し、ファイル名と項目が表示されること。キャッシュが残っている 2 回目のビルドでも失敗すること | DD-02、DD-08、DD-14、CC-06 |
| TC-S08 | サイト内リンクにリンク切れがないこと | 全画面 |
| TC-S09 | JavaScript を無効にしても、FR-01〜07、FR-10、FR-11、FR-15（共有とフォローのリンク）、FR-16 の内容が表示され、「リンクをコピー」が表示されないこと | DD-11 |
| TC-S10 | すべての制作例に種類のラベルが表示されること。制作例が 0 件のフィクスチャでは欄が出ず、サービスが 0 件のフィクスチャでは「準備中です」と問い合わせへの誘導が出ること | SCR-01, SCR-02, SCR-03、DD-11 |
| TC-S11 | ナビゲーションの「ニュース」から一覧が開き、記事カード（画像、分類、公開日、見出し）が新しい順に並ぶこと。トップの「最新のニュース」が「サービス」の上にあり、カードから記事が開くこと。記事のページに 02a §2a.4 SCR-08 の項目が表の順に並ぶこと（HTML の順）。幅 1280px では左の列（筆者・日付・分類・共有）が本文の列の左にあり、上端が見出しより下にあること。幅 360px では 1 列で、左の列が本文の上にあること。カードと記事に「◯ 分で読めます」があること | SCR-01, SCR-07, SCR-08、CC-07 |
| TC-S12 | 記事のページの共有リンク（上と下）が X・Threads・はてなブックマークの順で、記事の canonical をエンコードして含み、新しいタブで開くこと。フォローのリンクが RES-03 の順に並ぶこと。JavaScript が有効なとき「リンクをコピー」が表示され、押すとクリップボードに canonical が入り「コピーしました」と出ること | SCR-08、EIF-06、DD-11 |
| TC-S13 | `/news/rss.xml` が XML として読め、公開中の記事が新しい順に絶対 URL で入っていること。全画面の `<head>` に RSS の `link rel="alternate"` があること | EIF-07、DD-11 |

## 4.6 非機能テスト（TC-N）

| ID | 確認すること | NFR |
| --- | --- | --- |
| TC-N01 | Lighthouse（モバイル）で、全画面（ニュース一覧と記事のページを含む）の Performance、Accessibility、Best Practices、SEO が 90 以上（3 回の中央値）。`@lhci/cli` は依存に既知の脆弱性を含むため使わない | NFR-02, NFR-03, NFR-04 |
| TC-N02 | axe で重大（critical / serious）な違反が 0 件 | NFR-03 |
| TC-N03 | 全画面で title・description・canonical・OGP が固有であること。sitemap と robots.txt が出力されること | NFR-04 |
| TC-N04 | 幅 360px で横スクロールが発生しないこと | NFR-01 |
| TC-N05 | `prefers-color-scheme: dark` でダークテーマの色が使われること | NFR-05 |
| TC-N06 | 個人情報の確認（CI）：追跡しているファイル、すべてのコミットメッセージ、PR のタイトルと本文に禁止語（本名など）がないこと、コミットのアドレスが許可したものだけであること。禁止語は公開リポジトリに書かず、Secret `PRIVACY_DENYLIST` か git 管理外の `.privacy-denylist` から読む | NFR-06 |
| TC-N07 | 運用費の確認：有料のサービスや有料プランを使っていないこと（リリース前に手動で確認） | NFR-07 |
| TC-N08 | GitHub の設定が DD-16 の表のとおりであること（2 要素認証、ブランチ保護、Actions の権限、Dependabot、secret scanning、Enforce HTTPS）。リリース前と、設定を変えたときに手動で確認 | NFR-11, NFR-12, NFR-13, NFR-14, NFR-18 |
| TC-N09 | `npm audit --audit-level=high` が 0 件であること（CI） | NFR-13 |
| TC-N10 | ワークフロー内の外部 Action がすべてコミット SHA で固定され、既定の権限が `contents: read` であること（CI でワークフローファイルを検査） | NFR-12 |
| TC-N11 | 全画面に CSP の `<meta>` があり、ブラウザのコンソールに CSP 違反が出ないこと。問い合わせページだけが外部の `form-action` / `frame-src` を許可していること | NFR-15 |
| TC-N12 | `?service=` に `<script>` などを含む値を与えても、HTML として解釈されないこと | NFR-15 |
| TC-N13 | すべての外部リンク（DD-11 と同じ定義：`http`・`https` で、サイトと別のオリジン。Markdown の本文の外部リンクを含む）に `rel="noopener noreferrer"` と `target="_blank"` が付き、iframe に `sandbox` が付いていること。本文のサイト内のリンクには `target` が付かないこと | NFR-16 |
| TC-N14 | 問い合わせの送信先が `https://` であること、`form-post` にハニーポット欄があること | NFR-17 |
| TC-N15 | `public/` と `src/` の画像に GPS などの EXIF 情報がないこと（CI でスクリプトを使って検査） | NFR-06 |

## 4.7 変動性シナリオ（TC-R）

The Method では、設計の正しさは「変化が起きたときに変更が閉じ込められるか」で確かめる。各変動性について、変化を想定して、変更が 02b §2b.4 の「変える場所」だけで済むかをレビューする。設計を変える PR では、関係するシナリオを見直す。

| ID | 変動性 | 想定する変化 | 合格条件 |
| --- | --- | --- | --- |
| TC-R01 | VOL-01 | 問い合わせを `link` から `form-post` に変える | 変更が CMP-A02 と RES-02 だけ |
| TC-R02 | VOL-02 | 1 つのサービスを note での販売に切り替える | 変更が RES-01 のサービス 1 件だけ |
| TC-R03 | VOL-03 | 価格表示を全体で「〜から」に統一する | 変更が RES-01 の表示設定だけ |
| TC-R04 | VOL-04 | 制作例の並びを新しい順にする | 変更が RES-01 の表示設定だけ |
| TC-R05 | VOL-05 | コンテンツの保管場所を別の形式に移す | 変更が CMP-A01 だけ（契約は変えない） |
| TC-R06 | VOL-06 | 自サイトのニュースに note の記事も並べる | 変更が CMP-A04 の実装と `compose.ts` だけ（note の記事に本文がないことによる契約の拡張は、DD-08 に書いたとおり別に見直す） |
| TC-R07 | VOL-07 | 外部チャネルを 1 つ追加する。記事の共有先を 1 つ追加する | 変更が RES-03 だけ（共有先のアイコンが新しければ `Icon.astro` も） |
| TC-R08 | VOL-08 | 独自ドメインに移す | 変更が CMP-U01 の設定と DNS だけ |
| TC-R09 | VOL-09 | アクセス解析を入れる | 変更が CMP-U03 の設定だけ |
| TC-R10 | VOL-10 | 配色とフォントを変える | 変更が CMP-C01 だけ |
| TC-R11 | VOL-11 | 記事のページにサービスへの誘導を足す | 変更が CMP-M01 / CMP-M02 の手順と CMP-C01 だけ |
| TC-R12 | VOL-12 | 読む時間を音読から黙読の速さに替える | 変更が CMP-E04 の定数だけ（とそのテスト、DD-17 の出典） |

## 4.8 手動の確認の記録

| 日付 | ID | 結果 |
| --- | --- | --- |
| 2026-10-11 | TC-N07 | 有料のサービスやプランは使っていない（GitHub Pages / Actions の無料枠、Formspree の無料プラン） |
| 2026-10-11 | TC-N08 | API で確認：secret scanning・push protection・Dependabot alerts／security updates が有効、Actions の既定の権限は読み取りのみ、`main` のブランチ保護（`check`・`build` が必須、管理者にも適用、force push と削除は禁止）、Pages は Actions から公開・HTTPS を強制。**2 要素認証は API から読めないため、ユーザーが確認する** |
| 2026-10-18 | TC-R12 | #41 で読む時間を音読から黙読の速さに替えた。`git diff --stat` で、コードの変更は `src/system/engines/reading-time-engine.ts`（CMP-E04 の定数）だけ。ほかはそのテスト（TC-U11）と設計書（DD-17、TC-U11・TC-R12 の記述）。Manager、ResourceAccess、ページは変えていない。ただし、結合テスト（TC-I02）が本物の CMP-E04 を使い、音読の速さを前提にした期待値（358 字で 2 分）を持っていたため、失敗した。製品のコードではなくテストの依存の問題なので、TC-I02 では見積もりの規則に依存しない偽の CMP-E04 に差し替えた |
