
// import { Page } from "playwright";
// import { SocialLinks } from "../types/social";

// const SOCIAL_PATTERNS = {
//   facebook: /facebook\.com\/[^\/\s]+/i,
//   instagram: /instagram\.com\/[^\/\s]+/i,
//   threads: /threads\.net\/@[^\/\s]+/i,
//   tiktok: /tiktok\.com\/@[^\/\s]+/i,
//   youtube: /(youtube\.com\/|youtu\.be\/)/i,
//   twitter: /(twitter\.com|x\.com)\/[^\/\s]+/i,
//   pinterest: /pinterest\.com\/[^\/\s]+/i,
//   linkedin: /linkedin\.com\/(company|in)\/[^\/\s]+/i,
//   zalo: /(zalo\.me|oa\.zalo\.me)\/[^\/\s]+/i,
//   telegram: /(t\.me|telegram\.me)\/[^\/\s]+/i,
// };

// const EMAIL_REGEX =
//   /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// function normalizeUrl(url: string): string | null {
//   if (!url) return null;
//   if (url.startsWith("//")) return "https:" + url;
//   if (
//     url.startsWith("/") ||
//     url.startsWith("mailto:") ||
//     url.startsWith("tel:") ||
//     url.startsWith("javascript:")
//   )
//     return null;

//   return url.trim();
// }

// export async function crawlWebsiteContact(
//   page: Page,
//   website: string
// ): Promise<SocialLinks & { emails?: string[] }> {
//   console.log(`🌐 Crawl website: ${website}`);

//   const socials: SocialLinks & { emails?: string[] } = {};

//   await page.goto(website, {
//     waitUntil: "domcontentloaded",
//     timeout: 30000,
//   });

//   // 🔥 Scroll để footer render
//   await page.evaluate(async () => {
//     await new Promise<void>((resolve) => {
//       let total = 0;
//       const step = 400;

//       const timer = setInterval(() => {
//         window.scrollBy(0, step);
//         total += step;

//         if (total >= document.body.scrollHeight) {
//           clearInterval(timer);
//           resolve();
//         }
//       }, 200);
//     });
//   });

//   await page.waitForTimeout(1500);

//   /**
//    * =====================
//    * 1️⃣ LẤY EMAIL TỪ TEXT
//    * =====================
//    */
//   const pageText = await page.evaluate(() =>
//     document.body.innerText || ""
//   );

//   const emails = Array.from(
//     new Set(pageText.match(EMAIL_REGEX) || [])
//   );

//   if (emails.length > 0) {
//     socials.emails = emails;
//   }

//   /**
//    * =====================
//    * 2️⃣ LẤY SOCIAL LINKS
//    * =====================
//    */
//   const footerLinks = await page.$$eval(
//     "footer a[href]",
//     (els) => els.map((el) => el.getAttribute("href") || "")
//   );

//   const allLinks =
//     footerLinks.length > 0
//       ? footerLinks
//       : await page.$$eval("a[href]", (els) =>
//           els.map((el) => el.getAttribute("href") || "")
//         );

//   for (const link of allLinks) {
//     const url = normalizeUrl(link);
//     if (!url) continue;

//     if (!socials.facebook && SOCIAL_PATTERNS.facebook.test(url))
//       socials.facebook = url;

//     if (!socials.instagram && SOCIAL_PATTERNS.instagram.test(url))
//       socials.instagram = url;

//     if (!socials.threads && SOCIAL_PATTERNS.threads.test(url))
//       socials.threads = url;

//     if (!socials.tiktok && SOCIAL_PATTERNS.tiktok.test(url))
//       socials.tiktok = url;

//     if (!socials.youtube && SOCIAL_PATTERNS.youtube.test(url))
//       socials.youtube = url;

//     if (!socials.twitter && SOCIAL_PATTERNS.twitter.test(url))
//       socials.twitter = url;

//     if (!socials.pinterest && SOCIAL_PATTERNS.pinterest.test(url))
//       socials.pinterest = url;

//     if (!socials.linkedin && SOCIAL_PATTERNS.linkedin.test(url))
//       socials.linkedin = url;

//     if (!socials.zalo && SOCIAL_PATTERNS.zalo.test(url))
//       socials.zalo = url;

//     if (!socials.telegram && SOCIAL_PATTERNS.telegram.test(url))
//       socials.telegram = url;
//   }

//   return socials;
// }

import { Page } from "playwright";
import { SocialLinks } from "../types/social";

