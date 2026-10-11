// CMP-U03 Analytics / DD-10（VOL-09）
// アクセス解析を入れるかは未決（OPEN-06）。入れるときは load が設定を返すようにする。
import type { Analytics, AnalyticsTag } from "../contracts";

export function createAnalytics(load: () => Promise<AnalyticsTag | null>): Analytics {
  return {
    getAnalyticsTag: load,
  };
}

/** アクセス解析を使わないときの設定 */
export const noAnalytics = async (): Promise<AnalyticsTag | null> => null;
