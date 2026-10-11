// CMP-E02 CurationEngine / DD-04（VOL-04、FR-09）
import type { Curatable, CurationEngine, CurationRule } from "../contracts";

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
  };
}
