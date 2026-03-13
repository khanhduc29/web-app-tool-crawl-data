// import { chromium, BrowserContext } from "playwright";

// export async function createBrowser(
//   lat?: number,
//   lng?: number
// ): Promise<BrowserContext> {

//   const MAX_RETRY = 3;

//   for (let i = 1; i <= MAX_RETRY; i++) {

//     try {

//       console.log(`🌐 Launch browser (attempt ${i})`);

//       const context = await chromium.launchPersistentContext(
//         "profiles/default",
//         {
//           headless: false,

//           viewport: {
//             width: 1280,
//             height: 800,
//           },

//           permissions: ["geolocation"],

//           geolocation:
//             lat && lng
//               ? { latitude: lat, longitude: lng }
//               : undefined,

//           locale: "en-US",

//           timezoneId: "UTC",

//           args: [
//             "--disable-blink-features=AutomationControlled",
//             "--no-sandbox",
//             "--disable-dev-shm-usage",
//           ],
//         }
//       );

//       return context;

//     } catch (err: any) {

//       console.error(
//         `❌ Browser launch failed (attempt ${i})`,
//         err.message
//       );

//       if (i === MAX_RETRY) {

//         console.log(
//           "⚠️ Fallback → launch temporary browser"
//         );

//         return chromium.launchPersistentContext(
//           "",
//           {
//             headless: false,
//           }
//         );

//       }

//       await new Promise((r) => setTimeout(r, 2000));

//     }

//   }

//   throw new Error("Cannot launch browser");

// }

import { chromium, BrowserContext } from "playwright";

let currentContext: BrowserContext | null = null;

export async function createBrowser(
  lat?: number,
  lng?: number
): Promise<BrowserContext> {

  const MAX_RETRY = 3;

  // nếu browser cũ còn mở → đóng trước
  if (currentContext) {
    try {
      console.log("🧹 Closing previous browser...");
      await currentContext.close();
    } catch {
      console.log("⚠️ Failed closing previous browser");
    }
    currentContext = null;
  }

  for (let i = 1; i <= MAX_RETRY; i++) {

    try {

      console.log(`🌐 Launch browser (attempt ${i})`);

      const context = await chromium.launchPersistentContext(
        "profiles/default",
        {
          headless: false,

          viewport: {
            width: 1280,
            height: 800,
          },

          permissions: ["geolocation"],

          geolocation:
            lat && lng
              ? { latitude: lat, longitude: lng }
              : undefined,

          locale: "en-US",

          timezoneId: "UTC",

          args: [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-dev-shm-usage",
          ],
        }
      );

      currentContext = context;

      return context;

    } catch (err: any) {

      console.error(
        `❌ Browser launch failed (attempt ${i})`,
        err.message
      );

      if (i === MAX_RETRY) {

        console.log(
          "⚠️ Fallback → launch temporary browser"
        );

        const context = await chromium.launchPersistentContext(
          "",
          {
            headless: false,
          }
        );

        currentContext = context;

        return context;

      }

      await new Promise((r) => setTimeout(r, 2000));

    }

  }

  throw new Error("Cannot launch browser");

}

export async function closeBrowser() {

  if (!currentContext) return;

  try {

    console.log("🧹 Closing idle browser...");

    await currentContext.close();

  } catch {

    console.log("⚠️ Browser close error");

  }

  currentContext = null;

}