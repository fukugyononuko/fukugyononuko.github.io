# 設計ドキュメント

副業のぬこ ホームページ（https://fukugyononuko.github.io/）の設計ドキュメント一式。
アーキテクチャは Juval Löwy『Righting Software』の **The Method**（変動性に基づく分解）に従う。

## 構成

| # | ドキュメント | 内容 | 主な ID |
| --- | --- | --- | --- |
| 0 | [要件定義](00_requirements.md) | ビジネス要件、機能要件、非機能要件、コアユースケース、未決事項 | BR / FR / NFR / UC / OPEN |
| 1 | [概要設計](01_overview.md) | システムの範囲、変動性の分析、階層構成、利用規則 | VOL / CMP / RES |
| 2a | [基本設計（外部）](02_basic_external.md) | URL、画面、画面項目、外部インターフェース | SCR / EIF |
| 2b | [基本設計（内部）](02_basic_internal.md) | 構成要素の責務と契約、コールチェーン | CMP / CC |
| 3 | [詳細設計](03_detailed.md) | 型定義、データスキーマ、アルゴリズム、ファイル配置、エラー処理 | DD |
| 4 | [テスト仕様](04_test.md) | 単体・結合・アーキテクチャ・総合・非機能・変動性シナリオ | TC |
| T | [トレーサビリティ表](traceability.md) | 上記 ID の上流から下流への対応と、その逆引き | — |

## 開発の進め方

| フェーズ | 内容 | 完了条件 |
| --- | --- | --- |
| 0 | リポジトリ作成、設計ドキュメント | 設計ドキュメント一式がレビュー済みで `main` にある |
| 1 | Astro の雛形、CI とデプロイ、依存規則の検査、テストの土台、リポジトリのセキュリティ設定 | 仮のページが https://fukugyononuko.github.io/ で見られ、CI の `check` と `build` が通る |
| 2 | 共通レイアウトとデザイン（OPEN-05） | SCR-00 と配色・フォント・ダークモードが決まっている |
| 3 | 構成要素と全画面の実装（仮のコンテンツ） | CC-01〜CC-06 が動き、TC-U・TC-I・TC-S が通る |
| 4 | 本番のコンテンツと問い合わせ手段（OPEN-01〜04、07） | 未決事項が解消され、本番の内容が公開されている |
| 5 | SEO・性能・セキュリティの仕上げ（OPEN-06） | TC-N がすべて通る |

各フェーズの完了時に `/retrospective` で振り返り、[docs/retrospectives/](retrospectives/) に記録する。振り返りで決めた改善は、次のフェーズに入る前に反映する。

## 開発の決まり

振り返り（[フェーズ 0〜3](retrospectives/2026-10-11-phase0-3.md)、[フェーズ 4](retrospectives/2026-10-11-phase4.md)、[フェーズ 5](retrospectives/2026-10-11-phase5.md)、[SNS とカフェ](retrospectives/2026-10-11-sns-cafe.md)、[宇宙の分析](retrospectives/2026-10-11-space.md)、[三体問題シミュレーター](retrospectives/2026-10-11-three-body.md)、[ご意見の反映](retrospectives/2026-10-12-three-body-feedback.md)、[3 次元化](retrospectives/2026-10-12-three-body-3d.md)、[軌跡とフォント](retrospectives/2026-10-12-three-body-trail-fonts.md)、[tensorcheck の設計](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-12-design.md)、[tensorcheck の実装](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-14-implementation.md)、[ニュース欄](retrospectives/2026-10-18-news.md)）で決めたこと。

