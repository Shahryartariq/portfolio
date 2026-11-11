import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("shows the hero, chain, projects and contact without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Muhammad Shehryar Tariq");
    await expect(page.getByTestId("tip-hash")).toContainText("0000");
    await expect(page.getByRole("tab")).toHaveCount(8);
    await expect(page.getByTestId("pending-block")).toHaveCount(0);
    await expect(page.locator("[data-testid^=status-]")).toHaveCount(7);
    await expect(page.getByRole("link", { name: "shahryartariq57@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:shahryartariq57@gmail.com",
    );
    expect(errors).toEqual([]);
  });

  test("verifies the chain in the browser", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Verify the chain" }).click();
    await expect(page.locator(".verify-result")).toContainText("Valid. Your browser rehashed all 8 blocks");
    await expect(page.locator(".link[data-check=ok]")).toHaveCount(7);
  });

  test("explorer opens on the newest block and switches with clicks and arrow keys", async ({ page }) => {
    await page.goto("/");
    const panel = page.getByRole("tabpanel");
    await expect(page.getByRole("tab", { selected: true })).toContainText("VisionTech");
    await expect(panel).toContainText("Feb 2026 to now");
    await page.getByRole("tab", { name: /Own work/ }).click();
    await expect(panel.getByRole("link", { name: "Satscope" })).toBeVisible();
    await page.getByRole("tab", { name: /AmeeqCode/ }).click();
    await expect(panel).toContainText("LC Management");
    await expect(panel).toContainText("Jun 2023 to Feb 2025");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { selected: true })).toContainText("FAST NUCES");
    await expect(page.getByRole("tab", { selected: true })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(panel).toContainText("University of Sargodha");
  });

  test("mines a visitor's message and builds the email", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/");
    await page.getByRole("button", { name: "Mine and send" }).click();
    await expect(page.locator(".field-error")).toHaveText("Add your name so I know who the block is from.");
    await page.getByLabel("Your name").fill("Ayesha from Acme");
    await page.getByLabel("Message").fill("We'd like to talk about a Rust role.");
    await page.getByRole("button", { name: "Mine and send" }).click();
    const done = page.getByTestId("mined");
    await expect(done).toBeVisible({ timeout: 60_000 });
    await expect(done).toContainText("Block #8 mined");
    const href = await done.getByRole("link", { name: "Send it by email" }).getAttribute("href");
    expect(href).toMatch(/^mailto:shahryartariq57@gmail\.com\?subject=Block%20%238%20from%20Ayesha%20from%20Acme&body=/);
    expect(decodeURIComponent(href!)).toMatch(/hash {3}0000[0-9a-f]{60}/);
    await done.getByRole("button", { name: "Write another" }).click();
    await expect(page.getByRole("button", { name: "Mine and send" })).toBeVisible();
  });

  test("has no internal links to client systems", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs.some((h) => h?.includes("srbtest") || h?.includes("ameeqcode.com"))).toBe(false);
  });

  test("does not scroll sideways", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const scheme of ["dark", "light"] as const) {
    test(`passes axe in ${scheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto("/");
      await page.getByRole("tab", { name: /AmeeqCode/ }).click();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});

test.describe("command palette", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard shortcut is a desktop feature");

  test("opens with Ctrl+K, filters and jumps to a section", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const box = page.getByRole("combobox", { name: "Search sections, projects and links" });
    await expect(box).toBeFocused();
    await box.fill("client work");
    await expect(page.getByRole("option").first()).toContainText("Client work");
    await expect(page.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(page.locator("dialog.palette")).not.toBeVisible();
    await expect(page).toHaveURL(/#clients$/);
  });

  test("opens from the header button and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Jump to/ }).click();
    await expect(page.locator("dialog.palette")).toBeVisible();
    await page.getByRole("combobox").fill("zzzz");
    await expect(page.getByText("Nothing matches")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog.palette")).not.toBeVisible();
  });

  test("switches theme", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").fill("light theme");
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});

test("theme button cycles light, dark, device", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByRole("button", { name: /Change theme/ });
  await btn.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await btn.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await btn.click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
});

test("unknown pages show the 404 with a way home", async ({ page }) => {
  const res = await page.goto("/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "No block at this address" })).toBeVisible();
  await page.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("serves SEO files and security headers", async ({ request }) => {
  const home = await request.get("/");
  expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  const html = await home.text();
  expect(html).toContain('"@type":"Person"');
  expect(html).toContain('<link rel="canonical" href="https://shehryartariq.vercel.app"');
  expect((await request.get("/robots.txt")).ok()).toBe(true);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("https://shehryartariq.vercel.app/");
  const og = await request.get("/opengraph-image");
  expect(og.headers()["content-type"]).toBe("image/png");
});
