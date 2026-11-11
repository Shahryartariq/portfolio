import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("shows the hero, chain, projects and contact without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Muhammad Shehryar Tariq");
    await expect(page.locator(".hero-now")).toContainText("Full Stack Developer at VisionTech");
    await expect(page.getByRole("tab")).toHaveCount(8);
    await expect(page.getByTestId("pending-block")).toHaveCount(0);
    await expect(page.locator("[data-testid^=status-]")).toHaveCount(7);
    await expect(page.getByRole("link", { name: "shahryartariq57@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:shahryartariq57@gmail.com",
    );
    expect(errors).toEqual([]);
  });

  test("verifies the experience timeline in the browser", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Check it in your browser" }).click();
    await expect(page.locator(".verify-result")).toContainText("Intact. Your browser rehashed all 8 steps");
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
    await page.getByRole("button", { name: "Do the work and send" }).click();
    await expect(page.locator(".field-error")).toHaveText("Add your name so I know who the block is from.");
    await page.getByLabel("Your name").fill("Ayesha from Acme");
    await page.getByLabel("Message").fill("We'd like to talk about a Rust role.");
    await page.getByRole("button", { name: "Do the work and send" }).click();
    const done = page.getByTestId("mined");
    await expect(done).toBeVisible({ timeout: 60_000 });
    await expect(done).toContainText("Proof of work done");
    await expect(done).toContainText("step #8");
    const href = await done.getByRole("link", { name: "Send it by email" }).getAttribute("href");
    expect(href).toMatch(/^mailto:shahryartariq57@gmail\.com\?subject=Message%20from%20Ayesha%20from%20Acme&body=/);
    expect(decodeURIComponent(href!)).toMatch(/hash {3}0000[0-9a-f]{60}/);
    await done.getByRole("button", { name: "Write another" }).click();
    await expect(page.getByRole("button", { name: "Do the work and send" })).toBeVisible();
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