| # | 決まり | 由来 |
| --- | --- | --- |
| 1 | フェーズの始めに、Claude が補った前提と仮定を一覧にして、ユーザーに確認してから進める | T-01 |
| 2 | PR は常に `main` から作る。前の PR がマージされるまで、次の PR は作らない | T-02 |
| 3 | 依存を最新以外のバージョンに固定したら、同じ PR で Dependabot の ignore と理由を書く | T-03 |
| 4 | 実装を始める前に、各 View の項目のデータの出所を、利用規則（01 §1.6）に照らして確かめる。フレームワークに依存する前提は、小さく試して確かめる。言語・実行環境・依存に関する非機能要件（`no_std`、外部依存なし、対応する版など）は、要件に書く前に最小のコードで確かめる | T-04、[tensorcheck の設計](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-12-design.md) T-02 |
| 5 | ドキュメントを置き換えたり分割したりするときは、旧版の見出しが新版のどこにあるかを対応表で確かめる | T-05 |
| 6 | `.github/workflows/` を扱う前に、`gh auth status` で `workflow` スコープがあるかを確かめる | T-06 |
| 7 | 新しいリポジトリでは、最初のコミットだけを `main` に直接 push する。CI が通ったら、すぐに次を設定し、以後は PR を通す：ブランチ保護（CI の成功が必須、force push と削除の禁止、管理者にも適用）、Actions の既定の権限を読み取りのみ、Dependabot alerts と security updates、secret scanning と push protection。CSP を使うサイトでは、最初のページと同時に CSP 違反のテストを入れる（インラインの style 属性と、data: URI で埋め込んだフォントは CSP に阻まれる）。最初に入れるファイル：`.nvmrc`（Rust を使うなら `rust-toolchain.toml`）、`.gitignore`（`.privacy-denylist` を含める）、`.github/dependabot.yml`、CI のワークフロー、検査スクリプト（`check-workflows`、`check-privacy`、必要に応じて `check-image-metadata`、`check-asset-budget`）、`LICENSE`、`README.md`。全体の CSS には `[hidden] { display: none !important; }` を入れる（`display` の指定が `hidden` 属性に勝つのを防ぐ）。手元の clone には、ステージした差分を `.privacy-denylist` と照合する pre-commit フック（`.git/hooks/pre-commit`）を入れ、CI より前の、コミットの時点で止める | [phase4](retrospectives/2026-10-11-phase4.md) T-02、[sns-cafe](retrospectives/2026-10-11-sns-cafe.md) T-01、[three-body](retrospectives/2026-10-11-three-body.md) T-03、プログラムの振り返り（2026-10-12）T-05 |
| 8 | 公開リポジトリに書く文章（ファイル、コミットメッセージ、PR のタイトルと本文）には、個人情報や、ユーザーが分けている別の活動の名前を書かない。CI の個人情報の検査（TC-N06）がこれらをすべて検査する。手元では `npm run check:privacy` で確かめる | [phase5](retrospectives/2026-10-11-phase5.md) T-01、T-05 |
| 9 | 好みに左右される見た目の選択（配色、主要な写真）は、2〜3 案を並べて見せ、選んでもらってから実装する | [space](retrospectives/2026-10-11-space.md) T-01 |
| 10 | 性能の予算：1 ページが読み込む CSS は 20KB まで、見出しフォントは 60KB まで。CI（`npm run check:budget`）で検査する | [space](retrospectives/2026-10-11-space.md) T-02 |
| 11 | コミットするデータ（CSV など）を作るときは、同じ値どうしでも並び順が一意に決まるようにする（タイブレークのキーを入れる） | [space](retrospectives/2026-10-11-space.md) T-04 |
| 12 | 数値のテストの基準（しきい値）は、先に実際に計測し、理屈（許容誤差、保存則など）と照らして決める。根拠をテストのコメントに書く。計測が基準を超えたら、まず実装の不具合を疑う。基準を変えるのは、原因を確かめた（再現や独立な計算で裏づけた）ときだけにする | [three-body](retrospectives/2026-10-11-three-body.md) T-02、[tensorcheck の実装](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-14-implementation.md) T-02 |
| 13 | 操作できる道具（シミュレーターなど）を作るときは、利用者が変えられる項目と、変えられない項目（固定する理由つき）を一覧にし、作る前にユーザーに確かめる | [three-body-feedback](retrospectives/2026-10-12-three-body-feedback.md) T-01 |
| 14 | Web フォントを足すときは、使う文字だけにサブセット化し、大きさを予算の検査（決まり 10）に入れる。最初の画面で使うフォントは preload する。フォントを足したら、その場で Lighthouse を実行する | [three-body-feedback](retrospectives/2026-10-12-three-body-feedback.md) T-02、[trail-fonts](retrospectives/2026-10-12-three-body-trail-fonts.md) T-01 |
| 15 | データの形（次元、項目など）を変えたら、古い形を前提にした書き方（`.x`・`.y` だけを使う箇所など）を検索して洗い出し、新しい形の例ですべての保存則・不変条件をテストする | [three-body-3d](retrospectives/2026-10-12-three-body-3d.md) T-02、T-03 |
| 16 | 専門分野のライブラリや道具では、要件を書く前に、その分野の標準的な対象・操作・恒等式（どの入力でも成り立つ関係）・前提（式が成り立つ条件や記号の約束）を一覧にし、範囲をユーザーと決める。テストには、特別な解との比較だけでなく、恒等式と、座標などの選び方によらないことを含める | [tensorcheck の設計](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-12-design.md) T-01 |
| 17 | 性能の要件があるものは、中心のアルゴリズムを実装したフェーズでベンチマークを取る（最後のフェーズに回さない）。設計の段階の試作も、特別な場合ではなく一般の場合の実装で測る | [tensorcheck の実装](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-14-implementation.md) T-01 |
| 18 | The Method の設計では、概要設計と基本設計（内部）で、層をまたいで共有する型（データの契約）の一覧と置き場所を決める。設計した規則（次元の決め方など）は、外部設計の使い方の例に当てはめて成り立つか確かめる | [tensorcheck の実装](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-14-implementation.md) T-03 |
| 19 | ライブラリでは、設計を確かめるためのユースケースとは別に、用途を示す応用の例題（その分野の実際の問題を 1 つ以上、検証した値と図つき）を要件に入れる。README には、そのコードと図を載せる | [tensorcheck の重力の例題](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-16-gravity-examples.md) T-02 |
| 20 | 例題とテストの数値の判定は、わざと誤り（物理の誤り、符号の誤りなど）を入れて失敗することを確かめ、その結果を PR に書く。成分ごとの判定を、打ち消し合いの起こりうる 1 つの量（不定符号の縮約など）の判定で代用しない。照合や検査のスクリプト（`check:privacy` など）を証拠に使うときも、わざと差を 1 つ入れて検出することを確かめてから結果を使う | [tensorcheck の重力の例題](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-16-gravity-examples.md) T-03、[tensorcheck の 2026-10-17 の振り返り](https://github.com/fukugyononuko/tensorcheck/blob/main/docs/retrospectives/2026-10-17-issues-19-36.md) T-02 |
| 21 | 参考にする見た目（ユーザーが示したページなど）は、HTML の文章ではなく、PC 幅とスマホ幅で描画したスクリーンショットで確かめる。見た目の案（決まり 9）にはそのスクリーンショットを添え、参考と同じところと違うところを書く。完成の確認も、確認用の仮のコンテンツではなく公開する実際のコンテンツで、参考と並べて行う | [news](retrospectives/2026-10-18-news.md) T-01 |
| 22 | 作業の始めと PR をマージする前に、`gh pr list` で開いている PR（Dependabot を含む）と CI の状態を確かめ、マージの順を決める。CI が失敗している PR はマージせず、issue に登録する | [news](retrospectives/2026-10-18-news.md) T-02 |
| 23 | 外部の研究の値（速さ、割合など）を定数に使うときは、値を決める前に、測定の条件（方法、対象者、数え方）が使う場面と合うかを原典で確かめる。合わなければ合う出典を探し、見つからなければ決める前にユーザーに確かめる。確かめられない条件は設計書に「未確認」と書く | [news](retrospectives/2026-10-18-news.md) T-03 |
| 24 | Manager の結合テストでは、変動性を閉じ込めた Engine（規則や定数を持つもの）を、規則を知らない偽物に差し替える。本物の規則に依存した期待値を Manager のテストに持たせない（規則を変えたときの変更を Engine とそのテストに閉じ込めるため） | [news](retrospectives/2026-10-18-news.md) T-04 |

## ID の規則

| 接頭辞 | 意味 | 定義場所 |
| --- | --- | --- |
| `BR-nn` | ビジネス要件 | 00 |
| `FR-nn` | 機能要件 | 00 |
| `NFR-nn` | 非機能要件 | 00 |
| `UC-nn` | コアユースケース | 00 |
| `OPEN-nn` | 未決事項 | 00 |
| `VOL-nn` | 変動性 | 01 |
| `RES-nn` | リソース | 01 |
| `CMP-Xnn` | 構成要素（X = C: Client、M: Manager、E: Engine、A: ResourceAccess、U: Utility） | 01 / 02b |
| `CC-nn` | コールチェーン | 02b |
| `SCR-nn` | 画面 | 02a |
| `EIF-nn` | 外部インターフェース | 02a |
| `DD-nn` | 詳細設計の項目 | 03 |
| `TC-Xnn` | テストケース（X = U: 単体、I: 結合、A: アーキテクチャ、S: 総合、N: 非機能、R: 変動性シナリオ） | 04 |

- ID は一度振ったら番号を変えない。項目を廃止するときは削除せず「廃止」と書く。
- 設計を変える PR では、関係する ID の記述と [traceability.md](traceability.md) を同じ PR で更新する。
- 状態は「初期」（初期リリースで実装）と「将来」（設計上の置き場所だけ用意し、実装はしない）の 2 種類。
