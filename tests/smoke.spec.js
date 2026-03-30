const { test, expect } = require("@playwright/test");

async function gotoHome(page) {
  await page.goto("/");
  await expect(page.locator("body")).toContainText("Komfi Kat");
}

async function openCarouselCtaButton(page, buttonClass) {
  const shell = page.locator("[data-promo-carousel]");
  const nextButton = page.locator("[data-promo-carousel-next]");

  await shell.scrollIntoViewIfNeeded();

  for (let step = 0; step < 10; step += 1) {
    const ctaButtons = shell.locator(`.promo-carousel__card--cta ${buttonClass}`);
    const buttonCount = await ctaButtons.count();

    for (let index = 0; index < buttonCount; index += 1) {
      const candidate = ctaButtons.nth(index);

      if (await candidate.isVisible()) {
        return candidate;
      }
    }

    await nextButton.click({ force: true });
    await page.waitForTimeout(150);
  }

  throw new Error(`CTA slide with ${buttonClass} did not become visible`);
}

test("hashtag feedback stays inside the pill and can be reverted", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Hashtag pills are desktop-only in the current layout");

  await gotoHome(page);

  const hashtagItem = page.locator(".social-links__hashtag-item").first();
  const hashtagButton = hashtagItem.locator(".social-links__hashtag");

  await hashtagButton.scrollIntoViewIfNeeded();
  await expect(hashtagButton).toBeVisible();
  await hashtagButton.click();
  await expect(hashtagItem).toHaveAttribute("data-feedback-visible", "true");
  await expect(hashtagItem.locator(".social-links__hashtag-feedback-label")).toHaveText("Tag copied!");
  await expect(hashtagItem.locator(".social-links__hashtag-feedback-link")).toHaveCount(3);

  await hashtagItem.locator(".social-links__hashtag-feedback-label").click();
  await expect(hashtagItem).not.toHaveAttribute("data-feedback-visible", "true");
  await expect(hashtagItem.locator(".social-links__hashtag-label")).toHaveText("#komfikatcoloring");
});

test("hashtag copied feedback auto-closes after 10 seconds", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Hashtag pills are desktop-only in the current layout");

  await gotoHome(page);

  const hashtagItem = page.locator(".social-links__hashtag-item").first();
  const hashtagButton = hashtagItem.locator(".social-links__hashtag");

  await hashtagButton.scrollIntoViewIfNeeded();
  await expect(hashtagButton).toBeVisible();
  await hashtagButton.click();
  await expect(hashtagItem).toHaveAttribute("data-feedback-visible", "true");

  await page.waitForTimeout(10200);
  await expect(hashtagItem).not.toHaveAttribute("data-feedback-visible", "true");
});

test("stories open and close from the avatar trigger", async ({ page }) => {
  await gotoHome(page);

  const storyViewer = page.locator("[data-story-viewer]");

  await page.locator("[data-story-open]").click();
  await expect(storyViewer).toHaveAttribute("open", "");
  await expect(page.locator("[data-story-title]")).toBeVisible();

  await page.locator("[data-story-close]").click();
  await expect(storyViewer).not.toHaveAttribute("open", "");
});

test("footer back-to-top control returns the page to the start", async ({ page }) => {
  await gotoHome(page);

  const footerButton = page.locator("[data-scroll-top]");
  await footerButton.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.scrollY > 0);
  await footerButton.click();

  await page.waitForFunction(() => window.scrollY < 24);
});

test("external buttons use local promo redirect overlays", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "CTA promo redirect is covered on desktop in the current smoke set");

  await gotoHome(page);

  const amazonCard = page.locator(".link-section .link-card--amazon");
  await amazonCard.scrollIntoViewIfNeeded();
  await amazonCard.click();

  const activeLinkOverlay = page.locator(
    ".promo-redirect-local-wrap--link-card[data-promo-redirect-active=\"true\"] .promo-redirect-local-overlay",
  );

  await expect(activeLinkOverlay).toBeVisible();
  await expect(activeLinkOverlay.locator(".promo-redirect-toast__text")).toContainText("Redirecting to Amazon in");
  await expect(activeLinkOverlay.locator(".promo-redirect-toast__eyebrow")).toHaveCount(0);

  await activeLinkOverlay.locator(".promo-redirect-toast__action--cancel").click();
  await expect(activeLinkOverlay).not.toBeVisible();

  const amazonButton = await openCarouselCtaButton(page, ".promo-carousel__shop-button--amazon");
  await amazonButton.evaluate((element) => {
    element.click();
  });

  const activeAmazonOverlay = page.locator(
    ".promo-carousel__shop-button-wrap[data-promo-redirect-active=\"true\"] .promo-carousel__shop-button-redirect",
  );

  await expect(activeAmazonOverlay).toBeVisible();
  await expect(activeAmazonOverlay.locator(".promo-redirect-toast__text")).toContainText("Redirecting to Amazon in");
  await expect(activeAmazonOverlay.locator(".promo-redirect-toast__eyebrow")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(activeAmazonOverlay).not.toBeVisible();

  const etsyButton = await openCarouselCtaButton(page, ".promo-carousel__shop-button--etsy");
  await etsyButton.evaluate((element) => {
    element.click();
  });

  const activeEtsyOverlay = page.locator(
    ".promo-carousel__shop-button-wrap[data-promo-redirect-active=\"true\"] .promo-carousel__shop-button-redirect",
  );

  await expect(activeEtsyOverlay).toBeVisible();
  await expect(activeEtsyOverlay.locator(".promo-redirect-toast__eyebrow")).toContainText("SAVE 10% WITH CODE");
  await expect(activeEtsyOverlay.locator(".promo-redirect-toast__code")).toContainText("COZY10");
  await expect(activeEtsyOverlay.locator(".promo-redirect-toast__text")).toContainText("Redirecting to Etsy in");

  await page.keyboard.press("Escape");
  await expect(activeEtsyOverlay).not.toBeVisible();
});

test("mobile carousel starts on the first image while CTA remains one slide before", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only carousel ordering");

  await gotoHome(page);

  const shell = page.locator("[data-promo-carousel]");
  const prevButton = page.locator("[data-promo-carousel-prev]");
  const dots = page.locator(".promo-carousel__dot");

  await shell.scrollIntoViewIfNeeded();
  await expect(shell).toHaveAttribute("data-active-slide-type", "image");
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");

  await prevButton.click({ force: true });
  await expect(shell).toHaveAttribute("data-active-slide-type", "cta");
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
});

test("desktop no longer shows legacy home and stories hover tooltips", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop-only hover behavior");

  await gotoHome(page);

  await expect(page.locator(".profile__story-desktop-hint")).toHaveCount(0);

  const topBarTooltip = page.locator("[data-top-bar-tooltip]");

  await page.locator("[data-copy-profile-title]").hover();
  await page.waitForTimeout(180);
  await expect(topBarTooltip).not.toContainText("Click to visit home page");

  await page.locator("[data-story-open]").hover();
  await page.waitForTimeout(180);
  await expect(topBarTooltip).not.toContainText("Click to see new Komfi Kat stories!");
});
