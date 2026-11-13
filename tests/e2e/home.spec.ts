import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("shows the hero, experience, projects and contact without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Muhammad Shehryar Tariq");
    await expect(page.locator(".hero-now")).toContainText("Full Stack Developer at VisionTech");
    await expect(page.locator(".timeline .role")).toHaveCount(7);
    await expect(page.locator(".timeline .role").first()).toContainText("VisionTech");
    await expect(page.locator(".timeline")).toContainText("LC Management");
    await expect(page.locator("[data-testid^=status-]")).toHaveCount(7);
    await expect(page.getByRole("link", { name: "shahryartariq57@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:shahryartariq57@gmail.com",
    );
    expect(errors).toEqual([]);
  });

  test("work map: picking a project shows what it's built with", async ({ page }) => {
    await page.goto("/");
    const map = page.locator("#map");
    await expect(map.locator("canvas")).toBeVisible();
    await expect(map.locator(".constellation-keys button")).toHaveCount(9);
    await map.getByRole("button", { name: "Authforge", exact: true }).click();
    await expect(map.locator(".constellation-caption")).toContainText(
      "Authforge is built with Next.js, Better Auth, PostgreSQL, Playwright. Areas: Security, Full-stack.",
    );
    await expect(map.getByRole("link", { name: "Open Authforge" })).toHaveAttribute("href", "https://getauthforge.vercel.app");
    await map.getByRole("button", { name: "Authforge", exact: true }).click();
    await expect(map.locator(".constellation-caption")).toContainText("Drag to turn it");
  });

  test("terminal opens from the header and runs commands", async ({ page, isMobile }) => {
    await page.goto("/");
    const term = page.locator("dialog.terminal");
    if (isMobile) await page.getByRole("button", { name: "Open the terminal" }).click();
    else await page.keyboard.press("`");
    await expect(term).toBeVisible();
    const input = term.getByRole("textbox", { name: "Command" });
    await expect(input).toBeFocused();
    await input.fill("whoami");
    await input.press("Enter");
    await expect(term.getByRole("log")).toContainText("Muhammad Shehryar Tariq");
    await expect(term.getByRole("log")).toContainText("Now: Full Stack Developer at VisionTech");
    await input.fill("cat projects/sat");
    await input.press("Tab");
    await expect(input).toHaveValue("cat projects/satscope.md");
    await input.press("Enter");
    await expect(term.getByRole("log")).toContainText("live   https://satscope.vercel.app");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("cat projects/satscope.md");
    await input.fill("theme light");
    await input.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await input.fill("goto projects");
    await input.press("Enter");
    await expect(term).not.toBeVisible();
    await expect(page).toHaveURL(/#projects$/);
  });

  test("the ` key doesn't open the terminal while typing in a field", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard shortcut");
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").pressSequentially("a`b");
    await expect(page.locator("dialog.terminal")).not.toBeVisible();
  });

  test("has no internal links to client systems", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs.some((h) => h?.includes("srbtest") || h?.includes("ameeqcode.com"))).toBe(false);
  });

  test("the hero name doesn't shift the layout when the canvas takes over", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hash-name")).toHaveAttribute("data-ready", "true");
    const shift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[])
              if (!e.hadRecentInput) total += e.value;
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(shift).toBeLessThan(0.01);
  });

  test("the 3D object follows the area in view", async ({ page }) => {
    await page.goto("/");
    const stage = page.locator(".stage3d");
    await expect(stage).toHaveAttribute("data-shape", "core");
    for (const id of ["fullstack", "ai", "blockchain", "security"]) {
      await page.evaluate((id) => {
        const el = document.getElementById(id)!;
        const line = window.innerWidth <= 860 ? 0.64 : 0.5;
        window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * line + 40);
      }, id);
      await expect(stage).toHaveAttribute("data-shape", id);
      await expect(page.locator(`.stage-dots a[data-area=${id}]`)).toHaveAttribute("aria-current", "step");
    }
  });

  test("the 3D object reacts to hover, drag and click", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse interaction");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator(".stage3d")).toHaveAttribute("data-ready", "true", { timeout: 10_000 });
    await expect(page.locator(".stage3d-hint")).toContainText("Drag to spin it");
    const box = (await page.locator(".stage3d-canvas").boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 120, cy + 20, { steps: 6 });
    await expect(page.locator(".stage3d-canvas")).toHaveAttribute("data-dragging", "true");
    await page.mouse.up();
    await expect(page.locator(".stage3d-canvas")).not.toHaveAttribute("data-dragging", /.*/);
    await page.mouse.click(cx, cy);
    await page.mouse.move(box.x - 20, cy);
    expect(errors).toEqual([]);
  });

  test("GitHub skyline shows the stats, a 3D city and an STL download", async ({ page, isMobile }) => {
    await page.goto("/");
    const section = page.locator("#skyline");
    await expect(section.getByRole("heading", { name: "A year on GitHub, in 3D" })).toBeVisible();
    await expect(section.locator(".skyline-stats")).toContainText("1,323");
    await expect(section.locator(".skyline-stats")).toContainText("91 on Nov 5, 2026");
    await expect(section.locator(".heatmap path")).toHaveCount(5);
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator(".skyline")).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
    const download = page.waitForEvent("download");
    await section.getByRole("button", { name: /Download for 3D printing/ }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("Shahryartariq-github-skyline-2026.stl");
    if (!isMobile) {
      // Hover across the city until a building answers with its day.
      const box = (await section.locator(".skyline-canvas").boundingBox())!;
      await expect(async () => {
        for (const fx of [0.9, 0.85, 0.8, 0.7, 0.6, 0.5]) {
          await page.mouse.move(box.x + box.width * fx, box.y + box.height * 0.55, { steps: 3 });
          await page.waitForTimeout(150);
          if (await section.locator(".skyline-tip").count()) break;
        }
        await expect(section.locator(".skyline-tip")).toContainText(/contribution/);
      }).toPass({ timeout: 15_000 });
    }
  });

  test("projects are tagged by area", async ({ page }) => {
    await page.goto("/");
    const satscope = page.locator("article", { has: page.getByRole("heading", { name: "Satscope" }) });
    await expect(satscope.locator(".areas li")).toHaveText(["Blockchain", "Security", "Full-stack"]);
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
      await page.getByRole("button", { name: "Satscope", exact: true }).click();
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
  await expect(page.getByRole("heading", { name: /This page doesn.t exist/ })).toBeVisible();
  await page.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("serves SEO files and security headers", async ({ request }) => {
  const home = await request.get("/");
  expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  const html = await home.text();
  expect(html).toContain('"@type":"Person"');
  expect(html).toContain('"@type":"ProfilePage"');
  expect(html).toContain('<meta name="robots" content="index, follow"');
  // Every block's details are in the HTML, not just the selected one.
  expect(html).toContain("University of Sargodha");
  expect(html).toContain("LC Management");
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("# Muhammad Shehryar Tariq");
  expect(llms).toContain("VisionTech, Full Stack Developer (Feb 2026 to now)");
  expect((await request.get("/manifest.webmanifest")).ok()).toBe(true);
  expect((await request.get("/apple-icon")).headers()["content-type"]).toBe("image/png");
  expect((await request.get("/twitter-image")).headers()["content-type"]).toBe("image/png");
  expect(html).toContain('<link rel="canonical" href="https://shehryartariq.vercel.app"');
  expect((await request.get("/robots.txt")).ok()).toBe(true);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("https://shehryartariq.vercel.app/");
  const og = await request.get("/opengraph-image");
  expect(og.headers()["content-type"]).toBe("image/png");
});
