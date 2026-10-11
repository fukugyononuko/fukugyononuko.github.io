// TC-I02 EngagementManager（DD-09、CC-04、CC-05）
import { describe, expect, it } from "vitest";
import { createEngagementManager } from "../../src/system/managers/engagement-manager";
import { createCtaEngine } from "../../src/system/engines/cta-engine";
import { createSeo } from "../../src/system/utilities/seo";
import { createNoArticleAccess } from "../../src/system/resource-access/article-access";
import type { InquiryChannel } from "../../src/system/contracts";
import { config, fakeChannels, fakeContent, fakeInquiry, github, note, service } from "../support/fakes";

function manager(channel: InquiryChannel) {
  const channels = fakeChannels([github, note]);
  return createEngagementManager({
    inquiry: fakeInquiry(channel),
    channels,
    content: fakeContent({
      services: [
        service({ slug: "web", title: "ウェブ" }),
        service({ slug: "tpl", title: "テンプレート", cta: { route: "channel", channelId: "note" } }),
      ],
    }),
    articles: createNoArticleAccess(),
    cta: createCtaEngine(channels, config),
    seo: createSeo(config),
  });
}

const link: InquiryChannel = { kind: "link", url: "https://x.com/example", label: "DM" };

describe("TC-I02 EngagementManager", () => {
  it("getChannelLinks：order の順（CC-05）", async () => {
    expect((await manager(link).getChannelLinks()).map((c) => c.label)).toEqual(["note", "GitHub"]);
  });

  it("getContactView：選択肢は導線が問い合わせのサービスだけ（CC-04）", async () => {
    const view = await manager(link).getContactView();
    expect(view.serviceOptions).toEqual([{ slug: "web", title: "ウェブ" }]);
    expect(view.channel).toEqual(link);
  });

  it("getContactView：CSP に足すオリジンを問い合わせ手段から決める（DD-16）", async () => {
    const post = await manager({ kind: "form-post", action: "https://forms.example.com/f/1", fields: [] }).getContactView();
    expect(post.cspSources).toEqual({ formAction: ["https://forms.example.com"], frameSrc: [] });
    const embed = await manager({ kind: "embed", src: "https://docs.example.com/form", fallbackUrl: "https://docs.example.com" }).getContactView();
    expect(embed.cspSources).toEqual({ formAction: [], frameSrc: ["https://docs.example.com"] });
    expect((await manager(link).getContactView()).cspSources).toEqual({ formAction: [], frameSrc: [] });
  });

  it("getArticleFeedView：記事の出所がまだないときは空（FR-11：将来）", async () => {
    expect(await manager(link).getArticleFeedView(5)).toEqual({ articles: [] });
  });
});
