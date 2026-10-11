// CMP-A04 ArticleAccess / DD-08（VOL-06、FR-11：将来）
// 今は記事の出所がない状態（VOL-06 の最初の状態）。note の RSS などを使うときは、ここに実装を足して compose.ts で切り替える。
import type { ArticleAccess } from "../../contracts";

export function createNoArticleAccess(): ArticleAccess {
  return {
    async listRecentArticles() {
      return [];
    },
  };
}
