// TC-U03 CtaEngine（DD-05）
import { describe, expect, it } from "vitest";
import { createCtaEngine, UnknownChannelError } from "../../src/system/engines/cta-engine";
import { createSiteConfig } from "../../src/system/utilities/config";
import { config, fakeChannels, note, service } from "../support/fakes";

const engine = createCtaEngine(fakeChannels([note]), config);

describe("TC-U03 CtaEngine", () => {
  it("inquiry：問い合わせページへのリンク（サービスを指定）", async () => {
    expect(await engine.decideForService(service({ slug: "web-site" }))).toEqual({
      route: "inquiry",
      href: "/contact/?service=web-site",
      label: "このサービスについて問い合わせる",
    });
  });

  it("inquiry：ベースパスを付ける", async () => {
    const based = createCtaEngine(fakeChannels([]), createSiteConfig({ SITE: "https://example.com", BASE_URL: "/home" }));
    expect((await based.decideForService(service({ slug: "a" }))).href).toBe("/home/contact/?service=a");
  });

  it("channel：チャネルの URL とラベル", async () => {
    const result = await engine.decideForService(service({ slug: "tpl", cta: { route: "channel", channelId: "note" } }));
    expect(result).toEqual({ route: "external", href: "https://note.com/example", label: "noteで見る", channelId: "note" });
  });

  it("channel：ラベルを上書きできる", async () => {
    const result = await engine.decideForService(
      service({ slug: "tpl", cta: { route: "channel", channelId: "note", label: "note で購入する" } }),
    );
    expect(result.label).toBe("note で購入する");
  });

  it("存在しないチャネルは UnknownChannelError", async () => {
    await expect(
      engine.decideForService(service({ slug: "tpl", cta: { route: "channel", channelId: "nope" } })),
    ).rejects.toBeInstanceOf(UnknownChannelError);
  });
});
