import asyncio
import json
from core.browser import create_browser
from core.logger import setup_logger
from api.tiktok_api import fetch_pending_task, update_task_status
from dispatch.scan_dispatcher import dispatch_scan

logger = setup_logger()
SESSION_FILE = "tiktok_session.json"

CRAWL_TIMEOUT = 15 * 60      # 15 phút / task
POLL_INTERVAL = 50           # 50 giây kiểm tra 1 lần


async def main():
    logger.info("🚀 TIKTOK CRAWLER WORKER START (LOOP MODE)")

    # 🔹 browser objects
    playwright = None
    browser = None
    context = None

    try:
        while True:

            task_id = None
            page = None

            try:
                task = fetch_pending_task()

                if not task:
                    logger.info("😴 No pending task — sleep 50s")
                    await asyncio.sleep(POLL_INTERVAL)
                    continue

                task_id = task.get("_id")
                scan_type = task.get("scan_type")
                input_data = task.get("input")

                if not task_id or not scan_type or not input_data:
                    raise ValueError(f"❌ Invalid task format: {task}")

                logger.info(f"📥 GOT TASK {task_id} | {scan_type}")
                logger.info(json.dumps(input_data, indent=2, ensure_ascii=False))

                update_task_status(task_id, "running")

                # 🔥 CHỈ MỞ BROWSER KHI CÓ TASK
                if not browser:
                    logger.info("🌐 Launch browser for task")
                    playwright, browser, context, _ = await create_browser(
                        headless=False,
                        session_file=SESSION_FILE
                    )

                # ✅ TẠO PAGE MỚI CHO TASK
                page = await context.new_page()

                logger.info("🧠 START CRAWL")

                result = await asyncio.wait_for(
                    dispatch_scan(scan_type, page, input_data),
                    timeout=CRAWL_TIMEOUT
                )

                logger.info("🎉 END CRAWL")

                update_task_status(task_id, "success", result)
                logger.info("✅ TASK DONE")

            except asyncio.TimeoutError:
                logger.error("⏰ TASK TIMEOUT")
                if task_id:
                    update_task_status(task_id, "error", {"error": "timeout"})

            except Exception as e:
                logger.exception(f"❌ TASK FAILED: {e}")
                if task_id:
                    update_task_status(task_id, "error", {"error": str(e)})

            finally:
                # ✅ ĐÓNG PAGE SAU MỖI TASK
                if page:
                    try:
                        await page.close()
                    except Exception:
                        pass

                # 🔥 ĐÓNG BROWSER SAU TASK (giải phóng RAM)
                if context:
                    try:
                        await context.close()
                    except Exception:
                        pass

                if browser:
                    try:
                        await browser.close()
                    except Exception:
                        pass

                if playwright:
                    try:
                        await playwright.stop()
                    except Exception:
                        pass

                browser = None
                context = None
                playwright = None

                # nghỉ nhịp ngắn trước vòng tiếp theo
                await asyncio.sleep(2)

    finally:
        logger.info("🛑 WORKER STOP")


if __name__ == "__main__":
    asyncio.run(main())