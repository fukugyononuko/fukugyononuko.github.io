// フェーズ 5 の非機能テスト：TC-N02（axe）、TC-N11（CSP）
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/", "/about/", "/services/", "/services/homepage-mock/", "/contact/", "/no-such-page/"];

test.describe("TC-N02：axe で重大な違反がない", () => {
  for (const path of pages) {
    for (const scheme of ["light", "dark"] as const) {
      test(`${path}（${scheme}）`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});

test.describe("TC-N11：CSP", () => {
  for (const path of pages) {
    test(`${path}：CSP の meta があり、違反が起きない`, async ({ page }) => {
      await page.addInitScript(() => {
        (window as unknown as { __cspViolations: string[] }).__cspViolations = [];
        document.addEventListener("securitypolicyviolation", (e) => {
          (window as unknown as { __cspViolations: string[] }).__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`);
        });
      });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const csp = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute("content");
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      const violations = await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations);
      expect(violations).toEqual([]);
    });
  }

  test("外部への送信を許可するのは問い合わせページだけ", async ({ page }) => {
    const formAction = async (path: string) => {
      await page.goto(path);
      const csp = (await page.locator('meta[http-equiv="content-security-policy"]').getAttribute("content")) ?? "";
      return csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("form-action"));
    };
    expect(await formAction("/")).toBe("form-action 'self'");
    expect(await formAction("/contact/")).toMatch(/^form-action 'self' https:\/\//);
  });

  test("CSP が実際に効いている：外部のスクリプトは読み込まれない", async ({ page }) => {
    await page.goto("/");
    const blocked = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          document.addEventListener("securitypolicyviolation", () => resolve(true), { once: true });
          const s = document.createElement("script");
          s.src = "https://example.com/x.js";
          document.head.append(s);
          setTimeout(() => resolve(false), 2000);
        }),
    );
    expect(blocked).toBe(true);
  });
});
