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
    await expect(page.locator(".field-error")).toHaveText("Add your name so I know who the message is from.");
    await expect(page.getByLabel("Your name")).toBeFocused();
    await page.getByLabel("Your name").fill("Ayesha from Acme");
    await page.getByLabel("Message").fill("We'd like to talk about a Rust role.");
    // A broken reply address is caught before any work is done.
    await page.getByLabel(/Your email/).fill("not-an-email");
    await page.getByRole("button", { name: "Do the work and send" }).click();
    await expect(page.locator(".field-error")).toContainText("doesn\u2019t look right");
    await expect(page.getByLabel(/Your email/)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("mined")).toHaveCount(0);
    await page.getByLabel(/Your email/).fill("ayesha@acme.example");
    await page.getByRole("button", { name: "Do the work and send" }).click();
    const done = page.getByTestId("mined");
    await expect(done).toBeVisible({ timeout: 60_000 });
    await expect(done).toContainText("Proof of work done");
    await expect(done).toContainText("step #8");
    const href = await done.getByRole("link", { name: "Send it by email" }).getAttribute("href");
    expect(href).toMatch(/^mailto:shahryartariq57@gmail\.com\?subject=Message%20from%20Ayesha%20from%20Acme&body=/);
    expect(decodeURIComponent(href!)).toMatch(/hash {3}0000[0-9a-f]{60}/);
    expect(decodeURIComponent(href!)).toContain("reply  ayesha@acme.example");
    // Focus follows the result, and there is a way out for visitors with no mail app.
    await expect(done).toBeFocused();
    await expect(done).toContainText("No email app on this device?");
    await done.getByRole("button", { name: "Copy the message instead" }).click();
    await expect(done.getByRole("button", { name: /Copied|Copy the message instead/ })).toBeVisible();
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

  test("GitHub skyline shows the stats, a 3D city and an STL download", async ({ page, isMobile }) => {
    await page.goto("/");
    const section = page.locator("#skyline");
    await expect(section.getByRole("heading", { name: "A year on GitHub, in 3D" })).toBeVisible();
    await expect(section.locator(".skyline-stats")).toContainText("1,323");
    await expect(section.locator(".skyline-stats")).toContainText("91 on Nov 5, 2026");
    await expect(section.locator(".heatmap path")).toHaveCount(5);
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator(".skyline")).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
    // The city can be turned from the keyboard.
    const city = section.getByRole("group", { name: /3D city of my GitHub year/ });
    await city.focus();
    await expect(city).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await expect(section.locator(".skyline-bar")).toContainText("arrow keys");
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
    // Focus moves with the jump, so the next Tab continues from that section.
    await expect(page.locator("#clients")).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest("section")?.id)).toBe("clients");
  });

  test("finds the skyline by what it shows", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").fill("github skyline");
    await expect(page.getByRole("option")).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#skyline$/);
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

test("unknown pages show the 404 with working ways back", async ({ page, isMobile }) => {
  const res = await page.goto("/nope");
  expect(res?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found | Muhammad Shehryar Tariq");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  // Only "noindex": no leftover "index, follow" from the home page, and no canonical.
  const robots = await page.locator('meta[name="robots"]').evaluateAll((m) => m.map((x) => x.getAttribute("content")));
  expect(robots.length).toBeGreaterThan(0);
  expect(robots.every((r) => r?.includes("noindex"))).toBe(true);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  // Header links lead back to the home page's sections, and there is no dead search button.
  const hrefs = await page.locator("header a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual(["/", "/#fullstack", "/#skyline", "/#experience", "/#projects", "/#clients", "/#about", "/#contact"]);
  await expect(page.getByRole("button", { name: /Jump to/ })).toHaveCount(0);
  if (!isMobile) {
    await page.getByRole("link", { name: "Projects", exact: true }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    await expect(page.locator("#projects")).toBeInViewport();
    await page.goto("/nope");
  }
  await page.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Muhammad Shehryar Tariq");
});

test("the header lists the sections in page order", async ({ page, isMobile }) => {
  test.skip(isMobile, "the section links are in the command palette on phones");
  await page.goto("/");
  const nav = await page.locator("nav.nav a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!.slice(1)));
  const onPage = await page.locator("main section[id]").evaluateAll((s) => s.map((x) => x.id));
  expect(onPage.filter((id) => nav.includes(id))).toEqual(nav);
  await page.getByRole("link", { name: "Activity", exact: true }).click();
  await expect(page.locator("#skyline")).toBeInViewport();
});

test("copying the email says so, and falls back when the clipboard is blocked", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy email" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("shahryartariq57@gmail.com");

  await page.reload();
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error("blocked"));
  });
  await page.getByRole("button", { name: "Copy email" }).click();
  await expect(page.getByRole("button", { name: /Address selected/ })).toBeVisible();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe("shahryartariq57@gmail.com");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows all of the experience and no dead controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Muhammad Shehryar Tariq");
    await expect(page.locator(".panel:visible")).toHaveCount(8);
    await expect(page.locator("form.miner")).toBeHidden();
    await expect(page.getByRole("button", { name: "Copy email" })).toBeHidden();
    await expect(page.locator(".search-btn")).toBeHidden();
    await expect(page.getByRole("link", { name: "shahryartariq57@gmail.com" })).toBeVisible();
    await expect(page.locator(".heatmap")).toBeVisible();
  });
});

