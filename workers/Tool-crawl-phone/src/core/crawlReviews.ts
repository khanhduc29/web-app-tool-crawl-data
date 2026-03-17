import { Page } from "playwright";

export interface Review {
  reviewer: string;
  rating: number | null;
  text: string | null;
  date: string | null;
  photos: number;
}

/**
 * Crawl đánh giá (reviews) từ Google Maps place detail
 * Selectors verified 2026-03-17:
 *   - Review wrapper: div.jftiEf
 *   - Name: .d4r55
 *   - Stars: span.kvMYC (aria-label)
 *   - Text: .wiI7pd
 *   - Date: .rsqaWe
 *   - Expand: button.w8Bnu
 */
export async function crawlReviews(
  page: Page,
  placeUrl: string,
  maxReviews: number = 20
): Promise<Review[]> {

  console.log(`⭐ Crawl reviews: ${placeUrl}`);

  const reviews: Review[] = [];

  try {
    // 1. Navigate to place
    await page.goto(placeUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(3000);

    // 2. Click tab "Reviews"
    const reviewTab = page.locator('button[role="tab"]').filter({
      has: page.locator('text=/Reviews|Đánh giá|review/i'),
    });

    const tabCount = await reviewTab.count();
    if (tabCount === 0) {
      // Fallback: try aria-label
      const altTab = page.locator('button[aria-label*="Review"]');
      if ((await altTab.count()) > 0) {
        await altTab.first().click();
      } else {
        console.log("⚠️ No Reviews tab found");
        return [];
      }
    } else {
      await reviewTab.first().click();
    }

    await page.waitForTimeout(2500);

    // 3. Wait for reviews to load
    await page.waitForSelector("div.jftiEf", { timeout: 8000 }).catch(() => {});

    // 4. Scroll to load more reviews
    for (let round = 0; round < 5; round++) {
      const currentCount = await page.$$eval("div.jftiEf", (els) => els.length);
      if (currentCount >= maxReviews) break;

      // Scroll the reviews container
      await page.evaluate(() => {
        const containers = document.querySelectorAll("div.m6QErb.DxyBCb.kA9KIf.dS8AEf");
        const container = containers[containers.length - 1];
        if (container) container.scrollTop = container.scrollHeight;
      });

      await page.waitForTimeout(2000);

      const newCount = await page.$$eval("div.jftiEf", (els) => els.length);
      if (newCount === currentCount) break; // No more reviews loaded
    }

    // 5. Expand truncated reviews
    const expandBtns = await page.$$("button.w8nwRe");
    for (const btn of expandBtns) {
      await btn.click().catch(() => {});
    }
    await page.waitForTimeout(500);

    // 6. Extract reviews
    const reviewEls = await page.$$("div.jftiEf");

    for (let i = 0; i < Math.min(reviewEls.length, maxReviews); i++) {
      try {
        const data = await reviewEls[i].evaluate((el) => {
          // Reviewer name
          const nameEl = el.querySelector(".d4r55");
          const reviewer = nameEl?.textContent?.trim() || "Unknown";

          // Rating (stars) from aria-label
          const starsEl = el.querySelector("span.kvMYC") ||
                          el.querySelector('span[role="img"]');
          const starsLabel = starsEl?.getAttribute("aria-label") || "";
          const ratingMatch = starsLabel.match(/(\d+)/);
          const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;

          // Review text
          const textEl = el.querySelector(".wiI7pd");
          const text = textEl?.textContent?.trim() || null;

          // Date
          const dateEl = el.querySelector(".rsqaWe");
          const date = dateEl?.textContent?.trim() || null;

          // Photo count
          const photoEls = el.querySelectorAll("button.Tya61d");
          const photos = photoEls.length;

          return { reviewer, rating, text, date, photos };
        });

        reviews.push(data);
      } catch {
        continue;
      }
    }

    console.log(`⭐ Extracted ${reviews.length} reviews`);

  } catch (err: any) {
    console.log(`⚠️ Review crawl failed: ${err.message}`);
  }

  return reviews;
}
