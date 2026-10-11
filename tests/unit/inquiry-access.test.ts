// TC-U05 InquiryAccess（DD-06）
import { describe, expect, it } from "vitest";
import { createInquiryAccess } from "../../src/system/resource-access/inquiry-access";
import { inquirySchema } from "../../src/system/resource-access/inquiry-access/schema";

const fields = [
  { name: "replyTo", label: "返信先", required: true },
  { name: "message", label: "内容", required: true },
];

describe("TC-U05 InquiryAccess", () => {
  it.each([
    ["form-post", { kind: "form-post", action: "https://forms.example.com/f/1", fields, honeypotField: "_gotcha" }],
    ["embed", { kind: "embed", src: "https://forms.example.com/e/1", fallbackUrl: "https://forms.example.com/1" }],
    ["link", { kind: "link", url: "https://x.com/example", label: "DM で問い合わせる" }],
  ])("%s の設定を読める", async (_, raw) => {
    const access = createInquiryAccess(async () => inquirySchema.parse(raw));
    expect(await access.getInquiryChannel()).toEqual(raw);
  });

  it.each([
    ["https 以外の送信先", { kind: "form-post", action: "http://forms.example.com", fields }],
    ["必須の replyTo がない", { kind: "form-post", action: "https://forms.example.com", fields: [fields[1]] }],
    ["message が必須でない", { kind: "form-post", action: "https://forms.example.com", fields: [fields[0], { ...fields[1], required: false }] }],
    ["embed の src が https でない", { kind: "embed", src: "http://a", fallbackUrl: "https://a" }],
    ["link のラベルがない", { kind: "link", url: "https://a" }],
    ["種類が想定外", { kind: "mail", to: "a@example.com" }],
  ])("不正な設定（%s）は失敗する", (_, raw) => {
    expect(() => inquirySchema.parse(raw)).toThrow();
  });
});
