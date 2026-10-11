// CMP-A02 InquiryAccess の内部：Astro の Content Collections から読む（RES-02）
import { getEntry } from "astro:content";
import type { InquiryData } from "./schema";

export async function loadInquiryFromAstro(): Promise<InquiryData> {
  const entry = await getEntry("inquiry", "main");
  if (!entry) throw new Error("src/content/settings/inquiry.yaml がありません");
  return entry.data;
}
