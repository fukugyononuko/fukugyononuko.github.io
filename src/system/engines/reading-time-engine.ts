// CMP-E04 ReadingTimeEngine / DD-17（VOL-12、FR-18）
// 本文の文字数を、人の平均の読む速さで割って分にする。
// 速さは Trauzettel-Klosinski & Dietz (2012), IOVS 53(9) 5452–5461 の表 2 の平均（音読、空白と句読点を除いた文字数）。
import type { ReadingTimeEngine } from "../contracts";

/** 日本語（漢字・ひらがな・カタカナ）の字/分 */
const JAPANESE_CHARS_PER_MINUTE = 357;
/** それ以外の文字（英字・数字など）の字/分（英語の値） */
const OTHER_CHARS_PER_MINUTE = 987;

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