const SOCIAL_PATTERNS = {
  facebook: /facebook\.com\/[^\/\s]+/i,
  instagram: /instagram\.com\/[^\/\s]+/i,
  threads: /threads\.net\/@[^\/\s]+/i,
  tiktok: /tiktok\.com\/@[^\/\s]+/i,
  youtube: /(youtube\.com\/|youtu\.be\/)/i,
  twitter: /(twitter\.com|x\.com)\/[^\/\s]+/i,
  pinterest: /pinterest\.com\/[^\/\s]+/i,
  linkedin: /linkedin\.com\/(company|in)\/[^\/\s]+/i,
  zalo: /(zalo\.me|oa\.zalo\.me)\/[^\/\s]+/i,
  telegram: /(t\.me|telegram\.me)\/[^\/\s]+/i,
};

const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function normalizeUrl(url: string): string | null {
  if (!url) return null;

  if (url.startsWith("//")) return "https:" + url;

  if (
    url.startsWith("/") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("javascript:")
  )
    return null;

  return url.trim();
}

async function extractSocial(page: Page) {

  const socials: SocialLinks & { emails?: string[] } = {};

  /**
   * EMAIL
   */
  const pageText = await page.evaluate(() =>
    document.body.innerText || ""
  );

  const emails = Array.from(
    new Set(pageText.match(EMAIL_REGEX) || [])
  );

  if (emails.length > 0) socials.emails = emails;

  /**
   * SOCIAL LINKS
   */
  const footerLinks = await page.$$eval(
    "footer a[href]",
    (els) => els.map((el) => el.getAttribute("href") || "")
  );

  const allLinks =
    footerLinks.length > 0
      ? footerLinks
      : await page.$$eval("a[href]", (els) =>
          els.map((el) => el.getAttribute("href") || "")
        );

  for (const link of allLinks) {

    const url = normalizeUrl(link);
    if (!url) continue;

    if (!socials.facebook && SOCIAL_PATTERNS.facebook.test(url))
      socials.facebook = url;

    if (!socials.instagram && SOCIAL_PATTERNS.instagram.test(url))
      socials.instagram = url;

    if (!socials.threads && SOCIAL_PATTERNS.threads.test(url))
      socials.threads = url;

    if (!socials.tiktok && SOCIAL_PATTERNS.tiktok.test(url))
      socials.tiktok = url;

    if (!socials.youtube && SOCIAL_PATTERNS.youtube.test(url))
      socials.youtube = url;

    if (!socials.twitter && SOCIAL_PATTERNS.twitter.test(url))
      socials.twitter = url;

    if (!socials.pinterest && SOCIAL_PATTERNS.pinterest.test(url))
      socials.pinterest = url;

    if (!socials.linkedin && SOCIAL_PATTERNS.linkedin.test(url))
      socials.linkedin = url;

    if (!socials.zalo && SOCIAL_PATTERNS.zalo.test(url))
      socials.zalo = url;

    if (!socials.telegram && SOCIAL_PATTERNS.telegram.test(url))
      socials.telegram = url;

  }

  return socials;
}

export async function crawlWebsiteContact(
  page: Page,
  website: string
): Promise<SocialLinks & { emails?: string[] }> {

  console.log(`🌐 Crawl website: ${website}`);

  let socials: SocialLinks & { emails?: string[] } = {};

  /**
   * ======================
   * 1️⃣ TRY CONTACT PAGE
   * ======================
   */

  const contactUrls = [
    `${website}/contact`,
    `${website}/contact-us`,
    `${website}/lien-he`,
  ];

  for (const url of contactUrls) {

    try {

      console.log(`🔎 Try contact page: ${url}`);

      const res = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      if (!res || res.status() >= 400) continue;

      await page.waitForTimeout(1000);

      socials = await extractSocial(page);

      if (
        Object.keys(socials).length > 0
      ) {
        console.log("✅ Found socials in contact page");
        return socials;
      }

    } catch {
      console.log(`⚠️ Contact page failed: ${url}`);
    }

  }

  /**
   * ======================
   * 2️⃣ FALLBACK HOMEPAGE
   * ======================
   */

  console.log("🔁 Fallback crawl homepage footer");

  await page.goto(website, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  // scroll footer
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {

      let total = 0;
      const step = 400;

      const timer = setInterval(() => {

        window.scrollBy(0, step);
        total += step;

        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }

      }, 200);

    });
  });

  await page.waitForTimeout(1500);

  socials = await extractSocial(page);

  return socials;
}