// CMP-A02 InquiryAccess / DD-06（VOL-01、FR-08）
// 問い合わせ手段の種類と接続先を隠す。手段を変えるときは RES-02（inquiry.yaml）とこのディレクトリだけを変える。
import type { InquiryAccess, InquiryChannel } from "../../contracts";
import type { InquiryData } from "./schema";

export function createInquiryAccess(load: () => Promise<InquiryData>): InquiryAccess {
  return {
    async getInquiryChannel(): Promise<InquiryChannel> {
      return load();
    },
  };
}
