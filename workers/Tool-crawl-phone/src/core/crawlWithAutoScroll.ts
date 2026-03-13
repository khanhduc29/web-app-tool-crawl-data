import { Page, ElementHandle } from "playwright";
import { Place } from "../types/place";
import { extractPlaceFromCard } from "./extractFromCard";

/**
 * Crawl Google Maps LIST (CARD ONLY)
 * - KHÔNG click
 * - KHÔNG đọc panel
 * - KHÔNG phụ thuộc layout
 */
export async function crawlWithAutoScroll(
  page: Page,
  limit: number
): Promise<Place[]> {
  const results: Place[] = [];
  const seenUrls = new Set<string>();

  let stuckRounds = 0;

  while (results.length < limit) {
    console.log(`🔄 Loop | current=${results.length}`);

    // ⏳ chờ feed load
    await page.waitForSelector('div[role="feed"]', {
      timeout: 20000,
    });

    const links = await page.$$('a.hfpxzc');

    let newFoundThisRound = 0;

    for (const link of links) {
      if (results.length >= limit) break;

      try {
        const href = await link.getAttribute("href");
        if (!href || seenUrls.has(href)) continue;

        await link.scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);

        /**
         * 🔥 LẤY CARD CHA (div[role="article"])
         * Không phụ thuộc class random
         */
        const card = await link.evaluateHandle((el) =>
          el.closest('div[role="article"]')
        ) as ElementHandle<Element> | null;

        if (!card) continue;

        /**
         * 🔥 Extract semantic từ CARD
         */
        const place = await extractPlaceFromCard(card);
        if (!place?.name) continue;

        place.url = href;

        results.push(place);
        seenUrls.add(href);
        newFoundThisRound++;

        console.log(`✅ ${results.length}. ${place.name}`);
      } catch {
        continue;
      }
    }

    // 📜 scroll để load thêm batch mới
    await page.evaluate(() => {
      const feed = document.querySelector('div[role="feed"]');
      if (feed) feed.scrollTop = feed.scrollHeight;
    });

    await page.waitForTimeout(800);

    // 🧠 detect stuck
    if (newFoundThisRound === 0) {
      stuckRounds++;
      console.log(`⚠️ No new data (stuck=${stuckRounds})`);
    } else {
      stuckRounds = 0;
    }

    if (stuckRounds >= 2) {
      console.log("🛑 No more data, stop crawling");
      break;
    }
  }

  return results;
}