# fukugyononuko.github.io

副業のぬこのホームページ：https://fukugyononuko.github.io/

- 設計ドキュメント：[docs/](docs/README.md)
- 技術：Astro（静的出力）／GitHub Pages／GitHub Actions

## 開発

```sh
nvm use            # Node.js 24
npm ci
npm run dev        # http://localhost:4321
```

| コマンド | 内容 |
| --- | --- |
| `npm run build` | `dist/` にビルド（コンテンツのスキーマ検証を含む） |
| `npm run lint` | 型検査（`astro check`） |
| `npm run depcruise` | 構成要素の依存規則の検査（DD-12） |
| `npm test` | 単体・結合・アーキテクチャのテスト |
| `npm run test:e2e` | 総合テスト（先に `npm run build` が必要） |

`main` に push すると、GitHub Actions が検査とビルドを行い、成功したときだけ公開します。
