// TC-U06 ChannelAccess（DD-07）
import { describe, expect, it } from "vitest";
import { createChannelAccess, InvalidChannelConfigError } from "../../src/system/resource-access/channel-access";
import { channelSchema } from "../../src/system/resource-access/channel-access/schema";

const raw = [
  { id: "github", label: "GitHub", url: "https://github.com/example", icon: "github", order: 30 },
  { id: "note", label: "note", url: "https://note.com/example", icon: "note", order: 10 },
];

describe("TC-U06 ChannelAccess", () => {
  const access = createChannelAccess(async () => raw.map((c) => channelSchema.parse(c)));

  it("order の順に返す", async () => {
    expect((await access.listChannels()).map((c) => c.id)).toEqual(["note", "github"]);
  });

  it("findChannel：あれば返し、なければ undefined", async () => {
    expect((await access.findChannel("note"))?.url).toBe("https://note.com/example");
    expect(await access.findChannel("x")).toBeUndefined();
  });

  it("id の重複は InvalidChannelConfigError", async () => {
    const dup = createChannelAccess(async () => [raw[0], raw[0]].map((c) => channelSchema.parse(c)));
    await expect(dup.listChannels()).rejects.toBeInstanceOf(InvalidChannelConfigError);
  });

  it("https 以外の URL はスキーマで失敗する", () => {
    expect(() => channelSchema.parse({ ...raw[0], url: "http://github.com" })).toThrow();
  });
});
