// CMP-E02 CurationEngine / DD-04（VOL-04、FR-09、FR-16）
import type { Curatable, CurationEngine, CurationRule, Taggable } from "../contracts";

export function createCurationEngine(): CurationEngine {
  function arrange<T extends Curatable>(items: T[], rule: CurationRule): T[] {
    const byOrder = (a: T, b: T) => a.order - b.order || a.id.localeCompare(b.id);
    if (rule.sort === "order") return [...items].sort(byOrder);
    return [...items].sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date) || byOrder(a, b);
      if (a.date) return -1;
      if (b.date) return 1;
      return byOrder(a, b);
    });
  }

  return {
    arrange,
    pickFeatured<T extends Curatable>(items: T[], rule: CurationRule): T[] {
      return arrange(items.filter((item) => item.featured), rule).slice(0, rule.featuredLimit);
    },

    pickRelated<T extends Taggable>(items: T[], base: Taggable, limit: number): T[] {
      const baseTags = new Set(base.tags);
      const scored = items
        .filter((item) => item.id !== base.id)
        .map((item) => ({ item, shared: new Set(item.tags.filter((t) => baseTags.has(t))).size }));
      const newestFirst = (a: T, b: T) => {
        if (a.date && b.date) return b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
        if (a.date) return -1;
        if (b.date) return 1;
        return a.id.localeCompare(b.id);
      };
      // 共通するタグが多い順。足りない分は、共通するタグがない項目の新しい順で補う
      return scored
        .sort((a, b) => b.shared - a.shared || newestFirst(a.item, b.item))
        .slice(0, limit)
        .map(({ item }) => item);
    },
  };
}
