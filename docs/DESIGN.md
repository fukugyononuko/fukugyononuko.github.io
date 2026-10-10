# 設計書：副業のぬこ ホームページ

- 版：0.1（ドラフト）
- 作成日：2026-10-11
- リポジトリ：`fukugyononuko/fukugyononuko.github.io`
- 公開 URL：https://fukugyononuko.github.io/

---

## 1. 目的

「副業のぬこ」の自己紹介と、副業の仕事の受付窓口を兼ねた個人サイトを作る。

| ゴール | 達成の目安 |
| --- | --- |
| どんな人か伝わる | プロフィール・スキル・SNS リンクがトップから 1 クリック以内で見られる |
| 仕事を依頼してもらえる | 提供サービスと依頼方法が明確で、問い合わせ導線が全ページにある |
| 維持コストゼロ | ドメイン・サーバー費用なし（GitHub Pages）。更新は Markdown を編集して push するだけ |

### スコープ外（初期リリース）

- ブログ機能（将来追加できる構成にはしておく）
- 独自ドメイン
- 決済、ログイン、データベースなどサーバー側の処理

## 2. 想定読者

1. **依頼を検討している人**：何を頼めるか、いくらか、どう連絡するかを知りたい
2. **SNS などから来た人**：どんな人か軽く知りたい

## 3. サイト構成

```
/            トップ（ヒーロー + プロフィール概要 + サービス概要 + 問い合わせ導線）
/about/      プロフィール詳細（経歴・スキル・SNS）
/services/   提供サービス（内容・料金目安・納期・依頼の流れ・FAQ）
/contact/    問い合わせ（フォーム or 連絡手段の案内）
/404.html    Not Found
```

ページ数が少ないので、トップを 1 ページで完結させ、詳細ページへリンクする構成にする。

### 共通レイアウト

- ヘッダー：サイト名 / ナビ（About・Services・Contact）
- フッター：SNS リンク、コピーライト
- 各ページ末尾に「お問い合わせはこちら」ボタン

## 4. 各ページの内容

### トップ
- キャッチコピーとアイコン（ぬこ）
- 一言プロフィール
- サービス一覧（カード 3〜4 枚、`/services/` へリンク）
- 問い合わせボタン

### About
- 名前（副業のぬこ）、自己紹介文
- できること・スキル
- 経歴・実績（公開できる範囲で）
- SNS / GitHub リンク

### Services
- サービスごとに：内容、料金目安、納期目安
- 依頼の流れ（問い合わせ → ヒアリング → 見積もり → 作業 → 納品）
- よくある質問

### Contact
- 問い合わせフォーム
- フォーム以外の連絡手段（SNS の DM など）

## 5. 技術構成

| 項目 | 採用 | 理由 |
| --- | --- | --- |
| フレームワーク | Astro（静的出力） | 出力が素の HTML で速い。Markdown でページを書け、将来ブログも足しやすい |
| 言語 | TypeScript | Astro の標準 |
| スタイル | 素の CSS（CSS 変数 + コンポーネント単位の scoped CSS） | ページが少なく、ライブラリを入れるほどではない |
| ホスティング | GitHub Pages | 無料、ドメイン不要 |
| デプロイ | GitHub Actions（`withastro/action` + `actions/deploy-pages`） | `main` に push すると自動で公開 |
| 問い合わせ | 外部フォームサービス（候補は §7） | GitHub Pages はサーバー処理ができないため |
| パッケージ管理 | npm | |

### ディレクトリ構成（予定）

```
.
├── .github/workflows/deploy.yml   # ビルド & Pages へデプロイ
├── docs/DESIGN.md                 # この設計書
├── public/                        # favicon, OGP 画像など
├── src/
│   ├── components/                # Header, Footer, ServiceCard, ContactButton
│   ├── layouts/BaseLayout.astro   # 共通 <head>・ヘッダー・フッター
│   ├── content/services/*.md      # サービス 1 件 = 1 ファイル
│   ├── data/profile.ts            # 名前・SNS リンクなどの共通データ
│   ├── pages/                     # index / about / services / contact / 404
│   └── styles/global.css
├── astro.config.mjs               # site: "https://fukugyononuko.github.io"
└── package.json
```

サービスを Content Collections の Markdown で管理するので、サービスの追加・料金改定はファイル編集だけで済む。

## 6. 非機能要件

- **レスポンシブ**：スマホ優先（幅 360px〜）
- **表示速度**：Lighthouse の Performance / Accessibility / Best Practices / SEO すべて 90 以上
- **SEO / SNS 共有**：ページごとの `title` / `description`、OGP・Twitter Card、`sitemap.xml`（`@astrojs/sitemap`）
- **アクセシビリティ**：見出し階層、画像の alt、十分なコントラスト、キーボード操作
- **ダークモード**：`prefers-color-scheme` に追従
- **プライバシー**：本名・住所などは載せない。コミットの作者も `fukugyononuko` の noreply アドレスにする

## 7. 未決事項

| # | 内容 | 候補 |
| --- | --- | --- |
| 1 | 問い合わせ手段 | Google フォーム埋め込み（無料・簡単）/ Formspree（月 50 件まで無料、見た目を合わせやすい）/ SNS の DM のみ |
| 2 | 提供するサービスの内容と料金 | 要ヒアリング |
| 3 | 料金を明記するか | 明記 / 「〜円から」/ 要見積もり |
| 4 | 掲載する SNS | X、GitHub、ココナラなど |
| 5 | デザインの方向性 | ぬこ（猫）モチーフのやわらかい雰囲気 など |
| 6 | アクセス解析 | 入れない / Google Analytics / Cloudflare Web Analytics |

## 8. 開発の進め方

| フェーズ | 内容 | 完了条件 |
| --- | --- | --- |
| 0 | リポジトリ作成、設計書 | この設計書がレビュー済みで `main` にある |
| 1 | Astro の雛形 + GitHub Actions デプロイ | 空ページが https://fukugyononuko.github.io/ で見られる |
| 2 | 共通レイアウトとデザイン | ヘッダー・フッター・配色・フォントが決まっている |
| 3 | 各ページの実装（仮テキスト） | 全ページが表示され、リンクが通る |
| 4 | 本文・サービス内容・問い合わせフォームの組み込み | 未決事項 1〜4 が解消されている |
| 5 | SEO・OGP・Lighthouse チェック | §6 の基準を満たす |

## 9. 運用

- 更新：ファイルを編集して `main` に push → Actions が自動でデプロイ
- 大きな変更はブランチを切って PR で確認する
