// TC-U06 ChannelAccess（DD-07）
import { describe, expect, it } from "vitest";
import { createChannelAccess, InvalidChannelConfigError } from "../../src/system/resource-access/channel-access";
import { channelSchema, shareTargetSchema } from "../../src/system/resource-access/channel-access/schema";

const raw = [
  { id: "github", label: "GitHub", url: "https://github.com/example", icon: "github", order: 30 },
  { id: "note", label: "note", url: "https://note.com/example", icon: "note", order: 10 },
];

const rawTargets = [
  { id: "hatena", label: "はてなブックマーク", icon: "hatena", url: "https://b.example.jp/add?url={url}&title={title}", order: 30 },
  { id: "x", label: "X", icon: "x", url: "https://x.example.com/intent?text={title}&url={url}", order: 10 },
];

function access(channels = raw, targets = rawTargets) {
  return createChannelAccess({
    channels: async () => channels.map((c) => channelSchema.parse(c)),
    shareTargets: async () => targets.map((t) => shareTargetSchema.parse(t)),
  });
}

describe("TC-U06 ChannelAccess", () => {
  it("order の順に返す", async () => {
    expect((await access().listChannels()).map((c) => c.id)).toEqual(["note", "github"]);
  });

  it("findChannel：あれば返し、なければ undefined", async () => {
    expect((await access().findChannel("note"))?.url).toBe("https://note.com/example");
    expect(await access().findChannel("x")).toBeUndefined();
  });

  it("id の重複は InvalidChannelConfigError", async () => {
    await expect(access([raw[0], raw[0]]).listChannels()).rejects.toBeInstanceOf(InvalidChannelConfigError);
  });

  it("https 以外の URL はスキーマで失敗する", () => {
    expect(() => channelSchema.parse({ ...raw[0], url: "http://github.com" })).toThrow();
  });
});

describe("TC-U06 ChannelAccess.listShareLinks（共有先）", () => {
  const page = { url: "https://example.github.io/news/a-b/?q=1#top", title: "A&B #1 ニュース" };

  it("order の順に、{url} と {title} をエンコードして置き換える", async () => {
    const links = await access().listShareLinks(page);
    expect(links.map((l) => l.id)).toEqual(["x", "hatena"]);
    expect(links[0]).toEqual({
      id: "x",
      label: "X",
      icon: "x",
      url: `https://x.example.com/intent?text=${encodeURIComponent(page.title)}&url=${encodeURIComponent(page.url)}`,
    });
    // 置き換えたあとの URL を読み戻すと、元の値に戻る（& や # で URL が切れていない）
    const params = new URL(links[1].url).searchParams;
    expect(params.get("url")).toBe(page.url);
    expect(params.get("title")).toBe(page.title);
  });

  it("共有先の id の重複は InvalidChannelConfigError", async () => {
    await expect(access(raw, [rawTargets[0], rawTargets[0]]).listShareLinks(page)).rejects.toBeInstanceOf(InvalidChannelConfigError);
  });

  it("https 以外や、{url} のない形はスキーマで失敗する", () => {
    expect(() => shareTargetSchema.parse({ ...rawTargets[0], url: "http://b.example.jp/add?url={url}" })).toThrow();
    expect(() => shareTargetSchema.parse({ ...rawTargets[0], url: "https://b.example.jp/add?title={title}" })).toThrow();
  });
});
