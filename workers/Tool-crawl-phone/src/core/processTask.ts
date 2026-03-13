

// import { CrawlTask } from "../types/crawlTask";
// import { createBrowser } from "../config/browser";
// import { searchKeyword } from "./search";
// import { crawlWithAutoScroll } from "./crawlWithAutoScroll";
// import { updateTask } from "../api/crawlTask.api";
// import { crawlWebsiteContact } from "./crawlWebsiteContact";
// import { deepScanPlace } from "./deepScanPlace";
// import { delay } from "../utils/delay";

// export async function processTask(task: CrawlTask) {

//   console.log(`🚀 Start task ${task._id}`);
//   console.log(
//     `🧾 keyword="${task.keyword}", address="${task.address}"`
//   );

//   try {

//     /**
//      * 1️⃣ Open browser
//      */
//     const context = await createBrowser();
//     const page = await context.newPage();

//     /**
//      * 2️⃣ Search Google Maps
//      */
//     await searchKeyword(
//       page,
//       task.keyword,
//       task.address
//     );

//     /**
//      * 3️⃣ Crawl places
//      */
//     const results = await crawlWithAutoScroll(
//       page,
//       task.result_limit
//     );

//     /**
//      * 4️⃣ Crawl website
//      */
//     if (task.deep_scan_website) {

//       console.log("🌐 Deep scan website ENABLED");

//       for (const place of results) {

//         if (!place.website) continue;

//         const webPage = await context.newPage();

//         await delay(2000);

//         try {

//           place.socials = await crawlWebsiteContact(
//             webPage,
//             place.website
//           );

//         } catch {

//           console.log(
//             `⚠️ Website crawl failed: ${place.website}`
//           );

//         } finally {

//           await webPage.close();

//         }

//       }

//     }

//     /**
//      * 5️⃣ Deep scan Google Maps
//      */
//     if (task.deep_scan) {

//       console.log("🧠 Deep scan place detail ENABLED");

//       for (let i = 0; i < results.length; i++) {

//         const detailPage = await context.newPage();

//         try {

//           results[i] = await deepScanPlace(
//             detailPage,
//             results[i]
//           );

//         } catch {

//           console.log(
//             `⚠️ Deep scan failed: ${results[i].name}`
//           );

//         } finally {

//           await detailPage.close();

//         }

//       }

//     }

//     await context.close();

//     /**
//      * 6️⃣ Update task
//      */
//     await updateTask(task._id, {
//       status: "success",
//       result: results,
//     });

//     console.log(
//       `✅ Task ${task._id} success | result=${results.length}`
//     );

//   } catch (err: any) {

//     console.error(`❌ Task ${task._id} error`, err.message);

//     await updateTask(task._id, {
//       status: "error",
//       error_message: err.message,
//     });

//   }

// }

import { CrawlTask } from "../types/crawlTask";
import { createBrowser } from "../config/browser";
import { searchKeyword } from "./search";
import { crawlWithAutoScroll } from "./crawlWithAutoScroll";
// import { updateTask } from "../api/crawlTask.api";
import { crawlWebsiteContact } from "./crawlWebsiteContact";
import { deepScanPlace } from "./deepScanPlace";
import { delay } from "../utils/delay";
import fs from "fs";
import { updateTask } from "../api/crawlTask.api";

export async function processTask(task: CrawlTask) {

  console.log(`🚀 Start task ${task._id}`);
  console.log(
    `🧾 keyword="${task.keyword}", address="${task.address}"`
  );

  try {

    /**
     * 1️⃣ Open browser
     */
    const context = await createBrowser();
    const page = await context.newPage();

    /**
     * 2️⃣ Search Google Maps
     */
    await searchKeyword(
      page,
      task.keyword,
      task.address
    );

    /**
     * 3️⃣ Crawl places
     */
    const results = await crawlWithAutoScroll(
      page,
      task.result_limit
    );

    /**
     * 4️⃣ Crawl website
     */
    if (task.deep_scan_website) {

      console.log("🌐 Deep scan website ENABLED");

      for (let i = 0; i < results.length; i++) {

        let website = results[i].website;

        /**
         * Nếu chưa có website → click detail
         */
        if (!website) {

          try {

            const cards = await page.locator(
              'div[role="article"]'
            ).all();

            if (!cards[i]) continue;

            await cards[i].locator("a.hfpxzc").click();

            await page.waitForSelector(
              'a[data-item-id="authority"]',
              { timeout: 4000 }
            );

            website = await page
              .locator('a[data-item-id="authority"]')
              .first()
              .getAttribute("href");

            if (website) {
              results[i].website = website;
            }

          } catch {

            console.log(
              `⚠️ Cannot get website for ${results[i].name}`
            );

          }

        }

        /**
         * Nếu có website → crawl
         */
        if (website) {

          const webPage = await context.newPage();

          try {

            results[i].socials = await crawlWebsiteContact(
              webPage,
              website
            );

          } catch {

            console.log(
              `⚠️ Website crawl failed: ${website}`
            );

          } finally {

            await webPage.close();

          }

        }

      }

    }

    /**
     * 5️⃣ Deep scan Google Maps
     */
    if (task.deep_scan) {

      console.log("🧠 Deep scan place detail ENABLED");

      for (let i = 0; i < results.length; i++) {

        const detailPage = await context.newPage();

        try {

          results[i] = await deepScanPlace(
            detailPage,
            results[i]
          );

        } catch {

          console.log(
            `⚠️ Deep scan failed: ${results[i].name}`
          );

        } finally {

          await detailPage.close();

        }

      }

    }

    await context.close();

    /**
     * 6️⃣ Save result to JSON (for testing)
     */
    const filePath = `./test-result-${task._id}.json`;

    fs.writeFileSync(
      filePath,
      JSON.stringify(results, null, 2),
      "utf-8"
    );

    console.log(`💾 Saved result to ${filePath}`);

    /**
     * 7️⃣ Update task (disabled for testing)
     */
    await updateTask(task._id, {
      status: "success",
      result: results,
    });

    console.log(
      `✅ Task ${task._id} success | result=${results.length}`
    );

  } catch (err: any) {

    console.error(`❌ Task ${task._id} error`, err.message);

    /**
     * Update task (disabled for testing)
     */
    await updateTask(task._id, {
      status: "error",
      error_message: err.message,
    });

  }

}