test("prints with dark text, every job and no interactive leftovers", async ({ page }) => {
  await page.emulateMedia({ media: "print", colorScheme: "dark" });
  await page.goto("/");
  const ink = await page.evaluate(() => getComputedStyle(document.body).color);
  expect(ink).toBe("rgb(10, 26, 47)");
  await expect(page.locator(".panel:visible")).toHaveCount(8);
  await expect(page.locator("header.top")).toBeHidden();
  await expect(page.locator("form.miner")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).color)).toBe("rgb(10, 26, 47)");
});

test("serves SEO files and security headers", async ({ request }) => {
  const home = await request.get("/");
  const csp = home.headers()["content-security-policy"];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("upgrade-insecure-requests");
  expect(csp).toContain("worker-src 'self';");
  // No analytics ID in tests, so no third-party host may appear anywhere in the policy.
  expect(csp).not.toMatch(/https?:\/\//);
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home.headers()["cross-origin-opener-policy"]).toBe("same-origin");
  expect(home.headers()["strict-transport-security"]).toContain("max-age=63072000");
  expect(home.headers()["permissions-policy"]).not.toContain("interest-cohort");
  expect(home.headers()["x-powered-by"]).toBeUndefined();
  const sec = await request.get("/.well-known/security.txt");
  expect(sec.ok()).toBe(true);
  const secText = await sec.text();
  expect(secText).toContain("Contact: mailto:shahryartariq57@gmail.com");
  const expires = new Date(secText.match(/^Expires: (.+)$/m)![1]).getTime();
  expect(expires).toBeGreaterThan(Date.now());
  expect(expires).toBeLessThan(Date.now() + 366 * 86_400_000);
  expect((await request.get("/favicon.ico")).headers()["content-type"]).toMatch(/icon/);
  const html = await home.text();
  expect(html).toContain('"@type":"Person"');
  expect(html).toContain('"@type":"ProfilePage"');
  expect(html).toContain('<meta name="robots" content="index, follow"');
  expect(html).toMatch(/<meta name="description" content="[^"]*AI, blockchain and security[^"]*7 live projects\."/);
  const description = html.match(/<meta name="description" content="([^"]*)"/)![1];
  expect(description.length).toBeLessThanOrEqual(160);
  // Structured data: a stable modified date, and the script can't be closed from inside.
  const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1];
  expect(ld).not.toContain("<");
  const graph = JSON.parse(ld)["@graph"];
  expect(graph[0].dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(graph[1].knowsAbout).toEqual(expect.arrayContaining(["Artificial intelligence", "Blockchain", "Cyber security"]));
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
