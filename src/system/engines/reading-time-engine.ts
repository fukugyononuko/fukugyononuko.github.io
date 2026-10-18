// CMP-E04 ReadingTimeEngine / DD-17（VOL-12、FR-18）
// 本文の文字数を、人の平均の黙読の速さで割って分にする（#41）。出典と条件は DD-17。
import type { ReadingTimeEngine } from "../contracts";

/** 日本語（漢字・ひらがな・カタカナ）の字/分。小林・川嶋 (2018) 映像情報メディア学会誌 72(10) J154 の大学生 200 人の平均 */
const JAPANESE_CHARS_PER_MINUTE = 653;
/** それ以外の文字（英字・数字など）の字/分。Brysbaert (2019) JML 109 の英語ノンフィクションの黙読 238 語/分 × 平均語長 4.6 文字 */
const OTHER_CHARS_PER_MINUTE = 238 * 4.6;

const NOT_COUNTED = /[\p{White_Space}\p{P}\p{S}]/u;
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u;

export function createReadingTimeEngine(): ReadingTimeEngine {
  return {
    estimateMinutes(text: string): number {
      let japanese = 0;
      let other = 0;
      // for...of はサロゲートペアを 1 文字として取り出す
      for (const ch of text) {
        if (NOT_COUNTED.test(ch)) continue;
        if (JAPANESE.test(ch)) japanese++;
        else other++;
      }
      const minutes = japanese / JAPANESE_CHARS_PER_MINUTE + other / OTHER_CHARS_PER_MINUTE;
      return Math.max(1, Math.ceil(minutes));
    },
  };
}
